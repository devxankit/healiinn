const firebaseAdmin = require('./firebaseAdmin');
const DeviceToken = require('../models/DeviceToken');

const MAX_FCM_BATCH = 500;

const dedupe = (items = []) => [...new Set(items.filter(Boolean))];

const chunk = (array, size) => {
  const batches = [];
  for (let i = 0; i < array.length; i += size) {
    batches.push(array.slice(i, i + size));
  }
  return batches;
};

const normalizeData = (data = {}) => {
  const result = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    result[key] = typeof value === 'string' ? value : JSON.stringify(value);
  });
  return result;
};

const sendToTokens = async ({ notification, data }, tokens) => {
  const tokenList = dedupe(tokens);

  if (!tokenList.length) {
    return {
      successCount: 0,
      failureCount: 0,
      skipped: true,
      errors: [],
    };
  }

  if (!firebaseAdmin) {
    console.warn('Firebase Admin SDK not initialized. Skipping push notification send.');
    return {
      successCount: 0,
      failureCount: tokenList.length,
      skipped: true,
      errors: tokenList.map((token) => ({ token, message: 'Firebase not configured' })),
    };
  }

  const errors = [];
  let successCount = 0;
  let failureCount = 0;

  const payload = {
    notification,
    data: normalizeData(data),
  };

  const batches = chunk(tokenList, MAX_FCM_BATCH);

  // eslint-disable-next-line no-restricted-syntax
  for (const batch of batches) {
    // eslint-disable-next-line no-await-in-loop
    const response = await firebaseAdmin.messaging().sendMulticast({
      ...payload,
      tokens: batch,
    });

    successCount += response.successCount;
    failureCount += response.failureCount;

    response.responses.forEach((item, index) => {
      if (!item.success) {
        const error = item.error || {};
        errors.push({
          token: batch[index],
          message: error.message || 'Unknown FCM error',
          code: error.code,
        });

        if (
          error.code === 'messaging/registration-token-not-registered' ||
          error.code === 'messaging/invalid-registration-token'
        ) {
          DeviceToken.updateOne({ token: batch[index] }, { isActive: false }).exec().catch((updateError) => {
            console.error('Failed to deactivate invalid device token', updateError);
          });
        }
      }
    });
  }

  return {
    successCount,
    failureCount,
    skipped: false,
    errors,
  };
};

const registerDeviceToken = async ({ userId, userModel, role, token, platform, deviceType, metadata }) => {
  if (!token || !userId || !userModel || !role) {
    return null;
  }

  const payload = {
    user: userId,
    userModel,
    role,
    token,
    platform,
    deviceType,
    metadata,
    isActive: true,
    lastUsedAt: new Date(),
  };

  return DeviceToken.findOneAndUpdate({ token }, payload, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });
};

const unregisterDeviceToken = async (token) => {
  if (!token) {
    return null;
  }
  return DeviceToken.deleteOne({ token });
};

const getActiveTokensForUser = async (userId) => {
  const records = await DeviceToken.find({ user: userId, isActive: true }).lean();
  return records.map((record) => record.token);
};

const getActiveTokensForUsers = async (userIds = []) => {
  const records = await DeviceToken.find({
    user: { $in: userIds },
    isActive: true,
  })
    .lean()
    .exec();

  const tokenMap = new Map();

  records.forEach((record) => {
    const key = record.user.toString();
    tokenMap.set(key, [...(tokenMap.get(key) || []), record.token]);
  });

  return tokenMap;
};

module.exports = {
  sendToTokens,
  registerDeviceToken,
  unregisterDeviceToken,
  getActiveTokensForUser,
  getActiveTokensForUsers,
};


