const asyncHandler = require('../../middleware/asyncHandler');
const { ROLES } = require('../../utils/constants');
const {
  registerDeviceToken,
  unregisterDeviceToken,
} = require('../../services/pushNotificationService');

const roleToModel = {
  [ROLES.PATIENT]: 'Patient',
  [ROLES.DOCTOR]: 'Doctor',
  [ROLES.LABORATORY]: 'Laboratory',
  [ROLES.PHARMACY]: 'Pharmacy',
  [ROLES.ADMIN]: 'Admin',
};

exports.registerDevice = asyncHandler(async (req, res) => {
  const { token, platform, deviceType, metadata } = req.body;

  if (!token || !platform || !deviceType) {
    return res.status(400).json({
      success: false,
      message: 'token, platform, and deviceType are required.',
    });
  }

  const { id: userId, role } = req.auth;
  const userModel = roleToModel[role];

  if (!userModel) {
    return res.status(400).json({
      success: false,
      message: 'Unsupported role for device token management.',
    });
  }

  await registerDeviceToken({
    userId,
    userModel,
    role,
    token,
    platform,
    deviceType,
    metadata,
  });

  return res.status(200).json({
    success: true,
    message: 'Device registered for notifications.',
  });
});

exports.unregisterDevice = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'token is required.',
    });
  }

  await unregisterDeviceToken(token);

  return res.status(200).json({
    success: true,
    message: 'Device unregistered successfully.',
  });
});


