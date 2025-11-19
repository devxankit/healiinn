const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/appointment-controller/consultationController');

const router = express.Router();

// List doctor consultations
router.get('/', protect(ROLES.DOCTOR), controller.listDoctorConsultations);

// Search consultations with advanced filters
router.get('/search', protect(ROLES.DOCTOR), controller.searchConsultations);

// Export consultations
router.get('/export', protect(ROLES.DOCTOR), controller.exportConsultations);

// Get patient record (must be before :consultationId routes)
router.get('/patient/:patientId', protect(ROLES.DOCTOR), controller.getDoctorPatientRecord);

// Consultation Templates (must be before :consultationId routes)
router.post('/templates', protect(ROLES.DOCTOR), controller.createConsultationTemplate);
router.get('/templates', protect(ROLES.DOCTOR), controller.listConsultationTemplates);
router.get('/templates/:templateId', protect(ROLES.DOCTOR), controller.getConsultationTemplate);
router.put('/templates/:templateId', protect(ROLES.DOCTOR), controller.updateConsultationTemplate);
router.delete('/templates/:templateId', protect(ROLES.DOCTOR), controller.deleteConsultationTemplate);

// Get consultation by ID (must be last to avoid conflicts)
router.get('/:consultationId', protect([ROLES.DOCTOR, ROLES.PATIENT, ROLES.ADMIN]), controller.getConsultation);

// Start consultation
router.post('/:consultationId/start', protect(ROLES.DOCTOR), controller.startConsultation);

// Pause consultation
router.post('/:consultationId/pause', protect(ROLES.DOCTOR), controller.pauseConsultation);

// Resume consultation
router.post('/:consultationId/resume', protect(ROLES.DOCTOR), controller.resumeConsultation);

// Add consultation attachment
router.post('/:consultationId/attachments', protect(ROLES.DOCTOR), controller.addConsultationAttachment);

// Remove consultation attachment
router.delete('/:consultationId/attachments/:attachmentIndex', protect(ROLES.DOCTOR), controller.removeConsultationAttachment);

// Use consultation template
router.post('/:consultationId/use-template', protect(ROLES.DOCTOR), controller.useConsultationTemplate);

// Update consultation
router.put('/:consultationId', protect(ROLES.DOCTOR), controller.updateConsultation);

// Complete consultation
router.put('/:consultationId/complete', protect(ROLES.DOCTOR), controller.completeConsultation);

module.exports = router;

