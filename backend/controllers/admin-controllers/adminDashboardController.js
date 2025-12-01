const asyncHandler = require('../../middleware/asyncHandler');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const Pharmacy = require('../../models/Pharmacy');
const Laboratory = require('../../models/Laboratory');
const Appointment = require('../../models/Appointment');
const Order = require('../../models/Order');
const Request = require('../../models/Request');
const { APPROVAL_STATUS } = require('../../utils/constants');

// GET /api/admin/dashboard/stats
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalDoctors,
    totalPharmacies,
    totalLaboratories,
    pendingVerifications,
    totalAppointments,
    totalOrders,
    totalRequests,
    todayAppointments,
    todayOrders,
  ] = await Promise.all([
    Patient.countDocuments({ isActive: true }),
    Doctor.countDocuments({ status: APPROVAL_STATUS.APPROVED }),
    Pharmacy.countDocuments({ status: APPROVAL_STATUS.APPROVED }),
    Laboratory.countDocuments({ status: APPROVAL_STATUS.APPROVED }),
    Promise.all([
      Doctor.countDocuments({ status: APPROVAL_STATUS.PENDING }),
      Pharmacy.countDocuments({ status: APPROVAL_STATUS.PENDING }),
      Laboratory.countDocuments({ status: APPROVAL_STATUS.PENDING }),
    ]).then(counts => counts.reduce((sum, count) => sum + count, 0)),
    Appointment.countDocuments(),
    Order.countDocuments(),
    Request.countDocuments(),
    Appointment.countDocuments({
      appointmentDate: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    }),
    Order.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    }),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalDoctors,
      totalPharmacies,
      totalLaboratories,
      pendingVerifications,
      totalAppointments,
      totalOrders,
      totalRequests,
      todayAppointments,
      todayOrders,
    },
  });
});

// GET /api/admin/activities
exports.getRecentActivities = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

  // Get recent activities from various models
  const [recentAppointments, recentOrders, recentRequests, recentVerifications] = await Promise.all([
    Appointment.find()
      .populate('patientId', 'firstName lastName')
      .populate('doctorId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit),
    Order.find()
      .populate('patientId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit),
    Request.find()
      .populate('patientId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit),
    Promise.all([
      Doctor.find({ status: APPROVAL_STATUS.PENDING })
        .select('firstName lastName specialization createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      Pharmacy.find({ status: APPROVAL_STATUS.PENDING })
        .select('pharmacyName createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      Laboratory.find({ status: APPROVAL_STATUS.PENDING })
        .select('labName createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
    ]).then(results => results.flat()),
  ]);

  // Combine and sort by date
  const activities = [
    ...recentAppointments.map(a => ({ type: 'appointment', data: a, date: a.createdAt })),
    ...recentOrders.map(o => ({ type: 'order', data: o, date: o.createdAt })),
    ...recentRequests.map(r => ({ type: 'request', data: r, date: r.createdAt })),
    ...recentVerifications.map(v => ({ type: 'verification', data: v, date: v.createdAt })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);

  return res.status(200).json({
    success: true,
    data: activities,
  });
});

