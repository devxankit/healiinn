const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');
const controller = require('../controllers/appointment-controller/queueController');

const router = express.Router();

router.post('/clinics', protect(ROLES.DOCTOR), controller.createClinic);
router.get('/clinics', protect(ROLES.DOCTOR), controller.listClinics);
router.post('/sessions', protect(ROLES.DOCTOR), controller.createSession);
router.patch('/sessions/:sessionId/start', protect(ROLES.DOCTOR), controller.startSession);
router.patch('/sessions/:sessionId/end', protect(ROLES.DOCTOR), controller.endSession);
router.patch('/sessions/:sessionId/cancel', protect(ROLES.DOCTOR), controller.cancelSession);
router.patch('/sessions/:sessionId/pause', protect(ROLES.DOCTOR), controller.pauseSession);
router.patch('/sessions/:sessionId/resume', protect(ROLES.DOCTOR), controller.resumeSession);
router.patch('/sessions/:sessionId/average-time', protect(ROLES.DOCTOR), controller.updateSessionAverageTime);
router.get('/sessions/:sessionId', protect(ROLES.DOCTOR, ROLES.ADMIN), controller.getSessionDetails);
router.get(
  '/sessions/:sessionId/state',
  protect(ROLES.DOCTOR, ROLES.PATIENT, ROLES.ADMIN),
  controller.getSessionState
);
router.get('/sessions', protect(ROLES.DOCTOR), controller.listDoctorSessions);

router.post(
  '/sessions/:sessionId/tokens',
  protect(ROLES.PATIENT, ROLES.ADMIN),
  controller.issueToken
);

router.patch('/tokens/:tokenId/status', protect(ROLES.DOCTOR), controller.updateTokenStatus);
router.patch('/tokens/:tokenId/checkin', protect(ROLES.PATIENT), controller.checkinToken);
router.patch('/tokens/:tokenId/cancel', protect(ROLES.PATIENT, ROLES.ADMIN), controller.cancelToken);
router.get('/tokens/:tokenId', protect(ROLES.PATIENT, ROLES.DOCTOR, ROLES.ADMIN), controller.getTokenDetails);

router.get('/patient/tokens', protect(ROLES.PATIENT), controller.listPatientTokens);
router.get('/patient/list', protect(ROLES.PATIENT), controller.listPatientAppointments);

router.get('/doctor/list', protect(ROLES.DOCTOR), controller.listDoctorAppointments);

module.exports = router;

