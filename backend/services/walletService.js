const mongoose = require('mongoose');
const WalletTransaction = require('../models/WalletTransaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const Doctor = require('../models/Doctor');
const Laboratory = require('../models/Laboratory');
const Pharmacy = require('../models/Pharmacy');
const { COMMISSION_RATE, WITHDRAWAL_STATUS, ROLES } = require('../utils/constants');
const { getModelForRole } = require('../utils/getModelForRole');

const toObjectId = (value) =>
  typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value;

const emptySummary = () => ({
  totalGross: 0,
  totalCommission: 0,
  totalNet: 0,
  totalWithdrawn: 0,
  pendingWithdrawalAmount: 0,
  availableBalance: 0,
  pendingCount: 0,
});

const getProviderWalletSummary = async (providerId, providerRole) => {
  const matchProvider = {
    provider: toObjectId(providerId),
    providerRole,
  };

  // Also match legacy doctor field for backward compatibility
  const matchQuery = providerRole === ROLES.DOCTOR
    ? { $or: [matchProvider, { doctor: toObjectId(providerId) }] }
    : matchProvider;

  const [transactionAgg] = await WalletTransaction.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$provider',
        totalGross: { $sum: '$grossAmount' },
        totalCommission: { $sum: '$commissionAmount' },
        totalNet: { $sum: '$netAmount' },
      },
    },
  ]);

  const withdrawalAgg = await WithdrawalRequest.aggregate([
    { $match: matchProvider },
    {
      $group: {
        _id: '$status',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const summary = emptySummary();

  if (transactionAgg) {
    summary.totalGross = transactionAgg.totalGross || 0;
    summary.totalCommission = transactionAgg.totalCommission || 0;
    summary.totalNet = transactionAgg.totalNet || 0;
  }

  withdrawalAgg.forEach((item) => {
    if (item._id === WITHDRAWAL_STATUS.REJECTED) {
      return;
    }
    summary.totalWithdrawn += item._id === WITHDRAWAL_STATUS.PAID ? item.total : 0;
    summary.pendingWithdrawalAmount += item._id === WITHDRAWAL_STATUS.PENDING || item._id === WITHDRAWAL_STATUS.APPROVED ? item.total : 0;
    if (item._id === WITHDRAWAL_STATUS.PENDING) {
      summary.pendingCount = item.count;
    }
  });

  summary.availableBalance =
    summary.totalNet - (summary.totalWithdrawn + summary.pendingWithdrawalAmount);

  if (summary.availableBalance < 0) {
    summary.availableBalance = 0;
  }

  return summary;
};

// Legacy function for backward compatibility
const getDoctorWalletSummary = async (doctorId) => {
  return getProviderWalletSummary(doctorId, ROLES.DOCTOR);
};

const getProviderTransactions = async ({ providerId, providerRole, limit = 20, skip = 0 }) => {
  const matchProvider = {
    provider: toObjectId(providerId),
    providerRole,
  };

  // Also match legacy doctor field for backward compatibility
  const matchQuery = providerRole === ROLES.DOCTOR
    ? { $or: [matchProvider, { doctor: toObjectId(providerId) }] }
    : matchProvider;

  const transactions = await WalletTransaction.find(matchQuery)
    .populate('patient', 'firstName lastName gender profileImage')
    .populate('booking', 'scheduledFor status billingSummary')
    .populate('appointment', 'scheduledFor status')
    .sort({ creditedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return transactions;
};

// Legacy function for backward compatibility
const getDoctorTransactions = async ({ doctorId, limit = 20, skip = 0 }) => {
  return getProviderTransactions({
    providerId: doctorId,
    providerRole: ROLES.DOCTOR,
    limit,
    skip,
  });
};

const getProviderWithdrawals = async ({ providerId, providerRole, limit = 20, skip = 0 }) => {
  const matchProvider = {
    provider: toObjectId(providerId),
    providerRole,
  };

  return WithdrawalRequest.find(matchProvider)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Legacy function for backward compatibility
const getDoctorWithdrawals = async ({ doctorId, limit = 20, skip = 0 }) => {
  return getProviderWithdrawals({
    providerId: doctorId,
    providerRole: ROLES.DOCTOR,
    limit,
    skip,
  });
};

const getAdminWalletOverview = async () => {
  // Get transactions grouped by role
  const transactionAggByRole = await WalletTransaction.aggregate([
    {
      $group: {
        _id: '$providerRole',
        totalGross: { $sum: '$grossAmount' },
        totalCommission: { $sum: '$commissionAmount' },
        totalNet: { $sum: '$netAmount' },
      },
    },
  ]);

  // Get all transactions summary
  const [transactionAgg] = await WalletTransaction.aggregate([
    {
      $group: {
        _id: null,
        totalGross: { $sum: '$grossAmount' },
        totalCommission: { $sum: '$commissionAmount' },
        totalNet: { $sum: '$netAmount' },
      },
    },
  ]);

  const withdrawalAgg = await WithdrawalRequest.aggregate([
    {
      $group: {
        _id: '$status',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const withdrawalAggByRole = await WithdrawalRequest.aggregate([
    {
      $group: {
        _id: {
          status: '$status',
          role: '$providerRole',
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const overview = {
    totalGross: transactionAgg?.totalGross || 0,
    totalCommission: transactionAgg?.totalCommission || 0,
    totalNet: transactionAgg?.totalNet || 0,
    paidOut: 0,
    pendingPayouts: 0,
    pendingCount: 0,
    approvedButUnpaid: 0,
    byRole: {
      [ROLES.DOCTOR]: {
        totalGross: 0,
        totalCommission: 0,
        totalNet: 0,
        paidOut: 0,
        pendingPayouts: 0,
      },
      [ROLES.LABORATORY]: {
        totalGross: 0,
        totalCommission: 0,
        totalNet: 0,
        paidOut: 0,
        pendingPayouts: 0,
      },
      [ROLES.PHARMACY]: {
        totalGross: 0,
        totalCommission: 0,
        totalNet: 0,
        paidOut: 0,
        pendingPayouts: 0,
      },
    },
  };

  // Populate by role earnings
  transactionAggByRole.forEach((item) => {
    if (overview.byRole[item._id]) {
      overview.byRole[item._id].totalGross = item.totalGross || 0;
      overview.byRole[item._id].totalCommission = item.totalCommission || 0;
      overview.byRole[item._id].totalNet = item.totalNet || 0;
    }
  });

  // Populate withdrawal stats by role
  withdrawalAggByRole.forEach((item) => {
    const role = item._id.role;
    const status = item._id.status;
    if (overview.byRole[role]) {
      if (status === WITHDRAWAL_STATUS.PAID) {
        overview.byRole[role].paidOut += item.total || 0;
      }
      if (status === WITHDRAWAL_STATUS.PENDING || status === WITHDRAWAL_STATUS.APPROVED) {
        overview.byRole[role].pendingPayouts += item.total || 0;
      }
    }
  });

  withdrawalAgg.forEach((item) => {
    if (item._id === WITHDRAWAL_STATUS.PAID) {
      overview.paidOut += item.total;
    }
    if (item._id === WITHDRAWAL_STATUS.PENDING) {
      overview.pendingPayouts += item.total;
      overview.pendingCount = item.count;
    }
    if (item._id === WITHDRAWAL_STATUS.APPROVED) {
      overview.approvedButUnpaid += item.total;
    }
  });

  return overview;
};

const getAdminProviderSummaries = async (providerRole) => {
  const matchRole = { providerRole };

  // For doctor, also include legacy doctor field
  const matchQuery = providerRole === ROLES.DOCTOR
    ? { $or: [matchRole, { doctor: { $exists: true } }] }
    : matchRole;

  const transactions = await WalletTransaction.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$provider',
        totalGross: { $sum: '$grossAmount' },
        totalCommission: { $sum: '$commissionAmount' },
        totalNet: { $sum: '$netAmount' },
      },
    },
  ]);

  const withdrawals = await WithdrawalRequest.aggregate([
    { $match: matchRole },
    {
      $group: {
        _id: '$provider',
        paidOut: {
          $sum: {
            $cond: [{ $eq: ['$status', WITHDRAWAL_STATUS.PAID] }, '$amount', 0],
          },
        },
        pending: {
          $sum: {
            $cond: [
              { $in: ['$status', [WITHDRAWAL_STATUS.PENDING, WITHDRAWAL_STATUS.APPROVED]] },
              '$amount',
              0,
            ],
          },
        },
      },
    },
  ]);

  const withdrawalMap = withdrawals.reduce((acc, item) => {
    acc[item._id.toString()] = item;
    return acc;
  }, {});

  const providerIds = transactions.map((item) => item._id);

  const Model = getModelForRole(providerRole);
  const providers = await Model.find({ _id: { $in: providerIds } })
    .select('-password')
    .lean();

  const providerMap = providers.reduce((acc, item) => {
    acc[item._id.toString()] = item;
    return acc;
  }, {});

  return transactions.map((item) => {
    const providerId = item._id.toString();
    const withdrawal = withdrawalMap[providerId] || {};

    const paidOut = withdrawal.paidOut || 0;
    const pending = withdrawal.pending || 0;
    const available = item.totalNet - (paidOut + pending);

    return {
      providerId,
      provider: providerMap[providerId] || null,
      providerRole,
      totalGross: item.totalGross,
      totalCommission: item.totalCommission,
      totalNet: item.totalNet,
      paidOut,
      pending,
      available: available < 0 ? 0 : available,
    };
  });
};

// Legacy function for backward compatibility
const getAdminDoctorSummaries = async () => {
  return getAdminProviderSummaries(ROLES.DOCTOR);
};

const buildWithdrawalHistoryEntry = ({ status, note, actorId, actorRole }) => {
  const roleModelMap = {
    admin: 'Admin',
    doctor: 'Doctor',
    laboratory: 'Laboratory',
    pharmacy: 'Pharmacy',
  };

  return {
    status,
    note: note || undefined,
    changedBy: actorId,
    changedByRole: actorRole,
    changedByRoleModel: roleModelMap[actorRole] || 'Admin',
    changedAt: new Date(),
  };
};

// Create wallet transaction for any provider
const createWalletTransaction = async ({
  providerId,
  providerRole,
  patientId,
  bookingId,
  bookingModel,
  bookingType,
  paymentId,
  grossAmount,
  commissionRate = COMMISSION_RATE,
  currency = 'INR',
  description,
}) => {
  const commissionAmount = Number((grossAmount * commissionRate).toFixed(2));
  const netAmount = Number((grossAmount - commissionAmount).toFixed(2));

  const transactionData = {
    provider: toObjectId(providerId),
    providerModel: providerRole === ROLES.DOCTOR ? 'Doctor' : providerRole === ROLES.LABORATORY ? 'Laboratory' : 'Pharmacy',
    providerRole,
    patient: toObjectId(patientId),
    booking: toObjectId(bookingId),
    bookingModel,
    bookingType,
    payment: paymentId ? toObjectId(paymentId) : undefined,
    grossAmount,
    commissionAmount,
    netAmount,
    commissionRate,
    currency,
    description,
    creditedAt: new Date(),
  };

  // Legacy support for doctor
  if (providerRole === ROLES.DOCTOR) {
    transactionData.doctor = toObjectId(providerId);
    if (bookingModel === 'Appointment') {
      transactionData.appointment = toObjectId(bookingId);
    }
  }

  const transaction = await WalletTransaction.create(transactionData);

  // Update admin wallet
  const { getOrCreateWallet, ROLE_MODEL_MAP } = require('./adminWalletService');
  const AdminWalletTransaction = require('../models/AdminWalletTransaction');
  const wallet = await getOrCreateWallet();

  await AdminWalletTransaction.create({
    amount: commissionAmount,
    currency,
    role: providerRole,
    subscriber: toObjectId(providerId),
    subscriberModel: ROLE_MODEL_MAP[providerRole],
    payment: paymentId ? toObjectId(paymentId) : undefined,
    orderId: paymentId,
    description: description || `Commission from ${providerRole} booking`,
  });

  // Update admin wallet totals
  wallet.totalEarnings = (wallet.totalEarnings || 0) + commissionAmount;
  wallet.earningsByRole = wallet.earningsByRole || {};
  wallet.earningsByRole[providerRole] = (wallet.earningsByRole[providerRole] || 0) + commissionAmount;
  wallet.lastTransactionAt = new Date();
  await wallet.save();

  // Notify provider about transaction credit
  try {
    const { notifyTransactionCredited, notifyPaymentReceived } = require('./notificationEvents');
    await notifyTransactionCredited({
      providerId,
      providerRole,
      amount: grossAmount,
      netAmount,
      commissionAmount,
      transactionId: transaction._id,
      bookingType,
    });
    await notifyPaymentReceived({
      providerId,
      providerRole,
      amount: grossAmount,
      paymentId: paymentId ? paymentId.toString() : undefined,
      bookingType,
    });
  } catch (notificationError) {
    console.error('Failed to send transaction notification:', notificationError);
  }

  return transaction;
};

module.exports = {
  COMMISSION_RATE,
  getProviderWalletSummary,
  getProviderTransactions,
  getProviderWithdrawals,
  getDoctorWalletSummary, // Legacy
  getDoctorTransactions, // Legacy
  getDoctorWithdrawals, // Legacy
  getAdminWalletOverview,
  getAdminProviderSummaries,
  getAdminDoctorSummaries, // Legacy
  buildWithdrawalHistoryEntry,
  createWalletTransaction,
};


