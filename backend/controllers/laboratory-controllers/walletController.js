const asyncHandler = require('../../middleware/asyncHandler');
const WalletTransaction = require('../../models/WalletTransaction');
const WithdrawalRequest = require('../../models/WithdrawalRequest');
const {
  getProviderWalletSummary,
  getProviderTransactions,
  getProviderWithdrawals,
  buildWithdrawalHistoryEntry,
  COMMISSION_RATE,
} = require('../../services/walletService');
const { WITHDRAWAL_STATUS, ROLES } = require('../../utils/constants');

exports.getWalletSummary = asyncHandler(async (req, res) => {
  const summary = await getProviderWalletSummary(req.auth.id, ROLES.LABORATORY);

  res.json({
    success: true,
    summary: {
      ...summary,
      commissionRate: COMMISSION_RATE,
    },
  });
});

exports.listTransactions = asyncHandler(async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const matchQuery = {
    provider: req.auth.id,
    providerRole: ROLES.LABORATORY,
  };

  const [transactions, total] = await Promise.all([
    getProviderTransactions({ providerId: req.auth.id, providerRole: ROLES.LABORATORY, limit, skip }),
    WalletTransaction.countDocuments(matchQuery),
  ]);

  res.json({
    success: true,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
    transactions,
  });
});

exports.listWithdrawals = asyncHandler(async (req, res) => {
  const status = req.query.status;
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const match = {
    provider: req.auth.id,
    providerRole: ROLES.LABORATORY,
  };
  if (status && Object.values(WITHDRAWAL_STATUS).includes(status)) {
    match.status = status;
  }

  const [requests, total] = await Promise.all([
    WithdrawalRequest.find(match)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    WithdrawalRequest.countDocuments(match),
  ]);

  res.json({
    success: true,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
    withdrawals: requests,
  });
});

exports.requestWithdrawal = asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount);

  if (Number.isNaN(amount) || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'amount must be a positive number.',
    });
  }

  const summary = await getProviderWalletSummary(req.auth.id, ROLES.LABORATORY);

  if (amount > summary.availableBalance) {
    return res.status(400).json({
      success: false,
      message: 'Requested amount exceeds available balance.',
    });
  }

  const payoutMethod = req.body.payoutMethod || {};
  const notes = req.body.notes;

  const request = await WithdrawalRequest.create({
    provider: req.auth.id,
    providerModel: 'Laboratory',
    providerRole: ROLES.LABORATORY,
    amount,
    currency: req.body.currency || 'INR',
    payoutMethod,
    notes,
    statusHistory: [
      buildWithdrawalHistoryEntry({
        status: WITHDRAWAL_STATUS.PENDING,
        actorId: req.auth.id,
        actorRole: 'laboratory',
        note: notes,
      }),
    ],
  });

  // Notify about withdrawal request
  try {
    const { notifyWithdrawalRequested } = require('../../services/notificationEvents');
    await notifyWithdrawalRequested({
      providerId: req.auth.id,
      providerRole: ROLES.LABORATORY,
      amount,
      withdrawalId: request._id,
    });
  } catch (notificationError) {
    console.error('Failed to send withdrawal request notification:', notificationError);
  }

  res.status(201).json({
    success: true,
    withdrawal: request,
  });
});

