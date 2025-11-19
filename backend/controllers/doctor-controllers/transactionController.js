const asyncHandler = require('../../middleware/asyncHandler');
const { ROLES } = require('../../utils/constants');
const {
  getDoctorTransactions,
  getDoctorTransactionCount,
} = require('../../services/transactionService');
const { getPaginationParams, getPaginationMeta } = require('../../utils/pagination');

const ensureRole = (role, allowed) => {
  if (!allowed.includes(role)) {
    const error = new Error('You do not have access to this resource');
    error.status = 403;
    throw error;
  }
};

exports.listTransactions = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const { page, limit, skip } = getPaginationParams(req.query);

  const [transactions, total] = await Promise.all([
    getDoctorTransactions({
      doctorId: req.auth.id,
      limit,
      skip,
    }),
    getDoctorTransactionCount({
      doctorId: req.auth.id,
    }),
  ]);

  res.json({
    success: true,
    pagination: getPaginationMeta(total, page, limit),
    transactions,
  });
});

exports.getTransaction = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const WalletTransaction = require('../../models/WalletTransaction');
  const transaction = await WalletTransaction.findOne({
    _id: req.params.transactionId,
    $or: [
      { provider: req.auth.id, providerRole: ROLES.DOCTOR },
      { doctor: req.auth.id }, // Legacy support
    ],
  })
    .populate('patient', 'firstName lastName phone email')
    .populate('booking', 'scheduledFor status')
    .populate('payment', 'orderId paymentId status amount currency')
    .lean();

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found',
    });
  }

  // Add appointment details if booking is appointment
  let bookingDetails = null;
  if (transaction.bookingModel === 'Appointment') {
    const Appointment = require('../../models/Appointment');
    bookingDetails = await Appointment.findById(transaction.booking)
      .populate('clinic', 'name address')
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

