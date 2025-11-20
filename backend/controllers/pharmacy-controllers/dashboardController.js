const mongoose = require('mongoose');
const asyncHandler = require('../../middleware/asyncHandler');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const PharmacyLead = require('../../models/PharmacyLead');
const Patient = require('../../models/Patient');
const WalletTransaction = require('../../models/WalletTransaction');
const { ROLES, PHARMACY_LEAD_STATUS, getCommissionRateByRole } = require('../../utils/constants');
const { getProviderWalletSummary } = require('../../services/walletService');
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

const mapOrderSummary = (order) => ({
  id: order._id,
  status: order.status,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  billingSummary: order.billingSummary
    ? {
        totalAmount: order.billingSummary.totalAmount || 0,
        deliveryCharge: order.billingSummary.deliveryCharge || 0,
        currency: order.billingSummary.currency || 'INR',
      }
    : null,
  patient: mapPatientSummary(order.patient),
  medicinesCount: order.medicines ? order.medicines.length : 0,
});

// Dashboard Overview
exports.getDashboardOverview = asyncHandler(async (req, res) => {
  const pharmacyId = toObjectId(req.auth.id);
  const cacheKey = generateCacheKey('pharmacy:dashboard', { pharmacyId: pharmacyId.toString() });
  
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

  const orderBaseFilter = {
    acceptedBy: pharmacyId,
    status: { $nin: [PHARMACY_LEAD_STATUS.CANCELLED] },
  };

  const [
    dailyOrders,
    monthlyOrders,
    yearlyOrders,
    totalOrders,
    pendingOrders,
    acceptedOrders,
    completedOrders,
    distinctPatients,
    recentOrdersRaw,
    walletSummary,
  ] = await Promise.all([
    PharmacyLead.countDocuments({
      ...orderBaseFilter,
      createdAt: { $gte: dayStart, $lt: dayEnd },
    }),
    PharmacyLead.countDocuments({
      ...orderBaseFilter,
      createdAt: { $gte: monthStart, $lt: monthEnd },
    }),
    PharmacyLead.countDocuments({
      ...orderBaseFilter,
      createdAt: { $gte: yearStart, $lt: yearEnd },
    }),
    PharmacyLead.countDocuments(orderBaseFilter),
    PharmacyLead.countDocuments({
      ...orderBaseFilter,
      status: PHARMACY_LEAD_STATUS.NEW,
    }),
    PharmacyLead.countDocuments({
      ...orderBaseFilter,
      status: PHARMACY_LEAD_STATUS.ACCEPTED,
    }),
    PharmacyLead.countDocuments({
      ...orderBaseFilter,
      status: PHARMACY_LEAD_STATUS.COMPLETED,
    }),
    PharmacyLead.distinct('patient', {
      ...orderBaseFilter,
      status: PHARMACY_LEAD_STATUS.COMPLETED,
    }),
    PharmacyLead.find(orderBaseFilter)
      .populate('patient', 'firstName lastName gender phone email')
      .populate('doctor', 'firstName lastName specialization')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('status createdAt updatedAt billingSummary medicines patient doctor')
      .lean(),
    getProviderWalletSummary(pharmacyId, ROLES.PHARMACY),
  ]);

  const recentOrders = recentOrdersRaw.map(mapOrderSummary);

  const response = {
    success: true,
    metrics: {
      orders: {
        daily: dailyOrders,
        monthly: monthlyOrders,
        yearly: yearlyOrders,
        total: totalOrders,
        pending: pendingOrders,
        accepted: acceptedOrders,
        completed: completedOrders,
      },
      patientsServed: distinctPatients.length,
    },
    wallet: {
      ...walletSummary,
      commissionRate: getCommissionRateByRole(ROLES.PHARMACY),
    },
    recentOrders,
  };

  // Cache for 5 minutes (300 seconds)
  await setCache(cacheKey, response, 300);

  res.json(response);
});

