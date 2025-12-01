const asyncHandler = require('../../middleware/asyncHandler');
const Prescription = require('../../models/Prescription');
const Consultation = require('../../models/Consultation');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/patients/prescriptions
exports.getPrescriptions = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { status } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { patientId: id };
  if (status) filter.status = status;

  const [prescriptions, total] = await Promise.all([
    Prescription.find(filter)
      .populate('doctorId', 'firstName lastName specialization profileImage')
      .populate('consultationId', 'consultationDate diagnosis')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Prescription.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: prescriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/patients/prescriptions/:id
exports.getPrescriptionById = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { prescriptionId } = req.params;

  const prescription = await Prescription.findOne({
    _id: prescriptionId,
    patientId: id,
  })
    .populate('doctorId', 'firstName lastName specialization profileImage licenseNumber')
    .populate('consultationId', 'consultationDate diagnosis vitals');

  if (!prescription) {
    return res.status(404).json({
      success: false,
      message: 'Prescription not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: prescription,
  });
});

// GET /api/patients/reports
exports.getReports = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { page, limit, skip } = buildPagination(req);

  const LabReport = require('../../models/LabReport');

  const [reports, total] = await Promise.all([
    LabReport.find({ patientId: id })
      .populate('laboratoryId', 'labName address')
      .populate('orderId', 'createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    LabReport.countDocuments({ patientId: id }),
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

// GET /api/patients/reports/:id/download
exports.downloadReport = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { reportId } = req.params;

  const LabReport = require('../../models/LabReport');

  const report = await LabReport.findOne({
    _id: reportId,
    patientId: id,
  });

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found',
    });
  }

  if (!report.pdfFileUrl) {
    return res.status(404).json({
      success: false,
      message: 'Report PDF not available',
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      pdfUrl: report.pdfFileUrl,
    },
  });
});

