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
const {
  LOCATION_SOURCES,
  normalizeLocationSource,
  parseGeoPoint,
  extractAddressLocation,
} = require('../../utils/locationUtils');

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

  const {
    address: normalizedAddress,
    addressProvided,
    location: addressLocation,
    locationProvided: addressLocationProvided,
    locationSource: addressLocationSource,
    locationSourceProvided: addressLocationSourceProvided,
    error: addressLocationError,
  } = extractAddressLocation(address);

  if (addressLocationError) {
    return res.status(400).json({
      success: false,
      message: addressLocationError,
    });
  }

  const legacyLocation = parseGeoPoint({
    location: req.body.location,
    coordinates: req.body.coordinates,
    lat: req.body.lat ?? req.body.latitude,
    lng: req.body.lng ?? req.body.longitude,
    latitude: req.body.latitude,
    longitude: req.body.longitude,
  });

  if (legacyLocation.error) {
    return res.status(400).json({
      success: false,
      message: legacyLocation.error,
    });
  }

  let laboratoryLocation;
  let shouldClearLocation = false;

  if (legacyLocation.provided) {
    laboratoryLocation = legacyLocation.point;
    shouldClearLocation = legacyLocation.point === null;
  } else if (addressLocationProvided) {
    laboratoryLocation = addressLocation;
    shouldClearLocation = addressLocation === null;
  }

  let addressPayload =
    normalizedAddress || laboratoryLocation || shouldClearLocation || addressLocationSourceProvided
      ? { ...(normalizedAddress || {}) }
      : normalizedAddress;

  if (laboratoryLocation) {
    addressPayload = addressPayload || {};
    addressPayload.location = laboratoryLocation;
  } else if (shouldClearLocation && addressPayload) {
    addressPayload.location = undefined;
  }

  let locationSourceValue;
  let locationSourceProvided = false;

  if (req.body.locationSource !== undefined) {
    const normalizedSource = normalizeLocationSource(req.body.locationSource);
    if (normalizedSource && !LOCATION_SOURCES.includes(normalizedSource)) {
      return res.status(400).json({
        success: false,
        message: `locationSource must be one of: ${LOCATION_SOURCES.join(', ')}.`,
      });
    }
    locationSourceValue =
      normalizedSource === null ? undefined : normalizedSource;
    locationSourceProvided = true;
  } else if (addressLocationSourceProvided) {
    if (
      addressLocationSource &&
      !LOCATION_SOURCES.includes(addressLocationSource)
    ) {
      return res.status(400).json({
        success: false,
        message: `locationSource must be one of: ${LOCATION_SOURCES.join(', ')}.`,
      });
    }
    locationSourceValue =
      addressLocationSource === null ? undefined : addressLocationSource;
    locationSourceProvided = true;
  }

  if (locationSourceProvided) {
    addressPayload = addressPayload || {};
    if (locationSourceValue) {
      addressPayload.locationSource = locationSourceValue;
    } else {
      addressPayload.locationSource = undefined;
    }
  }

  const laboratory = await Laboratory.create({
    labName,
    ownerName,
    email,
    phone,
    password,
    licenseNumber,
    certifications,
    address: addressPayload,
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

  if (laboratory.isActive === false) {
    return res.status(403).json({
      success: false,
      message: 'Account is inactive. Please contact support.',
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

  const rawAddressUpdate = updates.address;

  const {
    address: normalizedAddress,
    addressProvided,
    location: addressLocation,
    locationProvided: addressLocationProvided,
    locationSource: addressLocationSource,
    locationSourceProvided: addressLocationSourceProvided,
    error: addressLocationError,
  } = extractAddressLocation(rawAddressUpdate);

  if (addressLocationError) {
    return res.status(400).json({
      success: false,
      message: addressLocationError,
    });
  }

  let addressPayload =
    normalizedAddress !== undefined ? { ...normalizedAddress } : undefined;

  if (addressProvided && addressPayload === undefined) {
    addressPayload = {};
  }

  const legacyLocation = parseGeoPoint({
    location: updates.location,
    coordinates: updates.coordinates,
    lat: updates.lat ?? updates.latitude,
    lng: updates.lng ?? updates.longitude,
    latitude: updates.latitude,
    longitude: updates.longitude,
  });

  if (legacyLocation.error) {
    return res.status(400).json({
      success: false,
      message: legacyLocation.error,
    });
  }

  let locationValue;
  let shouldClearLocation = false;

  if (legacyLocation.provided) {
    locationValue = legacyLocation.point;
    shouldClearLocation = legacyLocation.point === null;
  } else if (addressLocationProvided) {
    locationValue = addressLocation;
    shouldClearLocation = addressLocation === null;
  } else if (updates.address && updates.address.location === null) {
    shouldClearLocation = true;
  }

  if (locationValue) {
    addressPayload = addressPayload || {};
    addressPayload.location = locationValue;
  } else if (shouldClearLocation && addressPayload) {
    addressPayload.location = undefined;
  }

  let locationSourceValue;
  let locationSourceProvided = false;

  if (updates.locationSource !== undefined) {
    const normalizedSource = normalizeLocationSource(updates.locationSource);
    if (normalizedSource && !LOCATION_SOURCES.includes(normalizedSource)) {
      return res.status(400).json({
        success: false,
        message: `locationSource must be one of: ${LOCATION_SOURCES.join(', ')}.`,
      });
    }
    locationSourceValue =
      normalizedSource === null ? undefined : normalizedSource;
    locationSourceProvided = true;
  } else if (addressLocationSourceProvided) {
    if (
      addressLocationSource &&
      !LOCATION_SOURCES.includes(addressLocationSource)
    ) {
      return res.status(400).json({
        success: false,
        message: `locationSource must be one of: ${LOCATION_SOURCES.join(', ')}.`,
      });
    }
    locationSourceValue =
      addressLocationSource === null ? undefined : addressLocationSource;
    locationSourceProvided = true;
  } else if (updates.address && updates.address.locationSource !== undefined) {
    const normalizedSource = normalizeLocationSource(
      updates.address.locationSource
    );
    if (normalizedSource && !LOCATION_SOURCES.includes(normalizedSource)) {
      return res.status(400).json({
        success: false,
        message: `locationSource must be one of: ${LOCATION_SOURCES.join(', ')}.`,
      });
    }
    locationSourceValue =
      normalizedSource === null ? undefined : normalizedSource;
    locationSourceProvided = true;
  }

  if (locationSourceProvided) {
    addressPayload = addressPayload || {};
    if (locationSourceValue) {
      addressPayload.locationSource = locationSourceValue;
    } else {
      addressPayload.locationSource = undefined;
    }
  }

  if (addressPayload !== undefined) {
    updates.address = addressPayload;
  }

  delete updates.location;
  delete updates.coordinates;
  delete updates.lat;
  delete updates.lng;
  delete updates.latitude;
  delete updates.longitude;
  delete updates.locationSource;

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


