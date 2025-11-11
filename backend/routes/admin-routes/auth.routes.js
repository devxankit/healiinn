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

const router = express.Router();

router.post('/signup', registerAdmin);
router.post('/login', loginAdmin);
router.get('/me', protect(ROLES.ADMIN), getAdminProfile);
router.put('/me', protect(ROLES.ADMIN), updateAdminProfile);
router.post('/logout', protect(ROLES.ADMIN), logoutAdmin);
router.post('/forgot-password', adminForgotPassword);
router.post('/verify-otp', adminVerifyOtp);
router.post('/reset-password', adminResetPassword);
router.get('/profile/:id', protect(ROLES.ADMIN), getAdminById);

module.exports = router;


