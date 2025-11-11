const express = require('express');
const {
  registerPatient,
  loginPatient,
  getPatientProfile,
  updatePatientProfile,
  logoutPatient,
  patientForgotPassword,
  patientVerifyOtp,
  patientResetPassword,
  getPatientById,
} = require('../../controllers/patient-controller/patientAuthController');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');

const router = express.Router();

router.post('/signup', registerPatient);
router.post('/login', loginPatient);
router.get('/me', protect(ROLES.PATIENT), getPatientProfile);
router.put('/me', protect(ROLES.PATIENT), updatePatientProfile);
router.post('/logout', protect(ROLES.PATIENT), logoutPatient);
router.post('/forgot-password', patientForgotPassword);
router.post('/verify-otp', patientVerifyOtp);
router.post('/reset-password', patientResetPassword);
router.get('/profile/:id', protect(ROLES.PATIENT, ROLES.ADMIN), getPatientById);

module.exports = router;


