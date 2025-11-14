const mongoose = require('mongoose');
const AdminWallet = require('../models/AdminWallet');
const AdminWalletTransaction = require('../models/AdminWalletTransaction');
const { ROLES } = require('../utils/constants');

const ROLE_MODEL_MAP = {
  [ROLES.DOCTOR]: 'Doctor',
  [ROLES.LABORATORY]: 'Laboratory',
  [ROLES.PHARMACY]: 'Pharmacy',
};

const ensureObjectId = (value) =>
  typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value;

const getOrCreateWallet = async () => {
  const wallet = await AdminWallet.findOneAndUpdate(
    { key: 'primary' },
    {},
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return wallet;
};

const recordSubscriptionEarning = async ({
  role,
  subscriberId,
  subscriptionId,
  paymentId,
  orderId,
  amount,
  currency = 'INR',
  description,
  metadata,
}) => {
  if (!ROLE_MODEL_MAP[role]) {
    throw new Error(`Unsupported role for subscription earning: ${role}`);
  }

  const wallet = await getOrCreateWallet();
  const now = new Date();

  await AdminWalletTransaction.create({
    amount,
    currency,
    role,
    subscriber: ensureObjectId(subscriberId),
    subscriberModel: ROLE_MODEL_MAP[role],
    subscription: ensureObjectId(subscriptionId),
    payment: paymentId ? ensureObjectId(paymentId) : undefined,
    orderId,
    source: 'subscription',
    description,
    metadata,
  });

  wallet.totalEarnings += amount;
  wallet.earningsByRole = wallet.earningsByRole || {};
  wallet.earningsByRole[role] = (wallet.earningsByRole[role] || 0) + amount;
  wallet.markModified('earningsByRole');
  wallet.lastTransactionAt = now;
  wallet.currency = currency;
  await wallet.save();

  return wallet;
};

const getSubscriptionWalletOverview = async () => {
  const wallet = await getOrCreateWallet();

  const totals = await AdminWalletTransaction.aggregate([
    {
      $group: {
        _id: '$role',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const totalsMap = totals.reduce((acc, item) => {
    acc[item._id] = item;
    return acc;
  }, {});

  return {
    currency: wallet.currency,
    totalEarnings: wallet.totalEarnings,
    earningsByRole: {
      [ROLES.DOCTOR]: wallet.earningsByRole?.[ROLES.DOCTOR] || 0,
      [ROLES.LABORATORY]: wallet.earningsByRole?.[ROLES.LABORATORY] || 0,
      [ROLES.PHARMACY]: wallet.earningsByRole?.[ROLES.PHARMACY] || 0,
    },
    transactionsByRole: {
      [ROLES.DOCTOR]: totalsMap[ROLES.DOCTOR]?.count || 0,
      [ROLES.LABORATORY]: totalsMap[ROLES.LABORATORY]?.count || 0,
      [ROLES.PHARMACY]: totalsMap[ROLES.PHARMACY]?.count || 0,
    },
    lastTransactionAt: wallet.lastTransactionAt,
    updatedAt: wallet.updatedAt,
  };
};

const listSubscriptionTransactions = async ({ role, page = 1, limit = 20 }) => {
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const match = role && ROLE_MODEL_MAP[role] ? { role } : {};

  const [transactions, total] = await Promise.all([
    AdminWalletTransaction.find(match)
      .populate('subscriber', 'firstName lastName labName pharmacyName email phone')
      .populate('subscription', 'status startsAt endsAt durationKey amount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    AdminWalletTransaction.countDocuments(match),
  ]);

  return {
    transactions,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit) || 1,
    },
  };
};

module.exports = {
  ROLE_MODEL_MAP,
  getOrCreateWallet,
  recordSubscriptionEarning,
  getSubscriptionWalletOverview,
  listSubscriptionTransactions,
};


