const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/laboratory-controllers/patientController');

const router = express.Router();

// List patients
router.get('/', protect(ROLES.LABORATORY), controller.listPatients);

// Search patients
router.get('/search', protect(ROLES.LABORATORY), controller.searchPatients);

// Get patient details
router.get('/:patientId', protect(ROLES.LABORATORY), controller.getPatientDetails);

// Get patient test history
router.get('/:patientId/tests', protect(ROLES.LABORATORY), controller.getPatientTestHistory);

module.exports = router;

