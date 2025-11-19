const Patient = require('../../models/Patient');
const asyncHandler = require('../../middleware/asyncHandler');
const { createAccessToken, createRefreshToken } = require('../../utils/tokenService');
const { sendSignupAcknowledgementEmail } = require('../../services/emailService');
const {
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetPassword,
} = require('../../services/passwordResetService');
const { requestLoginOtp, verifyLoginOtp } = require('../../services/loginOtpService');
const { getProfileByRoleAndId, updateProfileByRoleAndId } = require('../../services/profileService');
const { ROLES } = require('../../utils/constants');

const parseName = ({ firstName, lastName, name }) => {
  if (firstName) {
    return {
      firstName: firstName.trim(),
      lastName: lastName ? lastName.trim() : lastName,
    };
  }

  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }
    return {
      firstName: parts.shift(),
      lastName: parts.join(' '),
    };
  }

  return { firstName: undefined, lastName: undefined };
};

const buildAuthResponse = (user, role) => {
  const payload = { id: user._id, role };
  return {
    accessToken: createAccessToken(payload),
    refreshToken: createRefreshToken(payload),
  };
};

exports.registerPatient = asyncHandler(async (req, res) => {
  const {
    name,
    firstName,
    lastName,
    email,
    phone,
    password,
    dateOfBirth,
    gender,
    bloodGroup,
    address,
    emergencyContact,
    medicalHistory,
    profileImage,
  } = req.body;

  const resolvedName = parseName({ name, firstName, lastName });

  if (!resolvedName.firstName || !email || !phone || !password) {
    return res.status(400).json({
      success: false,
      message: 'Required fields missing. Provide name/firstName, email, phone, and password.',
    });
  }

  const existingEmail = await Patient.findOne({ email });

  if (existingEmail) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered. Please login or reset your password.',
    });
  }

  const existingPhone = await Patient.findOne({ phone });

  if (existingPhone) {
    return res.status(400).json({
      success: false,
      message: 'Phone number already registered. Please login or use a different number.',
    });
  }

  const patient = await Patient.create({
    firstName: resolvedName.firstName,
    lastName: resolvedName.lastName || '',
    email,
    phone,
    password,
    dateOfBirth,
    gender,
    bloodGroup: bloodGroup ? String(bloodGroup).toUpperCase() : undefined,
    address,
    emergencyContact,
    medicalHistory,
    profileImage,
  });

  await sendSignupAcknowledgementEmail({
    role: ROLES.PATIENT,
    email: patient.email,
    name: `${patient.firstName} ${patient.lastName}`.trim(),
  });

  const tokens = buildAuthResponse(patient, ROLES.PATIENT);

  return res.status(201).json({
    success: true,
    message: 'Patient registered successfully.',
    data: {
      patient,
      tokens,
    },
  });
});

// Request login OTP
exports.requestLoginOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required.',
    });
  }

  const result = await requestLoginOtp({ role: ROLES.PATIENT, phone });

  return res.status(200).json({
    success: true,
    message: result.message,
    data: {
      phone: result.phone,
    },
  });
});

// Verify OTP and login
exports.loginPatient = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Phone number and OTP are required.',
    });
  }

  const result = await verifyLoginOtp({ role: ROLES.PATIENT, phone, otp });
  const { user } = result;

  const tokens = buildAuthResponse(user, ROLES.PATIENT);

  return res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: {
      patient: user,
      tokens,
    },
  });
});

exports.getPatientProfile = asyncHandler(async (req, res) => {
  const patient = await getProfileByRoleAndId(ROLES.PATIENT, req.auth.id);

  return res.status(200).json({
    success: true,
    data: patient,
  });
});

exports.updatePatientProfile = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  if (updates.name && !updates.firstName) {
    const resolvedName = parseName({ name: updates.name });
    updates.firstName = resolvedName.firstName;
    updates.lastName = resolvedName.lastName;
  }

  delete updates.name;

  if (updates.bloodGroup) {
    updates.bloodGroup = String(updates.bloodGroup).toUpperCase();
  }

  const patient = await updateProfileByRoleAndId(ROLES.PATIENT, req.auth.id, updates);

  return res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: patient,
  });
});

exports.logoutPatient = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({
    success: true,
    message: 'Logout successful.',
  });
});

exports.getPatientById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const requesterRole = req.auth.role;
  const requesterId = String(req.auth.id);

  if (requesterRole !== ROLES.ADMIN && requesterId !== String(id)) {
    const error = new Error('You are not authorized to access this patient profile.');
    error.status = 403;
    throw error;
  }

  const patient = await getProfileByRoleAndId(ROLES.PATIENT, id);

  return res.status(200).json({ success: true, data: patient });
});

exports.patientForgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  const result = await requestPasswordReset({ role: ROLES.PATIENT, email });

  return res.status(200).json({ success: true, message: result.message });
});

exports.patientVerifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  const result = await verifyPasswordResetOtp({ role: ROLES.PATIENT, email, otp });

  return res.status(200).json({ success: true, message: result.message, data: { resetToken: result.resetToken } });
});

exports.patientResetPassword = asyncHandler(async (req, res) => {
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

  await resetPassword({ role: ROLES.PATIENT, email, resetToken, newPassword });

  return res.status(200).json({ success: true, message: 'Password reset successfully.' });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'currentPassword, newPassword, and confirmPassword are required.',
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'New password and confirmation do not match.',
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 8 characters long.',
    });
  }

  const patient = await Patient.findById(req.auth.id);

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found.',
    });
  }

  const isCurrentPasswordValid = await patient.comparePassword(currentPassword);

  if (!isCurrentPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect.',
    });
  }

  patient.password = newPassword;
  await patient.save();

  return res.status(200).json({
    success: true,
    message: 'Password changed successfully.',
  });
});


