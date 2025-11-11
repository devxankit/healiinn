const Laboratory = require('../../models/Laboratory');
const asyncHandler = require('../../middleware/asyncHandler');
const { createAccessToken, createRefreshToken } = require('../../utils/tokenService');
const { sendSignupAcknowledgementEmail } = require('../../services/emailService');
const {
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetPassword,
} = require('../../services/passwordResetService');
const { getProfileByRoleAndId, updateProfileByRoleAndId } = require('../../services/profileService');
const { notifyAdminsOfPendingSignup } = require('../../services/adminNotificationService');
const { ROLES, APPROVAL_STATUS } = require('../../utils/constants');

const buildAuthResponse = (user) => {
  const payload = { id: user._id, role: ROLES.LABORATORY };
  return {
    accessToken: createAccessToken(payload),
    refreshToken: createRefreshToken(payload),
  };
};

exports.registerLaboratory = asyncHandler(async (req, res) => {
  const {
    labName,
    ownerName,
    email,
    phone,
    password,
    licenseNumber,
    certifications,
    address,
    servicesOffered,
    timings,
    contactPerson,
    documents,
    operatingHours,
    profileImage,
    labLogo,
  } = req.body;

  if (!labName || !email || !phone || !password || !licenseNumber) {
    return res.status(400).json({
      success: false,
      message: 'Required fields missing. Provide lab name, email, phone, password, and license number.',
    });
  }

  const existingEmail = await Laboratory.findOne({ email });
  if (existingEmail) {
    return res.status(400).json({ success: false, message: 'Email already registered.' });
  }

  const existingPhone = await Laboratory.findOne({ phone });
  if (existingPhone) {
    return res.status(400).json({ success: false, message: 'Phone number already registered.' });
  }

  const existingLicense = await Laboratory.findOne({ licenseNumber });
  if (existingLicense) {
    return res.status(400).json({ success: false, message: 'License number already registered.' });
  }

  const normalizedServices = Array.isArray(servicesOffered)
    ? servicesOffered
    : servicesOffered
    ? [servicesOffered]
    : undefined;

  const normalizedTimings = Array.isArray(timings) ? timings : timings ? [timings] : undefined;

  const laboratory = await Laboratory.create({
    labName,
    ownerName,
    email,
    phone,
    password,
    licenseNumber,
    certifications,
    address,
    servicesOffered: normalizedServices,
    timings: normalizedTimings,
    contactPerson,
    documents,
    operatingHours,
    profileImage: profileImage || labLogo,
    status: APPROVAL_STATUS.PENDING,
  });

  await sendSignupAcknowledgementEmail({
    role: ROLES.LABORATORY,
    email: laboratory.email,
    name: laboratory.labName,
  });

  await notifyAdminsOfPendingSignup({ role: ROLES.LABORATORY, entity: laboratory });

  return res.status(201).json({
    success: true,
    message: 'Laboratory registration submitted for admin approval.',
    data: {
      laboratory,
    },
  });
});

exports.loginLaboratory = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const laboratory = await Laboratory.findOne({ email });

  if (!laboratory) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const isMatch = await laboratory.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  if (laboratory.status !== APPROVAL_STATUS.APPROVED) {
    return res.status(403).json({
      success: false,
      message: 'Account pending admin approval. Please wait for confirmation email.',
      data: {
        status: laboratory.status,
        rejectionReason: laboratory.rejectionReason || null,
      },
    });
  }

  laboratory.lastLoginAt = new Date();
  await laboratory.save({ validateBeforeSave: false });

  const tokens = buildAuthResponse(laboratory);

  return res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: {
      laboratory,
      tokens,
    },
  });
});

exports.getLaboratoryProfile = asyncHandler(async (req, res) => {
  const laboratory = await getProfileByRoleAndId(ROLES.LABORATORY, req.auth.id);

  return res.status(200).json({ success: true, data: laboratory });
});

exports.updateLaboratoryProfile = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  if (updates.servicesOffered !== undefined && !Array.isArray(updates.servicesOffered)) {
    updates.servicesOffered = [updates.servicesOffered];
  }

  if (updates.timings !== undefined && !Array.isArray(updates.timings)) {
    updates.timings = [updates.timings];
  }

  if (updates.labLogo && !updates.profileImage) {
    updates.profileImage = updates.labLogo;
  }

  delete updates.labLogo;

  const laboratory = await updateProfileByRoleAndId(ROLES.LABORATORY, req.auth.id, updates);

  return res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: laboratory,
  });
});

exports.logoutLaboratory = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ success: true, message: 'Logout successful.' });
});

exports.getLaboratoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const requesterRole = req.auth.role;
  const requesterId = String(req.auth.id);

  if (requesterRole !== ROLES.ADMIN && requesterId !== String(id)) {
    const error = new Error('You are not authorized to access this laboratory profile.');
    error.status = 403;
    throw error;
  }

  const laboratory = await getProfileByRoleAndId(ROLES.LABORATORY, id);

  return res.status(200).json({ success: true, data: laboratory });
});

exports.laboratoryForgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  const result = await requestPasswordReset({ role: ROLES.LABORATORY, email });

  return res.status(200).json({ success: true, message: result.message });
});

exports.laboratoryVerifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  const result = await verifyPasswordResetOtp({ role: ROLES.LABORATORY, email, otp });

  return res.status(200).json({
    success: true,
    message: result.message,
    data: { resetToken: result.resetToken },
  });
});

exports.laboratoryResetPassword = asyncHandler(async (req, res) => {
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

  await resetPassword({ role: ROLES.LABORATORY, email, resetToken, newPassword });

  return res.status(200).json({ success: true, message: 'Password reset successfully.' });
});


