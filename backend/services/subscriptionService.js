const mongoose = require('mongoose');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const { createOrder, verifySignature } = require('./razorpayService');
const {
  ROLES,
  SUBSCRIPTION_STATUS,
  APPROVAL_STATUS,
} = require('../utils/constants');
const { getModelForRole } = require('../utils/getModelForRole');
const {
  ROLE_MODEL_MAP,
  recordSubscriptionEarning,
} = require('./adminWalletService');

const SUPPORTED_SUBSCRIBER_ROLES = [ROLES.LABORATORY, ROLES.PHARMACY, ROLES.DOCTOR];
const DEFAULT_RECEIPT_PREFIX = 'subscription';

const roleToModel = ROLE_MODEL_MAP;

const ensureObjectId = (value) =>
  typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value;

const sanitizeDurations = (durations = []) => {
  const uniqueKeys = new Set();
  const sanitized = durations
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      key: String(item.key || '').trim(),
      label: item.label ? String(item.label).trim() : undefined,
      durationInDays: Number(item.durationInDays || 0),
      price: Number(item.price || 0),
      isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
    }))
    .filter((item) => item.key && item.durationInDays > 0 && item.price >= 0);

  const deduped = [];
  sanitized.forEach((item) => {
    if (uniqueKeys.has(item.key)) {
      return;
    }
    uniqueKeys.add(item.key);
    deduped.push(item);
  });

  if (!deduped.length) {
    throw new Error('At least one valid duration configuration is required.');
  }

  return deduped;
};

const getPlan = async () => SubscriptionPlan.findOne({});

const getActivePlan = async () => SubscriptionPlan.findOne({ isActive: true });

const getActivePlanOrThrow = async () => {
  const plan = await getActivePlan();
  if (!plan) {
    const error = new Error('No active subscription plan configured.');
    error.status = 404;
    throw error;
  }
  return plan;
};

const upsertSubscriptionPlan = async (payload) => {
  const durations = sanitizeDurations(payload.durations || []);
  const applicableRoles = Array.isArray(payload.applicableRoles)
    ? payload.applicableRoles.filter((role) => SUPPORTED_SUBSCRIBER_ROLES.includes(role))
    : [ROLES.LABORATORY, ROLES.PHARMACY];

  if (!applicableRoles.length) {
    throw new Error('At least one applicable role is required for the subscription plan.');
  }

  const update = {
    name: payload.name ? String(payload.name).trim() : 'Subscription Plan',
    description: payload.description ? String(payload.description).trim() : undefined,
    applicableRoles,
    durations,
    currency: payload.currency ? String(payload.currency).trim().toUpperCase() : 'INR',
    isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
    metadata: payload.metadata,
  };

  const plan = await SubscriptionPlan.findOneAndUpdate({}, update, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  });

  return plan;
};

const getPlanForRole = async (role) => {
  const plan = await getActivePlanOrThrow();
  if (!plan.applicableRoles.includes(role)) {
    const error = new Error('No subscription plan available for this role.');
    error.status = 404;
    throw error;
  }

  const durations = (plan.durations || []).filter((duration) => duration.isActive);

  if (!durations.length) {
    const error = new Error('No active subscription durations configured. Contact administrator.');
    error.status = 400;
    throw error;
  }

  return {
    _id: plan._id,
    name: plan.name,
    description: plan.description,
    currency: plan.currency,
    durations,
  };
};

const getLatestActiveSubscription = ({ subscriberId, role }) =>
  Subscription.findOne({
    subscriber: ensureObjectId(subscriberId),
    subscriberRole: role,
    status: SUBSCRIPTION_STATUS.ACTIVE,
  })
    .sort({ endsAt: -1 })
    .lean();

const ensureRoleSupported = (role) => {
  if (!SUPPORTED_SUBSCRIBER_ROLES.includes(role)) {
    const error = new Error('Subscription is not supported for this role.');
    error.status = 400;
    throw error;
  }
};

const ensureVerifiedAccount = async ({ role, entityId }) => {
  const Model = getModelForRole(role);
  const record = await Model.findById(entityId);

  if (!record) {
    const error = new Error('Account not found.');
    error.status = 404;
    throw error;
  }

  if (record.status !== APPROVAL_STATUS.APPROVED) {
    const error = new Error('Account is not approved yet.');
    error.status = 403;
    throw error;
  }

  return record;
};

