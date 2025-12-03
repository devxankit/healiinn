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

  // Get total payments from patients (appointments + orders)
  // Patient payments are stored with userType: 'patient'
  const patientPayments = await Transaction.aggregate([
    { $match: { userType: 'patient', type: 'payment', status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const totalPatientPayments = patientPayments[0]?.total || 0;

  // Calculate admin wallet balance (patient payments - provider earnings)
  // Note: In reality, admin keeps patient payments and pays providers from it
  const adminWalletBalance = totalPatientPayments;

  // Calculate this month and last month earnings
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);
  const lastMonthStart = new Date(currentMonthStart);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  const lastMonthEnd = new Date(currentMonthStart);
  lastMonthEnd.setDate(0);
  lastMonthEnd.setHours(23, 59, 59, 999);

  const [thisMonthPayments, lastMonthPayments, totalTransactions, activeDoctorsCount, activePharmaciesCount, activeLabsCount] = await Promise.all([
    Transaction.aggregate([
      {
        $match: {
          userType: 'patient',
          type: 'payment',
          status: 'completed',
          createdAt: { $gte: currentMonthStart },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(result => result[0]?.total || 0),
    Transaction.aggregate([
      {
        $match: {
          userType: 'patient',
          type: 'payment',
          status: 'completed',
          createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(result => result[0]?.total || 0),
    Transaction.countDocuments({ userType: 'patient', type: 'payment', status: 'completed' }),
    Doctor.countDocuments({ status: 'approved', isActive: true }),
    Pharmacy.countDocuments({ status: 'approved', isActive: true }),
    Laboratory.countDocuments({ status: 'approved', isActive: true }),
  ]);

  // Calculate total commission (total payments - total provider earnings)
  const totalCommission = totalPatientPayments - totalEarnings;

  console.log('📊 Admin Wallet Overview:', {
    doctorEarnings,
    pharmacyEarnings,
    labEarnings,
    totalEarnings,
    totalPatientPayments,
    totalCommission,
    activeDoctorsCount,
    activePharmaciesCount,
    activeLabsCount,
  });

  return res.status(200).json({
    success: true,
    data: {
      adminWalletBalance,
      totalPatientPayments,
      totalEarnings,
      totalCommission,
      doctorEarnings,
      pharmacyEarnings,
      labEarnings,
      pendingWithdrawals: pendingAmount,
      thisMonthEarnings: thisMonthPayments,
      lastMonthEarnings: lastMonthPayments,
      totalTransactions,
      activeDoctorsCount,
      activePharmaciesCount,
      activeLabsCount,
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

      // Get total earnings
      const totalEarningsResult = await WalletTransaction.aggregate([
        { $match: { userId: provider._id, userType: r, type: 'earning', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const totalEarnings = totalEarningsResult[0]?.total || 0;

      // Get total withdrawals
      const totalWithdrawalsResult = await WalletTransaction.aggregate([
        { $match: { userId: provider._id, userType: r, type: 'withdrawal', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const totalWithdrawals = totalWithdrawalsResult[0]?.total || 0;

      // Get pending withdrawal amount
      const pendingWithdrawalsResult = await WithdrawalRequest.aggregate([
        { 
          $match: { 
            userId: provider._id, 
            userType: r, 
            status: { $in: ['pending', 'approved'] } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const pendingBalance = pendingWithdrawalsResult[0]?.total || 0;

      // Get total wallet transactions count
      const totalTransactions = await WalletTransaction.countDocuments({
        userId: provider._id,
        userType: r,
      });

      summaries.push({
        providerId: provider._id,
        providerType: r,
        type: r, // Add 'type' field for frontend compatibility
        role: r, // Add 'role' field for frontend compatibility
        name: r === 'doctor' ? `${provider.firstName} ${provider.lastName}` : provider[nameField],
        email: provider.email,
        phone: provider.phone,
        balance,
        availableBalance: Math.max(0, balance - pendingBalance), // Available balance after pending withdrawals
        totalEarnings,
        totalWithdrawals,
        pendingBalance,
        totalTransactions,
        status: 'active',
      });
    }
  }

  console.log('📊 Provider Summaries:', {
    totalProviders: summaries.length,
    doctors: summaries.filter(s => s.type === 'doctor').length,
    pharmacies: summaries.filter(s => s.type === 'pharmacy').length,
    laboratories: summaries.filter(s => s.type === 'laboratory').length,
  });

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
  const { id: withdrawalId } = req.params;
  const { status, adminNote, payoutReference } = req.body;

  const { WITHDRAWAL_STATUS } = require('../../utils/constants');
  const validStatuses = Object.values(WITHDRAWAL_STATUS);
  
  if (!status || !validStatuses.includes(status)) {
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
  if (status === WITHDRAWAL_STATUS.PAID) {
    withdrawal.processedAt = new Date();
    withdrawal.processedBy = req.auth.id;
  }

  await withdrawal.save();

  // If paid, create wallet transaction for deduction
  if (status === WITHDRAWAL_STATUS.PAID) {
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
      amount: withdrawal.amount,
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

  // Create in-app notifications
  try {
    const { createWalletNotification } = require('../../services/notificationService');
    let eventType = null;
    
    if (status === 'approved') {
      eventType = 'withdrawal_approved';
    } else if (status === 'rejected') {
      eventType = 'withdrawal_rejected';
    }

    if (eventType && provider) {
      await createWalletNotification({
        userId: withdrawal.userId,
        userType: withdrawal.userType,
        amount: withdrawal.amount,
        eventType,
        withdrawal,
      }).catch((error) => console.error('Error creating withdrawal status notification:', error));
    }
  } catch (error) {
    console.error('Error creating notifications:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Withdrawal status updated successfully',
    data: withdrawal,
  });
});

// GET /api/admin/wallet/balance - Get admin wallet balance
exports.getAdminWalletBalance = asyncHandler(async (req, res) => {
  // Get total payments from patients (patient payments are stored with userType: 'patient')
  const patientPayments = await Transaction.aggregate([
    { $match: { userType: 'patient', type: 'payment', status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const balance = patientPayments[0]?.total || 0;

  // Get today's payments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayPayments = await Transaction.aggregate([
    {
      $match: {
        userType: 'patient',
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

  // Admin should see all patient payment transactions (these are the revenue)
  // Also include admin transactions for commission tracking
  const transactionType = type && type !== 'all' ? type : 'payment';
  
  const baseFilter = {
    $or: [
      { userType: 'patient', type: transactionType, status: 'completed' },
      { userType: 'admin', type: transactionType, status: 'completed' },
    ],
  };
  
  // Build date filter if provided
  const dateFilter = {};
  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    dateFilter.$gte = start;
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.$lte = end;
  }
  
  // Combine filters
  const filter = { ...baseFilter };
  if (category) {
    // Add category to each $or condition
    filter.$or = filter.$or.map(condition => ({ ...condition, category }));
  }
  if (Object.keys(dateFilter).length > 0) {
    // Add date filter to each $or condition
    filter.$or = filter.$or.map(condition => ({ ...condition, createdAt: dateFilter }));
  }
  
  console.log(`🔍 Fetching admin transactions:`, {
    filter,
    type: type || 'all',
    transactionType,
  });

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate('appointmentId', 'appointmentDate fee')
      .populate('orderId', 'totalAmount status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments(filter),
  ]);

  console.log(`📊 Admin transactions query result:`, {
    filter,
    count: transactions.length,
    total,
  });

  // Enrich transactions with patient information
  const Patient = require('../../models/Patient');
  const enrichedTransactions = await Promise.all(
    transactions.map(async (transaction) => {
      const transactionObj = transaction.toObject();
      // Get patient from userId (since userType is 'patient' or 'admin')
      if (transaction.userId && transaction.userType === 'patient') {
        const patient = await Patient.findById(transaction.userId)
          .select('firstName lastName phone email');
        if (patient) {
          transactionObj.patient = patient;
          transactionObj.patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
        }
      }
      // Also check metadata for patientId (backward compatibility)
      if (!transactionObj.patient && transaction.metadata?.patientId) {
        const patient = await Patient.findById(transaction.metadata.patientId)
          .select('firstName lastName phone email');
        if (patient) {
          transactionObj.patient = patient;
          transactionObj.patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
        }
      }
      // For admin transactions, set provider info
      if (transaction.userType === 'admin') {
        transactionObj.providerName = 'Platform';
        transactionObj.providerType = 'admin';
      }
      return transactionObj;
    })
  );

  console.log(`📊 Admin transactions enriched:`, {
    count: enrichedTransactions.length,
    total,
    types: enrichedTransactions.map(t => ({ type: t.type, userType: t.userType })),
  });

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

