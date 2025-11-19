const express = require('express');
const {
  registerPharmacy,
  loginPharmacy,
  requestLoginOtp,
  getPharmacyProfile,
  updatePharmacyProfile,
  logoutPharmacy,
  pharmacyForgotPassword,
  pharmacyVerifyOtp,
  pharmacyResetPassword,
  getPharmacyById,
} = require('../../controllers/pharmacy-controllers/pharmacyAuthController');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const { authRateLimiter, otpRateLimiter, passwordResetRateLimiter } = require('../../middleware/rateLimiter');
const { sanitizeInput } = require('../../middleware/validationMiddleware');

const router = express.Router();

// Apply rate limiting and input sanitization to auth endpoints
router.post('/signup', sanitizeInput, authRateLimiter, registerPharmacy);
router.post('/login/otp', sanitizeInput, otpRateLimiter, requestLoginOtp);
router.post('/login', sanitizeInput, authRateLimiter, loginPharmacy);
router.post('/forgot-password', sanitizeInput, passwordResetRateLimiter, pharmacyForgotPassword);
router.post('/verify-otp', sanitizeInput, otpRateLimiter, pharmacyVerifyOtp);
router.post('/reset-password', sanitizeInput, passwordResetRateLimiter, pharmacyResetPassword);

router.get('/me', protect(ROLES.PHARMACY), getPharmacyProfile);
router.put('/me', protect(ROLES.PHARMACY), sanitizeInput, updatePharmacyProfile);
router.post('/logout', protect(ROLES.PHARMACY), logoutPharmacy);
router.get('/profile/:id', protect(ROLES.PHARMACY, ROLES.ADMIN), getPharmacyById);

module.exports = router;


