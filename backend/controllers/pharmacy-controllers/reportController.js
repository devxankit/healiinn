const asyncHandler = require('../../middleware/asyncHandler');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { ROLES, PHARMACY_LEAD_STATUS } = require('../../utils/constants');
const { getPaginationParams } = require('../../utils/pagination');
const { getCache, setCache, generateCacheKey } = require('../../utils/cache');
const PharmacyLead = require('../../models/PharmacyLead');
const WalletTransaction = require('../../models/WalletTransaction');
const Review = require('../../models/Review');
const Pharmacy = require('../../models/Pharmacy');

const toObjectId = (value) =>
  typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value;

const ensureRole = (role, allowed) => {
  if (!allowed.includes(role)) {
    const error = new Error('You do not have access to this resource');
    error.status = 403;
    throw error;
  }
};

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

// Detailed Analytics Report
exports.getDetailedAnalytics = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PHARMACY]);

  const pharmacyId = toObjectId(req.auth.id);
  const { from, to, reportType = 'comprehensive' } = req.query;

  let startDate, endDate;
  if (from && to) {
    startDate = new Date(from);
    endDate = new Date(to);
  } else {
    const now = new Date();
    startDate = addMonths(now, -3);
    endDate = now;
  }

  const cacheKey = generateCacheKey('pharmacy:reports:analytics', {
    pharmacyId: pharmacyId.toString(),
    from: startDate.toISOString(),
    to: endDate.toISOString(),
    reportType,
  });

  // Try to get from cache first (cache for 10 minutes)
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  const orderQuery = {
    $or: [
      { acceptedBy: pharmacyId },
      { preferredPharmacies: pharmacyId },
    ],
    createdAt: { $gte: startDate, $lte: endDate },
  };

  const transactionQuery = {
    provider: pharmacyId,
    providerRole: ROLES.PHARMACY,
    creditedAt: { $gte: startDate, $lte: endDate },
  };

  const reviewQuery = {
    target: pharmacyId,
    targetRole: ROLES.PHARMACY,
    createdAt: { $gte: startDate, $lte: endDate },
  };

  // Get comprehensive analytics
  const [
    orderStats,
    revenueStats,
    statusBreakdown,
    patientStats,
    reviewStats,
    topMedicines,
    dailyTrends,
  ] = await Promise.all([
    // Order Statistics (optimized with explicit field projection)
    PharmacyLead.aggregate([
      { $match: orderQuery },
      {
        $project: {
          status: 1,
          'billingSummary.totalAmount': 1,
          'billingSummary.deliveryCharge': 1,
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', PHARMACY_LEAD_STATUS.COMPLETED] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', PHARMACY_LEAD_STATUS.CANCELLED] }, 1, 0] },
          },
          totalRevenue: { $sum: '$billingSummary.totalAmount' },
          totalDeliveryCharge: { $sum: '$billingSummary.deliveryCharge' },
          averageOrderValue: { $avg: '$billingSummary.totalAmount' },
        },
      },
    ]),

    // Revenue Statistics (optimized with explicit field projection)
    WalletTransaction.aggregate([
      { $match: transactionQuery },
      {
        $project: {
          grossAmount: 1,
          netAmount: 1,
          commissionAmount: 1,
        },
      },
      {
        $group: {
          _id: null,
          totalGross: { $sum: '$grossAmount' },
          totalNet: { $sum: '$netAmount' },
          totalCommission: { $sum: '$commissionAmount' },
          transactionCount: { $sum: 1 },
        },
      },
    ]),

    // Status Breakdown (optimized with explicit field projection)
    PharmacyLead.aggregate([
      { $match: orderQuery },
      {
        $project: {
          status: 1,
          'billingSummary.totalAmount': 1,
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$billingSummary.totalAmount' },
        },
      },
    ]),

    // Patient Statistics (optimized with explicit field projection)
    PharmacyLead.aggregate([
      { $match: orderQuery },
      {
        $project: {
          patient: 1,
        },
      },
      {
        $group: {
          _id: '$patient',
        },
      },
      {
        $group: {
          _id: null,
          uniquePatients: { $sum: 1 },
        },
      },
    ]),

    // Review Statistics (optimized with explicit field projection)
    Review.aggregate([
      { $match: reviewQuery },
      {
        $project: {
          rating: 1,
          'reply.message': 1,
        },
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          reviewsWithReply: {
            $sum: { $cond: [{ $ifNull: ['$reply.message', false] }, 1, 0] },
          },
        },
      },
    ]),

    // Top Medicines (by frequency) - optimized with explicit field projection
    PharmacyLead.aggregate([
      { $match: orderQuery },
      {
        $project: {
          medicines: 1,
        },
      },
      { $unwind: '$medicines' },
      {
        $project: {
          medicineName: '$medicines.name',
          quantity: '$medicines.quantity',
        },
      },
      {
        $group: {
          _id: '$medicineName',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),

    // Daily Trends (optimized with explicit field projection)
    PharmacyLead.aggregate([
      { $match: orderQuery },
      {
        $project: {
          createdAt: 1,
          'billingSummary.totalAmount': 1,
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
      },
      {
        $group: {
          _id: {
            year: '$year',
            month: '$month',
            day: '$day',
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$billingSummary.totalAmount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      { $limit: 30 },
    ]),
  ]);

  const orderData = orderStats[0] || {
    totalOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    totalDeliveryCharge: 0,
    averageOrderValue: 0,
  };

  const revenueData = revenueStats[0] || {
    totalGross: 0,
    totalNet: 0,
    totalCommission: 0,
    transactionCount: 0,
  };

  const patientData = patientStats[0] || { uniquePatients: 0 };
  const reviewData = reviewStats[0] || {
    totalReviews: 0,
    averageRating: 0,
    reviewsWithReply: 0,
  };

  const response = {
    success: true,
    period: {
      from: startDate,
      to: endDate,
    },
    analytics: {
      orders: {
        total: orderData.totalOrders,
        completed: orderData.completedOrders,
        cancelled: orderData.cancelledOrders,
        completionRate:
          orderData.totalOrders > 0
            ? Number.parseFloat(
                ((orderData.completedOrders / orderData.totalOrders) * 100).toFixed(2)
              )
            : 0,
        averageOrderValue: Number.parseFloat((orderData.averageOrderValue || 0).toFixed(2)),
        statusBreakdown: statusBreakdown.map((item) => ({
          status: item._id,
          count: item.count,
          revenue: item.revenue || 0,
        })),
      },
      revenue: {
        gross: revenueData.totalGross,
        net: revenueData.totalNet,
        commission: revenueData.totalCommission,
        transactionCount: revenueData.transactionCount,
        fromOrders: orderData.totalRevenue || 0,
        deliveryCharges: orderData.totalDeliveryCharge || 0,
      },
      patients: {
        uniquePatients: patientData.uniquePatients,
        averageOrdersPerPatient:
          patientData.uniquePatients > 0
            ? Number.parseFloat(
                ((orderData.totalOrders / patientData.uniquePatients) * 100).toFixed(2)
              )
            : 0,
      },
      reviews: {
        total: reviewData.totalReviews,
        averageRating: Number.parseFloat((reviewData.averageRating || 0).toFixed(2)),
        reviewsWithReply: reviewData.reviewsWithReply,
        replyRate:
          reviewData.totalReviews > 0
            ? Number.parseFloat(
                ((reviewData.reviewsWithReply / reviewData.totalReviews) * 100).toFixed(2)
              )
            : 0,
      },
      topMedicines: topMedicines.map((item) => ({
        name: item._id,
        orderCount: item.count,
        totalQuantity: item.totalQuantity,
      })),
      dailyTrends: dailyTrends.map((item) => ({
        date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
        orders: item.orders,
        revenue: item.revenue || 0,
      })),
    },
  };

  // Cache for 10 minutes (600 seconds)
  await setCache(cacheKey, response, 600);

  res.json(response);
});

// Export Detailed Report
exports.exportDetailedReport = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PHARMACY]);

  const pharmacyId = toObjectId(req.auth.id);
  const { format = 'excel', from, to } = req.query;

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
  const pharmacy = await Pharmacy.findById(pharmacyId).select('pharmacyName ownerName').lean();

  // Get analytics data (reuse the detailed analytics logic)
  const orderQuery = {
    $or: [
      { acceptedBy: pharmacyId },
      { preferredPharmacies: pharmacyId },
    ],
    createdAt: { $gte: startDate, $lte: endDate },
  };

  const [orderStats, revenueStats, statusBreakdown, patientStats, reviewStats] =
    await Promise.all([
      PharmacyLead.aggregate([
        { $match: orderQuery },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            completedOrders: {
              $sum: { $cond: [{ $eq: ['$status', PHARMACY_LEAD_STATUS.COMPLETED] }, 1, 0] },
            },
            totalRevenue: { $sum: '$billingSummary.totalAmount' },
          },
        },
      ]),
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
          },
        },
      ]),
      PharmacyLead.aggregate([
        { $match: orderQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      PharmacyLead.aggregate([
        { $match: orderQuery },
        { $group: { _id: '$patient' } },
        { $group: { _id: null, uniquePatients: { $sum: 1 } } },
      ]),
      Review.aggregate([
        {
          $match: {
            target: pharmacyId,
            targetRole: ROLES.PHARMACY,
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            averageRating: { $avg: '$rating' },
          },
        },
      ]),
    ]);

  const orderData = orderStats[0] || { totalOrders: 0, completedOrders: 0, totalRevenue: 0 };
  const revenueData = revenueStats[0] || { totalGross: 0, totalNet: 0, totalCommission: 0 };
  const patientData = patientStats[0] || { uniquePatients: 0 };
  const reviewData = reviewStats[0] || { totalReviews: 0, averageRating: 0 };

  if (format.toLowerCase() === 'pdf') {
    const doc = new PDFDocument();
    const fileName = `pharmacy-detailed-report-${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), 'backend', 'uploads', 'reports', fileName);
    const uploadsDir = path.dirname(filePath);

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('Detailed Pharmacy Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Pharmacy: ${pharmacy.pharmacyName}`, { align: 'center' });
    if (pharmacy.ownerName) {
      doc.text(`Owner: ${pharmacy.ownerName}`, { align: 'center' });
    }
    doc.text(`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();

    // Order Statistics
    doc.fontSize(16).text('Order Statistics', { underline: true });
    doc.fontSize(12);
    doc.text(`Total Orders: ${orderData.totalOrders}`);
    doc.text(`Completed Orders: ${orderData.completedOrders}`);
    doc.text(`Completion Rate: ${orderData.totalOrders > 0 ? ((orderData.completedOrders / orderData.totalOrders) * 100).toFixed(2) : 0}%`);
    doc.moveDown();

    // Revenue Statistics
    doc.fontSize(16).text('Revenue Statistics', { underline: true });
    doc.fontSize(12);
    doc.text(`Total Gross Revenue: ₹${revenueData.totalGross.toFixed(2)}`);
    doc.text(`Total Net Revenue: ₹${revenueData.totalNet.toFixed(2)}`);
    doc.text(`Total Commission: ₹${revenueData.totalCommission.toFixed(2)}`);
    doc.text(`Revenue from Orders: ₹${orderData.totalRevenue.toFixed(2)}`);
    doc.moveDown();

    // Patient Statistics
    doc.fontSize(16).text('Patient Statistics', { underline: true });
    doc.fontSize(12);
    doc.text(`Unique Patients: ${patientData.uniquePatients}`);
    doc.moveDown();

    // Review Statistics
    doc.fontSize(16).text('Review Statistics', { underline: true });
    doc.fontSize(12);
    doc.text(`Total Reviews: ${reviewData.totalReviews}`);
    doc.text(`Average Rating: ${reviewData.averageRating.toFixed(2)}`);

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
    const worksheet = workbook.addWorksheet('Detailed Report');

    // Header
    worksheet.mergeCells('A1:D1');
    worksheet.getCell('A1').value = 'Detailed Pharmacy Report';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.getCell('A2').value = 'Pharmacy:';
    worksheet.getCell('B2').value = pharmacy.pharmacyName;
    worksheet.getCell('A3').value = 'Period:';
    worksheet.getCell('B3').value = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

    // Order Statistics
    let row = 5;
    worksheet.getCell(`A${row}`).value = 'Order Statistics';
    worksheet.getCell(`A${row}`).font = { bold: true };
    row++;
    worksheet.getCell(`A${row}`).value = 'Total Orders';
    worksheet.getCell(`B${row}`).value = orderData.totalOrders;
    row++;
    worksheet.getCell(`A${row}`).value = 'Completed Orders';
    worksheet.getCell(`B${row}`).value = orderData.completedOrders;
    row++;
    worksheet.getCell(`A${row}`).value = 'Completion Rate';
    worksheet.getCell(`B${row}`).value = `${orderData.totalOrders > 0 ? ((orderData.completedOrders / orderData.totalOrders) * 100).toFixed(2) : 0}%`;

    // Revenue Statistics
    row += 2;
    worksheet.getCell(`A${row}`).value = 'Revenue Statistics';
    worksheet.getCell(`A${row}`).font = { bold: true };
    row++;
    worksheet.getCell(`A${row}`).value = 'Total Gross Revenue';
    worksheet.getCell(`B${row}`).value = `₹${revenueData.totalGross.toFixed(2)}`;
    row++;
    worksheet.getCell(`A${row}`).value = 'Total Net Revenue';
    worksheet.getCell(`B${row}`).value = `₹${revenueData.totalNet.toFixed(2)}`;
    row++;
    worksheet.getCell(`A${row}`).value = 'Total Commission';
    worksheet.getCell(`B${row}`).value = `₹${revenueData.totalCommission.toFixed(2)}`;

    // Patient Statistics
    row += 2;
    worksheet.getCell(`A${row}`).value = 'Patient Statistics';
    worksheet.getCell(`A${row}`).font = { bold: true };
    row++;
    worksheet.getCell(`A${row}`).value = 'Unique Patients';
    worksheet.getCell(`B${row}`).value = patientData.uniquePatients;

    // Review Statistics
    row += 2;
    worksheet.getCell(`A${row}`).value = 'Review Statistics';
    worksheet.getCell(`A${row}`).font = { bold: true };
    row++;
    worksheet.getCell(`A${row}`).value = 'Total Reviews';
    worksheet.getCell(`B${row}`).value = reviewData.totalReviews;
    row++;
    worksheet.getCell(`A${row}`).value = 'Average Rating';
    worksheet.getCell(`B${row}`).value = reviewData.averageRating.toFixed(2);

    // Status Breakdown
    if (statusBreakdown.length > 0) {
      row += 2;
      worksheet.getCell(`A${row}`).value = 'Status Breakdown';
      worksheet.getCell(`A${row}`).font = { bold: true };
      row++;
      worksheet.getCell(`A${row}`).value = 'Status';
      worksheet.getCell(`B${row}`).value = 'Count';
      worksheet.getCell(`A${row}`).font = { bold: true };
      worksheet.getCell(`B${row}`).font = { bold: true };
      statusBreakdown.forEach((item) => {
        row++;
        worksheet.getCell(`A${row}`).value = item._id;
        worksheet.getCell(`B${row}`).value = item.count;
      });
    }

    worksheet.columns.forEach((column) => {
      column.width = 25;
    });

    const fileName = `pharmacy-detailed-report-${Date.now()}.xlsx`;
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
    csvRows.push('Detailed Pharmacy Report');
    csvRows.push(`Pharmacy,${pharmacy.pharmacyName}`);
    csvRows.push(`Period,${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
    csvRows.push('');
    csvRows.push('Order Statistics');
    csvRows.push('Metric,Value');
    csvRows.push(`Total Orders,${orderData.totalOrders}`);
    csvRows.push(`Completed Orders,${orderData.completedOrders}`);
    csvRows.push(`Completion Rate,${orderData.totalOrders > 0 ? ((orderData.completedOrders / orderData.totalOrders) * 100).toFixed(2) : 0}%`);
    csvRows.push('');
    csvRows.push('Revenue Statistics');
    csvRows.push('Metric,Value');
    csvRows.push(`Total Gross Revenue,₹${revenueData.totalGross.toFixed(2)}`);
    csvRows.push(`Total Net Revenue,₹${revenueData.totalNet.toFixed(2)}`);
    csvRows.push(`Total Commission,₹${revenueData.totalCommission.toFixed(2)}`);
    csvRows.push('');
    csvRows.push('Patient Statistics');
    csvRows.push('Metric,Value');
    csvRows.push(`Unique Patients,${patientData.uniquePatients}`);
    csvRows.push('');
    csvRows.push('Review Statistics');
    csvRows.push('Metric,Value');
    csvRows.push(`Total Reviews,${reviewData.totalReviews}`);
    csvRows.push(`Average Rating,${reviewData.averageRating.toFixed(2)}`);

    const csvContent = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="pharmacy-detailed-report-${Date.now()}.csv"`);
    return res.send(csvContent);
  }
});

// Performance Metrics
exports.getPerformanceMetrics = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PHARMACY]);

  const pharmacyId = toObjectId(req.auth.id);
  const { from, to } = req.query;

  let startDate, endDate;
  if (from && to) {
    startDate = new Date(from);
    endDate = new Date(to);
  } else {
    const now = new Date();
    startDate = addMonths(now, -1);
    endDate = now;
  }

  const orderQuery = {
    $or: [
      { acceptedBy: pharmacyId },
      { preferredPharmacies: pharmacyId },
    ],
    createdAt: { $gte: startDate, $lte: endDate },
  };

  const [
    orderMetrics,
    responseTimeMetrics,
    customerSatisfaction,
  ] = await Promise.all([
    // Order processing metrics (optimized with explicit field projection)
    PharmacyLead.aggregate([
      { $match: orderQuery },
      {
        $project: {
          status: 1,
          createdAt: 1,
          statusHistory: 1,
          timeToAccept: {
            $cond: [
              { $ne: ['$status', PHARMACY_LEAD_STATUS.NEW] },
              {
                $subtract: [
                  { $arrayElemAt: ['$statusHistory.updatedAt', -1] },
                  '$createdAt',
                ],
              },
              null,
            ],
          },
        },
      },
      {
        $project: {
          status: 1,
          timeToAccept: 1,
        },
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$timeToAccept' },
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', PHARMACY_LEAD_STATUS.COMPLETED] }, 1, 0] },
          },
        },
      },
    ]),

    // Response time metrics (optimized with explicit field projection)
    PharmacyLead.aggregate([
      {
        $match: {
          ...orderQuery,
          status: { $ne: PHARMACY_LEAD_STATUS.NEW },
        },
      },
      {
        $project: {
          createdAt: 1,
          statusHistory: 1,
          responseTime: {
            $subtract: [
              { $arrayElemAt: ['$statusHistory.updatedAt', 0] },
              '$createdAt',
            ],
          },
        },
      },
      {
        $project: {
          responseTimeHours: { $divide: ['$responseTime', 3600000] },
        },
      },
      {
        $group: {
          _id: null,
          avgResponseTimeHours: { $avg: '$responseTimeHours' },
          minResponseTimeHours: { $min: '$responseTimeHours' },
          maxResponseTimeHours: { $max: '$responseTimeHours' },
        },
      },
    ]),

    // Customer satisfaction (optimized with explicit field projection)
    Review.aggregate([
      {
        $match: {
          target: pharmacyId,
          targetRole: ROLES.PHARMACY,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $project: {
          rating: 1,
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          positiveReviews: {
            $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const orderData = orderMetrics[0] || {
    avgResponseTime: 0,
    totalOrders: 0,
    completedOrders: 0,
  };

  const responseData = responseTimeMetrics[0] || {
    avgResponseTimeHours: 0,
    minResponseTimeHours: 0,
    maxResponseTimeHours: 0,
  };

  const satisfactionData = customerSatisfaction[0] || {
    averageRating: 0,
    totalReviews: 0,
    positiveReviews: 0,
  };

  const response = {
    success: true,
    period: {
      from: startDate,
      to: endDate,
    },
    metrics: {
      orderProcessing: {
        totalOrders: orderData.totalOrders,
        completedOrders: orderData.completedOrders,
        completionRate:
          orderData.totalOrders > 0
            ? Number.parseFloat(
                ((orderData.completedOrders / orderData.totalOrders) * 100).toFixed(2)
              )
            : 0,
        averageResponseTimeHours: Number.parseFloat(
          (responseData.avgResponseTimeHours || 0).toFixed(2)
        ),
        minResponseTimeHours: Number.parseFloat(
          (responseData.minResponseTimeHours || 0).toFixed(2)
        ),
        maxResponseTimeHours: Number.parseFloat(
          (responseData.maxResponseTimeHours || 0).toFixed(2)
        ),
      },
      customerSatisfaction: {
        averageRating: Number.parseFloat((satisfactionData.averageRating || 0).toFixed(2)),
        totalReviews: satisfactionData.totalReviews,
        positiveReviewRate:
          satisfactionData.totalReviews > 0
            ? Number.parseFloat(
                ((satisfactionData.positiveReviews / satisfactionData.totalReviews) * 100).toFixed(2)
              )
            : 0,
      },
    },
  };

  // Cache for 10 minutes (600 seconds)
  await setCache(cacheKey, response, 600);

  res.json(response);
});

