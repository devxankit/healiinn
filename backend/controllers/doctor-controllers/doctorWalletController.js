const asyncHandler = require('../../middleware/asyncHandler');
const WalletTransaction = require('../../models/WalletTransaction');
const WithdrawalRequest = require('../../models/WithdrawalRequest');
const Doctor = require('../../models/Doctor');
const { getCommissionRateByRole } = require('../../utils/constants');
const { sendWithdrawalRequestNotification } = require('../../services/notificationService');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/doctors/wallet/balance
exports.getWalletBalance = asyncHandler(async (req, res) => {
  const { id } = req.auth;

  // Get latest wallet transaction to get current balance
  const latestTransaction = await WalletTransaction.findOne({
    userId: id,
    userType: 'doctor',
  }).sort({ createdAt: -1 });

  const balance = latestTransaction?.balance || 0;

  // Get pending withdrawal amount
  const pendingWithdrawals = await WithdrawalRequest.aggregate([
    {
      $match: {
        userId: id,
        userType: 'doctor',
        status: { $in: ['pending', 'approved'] },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);

  const pendingAmount = pendingWithdrawals[0]?.total || 0;
  const availableBalance = Math.max(0, balance - pendingAmount);

  return res.status(200).json({
    success: true,
    data: {
      balance,
      availableBalance,
      pendingWithdrawals: pendingAmount,
    },
  });
});

// GET /api/doctors/wallet/earnings
exports.getEarnings = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { dateFrom, dateTo } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = {
    userId: id,
    userType: 'doctor',
    type: 'earning',
    status: 'completed',
  };

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = endDate;
    }
  }

  const [earnings, total] = await Promise.all([
    WalletTransaction.find(filter)
      .populate('appointmentId', 'appointmentDate fee')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    WalletTransaction.countDocuments(filter),
  ]);

  const totalEarnings = await WalletTransaction.aggregate([
    { $match: filter },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: earnings,
      totalEarnings: totalEarnings[0]?.total || 0,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/doctors/wallet/transactions
exports.getTransactions = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { type, status } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { userId: id, userType: 'doctor' };
  if (type) filter.type = type;
  if (status) filter.status = status;

  const [transactions, total] = await Promise.all([
    WalletTransaction.find(filter)
      .populate('appointmentId', 'appointmentDate')
      .populate('withdrawalRequestId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    WalletTransaction.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// POST /api/doctors/wallet/withdraw
exports.requestWithdrawal = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { amount, payoutMethod, payoutDetails } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid withdrawal amount is required',
    });
  }

  if (!payoutMethod || !['bank_transfer', 'upi', 'paytm'].includes(payoutMethod)) {
    return res.status(400).json({
      success: false,
      message: 'Valid payout method is required',
    });
  }

  // Get current balance
  const latestTransaction = await WalletTransaction.findOne({
    userId: id,
    userType: 'doctor',
  }).sort({ createdAt: -1 });

  const balance = latestTransaction?.balance || 0;

  // Get pending withdrawals
  const pendingWithdrawals = await WithdrawalRequest.aggregate([
    {
      $match: {
        userId: id,
        userType: 'doctor',
        status: { $in: ['pending', 'approved'] },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);

  const pendingAmount = pendingWithdrawals[0]?.total || 0;
  const availableBalance = Math.max(0, balance - pendingAmount);

  if (amount > availableBalance) {
    return res.status(400).json({
      success: false,
      message: 'Insufficient balance',
    });
  }

  const withdrawalRequest = await WithdrawalRequest.create({
    userId: id,
    userType: 'doctor',
    amount,
    payoutMethod: {
      type: payoutMethod,
      details: payoutDetails || {},
    },
    status: 'pending',
  });

  // Get doctor data for email
  const doctor = await Doctor.findById(id);

  // Emit real-time event to admins
  try {
    const { getIO } = require('../../config/socket');
    const io = getIO();
    io.to('admins').emit('withdrawal:requested', {
      withdrawal: await WithdrawalRequest.findById(withdrawalRequest._id)
        .populate('userId', 'firstName lastName'),
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  // Send email notification to doctor
  try {
    await sendWithdrawalRequestNotification({
      provider: doctor,
      withdrawal: withdrawalRequest,
      providerType: 'doctor',
    }).catch((error) => console.error('Error sending withdrawal request email:', error));
  } catch (error) {
    console.error('Error sending email notifications:', error);
  }

  return res.status(201).json({
    success: true,
    message: 'Withdrawal request submitted successfully',
    data: withdrawalRequest,
  });
});

