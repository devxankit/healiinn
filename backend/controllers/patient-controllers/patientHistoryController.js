const asyncHandler = require('../../middleware/asyncHandler');
const Prescription = require('../../models/Prescription');
const LabReport = require('../../models/LabReport');
const Appointment = require('../../models/Appointment');

// Helper function for pagination
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/patients/history - Complete medical history
exports.getCompleteHistory = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { page, limit, skip } = buildPagination(req);

  const [prescriptions, reports, appointments, prescriptionCount, reportCount, appointmentCount] = await Promise.all([
    Prescription.find({ patientId: id })
      .populate('doctorId', 'firstName lastName specialization')
      .populate('consultationId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    LabReport.find({ patientId: id })
      .populate('laboratoryId', 'labName')
      .populate('orderId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Appointment.find({ patientId: id })
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ appointmentDate: -1 })
      .skip(skip)
      .limit(limit),
    Prescription.countDocuments({ patientId: id }),
    LabReport.countDocuments({ patientId: id }),
    Appointment.countDocuments({ patientId: id }),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      prescriptions: {
        items: prescriptions,
        pagination: {
          page,
          limit,
          total: prescriptionCount,
          totalPages: Math.ceil(prescriptionCount / limit) || 1,
        },
      },
      labTests: {
        items: reports,
        pagination: {
          page,
          limit,
          total: reportCount,
          totalPages: Math.ceil(reportCount / limit) || 1,
        },
      },
      appointments: {
        items: appointments,
        pagination: {
          page,
          limit,
          total: appointmentCount,
          totalPages: Math.ceil(appointmentCount / limit) || 1,
        },
      },
    },
  });
});

// GET /api/patients/history/prescriptions - Prescription history
exports.getPrescriptionHistory = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { page, limit, skip } = buildPagination(req);

  const [prescriptions, total] = await Promise.all([
    Prescription.find({ patientId: id })
      .populate('doctorId', 'firstName lastName specialization')
      .populate('consultationId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Prescription.countDocuments({ patientId: id }),
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

// GET /api/patients/history/lab-tests - Lab test history
exports.getLabTestHistory = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { page, limit, skip } = buildPagination(req);

  const [reports, total] = await Promise.all([
    LabReport.find({ patientId: id })
      .populate('laboratoryId', 'labName')
      .populate('orderId')
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

// GET /api/patients/history/appointments - Appointment history
exports.getAppointmentHistory = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { page, limit, skip } = buildPagination(req);

  const [appointments, total] = await Promise.all([
    Appointment.find({ patientId: id })
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ appointmentDate: -1 })
      .skip(skip)
      .limit(limit),
    Appointment.countDocuments({ patientId: id }),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

