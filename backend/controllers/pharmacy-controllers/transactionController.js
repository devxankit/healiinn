const asyncHandler = require('../../middleware/asyncHandler');
const mongoose = require('mongoose');
const { ROLES } = require('../../utils/constants');
const {
  getPharmacyTransactions,
  getPharmacyTransactionCount,
} = require('../../services/transactionService');
const { getPaginationParams, getPaginationMeta } = require('../../utils/pagination');
const { getCache, setCache, generateCacheKey } = require('../../utils/cache');

const toObjectId = (value) =>
  typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value;

const ensureRole = (role, allowed) => {
  if (!allowed.includes(role)) {
    const error = new Error('You do not have access to this resource');
    error.status = 403;
    throw error;
  }
};

exports.listTransactions = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PHARMACY]);

  const pharmacyId = toObjectId(req.auth.id);
  const { page, limit, skip } = getPaginationParams(req.query);

  const [transactions, total] = await Promise.all([
    getPharmacyTransactions({
      pharmacyId,
      limit,
      skip,
    }),
    getPharmacyTransactionCount({
      pharmacyId,
    }),
  ]);

  res.json({
    success: true,
    pagination: getPaginationMeta(total, page, limit),
    transactions,
  });
});

exports.getTransaction = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PHARMACY]);

  const pharmacyId = toObjectId(req.auth.id);
  const { transactionId } = req.params;
  const cacheKey = generateCacheKey('pharmacy:transaction', {
    pharmacyId: pharmacyId.toString(),
    transactionId,
  });

  // Try to get from cache first (cache for 5 minutes)
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  const WalletTransaction = require('../../models/WalletTransaction');
  const transaction = await WalletTransaction.findOne({
    _id: transactionId,
    provider: pharmacyId,
    providerRole: ROLES.PHARMACY,
  })
    .populate('patient', 'firstName lastName phone email')
    .populate('booking', 'status medicines billingSummary')
    .populate('payment', 'orderId paymentId status amount currency')
    .select('type amount grossAmount netAmount commissionAmount currency status creditedAt createdAt booking bookingModel patient payment description')
    .lean();

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found',
    });
  }

  // Add pharmacy lead details
  let bookingDetails = null;
  if (transaction.bookingModel === 'PharmacyLead') {
    const PharmacyLead = require('../../models/PharmacyLead');
    bookingDetails = await PharmacyLead.findById(transaction.booking)
      .populate('doctor', 'firstName lastName')
      .select('status medicines billingSummary patient doctor prescription')
      .lean();
  }

  const response = {
    success: true,
    transaction: {
      ...transaction,
      bookingDetails,
    },
  };

  // Cache for 5 minutes (300 seconds)
  await setCache(cacheKey, response, 300);

  res.json(response);
});

