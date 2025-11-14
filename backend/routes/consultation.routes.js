const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');
const controller = require('../controllers/appointment-controller/consultationController');

const router = express.Router();

router.get(
  '/doctor/list',
  protect(ROLES.DOCTOR),
  controller.listDoctorConsultations
);

router.get(
  '/doctor/patient/:patientId',
  protect(ROLES.DOCTOR),
  controller.getDoctorPatientRecord
);

router.get(
  '/token/:tokenId',
  protect(ROLES.DOCTOR, ROLES.PATIENT, ROLES.ADMIN),
  controller.getConsultationsForToken
);

router.get(
  '/:consultationId',
  protect(ROLES.DOCTOR, ROLES.PATIENT, ROLES.ADMIN),
  controller.getConsultation
);

router.put(
  '/:consultationId',
  protect(ROLES.DOCTOR),
  controller.updateConsultation
);

router.put(
  '/:consultationId/complete',
  protect(ROLES.DOCTOR),
  controller.completeConsultation
);

module.exports = router;

