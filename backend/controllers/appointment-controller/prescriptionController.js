const mongoose = require('mongoose');
const asyncHandler = require('../../middleware/asyncHandler');
const {
  ROLES,
  APPROVAL_STATUS,
  LAB_LEAD_STATUS,
  PHARMACY_LEAD_STATUS,
} = require('../../utils/constants');
const Prescription = require('../../models/Prescription');
const PrescriptionTemplate = require('../../models/PrescriptionTemplate');
const LabLead = require('../../models/LabLead');
const PharmacyLead = require('../../models/PharmacyLead');
const Laboratory = require('../../models/Laboratory');
const Pharmacy = require('../../models/Pharmacy');
const { createPrescription } = require('../../services/prescriptionService');
const { sendPrescriptionEmail } = require('../../services/emailService');
const { getPaginationParams, getPaginationMeta } = require('../../utils/pagination');

const buildStatusHistoryEntry = ({
  status,
  notes,
  actorId,
  actorRole,
  billing,
  report,
}) => {
  const entry = {
    status,
    notes: notes || undefined,
    updatedBy: actorId || undefined,
    updatedByRole: actorRole || undefined,
    updatedAt: new Date(),
  };

  if (billing) {
    const snapshot = {};
    if (billing.totalAmount !== undefined) {
      snapshot.totalAmount = billing.totalAmount;
    }
    if (billing.deliveryCharge !== undefined) {
      snapshot.deliveryCharge = billing.deliveryCharge;
    }
    if (billing.homeCollectionCharge !== undefined) {
      snapshot.homeCollectionCharge = billing.homeCollectionCharge;
    }
    if (billing.currency) {
      snapshot.currency = billing.currency;
    }
    if (Object.keys(snapshot).length) {
      entry.billingSnapshot = snapshot;
    }
  }

  if (report) {
    const snapshot = {};
    if (report.fileUrl) {
      snapshot.fileUrl = report.fileUrl;
    }
    if (report.fileName) {
      snapshot.fileName = report.fileName;
    }
    if (report.mimeType) {
      snapshot.mimeType = report.mimeType;
    }
    if (Object.keys(snapshot).length) {
      entry.reportSnapshot = snapshot;
    }
  }

  return entry;
};

const ensureRole = (role, allowed) => {
  if (!allowed.includes(role)) {
    const error = new Error('You do not have access to this resource');
    error.status = 403;
    throw error;
  }
};

const buildDoctorSummary = (doctor) => {
  if (!doctor) {
    return null;
  }

  const clinic = doctor.clinicDetails || {};
  return {
    id: doctor._id,
    name: `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim(),
    phone: doctor.phone,
    email: doctor.email || null,
    specialization: doctor.specialization || null,
    consultationFee: doctor.consultationFee ?? null,
    clinic: {
      name: clinic.name || null,
      address: clinic.address || null,
    },
  };
};

const buildPatientSummary = (patient) => {
  if (!patient) {
    return null;
  }

  return {
    id: patient._id,
    name: `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
    phone: patient.phone,
    email: patient.email || null,
    address: patient.address || null,
  };
};

