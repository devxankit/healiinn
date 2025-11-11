const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');
const controller = require('../controllers/pharmacy-controllers/pharmacyWorkflowController');

const router = express.Router();

router.get('/leads', protect(ROLES.PHARMACY), controller.listLeads);
router.post('/leads/:leadId/quotes', protect(ROLES.PHARMACY), controller.createQuote);
router.post('/quotes/:quoteId/accept', protect(ROLES.PATIENT, ROLES.ADMIN), controller.acceptQuote);
router.get('/orders', protect(ROLES.PHARMACY), controller.listOrders);

module.exports = router;