const createSubscriptionOrder = async ({ subscriberId, role, durationKey }) => {
  ensureRoleSupported(role);

  const subscriberModel = roleToModel[role];
  if (!subscriberModel) {
    const error = new Error('Invalid subscriber role.');
    error.status = 400;
    throw error;
  }

  await ensureVerifiedAccount({ role, entityId: subscriberId });

  const plan = await getPlanForRole(role);
  const duration = plan.durations.find((item) => item.key === durationKey);

  if (!duration) {
    const error = new Error('Selected subscription duration is not available.');
    error.status = 400;
    throw error;
  }

  const now = new Date();
  const pendingSubscription = new Subscription({
    subscriber: ensureObjectId(subscriberId),
    subscriberModel,
    subscriberRole: role,
    plan: plan._id,
    durationKey: duration.key,
    durationInDays: duration.durationInDays,
    amount: duration.price,
    currency: plan.currency,
    status: SUBSCRIPTION_STATUS.PENDING,
    metadata: {
      durationLabel: duration.label,
      createdAt: now.toISOString(),
    },
  });

  const existingActive = await getLatestActiveSubscription({ subscriberId, role });
  if (existingActive) {
    pendingSubscription.renewedFrom = existingActive._id;
    pendingSubscription.metadata.previousEndsAt = existingActive.endsAt;
  }

  await pendingSubscription.save();

  const receipt = `${DEFAULT_RECEIPT_PREFIX}_${pendingSubscription._id.toString()}`;

  const order = await createOrder({
    amount: duration.price,
    currency: plan.currency,
    receipt,
    notes: {
      subscriptionId: pendingSubscription._id.toString(),
      subscriberRole: role,
    },
  });

  await Payment.create({
    orderId: order.id,
    amount: duration.price,
    currency: order.currency || plan.currency,
    user: ensureObjectId(subscriberId),
    userModel: subscriberModel,
    role,
    type: 'subscription',
    status: 'pending',
    metadata: {
      subscriptionId: pendingSubscription._id.toString(),
      planId: plan._id.toString(),
      durationKey: duration.key,
      durationInDays: duration.durationInDays,
    },
    razorpayResponse: order,
  });

  pendingSubscription.orderId = order.id;
  await pendingSubscription.save();

  return {
    subscription: pendingSubscription.toObject(),
    order,
    plan,
    duration,
  };
};

const findPaymentByOrderId = async (orderId) => Payment.findOne({ orderId });

const markSubscriptionAsFailed = async ({ subscription, payment, signature }) => {
  subscription.status = SUBSCRIPTION_STATUS.CANCELLED;
  await subscription.save();

  if (payment) {
    payment.status = 'failed';
    payment.metadata = {
      ...payment.metadata,
      failureReason: 'Invalid signature',
      signature,
    };
    await payment.save();
  }
};

const verifyAndActivateSubscription = async ({
  subscriptionId,
  orderId,
  paymentId,
  signature,
  expectedSubscriberId,
  expectedRole,
}) => {
  const subscription = await Subscription.findById(subscriptionId);

  if (!subscription) {
    const error = new Error('Subscription request not found.');
    error.status = 404;
    throw error;
  }

  if (
    expectedSubscriberId &&
    subscription.subscriber.toString() !== ensureObjectId(expectedSubscriberId).toString()
  ) {
    const error = new Error('You are not authorized to confirm this subscription.');
    error.status = 403;
    throw error;
  }

  if (expectedRole && subscription.subscriberRole !== expectedRole) {
    const error = new Error('Subscription role mismatch.');
    error.status = 403;
    throw error;
  }

  if (subscription.status === SUBSCRIPTION_STATUS.ACTIVE) {
    return Subscription.findById(subscriptionId).lean();
  }

  if (subscription.orderId !== orderId) {
    const error = new Error('Order mismatch for subscription verification.');
    error.status = 400;
    throw error;
  }

  const payment = await findPaymentByOrderId(orderId);

  if (!payment) {
    const error = new Error('Payment order not found. Please create a new order.');
    error.status = 404;
    throw error;
  }

  let isValidSignature = false;

  try {
    isValidSignature = verifySignature({ orderId, paymentId, signature });
  } catch (error) {
    await markSubscriptionAsFailed({ subscription, payment, signature });
    throw error;
  }

  if (!isValidSignature) {
    await markSubscriptionAsFailed({ subscription, payment, signature });
    const error = new Error('Invalid payment signature.');
    error.status = 400;
    throw error;
  }

  payment.status = 'success';
  payment.paymentId = paymentId;
  payment.metadata = {
    ...payment.metadata,
    signature,
  };
  await payment.save();

  const now = new Date();
  const startsAt = now;
  const endsAt = new Date(startsAt.getTime() + subscription.durationInDays * 24 * 60 * 60 * 1000);

  subscription.status = SUBSCRIPTION_STATUS.ACTIVE;
  subscription.payment = payment._id;
  subscription.startsAt = startsAt;
  subscription.endsAt = endsAt;
  subscription.metadata = {
    ...subscription.metadata,
    activatedAt: now.toISOString(),
  };

  await subscription.save();

  await recordSubscriptionEarning({
    role: subscription.subscriberRole,
    subscriberId: subscription.subscriber,
    subscriptionId: subscription._id,
    paymentId: payment._id,
    orderId,
    amount: subscription.amount,
    currency: subscription.currency,
    description: `Subscription purchase (${subscription.durationKey})`,
    metadata: {
      durationInDays: subscription.durationInDays,
      planId: subscription.plan,
    },
  });

  return Subscription.findById(subscription._id).lean();
};

