const asyncHandler = require('../../middleware/asyncHandler');
const mongoose = require('mongoose');
const { ROLES, CONSULTATION_STATUS, TOKEN_STATUS } = require('../../utils/constants');
const Consultation = require('../../models/Consultation');
const ConsultationTemplate = require('../../models/ConsultationTemplate');
const SessionToken = require('../../models/SessionToken');
const Patient = require('../../models/Patient');
const Prescription = require('../../models/Prescription');
const queueService = require('../../services/appointmentQueueService');
const { getPaginationParams, getPaginationMeta } = require('../../utils/pagination');

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
  const { page, limit, skip } = getPaginationParams(req.query);

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

  const [consultations, total] = await Promise.all([
    Consultation.find(criteria)
      .select('status startedAt completedAt pausedAt resumedAt pauseHistory attachments templateId notes diagnosis vitals followUpAt createdAt patient session token appointment')
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
    pagination: getPaginationMeta(total, page, limit),
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
  const { limit: consultationLimit } = getPaginationParams(req.query, 20, 100);
  const { limit: prescriptionLimit } = getPaginationParams({ limit: req.query.prescriptionLimit }, 20, 100);

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

// Start consultation (explicit start)
exports.startConsultation = asyncHandler(async (req, res) => {
  const consultation = await ensureDoctorOwnership({
    consultationId: req.params.consultationId,
    doctorId: req.auth.id,
  });

  if (consultation.status === CONSULTATION_STATUS.COMPLETED) {
    return res.status(400).json({
      success: false,
      message: 'Cannot start a completed consultation.',
    });
  }

  if (consultation.status === CONSULTATION_STATUS.CANCELLED) {
    return res.status(400).json({
      success: false,
      message: 'Cannot start a cancelled consultation.',
    });
  }

  consultation.status = CONSULTATION_STATUS.IN_PROGRESS;
  consultation.startedAt = new Date();
  await consultation.save();

  res.json({
    success: true,
    message: 'Consultation started successfully.',
    consultation,
  });
});

// Pause consultation
exports.pauseConsultation = asyncHandler(async (req, res) => {
  const consultation = await ensureDoctorOwnership({
    consultationId: req.params.consultationId,
    doctorId: req.auth.id,
  });

  if (consultation.status !== CONSULTATION_STATUS.IN_PROGRESS) {
    return res.status(400).json({
      success: false,
      message: `Cannot pause consultation with status: ${consultation.status}. Only 'in_progress' consultations can be paused.`,
    });
  }

  const now = new Date();
  consultation.status = CONSULTATION_STATUS.PAUSED;
  consultation.pausedAt = now;

  // Add to pause history
  if (!consultation.pauseHistory) {
    consultation.pauseHistory = [];
  }
  consultation.pauseHistory.push({
    pausedAt: now,
    reason: req.body.reason || null,
  });

  await consultation.save();

  res.json({
    success: true,
    message: 'Consultation paused successfully.',
    consultation,
  });
});

// Resume consultation
exports.resumeConsultation = asyncHandler(async (req, res) => {
  const consultation = await ensureDoctorOwnership({
    consultationId: req.params.consultationId,
    doctorId: req.auth.id,
  });

  if (consultation.status !== CONSULTATION_STATUS.PAUSED) {
    return res.status(400).json({
      success: false,
      message: `Cannot resume consultation with status: ${consultation.status}. Only 'paused' consultations can be resumed.`,
    });
  }

  const now = new Date();
  consultation.status = CONSULTATION_STATUS.IN_PROGRESS;
  consultation.resumedAt = now;

  // Update pause history with resume time and duration
  if (consultation.pauseHistory && consultation.pauseHistory.length > 0) {
    const lastPause = consultation.pauseHistory[consultation.pauseHistory.length - 1];
    if (lastPause.pausedAt && !lastPause.resumedAt) {
      lastPause.resumedAt = now;
      const durationMs = now - new Date(lastPause.pausedAt);
      lastPause.durationMinutes = Math.round(durationMs / (1000 * 60));
    }
  }

  await consultation.save();

  res.json({
    success: true,
    message: 'Consultation resumed successfully.',
    consultation,
  });
});

// Add consultation attachment
exports.addConsultationAttachment = asyncHandler(async (req, res) => {
  const consultation = await ensureDoctorOwnership({
    consultationId: req.params.consultationId,
    doctorId: req.auth.id,
  });

  const { label, url, fileName, mimeType, fileSize } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      message: 'url is required for attachment.',
    });
  }

  if (!consultation.attachments) {
    consultation.attachments = [];
  }

  consultation.attachments.push({
    label: label || fileName || 'Attachment',
    url,
    fileName: fileName || null,
    mimeType: mimeType || null,
    fileSize: fileSize || null,
    uploadedAt: new Date(),
    uploadedBy: req.auth.id,
  });

  await consultation.save();

  res.json({
    success: true,
    message: 'Attachment added successfully.',
    consultation: {
      id: consultation._id,
      attachments: consultation.attachments,
    },
  });
});

