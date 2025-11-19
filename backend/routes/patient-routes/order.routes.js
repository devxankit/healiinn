const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/patient-controllers/orderController');

const router = express.Router();

// List all lab orders for patient with filters
router.get('/lab', protect(ROLES.PATIENT), controller.listLabOrders);

// List all pharmacy orders for patient with filters
router.get('/pharmacy', protect(ROLES.PATIENT), controller.listPharmacyOrders);

// Get lab order details with full tracking
router.get('/lab/:leadId', protect(ROLES.PATIENT), controller.getLabOrderDetails);

// Get pharmacy order details with full tracking
router.get('/pharmacy/:leadId', protect(ROLES.PATIENT), controller.getPharmacyOrderDetails);

module.exports = router;

