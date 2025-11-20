const asyncHandler = require('../../middleware/asyncHandler');
const WithdrawalRequest = require('../../models/WithdrawalRequest');
const {
  getAdminWalletOverview,
  getAdminDoctorSummaries,
  getAdminProviderSummaries,
  buildWithdrawalHistoryEntry,
} = require('../../services/walletService');
const { WITHDRAWAL_STATUS, ROLES } = require('../../utils/constants');
const { getModelForRole } = require('../../utils/getModelForRole');

exports.getOverview = asyncHandler(async (req, res) => {
  const overview = await getAdminWalletOverview();

  res.json({
    success: true,
    overview,
  });
});

exports.listDoctorSummaries = asyncHandler(async (req, res) => {
  const summaries = await getAdminDoctorSummaries();

  res.json({
    success: true,
    doctors: summaries,
  });
});

exports.listProviderSummaries = asyncHandler(async (req, res) => {
  const { role } = req.query;

  if (!role || ![ROLES.DOCTOR, ROLES.LABORATORY, ROLES.PHARMACY].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Valid role (doctor, laboratory, pharmacy) is required.',
    });
  }

  const summaries = await getAdminProviderSummaries(role);

  res.json({
    success: true,
    providers: summaries,
  });
});

exports.listWithdrawals = asyncHandler(async (req, res) => {
  const status = req.query.status;
  const role = req.query.role; // Filter by provider role
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const match = {};
  if (status && Object.values(WITHDRAWAL_STATUS).includes(status)) {
    match.status = status;
  }
  if (role && Object.values(ROLES).includes(role) && [ROLES.DOCTOR, ROLES.LABORATORY, ROLES.PHARMACY].includes(role)) {
    match.providerRole = role;
  }

  const requests = await WithdrawalRequest.find(match)
    .populate('provider', '-password')
    .populate('doctor', 'firstName lastName email phone specialization') // Legacy support
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Populate provider details based on providerModel
  for (const request of requests) {
    if (request.providerModel && request.provider) {
      const Model = getModelForRole(request.providerRole);
      if (Model) {
        const provider = await Model.findById(request.provider).select('-password').lean();
        if (provider) {
          request.providerDetails = provider;
        }
      }
    }
  }

  const total = await WithdrawalRequest.countDocuments(match);

  res.json({
    success: true,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
    withdrawals: requests,
  });
});

exports.updateWithdrawalStatus = asyncHandler(async (req, res) => {
  const { withdrawalId } = req.params;
  const { status, adminNote, payoutReference } = req.body;

  if (!Object.values(WITHDRAWAL_STATUS).includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status value.',
    });
  }

  const request = await WithdrawalRequest.findById(withdrawalId);

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Withdrawal request not found.',
    });
  }

  const currentStatus = request.status;

  if (currentStatus === WITHDRAWAL_STATUS.REJECTED || currentStatus === WITHDRAWAL_STATUS.PAID) {
    return res.status(400).json({
      success: false,
      message: 'This withdrawal request has already been completed.',
    });
  }

  if (currentStatus === WITHDRAWAL_STATUS.APPROVED && status === WITHDRAWAL_STATUS.APPROVED) {
    return res.status(400).json({
      success: false,
      message: 'Request is already approved.',
    });
  }

  if (currentStatus === WITHDRAWAL_STATUS.PENDING && status === WITHDRAWAL_STATUS.PENDING) {
    return res.status(400).json({
      success: false,
      message: 'Request is already pending.',
    });
  }

  if (
    status === WITHDRAWAL_STATUS.APPROVED &&
    currentStatus !== WITHDRAWAL_STATUS.PENDING
  ) {
    return res.status(400).json({
      success: false,
      message: 'Only pending requests can be approved.',
    });
  }

  if (status === WITHDRAWAL_STATUS.REJECTED && !adminNote) {
    return res.status(400).json({
      success: false,
      message: 'adminNote is required when rejecting a request.',
    });
  }

  if (
    status === WITHDRAWAL_STATUS.PAID &&
    ![WITHDRAWAL_STATUS.APPROVED, WITHDRAWAL_STATUS.PENDING].includes(currentStatus)
  ) {
    return res.status(400).json({
      success: false,
      message: 'Only pending or approved requests can be marked as paid.',
    });
  }

  request.status = status;
  request.adminNote = adminNote || request.adminNote;
  if (status === WITHDRAWAL_STATUS.PAID) {
    request.payoutReference = payoutReference || request.payoutReference;
    request.processedAt = new Date();
    request.processedBy = req.auth.id;
  }

  request.statusHistory.push(
    buildWithdrawalHistoryEntry({
      status,
      note: adminNote,
      actorId: req.auth.id,
      actorRole: 'admin',
    })
  );

  await request.save();


  res.json({
    success: true,
    withdrawal: request,
  });
});


