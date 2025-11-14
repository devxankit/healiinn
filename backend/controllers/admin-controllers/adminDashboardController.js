const mongoose = require('mongoose');
const asyncHandler = require('../../middleware/asyncHandler');
const {
  ROLES,
  APPROVAL_STATUS,
  SESSION_STATUS,
  TOKEN_STATUS,
  LAB_LEAD_STATUS,
  PHARMACY_LEAD_STATUS,
} = require('../../utils/constants');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const Laboratory = require('../../models/Laboratory');
const Pharmacy = require('../../models/Pharmacy');
const Appointment = require('../../models/Appointment');
const Consultation = require('../../models/Consultation');
const Prescription = require('../../models/Prescription');
const LabLead = require('../../models/LabLead');
const Notification = require('../../models/Notification');
const ClinicSession = require('../../models/ClinicSession');
const SessionToken = require('../../models/SessionToken');
const PharmacyLead = require('../../models/PharmacyLead');
const WalletTransaction = require('../../models/WalletTransaction');
const AdminWalletTransaction = require('../../models/AdminWalletTransaction');
const {
  getAdminWalletOverview,
} = require('../../services/walletService');

const toObjectId = (value) =>
  typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value;

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const startOfWeek = (date) => {
  const d = startOfDay(date);
  const day = d.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = day === 0 ? 6 : day - 1; // treat Monday as first day
  return addDays(d, -diff);
};

const startOfMonth = (date) => {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
};

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const startOfYear = (date) => {
  const d = startOfDay(date);
  d.setMonth(0, 1);
  return d;
};

const addYears = (date, years) => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
};

const formatMonthKey = (date) =>
  new Date(date).toISOString().slice(0, 7); // YYYY-MM

const buildRangeCounts = async ({ Model, dateField, match = {}, ranges }) => {
  const [day, week, month, year] = await Promise.all(
    ranges.map(([start, end]) =>
      Model.countDocuments({
        ...match,
        [dateField]: { $gte: start, $lt: end },
      })
    )
  );

  return {
    today: day,
    week,
    month,
    year,
  };
};

const aggregateMonthlyCounts = async ({ Model, match = {}, dateField, start }) => {
  const pipeline = [
    {
      $match: {
        ...match,
        [dateField]: { $gte: start },
      },
    },
    {
      $project: {
        month: {
          $dateToString: {
            format: '%Y-%m',
            date: `$${dateField}`,
          },
        },
      },
    },
    {
      $group: {
        _id: '$month',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ];

  const data = await Model.aggregate(pipeline);
  return data.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});
};

const mergeMonthlySeries = (months, series) =>
  months.map((month) => series[month] || 0);

const computeRevenueBreakdown = async (start, end) => {
  const [appointmentAgg] = await WalletTransaction.aggregate([
    {
      $match: {
        creditedAt: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: null,
        commissionRevenue: { $sum: '$commissionAmount' },
      },
    },
  ]);

  const [subscriptionAgg] = await AdminWalletTransaction.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: null,
        subscriptionRevenue: { $sum: '$amount' },
      },
    },
  ]);

  const commissionRevenue = appointmentAgg?.commissionRevenue || 0;
  const subscriptionRevenue = subscriptionAgg?.subscriptionRevenue || 0;

  return {
    appointmentRevenue: commissionRevenue,
    subscriptionRevenue,
    total: commissionRevenue + subscriptionRevenue,
  };
};