const buildLabLeadSummary = (lead) => {
  if (!lead) {
    return null;
  }

  return {
    leadId: lead._id,
    status: lead.status,
    laboratories: (lead.preferredLaboratories || []).map((lab) => ({
      id: lab._id,
      name: lab.labName,
      phone: lab.phone,
      email: lab.email,
      address: lab.address,
    })),
    tests: lead.tests || [],
    statusHistory: (lead.statusHistory || []).map((entry) => ({
      status: entry.status,
      notes: entry.notes || null,
      updatedAt: entry.updatedAt,
      updatedByRole: entry.updatedByRole || null,
      billingSnapshot: entry.billingSnapshot
        ? {
            totalAmount: entry.billingSnapshot.totalAmount ?? null,
            homeCollectionCharge: entry.billingSnapshot.homeCollectionCharge ?? null,
            currency: entry.billingSnapshot.currency || 'INR',
          }
        : null,
      reportSnapshot: entry.reportSnapshot
        ? {
            fileUrl: entry.reportSnapshot.fileUrl || null,
            fileName: entry.reportSnapshot.fileName || null,
            mimeType: entry.reportSnapshot.mimeType || null,
          }
        : null,
    })),
    billingSummary: lead.billingSummary
      ? {
          totalAmount: lead.billingSummary.totalAmount ?? null,
          homeCollectionCharge: lead.billingSummary.homeCollectionCharge ?? null,
          currency: lead.billingSummary.currency || 'INR',
          notes: lead.billingSummary.notes || null,
          updatedAt: lead.billingSummary.updatedAt || null,
        }
      : null,
    reportDetails: lead.reportDetails
      ? {
          fileUrl: lead.reportDetails.fileUrl || null,
          fileName: lead.reportDetails.fileName || null,
          mimeType: lead.reportDetails.mimeType || null,
          notes: lead.reportDetails.notes || null,
          uploadedAt: lead.reportDetails.uploadedAt || null,
        }
      : null,
    updatedAt: lead.updatedAt,
  };
};

const buildPharmacyLeadSummary = (lead) => {
  if (!lead) {
    return null;
  }

  return {
    leadId: lead._id,
    status: lead.status,
    pharmacies: (lead.preferredPharmacies || []).map((pharmacy) => ({
      id: pharmacy._id,
      name: pharmacy.pharmacyName,
      phone: pharmacy.phone,
      email: pharmacy.email,
      address: pharmacy.address,
    })),
    medicines: lead.medicines || [],
    statusHistory: (lead.statusHistory || []).map((entry) => ({
      status: entry.status,
      notes: entry.notes || null,
      updatedAt: entry.updatedAt,
      updatedByRole: entry.updatedByRole || null,
    })),
    billingSummary: lead.billingSummary
      ? {
          totalAmount: lead.billingSummary.totalAmount ?? null,
          deliveryCharge: lead.billingSummary.deliveryCharge ?? null,
          currency: lead.billingSummary.currency || 'INR',
          notes: lead.billingSummary.notes || null,
          updatedAt: lead.billingSummary.updatedAt || null,
        }
      : null,
    updatedAt: lead.updatedAt,
  };
};

exports.createOrUpdate = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const { prescription } = await createPrescription({
    consultationId: req.body.consultationId,
    doctorId: req.auth.id,
    payload: req.body,
    io: req.app.get('io'),
  });

  res.status(201).json({
    success: true,
    prescription,
  });
});

exports.getPrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.prescriptionId)
    .populate(
      'doctor',
      'firstName lastName phone email specialization consultationFee clinicDetails'
    )
    .populate('patient', 'firstName lastName phone email address')
    .lean();

  if (!prescription) {
    return res
      .status(404)
      .json({ success: false, message: 'Prescription not found' });
  }

  const { role, id } = req.auth;

  if (
    role === ROLES.DOCTOR &&
    prescription.doctor._id.toString() !== id.toString()
  ) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  if (
    role === ROLES.PATIENT &&
    prescription.patient._id.toString() !== id.toString()
  ) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const [labLead, pharmacyLead] = await Promise.all([
    LabLead.findOne({ prescription: prescription._id })
      .populate('preferredLaboratories', 'labName phone email address')
      .lean(),
    PharmacyLead.findOne({ prescription: prescription._id })
      .populate('preferredPharmacies', 'pharmacyName phone email address')
      .lean(),
  ]);

  res.json({
    success: true,
    prescription: {
      ...prescription,
      doctor: buildDoctorSummary(prescription.doctor),
      patient: buildPatientSummary(prescription.patient),
      sharedWith: {
        laboratories: buildLabLeadSummary(labLead),
        pharmacies: buildPharmacyLeadSummary(pharmacyLead),
      },
    },
  });
});

