const asyncHandler = require('../../middleware/asyncHandler');
const { getModelForRole, ROLES } = require('../../utils/getModelForRole');
const { APPROVAL_STATUS } = require('../../utils/constants');
const { sendRoleApprovalEmail } = require('../../services/emailService');

const APPROVABLE_ROLES = [ROLES.DOCTOR, ROLES.LABORATORY, ROLES.PHARMACY];

const assertRoleSupported = (role) => {
  if (!APPROVABLE_ROLES.includes(role)) {
    const error = new Error('Unsupported role for approval workflow');
    error.status = 400;
    throw error;
  }
};

exports.listRequests = asyncHandler(async (req, res) => {
  const { role, status = APPROVAL_STATUS.PENDING } = req.query;

  if (role) {
    assertRoleSupported(role);
    const Model = getModelForRole(role);
    const records = await Model.find({ status }).sort({ createdAt: -1 }).select('-password');
    return res.status(200).json({ success: true, data: { [role]: records } });
  }

  const results = {};

  await Promise.all(
    APPROVABLE_ROLES.map(async (itemRole) => {
      const Model = getModelForRole(itemRole);
      const key = `${itemRole}s`;
      results[key] = await Model.find({ status }).sort({ createdAt: -1 }).select('-password');
    })
  );

  return res.status(200).json({ success: true, data: results });
});

exports.approveRequest = asyncHandler(async (req, res) => {
  const { role, id } = req.params;

  assertRoleSupported(role);

  const Model = getModelForRole(role);
  const record = await Model.findById(id);

  if (!record) {
    return res.status(404).json({ success: false, message: `${role} registration not found.` });
  }

  if (record.status === APPROVAL_STATUS.APPROVED) {
    return res.status(200).json({
      success: true,
      message: 'Request already approved.',
      data: record,
    });
  }

  record.status = APPROVAL_STATUS.APPROVED;
  record.rejectionReason = undefined;
  record.approvedAt = new Date();
  record.approvedBy = req.auth.id;
  await record.save({ validateBeforeSave: false });

  await sendRoleApprovalEmail({
    role,
    email: record.email,
    status: APPROVAL_STATUS.APPROVED,
  });

  return res.status(200).json({
    success: true,
    message: `${role} registration approved successfully.`,
    data: record,
  });
});

exports.rejectRequest = asyncHandler(async (req, res) => {
  const { role, id } = req.params;
  const { reason } = req.body;

  assertRoleSupported(role);

  const Model = getModelForRole(role);
  const record = await Model.findById(id);

  if (!record) {
    return res.status(404).json({ success: false, message: `${role} registration not found.` });
  }

  if (record.status === APPROVAL_STATUS.REJECTED && record.rejectionReason === reason) {
    return res.status(200).json({
      success: true,
      message: 'Request already rejected with same reason.',
      data: record,
    });
  }

  record.status = APPROVAL_STATUS.REJECTED;
  record.rejectionReason = reason || 'Not specified';
  record.approvedAt = undefined;
  record.approvedBy = req.auth.id;
  await record.save({ validateBeforeSave: false });

  await sendRoleApprovalEmail({
    role,
    email: record.email,
    status: APPROVAL_STATUS.REJECTED,
    reason: record.rejectionReason,
  });

  return res.status(200).json({
    success: true,
    message: `${role} registration rejected successfully.`,
    data: record,
  });
});


