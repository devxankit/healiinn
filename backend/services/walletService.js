const mongoose = require('mongoose');
const WalletTransaction = require('../models/WalletTransaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const Doctor = require('../models/Doctor');
const { COMMISSION_RATE, WITHDRAWAL_STATUS } = require('../utils/constants');

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

const getDoctorWalletSummary = async (doctorId) => {
  const matchDoctor = { doctor: toObjectId(doctorId) };

  const [transactionAgg] = await WalletTransaction.aggregate([
    { $match: matchDoctor },
    {
      $group: {
        _id: '$doctor',
        totalGross: { $sum: '$grossAmount' },
        totalCommission: { $sum: '$commissionAmount' },
        totalNet: { $sum: '$netAmount' },
      },
    },
  ]);

  const withdrawalAgg = await WithdrawalRequest.aggregate([
    { $match: matchDoctor },
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

const getDoctorTransactions = async ({ doctorId, limit = 20, skip = 0 }) =>
  WalletTransaction.find({ doctor: toObjectId(doctorId) })
    .populate('patient', 'firstName lastName gender profileImage')
    .populate('appointment', 'scheduledFor status')
    .sort({ creditedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

const getDoctorWithdrawals = async ({ doctorId, limit = 20, skip = 0 }) =>
  WithdrawalRequest.find({ doctor: toObjectId(doctorId) })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

const getAdminWalletOverview = async () => {
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

  const overview = {
    totalGross: transactionAgg?.totalGross || 0,
    totalCommission: transactionAgg?.totalCommission || 0,
    totalNet: transactionAgg?.totalNet || 0,
    paidOut: 0,
    pendingPayouts: 0,
    pendingCount: 0,
    approvedButUnpaid: 0,
  };

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

const getAdminDoctorSummaries = async () => {
  const transactions = await WalletTransaction.aggregate([
    {
      $group: {
        _id: '$doctor',
        totalGross: { $sum: '$grossAmount' },
        totalCommission: { $sum: '$commissionAmount' },
        totalNet: { $sum: '$netAmount' },
      },
    },
  ]);

  const withdrawals = await WithdrawalRequest.aggregate([
    {
      $group: {
        _id: '$doctor',
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

  const doctorIds = transactions.map((item) => item._id);

  const doctors = await Doctor.find({ _id: { $in: doctorIds } })
    .select('firstName lastName email phone specialization status isActive')
    .lean();

  const doctorMap = doctors.reduce((acc, item) => {
    acc[item._id.toString()] = item;
    return acc;
  }, {});

  return transactions.map((item) => {
    const doctorId = item._id.toString();
    const withdrawal = withdrawalMap[doctorId] || {};

    const paidOut = withdrawal.paidOut || 0;
    const pending = withdrawal.pending || 0;
    const available = item.totalNet - (paidOut + pending);

    return {
      doctorId,
      doctor: doctorMap[doctorId] || null,
      totalGross: item.totalGross,
      totalCommission: item.totalCommission,
      totalNet: item.totalNet,
      paidOut,
      pending,
      available: available < 0 ? 0 : available,
    };
  });
};

const buildWithdrawalHistoryEntry = ({ status, note, actorId, actorRole }) => ({
  status,
  note: note || undefined,
  changedBy: actorId,
  changedByRole: actorRole,
  changedByRoleModel: actorRole === 'admin' ? 'Admin' : 'Doctor',
  changedAt: new Date(),
});

module.exports = {
  COMMISSION_RATE,
  getDoctorWalletSummary,
  getDoctorTransactions,
  getDoctorWithdrawals,
  getAdminWalletOverview,
  getAdminDoctorSummaries,
  buildWithdrawalHistoryEntry,
};