// Remove consultation attachment
exports.removeConsultationAttachment = asyncHandler(async (req, res) => {
  const consultation = await ensureDoctorOwnership({
    consultationId: req.params.consultationId,
    doctorId: req.auth.id,
  });

  const { attachmentIndex } = req.params;

  if (!consultation.attachments || consultation.attachments.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No attachments found.',
    });
  }

  const index = Number.parseInt(attachmentIndex, 10);
  if (Number.isNaN(index) || index < 0 || index >= consultation.attachments.length) {
    return res.status(400).json({
      success: false,
      message: 'Invalid attachment index.',
    });
  }

  consultation.attachments.splice(index, 1);
  await consultation.save();

  res.json({
    success: true,
    message: 'Attachment removed successfully.',
    consultation: {
      id: consultation._id,
      attachments: consultation.attachments,
    },
  });
});

// Search consultations with advanced filters
exports.searchConsultations = asyncHandler(async (req, res) => {
  const doctorId = req.auth.id;
  const {
    search,
    status,
    patientId,
    diagnosis,
    from,
    to,
    hasAttachments,
    hasFollowUp,
    sortBy = 'created',
    sortOrder = 'desc',
    page,
    limit: limitParam,
  } = req.query;

  const { page: pageNum, limit, skip } = getPaginationParams(req.query);

  const criteria = { doctor: doctorId };

  // Status filter
  if (status) {
    criteria.status = status;
  }

  // Patient filter
  if (patientId) {
    criteria.patient = patientId;
  }

  // Date range filter
  if (from || to) {
    criteria.createdAt = {};
    if (from) {
      criteria.createdAt.$gte = new Date(from);
    }
    if (to) {
      criteria.createdAt.$lte = new Date(to);
    }
  }

  // Diagnosis filter
  if (diagnosis) {
    criteria.$or = [
      { 'diagnosis.primary': new RegExp(diagnosis, 'i') },
      { 'diagnosis.secondary': new RegExp(diagnosis, 'i') },
    ];
  }

  // Has attachments filter
  if (hasAttachments === 'true') {
    criteria.attachments = { $exists: true, $ne: [], $not: { $size: 0 } };
  } else if (hasAttachments === 'false') {
    criteria.$or = [
      ...(criteria.$or || []),
      { attachments: { $exists: false } },
      { attachments: { $eq: [] } },
      { attachments: { $size: 0 } },
    ];
  }

  // Has follow-up filter
  if (hasFollowUp === 'true') {
    criteria.followUpAt = { $exists: true, $ne: null };
  } else if (hasFollowUp === 'false') {
    criteria.followUpAt = { $exists: false };
  }

  // Search filter (patient name, notes, diagnosis)
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    const searchCriteria = {
      $or: [
        { 'notes.subjective': searchRegex },
        { 'notes.objective': searchRegex },
        { 'notes.assessment': searchRegex },
        { 'notes.plan': searchRegex },
        { 'diagnosis.primary': searchRegex },
      ],
    };

    // If patient search is needed, we need to populate first
    if (search.length >= 2) {
      const patients = await Patient.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
        ],
      }).select('_id').lean();

      if (patients.length > 0) {
        searchCriteria.$or.push({ patient: { $in: patients.map((p) => p._id) } });
      }
    }

    criteria.$and = criteria.$and || [];
    criteria.$and.push(searchCriteria);
  }

  // Build sort criteria
  let sortCriteria = {};
  switch (sortBy.toLowerCase()) {
    case 'created':
      sortCriteria = { createdAt: sortOrder === 'desc' ? -1 : 1 };
      break;
    case 'updated':
      sortCriteria = { updatedAt: sortOrder === 'desc' ? -1 : 1 };
      break;
    case 'started':
      sortCriteria = { startedAt: sortOrder === 'desc' ? -1 : 1 };
      break;
    case 'completed':
      sortCriteria = { completedAt: sortOrder === 'desc' ? -1 : 1 };
      break;
    case 'status':
      sortCriteria = { status: sortOrder === 'desc' ? -1 : 1, createdAt: -1 };
      break;
    default:
      sortCriteria = { createdAt: -1 };
  }

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
      .sort(sortCriteria)
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
    startedAt: item.startedAt || null,
    completedAt: item.completedAt || null,
    pausedAt: item.pausedAt || null,
    resumedAt: item.resumedAt || null,
    followUpAt: item.followUpAt || null,
    diagnosis: item.diagnosis || null,
    notes: item.notes || null,
    vitals: item.vitals || null,
    attachmentsCount: item.attachments ? item.attachments.length : 0,
    patient: mapPatientSummary(item.patient),
    session: mapSessionSummary(item.session),
    token: mapTokenSummary(item.token),
  }));

  res.json({
    success: true,
    pagination: {
      total,
      page: pageNum,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
    filters: {
      search: search || null,
      status: status || null,
      patientId: patientId || null,
      diagnosis: diagnosis || null,
      from: from || null,
      to: to || null,
      hasAttachments: hasAttachments || null,
      hasFollowUp: hasFollowUp || null,
      sortBy,
      sortOrder,
    },
    consultations: formatted,
  });
});

