const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');
const { requireActiveSubscription } = require('../middleware/subscriptionMiddleware');
const controller = require('../controllers/laboratory-controllers/labWorkflowController');

const router = express.Router();

router.get(
  '/leads',
  protect(ROLES.LABORATORY),
  requireActiveSubscription(ROLES.LABORATORY),
  controller.listLeads
);

router.patch(
  '/leads/:leadId/status',
  protect(ROLES.LABORATORY),
  requireActiveSubscription(ROLES.LABORATORY),
  controller.updateStatus
);

module.exports = router;

