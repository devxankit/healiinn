const express = require('express');
const {
  registerLaboratory,
  loginLaboratory,
  requestLoginOtp,
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
const { authRateLimiter, otpRateLimiter, passwordResetRateLimiter } = require('../../middleware/rateLimiter');
const { sanitizeInput } = require('../../middleware/validationMiddleware');

const router = express.Router();

// Apply rate limiting and input sanitization to auth endpoints
router.post('/signup', sanitizeInput, authRateLimiter, registerLaboratory);
router.post('/login/otp', sanitizeInput, otpRateLimiter, requestLoginOtp);
router.post('/login', sanitizeInput, authRateLimiter, loginLaboratory);
router.post('/forgot-password', sanitizeInput, passwordResetRateLimiter, laboratoryForgotPassword);
router.post('/verify-otp', sanitizeInput, otpRateLimiter, laboratoryVerifyOtp);
router.post('/reset-password', sanitizeInput, passwordResetRateLimiter, laboratoryResetPassword);

router.get('/me', protect(ROLES.LABORATORY), getLaboratoryProfile);
router.put('/me', protect(ROLES.LABORATORY), sanitizeInput, updateLaboratoryProfile);
router.post('/logout', protect(ROLES.LABORATORY), logoutLaboratory);
router.get('/profile/:id', protect(ROLES.LABORATORY, ROLES.ADMIN), getLaboratoryById);

module.exports = router;


