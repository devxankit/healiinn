const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/appointment-controller/prescriptionController');

const router = express.Router();

// Create or update prescription
router.post('/', protect(ROLES.DOCTOR), controller.createOrUpdate);

// List doctor prescriptions
router.get('/', protect(ROLES.DOCTOR), controller.listDoctorPrescriptions);

// Get prescription analytics
router.get('/analytics', protect(ROLES.DOCTOR), controller.getPrescriptionAnalytics);

// Export prescriptions
router.get('/export', protect(ROLES.DOCTOR), controller.exportPrescriptions);

// Prescription Templates
router.post('/templates', protect(ROLES.DOCTOR), controller.createPrescriptionTemplate);
router.get('/templates', protect(ROLES.DOCTOR), controller.listPrescriptionTemplates);
router.get('/templates/:templateId', protect(ROLES.DOCTOR), controller.getPrescriptionTemplate);
router.put('/templates/:templateId', protect(ROLES.DOCTOR), controller.updatePrescriptionTemplate);
router.delete('/templates/:templateId', protect(ROLES.DOCTOR), controller.deletePrescriptionTemplate);

// Get prescription by ID
router.get('/:prescriptionId', protect([ROLES.DOCTOR, ROLES.PATIENT, ROLES.ADMIN]), controller.getPrescription);

// Send prescription via email
router.post('/:prescriptionId/send-email', protect(ROLES.DOCTOR), controller.sendPrescriptionViaEmail);

// Revoke prescription
router.patch('/:prescriptionId/revoke', protect(ROLES.DOCTOR), controller.revokePrescription);

// Extend prescription validity
router.patch('/:prescriptionId/extend-validity', protect(ROLES.DOCTOR), controller.extendPrescriptionValidity);

module.exports = router;

