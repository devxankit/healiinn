const asyncHandler = require('../../middleware/asyncHandler');
const subscriptionService = require('../../services/subscriptionService');
const { ROLES } = require('../../utils/constants');

const sanitizeRole = (role) => {
  if (!role) {
    return undefined;
  }

  if ([ROLES.LABORATORY, ROLES.PHARMACY, ROLES.DOCTOR].includes(role)) {
    return role;
  }

  const error = new Error('Unsupported role filter.');
  error.status = 400;
  throw error;
};

exports.getPlan = asyncHandler(async (req, res) => {
  const plan = await subscriptionService.getPlan();

  res.json({
    success: true,
    plan,
  });
});

exports.updatePlan = asyncHandler(async (req, res) => {
  const plan = await subscriptionService.upsertSubscriptionPlan(req.body || {});

  res.json({
    success: true,
    message: 'Subscription plan updated successfully.',
    plan,
  });
});

exports.listSubscriptions = asyncHandler(async (req, res) => {
  const { status, role, page, limit, expiringBefore, expiringAfter } = req.query;

  const result = await subscriptionService.listSubscriptions({
    status,
    role: sanitizeRole(role),
    page,
    limit,
    expiringBefore,
    expiringAfter,
  });

  res.json({
    success: true,
    ...result,
  });
});

exports.listUpcoming = asyncHandler(async (req, res) => {
  const { days, role } = req.query;

  const items = await subscriptionService.listUpcomingExpiries({
    days: days ? Number(days) : undefined,
    role: sanitizeRole(role),
  });

  res.json({
    success: true,
    items,
  });
});

exports.getSubscriberHistory = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  const role = sanitizeRole(req.params.role);

  const history = await subscriptionService.getSubscriptionHistoryFor({
    subscriberId,
    role,
  });

  res.json({
    success: true,
    history,
  });
});


