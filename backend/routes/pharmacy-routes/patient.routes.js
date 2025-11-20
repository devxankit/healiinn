const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/pharmacy-controllers/patientController');

const router = express.Router();

// List patients
router.get('/', protect(ROLES.PHARMACY), controller.listPatients);

// Search patients
router.get('/search', protect(ROLES.PHARMACY), controller.searchPatients);

// Get patient details
router.get('/:patientId', protect(ROLES.PHARMACY), controller.getPatientDetails);

// Get patient order history
router.get('/:patientId/orders', protect(ROLES.PHARMACY), controller.getPatientOrderHistory);

module.exports = router;