exports.listPatientPrescriptions = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const prescriptions = await Prescription.find({ patient: req.auth.id })
    .populate(
      'doctor',
      'firstName lastName phone email specialization clinicDetails consultationFee'
    )
    .sort({ createdAt: -1 })
    .lean();

  const prescriptionIds = prescriptions.map((item) => item._id);

  const [labLeads, pharmacyLeads] = await Promise.all([
    LabLead.find({ prescription: { $in: prescriptionIds } })
      .populate('preferredLaboratories', 'labName phone email address')
      .lean(),
    PharmacyLead.find({ prescription: { $in: prescriptionIds } })
      .populate('preferredPharmacies', 'pharmacyName phone email address')
      .lean(),
  ]);

  const labLeadMap = labLeads.reduce((acc, lead) => {
    acc[lead.prescription.toString()] = lead;
    return acc;
  }, {});

  const pharmacyLeadMap = pharmacyLeads.reduce((acc, lead) => {
    acc[lead.prescription.toString()] = lead;
    return acc;
  }, {});

  res.json({
    success: true,
    prescriptions: prescriptions.map((prescription) => ({
      ...prescription,
      doctor: buildDoctorSummary(prescription.doctor),
      sharedWith: {
        laboratories: buildLabLeadSummary(
          labLeadMap[prescription._id.toString()]
        ),
        pharmacies: buildPharmacyLeadSummary(
          pharmacyLeadMap[prescription._id.toString()]
        ),
      },
    })),
  });
});

exports.listDoctorPrescriptions = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

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
    criteria.issuedAt = {};
    if (from) {
      criteria.issuedAt.$gte = new Date(from);
    }
    if (to) {
      criteria.issuedAt.$lte = new Date(to);
    }
  }

  const [prescriptions, total] = await Promise.all([
    Prescription.find(criteria)
      .select('status medications investigations diagnosis advice lifestyleAdvice followUpAt issuedAt validityInDays pharmacyNotes attachments metadata createdAt patient appointment consultation')
      .populate('patient', 'firstName lastName phone email address')
      .populate('appointment', 'scheduledFor status')
      .populate('consultation', 'status startedAt completedAt')
      .sort({ issuedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Prescription.countDocuments(criteria),
  ]);

  const prescriptionIds = prescriptions.map((item) => item._id);

  const [labLeads, pharmacyLeads] = await Promise.all([
    LabLead.find({ prescription: { $in: prescriptionIds } })
      .populate('preferredLaboratories', 'labName phone email address')
      .lean(),
    PharmacyLead.find({ prescription: { $in: prescriptionIds } })
      .populate('preferredPharmacies', 'pharmacyName phone email address')
      .lean(),
  ]);

  const labLeadMap = labLeads.reduce((acc, lead) => {
    acc[lead.prescription.toString()] = lead;
    return acc;
  }, {});

  const pharmacyLeadMap = pharmacyLeads.reduce((acc, lead) => {
    acc[lead.prescription.toString()] = lead;
    return acc;
  }, {});

  res.json({
    success: true,
    pagination: getPaginationMeta(total, page, limit),
    prescriptions: prescriptions.map((prescription) => ({
      ...prescription,
      patient: buildPatientSummary(prescription.patient),
      sharedWith: {
        laboratories: buildLabLeadSummary(
          labLeadMap[prescription._id.toString()]
        ),
        pharmacies: buildPharmacyLeadSummary(
          pharmacyLeadMap[prescription._id.toString()]
        ),
      },
    })),
  });
});

