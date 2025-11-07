const Admin = require('../../models/Admin');
const asyncHandler = require('../../middleware/asyncHandler');
const { createAccessToken, createRefreshToken } = require('../../utils/tokenService');
const {
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetPassword,
} = require('../../services/passwordResetService');
const { getProfileByRoleAndId, updateProfileByRoleAndId } = require('../../services/profileService');
const { ROLES } = require('../../utils/constants');

const buildAuthResponse = (admin) => {
  const payload = { id: admin._id, role: ROLES.ADMIN, isSuperAdmin: admin.isSuperAdmin };
  return {
    accessToken: createAccessToken(payload),
    refreshToken: createRefreshToken(payload),
  };
};

exports.registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, phone, password, registrationCode, isSuperAdmin } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are required.',
    });
  }

  const existingAdmin = await Admin.findOne({ email });

  if (existingAdmin) {
    return res.status(400).json({ success: false, message: 'Email already registered.' });
  }

  const configuredCode = process.env.ADMIN_REGISTRATION_CODE;

  if (configuredCode) {
    if (!registrationCode || registrationCode !== configuredCode) {
      return res.status(403).json({
        success: false,
        message: 'Invalid admin registration code.',
      });
    }
  } else {
    console.warn('ADMIN_REGISTRATION_CODE is not set. Admin registration is open to anyone with API access.');
  }

  const admin = await Admin.create({
    name,
    email,
    phone,
    password,
    isSuperAdmin: Boolean(isSuperAdmin),
  });

  const tokens = buildAuthResponse(admin);

  return res.status(201).json({
    success: true,
    message: 'Admin account created successfully.',
    data: {
      admin,
      tokens,
    },
  });
});

exports.loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const admin = await Admin.findOne({ email });

  if (!admin) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const isMatch = await admin.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  if (!admin.isActive) {
    return res.status(403).json({ success: false, message: 'Admin account is disabled.' });
  }

  admin.lastLoginAt = new Date();
  await admin.save({ validateBeforeSave: false });

  const tokens = buildAuthResponse(admin);

  return res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: {
      admin,
      tokens,
    },
  });
});

exports.getAdminProfile = asyncHandler(async (req, res) => {
  const admin = await getProfileByRoleAndId(ROLES.ADMIN, req.auth.id);

  return res.status(200).json({ success: true, data: admin });
});

exports.updateAdminProfile = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  if (updates.phone && typeof updates.phone !== 'string') {
    updates.phone = String(updates.phone);
  }

  const admin = await updateProfileByRoleAndId(ROLES.ADMIN, req.auth.id, updates, { requester: req.user });

  return res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: admin,
  });
});

exports.logoutAdmin = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ success: true, message: 'Logout successful.' });
});

exports.getAdminById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const requester = req.user;
  const requesterId = String(req.auth.id);

  if (requesterId !== String(id) && !requester.isSuperAdmin) {
    const error = new Error('Only super admins can view other admin profiles.');
    error.status = 403;
    throw error;
  }

  const admin = await getProfileByRoleAndId(ROLES.ADMIN, id);

  return res.status(200).json({ success: true, data: admin });
});

exports.adminForgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  const result = await requestPasswordReset({ role: ROLES.ADMIN, email });

  return res.status(200).json({ success: true, message: result.message });
});

exports.adminVerifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  const result = await verifyPasswordResetOtp({ role: ROLES.ADMIN, email, otp });

  return res.status(200).json({
    success: true,
    message: result.message,
    data: { resetToken: result.resetToken },
  });
});

exports.adminResetPassword = asyncHandler(async (req, res) => {
  const { email, resetToken, newPassword, confirmPassword } = req.body;

  if (!email || !resetToken || !newPassword || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Email, resetToken, newPassword, and confirmPassword are required.',
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Password confirmation does not match.' });
  }

  await resetPassword({ role: ROLES.ADMIN, email, resetToken, newPassword });

  return res.status(200).json({ success: true, message: 'Password reset successfully.' });
});


