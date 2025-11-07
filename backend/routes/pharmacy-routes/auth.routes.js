const express = require('express');
const {
  registerPharmacy,
  loginPharmacy,
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

const router = express.Router();

router.post('/signup', registerPharmacy);
router.post('/login', loginPharmacy);
router.get('/me', protect(ROLES.PHARMACY), getPharmacyProfile);
router.put('/me', protect(ROLES.PHARMACY), updatePharmacyProfile);
router.post('/logout', protect(ROLES.PHARMACY), logoutPharmacy);
router.post('/forgot-password', pharmacyForgotPassword);
router.post('/verify-otp', pharmacyVerifyOtp);
router.post('/reset-password', pharmacyResetPassword);
router.get('/profile/:id', protect(ROLES.PHARMACY, ROLES.ADMIN), getPharmacyById);

module.exports = router;