exports.sharePrescription = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT, ROLES.DOCTOR, ROLES.ADMIN]);

  const { prescriptionId } = req.params;
  const { targetType, targetIds } = req.body;

  if (!['laboratory', 'pharmacy'].includes(targetType)) {
    const error = new Error(
      'targetType must be either "laboratory" or "pharmacy".'
    );
    error.status = 400;
    throw error;
  }

  if (!Array.isArray(targetIds) || !targetIds.length) {
    const error = new Error('targetIds must be a non-empty array.');
    error.status = 400;
    throw error;
  }

  const uniqueTargetIds = Array.from(
    new Set(targetIds.map((value) => value.toString()))
  ).map((value) => new mongoose.Types.ObjectId(value));

  const prescription = await Prescription.findById(prescriptionId)
    .populate('doctor', 'firstName lastName phone email clinicDetails')
    .populate('patient', 'firstName lastName phone email address')
    .lean();

  if (!prescription) {
    const error = new Error('Prescription not found');
    error.status = 404;
    throw error;
  }

  if (
    req.auth.role === ROLES.PATIENT &&
    prescription.patient._id.toString() !== req.auth.id.toString()
  ) {
    const error = new Error('You do not have access to this prescription');
    error.status = 403;
    throw error;
  }

  if (
    req.auth.role === ROLES.DOCTOR &&
    prescription.doctor._id.toString() !== req.auth.id.toString()
  ) {
    const error = new Error('You do not have access to this prescription');
    error.status = 403;
    throw error;
  }

  // Doctor cannot share prescription with labs/pharmacies directly
  // Only patients can share their prescriptions with labs/pharmacies for booking
  if (req.auth.role === ROLES.DOCTOR && (targetType === 'laboratory' || targetType === 'pharmacy')) {
    const error = new Error('Doctors cannot share prescriptions directly with laboratories or pharmacies. Only patients can share their prescriptions with labs/pharmacies during booking.');
    error.status = 403;
    throw error;
  }

  const consultationId =
    prescription.consultation?._id || prescription.consultation;

  if (!consultationId) {
    const error = new Error('Prescription is not associated with a consultation');
    error.status = 400;
    throw error;
  }

  let shareSummary;

  if (targetType === 'laboratory') {
    const laboratories = await Laboratory.find({
      _id: { $in: uniqueTargetIds },
      status: APPROVAL_STATUS.APPROVED,
    })
      .select('labName phone email address')
      .lean();

    const eligibleLabs = laboratories;

    if (!eligibleLabs.length) {
      const error = new Error('No approved laboratories selected.');
      error.status = 400;
      throw error;
    }

    const tests = (prescription.investigations || []).map((item) => ({
      testName: item.name,
      description: item.notes,
      notes: item.notes,
      priority: 'normal',
    }));

    let lead = await LabLead.findOne({ prescription: prescription._id });

    if (!lead) {
      lead = new LabLead({
        prescription: prescription._id,
        consultation: consultationId,
        doctor: prescription.doctor._id,
        patient: prescription.patient._id,
        preferredLaboratories: eligibleLabs.map((lab) => lab._id),
        tests,
        status: LAB_LEAD_STATUS.NEW,
        statusHistory: [
          buildStatusHistoryEntry({
            status: LAB_LEAD_STATUS.NEW,
            notes: 'Prescription shared with laboratory',
            actorId: req.auth.id,
            actorRole: req.auth.role,
          }),
        ],
      });
    } else {
      lead.preferredLaboratories = eligibleLabs.map((lab) => lab._id);
      lead.tests = tests;
      lead.status = LAB_LEAD_STATUS.NEW;
      lead.billingSummary = null;
      lead.reportDetails = null;
      lead.statusHistory = [
        ...(lead.statusHistory || []),
        buildStatusHistoryEntry({
          status: LAB_LEAD_STATUS.NEW,
          notes: 'Prescription re-shared with laboratory',
          actorId: req.auth.id,
          actorRole: req.auth.role,
        }),
      ];
    }

    await lead.save();
    await lead.populate('preferredLaboratories', 'labName phone email address');
    
    // Notify laboratories about new request
    const { notifyLabRequestReceived } = require('../../services/notificationEvents');
    const Patient = require('../../models/Patient');
    try {
      const patient = await Patient.findById(prescription.patient._id).select('firstName lastName').lean();
      const patientName = patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : 'Patient';
      for (const lab of eligibleLabs) {
        await notifyLabRequestReceived({
          laboratoryId: lab._id,
          patientName,
          leadId: lead._id,
        });
      }
    } catch (notificationError) {
      console.error('Failed to send lab request notification:', notificationError);
    }
    
    shareSummary = buildLabLeadSummary(lead.toObject());
  } else {
    const pharmacies = await Pharmacy.find({
      _id: { $in: uniqueTargetIds },
      status: APPROVAL_STATUS.APPROVED,
    })
      .select('pharmacyName phone email address')
      .lean();

    const eligiblePharmacies = pharmacies;

    if (!eligiblePharmacies.length) {
      const error = new Error('No approved pharmacies selected.');
      error.status = 400;
      throw error;
    }

    const medicines = (prescription.medications || []).map((item) => ({
      name: item.name,
      dosage: item.dosage,
      quantity: item.duration ? Number.parseInt(item.duration, 10) || 1 : 1,
      instructions: item.instructions,
      priority: 'normal',
    }));

    let lead = await PharmacyLead.findOne({ prescription: prescription._id });

    if (!lead) {
      lead = new PharmacyLead({
        prescription: prescription._id,
        consultation: consultationId,
        doctor: prescription.doctor._id,
        patient: prescription.patient._id,
        preferredPharmacies: eligiblePharmacies.map((pharmacy) => pharmacy._id),
        medicines,
        status: PHARMACY_LEAD_STATUS.NEW,
        statusHistory: [
          buildStatusHistoryEntry({
            status: PHARMACY_LEAD_STATUS.NEW,
            notes: 'Prescription shared with pharmacy',
            actorId: req.auth.id,
            actorRole: req.auth.role,
          }),
        ],
      });
    } else {
      lead.preferredPharmacies = eligiblePharmacies.map((pharmacy) => pharmacy._id);
      lead.medicines = medicines;
      lead.status = PHARMACY_LEAD_STATUS.NEW;
      lead.billingSummary = null;
      lead.statusHistory = [
        ...(lead.statusHistory || []),
        buildStatusHistoryEntry({
          status: PHARMACY_LEAD_STATUS.NEW,
          notes: 'Prescription re-shared with pharmacy',
          actorId: req.auth.id,
          actorRole: req.auth.role,
        }),
      ];
    }

    await lead.save();
    await lead.populate('preferredPharmacies', 'pharmacyName phone email address');
    
    // Notify pharmacies about new request
    const { notifyPharmacyRequestReceived } = require('../../services/notificationEvents');
    const Patient = require('../../models/Patient');
    try {
      const patient = await Patient.findById(prescription.patient._id).select('firstName lastName').lean();
      const patientName = patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : 'Patient';
      for (const pharmacy of eligiblePharmacies) {
        await notifyPharmacyRequestReceived({
          pharmacyId: pharmacy._id,
          patientName,
          leadId: lead._id,
        });
      }
    } catch (notificationError) {
      console.error('Failed to send pharmacy request notification:', notificationError);
    }
    
    shareSummary = buildPharmacyLeadSummary(lead.toObject());
  }

  res.json({
    success: true,
    message:
      targetType === 'laboratory'
        ? 'Prescription shared with selected laboratories.'
        : 'Prescription shared with selected pharmacies.',
    data: shareSummary,
  });
});

