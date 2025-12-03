const asyncHandler = require('../../middleware/asyncHandler');
const Transaction = require('../../models/Transaction');
const Appointment = require('../../models/Appointment');
const Order = require('../../models/Order');

// Helper function to get date ranges
const getDateRanges = () => {
  const now = new Date();
  
  // Today
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  
  // Yesterday
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = new Date(todayEnd);
  yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
  
  // This week (Monday to Sunday)
  const thisWeekStart = new Date(now);
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  thisWeekStart.setDate(diff);
  thisWeekStart.setHours(0, 0, 0, 0);
  const thisWeekEnd = new Date(todayEnd);
  
  // Last week
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
  lastWeekEnd.setHours(23, 59, 59, 999);
  
  // This month
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  thisMonthStart.setHours(0, 0, 0, 0);
  const thisMonthEnd = new Date(todayEnd);
  
  // Last month
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  lastMonthStart.setHours(0, 0, 0, 0);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  lastMonthEnd.setHours(23, 59, 59, 999);
  
  // Last 6 months for monthly data
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);
  
  return {
    todayStart,
    todayEnd,
    yesterdayStart,
    yesterdayEnd,
    thisWeekStart,
    thisWeekEnd,
    lastWeekStart,
    lastWeekEnd,
    thisMonthStart,
    thisMonthEnd,
    lastMonthStart,
    lastMonthEnd,
    sixMonthsAgo,
  };
};

