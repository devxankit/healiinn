const asyncHandler = require('../../middleware/asyncHandler');
const mongoose = require('mongoose');
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
  
  // Convert id to ObjectId to ensure proper matching
  const doctorObjectId = mongoose.Types.ObjectId.isValid(id) 
    ? new mongoose.Types.ObjectId(id) 
    : id;

  console.log(`🔍 Fetching wallet balance for doctor:`, {
    id,
    doctorObjectId: doctorObjectId.toString(),
    isValid: mongoose.Types.ObjectId.isValid(id),
  });

  // Calculate balance from all transactions (most accurate method)
  // Sum of all earning transactions minus sum of all withdrawal transactions
  const [allEarningsCalc, allWithdrawalsCalc, pendingWithdrawals, currentMonthStart, lastMonthStart, lastMonthEnd] = await Promise.all([
    WalletTransaction.aggregate([
      {
        $match: {
          userId: doctorObjectId,
          userType: 'doctor',
          type: 'earning',
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]),
    WalletTransaction.aggregate([
      {
        $match: {
          userId: doctorObjectId,
          userType: 'doctor',
          type: 'withdrawal',
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]),
    WithdrawalRequest.aggregate([
      {
        $match: {
          userId: doctorObjectId,
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
    ]),
    Promise.resolve((() => {
      const date = new Date();
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      return date;
    })()),
    Promise.resolve((() => {
      const date = new Date();
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      date.setMonth(date.getMonth() - 1);
      return date;
    })()),
    Promise.resolve((() => {
      const date = new Date();
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      date.setDate(0);
      date.setHours(23, 59, 59, 999);
      return date;
    })()),
  ]);
  
  // Calculate balance from transactions
  const balance = (allEarningsCalc[0]?.total || 0) - (allWithdrawalsCalc[0]?.total || 0);
  const pendingAmount = pendingWithdrawals[0]?.total || 0;
  const availableBalance = Math.max(0, balance - pendingAmount);
  
  // Use already calculated earnings and withdrawals
  const totalEarnings = allEarningsCalc[0]?.total || 0;
  const totalWithdrawals = allWithdrawalsCalc[0]?.total || 0;
  
  console.log(`💰 Doctor wallet balance calculated:`, {
    doctorId: doctorObjectId.toString(),
    totalEarnings,
    totalWithdrawals,
    balance,
    availableBalance,
    pendingAmount,
    allEarningsCalcResult: allEarningsCalc,
    allWithdrawalsCalcResult: allWithdrawalsCalc,
  });

  // Calculate this month and last month earnings
  const [thisMonthEarnings, lastMonthEarnings, totalTransactions] = await Promise.all([
    WalletTransaction.aggregate([
      {
        $match: {
          userId: doctorObjectId,
          userType: 'doctor',
          type: 'earning',
          status: 'completed',
          createdAt: { $gte: currentMonthStart },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(result => result[0]?.total || 0),
    WalletTransaction.aggregate([
      {
        $match: {
          userId: doctorObjectId,
          userType: 'doctor',
          type: 'earning',
          status: 'completed',
          createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(result => result[0]?.total || 0),
    WalletTransaction.countDocuments({ userId: doctorObjectId, userType: 'doctor' }),
  ]);
  
  // Debug: Check if transactions exist
  const debugTransactions = await WalletTransaction.find({ 
    userId: doctorObjectId, 
    userType: 'doctor' 
  }).limit(5);
  
  console.log(`📊 Debug - Found ${debugTransactions.length} wallet transactions:`, {
    doctorId: doctorObjectId.toString(),
    transactions: debugTransactions.map(t => ({
      type: t.type,
      amount: t.amount,
      status: t.status,
      userId: t.userId.toString(),
    })),
  });

  return res.status(200).json({
    success: true,
    data: {
      balance,
      totalBalance: balance, // Alias for balance
      availableBalance,
      pendingBalance: pendingAmount,
      pendingWithdrawals: pendingAmount,
      totalEarnings,
      totalWithdrawals,
      thisMonthEarnings,
      lastMonthEarnings,
      totalTransactions,
    },
  });
});

// GET /api/doctors/wallet/earnings
exports.getEarnings = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  
  // Convert id to ObjectId to ensure proper matching
  const doctorObjectId = mongoose.Types.ObjectId.isValid(id) 
    ? new mongoose.Types.ObjectId(id) 
    : id;
  
  const { dateFrom, dateTo } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = {
    userId: doctorObjectId,
    userType: 'doctor',
    type: 'earning',
    status: 'completed',
  };
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) {
      const start = new Date(dateFrom);
      start.setHours(0, 0, 0, 0);
      filter.createdAt.$gte = start;
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const [earnings, total] = await Promise.all([
    WalletTransaction.find(filter)
      .populate('appointmentId', 'appointmentDate fee')
      .populate('orderId', 'totalAmount status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    WalletTransaction.countDocuments(filter),
  ]);

  console.log(`📊 Earnings fetched:`, {
    doctorId: doctorObjectId.toString(),
    count: earnings.length,
    total,
  });

  return res.status(200).json({
    success: true,
    data: {
      items: earnings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/doctors/wallet/withdrawals
exports.getWithdrawals = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { status } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = {
    userId: id,
    userType: 'doctor',
    type: 'withdrawal',
  };
  if (status) filter.status = status;

  const [withdrawals, total] = await Promise.all([
    WalletTransaction.find(filter)
      .populate('withdrawalRequestId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    WalletTransaction.countDocuments(filter),
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

// POST /api/doctors/wallet/withdraw
exports.requestWithdrawal = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { amount, paymentMethod, bankAccount, upiId, walletNumber } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid withdrawal amount',
    });
  }

  // Get current wallet balance
  const latestTransaction = await WalletTransaction.findOne({
    userId: id,
    userType: 'doctor',
    status: 'completed',
  }).sort({ createdAt: -1 });

  const balance = latestTransaction?.balance || 0;

  // Calculate available balance (excluding pending withdrawals)
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

  // Validate payment method
  if (paymentMethod === 'bank' && (!bankAccount || !bankAccount.accountNumber || !bankAccount.ifscCode)) {
    return res.status(400).json({
      success: false,
      message: 'Bank account details are required for bank transfer',
    });
  }

  if (paymentMethod === 'upi' && !upiId) {
    return res.status(400).json({
      success: false,
      message: 'UPI ID is required for UPI transfer',
    });
  }

  if (paymentMethod === 'wallet' && !walletNumber) {
    return res.status(400).json({
      success: false,
      message: 'Wallet number is required for wallet transfer',
    });
  }

  // Create withdrawal request
  const withdrawalRequest = await WithdrawalRequest.create({
    userId: id,
    userType: 'doctor',
    amount,
    paymentMethod,
    bankAccount: paymentMethod === 'bank' ? bankAccount : null,
    upiId: paymentMethod === 'upi' ? upiId : null,
    walletNumber: paymentMethod === 'wallet' ? walletNumber : null,
    status: 'pending',
  });

  // Send notification to admin
  try {
    await sendWithdrawalRequestNotification({
      withdrawalRequest,
      doctor: await Doctor.findById(id),
    });
  } catch (error) {
    console.error('Error sending withdrawal request notification:', error);
  }

  return res.status(201).json({
    success: true,
    message: 'Withdrawal request submitted successfully',
    data: withdrawalRequest,
  });
});

// GET /api/doctors/wallet/transactions
exports.getTransactions = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  
  // Convert id to ObjectId to ensure proper matching
  const doctorObjectId = mongoose.Types.ObjectId.isValid(id) 
    ? new mongoose.Types.ObjectId(id) 
    : id;
  
  const { type, startDate, endDate } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = {
    userId: doctorObjectId,
    userType: 'doctor',
  };
  
  console.log(`🔍 Fetching transactions for doctor:`, {
    id,
    doctorObjectId: doctorObjectId.toString(),
    filter,
  });
  if (type) filter.type = type;
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
    WalletTransaction.find(filter)
      .populate('appointmentId', 'appointmentDate fee')
      .populate('orderId', 'totalAmount status')
      .populate('withdrawalRequestId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    WalletTransaction.countDocuments(filter),
  ]);

  console.log(`📊 Transactions fetched:`, {
    doctorId: doctorObjectId.toString(),
    count: transactions.length,
    total,
    types: transactions.map(t => t.type),
  });
  
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