// Revoke prescription
exports.revokePrescription = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const { prescriptionId } = req.params;
  const { reason } = req.body;
  const doctorId = req.auth.id;

  const prescription = await Prescription.findById(prescriptionId).lean();

  if (!prescription) {
    return res.status(404).json({
      success: false,
      message: 'Prescription not found.',
    });
  }

  if (prescription.doctor.toString() !== doctorId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to revoke this prescription.',
    });
  }

  if (prescription.status === 'revoked') {
    return res.status(400).json({
      success: false,
      message: 'Prescription is already revoked.',
    });
  }

  const updatedPrescription = await Prescription.findByIdAndUpdate(
    prescriptionId,
    {
      $set: {
        status: 'revoked',
        metadata: {
          ...prescription.metadata,
          revokedAt: new Date(),
          revokedBy: doctorId,
          revokedReason: reason || 'Prescription revoked by doctor',
        },
      },
    },
    { new: true }
  )
    .populate('patient', 'firstName lastName phone email')
    .populate('doctor', 'firstName lastName')
    .lean();

  res.json({
    success: true,
    message: 'Prescription revoked successfully.',
    prescription: updatedPrescription,
  });
});

// Extend prescription validity
exports.extendPrescriptionValidity = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const { prescriptionId } = req.params;
  const { additionalDays, reason } = req.body;
  const doctorId = req.auth.id;

  if (!additionalDays || Number.isNaN(Number(additionalDays)) || Number(additionalDays) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'additionalDays must be a positive number.',
    });
  }

  const prescription = await Prescription.findById(prescriptionId);

  if (!prescription) {
    return res.status(404).json({
      success: false,
      message: 'Prescription not found.',
    });
  }

  if (prescription.doctor.toString() !== doctorId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to extend this prescription.',
    });
  }

  if (prescription.status === 'revoked') {
    return res.status(400).json({
      success: false,
      message: 'Cannot extend a revoked prescription.',
    });
  }

  const currentValidity = prescription.validityInDays || 30;
  const newValidity = currentValidity + Number(additionalDays);

  prescription.validityInDays = newValidity;
  if (reason) {
    prescription.metadata = prescription.metadata || {};
    prescription.metadata.validityExtension = {
      previousValidity: currentValidity,
      newValidity,
      extendedAt: new Date(),
      extendedBy: doctorId,
      reason: reason.trim(),
    };
  }

  await prescription.save();

  res.json({
    success: true,
    message: 'Prescription validity extended successfully.',
    prescription: {
      id: prescription._id,
      validityInDays: prescription.validityInDays,
      previousValidity: currentValidity,
      newValidity,
    },
  });
});

