const asyncHandler = require('../middleware/asyncHandler');
const subscriptionService = require('../services/subscriptionService');
const { SUPPORTED_SUBSCRIBER_ROLES } = require('../services/subscriptionService');

const ensureRoleAllowed = (role) => {
  if (!SUPPORTED_SUBSCRIBER_ROLES.includes(role)) {
    const error = new Error('Subscriptions are not available for this role.');
    error.status = 403;
    throw error;
  }
};

exports.getAvailablePlan = asyncHandler(async (req, res) => {
  ensureRoleAllowed(req.auth.role);

  const plan = await subscriptionService.getPlanForRole(req.auth.role);

  res.json({
    success: true,
    plan,
  });
});

exports.getMySubscription = asyncHandler(async (req, res) => {
  ensureRoleAllowed(req.auth.role);

  const [activeSubscription, history] = await Promise.all([
    subscriptionService.getActiveSubscriptionFor({
      subscriberId: req.auth.id,
      role: req.auth.role,
    }),
    subscriptionService.getSubscriptionHistoryFor({
      subscriberId: req.auth.id,
      role: req.auth.role,
    }),
  ]);

  res.json({
    success: true,
    active: activeSubscription,
    history,
  });
});

exports.getSubscriptionHistory = asyncHandler(async (req, res) => {
  ensureRoleAllowed(req.auth.role);

  const history = await subscriptionService.getSubscriptionHistoryFor({
    subscriberId: req.auth.id,
    role: req.auth.role,
  });

  res.json({
    success: true,
    history,
  });
});

exports.createSubscriptionOrder = asyncHandler(async (req, res) => {
  ensureRoleAllowed(req.auth.role);

  const { durationKey } = req.body;

  if (!durationKey) {
    return res.status(400).json({
      success: false,
      message: 'durationKey is required to create a subscription order.',
    });
  }

  const result = await subscriptionService.createSubscriptionOrder({
    subscriberId: req.auth.id,
    role: req.auth.role,
    durationKey,
  });

  res.status(201).json({
    success: true,
    subscription: result.subscription,
    order: result.order,
    plan: result.plan,
    duration: result.duration,
  });
});

exports.verifySubscription = asyncHandler(async (req, res) => {
  ensureRoleAllowed(req.auth.role);

  const { subscriptionId, orderId, paymentId, signature } = req.body;

  if (!subscriptionId || !orderId || !paymentId || !signature) {
    return res.status(400).json({
      success: false,
      message: 'subscriptionId, orderId, paymentId, and signature are required.',
    });
  }

  const subscription = await subscriptionService.verifyAndActivateSubscription({
    subscriptionId,
    orderId,
    paymentId,
    signature,
    expectedSubscriberId: req.auth.id,
    expectedRole: req.auth.role,
  });

  res.json({
    success: true,
    message: 'Subscription activated successfully.',
    subscription,
  });
});


