const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');
const controller = require('../controllers/laboratory-controllers/labWorkflowController');

const router = express.Router();

router.get('/leads', protect(ROLES.LABORATORY), controller.listLeads);
router.post('/leads/:leadId/quotes', protect(ROLES.LABORATORY), controller.createQuote);
router.post('/quotes/:quoteId/accept', protect(ROLES.PATIENT, ROLES.ADMIN), controller.acceptQuote);
router.get('/orders', protect(ROLES.LABORATORY), controller.listOrders);

module.exports = router;

