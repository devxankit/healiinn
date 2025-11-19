const asyncHandler = require('../../middleware/asyncHandler');
const { ROLES } = require('../../utils/constants');
const {
  getLaboratoryTransactions,
  getLaboratoryTransactionCount,
} = require('../../services/transactionService');

const ensureRole = (role, allowed) => {
  if (!allowed.includes(role)) {
    const error = new Error('You do not have access to this resource');
    error.status = 403;
    throw error;
  }
};

exports.listTransactions = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.LABORATORY]);

  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    getLaboratoryTransactions({
      laboratoryId: req.auth.id,
      limit,
      skip,
    }),
    getLaboratoryTransactionCount({
      laboratoryId: req.auth.id,
    }),
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

exports.getTransaction = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.LABORATORY]);

  const WalletTransaction = require('../../models/WalletTransaction');
  const transaction = await WalletTransaction.findOne({
    _id: req.params.transactionId,
    provider: req.auth.id,
    providerRole: ROLES.LABORATORY,
  })
    .populate('patient', 'firstName lastName phone email')
    .populate('booking', 'status tests billingSummary')
    .populate('payment', 'orderId paymentId status amount currency')
    .lean();

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found',
    });
  }

  // Add lab lead details
  let bookingDetails = null;
  if (transaction.bookingModel === 'LabLead') {
    const LabLead = require('../../models/LabLead');
    bookingDetails = await LabLead.findById(transaction.booking)
      .populate('doctor', 'firstName lastName')
      .lean();
  }

  res.json({
    success: true,
    transaction: {
      ...transaction,
      bookingDetails,
    },
  });
});