// GET /api/admin/revenue
exports.getRevenueOverview = asyncHandler(async (req, res) => {
  const { todayStart, todayEnd, yesterdayStart, yesterdayEnd, thisWeekStart, thisWeekEnd, lastWeekStart, lastWeekEnd, thisMonthStart, thisMonthEnd, lastMonthStart, lastMonthEnd, sixMonthsAgo } = getDateRanges();

  // Get total revenue (all time) - from admin transactions
  const totalRevenueResult = await Transaction.aggregate([
    { $match: { userType: 'admin', type: 'payment', status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const totalRevenue = totalRevenueResult[0]?.total || 0;

  // Today's revenue
  const todayRevenueResult = await Transaction.aggregate([
    {
      $match: {
        userType: 'admin',
        type: 'payment',
        status: 'completed',
        createdAt: { $gte: todayStart, $lte: todayEnd },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const todayRevenue = todayRevenueResult[0]?.total || 0;

  // Yesterday's revenue
  const yesterdayRevenueResult = await Transaction.aggregate([
    {
      $match: {
        userType: 'admin',
        type: 'payment',
        status: 'completed',
        createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const yesterdayRevenue = yesterdayRevenueResult[0]?.total || 0;

  // This week's revenue
  const thisWeekRevenueResult = await Transaction.aggregate([
    {
      $match: {
        userType: 'admin',
        type: 'payment',
        status: 'completed',
        createdAt: { $gte: thisWeekStart, $lte: thisWeekEnd },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const thisWeekRevenue = thisWeekRevenueResult[0]?.total || 0;

  // Last week's revenue
  const lastWeekRevenueResult = await Transaction.aggregate([
    {
      $match: {
        userType: 'admin',
        type: 'payment',
        status: 'completed',
        createdAt: { $gte: lastWeekStart, $lte: lastWeekEnd },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const lastWeekRevenue = lastWeekRevenueResult[0]?.total || 0;

  // This month's revenue
  const thisMonthRevenueResult = await Transaction.aggregate([
    {
      $match: {
        userType: 'admin',
        type: 'payment',
        status: 'completed',
        createdAt: { $gte: thisMonthStart, $lte: thisMonthEnd },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const thisMonthRevenue = thisMonthRevenueResult[0]?.total || 0;

  // Last month's revenue
  const lastMonthRevenueResult = await Transaction.aggregate([
    {
      $match: {
        userType: 'admin',
        type: 'payment',
        status: 'completed',
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const lastMonthRevenue = lastMonthRevenueResult[0]?.total || 0;

  // Revenue by source (doctors, pharmacies, laboratories)
  // This is based on commission/admin share from transactions
  const revenueBySourceResult = await Transaction.aggregate([
    {
      $match: {
        userType: 'admin',
        type: 'payment',
        status: 'completed',
      },
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
      },
    },
  ]);

  // Map categories to sources
  const revenueBySource = {
    doctors: 0,
    pharmacies: 0,
    laboratories: 0,
  };

  revenueBySourceResult.forEach((item) => {
    if (item._id === 'appointment' || item._id === 'consultation') {
      revenueBySource.doctors += item.total;
    } else if (item._id === 'medicine' || item._id === 'order') {
      // Check if it's pharmacy or lab based on order
      // For now, we'll need to check the actual orders
      revenueBySource.pharmacies += item.total * 0.5; // Approximate split
      revenueBySource.laboratories += item.total * 0.5;
    }
  });

  // Get more accurate revenue by source from actual orders and appointments
  const [appointmentRevenue, pharmacyOrderRevenue, labOrderRevenue] = await Promise.all([
    // Revenue from appointments (consultations)
    Transaction.aggregate([
      {
        $match: {
          userType: 'admin',
          type: 'payment',
          status: 'completed',
          category: { $in: ['appointment', 'consultation'] },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then((result) => result[0]?.total || 0),
    
    // Revenue from pharmacy orders
    Transaction.aggregate([
      {
        $match: {
          userType: 'admin',
          type: 'payment',
          status: 'completed',
          category: 'order',
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order',
        },
      },
      { $unwind: { path: '$order', preserveNullAndEmptyArrays: true } },
      { $match: { 'order.providerType': 'pharmacy' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then((result) => result[0]?.total || 0),
    
    // Revenue from lab orders
    Transaction.aggregate([
      {
        $match: {
          userType: 'admin',
          type: 'payment',
          status: 'completed',
          category: 'order',
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order',
        },
      },
      { $unwind: { path: '$order', preserveNullAndEmptyArrays: true } },
      { $match: { 'order.providerType': 'laboratory' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then((result) => result[0]?.total || 0),
  ]);

  revenueBySource.doctors = appointmentRevenue;
  revenueBySource.pharmacies = pharmacyOrderRevenue;
  revenueBySource.laboratories = labOrderRevenue;

  // Revenue breakdown by type
  const revenueBreakdownResult = await Transaction.aggregate([
    {
      $match: {
        userType: 'admin',
        type: 'payment',
        status: 'completed',
      },
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
      },
    },
  ]);

  const revenueBreakdown = {
    consultations: 0,
    labOrders: 0,
    pharmacyOrders: 0,
    commissions: 0,
  };

  revenueBreakdownResult.forEach((item) => {
    if (item._id === 'consultation' || item._id === 'appointment') {
      revenueBreakdown.consultations += item.total;
    } else if (item._id === 'order') {
      // We'll need to check if it's pharmacy or lab
      revenueBreakdown.pharmacyOrders += item.total * 0.5;
      revenueBreakdown.labOrders += item.total * 0.5;
    } else if (item._id === 'medicine') {
      revenueBreakdown.pharmacyOrders += item.total;
    } else if (item._id === 'test') {
      revenueBreakdown.labOrders += item.total;
    } else if (item._id === 'other') {
      revenueBreakdown.commissions += item.total;
    }
  });

  // Get more accurate breakdown
  const [consultationRev, pharmacyOrderRev, labOrderRev] = await Promise.all([
    Transaction.aggregate([
      {
        $match: {
          userType: 'admin',
          type: 'payment',
          status: 'completed',
          category: { $in: ['appointment', 'consultation'] },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then((result) => result[0]?.total || 0),
    
    Transaction.aggregate([
      {
        $match: {
          userType: 'admin',
          type: 'payment',
          status: 'completed',
          category: 'order',
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order',
        },
      },
      { $unwind: { path: '$order', preserveNullAndEmptyArrays: true } },
      { $match: { 'order.providerType': 'pharmacy' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then((result) => result[0]?.total || 0),
    
    Transaction.aggregate([
      {
        $match: {
          userType: 'admin',
          type: 'payment',
          status: 'completed',
          category: 'order',
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order',
        },
      },
      { $unwind: { path: '$order', preserveNullAndEmptyArrays: true } },
      { $match: { 'order.providerType': 'laboratory' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then((result) => result[0]?.total || 0),
  ]);

  revenueBreakdown.consultations = consultationRev;
  revenueBreakdown.pharmacyOrders = pharmacyOrderRev;
  revenueBreakdown.labOrders = labOrderRev;

  // Commission revenue (from type: 'commission')
  const commissionRev = await Transaction.aggregate([
    {
      $match: {
        userType: 'admin',
        type: 'commission',
        status: 'completed',
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  revenueBreakdown.commissions = commissionRev[0]?.total || 0;

  // Monthly revenue for last 6 months
  const now = new Date();
  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    const monthRevenueResult = await Transaction.aggregate([
      {
        $match: {
          userType: 'admin',
          type: 'payment',
          status: 'completed',
          createdAt: { $gte: monthStart, $lte: monthEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    monthlyRevenue.push({
      month: monthNames[monthStart.getMonth()],
      revenue: monthRevenueResult[0]?.total || 0,
    });
  }

  // Recent transactions (last 10)
  const recentTransactions = await Transaction.find({
    userType: 'admin',
    type: 'payment',
    status: 'completed',
  })
    .populate('appointmentId', 'appointmentDate fee')
    .populate('orderId', 'totalAmount status providerType')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Enrich transactions with source information
  const Patient = require('../../models/Patient');
  const Doctor = require('../../models/Doctor');
  const Pharmacy = require('../../models/Pharmacy');
  const Laboratory = require('../../models/Laboratory');

  const enrichedTransactions = await Promise.all(
    recentTransactions.map(async (transaction) => {
      const enriched = {
        id: transaction._id.toString(),
        type: transaction.category || 'other',
        amount: transaction.amount,
        date: transaction.createdAt,
        status: transaction.status,
        commission: 0, // Calculate commission if needed
        source: '',
      };

      // Determine source based on transaction
      if (transaction.appointmentId) {
        enriched.type = 'consultation';
        if (transaction.metadata?.doctorId) {
          const doctor = await Doctor.findById(transaction.metadata.doctorId).select('firstName lastName').lean();
          enriched.source = doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Unknown Doctor';
        }
        // Calculate commission (e.g., 10% of appointment fee)
        enriched.commission = transaction.amount * 0.1;
      } else if (transaction.orderId) {
        if (transaction.orderId.providerType === 'pharmacy') {
          enriched.type = 'pharmacy';
          if (transaction.metadata?.pharmacyId) {
            const pharmacy = await Pharmacy.findById(transaction.metadata.pharmacyId).select('pharmacyName').lean();
            enriched.source = pharmacy ? pharmacy.pharmacyName : 'Unknown Pharmacy';
          }
        } else if (transaction.orderId.providerType === 'laboratory') {
          enriched.type = 'laboratory';
          if (transaction.metadata?.laboratoryId) {
            const lab = await Laboratory.findById(transaction.metadata.laboratoryId).select('labName').lean();
            enriched.source = lab ? lab.labName : 'Unknown Laboratory';
          }
        }
        // Calculate commission (e.g., 10% of order amount)
        enriched.commission = transaction.amount * 0.1;
      }

      return enriched;
    })
  );

  return res.status(200).json({
    success: true,
    data: {
      totalRevenue,
      todayRevenue,
      yesterdayRevenue,
      thisWeekRevenue,
      lastWeekRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      revenueBySource,
      revenueBreakdown,
      monthlyRevenue,
      recentTransactions: enrichedTransactions,
    },
  });
});

