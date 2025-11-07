const express = require('express');
const {
  registerDoctor,
  loginDoctor,
  getDoctorProfile,
  updateDoctorProfile,
  logoutDoctor,
  doctorForgotPassword,
  doctorVerifyOtp,
  doctorResetPassword,
  getDoctorById,
} = require('../../controllers/doctor-controllers/doctorAuthController');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');

const router = express.Router();

router.post('/signup', registerDoctor);
router.post('/login', loginDoctor);
router.get('/me', protect(ROLES.DOCTOR), getDoctorProfile);
router.put('/me', protect(ROLES.DOCTOR), updateDoctorProfile);
router.post('/logout', protect(ROLES.DOCTOR), logoutDoctor);
router.post('/forgot-password', doctorForgotPassword);
router.post('/verify-otp', doctorVerifyOtp);
router.post('/reset-password', doctorResetPassword);
router.get('/profile/:id', protect(ROLES.DOCTOR, ROLES.ADMIN), getDoctorById);

module.exports = router;


