const mongoose = require('mongoose');
const asyncHandler = require('../../middleware/asyncHandler');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Appointment = require('../../models/Appointment');
const Consultation = require('../../models/Consultation');
const Prescription = require('../../models/Prescription');
const LabLead = require('../../models/LabLead');
const Notification = require('../../models/Notification');
const Patient = require('../../models/Patient');
const WalletTransaction = require('../../models/WalletTransaction');
const { ROLES, CONSULTATION_STATUS, getCommissionRateByRole } = require('../../utils/constants');
const { getDoctorWalletSummary } = require('../../services/walletService');
const { getCache, setCache, generateCacheKey } = require('../../utils/cache');

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

const mapPatientSummary = (patient) =>
  patient
    ? {
        id: patient._id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        gender: patient.gender || null,
        phone: patient.phone || null,
        email: patient.email || null,
      }
    : null;

const mapClinicSummary = (clinic) =>
  clinic
    ? {
        id: clinic._id,
        name: clinic.name,
        address: clinic.address || null,
      }
    : null;

exports.getDashboardOverview = asyncHandler(async (req, res) => {
  const doctorId = toObjectId(req.auth.id);
  const cacheKey = generateCacheKey('doctor:dashboard', { doctorId: doctorId.toString() });
  
  // Try to get from cache first
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  const now = new Date();

  const dayStart = startOfDay(now);
  const dayEnd = addDays(dayStart, 1);

  const monthStart = startOfMonth(now);
  const monthEnd = addMonths(monthStart, 1);

  const yearStart = startOfYear(now);
  const yearEnd = addYears(yearStart, 1);

  const appointmentBaseFilter = {
    doctor: doctorId,
    status: { $nin: ['cancelled', 'no_show'] },
  };

  const [
    dailyAppointments,
    monthlyAppointments,
    yearlyAppointments,
    distinctPatients,
    totalPrescriptions,
    upcomingAppointmentsRaw,
    recentReportsRaw,
    notificationsRaw,
    walletSummary,
  ] = await Promise.all([
    Appointment.countDocuments({
      ...appointmentBaseFilter,
      scheduledFor: { $gte: dayStart, $lt: dayEnd },
    }),
    Appointment.countDocuments({
      ...appointmentBaseFilter,
      scheduledFor: { $gte: monthStart, $lt: monthEnd },
    }),
    Appointment.countDocuments({
      ...appointmentBaseFilter,
      scheduledFor: { $gte: yearStart, $lt: yearEnd },
    }),
    Consultation.distinct('patient', {
      doctor: doctorId,
      status: CONSULTATION_STATUS.COMPLETED,
    }),
    Prescription.countDocuments({ doctor: doctorId }),
    Appointment.find({
      ...appointmentBaseFilter,
      scheduledFor: { $gte: now },
    })
      .populate('patient', 'firstName lastName gender phone email')
      .populate('clinic', 'name address')
      .sort({ scheduledFor: 1 })
      .limit(5)
      .lean(),
    LabLead.find({
      doctor: doctorId,
      'reportDetails.uploadedAt': { $exists: true },
    })
      .populate('patient', 'firstName lastName gender phone email')
      .populate('preferredLaboratories', 'labName phone email address')
      .sort({ 'reportDetails.uploadedAt': -1 })
      .limit(5)
      .lean(),
    Notification.find({
      'recipients.user': doctorId,
      'recipients.role': ROLES.DOCTOR,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    getDoctorWalletSummary(doctorId),
  ]);

  const upcomingAppointments = upcomingAppointmentsRaw.map((item) => ({
    id: item._id,
    scheduledFor: item.scheduledFor,
    status: item.status,
    reason: item.reason || null,
    type: item.type || null,
    patient: mapPatientSummary(item.patient),
    clinic: mapClinicSummary(item.clinic),
  }));

  const recentReports = recentReportsRaw.map((item) => {
    const labs = (item.preferredLaboratories || []).map((lab) => ({
      id: lab._id,
      name: lab.labName,
      phone: lab.phone || null,
      email: lab.email || null,
      address: lab.address || null,
    }));

    return {
      id: item._id,
      uploadedAt: item.reportDetails?.uploadedAt || null,
      fileUrl: item.reportDetails?.fileUrl || null,
      fileName: item.reportDetails?.fileName || null,
      mimeType: item.reportDetails?.mimeType || null,
      notes: item.reportDetails?.notes || null,
      patient: mapPatientSummary(item.patient),
      laboratories: labs,
    };
  });

  const notifications = notificationsRaw.map((item) => {
    const recipient = (item.recipients || []).find(
      (entry) =>
        entry.role === ROLES.DOCTOR &&
        entry.user &&
        entry.user.toString() === doctorId.toString()
    );

    return {
      id: item._id,
      title: item.title,
      message: item.message,
      type: item.type || null,
      priority: item.priority || 'normal',
      createdAt: item.createdAt,
      readAt: recipient?.readAt || null,
      data: item.data || null,
    };
  });

  const response = {
    success: true,
    metrics: {
      appointments: {
        daily: dailyAppointments,
        monthly: monthlyAppointments,
        yearly: yearlyAppointments,
      },
      patientsConsulted: distinctPatients.length,
      prescriptionsCreated: totalPrescriptions,
    },
    wallet: {
      ...walletSummary,
      commissionRate: getCommissionRateByRole(ROLES.DOCTOR),
    },
    upcomingAppointments,
    recentReports,
    notifications,
  };

  // Cache for 5 minutes (300 seconds)
  await setCache(cacheKey, response, 300);

  res.json(response);
});

// Detailed Analytics - Revenue Trends
exports.getRevenueTrends = asyncHandler(async (req, res) => {
  const doctorId = toObjectId(req.auth.id);
  const { period = 'monthly', from, to } = req.query;
  
  const cacheKey = generateCacheKey('doctor:revenue-trends', {
    doctorId: doctorId.toString(),
    period,
    from: from || '',
    to: to || '',
  });
  
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  let startDate, endDate;
  if (from && to) {
    startDate = new Date(from);
    endDate = new Date(to);
  } else {
    const now = new Date();
    if (period === 'daily') {
      startDate = addDays(now, -30);
      endDate = now;
    } else if (period === 'weekly') {
      startDate = addDays(now, -84); // 12 weeks
      endDate = now;
    } else if (period === 'monthly') {
      startDate = addMonths(now, -12);
      endDate = now;
    } else {
      startDate = addMonths(now, -12);
      endDate = now;
    }
  }

  const matchQuery = {
    $or: [
      { provider: doctorId, providerRole: ROLES.DOCTOR },
      { doctor: doctorId }, // Legacy support
    ],
    creditedAt: { $gte: startDate, $lte: endDate },
  };

  let groupBy;
  if (period === 'daily') {
    groupBy = {
      year: { $year: '$creditedAt' },
      month: { $month: '$creditedAt' },
      day: { $dayOfMonth: '$creditedAt' },
    };
  } else if (period === 'weekly') {
    groupBy = {
      year: { $year: '$creditedAt' },
      week: { $week: '$creditedAt' },
    };
  } else {
    groupBy = {
      year: { $year: '$creditedAt' },
      month: { $month: '$creditedAt' },
    };
  }

  const revenueTrends = await WalletTransaction.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: groupBy,
        totalGross: { $sum: '$grossAmount' },
        totalCommission: { $sum: '$commissionAmount' },
        totalNet: { $sum: '$netAmount' },
        transactionCount: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1, '_id.day': 1 } },
  ]);

  const response = {
    success: true,
    period,
    from: startDate,
    to: endDate,
    trends: revenueTrends.map((item) => ({
      date: period === 'daily'
        ? `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`
        : period === 'weekly'
        ? `${item._id.year}-W${String(item._id.week).padStart(2, '0')}`
        : `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      gross: item.totalGross,
      commission: item.totalCommission,
      net: item.totalNet,
      transactionCount: item.transactionCount,
    })),
  };

  // Cache for 10 minutes (600 seconds)
  await setCache(cacheKey, response, 600);

  res.json(response);
});

// Patient Growth Chart
exports.getPatientGrowth = asyncHandler(async (req, res) => {
  const doctorId = toObjectId(req.auth.id);
  const { period = 'monthly', from, to } = req.query;

  let startDate, endDate;
  if (from && to) {
    startDate = new Date(from);
    endDate = new Date(to);
  } else {
    const now = new Date();
    if (period === 'daily') {
      startDate = addDays(now, -30);
      endDate = now;
    } else if (period === 'weekly') {
      startDate = addDays(now, -84);
      endDate = now;
    } else {
      startDate = addMonths(now, -12);
      endDate = now;
    }
  }

  let groupBy;
  if (period === 'daily') {
    groupBy = {
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' },
      day: { $dayOfMonth: '$createdAt' },
    };
  } else if (period === 'weekly') {
    groupBy = {
      year: { $year: '$createdAt' },
      week: { $week: '$createdAt' },
    };
  } else {
    groupBy = {
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' },
    };
  }

  const patientGrowth = await Consultation.aggregate([
    {
      $match: {
        doctor: doctorId,
        status: CONSULTATION_STATUS.COMPLETED,
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          ...groupBy,
          patient: '$patient',
        },
      },
    },
    {
      $group: {
        _id: {
          year: '$_id.year',
          month: '$_id.month',
          week: '$_id.week',
          day: '$_id.day',
        },
        uniquePatients: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1, '_id.day': 1 } },
  ]);

  res.json({
    success: true,
    period,
    from: startDate,
    to: endDate,
    growth: patientGrowth.map((item) => ({
      date: period === 'daily'
        ? `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`
        : period === 'weekly'
        ? `${item._id.year}-W${String(item._id.week).padStart(2, '0')}`
        : `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      newPatients: item.uniquePatients,
    })),
  });
});

