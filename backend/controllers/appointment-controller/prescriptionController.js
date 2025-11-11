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

    if (!laboratories.length) {
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
        preferredLaboratories: laboratories.map((lab) => lab._id),
        tests,
        status: LAB_LEAD_STATUS.NEW,
      });
    } else {
      lead.preferredLaboratories = laboratories.map((lab) => lab._id);
      lead.tests = tests;
      lead.status = LAB_LEAD_STATUS.NEW;
    }

    await lead.save();
    await lead.populate('preferredLaboratories', 'labName phone email address');
    shareSummary = buildLabLeadSummary(lead.toObject());
  } else {
    const pharmacies = await Pharmacy.find({
      _id: { $in: uniqueTargetIds },
      status: APPROVAL_STATUS.APPROVED,
    })
      .select('pharmacyName phone email address')
      .lean();

    if (!pharmacies.length) {
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
        preferredPharmacies: pharmacies.map((pharmacy) => pharmacy._id),
        medicines,
        status: PHARMACY_LEAD_STATUS.NEW,
      });
    } else {
      lead.preferredPharmacies = pharmacies.map((pharmacy) => pharmacy._id);
      lead.medicines = medicines;
      lead.status = PHARMACY_LEAD_STATUS.NEW;
    }

    await lead.save();
    await lead.populate('preferredPharmacies', 'pharmacyName phone email address');
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

