const asyncHandler = require('../../middleware/asyncHandler');
const LabReport = require('../../models/LabReport');
const Order = require('../../models/Order');
const { generateLabReportPDF, uploadLabReportPDF } = require('../../services/pdfService');
const { createReportNotification } = require('../../services/inAppNotificationService');
const { ROLES } = require('../../utils/constants');
const Laboratory = require('../../models/Laboratory');
const Patient = require('../../models/Patient');
const { getIO } = require('../../config/socket');
const { sendLabReportReadyEmail } = require('../../services/notificationService');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/laboratory/reports
exports.getReports = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { status } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { laboratoryId: id };
  if (status) filter.status = status;

  const [reports, total] = await Promise.all([
    LabReport.find(filter)
      .populate('patientId', 'firstName lastName phone profileImage')
      .populate('orderId', 'createdAt totalAmount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    LabReport.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// POST /api/laboratory/reports
exports.createReport = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { orderId, testName, results, notes } = req.body;

  if (!orderId || !testName) {
    return res.status(400).json({
      success: false,
      message: 'Order ID and test name are required',
    });
  }

  // Verify order belongs to laboratory
  const order = await Order.findOne({
    _id: orderId,
    providerId: id,
    providerType: 'laboratory',
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  // Check if report already exists
  const existingReport = await LabReport.findOne({ orderId });
  if (existingReport) {
    return res.status(400).json({
      success: false,
      message: 'Report already exists for this order',
    });
  }

  // Get laboratory and patient data for PDF
  const laboratory = await Laboratory.findById(id);
  const patient = await Patient.findById(order.patientId);

  // Create report
  const reportData = {
    orderId,
    patientId: order.patientId,
    laboratoryId: id,
    testName,
    results: results || [],
    notes: notes || '',
    status: 'pending',
    reportDate: new Date(),
  };

  const report = await LabReport.create(reportData);

  // Generate and upload PDF
  try {
    const pdfBuffer = await generateLabReportPDF(
      { ...reportData, createdAt: report.createdAt },
      laboratory.toObject(),
      patient.toObject()
    );
    const pdfUrl = await uploadLabReportPDF(pdfBuffer, 'healiinn/reports', `report_${report._id}`);
    report.pdfFileUrl = pdfUrl;
    report.status = 'completed';
    await report.save();
  } catch (error) {
    console.error('PDF generation error:', error);
    // Continue even if PDF generation fails
  }

  // Update order status
  order.status = 'ready';
  await order.save();

  // Emit real-time event
  try {
    const io = getIO();
    io.to(`patient-${order.patientId}`).emit('report:created', {
      report: await LabReport.findById(report._id)
        .populate('laboratoryId', 'labName'),
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  // Send email notification to patient
  try {
    const populatedReport = await LabReport.findById(report._id)
      .populate('patientId', 'firstName lastName')
      .populate('orderId');

    await sendLabReportReadyEmail({
      patient,
      report: populatedReport,
      laboratory,
    }).catch((error) => console.error('Error sending lab report ready email:', error));
  } catch (error) {
    console.error('Error sending email notifications:', error);
  }

  // Create in-app notification for patient
  try {
    await createReportNotification({
      userId: order.patientId,
      userType: ROLES.PATIENT,
      report: report._id,
    }).catch((error) => console.error('Error creating report notification:', error));
  } catch (error) {
    console.error('Error creating in-app notification:', error);
  }

  return res.status(201).json({
    success: true,
    message: 'Report created successfully',
    data: await LabReport.findById(report._id)
      .populate('patientId', 'firstName lastName')
      .populate('orderId'),
  });
});

// GET /api/laboratory/reports/:id
exports.getReportById = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { reportId } = req.params;

  const report = await LabReport.findOne({
    _id: reportId,
    laboratoryId: id,
  })
    .populate('patientId', 'firstName lastName phone profileImage dateOfBirth')
    .populate('orderId', 'createdAt totalAmount')
    .populate('prescriptionId');

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: report,
  });
});

// PATCH /api/laboratory/reports/:id
exports.updateReport = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { reportId } = req.params;
  const { results, notes, status } = req.body;

  const report = await LabReport.findOne({
    _id: reportId,
    laboratoryId: id,
  });

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found',
    });
  }

  if (report.status === 'completed' || report.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update completed or cancelled report',
    });
  }

  if (results) report.results = results;
  if (notes) report.notes = notes;
  if (status) report.status = status;

  await report.save();

  // Emit real-time event
  try {
    const io = getIO();
    io.to(`patient-${report.patientId}`).emit('report:updated', {
      report: await LabReport.findById(report._id),
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Report updated successfully',
    data: report,
  });
});