const getActiveSubscriptionFor = async ({ subscriberId, role }) =>
  Subscription.findOne({
    subscriber: ensureObjectId(subscriberId),
    subscriberRole: role,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    endsAt: { $gte: new Date() },
  })
    .sort({ endsAt: -1 })
    .lean();

const listSubscriptions = async ({ status, role, page = 1, limit = 20, expiringBefore, expiringAfter }) => {
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const match = {};

  if (status && Object.values(SUBSCRIPTION_STATUS).includes(status)) {
    match.status = status;
  }

  if (role && SUPPORTED_SUBSCRIBER_ROLES.includes(role)) {
    match.subscriberRole = role;
  }

  if (expiringBefore || expiringAfter) {
    match.endsAt = {};
    if (expiringAfter) {
      match.endsAt.$gte = new Date(expiringAfter);
    }
    if (expiringBefore) {
      match.endsAt.$lte = new Date(expiringBefore);
    }
  }

  const query = Subscription.find(match)
    .populate('subscriber', 'firstName lastName labName pharmacyName email phone status')
    .populate('plan', 'name')
    .sort({ createdAt: -1 });

  const [items, total] = await Promise.all([
    query.skip(skip).limit(safeLimit).lean(),
    Subscription.countDocuments(match),
  ]);

  return {
    items,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit) || 1,
    },
  };
};

const listUpcomingExpiries = async ({ days = 7, role } = {}) => {
  const now = new Date();
  const future = new Date(now.getTime() + Number(days) * 24 * 60 * 60 * 1000);

  const match = {
    status: SUBSCRIPTION_STATUS.ACTIVE,
    endsAt: { $gte: now, $lte: future },
  };

  if (role && SUPPORTED_SUBSCRIBER_ROLES.includes(role)) {
    match.subscriberRole = role;
  }

  return Subscription.find(match)
    .populate('subscriber', 'firstName lastName labName pharmacyName email phone status')
    .sort({ endsAt: 1 })
    .lean();
};

const getSubscriptionHistoryFor = async ({ subscriberId, role }) =>
  Subscription.find({
    subscriber: ensureObjectId(subscriberId),
    subscriberRole: role,
  })
    .populate('plan', 'name')
    .sort({ createdAt: -1 })
    .lean();

const expireElapsedSubscriptions = async () => {
  const now = new Date();
  const { modifiedCount } = await Subscription.updateMany(
    {
      status: SUBSCRIPTION_STATUS.ACTIVE,
      endsAt: { $lte: now },
    },
    {
      $set: {
        status: SUBSCRIPTION_STATUS.EXPIRED,
        'metadata.expiredAt': now.toISOString(),
      },
    }
  );

  return modifiedCount || 0;
};

const hasActiveSubscription = async ({ subscriberId, role }) => {
  const sub = await getActiveSubscriptionFor({ subscriberId, role });
  return Boolean(sub);
};

module.exports = {
  SUPPORTED_SUBSCRIBER_ROLES,
  getPlan,
  getActivePlan,
  upsertSubscriptionPlan,
  getPlanForRole,
  createSubscriptionOrder,
  verifyAndActivateSubscription,
  getActiveSubscriptionFor,
  getLatestActiveSubscription,
  listSubscriptions,
  listUpcomingExpiries,
  getSubscriptionHistoryFor,
  expireElapsedSubscriptions,
  hasActiveSubscription,
};


