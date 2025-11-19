const asyncHandler = require('../../middleware/asyncHandler');
const { ROLES } = require('../../utils/constants');
const {
  getAdminPayments,
  getAdminWalletTransactions,
  getAdminCommissionTransactions,
  getAdminPaymentCount,
  getAdminWalletTransactionCount,
  getAdminCommissionTransactionCount,
} = require('../../services/transactionService');

const ensureRole = (role, allowed) => {
  if (!allowed.includes(role)) {
    const error = new Error('You do not have access to this resource');
    error.status = 403;
    throw error;
  }
};

// Get all payments (made by users)
exports.listPayments = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.ADMIN]);

  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const status = req.query.status;
  const type = req.query.type;
  const role = req.query.role;
  const userId = req.query.userId;

  const [payments, total] = await Promise.all([
    getAdminPayments({
      limit,
      skip,
      status,
      type,
      role,
      userId,
    }),
    getAdminPaymentCount({
      status,
      type,
      role,
      userId,
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
    payments,
  });
});

// Get specific payment
exports.getPayment = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.ADMIN]);

  const Payment = require('../../models/Payment');
  const payment = await Payment.findById(req.params.paymentId)
    .populate('user', 'firstName lastName email phone')
    .lean();

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found',
    });
  }

  // Populate booking details
  const metadata = payment.metadata || {};
  let bookingDetails = null;

  if (payment.type === 'appointment' && metadata.appointmentId) {
    const Appointment = require('../../models/Appointment');
    bookingDetails = await Appointment.findById(metadata.appointmentId)
      .populate('doctor', 'firstName lastName specialization')
      .populate('patient', 'firstName lastName')
      .populate('clinic', 'name address')
      .lean();
  } else if (payment.type === 'lab_booking' && metadata.labLeadId) {
    const LabLead = require('../../models/LabLead');
    bookingDetails = await LabLead.findById(metadata.labLeadId)
      .populate('laboratory', 'labName address phone')
      .populate('patient', 'firstName lastName')
      .populate('doctor', 'firstName lastName')
      .lean();
  } else if (payment.type === 'pharmacy_booking' && metadata.pharmacyLeadId) {
    const PharmacyLead = require('../../models/PharmacyLead');
    bookingDetails = await PharmacyLead.findById(metadata.pharmacyLeadId)
      .populate('pharmacy', 'pharmacyName address phone')
      .populate('patient', 'firstName lastName')
      .populate('doctor', 'firstName lastName')
      .lean();
  }

  res.json({
    success: true,
    payment: {
      ...payment,
      bookingDetails,
    },
  });
});

// Get all wallet transactions (provider earnings)
exports.listWalletTransactions = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.ADMIN]);

  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const providerRole = req.query.providerRole;
  const providerId = req.query.providerId;

  const [transactions, total] = await Promise.all([
    getAdminWalletTransactions({
      limit,
      skip,
      providerRole,
      providerId,
    }),
    getAdminWalletTransactionCount({
      providerRole,
      providerId,
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

// Get specific wallet transaction
exports.getWalletTransaction = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.ADMIN]);

  const WalletTransaction = require('../../models/WalletTransaction');
  const transaction = await WalletTransaction.findById(req.params.transactionId)
    .populate('provider', 'firstName lastName labName pharmacyName')
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

  // Add booking details
  let bookingDetails = null;
  if (transaction.bookingModel === 'Appointment') {
    const Appointment = require('../../models/Appointment');
    bookingDetails = await Appointment.findById(transaction.booking)
      .populate('clinic', 'name address')
      .lean();
  } else if (transaction.bookingModel === 'LabLead') {
    const LabLead = require('../../models/LabLead');
    bookingDetails = await LabLead.findById(transaction.booking)
      .populate('doctor', 'firstName lastName')
      .lean();
  } else if (transaction.bookingModel === 'PharmacyLead') {
    const PharmacyLead = require('../../models/PharmacyLead');
    bookingDetails = await PharmacyLead.findById(transaction.booking)
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

// Get all admin commission transactions
exports.listCommissionTransactions = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.ADMIN]);

  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const role = req.query.role;
  const subscriberId = req.query.subscriberId;

  const [transactions, total] = await Promise.all([
    getAdminCommissionTransactions({
      limit,
      skip,
      role,
      subscriberId,
    }),
    getAdminCommissionTransactionCount({
      role,
      subscriberId,
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

// Get specific commission transaction
exports.getCommissionTransaction = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.ADMIN]);

  const AdminWalletTransaction = require('../../models/AdminWalletTransaction');
  const transaction = await AdminWalletTransaction.findById(req.params.transactionId)
    .populate('subscriber', 'firstName lastName labName pharmacyName')
    .populate('payment', 'orderId paymentId status amount currency user userModel')
    .lean();

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found',
    });
  }

  res.json({
    success: true,
    transaction,
  });
});

// Get transaction summary/statistics
exports.getTransactionSummary = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.ADMIN]);

  const Payment = require('../../models/Payment');
  const WalletTransaction = require('../../models/WalletTransaction');
  const AdminWalletTransaction = require('../../models/AdminWalletTransaction');

  // Payment statistics
  const paymentStats = await Payment.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);

  const paymentByType = await Payment.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);

  const paymentByRole = await Payment.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);

  // Wallet transaction statistics
  const walletStats = await WalletTransaction.aggregate([
    {
      $group: {
        _id: '$providerRole',
        count: { $sum: 1 },
        totalGross: { $sum: '$grossAmount' },
        totalCommission: { $sum: '$commissionAmount' },
        totalNet: { $sum: '$netAmount' },
      },
    },
  ]);

  // Admin commission statistics
  const commissionStats = await AdminWalletTransaction.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);

  res.json({
    success: true,
    summary: {
      payments: {
        byStatus: paymentStats,
        byType: paymentByType,
        byRole: paymentByRole,
      },
      walletTransactions: {
        byRole: walletStats,
      },
      commissionTransactions: {
        byRole: commissionStats,
      },
    },
  });
});

