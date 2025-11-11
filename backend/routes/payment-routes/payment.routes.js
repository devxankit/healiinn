const express = require('express');
const { createPaymentOrder, verifyPaymentSignature } = require('../../controllers/payment-controller/paymentController');
const { protect } = require('../../middleware/authMiddleware');

const router = express.Router();

router.post('/orders', protect(), createPaymentOrder);
router.post('/verify', protect(), verifyPaymentSignature);

module.exports = router;