// Export consultations (CSV)
exports.exportConsultations = asyncHandler(async (req, res) => {
  const doctorId = req.auth.id;
  const { format = 'csv', from, to, status, patientId } = req.query;

  if (!['csv', 'json'].includes(format.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: 'Format must be either csv or json.',
    });
  }

  const criteria = { doctor: doctorId };

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

  const consultations = await Consultation.find(criteria)
    .populate('patient', 'firstName lastName phone email')
    .populate('doctor', 'firstName lastName specialization')
    .sort({ createdAt: -1 })
    .lean();

  if (format.toLowerCase() === 'csv') {
    const csvRows = [];
    csvRows.push([
      'Date',
      'Patient Name',
      'Patient Phone',
      'Status',
      'Primary Diagnosis',
      'Secondary Diagnosis',
      'Started At',
      'Completed At',
      'Follow Up',
      'Attachments',
    ].join(','));

    consultations.forEach((consultation) => {
      const patientName = consultation.patient
        ? `${consultation.patient.firstName || ''} ${consultation.patient.lastName || ''}`.trim()
        : 'N/A';
      const patientPhone = consultation.patient?.phone || 'N/A';
      const primaryDiagnosis = consultation.diagnosis?.primary || 'N/A';
      const secondaryDiagnosis = consultation.diagnosis?.secondary?.join('; ') || 'N/A';
      const startedAt = consultation.startedAt ? new Date(consultation.startedAt).toISOString() : 'N/A';
      const completedAt = consultation.completedAt ? new Date(consultation.completedAt).toISOString() : 'N/A';
      const followUp = consultation.followUpAt ? new Date(consultation.followUpAt).toISOString() : 'N/A';
      const attachmentsCount = consultation.attachments ? consultation.attachments.length : 0;

      csvRows.push([
        new Date(consultation.createdAt).toISOString(),
        `"${patientName}"`,
        patientPhone,
        consultation.status,
        `"${primaryDiagnosis}"`,
        `"${secondaryDiagnosis}"`,
        startedAt,
        completedAt,
        followUp,
        attachmentsCount,
      ].join(','));
    });

    const csvContent = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="consultations_${Date.now()}.csv"`);
    return res.send(csvContent);
  }

  // JSON format
  const formatted = consultations.map((item) => ({
    id: item._id,
    date: item.createdAt,
    patient: item.patient
      ? {
          name: `${item.patient.firstName || ''} ${item.patient.lastName || ''}`.trim(),
          phone: item.patient.phone || null,
          email: item.patient.email || null,
        }
      : null,
    status: item.status,
    diagnosis: item.diagnosis || null,
    notes: item.notes || null,
    vitals: item.vitals || null,
    startedAt: item.startedAt || null,
    completedAt: item.completedAt || null,
    followUpAt: item.followUpAt || null,
    attachments: item.attachments || [],
  }));

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="consultations_${Date.now()}.json"`);
  return res.json({ success: true, consultations: formatted });
});

