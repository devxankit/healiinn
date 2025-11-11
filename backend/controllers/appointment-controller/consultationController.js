const asyncHandler = require('../../middleware/asyncHandler');
const { ROLES, CONSULTATION_STATUS, TOKEN_STATUS } = require('../../utils/constants');
const Consultation = require('../../models/Consultation');
const SessionToken = require('../../models/SessionToken');
const queueService = require('../../services/appointmentQueueService');

const ensureDoctorOwnership = async ({ consultationId, doctorId }) => {
  const consultation = await Consultation.findById(consultationId);
  if (!consultation) {
    const error = new Error('Consultation not found');
    error.status = 404;
    throw error;
  }
  if (consultation.doctor.toString() !== doctorId.toString()) {
    const error = new Error('Consultation does not belong to the doctor');
    error.status = 403;
    throw error;
  }
  return consultation;
};

exports.getConsultation = asyncHandler(async (req, res) => {
  const consultation = await Consultation.findById(req.params.consultationId)
    .populate('doctor', 'firstName lastName')
    .populate('patient', 'firstName lastName')
    .populate('session')
    .populate('token');

  if (!consultation) {
    return res.status(404).json({ success: false, message: 'Consultation not found' });
  }

  const { role, id } = req.auth;
  if (
    role === ROLES.DOCTOR &&
    consultation.doctor._id.toString() !== id.toString()
  ) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  if (
    role === ROLES.PATIENT &&
    consultation.patient._id.toString() !== id.toString()
  ) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  res.json({ success: true, consultation });
});

exports.updateConsultation = asyncHandler(async (req, res) => {
  const consultation = await ensureDoctorOwnership({
    consultationId: req.params.consultationId,
    doctorId: req.auth.id,
  });

  consultation.notes = {
    ...consultation.notes,
    ...req.body.notes,
  };
  consultation.diagnosis = {
    ...consultation.diagnosis,
    ...req.body.diagnosis,
  };
  consultation.vitals = {
    ...consultation.vitals,
    ...req.body.vitals,
  };
  if (req.body.followUpAt) {
    consultation.followUpAt = new Date(req.body.followUpAt);
  }

  await consultation.save();

  res.json({
    success: true,
    consultation,
  });
});

exports.completeConsultation = asyncHandler(async (req, res) => {
  const consultation = await ensureDoctorOwnership({
    consultationId: req.params.consultationId,
    doctorId: req.auth.id,
  });

  consultation.status = CONSULTATION_STATUS.COMPLETED;
  consultation.completedAt = new Date();
  await consultation.save();

  if (consultation.token) {
    await queueService.updateTokenStatus({
      tokenId: consultation.token,
      doctorId: req.auth.id,
      status: TOKEN_STATUS.COMPLETED,
      notes: req.body.notes,
      io: req.app.get('io'),
    });
  }

  res.json({
    success: true,
    consultation,
  });
});

exports.listDoctorConsultations = asyncHandler(async (req, res) => {
  const consultations = await Consultation.find({ doctor: req.auth.id })
    .populate('patient', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({
    success: true,
    consultations,
  });
});

exports.getConsultationsForToken = asyncHandler(async (req, res) => {
  const token = await SessionToken.findById(req.params.tokenId);

  if (!token) {
    return res.status(404).json({ success: false, message: 'Token not found' });
  }

  if (req.auth.role === ROLES.PATIENT && token.patient.toString() !== req.auth.id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const consultation = await Consultation.findOne({ token: token._id });

  res.json({
    success: true,
    consultation,
  });
});