exports.getDashboardOverview = asyncHandler(async (req, res) => {
  const now = new Date();

  const dayStart = startOfDay(now);
  const dayEnd = addDays(dayStart, 1);

  const weekStart = startOfWeek(now);
  const weekEnd = addDays(weekStart, 7);

  const monthStart = startOfMonth(now);
  const monthEnd = addMonths(monthStart, 1);

  const yearStart = startOfYear(now);
  const yearEnd = addYears(yearStart, 1);

  const timeRanges = [
    [dayStart, dayEnd],
    [weekStart, weekEnd],
    [monthStart, monthEnd],
    [yearStart, yearEnd],
  ];

    const [
    totalPatients,
    totalDoctors,
    totalLaboratories,
    totalPharmacies,
    activeDoctors,
    pendingDoctorVerifications,
    pendingLabVerifications,
    pendingPharmacyVerifications,
    appointmentCounts,
    reportCounts,
    prescriptionCounts,
    distinctConsultedPatients,
    upcomingAppointmentsRaw,
    recentReportsRaw,
    notificationsRaw,
      walletOverview,
    ] = await Promise.all([
    Patient.countDocuments(),
    Doctor.countDocuments(),
    Laboratory.countDocuments(),
    Pharmacy.countDocuments(),
    Doctor.countDocuments({ status: 'approved', isActive: true }),
    Doctor.countDocuments({ status: 'pending' }),
    Laboratory.countDocuments({ status: 'pending' }),
    Pharmacy.countDocuments({ status: 'pending' }),
    buildRangeCounts({
      Model: Appointment,
      dateField: 'scheduledFor',
      match: { status: { $nin: ['cancelled', 'no_show'] } },
      ranges: timeRanges,
    }),
    buildRangeCounts({
      Model: LabLead,
      dateField: 'reportDetails.uploadedAt',
      match: { 'reportDetails.uploadedAt': { $exists: true } },
      ranges: timeRanges,
    }),
    buildRangeCounts({
      Model: Prescription,
      dateField: 'issuedAt',
      ranges: timeRanges,
    }),
    Consultation.distinct('patient', {
      doctor: { $exists: true },
      status: 'completed',
    }),
    Appointment.find({
      status: { $nin: ['cancelled', 'no_show'] },
      scheduledFor: { $gte: now },
    })
      .populate('patient', 'firstName lastName gender phone email')
      .populate('doctor', 'firstName lastName')
      .populate('clinic', 'name address')
      .sort({ scheduledFor: 1 })
      .limit(10)
      .lean(),
    LabLead.find({
      'reportDetails.uploadedAt': { $exists: true },
    })
      .populate('patient', 'firstName lastName gender phone email')
      .populate('doctor', 'firstName lastName')
      .populate('preferredLaboratories', 'labName phone email address')
      .sort({ 'reportDetails.uploadedAt': -1 })
      .limit(10)
      .lean(),
    Notification.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
      getAdminWalletOverview(),
  ]);

  const upcomingAppointments = upcomingAppointmentsRaw.map((item) => ({
    id: item._id,
    scheduledFor: item.scheduledFor,
    status: item.status,
    type: item.type || null,
    reason: item.reason || null,
    patient: item.patient
      ? {
          id: item.patient._id,
          firstName: item.patient.firstName,
          lastName: item.patient.lastName,
          phone: item.patient.phone || null,
        }
      : null,
    doctor: item.doctor
      ? {
          id: item.doctor._id,
          firstName: item.doctor.firstName,
          lastName: item.doctor.lastName,
        }
      : null,
    clinic: item.clinic
      ? {
          id: item.clinic._id,
          name: item.clinic.name,
          address: item.clinic.address || null,
        }
      : null,
  }));

  const recentReports = recentReportsRaw.map((item) => ({
    id: item._id,
    uploadedAt: item.reportDetails?.uploadedAt || null,
    fileUrl: item.reportDetails?.fileUrl || null,
    fileName: item.reportDetails?.fileName || null,
    mimeType: item.reportDetails?.mimeType || null,
    patient: item.patient
      ? {
          id: item.patient._id,
          firstName: item.patient.firstName,
          lastName: item.patient.lastName,
        }
      : null,
    doctor: item.doctor
      ? {
          id: item.doctor._id,
          firstName: item.doctor.firstName,
          lastName: item.doctor.lastName,
        }
      : null,
    laboratories: (item.preferredLaboratories || []).map((lab) => ({
      id: lab._id,
      name: lab.labName,
      phone: lab.phone || null,
      email: lab.email || null,
      address: lab.address || null,
    })),
  }));

  const recentActivities = notificationsRaw.slice(0, 10).map((item) => ({
    id: item._id,
    title: item.title,
    message: item.message,
    type: item.type || null,
    priority: item.priority || 'normal',
    createdAt: item.createdAt,
  }));

  const systemNotifications = notificationsRaw
    .filter(
      (item) =>
        item.priority === 'high' ||
        ['approval', 'warning', 'expiration'].includes(item.type)
    )
    .slice(0, 10)
    .map((item) => ({
      id: item._id,
      title: item.title,
      message: item.message,
      type: item.type || null,
      priority: item.priority || 'normal',
      createdAt: item.createdAt,
    }));

  const months = [];
  const startForCharts = startOfMonth(addMonths(now, -11));
  for (let i = 0; i < 12; i += 1) {
    months.push(formatMonthKey(addMonths(startForCharts, i)));
  }

  const [
    patientGrowth,
    doctorGrowth,
    laboratoryGrowth,
    pharmacyGrowth,
    appointmentTrendSeries,
    prescriptionTrendSeries,
  ] = await Promise.all([
    aggregateMonthlyCounts({
      Model: Patient,
      dateField: 'createdAt',
      start: startForCharts,
    }),
    aggregateMonthlyCounts({
      Model: Doctor,
      dateField: 'createdAt',
      start: startForCharts,
    }),
    aggregateMonthlyCounts({
      Model: Laboratory,
      dateField: 'createdAt',
      start: startForCharts,
    }),
    aggregateMonthlyCounts({
      Model: Pharmacy,
      dateField: 'createdAt',
      start: startForCharts,
    }),
    aggregateMonthlyCounts({
      Model: Appointment,
      dateField: 'scheduledFor',
      start: startForCharts,
      match: { status: { $nin: ['cancelled', 'no_show'] } },
    }),
    aggregateMonthlyCounts({
      Model: Prescription,
      dateField: 'issuedAt',
      start: startForCharts,
    }),
  ]);

  const [
    totalVerifiedDoctors,
    liveClinicSessions,
    tokensCompletedToday,
    tokensIssuedToday,
    tokensNoShowToday,
    waitTimeAggregation,
    repeatPatientAggregation,
    bookingsToday,
    cancellationsToday,
    labOrdersCompletedTotal,
    labOrdersCompletedToday,
    pharmacyOrdersCompletedTotal,
    pharmacyOrdersCompletedToday,
    revenueTodayBreakdown,
    revenueWeekBreakdown,
    revenueMonthBreakdown,
    revenueYearBreakdown,
  ] = await Promise.all([
    Doctor.countDocuments({ status: APPROVAL_STATUS.APPROVED }),
    ClinicSession.countDocuments({ status: SESSION_STATUS.LIVE }),
    SessionToken.countDocuments({
      status: TOKEN_STATUS.COMPLETED,
      completedAt: { $gte: dayStart, $lt: dayEnd },
    }),
    SessionToken.countDocuments({
      createdAt: { $gte: dayStart, $lt: dayEnd },
    }),
    SessionToken.countDocuments({
      status: TOKEN_STATUS.NO_SHOW,
      noShowAt: { $gte: dayStart, $lt: dayEnd },
    }),
    SessionToken.aggregate([
      {
        $match: {
          visitedAt: { $gte: dayStart, $lt: dayEnd },
          calledAt: { $ne: null },
        },
      },
      {
        $project: {
          waitMillis: { $subtract: ['$visitedAt', '$calledAt'] },
          etaDelta: {
            $cond: [
              { $and: ['$eta', '$visitedAt'] },
              { $abs: { $subtract: ['$visitedAt', '$eta'] } },
              null,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgWaitMillis: { $avg: '$waitMillis' },
          withinAccuracy: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$etaDelta', null] },
                    { $lte: ['$etaDelta', 10 * 60 * 1000] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          etaSamples: {
            $sum: {
              $cond: [{ $ne: ['$etaDelta', null] }, 1, 0],
            },
          },
        },
      },
    ]),
    Appointment.aggregate([
      {
        $match: {
          patient: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$patient',
          totalAppointments: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          repeat: {
            $sum: {
              $cond: [{ $gt: ['$totalAppointments', 1] }, 1, 0],
            },
          },
        },
      },
    ]),
    Appointment.countDocuments({
      scheduledFor: { $gte: dayStart, $lt: dayEnd },
      status: { $nin: ['cancelled', 'no_show'] },
    }),
    Appointment.countDocuments({
      status: 'cancelled',
      updatedAt: { $gte: dayStart, $lt: dayEnd },
    }),
    LabLead.countDocuments({ status: LAB_LEAD_STATUS.COMPLETED }),
    LabLead.countDocuments({
      status: LAB_LEAD_STATUS.COMPLETED,
      updatedAt: { $gte: dayStart, $lt: dayEnd },
    }),
    PharmacyLead.countDocuments({ status: PHARMACY_LEAD_STATUS.COMPLETED }),
    PharmacyLead.countDocuments({
      status: PHARMACY_LEAD_STATUS.COMPLETED,
      updatedAt: { $gte: dayStart, $lt: dayEnd },
    }),
    computeRevenueBreakdown(dayStart, dayEnd),
    computeRevenueBreakdown(weekStart, weekEnd),
    computeRevenueBreakdown(monthStart, monthEnd),
    computeRevenueBreakdown(yearStart, yearEnd),
  ]);

  const waitStats = waitTimeAggregation[0] || {
    avgWaitMillis: 0,
    withinAccuracy: 0,
    etaSamples: 0,
  };

  const repeatStats = repeatPatientAggregation[0] || {
    total: 0,
    repeat: 0,
  };

  const avgWaitTimeMinutes = waitStats.avgWaitMillis
    ? waitStats.avgWaitMillis / 60000
    : 0;
  const etaAccuracyPercent =
    waitStats.etaSamples > 0
      ? (waitStats.withinAccuracy / waitStats.etaSamples) * 100
      : 0;
  const repeatPatientPercentage =
    repeatStats.total > 0 ? (repeatStats.repeat / repeatStats.total) * 100 : 0;
  const noShowRate =
    tokensIssuedToday > 0
      ? (tokensNoShowToday / tokensIssuedToday) * 100
      : 0;

  const topSpecializations = await Doctor.aggregate([
    { $match: { specialization: { $exists: true, $ne: '' }, status: 'approved' } },
    {
      $group: {
        _id: '$specialization',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  const [activeLabs, inactiveLabs, activePharmacies, inactivePharmacies] =
    await Promise.all([
      Laboratory.countDocuments({ isActive: true }),
      Laboratory.countDocuments({ isActive: false }),
      Pharmacy.countDocuments({ isActive: true }),
      Pharmacy.countDocuments({ isActive: false }),
    ]);

  const [activeDoctorsCount, inactiveDoctorsCount] = await Promise.all([
    Doctor.countDocuments({ isActive: true }),
    Doctor.countDocuments({ isActive: false }),
  ]);

  const prescriptionBreakdown = {
    today: prescriptionCounts.today,
    week: prescriptionCounts.week,
    month: prescriptionCounts.month,
    year: prescriptionCounts.year,
  };

  res.json({
    success: true,
    overview: {
      totalUsers: {
        patients: totalPatients,
        doctors: totalDoctors,
        laboratories: totalLaboratories,
        pharmacies: totalPharmacies,
        total:
          totalPatients + totalDoctors + totalLaboratories + totalPharmacies,
      },
      activeDoctors,
      pendingVerifications: {
        doctors: pendingDoctorVerifications,
        laboratories: pendingLabVerifications,
        pharmacies: pendingPharmacyVerifications,
        total:
          pendingDoctorVerifications +
          pendingLabVerifications +
          pendingPharmacyVerifications,
      },
      appointments: appointmentCounts,
      reportsUploaded: reportCounts,
      prescriptionsGenerated: prescriptionCounts,
      totalPatientsConsulted: distinctConsultedPatients.length,
    },
    wallet: walletOverview,
    upcomingAppointments,
    recentReports,
    recentActivities,
    systemNotifications,
    charts: {
      userGrowth: months.map((month) => ({
        month,
        patients: patientGrowth[month] || 0,
        doctors: doctorGrowth[month] || 0,
        laboratories: laboratoryGrowth[month] || 0,
        pharmacies: pharmacyGrowth[month] || 0,
      })),
      appointmentsTrend: months.map((month) => ({
        month,
        appointments: appointmentTrendSeries[month] || 0,
        prescriptions: prescriptionTrendSeries[month] || 0,
      })),
      topSpecializations: topSpecializations.map((entry) => ({
        specialization: entry._id,
        count: entry.count,
      })),
      prescriptionBreakdown,
      activeVsInactive: {
        doctors: {
          active: activeDoctorsCount,
          inactive: inactiveDoctorsCount,
        },
        laboratories: {
          active: activeLabs,
          inactive: inactiveLabs,
        },
        pharmacies: {
          active: activePharmacies,
          inactive: inactivePharmacies,
        },
      },
    },
    doctorMetrics: {
      totalVerified: totalVerifiedDoctors,
      pendingVerifications: pendingDoctorVerifications,
      activeSessions: liveClinicSessions,
      tokensServedToday: tokensCompletedToday,
      noShowRate: Number(noShowRate.toFixed(2)),
    },
    patientMetrics: {
      bookingsToday,
      cancellationsToday,
      avgWaitTimeMinutes: Number(avgWaitTimeMinutes.toFixed(2)),
      etaAccuracyPercent: Number(etaAccuracyPercent.toFixed(2)),
      repeatPatientPercentage: Number(repeatPatientPercentage.toFixed(2)),
    },
    labMarketplaceMetrics: {
      totalOrdersCompleted: labOrdersCompletedTotal,
      ordersCompletedToday: labOrdersCompletedToday,
    },
    pharmacyMarketplaceMetrics: {
      totalOrdersCompleted: pharmacyOrdersCompletedTotal,
      ordersCompletedToday: pharmacyOrdersCompletedToday,
    },
    financialMetrics: {
      revenue: {
        today: {
          total: Number(revenueTodayBreakdown.total.toFixed(2)),
          appointment: Number(
            revenueTodayBreakdown.appointmentRevenue.toFixed(2)
          ),
          subscription: Number(
            revenueTodayBreakdown.subscriptionRevenue.toFixed(2)
          ),
        },
        week: {
          total: Number(revenueWeekBreakdown.total.toFixed(2)),
          appointment: Number(
            revenueWeekBreakdown.appointmentRevenue.toFixed(2)
          ),
          subscription: Number(
            revenueWeekBreakdown.subscriptionRevenue.toFixed(2)
          ),
        },
        month: {
          total: Number(revenueMonthBreakdown.total.toFixed(2)),
          appointment: Number(
            revenueMonthBreakdown.appointmentRevenue.toFixed(2)
          ),
          subscription: Number(
            revenueMonthBreakdown.subscriptionRevenue.toFixed(2)
          ),
        },
        year: {
          total: Number(revenueYearBreakdown.total.toFixed(2)),
          appointment: Number(
            revenueYearBreakdown.appointmentRevenue.toFixed(2)
          ),
          subscription: Number(
            revenueYearBreakdown.subscriptionRevenue.toFixed(2)
          ),
        },
      },
    },
  });
});


