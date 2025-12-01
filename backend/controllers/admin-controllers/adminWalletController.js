const asyncHandler = require('../../middleware/asyncHandler');
const WithdrawalRequest = require('../../models/WithdrawalRequest');
const WalletTransaction = require('../../models/WalletTransaction');
const Transaction = require('../../models/Transaction');
const Doctor = require('../../models/Doctor');
const Pharmacy = require('../../models/Pharmacy');
const Laboratory = require('../../models/Laboratory');
const { getIO } = require('../../config/socket');
const { sendWithdrawalStatusUpdateEmail } = require('../../services/notificationService');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/admin/wallet/overview
exports.getWalletOverview = asyncHandler(async (req, res) => {
  // Get total earnings from all providers
  const [doctorEarnings, pharmacyEarnings, labEarnings] = await Promise.all([
    WalletTransaction.aggregate([
      { $match: { userType: 'doctor', type: 'earning', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(result => result[0]?.total || 0),
    WalletTransaction.aggregate([
      { $match: { userType: 'pharmacy', type: 'earning', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(result => result[0]?.total || 0),
    WalletTransaction.aggregate([
      { $match: { userType: 'laboratory', type: 'earning', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(result => result[0]?.total || 0),
  ]);

  const totalEarnings = doctorEarnings + pharmacyEarnings + labEarnings;

  // Get pending withdrawals
  const pendingWithdrawals = await WithdrawalRequest.aggregate([
    { $match: { status: { $in: ['pending', 'approved'] } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const pendingAmount = pendingWithdrawals[0]?.total || 0;

  // Get total payments from patients (appointments + requests)
  const patientPayments = await Transaction.aggregate([
    { $match: { userType: 'admin', type: 'payment', status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const totalPatientPayments = patientPayments[0]?.total || 0;

  // Calculate admin wallet balance (patient payments - provider earnings)
  // Note: In reality, admin keeps patient payments and pays providers from it
  const adminWalletBalance = totalPatientPayments;

  return res.status(200).json({
    success: true,
    data: {
      adminWalletBalance,
      totalPatientPayments,
      totalEarnings,
      doctorEarnings,
      pharmacyEarnings,
      labEarnings,
      pendingWithdrawals: pendingAmount,
    },
  });
});

// GET /api/admin/wallet/providers
exports.getProviderSummaries = asyncHandler(async (req, res) => {
  const { role } = req.query;

  const roles = role ? [role] : ['doctor', 'pharmacy', 'laboratory'];
  const summaries = [];

  for (const r of roles) {
    const Model = r === 'doctor' ? Doctor : r === 'pharmacy' ? Pharmacy : Laboratory;
    const nameField = r === 'doctor' ? 'firstName' : r === 'pharmacy' ? 'pharmacyName' : 'labName';

    const providers = await Model.find({ status: 'approved', isActive: true })
      .select(`${nameField} ${r === 'doctor' ? 'lastName' : ''} email phone`);

    for (const provider of providers) {
      const latestTransaction = await WalletTransaction.findOne({
        userId: provider._id,
        userType: r,
      }).sort({ createdAt: -1 });

      const balance = latestTransaction?.balance || 0;

      const totalEarnings = await WalletTransaction.aggregate([
        { $match: { userId: provider._id, userType: r, type: 'earning', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      summaries.push({
        providerId: provider._id,
        providerType: r,
        name: r === 'doctor' ? `${provider.firstName} ${provider.lastName}` : provider[nameField],
        email: provider.email,
        phone: provider.phone,
        balance,
        totalEarnings: totalEarnings[0]?.total || 0,
      });
    }
  }

  return res.status(200).json({
    success: true,
    data: summaries,
  });
});

// GET /api/admin/wallet/withdrawals
exports.getWithdrawals = asyncHandler(async (req, res) => {
  const { status, role } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = {};
  if (status) filter.status = status;
  if (role) filter.userType = role;

  const [withdrawals, total] = await Promise.all([
    WithdrawalRequest.find(filter)
      .populate('userId', 'firstName lastName pharmacyName labName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    WithdrawalRequest.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: withdrawals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// PATCH /api/admin/wallet/withdrawals/:id
exports.updateWithdrawalStatus = asyncHandler(async (req, res) => {
  const { withdrawalId } = req.params;
  const { status, adminNote, payoutReference } = req.body;

  if (!status || !['pending', 'approved', 'rejected', 'processed'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Valid status is required',
    });
  }

  const withdrawal = await WithdrawalRequest.findById(withdrawalId);
  if (!withdrawal) {
    return res.status(404).json({
      success: false,
      message: 'Withdrawal request not found',
    });
  }

  withdrawal.status = status;
  if (adminNote) withdrawal.adminNote = adminNote;
  if (payoutReference) withdrawal.payoutReference = payoutReference;
  if (status === 'processed') {
    withdrawal.processedAt = new Date();
    withdrawal.processedBy = req.auth.id;
  }

  await withdrawal.save();

  // If approved, create wallet transaction for deduction
  if (status === 'processed') {
    const WalletTransaction = require('../../models/WalletTransaction');
    const latestTransaction = await WalletTransaction.findOne({
      userId: withdrawal.userId,
      userType: withdrawal.userType,
    }).sort({ createdAt: -1 });

    const currentBalance = latestTransaction?.balance || 0;
    const newBalance = Math.max(0, currentBalance - withdrawal.amount);

    await WalletTransaction.create({
      userId: withdrawal.userId,
      userType: withdrawal.userType,
      type: 'withdrawal',
      amount: -withdrawal.amount,
      balance: newBalance,
      status: 'completed',
      description: 'Withdrawal processed',
      referenceId: withdrawal._id.toString(),
      withdrawalRequestId: withdrawal._id,
    });
  }

  // Get provider data for email
  let provider = null;
  if (withdrawal.userType === 'doctor') {
    provider = await Doctor.findById(withdrawal.userId);
  } else if (withdrawal.userType === 'pharmacy') {
    provider = await Pharmacy.findById(withdrawal.userId);
  } else if (withdrawal.userType === 'laboratory') {
    provider = await Laboratory.findById(withdrawal.userId);
  }

  // Emit real-time event
  try {
    const io = getIO();
    io.to(`${withdrawal.userType}-${withdrawal.userId}`).emit('withdrawal:status:updated', {
      withdrawalId: withdrawal._id,
      status,
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  // Send email notification to provider
  if (provider) {
    try {
      await sendWithdrawalStatusUpdateEmail({
        provider,
        withdrawal,
        providerType: withdrawal.userType,
      }).catch((error) => console.error('Error sending withdrawal status update email:', error));
    } catch (error) {
      console.error('Error sending email notifications:', error);
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Withdrawal status updated successfully',
    data: withdrawal,
  });
});

// GET /api/admin/wallet/balance - Get admin wallet balance
exports.getAdminWalletBalance = asyncHandler(async (req, res) => {
  // Get total payments from patients
  const patientPayments = await Transaction.aggregate([
    { $match: { userType: 'admin', type: 'payment', status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const balance = patientPayments[0]?.total || 0;

  // Get today's payments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayPayments = await Transaction.aggregate([
    {
      $match: {
        userType: 'admin',
        type: 'payment',
        status: 'completed',
        createdAt: { $gte: today },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const todayTotal = todayPayments[0]?.total || 0;

  return res.status(200).json({
    success: true,
    data: {
      balance,
      todayTotal,
    },
  });
});

// GET /api/admin/wallet/transactions - Get admin wallet transactions
exports.getAdminWalletTransactions = asyncHandler(async (req, res) => {
  const { type, category, startDate, endDate } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = {
    userType: 'admin',
    type: type || 'payment',
    status: 'completed',
  };

  if (category) filter.category = category;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filter.createdAt.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate('appointmentId', 'appointmentDate fee')
      .populate('orderId', 'totalAmount status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments(filter),
  ]);

  // Enrich transactions with patient information from metadata
  const Patient = require('../../models/Patient');
  const enrichedTransactions = await Promise.all(
    transactions.map(async (transaction) => {
      const transactionObj = transaction.toObject();
      if (transaction.metadata?.patientId) {
        const patient = await Patient.findById(transaction.metadata.patientId)
          .select('firstName lastName phone email');
        if (patient) {
          transactionObj.patient = patient;
        }
      }
      return transactionObj;
    })
  );

  return res.status(200).json({
    success: true,
    data: {
      items: enrichedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

