const Doctor = require('../../models/Doctor');
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

const buildAuthResponse = (user) => {
  const payload = { id: user._id, role: ROLES.DOCTOR };
  return {
    accessToken: createAccessToken(payload),
    refreshToken: createRefreshToken(payload),
  };
};

exports.registerDoctor = asyncHandler(async (req, res) => {
  const {
    name,
    firstName,
    lastName,
    email,
    phone,
    password,
    gender,
    specialization,
    licenseNumber,
    experienceYears,
    experience,
    education,
    languages,
    consultationModes,
    clinicName,
    clinicAddress,
    clinicDetails,
    bio,
    documents,
    consultationFee,
    availableTimings,
    profileImage,
  } = req.body;

  const resolvedName = parseName({ name, firstName, lastName });

  if (!resolvedName.firstName || !email || !phone || !password || !specialization || !licenseNumber) {
    return res.status(400).json({
      success: false,
      message: 'Required fields missing. Provide name/firstName, email, phone, password, specialization, and license number.',
    });
  }

  const existingEmail = await Doctor.findOne({ email });

  if (existingEmail) {
    return res.status(400).json({ success: false, message: 'Email already registered.' });
  }

  const existingPhone = await Doctor.findOne({ phone });

  if (existingPhone) {
    return res.status(400).json({ success: false, message: 'Phone number already registered.' });
  }

  const existingLicense = await Doctor.findOne({ licenseNumber });

  if (existingLicense) {
    return res.status(400).json({ success: false, message: 'License number already registered.' });
  }

  const clinicPayload = clinicDetails ? { ...clinicDetails } : {};

  if (clinicName) {
    clinicPayload.name = clinicName;
  }

  if (clinicAddress) {
    clinicPayload.address = clinicAddress;
  }

  const doctor = await Doctor.create({
    firstName: resolvedName.firstName,
    lastName: resolvedName.lastName || '',
    email,
    phone,
    password,
    specialization,
    licenseNumber,
    gender,
    experienceYears: experienceYears ?? experience,
    education,
    languages,
    consultationModes,
    clinicDetails: clinicPayload,
    bio,
    documents,
    consultationFee: consultationFee !== undefined ? Number(consultationFee) : undefined,
    availableTimings: Array.isArray(availableTimings)
      ? availableTimings
      : availableTimings
      ? [availableTimings]
      : undefined,
    profileImage,
    status: APPROVAL_STATUS.PENDING,
  });

  await sendSignupAcknowledgementEmail({
    role: ROLES.DOCTOR,
    email: doctor.email,
    name: `${doctor.firstName} ${doctor.lastName}`.trim(),
  });

  await notifyAdminsOfPendingSignup({ role: ROLES.DOCTOR, entity: doctor });

  return res.status(201).json({
    success: true,
    message: 'Doctor registration submitted for admin approval.',
    data: {
      doctor,
    },
  });
});

exports.loginDoctor = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const doctor = await Doctor.findOne({ email });

  if (!doctor) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const isMatch = await doctor.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  if (doctor.status !== APPROVAL_STATUS.APPROVED) {
    return res.status(403).json({
      success: false,
      message: 'Account pending admin approval. Please wait for confirmation email.',
      data: {
        status: doctor.status,
        rejectionReason: doctor.rejectionReason || null,
      },
    });
  }

  doctor.lastLoginAt = new Date();
  await doctor.save({ validateBeforeSave: false });

  const tokens = buildAuthResponse(doctor);

  return res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: {
      doctor,
      tokens,
    },
  });
});

exports.getDoctorProfile = asyncHandler(async (req, res) => {
  const doctor = await getProfileByRoleAndId(ROLES.DOCTOR, req.auth.id);

  return res.status(200).json({ success: true, data: doctor });
});

exports.updateDoctorProfile = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  if (updates.name && !updates.firstName) {
    const resolvedName = parseName({ name: updates.name });
    updates.firstName = resolvedName.firstName;
    updates.lastName = resolvedName.lastName;
  }

  if (updates.experience !== undefined && updates.experienceYears === undefined) {
    updates.experienceYears = updates.experience;
  }

  if (updates.consultationFee !== undefined) {
    updates.consultationFee = Number(updates.consultationFee);
  }

  if (updates.availableTimings !== undefined && !Array.isArray(updates.availableTimings)) {
    updates.availableTimings = [updates.availableTimings];
  }

  if (updates.clinicAddress || updates.clinicName) {
    updates.clinicDetails = updates.clinicDetails || {};
    if (updates.clinicName) {
      updates.clinicDetails.name = updates.clinicName;
    }
    if (updates.clinicAddress) {
      updates.clinicDetails.address = updates.clinicAddress;
    }
  }

  delete updates.name;
  delete updates.experience;
  delete updates.clinicName;
  delete updates.clinicAddress;

  const doctor = await updateProfileByRoleAndId(ROLES.DOCTOR, req.auth.id, updates);

  return res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: doctor,
  });
});

exports.logoutDoctor = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ success: true, message: 'Logout successful.' });
});

exports.getDoctorById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const requesterRole = req.auth.role;
  const requesterId = String(req.auth.id);

  if (requesterRole !== ROLES.ADMIN && requesterId !== String(id)) {
    const error = new Error('You are not authorized to access this doctor profile.');
    error.status = 403;
    throw error;
  }

  const doctor = await getProfileByRoleAndId(ROLES.DOCTOR, id);

  return res.status(200).json({ success: true, data: doctor });
});

exports.doctorForgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  const result = await requestPasswordReset({ role: ROLES.DOCTOR, email });

  return res.status(200).json({ success: true, message: result.message });
});

exports.doctorVerifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  const result = await verifyPasswordResetOtp({ role: ROLES.DOCTOR, email, otp });

  return res
    .status(200)
    .json({ success: true, message: result.message, data: { resetToken: result.resetToken } });
});

exports.doctorResetPassword = asyncHandler(async (req, res) => {
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

  await resetPassword({ role: ROLES.DOCTOR, email, resetToken, newPassword });

  return res.status(200).json({ success: true, message: 'Password reset successfully.' });
});