// Revenue Trends
exports.getRevenueTrends = asyncHandler(async (req, res) => {
  const pharmacyId = toObjectId(req.auth.id);
  const { period = 'monthly', from, to } = req.query;
  
  const cacheKey = generateCacheKey('pharmacy:revenue-trends', {
    pharmacyId: pharmacyId.toString(),
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
    provider: pharmacyId,
    providerRole: ROLES.PHARMACY,
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

  // Optimized aggregation pipeline with explicit field projection
  const revenueTrends = await WalletTransaction.aggregate([
    { $match: matchQuery },
    {
      $project: {
        creditedAt: 1,
        grossAmount: 1,
        commissionAmount: 1,
        netAmount: 1,
        year: { $year: '$creditedAt' },
        month: { $month: '$creditedAt' },
        week: period === 'weekly' ? { $week: '$creditedAt' } : null,
        day: period === 'daily' ? { $dayOfMonth: '$creditedAt' } : null,
      },
    },
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

// Order Trends
exports.getOrderTrends = asyncHandler(async (req, res) => {
  const pharmacyId = toObjectId(req.auth.id);
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
    acceptedBy: pharmacyId,
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

  // Optimized aggregation pipeline with explicit field projection
  const trends = await PharmacyLead.aggregate([
    { $match: matchCriteria },
    {
      $project: {
        status: 1,
        createdAt: 1,
        'billingSummary.totalAmount': 1,
        'billingSummary.deliveryCharge': 1,
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        week: period === 'weekly' ? { $week: '$createdAt' } : null,
        day: period === 'daily' ? { $dayOfMonth: '$createdAt' } : null,
      },
    },
    {
      $group: {
        _id: {
          ...groupBy,
          status: '$status',
        },
        count: { $sum: 1 },
        totalRevenue: { $sum: '$billingSummary.totalAmount' },
        totalDeliveryCharge: { $sum: '$billingSummary.deliveryCharge' },
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
        totalRevenue: { $sum: '$totalRevenue' },
        totalDeliveryCharge: { $sum: '$totalDeliveryCharge' },
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
      totalRevenue: item.totalRevenue || 0,
      totalDeliveryCharge: item.totalDeliveryCharge || 0,
      byStatus: item.statuses.reduce((acc, s) => {
        acc[s.status] = s.count;
        return acc;
      }, {}),
    })),
  });
});

// Patient Growth Chart
exports.getPatientGrowth = asyncHandler(async (req, res) => {
  const pharmacyId = toObjectId(req.auth.id);
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

  // Optimized aggregation pipeline with explicit field projection
  const patientGrowth = await PharmacyLead.aggregate([
    {
      $match: {
        acceptedBy: pharmacyId,
        status: PHARMACY_LEAD_STATUS.COMPLETED,
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $project: {
        patient: 1,
        createdAt: 1,
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        week: period === 'weekly' ? { $week: '$createdAt' } : null,
        day: period === 'daily' ? { $dayOfMonth: '$createdAt' } : null,
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

// Peak Hours Analysis
exports.getPeakHours = asyncHandler(async (req, res) => {
  const pharmacyId = toObjectId(req.auth.id);
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

  // Optimized aggregation pipeline with explicit field projection
  const peakHours = await PharmacyLead.aggregate([
    {
      $match: {
        acceptedBy: pharmacyId,
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $nin: [PHARMACY_LEAD_STATUS.CANCELLED] },
      },
    },
    {
      $project: {
        createdAt: 1,
        hour: { $hour: '$createdAt' },
        dayOfWeek: { $dayOfWeek: '$createdAt' },
      },
    },
    {
      $group: {
        _id: {
          hour: '$hour',
          dayOfWeek: '$dayOfWeek',
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.hour',
        totalOrders: { $sum: '$count' },
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
      totalOrders: item.totalOrders,
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
  const pharmacyId = toObjectId(req.auth.id);
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
      orders,
      completedOrders,
      revenue,
      newPatients,
    ] = await Promise.all([
      PharmacyLead.countDocuments({
        acceptedBy: pharmacyId,
        createdAt: { $gte: periodStart, $lt: periodEnd },
        status: { $nin: [PHARMACY_LEAD_STATUS.CANCELLED] },
      }),
      PharmacyLead.countDocuments({
        acceptedBy: pharmacyId,
        status: PHARMACY_LEAD_STATUS.COMPLETED,
        updatedAt: { $gte: periodStart, $lt: periodEnd },
      }),
      WalletTransaction.aggregate([
        {
          $match: {
            provider: pharmacyId,
            providerRole: ROLES.PHARMACY,
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
      PharmacyLead.distinct('patient', {
        acceptedBy: pharmacyId,
        status: PHARMACY_LEAD_STATUS.COMPLETED,
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
      orders,
      completedOrders,
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
      orders: previous.orders > 0
        ? ((period.orders - previous.orders) / previous.orders) * 100
        : period.orders > 0 ? 100 : 0,
      completedOrders: previous.completedOrders > 0
        ? ((period.completedOrders - previous.completedOrders) / previous.completedOrders) * 100
        : period.completedOrders > 0 ? 100 : 0,
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
  const pharmacyId = toObjectId(req.auth.id);
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

  // Get pharmacy info
  const Pharmacy = require('../../models/Pharmacy');
  const pharmacy = await Pharmacy.findById(pharmacyId).select('pharmacyName ownerName address').lean();

  // Fetch analytics data
  const [
    revenueData,
    patientGrowthData,
    orderData,
    completedOrderData,
    peakHoursData,
  ] = await Promise.all([
    WalletTransaction.aggregate([
      {
        $match: {
          provider: pharmacyId,
          providerRole: ROLES.PHARMACY,
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
    PharmacyLead.distinct('patient', {
      acceptedBy: pharmacyId,
      status: PHARMACY_LEAD_STATUS.COMPLETED,
      createdAt: { $gte: startDate, $lte: endDate },
    }),
    PharmacyLead.countDocuments({
      acceptedBy: pharmacyId,
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $nin: [PHARMACY_LEAD_STATUS.CANCELLED] },
    }),
    PharmacyLead.countDocuments({
      acceptedBy: pharmacyId,
      status: PHARMACY_LEAD_STATUS.COMPLETED,
      updatedAt: { $gte: startDate, $lte: endDate },
    }),
    PharmacyLead.aggregate([
      {
        $match: {
          acceptedBy: pharmacyId,
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $nin: [PHARMACY_LEAD_STATUS.CANCELLED] },
        },
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const revenue = revenueData[0] || { totalGross: 0, totalNet: 0, totalCommission: 0, count: 0 };

  if (format.toLowerCase() === 'pdf') {
    const doc = new PDFDocument();
    const fileName = `pharmacy-analytics-report-${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), 'backend', 'uploads', 'reports', fileName);
    const uploadsDir = path.dirname(filePath);

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('Pharmacy Analytics Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Pharmacy: ${pharmacy.pharmacyName}`, { align: 'center' });
    if (pharmacy.ownerName) {
      doc.text(`Owner: ${pharmacy.ownerName}`, { align: 'center' });
    }
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
    doc.text(`Total Orders: ${orderData}`);
    doc.text(`Completed Orders: ${completedOrderData}`);
    doc.text(`New Patients: ${patientGrowthData.length}`);
    doc.moveDown();

    // Peak Hours
    if (peakHoursData.length > 0) {
      doc.fontSize(16).text('Peak Hours', { underline: true });
      doc.fontSize(12);
      peakHoursData.forEach((item, index) => {
        doc.text(`${index + 1}. Hour ${item._id}:00 - ${item.count} orders`);
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
    worksheet.getCell('A1').value = 'Pharmacy Analytics Report';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.getCell('A2').value = 'Pharmacy:';
    worksheet.getCell('B2').value = pharmacy.pharmacyName;
    if (pharmacy.ownerName) {
      worksheet.getCell('A3').value = 'Owner:';
      worksheet.getCell('B3').value = pharmacy.ownerName;
      worksheet.getCell('A4').value = 'Period:';
      worksheet.getCell('B4').value = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    } else {
      worksheet.getCell('A3').value = 'Period:';
      worksheet.getCell('B3').value = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    }

    // Revenue Section
    let row = pharmacy.ownerName ? 5 : 4;
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
    worksheet.getCell(`A${row}`).value = 'Total Orders';
    worksheet.getCell(`B${row}`).value = orderData;
    row++;
    worksheet.getCell(`A${row}`).value = 'Completed Orders';
    worksheet.getCell(`B${row}`).value = completedOrderData;
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
      worksheet.getCell(`B${row}`).value = 'Orders';
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

    const fileName = `pharmacy-analytics-report-${Date.now()}.xlsx`;
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
    csvRows.push('Pharmacy Analytics Report');
    csvRows.push(`Pharmacy,${pharmacy.pharmacyName}`);
    if (pharmacy.ownerName) {
      csvRows.push(`Owner,${pharmacy.ownerName}`);
    }
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
    csvRows.push(`Total Orders,${orderData}`);
    csvRows.push(`Completed Orders,${completedOrderData}`);
    csvRows.push(`New Patients,${patientGrowthData.length}`);
    if (peakHoursData.length > 0) {
      csvRows.push('');
      csvRows.push('Peak Hours');
      csvRows.push('Hour,Orders');
      peakHoursData.forEach((item) => {
        csvRows.push(`${item._id}:00,${item.count}`);
      });
    }

    const csvContent = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="pharmacy-analytics-report-${Date.now()}.csv"`);
    return res.send(csvContent);
  }
});

