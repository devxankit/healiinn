const asyncHandler = require('../../middleware/asyncHandler');
const mongoose = require('mongoose');
const WalletTransaction = require('../../models/WalletTransaction');
const WithdrawalRequest = require('../../models/WithdrawalRequest');
const {
  getProviderWalletSummary,
  getProviderTransactions,
  getProviderWithdrawals,
  buildWithdrawalHistoryEntry,
} = require('../../services/walletService');
const { WITHDRAWAL_STATUS, ROLES, getCommissionRateByRole } = require('../../utils/constants');
const { getPaginationParams, getPaginationMeta } = require('../../utils/pagination');
const { getCache, setCache, generateCacheKey } = require('../../utils/cache');

const toObjectId = (value) =>
  typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value;

exports.getWalletSummary = asyncHandler(async (req, res) => {
  const pharmacyId = toObjectId(req.auth.id);
  const cacheKey = generateCacheKey('pharmacy:wallet:summary', { pharmacyId: pharmacyId.toString() });
  
  // Try to get from cache first (cache for 2 minutes)
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  const summary = await getProviderWalletSummary(pharmacyId, ROLES.PHARMACY);

  const response = {
    success: true,
    summary: {
      ...summary,
      commissionRate: getCommissionRateByRole(ROLES.PHARMACY),
    },
  };

  // Cache for 2 minutes (120 seconds)
  await setCache(cacheKey, response, 120);

  res.json(response);
});

exports.listTransactions = asyncHandler(async (req, res) => {
  const pharmacyId = toObjectId(req.auth.id);
  const { page, limit, skip } = getPaginationParams(req.query);

  const matchQuery = {
    provider: pharmacyId,
    providerRole: ROLES.PHARMACY,
  };

  const [transactions, total] = await Promise.all([
    getProviderTransactions({ providerId: pharmacyId, providerRole: ROLES.PHARMACY, limit, skip }),
    WalletTransaction.countDocuments(matchQuery),
  ]);

  res.json({
    success: true,
    pagination: getPaginationMeta(total, page, limit),
    transactions,
  });
});

exports.listWithdrawals = asyncHandler(async (req, res) => {
  const pharmacyId = toObjectId(req.auth.id);
  const { page, limit, skip } = getPaginationParams(req.query);
  const { status } = req.query;

  const match = {
    provider: pharmacyId,
    providerRole: ROLES.PHARMACY,
  };
  if (status && Object.values(WITHDRAWAL_STATUS).includes(status)) {
    match.status = status;
  }

  const [requests, total] = await Promise.all([
    WithdrawalRequest.find(match)
      .select('amount currency status payoutMethod notes statusHistory createdAt updatedAt')
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

  const summary = await getProviderWalletSummary(req.auth.id, ROLES.PHARMACY);

  if (amount > summary.availableBalance) {
    return res.status(400).json({
      success: false,
      message: 'Requested amount exceeds available balance.',
    });
  }

  const payoutMethod = req.body.payoutMethod || {};
  const notes = req.body.notes;

  const request = await WithdrawalRequest.create({
    provider: pharmacyId,
    providerModel: 'Pharmacy',
    providerRole: ROLES.PHARMACY,
    amount,
    currency: req.body.currency || 'INR',
    payoutMethod,
    notes,
    statusHistory: [
      buildWithdrawalHistoryEntry({
        status: WITHDRAWAL_STATUS.PENDING,
        actorId: pharmacyId,
        actorRole: 'pharmacy',
        note: notes,
      }),
    ],
  });

  // Invalidate wallet cache
  const { deleteCacheByPattern } = require('../../utils/cache');
  await deleteCacheByPattern(`pharmacy:wallet:*`);

  res.status(201).json({
    success: true,
    withdrawal: request,
  });
});

