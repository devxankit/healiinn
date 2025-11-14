const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');
const controller = require('../controllers/subscriptionController');

const router = express.Router();

router.get(
  '/plan',
  protect(ROLES.LABORATORY, ROLES.PHARMACY, ROLES.DOCTOR),
  controller.getAvailablePlan
);

router.get(
  '/me',
  protect(ROLES.LABORATORY, ROLES.PHARMACY, ROLES.DOCTOR),
  controller.getMySubscription
);

router.get(
  '/history',
  protect(ROLES.LABORATORY, ROLES.PHARMACY, ROLES.DOCTOR),
  controller.getSubscriptionHistory
);

router.post(
  '/order',
  protect(ROLES.LABORATORY, ROLES.PHARMACY, ROLES.DOCTOR),
  controller.createSubscriptionOrder
);

router.post(
  '/verify',
  protect(ROLES.LABORATORY, ROLES.PHARMACY, ROLES.DOCTOR),
  controller.verifySubscription
);

module.exports = router;


