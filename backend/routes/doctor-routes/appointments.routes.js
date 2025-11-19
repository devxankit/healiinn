const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const queueController = require('../../controllers/appointment-controller/queueController');
const appointmentController = require('../../controllers/appointment-controller/appointmentController');

const router = express.Router();

// List doctor appointments
router.get('/', protect(ROLES.DOCTOR), queueController.listDoctorAppointments);

// Get appointment by ID
router.get('/:appointmentId', protect(ROLES.DOCTOR), appointmentController.getAppointment);

// Accept appointment
router.patch('/:appointmentId/accept', protect(ROLES.DOCTOR), appointmentController.acceptAppointment);

// Reject appointment
router.patch('/:appointmentId/reject', protect(ROLES.DOCTOR), appointmentController.rejectAppointment);

// Reschedule appointment (doctor-initiated)
router.patch('/:appointmentId/reschedule', protect(ROLES.DOCTOR), appointmentController.rescheduleAppointment);

// Cancel appointment (doctor-initiated)
router.patch('/:appointmentId/cancel', protect(ROLES.DOCTOR), appointmentController.cancelAppointment);

// Mark appointment as completed
router.patch('/:appointmentId/complete', protect(ROLES.DOCTOR), appointmentController.completeAppointment);

// Update appointment notes
router.patch('/:appointmentId/notes', protect(ROLES.DOCTOR), appointmentController.updateAppointmentNotes);

// Send appointment reminder
router.post('/:appointmentId/reminder', protect(ROLES.DOCTOR), appointmentController.sendAppointmentReminder);

module.exports = router;

