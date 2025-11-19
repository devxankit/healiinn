const express = require('express');
const {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
  logoutAdmin,
  adminForgotPassword,
  adminVerifyOtp,
  adminResetPassword,
  getAdminById,
} = require('../../controllers/admin-controllers/adminAuthController');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const { authRateLimiter, otpRateLimiter, passwordResetRateLimiter } = require('../../middleware/rateLimiter');
const { sanitizeInput } = require('../../middleware/validationMiddleware');

const router = express.Router();

// Apply rate limiting and input sanitization to auth endpoints
router.post('/signup', sanitizeInput, authRateLimiter, registerAdmin);
router.post('/login', sanitizeInput, authRateLimiter, loginAdmin);
router.post('/forgot-password', sanitizeInput, passwordResetRateLimiter, adminForgotPassword);
router.post('/verify-otp', sanitizeInput, otpRateLimiter, adminVerifyOtp);
router.post('/reset-password', sanitizeInput, passwordResetRateLimiter, adminResetPassword);

router.get('/me', protect(ROLES.ADMIN), getAdminProfile);
router.put('/me', protect(ROLES.ADMIN), sanitizeInput, updateAdminProfile);
router.post('/logout', protect(ROLES.ADMIN), logoutAdmin);
router.get('/profile/:id', protect(ROLES.ADMIN), getAdminById);

module.exports = router;


