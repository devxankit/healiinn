const express = require('express');
const router = express.Router();

// Auth routes
router.use('/auth', require('./auth.routes'));

// Dashboard routes
router.use('/dashboard', require('./dashboard.routes'));

// Wallet routes
router.use('/wallet', require('./wallet.routes'));

// Transaction routes
router.use('/transactions', require('./transaction.routes'));

// Patient routes
router.use('/patients', require('./patients.routes'));

// Appointment routes
router.use('/appointments', require('./appointments.routes'));

// Consultation routes
router.use('/consultations', require('./consultations.routes'));

// Prescription routes
router.use('/prescriptions', require('./prescriptions.routes'));

// Notification routes
router.use('/notifications', require('./notifications.routes'));

// Review routes
router.use('/reviews', require('./reviews.routes'));

// Availability routes
router.use('/availability', require('./availability.routes'));

module.exports = router;

