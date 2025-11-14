const express = require('express');
const discoveryController = require('../controllers/discoveryController');

const router = express.Router();

router.get('/doctors', discoveryController.nearbyDoctors);
router.get('/laboratories', discoveryController.nearbyLaboratories);
router.get('/pharmacies', discoveryController.nearbyPharmacies);

module.exports = router;


