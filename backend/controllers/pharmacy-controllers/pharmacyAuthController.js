const Pharmacy = require('../../models/Pharmacy');
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
  const payload = { id: user._id, role: ROLES.PHARMACY };
  return {
    accessToken: createAccessToken(payload),
    refreshToken: createRefreshToken(payload),
  };
};

exports.registerPharmacy = asyncHandler(async (req, res) => {
  const {
    pharmacyName,
    ownerName,
    email,
    phone,
    password,
    licenseNumber,
    gstNumber,
    address,
    deliveryOptions,
    serviceRadiusKm,
    timings,
    contactPerson,
    documents,
    profileImage,
    storeLogo,
  } = req.body;

  if (!pharmacyName || !email || !phone || !password || !licenseNumber) {
    return res.status(400).json({
      success: false,
      message: 'Required fields missing. Provide pharmacy name, email, phone, password, and license number.',
    });
  }

  const existingEmail = await Pharmacy.findOne({ email });
  if (existingEmail) {
    return res.status(400).json({ success: false, message: 'Email already registered.' });
  }

  const existingPhone = await Pharmacy.findOne({ phone });
  if (existingPhone) {
    return res.status(400).json({ success: false, message: 'Phone number already registered.' });
  }

  const existingLicense = await Pharmacy.findOne({ licenseNumber });
  if (existingLicense) {
    return res.status(400).json({ success: false, message: 'License number already registered.' });
  }

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

  let pharmacyLocation;
  let shouldClearLocation = false;

  if (legacyLocation.provided) {
    pharmacyLocation = legacyLocation.point;
    shouldClearLocation = legacyLocation.point === null;
  } else if (addressLocationProvided) {
    pharmacyLocation = addressLocation;
    shouldClearLocation = addressLocation === null;
  }

  let addressPayload =
    normalizedAddress || pharmacyLocation || shouldClearLocation || addressLocationSourceProvided
      ? { ...(normalizedAddress || {}) }
      : normalizedAddress;

  if (pharmacyLocation) {
    addressPayload = addressPayload || {};
    addressPayload.location = pharmacyLocation;
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

  const pharmacy = await Pharmacy.create({
    pharmacyName,
    ownerName,
    email,
    phone,
    password,
    licenseNumber,
    gstNumber,
    address: addressPayload,
    deliveryOptions,
    serviceRadiusKm,
    timings: normalizedTimings,
    contactPerson,
    documents,
    profileImage: profileImage || storeLogo,
    status: APPROVAL_STATUS.PENDING,
  });

  await sendSignupAcknowledgementEmail({
    role: ROLES.PHARMACY,
    email: pharmacy.email,
    name: pharmacy.pharmacyName,
  });

  await notifyAdminsOfPendingSignup({ role: ROLES.PHARMACY, entity: pharmacy });

  return res.status(201).json({
    success: true,
    message: 'Pharmacy registration submitted for admin approval.',
    data: {
      pharmacy,
    },
  });
});

exports.loginPharmacy = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const pharmacy = await Pharmacy.findOne({ email });

  if (!pharmacy) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const isMatch = await pharmacy.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  if (pharmacy.status !== APPROVAL_STATUS.APPROVED) {
    return res.status(403).json({
      success: false,
      message: 'Account pending admin approval. Please wait for confirmation email.',
      data: {
        status: pharmacy.status,
        rejectionReason: pharmacy.rejectionReason || null,
      },
    });
  }

  pharmacy.lastLoginAt = new Date();
  await pharmacy.save({ validateBeforeSave: false });

  const tokens = buildAuthResponse(pharmacy);

  return res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: {
      pharmacy,
      tokens,
    },
  });
});

exports.getPharmacyProfile = asyncHandler(async (req, res) => {
  const pharmacy = await getProfileByRoleAndId(ROLES.PHARMACY, req.auth.id);

  return res.status(200).json({ success: true, data: pharmacy });
});

exports.updatePharmacyProfile = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  if (updates.timings !== undefined && !Array.isArray(updates.timings)) {
    updates.timings = [updates.timings];
  }

  if (updates.storeLogo && !updates.profileImage) {
    updates.profileImage = updates.storeLogo;
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

  delete updates.storeLogo;

  const pharmacy = await updateProfileByRoleAndId(ROLES.PHARMACY, req.auth.id, updates);

  return res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: pharmacy,
  });
});

exports.logoutPharmacy = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ success: true, message: 'Logout successful.' });
});

exports.getPharmacyById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const requesterRole = req.auth.role;
  const requesterId = String(req.auth.id);

  if (requesterRole !== ROLES.ADMIN && requesterId !== String(id)) {
    const error = new Error('You are not authorized to access this pharmacy profile.');
    error.status = 403;
    throw error;
  }

  const pharmacy = await getProfileByRoleAndId(ROLES.PHARMACY, id);

  return res.status(200).json({ success: true, data: pharmacy });
});

exports.pharmacyForgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  const result = await requestPasswordReset({ role: ROLES.PHARMACY, email });

  return res.status(200).json({ success: true, message: result.message });
});

exports.pharmacyVerifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  const result = await verifyPasswordResetOtp({ role: ROLES.PHARMACY, email, otp });

  return res.status(200).json({
    success: true,
    message: result.message,
    data: { resetToken: result.resetToken },
  });
});

exports.pharmacyResetPassword = asyncHandler(async (req, res) => {
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

  await resetPassword({ role: ROLES.PHARMACY, email, resetToken, newPassword });

  return res.status(200).json({ success: true, message: 'Password reset successfully.' });
});