// Prescription Templates Management
exports.createPrescriptionTemplate = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const doctorId = req.auth.id;
  const { name, description, medications, investigations, diagnosis, advice, lifestyleAdvice, isDefault } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Template name is required.',
    });
  }

  // If setting as default, unset other defaults
  if (isDefault) {
    await PrescriptionTemplate.updateMany(
      { doctor: doctorId, isDefault: true },
      { $set: { isDefault: false } }
    );
  }

  const template = await PrescriptionTemplate.create({
    doctor: doctorId,
    name: name.trim(),
    description: description || null,
    medications: medications || [],
    investigations: investigations || [],
    diagnosis: diagnosis || null,
    advice: advice || null,
    lifestyleAdvice: lifestyleAdvice || null,
    isDefault: isDefault || false,
  });

  res.status(201).json({
    success: true,
    message: 'Prescription template created successfully.',
    template,
  });
});

exports.listPrescriptionTemplates = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const doctorId = req.auth.id;
  const { isActive } = req.query;

  const criteria = { doctor: doctorId };
  if (isActive !== undefined) {
    criteria.isActive = isActive === 'true';
  }

  const templates = await PrescriptionTemplate.find(criteria)
    .sort({ isDefault: -1, usageCount: -1, createdAt: -1 })
    .lean();

  res.json({
    success: true,
    templates,
  });
});

