const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/patient-controllers/favoritesController');

const router = express.Router();

// Doctor favorites routes
router.get('/doctors', protect(ROLES.PATIENT), controller.getFavoriteDoctors);
router.post('/doctors/:doctorId', protect(ROLES.PATIENT), controller.addFavoriteDoctor);
router.delete('/doctors/:doctorId', protect(ROLES.PATIENT), controller.removeFavoriteDoctor);

// Laboratory favorites routes
router.get('/labs', protect(ROLES.PATIENT), controller.getFavoriteLabs);
router.post('/labs/:labId', protect(ROLES.PATIENT), controller.addFavoriteLab);
router.delete('/labs/:labId', protect(ROLES.PATIENT), controller.removeFavoriteLab);

// Pharmacy favorites routes
router.get('/pharmacies', protect(ROLES.PATIENT), controller.getFavoritePharmacies);
router.post('/pharmacies/:pharmacyId', protect(ROLES.PATIENT), controller.addFavoritePharmacy);
router.delete('/pharmacies/:pharmacyId', protect(ROLES.PATIENT), controller.removeFavoritePharmacy);

module.exports = router;

