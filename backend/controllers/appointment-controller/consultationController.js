const asyncHandler = require('../../middleware/asyncHandler');
const { ROLES, CONSULTATION_STATUS, TOKEN_STATUS } = require('../../utils/constants');
const Consultation = require('../../models/Consultation');
const SessionToken = require('../../models/SessionToken');
const Patient = require('../../models/Patient');
const Prescription = require('../../models/Prescription');
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

const mapPatientSummary = (patient) =>
  patient
    ? {
        id: patient._id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        gender: patient.gender || null,
        dateOfBirth: patient.dateOfBirth || null,
        phone: patient.phone || null,
        email: patient.email || null,
        bloodGroup: patient.bloodGroup || null,
      }
    : null;

const mapSessionSummary = (session) =>
  session
    ? {
        id: session._id,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status,
        clinic: session.clinic
          ? {
              id: session.clinic._id,
              name: session.clinic.name,
              address: session.clinic.address || null,
            }
          : null,
      }
    : null;

const mapTokenSummary = (token) =>
  token
    ? {
        id: token._id,
        tokenNumber: token.tokenNumber,
        status: token.status,
        visitedAt: token.visitedAt || null,
        completedAt: token.completedAt || null,
      }
    : null;

exports.listDoctorConsultations = asyncHandler(async (req, res) => {
  const { status, patientId, from, to } = req.query;
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);

  const criteria = { doctor: req.auth.id };

  if (status) {
    criteria.status = status;
  }

  if (patientId) {
    criteria.patient = patientId;
  }

  if (from || to) {
    criteria.createdAt = {};
    if (from) {
      criteria.createdAt.$gte = new Date(from);
    }
    if (to) {
      criteria.createdAt.$lte = new Date(to);
    }
  }

  const skip = (page - 1) * limit;

  const [consultations, total] = await Promise.all([
    Consultation.find(criteria)
      .populate('patient', 'firstName lastName gender dateOfBirth phone email bloodGroup')
      .populate({
        path: 'session',
        select: 'startTime endTime status clinic',
        populate: {
          path: 'clinic',
          select: 'name address',
        },
      })
      .populate('token', 'tokenNumber status visitedAt completedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Consultation.countDocuments(criteria),
  ]);

  const formatted = consultations.map((item) => ({
    id: item._id,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    followUpAt: item.followUpAt || null,
    diagnosis: item.diagnosis || null,
    notes: item.notes || null,
    patient: mapPatientSummary(item.patient),
    session: mapSessionSummary(item.session),
    token: mapTokenSummary(item.token),
  }));

  res.json({
    success: true,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
    consultations: formatted,
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

exports.getDoctorPatientRecord = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const doctorId = req.auth.id;
  const consultationLimit = Math.min(
    Math.max(Number.parseInt(req.query.consultationLimit, 10) || 20, 1),
    100
  );
  const prescriptionLimit = Math.min(
    Math.max(Number.parseInt(req.query.prescriptionLimit, 10) || 20, 1),
    100
  );

  const patient = await Patient.findById(patientId).select(
    'firstName lastName gender dateOfBirth phone email bloodGroup address medicalHistory allergies emergencyContact profileImage lastLoginAt createdAt updatedAt'
  );

  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }

  const hasRelationship = await Consultation.exists({
    doctor: doctorId,
    patient: patientId,
  });

  if (!hasRelationship) {
    return res
      .status(403)
      .json({ success: false, message: 'You have no consultations with this patient.' });
  }

  const [consultations, totalConsultations] = await Promise.all([
    Consultation.find({ doctor: doctorId, patient: patientId })
      .populate({
        path: 'session',
        select: 'startTime endTime status clinic',
        populate: { path: 'clinic', select: 'name address' },
      })
      .populate('token', 'tokenNumber status visitedAt completedAt')
      .sort({ createdAt: -1 })
      .limit(consultationLimit)
      .lean(),
    Consultation.countDocuments({ doctor: doctorId, patient: patientId }),
  ]);

  const [prescriptions, totalPrescriptions] = await Promise.all([
    Prescription.find({ doctor: doctorId, patient: patientId })
      .sort({ issuedAt: -1 })
      .limit(prescriptionLimit)
      .select(
        'diagnosis medications investigations advice issuedAt metadata status consultation followUpAt'
      )
      .lean(),
    Prescription.countDocuments({ doctor: doctorId, patient: patientId }),
  ]);

  const patientSummary = {
    id: patient._id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    gender: patient.gender || null,
    dateOfBirth: patient.dateOfBirth || null,
    phone: patient.phone || null,
    email: patient.email || null,
    bloodGroup: patient.bloodGroup || null,
    address: patient.address || null,
    emergencyContact: patient.emergencyContact || null,
    medicalHistory: patient.medicalHistory || [],
    allergies: patient.allergies || [],
    profileImage: patient.profileImage || null,
    lastLoginAt: patient.lastLoginAt || null,
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
  };

  const consultationSummaries = consultations.map((item) => ({
    id: item._id,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    followUpAt: item.followUpAt || null,
    diagnosis: item.diagnosis || null,
    notes: item.notes || null,
    vitals: item.vitals || null,
    session: mapSessionSummary(item.session),
    token: mapTokenSummary(item.token),
  }));

  const prescriptionSummaries = prescriptions.map((item) => ({
    id: item._id,
    status: item.status || null,
    issuedAt: item.issuedAt || null,
    diagnosis: item.diagnosis || null,
    followUpAt: item.followUpAt || null,
    medications: item.medications || [],
    investigations: item.investigations || [],
    advice: item.advice || null,
    metadata: item.metadata || null,
    consultation: item.consultation || null,
  }));

  res.json({
    success: true,
    patient: patientSummary,
    consultations: {
      total: totalConsultations,
      limit: consultationLimit,
      items: consultationSummaries,
    },
    prescriptions: {
      total: totalPrescriptions,
      limit: prescriptionLimit,
      items: prescriptionSummaries,
    },
  });
});

