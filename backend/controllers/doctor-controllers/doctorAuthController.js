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
const {
  LOCATION_SOURCES,
  normalizeLocationSource,
  parseGeoPoint,
  extractAddressLocation,
} = require('../../utils/locationUtils');

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
    clinicLocation,
    clinicCoordinates,
    clinicLatitude,
    clinicLongitude,
    clinicLat,
    clinicLng,
    clinicLocationSource,
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

  const rawClinicAddressInput =
    clinicAddress !== undefined ? clinicAddress : clinicPayload.address;

  const {
    address: normalizedClinicAddress,
    addressProvided: clinicAddressProvided,
    location: addressDerivedLocation,
    locationProvided: addressLocationProvided,
    locationSource: addressLocationSource,
    locationSourceProvided: addressLocationSourceProvided,
    error: addressLocationError,
  } = extractAddressLocation(rawClinicAddressInput);

  if (addressLocationError) {
    return res.status(400).json({
      success: false,
      message: addressLocationError,
    });
  }

  if (clinicAddressProvided) {
    if (normalizedClinicAddress) {
      clinicPayload.address = normalizedClinicAddress;
    } else {
      delete clinicPayload.address;
    }
  }

  if (clinicName) {
    clinicPayload.name = clinicName;
  }

  const legacyLocation = parseGeoPoint({
    location: clinicLocation ?? clinicDetails?.location,
    coordinates: clinicCoordinates,
    lat: clinicLat ?? clinicLatitude,
    lng: clinicLng ?? clinicLongitude,
    latitude: clinicLatitude,
    longitude: clinicLongitude,
  });

  if (legacyLocation.error) {
    return res.status(400).json({
      success: false,
      message: legacyLocation.error,
    });
  }

  delete clinicPayload.location;
  delete clinicPayload.locationSource;

  let clinicGeoPoint;
  let clinicLocationProvided = false;

  if (legacyLocation.provided) {
    clinicGeoPoint = legacyLocation.point;
    clinicLocationProvided = true;
  } else if (addressLocationProvided) {
    clinicGeoPoint = addressDerivedLocation;
    clinicLocationProvided = true;
  }

  if (clinicGeoPoint) {
    clinicPayload.location = clinicGeoPoint;
  } else if (clinicLocationProvided) {
    delete clinicPayload.location;
  }

  let locationSourceValue;
  let locationSourceProvided = false;

  if (clinicLocationSource !== undefined) {
    const normalizedSource = normalizeLocationSource(clinicLocationSource);
    if (normalizedSource && !LOCATION_SOURCES.includes(normalizedSource)) {
      return res.status(400).json({
        success: false,
        message: `clinicLocationSource must be one of: ${LOCATION_SOURCES.join(
          ', '
        )}.`,
      });
    }
    locationSourceValue =
      normalizedSource === null ? undefined : normalizedSource;
    locationSourceProvided = true;
  } else if (clinicDetails?.locationSource !== undefined) {
    const normalizedSource = normalizeLocationSource(
      clinicDetails.locationSource
    );
    if (normalizedSource && !LOCATION_SOURCES.includes(normalizedSource)) {
      return res.status(400).json({
        success: false,
        message: `clinicLocationSource must be one of: ${LOCATION_SOURCES.join(
          ', '
        )}.`,
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
        message: `clinicLocationSource must be one of: ${LOCATION_SOURCES.join(
          ', '
        )}.`,
      });
    }
    locationSourceValue =
      addressLocationSource === null ? undefined : addressLocationSource;
    locationSourceProvided = true;
  }

  if (locationSourceProvided) {
    if (locationSourceValue) {
      clinicPayload.locationSource = locationSourceValue;
    } else {
      delete clinicPayload.locationSource;
    }
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

  if (doctor.isActive === false) {
    return res.status(403).json({
      success: false,
      message: 'Account is inactive. Please contact support.',
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

  if (updates.clinicAddress !== undefined || updates.clinicName !== undefined) {
    updates.clinicDetails = updates.clinicDetails || {};
    if (updates.clinicName !== undefined) {
      updates.clinicDetails.name = updates.clinicName;
    }
  }

  const rawClinicAddressUpdate =
    updates.clinicAddress !== undefined
      ? updates.clinicAddress
      : updates.clinicDetails?.address;

  const {
    address: normalizedClinicAddress,
    addressProvided: clinicAddressProvided,
    location: addressDerivedLocation,
    locationProvided: addressLocationProvided,
    locationSource: addressLocationSource,
    locationSourceProvided: addressLocationSourceProvided,
    error: addressLocationError,
  } = extractAddressLocation(rawClinicAddressUpdate);

  if (addressLocationError) {
    return res.status(400).json({
      success: false,
      message: addressLocationError,
    });
  }

  if (clinicAddressProvided) {
    updates.clinicDetails = updates.clinicDetails || {};
    if (normalizedClinicAddress) {
      updates.clinicDetails.address = normalizedClinicAddress;
    } else {
      updates.clinicDetails.address = undefined;
    }
  }

  const legacyLocation = parseGeoPoint({
    location: updates.clinicLocation ?? updates.clinicDetails?.location,
    coordinates: updates.clinicCoordinates,
    lat: updates.clinicLat ?? updates.clinicLatitude,
    lng: updates.clinicLng ?? updates.clinicLongitude,
    latitude: updates.clinicLatitude,
    longitude: updates.clinicLongitude,
  });

  if (legacyLocation.error) {
    return res.status(400).json({
      success: false,
      message: legacyLocation.error,
    });
  }

  let locationShouldClear = false;
  let updatedClinicLocation;

  if (legacyLocation.provided) {
    updatedClinicLocation = legacyLocation.point;
    locationShouldClear = legacyLocation.point === null;
  } else if (addressLocationProvided) {
    updatedClinicLocation = addressDerivedLocation;
    locationShouldClear = addressDerivedLocation === null;
  } else if (
    updates.clinicDetails &&
    updates.clinicDetails.location === null
  ) {
    locationShouldClear = true;
  }

  if (updatedClinicLocation || locationShouldClear) {
    updates.clinicDetails = updates.clinicDetails || {};
    if (updatedClinicLocation) {
      updates.clinicDetails.location = updatedClinicLocation;
    } else {
      updates.clinicDetails.location = undefined;
    }
  }

  let locationSourceValue;
  let locationSourceUpdateProvided = false;

  if (updates.clinicLocationSource !== undefined) {
    const normalizedSource = normalizeLocationSource(
      updates.clinicLocationSource
    );
    if (normalizedSource && !LOCATION_SOURCES.includes(normalizedSource)) {
      return res.status(400).json({
        success: false,
        message: `clinicLocationSource must be one of: ${LOCATION_SOURCES.join(
          ', '
        )}.`,
      });
    }
    locationSourceValue =
      normalizedSource === null ? undefined : normalizedSource;
    locationSourceUpdateProvided = true;
  } else if (updates.clinicDetails?.locationSource !== undefined) {
    const normalizedSource = normalizeLocationSource(
      updates.clinicDetails.locationSource
    );
    if (normalizedSource && !LOCATION_SOURCES.includes(normalizedSource)) {
      return res.status(400).json({
        success: false,
        message: `clinicLocationSource must be one of: ${LOCATION_SOURCES.join(
          ', '
        )}.`,
      });
    }
    locationSourceValue =
      normalizedSource === null ? undefined : normalizedSource;
    locationSourceUpdateProvided = true;
  } else if (addressLocationSourceProvided) {
    if (
      addressLocationSource &&
      !LOCATION_SOURCES.includes(addressLocationSource)
    ) {
      return res.status(400).json({
        success: false,
        message: `clinicLocationSource must be one of: ${LOCATION_SOURCES.join(
          ', '
        )}.`,
      });
    }
    locationSourceValue =
      addressLocationSource === null ? undefined : addressLocationSource;
    locationSourceUpdateProvided = true;
  }

  if (locationSourceUpdateProvided) {
    updates.clinicDetails = updates.clinicDetails || {};
    if (locationSourceValue) {
      updates.clinicDetails.locationSource = locationSourceValue;
    } else {
      updates.clinicDetails.locationSource = undefined;
    }
  }

  delete updates.name;
  delete updates.experience;
  delete updates.clinicName;
  delete updates.clinicAddress;
  delete updates.clinicLocation;
  delete updates.clinicCoordinates;
  delete updates.clinicLatitude;
  delete updates.clinicLongitude;
  delete updates.clinicLat;
  delete updates.clinicLng;
  delete updates.clinicLocationSource;

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


