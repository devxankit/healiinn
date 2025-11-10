const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');
const controller = require('../controllers/appointment-controller/prescriptionController');

const router = express.Router();

router.post('/', protect(ROLES.DOCTOR), controller.createOrUpdate);

router.get(
  '/:prescriptionId',
  protect(ROLES.DOCTOR, ROLES.PATIENT, ROLES.ADMIN),
  controller.getPrescription
);

router.get(
  '/patient/list',
  protect(ROLES.PATIENT),
  controller.listPatientPrescriptions
);

module.exports = router;

