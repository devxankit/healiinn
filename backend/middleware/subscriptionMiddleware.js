const asyncHandler = require('./asyncHandler');
const subscriptionService = require('../services/subscriptionService');

const requireActiveSubscription = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!req.auth || (roles.length && !roles.includes(req.auth.role))) {
      return next();
    }

    const subscription = await subscriptionService.getActiveSubscriptionFor({
      subscriberId: req.auth.id,
      role: req.auth.role,
    });

    if (!subscription) {
      const error = new Error(
        'Your subscription is inactive or has expired. Please renew to continue using the platform.'
      );
      error.status = 403;
      throw error;
    }

    req.subscription = subscription;
    next();
  });

module.exports = {
  requireActiveSubscription,
};


