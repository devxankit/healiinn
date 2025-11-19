const asyncHandler = require('../../middleware/asyncHandler');
const { ROLES } = require('../../utils/constants');
const reportSharingService = require('../../services/reportSharingService');

const ensureRole = (role, allowed) => {
  if (!allowed.includes(role)) {
    const error = new Error('You do not have access to this resource');
    error.status = 403;
    throw error;
  }
};

// Patient endpoints
exports.listMyReports = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const reports = await reportSharingService.listPatientReports({
    patientId: req.auth.id,
  });

  res.json({
    success: true,
    reports,
  });
});

exports.getReport = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const report = await reportSharingService.getReportForPatient({
    reportId: req.params.reportId,
    patientId: req.auth.id,
  });

  res.json({
    success: true,
    report,
  });
});

exports.shareReportWithDoctor = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const { doctorId, appointmentId, notes } = req.body;

  if (!doctorId) {
    const error = new Error('doctorId is required');
    error.status = 400;
    throw error;
  }

  const report = await reportSharingService.shareReportWithDoctor({
    reportId: req.params.reportId,
    patientId: req.auth.id,
    doctorId,
    appointmentId,
    notes,
  });

  res.json({
    success: true,
    message: 'Report shared successfully with doctor',
    report,
  });
});

exports.getReportShareHistory = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const history = await reportSharingService.getReportShareHistory({
    reportId: req.params.reportId,
    patientId: req.auth.id,
  });

  res.json({
    success: true,
    history,
  });
});

// Doctor endpoints
exports.listDoctorReports = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const reports = await reportSharingService.listDoctorReports({
    doctorId: req.auth.id,
  });

  res.json({
    success: true,
    reports,
  });
});

exports.getDoctorReport = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const report = await reportSharingService.getReportForDoctor({
    reportId: req.params.reportId,
    doctorId: req.auth.id,
  });

  res.json({
    success: true,
    report,
  });
});

