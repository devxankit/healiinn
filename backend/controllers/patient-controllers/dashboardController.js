const mongoose = require('mongoose');
const Appointment = require('../../models/Appointment');
const Prescription = require('../../models/Prescription');
const LabReport = require('../../models/LabReport');
const LabLead = require('../../models/LabLead');
const PharmacyLead = require('../../models/PharmacyLead');
const Payment = require('../../models/Payment');
const Notification = require('../../models/Notification');
const Consultation = require('../../models/Consultation');
const { ROLES, LAB_LEAD_STATUS, PHARMACY_LEAD_STATUS, CONSULTATION_STATUS } = require('../../utils/constants');

const asyncHandler = require('../../middleware/asyncHandler');

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
  const d = new Date(date);
  d.setMonth(0, 1);
  return d;
};

const addYears = (date, years) => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
};

const mapDoctorSummary = (doctor) =>
  doctor
    ? {
        id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        fullName: `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim(),
        specialty: doctor.specialty || null,
        qualification: doctor.qualification || null,
        profileImage: doctor.profileImage || null,
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
  const patientId = toObjectId(req.auth.id);
  const now = new Date();

  const dayStart = startOfDay(now);
  const dayEnd = addDays(dayStart, 1);

  const monthStart = startOfMonth(now);
  const monthEnd = addMonths(monthStart, 1);

  const yearStart = startOfYear(now);
  const yearEnd = addYears(yearStart, 1);

  // Base filters
  const appointmentBaseFilter = {
    patient: patientId,
    status: { $nin: ['cancelled', 'no_show'] },
  };

  const [
    // Appointments metrics
    dailyAppointments,
    monthlyAppointments,
    yearlyAppointments,
    totalAppointments,
    upcomingAppointmentsRaw,
    
    // Prescriptions metrics
    totalPrescriptions,
    recentPrescriptionsRaw,
    pendingPrescriptions,
    
    // Reports metrics
    totalReports,
    recentReportsRaw,
    pendingReports,
    
    // Lab and Pharmacy orders
    pendingLabOrders,
    pendingPharmacyOrders,
    totalLabOrders,
    totalPharmacyOrders,
    
    // Payment summary
    totalSpent,
    monthlySpent,
    yearlySpent,
    pendingPayments,
    
    // Notifications
    notificationsRaw,
    unreadNotificationsCount,
    
    // Recent activity (mixed timeline)
    recentActivityRaw,
  ] = await Promise.all([
    // Appointments - Daily
    Appointment.countDocuments({
      ...appointmentBaseFilter,
      scheduledFor: { $gte: dayStart, $lt: dayEnd },
    }),
    
    // Appointments - Monthly
    Appointment.countDocuments({
      ...appointmentBaseFilter,
      scheduledFor: { $gte: monthStart, $lt: monthEnd },
    }),
    
    // Appointments - Yearly
    Appointment.countDocuments({
      ...appointmentBaseFilter,
      scheduledFor: { $gte: yearStart, $lt: yearEnd },
    }),
    
    // Total appointments (all time)
    Appointment.countDocuments({ patient: patientId }),
    
    // Upcoming appointments (next 10)
    Appointment.find({
      patient: patientId,
      scheduledFor: { $gte: now },
      status: { $nin: ['cancelled', 'no_show', 'completed'] },
    })
      .populate('doctor', 'firstName lastName specialty profileImage')
      .populate('clinic', 'name address')
      .populate('session', 'startTime endTime status')
      .populate('token', 'tokenNumber status eta')
      .sort({ scheduledFor: 1 })
      .limit(10)
      .lean(),
    
    // Prescriptions - Total
    Prescription.countDocuments({ patient: patientId }),
    
    // Recent prescriptions (last 5)
    Prescription.find({ patient: patientId })
      .populate('doctor', 'firstName lastName specialty profileImage')
      .populate('appointment', 'scheduledFor status')
      .sort({ issuedAt: -1 })
      .limit(5)
      .lean(),
    
    // Pending prescriptions (with pending lab/pharmacy orders)
    Prescription.countDocuments({
      patient: patientId,
      followUpAt: { $gte: now },
    }),
    
    // Reports - Total
    LabReport.countDocuments({ patient: patientId }),
    
    // Recent reports (last 5)
    LabReport.find({ patient: patientId })
      .populate('doctor', 'firstName lastName specialty')
      .populate('laboratory', 'labName phone email')
      .populate('labLead', 'status billingSummary payment')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    
    // Pending reports (lab orders without reports)
    LabLead.countDocuments({
      patient: patientId,
      status: { $nin: [LAB_LEAD_STATUS.CANCELLED, LAB_LEAD_STATUS.COMPLETED] },
      'reportDetails.uploadedAt': { $exists: false },
    }),
    
    // Pending lab orders
    LabLead.countDocuments({
      patient: patientId,
      status: { $nin: [LAB_LEAD_STATUS.CANCELLED, LAB_LEAD_STATUS.COMPLETED] },
    }),
    
    // Pending pharmacy orders
    PharmacyLead.countDocuments({
      patient: patientId,
      status: { $nin: [PHARMACY_LEAD_STATUS.CANCELLED, PHARMACY_LEAD_STATUS.COMPLETED] },
    }),
    
    // Total lab orders
    LabLead.countDocuments({ patient: patientId }),
    
    // Total pharmacy orders
    PharmacyLead.countDocuments({ patient: patientId }),
    
    // Payment summary - Total spent (all time)
    Payment.aggregate([
      {
        $match: {
          user: patientId,
          userModel: 'Patient',
          status: 'success',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]),
    
    // Payment summary - Monthly spent
    Payment.aggregate([
      {
        $match: {
          user: patientId,
          userModel: 'Patient',
          status: 'success',
          createdAt: { $gte: monthStart, $lt: monthEnd },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]),
    
    // Payment summary - Yearly spent
    Payment.aggregate([
      {
        $match: {
          user: patientId,
          userModel: 'Patient',
          status: 'success',
          createdAt: { $gte: yearStart, $lt: yearEnd },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]),
    
    // Pending payments
    Payment.countDocuments({
      user: patientId,
      userModel: 'Patient',
      status: 'pending',
    }),
    
    // Notifications (last 10)
    Notification.find({
      'recipients.user': patientId,
      'recipients.role': ROLES.PATIENT,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    
    // Unread notifications count
    Notification.aggregate([
      {
        $match: {
          'recipients.user': patientId,
          'recipients.role': ROLES.PATIENT,
        },
      },
      {
        $unwind: '$recipients',
      },
      {
        $match: {
          'recipients.user': patientId,
          'recipients.role': ROLES.PATIENT,
          'recipients.readAt': null,
        },
      },
      {
        $count: 'count',
      },
    ]),
    
    // Recent activity - Mixed timeline from appointments, prescriptions, reports
    Promise.all([
      // Recent appointments (last 10)
      Appointment.find({ patient: patientId })
        .populate('doctor', 'firstName lastName specialty')
        .populate('clinic', 'name address')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      
      // Recent prescriptions (last 10)
      Prescription.find({ patient: patientId })
        .populate('doctor', 'firstName lastName specialty')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      
      // Recent reports (last 10)
      LabReport.find({ patient: patientId })
        .populate('doctor', 'firstName lastName')
        .populate('laboratory', 'labName')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]),
  ]);

  // Format upcoming appointments
  const upcomingAppointments = upcomingAppointmentsRaw.map((item) => ({
    id: item._id,
    scheduledFor: item.scheduledFor,
    status: item.status,
    type: item.type || null,
    reason: item.reason || null,
    tokenNumber: item.tokenNumber || item.token?.tokenNumber || null,
    eta: item.eta || item.token?.eta || null,
    doctor: mapDoctorSummary(item.doctor),
    clinic: mapClinicSummary(item.clinic),
    session: item.session
      ? {
          id: item.session._id,
          startTime: item.session.startTime,
          endTime: item.session.endTime,
          status: item.session.status,
        }
      : null,
  }));

  // Format recent prescriptions
  const recentPrescriptions = recentPrescriptionsRaw.map((item) => ({
    id: item._id,
    issuedAt: item.issuedAt,
    status: item.status,
    diagnosis: item.diagnosis || null,
    medicationsCount: item.medications?.length || 0,
    investigationsCount: item.investigations?.length || 0,
    followUpAt: item.followUpAt || null,
    doctor: mapDoctorSummary(item.doctor),
    appointment: item.appointment
      ? {
          id: item.appointment._id,
          scheduledFor: item.appointment.scheduledFor,
          status: item.appointment.status,
        }
      : null,
  }));

  // Format recent reports
  const recentReports = recentReportsRaw.map((item) => ({
    id: item._id,
    uploadedAt: item.reportFile?.uploadedAt || item.createdAt,
    fileName: item.reportFile?.fileName || null,
    fileUrl: item.reportFile?.fileUrl || null,
    status: item.status,
    doctor: item.doctor
      ? {
          id: item.doctor._id,
          firstName: item.doctor.firstName,
          lastName: item.doctor.lastName,
          fullName: `${item.doctor.firstName || ''} ${item.doctor.lastName || ''}`.trim(),
          specialty: item.doctor.specialty || null,
        }
      : null,
    laboratory: item.laboratory
      ? {
          id: item.laboratory._id,
          labName: item.laboratory.labName,
          phone: item.laboratory.phone || null,
          email: item.laboratory.email || null,
        }
      : null,
    labLead: item.labLead
      ? {
          id: item.labLead._id,
          status: item.labLead.status,
          totalAmount: item.labLead.billingSummary?.totalAmount || 0,
          paymentStatus: item.labLead.payment?.paymentStatus || 'unpaid',
        }
      : null,
  }));

  // Format notifications
  const notifications = notificationsRaw.map((item) => {
    const recipient = (item.recipients || []).find(
      (entry) =>
        entry.role === ROLES.PATIENT &&
        entry.user &&
        entry.user.toString() === patientId.toString()
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

  // Build recent activity timeline
  const [recentAppointments, recentPrescriptionsForActivity, recentReportsForActivity] = recentActivityRaw;
  
  const activityItems = [
    ...recentAppointments.map((item) => ({
      id: item._id,
      type: 'appointment',
      action: 'Appointment',
      description: `Appointment with ${item.doctor ? `${item.doctor.firstName} ${item.doctor.lastName}`.trim() : 'Doctor'}`,
      status: item.status,
      date: item.createdAt,
      scheduledFor: item.scheduledFor,
      doctor: mapDoctorSummary(item.doctor),
      clinic: mapClinicSummary(item.clinic),
    })),
    ...recentPrescriptionsForActivity.map((item) => ({
      id: item._id,
      type: 'prescription',
      action: 'Prescription',
      description: `Prescription from ${item.doctor ? `${item.doctor.firstName} ${item.doctor.lastName}`.trim() : 'Doctor'}`,
      status: item.status,
      date: item.createdAt,
      issuedAt: item.issuedAt,
      doctor: mapDoctorSummary(item.doctor),
      medicationsCount: item.medications?.length || 0,
    })),
    ...recentReportsForActivity.map((item) => ({
      id: item._id,
      type: 'report',
      action: 'Lab Report',
      description: `Report from ${item.laboratory ? item.laboratory.labName : 'Laboratory'}`,
      status: item.status,
      date: item.reportFile?.uploadedAt || item.createdAt,
      laboratory: item.laboratory
        ? {
            id: item.laboratory._id,
            labName: item.laboratory.labName,
          }
        : null,
      doctor: item.doctor
        ? {
            id: item.doctor._id,
            firstName: item.doctor.firstName,
            lastName: item.doctor.lastName,
            fullName: `${item.doctor.firstName || ''} ${item.doctor.lastName || ''}`.trim(),
          }
        : null,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15); // Last 15 items

  // Extract payment totals
  const totalSpentAmount = totalSpent[0]?.total || 0;
  const monthlySpentAmount = monthlySpent[0]?.total || 0;
  const yearlySpentAmount = yearlySpent[0]?.total || 0;

  res.json({
    success: true,
    metrics: {
      appointments: {
        daily: dailyAppointments,
        monthly: monthlyAppointments,
        yearly: yearlyAppointments,
        total: totalAppointments,
      },
      prescriptions: {
        total: totalPrescriptions,
        pending: pendingPrescriptions,
      },
      reports: {
        total: totalReports,
        pending: pendingReports,
      },
      orders: {
        lab: {
          total: totalLabOrders,
          pending: pendingLabOrders,
        },
        pharmacy: {
          total: totalPharmacyOrders,
          pending: pendingPharmacyOrders,
        },
      },
      payments: {
        totalSpent: totalSpentAmount,
        monthlySpent: monthlySpentAmount,
        yearlySpent: yearlySpentAmount,
        pending: pendingPayments,
        currency: 'INR',
      },
      notifications: {
        unread: unreadNotificationsCount[0]?.count || 0,
      },
    },
    upcomingAppointments,
    recentPrescriptions,
    recentReports,
    notifications,
    recentActivity: activityItems,
    pendingActions: {
      appointments: upcomingAppointments.filter((apt) => apt.status === 'scheduled' || apt.status === 'confirmed').length,
      prescriptions: pendingPrescriptions,
      reports: pendingReports,
      labOrders: pendingLabOrders,
      pharmacyOrders: pendingPharmacyOrders,
      payments: pendingPayments,
    },
  });
});

