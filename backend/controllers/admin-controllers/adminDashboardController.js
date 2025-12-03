const asyncHandler = require('../../middleware/asyncHandler');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const Pharmacy = require('../../models/Pharmacy');
const Laboratory = require('../../models/Laboratory');
const Appointment = require('../../models/Appointment');
const Order = require('../../models/Order');
const Request = require('../../models/Request');
const Transaction = require('../../models/Transaction');
const { APPROVAL_STATUS } = require('../../utils/constants');

// GET /api/admin/dashboard/stats
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  thisMonthStart.setHours(0, 0, 0, 0);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  lastMonthStart.setHours(0, 0, 0, 0);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  lastMonthEnd.setHours(23, 59, 59, 999);
  const thisMonthEnd = new Date(now);
  thisMonthEnd.setHours(23, 59, 59, 999);

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
    thisMonthUsers,
    lastMonthUsers,
    totalRevenue,
    thisMonthRevenue,
    lastMonthRevenue,
    thisMonthConsultations,
    lastMonthConsultations,
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
    // This month users
    Patient.countDocuments({
      isActive: true,
      createdAt: { $gte: thisMonthStart, $lte: thisMonthEnd },
    }),
    // Last month users
    Patient.countDocuments({
      isActive: true,
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
    }),
    // Total revenue (all time)
    Transaction.aggregate([
      { $match: { userType: 'admin', type: 'payment', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(result => result[0]?.total || 0),
    // This month revenue
    Transaction.aggregate([
      {
        $match: {
          userType: 'admin',
          type: 'payment',
          status: 'completed',
          createdAt: { $gte: thisMonthStart, $lte: thisMonthEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(result => result[0]?.total || 0),
    // Last month revenue
    Transaction.aggregate([
      {
        $match: {
          userType: 'admin',
          type: 'payment',
          status: 'completed',
          createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(result => result[0]?.total || 0),
    // This month consultations (appointments completed)
    Appointment.countDocuments({
      status: 'completed',
      appointmentDate: { $gte: thisMonthStart, $lte: thisMonthEnd },
    }),
    // Last month consultations
    Appointment.countDocuments({
      status: 'completed',
      appointmentDate: { $gte: lastMonthStart, $lte: lastMonthEnd },
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
      thisMonthUsers,
      lastMonthUsers,
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      thisMonthConsultations,
      lastMonthConsultations,
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

// GET /api/admin/dashboard/charts
exports.getChartData = asyncHandler(async (req, res) => {
  const now = new Date();
  const months = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Generate last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: date.getFullYear(),
      month: date.getMonth(),
      monthName: monthNames[date.getMonth()],
      start: new Date(date.getFullYear(), date.getMonth(), 1),
      end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999),
    });
  }

  // Get revenue data for each month
  const revenuePromises = months.map(({ start, end }) =>
    Transaction.aggregate([
      {
        $match: {
          userType: 'admin',
          type: 'payment',
          status: 'completed',
          createdAt: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(result => result[0]?.total || 0)
  );

  // Get user growth data for each month (cumulative)
  const userGrowthPromises = months.map(({ end }) =>
    Patient.countDocuments({
      isActive: true,
      createdAt: { $lte: end },
    })
  );

  // Get consultations data for each month
  const consultationsPromises = months.map(({ start, end }) =>
    Appointment.countDocuments({
      status: 'completed',
      appointmentDate: { $gte: start, $lte: end },
    })
  );

  const [revenueData, userGrowthData, consultationsData] = await Promise.all([
    Promise.all(revenuePromises),
    Promise.all(userGrowthPromises),
    Promise.all(consultationsPromises),
  ]);

  // Format data for charts
  const revenueChart = months.map((month, index) => ({
    month: month.monthName,
    value: revenueData[index],
  }));

  const userGrowthChart = months.map((month, index) => ({
    month: month.monthName,
    users: userGrowthData[index],
  }));

  const consultationsChart = months.map((month, index) => ({
    month: month.monthName,
    consultations: consultationsData[index],
  }));

  return res.status(200).json({
    success: true,
    data: {
      revenue: revenueChart,
      userGrowth: userGrowthChart,
      consultations: consultationsChart,
    },
  });
});

