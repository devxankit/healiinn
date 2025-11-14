const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');
const { requireActiveSubscription } = require('../middleware/subscriptionMiddleware');
const controller = require('../controllers/pharmacy-controllers/pharmacyWorkflowController');

const router = express.Router();

router.get(
  '/leads',
  protect(ROLES.PHARMACY),
  requireActiveSubscription(ROLES.PHARMACY),
  controller.listLeads
);

router.patch(
  '/leads/:leadId/status',
  protect(ROLES.PHARMACY),
  requireActiveSubscription(ROLES.PHARMACY),
  controller.updateStatus
);

module.exports = router;

