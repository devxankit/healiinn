const express = require('express');
const {
  registerLaboratory,
  loginLaboratory,
  getLaboratoryProfile,
  updateLaboratoryProfile,
  logoutLaboratory,
  laboratoryForgotPassword,
  laboratoryVerifyOtp,
  laboratoryResetPassword,
  getLaboratoryById,
} = require('../../controllers/laboratory-controllers/laboratoryAuthController');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');

const router = express.Router();

router.post('/signup', registerLaboratory);
router.post('/login', loginLaboratory);
router.get('/me', protect(ROLES.LABORATORY), getLaboratoryProfile);
router.put('/me', protect(ROLES.LABORATORY), updateLaboratoryProfile);
router.post('/logout', protect(ROLES.LABORATORY), logoutLaboratory);
router.post('/forgot-password', laboratoryForgotPassword);
router.post('/verify-otp', laboratoryVerifyOtp);
router.post('/reset-password', laboratoryResetPassword);
router.get('/profile/:id', protect(ROLES.LABORATORY, ROLES.ADMIN), getLaboratoryById);

module.exports = router;


