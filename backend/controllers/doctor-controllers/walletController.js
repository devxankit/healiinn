const asyncHandler = require('../../middleware/asyncHandler');
const WalletTransaction = require('../../models/WalletTransaction');
const WithdrawalRequest = require('../../models/WithdrawalRequest');
const {
  getDoctorWalletSummary,
  getDoctorTransactions,
  getDoctorWithdrawals,
  buildWithdrawalHistoryEntry,
} = require('../../services/walletService');
const { WITHDRAWAL_STATUS, ROLES, getCommissionRateByRole } = require('../../utils/constants');
const { getPaginationParams, getPaginationMeta } = require('../../utils/pagination');

exports.getWalletSummary = asyncHandler(async (req, res) => {
  const summary = await getDoctorWalletSummary(req.auth.id);

  res.json({
    success: true,
    summary: {
      ...summary,
      commissionRate: getCommissionRateByRole(ROLES.DOCTOR),
    },
  });
});

exports.listTransactions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);

  const [transactions, total] = await Promise.all([
    getDoctorTransactions({ doctorId: req.auth.id, limit, skip }),
    WalletTransaction.countDocuments({ doctor: req.auth.id }),
  ]);

  res.json({
    success: true,
    pagination: getPaginationMeta(total, page, limit),
    transactions,
  });
});

exports.listWithdrawals = asyncHandler(async (req, res) => {
  const status = req.query.status;
  const { page, limit, skip } = getPaginationParams(req.query);

  const match = {
    $or: [
      { provider: req.auth.id, providerRole: ROLES.DOCTOR },
      { doctor: req.auth.id }, // Legacy support
    ],
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
    pagination: getPaginationMeta(total, page, limit),
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

  const summary = await getDoctorWalletSummary(req.auth.id);

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
    providerModel: 'Doctor',
    providerRole: ROLES.DOCTOR,
    doctor: req.auth.id, // Legacy support
    amount,
    currency: req.body.currency || 'INR',
    payoutMethod,
    notes,
    statusHistory: [
      buildWithdrawalHistoryEntry({
        status: WITHDRAWAL_STATUS.PENDING,
        actorId: req.auth.id,
        actorRole: 'doctor',
        note: notes,
      }),
    ],
  });


  res.status(201).json({
    success: true,
    withdrawal: request,
  });
});