// Consultation Templates Management
exports.createConsultationTemplate = asyncHandler(async (req, res) => {
  const doctorId = req.auth.id;
  const { name, description, notes, diagnosis, isDefault } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Template name is required.',
    });
  }

  // If setting as default, unset other defaults
  if (isDefault) {
    await ConsultationTemplate.updateMany(
      { doctor: doctorId, isDefault: true },
      { $set: { isDefault: false } }
    );
  }

  const template = await ConsultationTemplate.create({
    doctor: doctorId,
    name: name.trim(),
    description: description || null,
    notes: notes || null,
    diagnosis: diagnosis || null,
    isDefault: isDefault || false,
  });

  res.status(201).json({
    success: true,
    message: 'Consultation template created successfully.',
    template,
  });
});

exports.listConsultationTemplates = asyncHandler(async (req, res) => {
  const doctorId = req.auth.id;
  const { isActive } = req.query;

  const criteria = { doctor: doctorId };
  if (isActive !== undefined) {
    criteria.isActive = isActive === 'true';
  }

  const templates = await ConsultationTemplate.find(criteria)
    .sort({ isDefault: -1, usageCount: -1, createdAt: -1 })
    .lean();

  res.json({
    success: true,
    templates,
  });
});

exports.getConsultationTemplate = asyncHandler(async (req, res) => {
  const doctorId = req.auth.id;
  const { templateId } = req.params;

  const template = await ConsultationTemplate.findOne({
    _id: templateId,
    doctor: doctorId,
  }).lean();

  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'Template not found.',
    });
  }

  res.json({
    success: true,
    template,
  });
});

exports.updateConsultationTemplate = asyncHandler(async (req, res) => {
  const doctorId = req.auth.id;
  const { templateId } = req.params;
  const { name, description, notes, diagnosis, isDefault, isActive } = req.body;

  const template = await ConsultationTemplate.findOne({
    _id: templateId,
    doctor: doctorId,
  });

  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'Template not found.',
    });
  }

  if (name !== undefined) {
    template.name = name.trim();
  }
  if (description !== undefined) {
    template.description = description || null;
  }
  if (notes !== undefined) {
    template.notes = notes || null;
  }
  if (diagnosis !== undefined) {
    template.diagnosis = diagnosis || null;
  }
  if (isActive !== undefined) {
    template.isActive = isActive;
  }

  // If setting as default, unset other defaults
  if (isDefault === true) {
    await ConsultationTemplate.updateMany(
      { doctor: doctorId, isDefault: true, _id: { $ne: templateId } },
      { $set: { isDefault: false } }
    );
    template.isDefault = true;
  } else if (isDefault === false) {
    template.isDefault = false;
  }

  await template.save();

  res.json({
    success: true,
    message: 'Template updated successfully.',
    template,
  });
});

exports.deleteConsultationTemplate = asyncHandler(async (req, res) => {
  const doctorId = req.auth.id;
  const { templateId } = req.params;

  const template = await ConsultationTemplate.findOneAndDelete({
    _id: templateId,
    doctor: doctorId,
  });

  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'Template not found.',
    });
  }

  res.json({
    success: true,
    message: 'Template deleted successfully.',
  });
});

exports.useConsultationTemplate = asyncHandler(async (req, res) => {
  const { consultationId } = req.params;
  const { templateId } = req.body;
  const doctorId = req.auth.id;

  const consultation = await ensureDoctorOwnership({
    consultationId,
    doctorId,
  });

  const template = await ConsultationTemplate.findOne({
    _id: templateId,
    doctor: doctorId,
    isActive: true,
  });

  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'Template not found or inactive.',
    });
  }

  // Apply template to consultation
  if (template.notes) {
    consultation.notes = {
      ...consultation.notes,
      ...template.notes,
    };
  }

  if (template.diagnosis) {
    consultation.diagnosis = {
      ...consultation.diagnosis,
      ...template.diagnosis,
    };
  }

  consultation.templateId = template._id;
  await consultation.save();

  // Update template usage
  template.usageCount = (template.usageCount || 0) + 1;
  template.lastUsedAt = new Date();
  await template.save();

  res.json({
    success: true,
    message: 'Template applied successfully.',
    consultation,
  });
});

