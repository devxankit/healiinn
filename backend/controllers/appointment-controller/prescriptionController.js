const mongoose = require('mongoose');
const asyncHandler = require('../../middleware/asyncHandler');
const {
  ROLES,
  APPROVAL_STATUS,
  LAB_LEAD_STATUS,
  PHARMACY_LEAD_STATUS,
} = require('../../utils/constants');
const Prescription = require('../../models/Prescription');
const LabLead = require('../../models/LabLead');
const PharmacyLead = require('../../models/PharmacyLead');
const Laboratory = require('../../models/Laboratory');
const Pharmacy = require('../../models/Pharmacy');
const { createPrescription } = require('../../services/prescriptionService');

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
    criteria.issuedAt = {};
    if (from) {
      criteria.issuedAt.$gte = new Date(from);
    }
    if (to) {
      criteria.issuedAt.$lte = new Date(to);
    }
  }

  const skip = (page - 1) * limit;

  const [prescriptions, total] = await Promise.all([
    Prescription.find(criteria)
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
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
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