// Consultation Trends
exports.getConsultationTrends = asyncHandler(async (req, res) => {
  const doctorId = toObjectId(req.auth.id);
  const { period = 'monthly', from, to, status } = req.query;

  let startDate, endDate;
  if (from && to) {
    startDate = new Date(from);
    endDate = new Date(to);
  } else {
    const now = new Date();
    if (period === 'daily') {
      startDate = addDays(now, -30);
      endDate = now;
    } else if (period === 'weekly') {
      startDate = addDays(now, -84);
      endDate = now;
    } else {
      startDate = addMonths(now, -12);
      endDate = now;
    }
  }

  const matchCriteria = {
    doctor: doctorId,
    createdAt: { $gte: startDate, $lte: endDate },
  };

  if (status) {
    matchCriteria.status = status;
  }

  let groupBy;
  if (period === 'daily') {
    groupBy = {
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' },
      day: { $dayOfMonth: '$createdAt' },
    };
  } else if (period === 'weekly') {
    groupBy = {
      year: { $year: '$createdAt' },
      week: { $week: '$createdAt' },
    };
  } else {
    groupBy = {
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' },
    };
  }

  const trends = await Consultation.aggregate([
    { $match: matchCriteria },
    {
      $group: {
        _id: {
          ...groupBy,
          status: '$status',
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: {
          year: '$_id.year',
          month: '$_id.month',
          week: '$_id.week',
          day: '$_id.day',
        },
        statuses: {
          $push: {
            status: '$_id.status',
            count: '$count',
          },
        },
        total: { $sum: '$count' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1, '_id.day': 1 } },
  ]);

  res.json({
    success: true,
    period,
    from: startDate,
    to: endDate,
    trends: trends.map((item) => ({
      date: period === 'daily'
        ? `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`
        : period === 'weekly'
        ? `${item._id.year}-W${String(item._id.week).padStart(2, '0')}`
        : `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      total: item.total,
      byStatus: item.statuses.reduce((acc, s) => {
        acc[s.status] = s.count;
        return acc;
      }, {}),
    })),
  });
});

// Prescription Trends
exports.getPrescriptionTrends = asyncHandler(async (req, res) => {
  const doctorId = toObjectId(req.auth.id);
  const { period = 'monthly', from, to } = req.query;

  let startDate, endDate;
  if (from && to) {
    startDate = new Date(from);
    endDate = new Date(to);
  } else {
    const now = new Date();
    if (period === 'daily') {
      startDate = addDays(now, -30);
      endDate = now;
    } else if (period === 'weekly') {
      startDate = addDays(now, -84);
      endDate = now;
    } else {
      startDate = addMonths(now, -12);
      endDate = now;
    }
  }

  let groupBy;
  if (period === 'daily') {
    groupBy = {
      year: { $year: '$issuedAt' },
      month: { $month: '$issuedAt' },
      day: { $dayOfMonth: '$issuedAt' },
    };
  } else if (period === 'weekly') {
    groupBy = {
      year: { $year: '$issuedAt' },
      week: { $week: '$issuedAt' },
    };
  } else {
    groupBy = {
      year: { $year: '$issuedAt' },
      month: { $month: '$issuedAt' },
    };
  }

  const trends = await Prescription.aggregate([
    {
      $match: {
        doctor: doctorId,
        issuedAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: groupBy,
        count: { $sum: 1 },
        totalMedications: { $sum: { $size: { $ifNull: ['$medications', []] } } },
        totalInvestigations: { $sum: { $size: { $ifNull: ['$investigations', []] } } },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1, '_id.day': 1 } },
  ]);

  res.json({
    success: true,
    period,
    from: startDate,
    to: endDate,
    trends: trends.map((item) => ({
      date: period === 'daily'
        ? `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`
        : period === 'weekly'
        ? `${item._id.year}-W${String(item._id.week).padStart(2, '0')}`
        : `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      count: item.count,
      totalMedications: item.totalMedications,
      totalInvestigations: item.totalInvestigations,
    })),
  });
});

// Peak Hours Analysis
exports.getPeakHours = asyncHandler(async (req, res) => {
  const doctorId = toObjectId(req.auth.id);
  const { from, to } = req.query;

  let startDate, endDate;
  if (from && to) {
    startDate = new Date(from);
    endDate = new Date(to);
  } else {
    const now = new Date();
    startDate = addMonths(now, -3);
    endDate = now;
  }

  const peakHours = await Appointment.aggregate([
    {
      $match: {
        doctor: doctorId,
        scheduledFor: { $gte: startDate, $lte: endDate },
        status: { $nin: ['cancelled', 'no_show'] },
      },
    },
    {
      $group: {
        _id: {
          hour: { $hour: '$scheduledFor' },
          dayOfWeek: { $dayOfWeek: '$scheduledFor' },
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.hour',
        totalAppointments: { $sum: '$count' },
        byDay: {
          $push: {
            day: '$_id.dayOfWeek',
            count: '$count',
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  res.json({
    success: true,
    from: startDate,
    to: endDate,
    peakHours: peakHours.map((item) => ({
      hour: item._id,
      hourLabel: `${String(item._id).padStart(2, '0')}:00`,
      totalAppointments: item.totalAppointments,
      byDay: item.byDay.map((d) => ({
        day: dayNames[d.day - 1] || `Day ${d.day}`,
        dayIndex: d.day,
        count: d.count,
      })),
    })),
  });
});

// Comparison Reports (Month-over-Month, Year-over-Year)
exports.getComparisonReport = asyncHandler(async (req, res) => {
  const doctorId = toObjectId(req.auth.id);
  const { type = 'month', periods = 12 } = req.query;

  const now = new Date();
  const numPeriods = Math.min(Math.max(Number.parseInt(periods, 10) || 12, 1), 24);

  let periodsData = [];
  for (let i = numPeriods - 1; i >= 0; i--) {
    let periodStart, periodEnd, periodLabel;
    if (type === 'month') {
      periodStart = startOfMonth(addMonths(now, -i));
      periodEnd = addMonths(periodStart, 1);
      periodLabel = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`;
    } else {
      periodStart = startOfYear(addYears(now, -i));
      periodEnd = addYears(periodStart, 1);
      periodLabel = `${periodStart.getFullYear()}`;
    }

    const [
      appointments,
      consultations,
      prescriptions,
      revenue,
      newPatients,
    ] = await Promise.all([
      Appointment.countDocuments({
        doctor: doctorId,
        scheduledFor: { $gte: periodStart, $lt: periodEnd },
        status: { $nin: ['cancelled', 'no_show'] },
      }),
      Consultation.countDocuments({
        doctor: doctorId,
        createdAt: { $gte: periodStart, $lt: periodEnd },
        status: CONSULTATION_STATUS.COMPLETED,
      }),
      Prescription.countDocuments({
        doctor: doctorId,
        issuedAt: { $gte: periodStart, $lt: periodEnd },
      }),
      WalletTransaction.aggregate([
        {
          $match: {
            $or: [
              { provider: doctorId, providerRole: ROLES.DOCTOR },
              { doctor: doctorId },
            ],
            creditedAt: { $gte: periodStart, $lt: periodEnd },
          },
        },
        {
          $group: {
            _id: null,
            totalGross: { $sum: '$grossAmount' },
            totalNet: { $sum: '$netAmount' },
            totalCommission: { $sum: '$commissionAmount' },
          },
        },
      ]),
      Consultation.distinct('patient', {
        doctor: doctorId,
        status: CONSULTATION_STATUS.COMPLETED,
        createdAt: { $gte: periodStart, $lt: periodEnd },
      }),
    ]);

    const revenueData = revenue[0] || {
      totalGross: 0,
      totalNet: 0,
      totalCommission: 0,
    };

    periodsData.push({
      period: periodLabel,
      startDate: periodStart,
      endDate: periodEnd,
      appointments,
      consultations,
      prescriptions,
      revenue: {
        gross: revenueData.totalGross,
        net: revenueData.totalNet,
        commission: revenueData.totalCommission,
      },
      newPatients: newPatients.length,
    });
  }

  // Calculate growth percentages
  const comparison = periodsData.map((period, index) => {
    if (index === 0) {
      return {
        ...period,
        growth: null,
      };
    }

    const previous = periodsData[index - 1];
    const growth = {
      appointments: previous.appointments > 0
        ? ((period.appointments - previous.appointments) / previous.appointments) * 100
        : period.appointments > 0 ? 100 : 0,
      consultations: previous.consultations > 0
        ? ((period.consultations - previous.consultations) / previous.consultations) * 100
        : period.consultations > 0 ? 100 : 0,
      prescriptions: previous.prescriptions > 0
        ? ((period.prescriptions - previous.prescriptions) / previous.prescriptions) * 100
        : period.prescriptions > 0 ? 100 : 0,
      revenue: previous.revenue.net > 0
        ? ((period.revenue.net - previous.revenue.net) / previous.revenue.net) * 100
        : period.revenue.net > 0 ? 100 : 0,
      newPatients: previous.newPatients > 0
        ? ((period.newPatients - previous.newPatients) / previous.newPatients) * 100
        : period.newPatients > 0 ? 100 : 0,
    };

    return {
      ...period,
      growth,
    };
  });

  res.json({
    success: true,
    type,
    periods: numPeriods,
    comparison,
  });
});

// Export Analytics Report
exports.exportAnalyticsReport = asyncHandler(async (req, res) => {
  const doctorId = toObjectId(req.auth.id);
  const { format = 'pdf', reportType = 'comprehensive', from, to } = req.query;

  if (!['pdf', 'excel', 'csv'].includes(format.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: 'Format must be pdf, excel, or csv.',
    });
  }

  let startDate, endDate;
  if (from && to) {
    startDate = new Date(from);
    endDate = new Date(to);
  } else {
    const now = new Date();
    startDate = addMonths(now, -3);
    endDate = now;
  }

  // Get doctor info
  const Doctor = require('../../models/Doctor');
  const doctor = await Doctor.findById(doctorId).select('firstName lastName specialization').lean();

  // Fetch analytics data
  const [
    revenueData,
    patientGrowthData,
    consultationData,
    prescriptionData,
    peakHoursData,
    comparisonData,
  ] = await Promise.all([
    WalletTransaction.aggregate([
      {
        $match: {
          $or: [
            { provider: doctorId, providerRole: ROLES.DOCTOR },
            { doctor: doctorId },
          ],
          creditedAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalGross: { $sum: '$grossAmount' },
          totalNet: { $sum: '$netAmount' },
          totalCommission: { $sum: '$commissionAmount' },
          count: { $sum: 1 },
        },
      },
    ]),
    Consultation.distinct('patient', {
      doctor: doctorId,
      status: CONSULTATION_STATUS.COMPLETED,
      createdAt: { $gte: startDate, $lte: endDate },
    }),
    Consultation.countDocuments({
      doctor: doctorId,
      createdAt: { $gte: startDate, $lte: endDate },
      status: CONSULTATION_STATUS.COMPLETED,
    }),
    Prescription.countDocuments({
      doctor: doctorId,
      issuedAt: { $gte: startDate, $lte: endDate },
    }),
    Appointment.aggregate([
      {
        $match: {
          doctor: doctorId,
          scheduledFor: { $gte: startDate, $lte: endDate },
          status: { $nin: ['cancelled', 'no_show'] },
        },
      },
      {
        $group: {
          _id: { $hour: '$scheduledFor' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    Appointment.countDocuments({
      doctor: doctorId,
      scheduledFor: { $gte: startDate, $lte: endDate },
      status: { $nin: ['cancelled', 'no_show'] },
    }),
  ]);

  const revenue = revenueData[0] || { totalGross: 0, totalNet: 0, totalCommission: 0, count: 0 };

  if (format.toLowerCase() === 'pdf') {
    const doc = new PDFDocument();
    const fileName = `analytics-report-${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), 'backend', 'uploads', 'reports', fileName);
    const uploadsDir = path.dirname(filePath);

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('Analytics Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Doctor: ${doctor.firstName} ${doctor.lastName}`, { align: 'center' });
    doc.text(`Specialization: ${doctor.specialization || 'N/A'}`, { align: 'center' });
    doc.text(`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();

    // Revenue Section
    doc.fontSize(16).text('Revenue Summary', { underline: true });
    doc.fontSize(12);
    doc.text(`Total Gross Revenue: ₹${revenue.totalGross.toFixed(2)}`);
    doc.text(`Total Net Revenue: ₹${revenue.totalNet.toFixed(2)}`);
    doc.text(`Total Commission: ₹${revenue.totalCommission.toFixed(2)}`);
    doc.text(`Total Transactions: ${revenue.count}`);
    doc.moveDown();

    // Activity Section
    doc.fontSize(16).text('Activity Summary', { underline: true });
    doc.fontSize(12);
    doc.text(`Total Appointments: ${comparisonData}`);
    doc.text(`Total Consultations: ${consultationData}`);
    doc.text(`Total Prescriptions: ${prescriptionData}`);
    doc.text(`New Patients: ${patientGrowthData.length}`);
    doc.moveDown();

    // Peak Hours
    if (peakHoursData.length > 0) {
      doc.fontSize(16).text('Peak Hours', { underline: true });
      doc.fontSize(12);
      peakHoursData.forEach((item, index) => {
        doc.text(`${index + 1}. Hour ${item._id}:00 - ${item.count} appointments`);
      });
    }

    doc.end();

    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.sendFile(filePath);
  } else if (format.toLowerCase() === 'excel') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Analytics Report');

    // Header
    worksheet.mergeCells('A1:D1');
    worksheet.getCell('A1').value = 'Analytics Report';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.getCell('A2').value = 'Doctor:';
    worksheet.getCell('B2').value = `${doctor.firstName} ${doctor.lastName}`;
    worksheet.getCell('A3').value = 'Period:';
    worksheet.getCell('B3').value = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

    // Revenue Section
    let row = 5;
    worksheet.getCell(`A${row}`).value = 'Revenue Summary';
    worksheet.getCell(`A${row}`).font = { bold: true };
    row++;
    worksheet.getCell(`A${row}`).value = 'Total Gross Revenue';
    worksheet.getCell(`B${row}`).value = `₹${revenue.totalGross.toFixed(2)}`;
    row++;
    worksheet.getCell(`A${row}`).value = 'Total Net Revenue';
    worksheet.getCell(`B${row}`).value = `₹${revenue.totalNet.toFixed(2)}`;
    row++;
    worksheet.getCell(`A${row}`).value = 'Total Commission';
    worksheet.getCell(`B${row}`).value = `₹${revenue.totalCommission.toFixed(2)}`;
    row++;
    worksheet.getCell(`A${row}`).value = 'Total Transactions';
    worksheet.getCell(`B${row}`).value = revenue.count;

    // Activity Section
    row += 2;
    worksheet.getCell(`A${row}`).value = 'Activity Summary';
    worksheet.getCell(`A${row}`).font = { bold: true };
    row++;
    worksheet.getCell(`A${row}`).value = 'Total Appointments';
    worksheet.getCell(`B${row}`).value = comparisonData;
    row++;
    worksheet.getCell(`A${row}`).value = 'Total Consultations';
    worksheet.getCell(`B${row}`).value = consultationData;
    row++;
    worksheet.getCell(`A${row}`).value = 'Total Prescriptions';
    worksheet.getCell(`B${row}`).value = prescriptionData;
    row++;
    worksheet.getCell(`A${row}`).value = 'New Patients';
    worksheet.getCell(`B${row}`).value = patientGrowthData.length;

    // Peak Hours
    if (peakHoursData.length > 0) {
      row += 2;
      worksheet.getCell(`A${row}`).value = 'Peak Hours';
      worksheet.getCell(`A${row}`).font = { bold: true };
      row++;
      worksheet.getCell(`A${row}`).value = 'Hour';
      worksheet.getCell(`B${row}`).value = 'Appointments';
      worksheet.getCell(`A${row}`).font = { bold: true };
      worksheet.getCell(`B${row}`).font = { bold: true };
      peakHoursData.forEach((item) => {
        row++;
        worksheet.getCell(`A${row}`).value = `${item._id}:00`;
        worksheet.getCell(`B${row}`).value = item.count;
      });
    }

    // Set column widths
    worksheet.columns.forEach((column) => {
      column.width = 25;
    });

    const fileName = `analytics-report-${Date.now()}.xlsx`;
    const filePath = path.join(process.cwd(), 'backend', 'uploads', 'reports', fileName);
    const uploadsDir = path.dirname(filePath);

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    await workbook.xlsx.writeFile(filePath);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.sendFile(filePath);
  } else {
    // CSV format
    const csvRows = [];
    csvRows.push('Analytics Report');
    csvRows.push(`Doctor,${doctor.firstName} ${doctor.lastName}`);
    csvRows.push(`Period,${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
    csvRows.push('');
    csvRows.push('Revenue Summary');
    csvRows.push('Metric,Value');
    csvRows.push(`Total Gross Revenue,₹${revenue.totalGross.toFixed(2)}`);
    csvRows.push(`Total Net Revenue,₹${revenue.totalNet.toFixed(2)}`);
    csvRows.push(`Total Commission,₹${revenue.totalCommission.toFixed(2)}`);
    csvRows.push(`Total Transactions,${revenue.count}`);
    csvRows.push('');
    csvRows.push('Activity Summary');
    csvRows.push('Metric,Value');
    csvRows.push(`Total Appointments,${comparisonData}`);
    csvRows.push(`Total Consultations,${consultationData}`);
    csvRows.push(`Total Prescriptions,${prescriptionData}`);
    csvRows.push(`New Patients,${patientGrowthData.length}`);
    if (peakHoursData.length > 0) {
      csvRows.push('');
      csvRows.push('Peak Hours');
      csvRows.push('Hour,Appointments');
      peakHoursData.forEach((item) => {
        csvRows.push(`${item._id}:00,${item.count}`);
      });
    }

    const csvContent = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${Date.now()}.csv"`);
    return res.send(csvContent);
  }
});