exports.getPrescriptionTemplate = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const doctorId = req.auth.id;
  const { templateId } = req.params;

  const template = await PrescriptionTemplate.findOne({
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

exports.updatePrescriptionTemplate = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const doctorId = req.auth.id;
  const { templateId } = req.params;
  const { name, description, medications, investigations, diagnosis, advice, lifestyleAdvice, isDefault, isActive } = req.body;

  const template = await PrescriptionTemplate.findOne({
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
  if (medications !== undefined) {
    template.medications = medications || [];
  }
  if (investigations !== undefined) {
    template.investigations = investigations || [];
  }
  if (diagnosis !== undefined) {
    template.diagnosis = diagnosis || null;
  }
  if (advice !== undefined) {
    template.advice = advice || null;
  }
  if (lifestyleAdvice !== undefined) {
    template.lifestyleAdvice = lifestyleAdvice || null;
  }
  if (isActive !== undefined) {
    template.isActive = isActive;
  }

  // If setting as default, unset other defaults
  if (isDefault === true) {
    await PrescriptionTemplate.updateMany(
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

exports.deletePrescriptionTemplate = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const doctorId = req.auth.id;
  const { templateId } = req.params;

  const template = await PrescriptionTemplate.findOneAndDelete({
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

// Prescription Analytics
exports.getPrescriptionAnalytics = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const doctorId = req.auth.id;
  const { from, to } = req.query;

  const criteria = { doctor: doctorId, status: { $ne: 'revoked' } };

  if (from || to) {
    criteria.issuedAt = {};
    if (from) {
      criteria.issuedAt.$gte = new Date(from);
    }
    if (to) {
      criteria.issuedAt.$lte = new Date(to);
    }
  }

  const [
    totalPrescriptions,
    prescriptions,
    mostPrescribedMedicines,
    mostPrescribedInvestigations,
    prescriptionsByMonth,
    prescriptionsByDiagnosis,
  ] = await Promise.all([
    Prescription.countDocuments(criteria),
    Prescription.find(criteria).select('medications investigations diagnosis issuedAt').lean(),
    Prescription.aggregate([
      { $match: criteria },
      { $unwind: '$medications' },
      { $group: { _id: '$medications.name', count: { $sum: 1 }, dosage: { $first: '$medications.dosage' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Prescription.aggregate([
      { $match: criteria },
      { $unwind: '$investigations' },
      { $group: { _id: '$investigations.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Prescription.aggregate([
      { $match: criteria },
      {
        $group: {
          _id: {
            year: { $year: '$issuedAt' },
            month: { $month: '$issuedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]),
    Prescription.aggregate([
      { $match: { ...criteria, diagnosis: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$diagnosis', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const totalMedications = prescriptions.reduce((sum, p) => sum + (p.medications?.length || 0), 0);
  const totalInvestigations = prescriptions.reduce((sum, p) => sum + (p.investigations?.length || 0), 0);
  const avgMedicationsPerPrescription = totalPrescriptions > 0 ? (totalMedications / totalPrescriptions).toFixed(2) : 0;
  const avgInvestigationsPerPrescription = totalPrescriptions > 0 ? (totalInvestigations / totalPrescriptions).toFixed(2) : 0;

  res.json({
    success: true,
    analytics: {
      overview: {
        totalPrescriptions,
        totalMedications,
        totalInvestigations,
        avgMedicationsPerPrescription: Number.parseFloat(avgMedicationsPerPrescription),
        avgInvestigationsPerPrescription: Number.parseFloat(avgInvestigationsPerPrescription),
      },
      mostPrescribed: {
        medicines: mostPrescribedMedicines.map((item) => ({
          name: item._id,
          count: item.count,
          dosage: item.dosage || null,
        })),
        investigations: mostPrescribedInvestigations.map((item) => ({
          name: item._id,
          count: item.count,
        })),
      },
      trends: {
        byMonth: prescriptionsByMonth.map((item) => ({
          year: item._id.year,
          month: item._id.month,
          count: item.count,
        })),
      },
      byDiagnosis: prescriptionsByDiagnosis.map((item) => ({
        diagnosis: item._id,
        count: item.count,
      })),
    },
  });
});

// Export prescriptions
exports.exportPrescriptions = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

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
    criteria.issuedAt = {};
    if (from) {
      criteria.issuedAt.$gte = new Date(from);
    }
    if (to) {
      criteria.issuedAt.$lte = new Date(to);
    }
  }

  const prescriptions = await Prescription.find(criteria)
    .populate('patient', 'firstName lastName phone email')
    .populate('doctor', 'firstName lastName specialization')
    .sort({ issuedAt: -1 })
    .lean();

  if (format.toLowerCase() === 'csv') {
    const csvRows = [];
    csvRows.push([
      'Date',
      'Patient Name',
      'Patient Phone',
      'Status',
      'Diagnosis',
      'Medications Count',
      'Investigations Count',
      'Validity Days',
      'Follow Up',
    ].join(','));

    prescriptions.forEach((prescription) => {
      const patientName = prescription.patient
        ? `${prescription.patient.firstName || ''} ${prescription.patient.lastName || ''}`.trim()
        : 'N/A';
      const patientPhone = prescription.patient?.phone || 'N/A';
      const medicationsCount = prescription.medications?.length || 0;
      const investigationsCount = prescription.investigations?.length || 0;
      const followUp = prescription.followUpAt ? new Date(prescription.followUpAt).toISOString() : 'N/A';

      csvRows.push([
        new Date(prescription.issuedAt).toISOString(),
        `"${patientName}"`,
        patientPhone,
        prescription.status,
        `"${prescription.diagnosis || 'N/A'}"`,
        medicationsCount,
        investigationsCount,
        prescription.validityInDays || 30,
        followUp,
      ].join(','));
    });

    const csvContent = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="prescriptions_${Date.now()}.csv"`);
    return res.send(csvContent);
  }

  // JSON format
  const formatted = prescriptions.map((item) => ({
    id: item._id,
    date: item.issuedAt,
    patient: item.patient
      ? {
          name: `${item.patient.firstName || ''} ${item.patient.lastName || ''}`.trim(),
          phone: item.patient.phone || null,
          email: item.patient.email || null,
        }
      : null,
    status: item.status,
    diagnosis: item.diagnosis || null,
    medications: item.medications || [],
    investigations: item.investigations || [],
    advice: item.advice || null,
    validityInDays: item.validityInDays || 30,
    followUpAt: item.followUpAt || null,
  }));

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="prescriptions_${Date.now()}.json"`);
  return res.json({ success: true, prescriptions: formatted });
});

// Send prescription via email
exports.sendPrescriptionViaEmail = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const { prescriptionId } = req.params;
  const doctorId = req.auth.id;

  const prescription = await Prescription.findById(prescriptionId)
    .populate('patient', 'firstName lastName email')
    .populate('doctor', 'firstName lastName')
    .lean();

  if (!prescription) {
    return res.status(404).json({
      success: false,
      message: 'Prescription not found.',
    });
  }

  if (prescription.doctor._id.toString() !== doctorId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to send this prescription.',
    });
  }

  if (!prescription.patient.email) {
    return res.status(400).json({
      success: false,
      message: 'Patient email not available. Cannot send prescription via email.',
    });
  }

  const pdfPath = prescription.metadata?.pdfPath;
  if (!pdfPath) {
    return res.status(400).json({
      success: false,
      message: 'Prescription PDF not found. Please ensure the prescription has been generated.',
    });
  }

  const fs = require('fs');
  if (!fs.existsSync(pdfPath)) {
    return res.status(400).json({
      success: false,
      message: 'Prescription PDF file not found on server.',
    });
  }

  try {
    const doctorName = buildDoctorSummary(prescription.doctor)?.name || 'Doctor';
    const patientName = buildPatientSummary(prescription.patient)?.name || 'Patient';

    await sendPrescriptionEmail({
      patientEmail: prescription.patient.email,
      patientName,
      doctorName,
      prescriptionId: prescription._id.toString(),
      pdfPath,
      prescriptionDate: prescription.issuedAt,
    });

    res.json({
      success: true,
      message: 'Prescription sent via email successfully.',
      prescription: {
        id: prescription._id,
        patient: {
          id: prescription.patient._id,
          name: patientName,
          email: prescription.patient.email,
        },
        doctor: {
          id: prescription.doctor._id,
          name: doctorName,
        },
        sentAt: new Date(),
      },
    });
  } catch (emailError) {
    console.error('Failed to send prescription via email:', emailError);
    return res.status(500).json({
      success: false,
      message: 'Failed to send prescription via email.',
      error: emailError.message,
    });
  }
});

