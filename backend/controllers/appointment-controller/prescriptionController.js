const asyncHandler = require('../../middleware/asyncHandler');
const { ROLES } = require('../../utils/constants');
const Prescription = require('../../models/Prescription');
const { createPrescription } = require('../../services/prescriptionService');

const ensureRole = (role, allowed) => {
  if (!allowed.includes(role)) {
    const error = new Error('You do not have access to this resource');
    error.status = 403;
    throw error;
  }
};

exports.createOrUpdate = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const result = await createPrescription({
    consultationId: req.body.consultationId,
    doctorId: req.auth.id,
    payload: req.body,
    io: req.app.get('io'),
  });

  res.status(201).json({
    success: true,
    ...result,
  });
});

exports.getPrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.prescriptionId)
    .populate('doctor', 'firstName lastName')
    .populate('patient', 'firstName lastName')
    .lean();

  if (!prescription) {
    return res.status(404).json({ success: false, message: 'Prescription not found' });
  }

  const { role, id } = req.auth;

  if (role === ROLES.DOCTOR && prescription.doctor._id.toString() !== id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  if (role === ROLES.PATIENT && prescription.patient._id.toString() !== id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  res.json({
    success: true,
    prescription,
  });
});

exports.listPatientPrescriptions = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const prescriptions = await Prescription.find({ patient: req.auth.id })
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    prescriptions,
  });
});

