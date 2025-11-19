const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/doctor-controllers/patientController');

const router = express.Router();

// List all patients with filters and search
router.get('/', protect(ROLES.DOCTOR), controller.listPatients);

// Search patients (quick search)
router.get('/search', protect(ROLES.DOCTOR), controller.searchPatients);

// Get patient statistics
router.get('/statistics', protect(ROLES.DOCTOR), controller.getPatientStatistics);

// Get patient details
router.get('/:patientId', protect(ROLES.DOCTOR), controller.getPatientDetails);

module.exports = router;

