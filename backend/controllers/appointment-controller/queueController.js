const asyncHandler = require('../../middleware/asyncHandler');
const { ROLES, SESSION_STATUS } = require('../../utils/constants');
const queueService = require('../../services/appointmentQueueService');

const ensureRole = (role, allowed) => {
  if (!allowed.includes(role)) {
    const error = new Error('You do not have access to this resource');
    error.status = 403;
    throw error;
  }
};

exports.createClinic = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const clinic = await queueService.createClinic({
    doctorId: req.auth.id,
    payload: req.body,
  });

  res.status(201).json({
    success: true,
    clinic,
  });
});

exports.listClinics = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const clinics = await queueService.listClinics({ doctorId: req.auth.id });

  res.json({
    success: true,
    clinics,
  });
});

exports.createSession = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const session = await queueService.createSession({
    doctorId: req.auth.id,
    clinicId: req.body.clinicId,
    payload: req.body,
  });

  res.status(201).json({
    success: true,
    session,
  });
});

exports.startSession = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const session = await queueService.updateSessionStatus({
    sessionId: req.params.sessionId,
    doctorId: req.auth.id,
    status: SESSION_STATUS.LIVE,
  });

  const state = await queueService.getSessionState({
    sessionId: session._id,
    io: req.app.get('io'),
  });

  res.json({
    success: true,
    session,
    state,
  });
});

exports.endSession = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const session = await queueService.endSession({
    sessionId: req.params.sessionId,
    doctorId: req.auth.id,
  });

  res.json({
    success: true,
    session,
  });
});

exports.cancelSession = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const session = await queueService.cancelSession({
    sessionId: req.params.sessionId,
    doctorId: req.auth.id,
  });

  res.json({
    success: true,
    session,
  });
});

exports.getSessionDetails = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR, ROLES.ADMIN]);

  const details = await queueService.getSessionDetails({
    sessionId: req.params.sessionId,
  });

  res.json({
    success: true,
    ...details,
  });
});

exports.getSessionState = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR, ROLES.PATIENT, ROLES.ADMIN]);

  const state = await queueService.getSessionState({
    sessionId: req.params.sessionId,
    io: req.app.get('io'),
  });

  res.json({
    success: true,
    state,
  });
});

exports.listDoctorSessions = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const sessions = await queueService.listDoctorSessions({
    doctorId: req.auth.id,
    status: req.query.status,
  });

  res.json({
    success: true,
    sessions,
  });
});

exports.listPatientTokens = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const tokens = await queueService.listPatientTokens({
    patientId: req.auth.id,
  });

  res.json({
    success: true,
    tokens,
  });
});

exports.issueToken = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT, ROLES.ADMIN]);

  const patientId = req.auth.role === ROLES.PATIENT ? req.auth.id : req.body.patientId;

  if (!patientId) {
    const error = new Error('patientId is required');
    error.status = 400;
    throw error;
  }

  const result = await queueService.issueToken({
    sessionId: req.params.sessionId,
    patientId,
    notes: req.body.notes,
    reason: req.body.reason,
    createdByRole: req.auth.role,
    priority: Number(req.body.priority) || 0,
    priorityReason: req.body.priorityReason,
    dynamicBufferMinutes: Number(req.body.dynamicBufferMinutes) || 0,
    paymentId: req.body.paymentId,
    metadata: req.body.metadata,
    io: req.app.get('io'),
  });

  res.status(201).json({
    success: true,
    ...result,
  });
});

exports.checkinToken = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const result = await queueService.checkinToken({
    tokenId: req.params.tokenId,
    patientId: req.auth.id,
    io: req.app.get('io'),
  });

  res.json({
    success: true,
    ...result,
  });
});

exports.cancelToken = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT, ROLES.ADMIN]);

  const result = await queueService.cancelToken({
    tokenId: req.params.tokenId,
    actorId: req.auth.id,
    actorRole: req.auth.role,
    reason: req.body.reason,
    io: req.app.get('io'),
  });

  res.json({
    success: true,
    ...result,
  });
});

exports.pauseSession = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const session = await queueService.pauseSession({
    sessionId: req.params.sessionId,
    doctorId: req.auth.id,
    reason: req.body.reason,
    resumeAt: req.body.resumeAt,
    io: req.app.get('io'),
  });

  res.json({
    success: true,
    session,
  });
});

exports.resumeSession = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const session = await queueService.resumeSession({
    sessionId: req.params.sessionId,
    doctorId: req.auth.id,
    io: req.app.get('io'),
  });

  res.json({
    success: true,
    session,
  });
});

exports.updateTokenStatus = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const result = await queueService.updateTokenStatus({
    tokenId: req.params.tokenId,
    doctorId: req.auth.id,
    status: req.body.status,
    notes: req.body.notes,
    io: req.app.get('io'),
  });

  res.json({
    success: true,
    ...result,
  });
});

exports.getTokenDetails = asyncHandler(async (req, res) => {
  const token = await queueService.getTokenDetails({
    tokenId: req.params.tokenId,
    actorId: req.auth.id,
    role: req.auth.role,
  });

  res.json({
    success: true,
    token,
  });
});

