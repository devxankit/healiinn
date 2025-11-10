const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { getTemplate } = require('./notificationTemplates');
const {
  sendToTokens,
  getActiveTokensForUser,
} = require('./pushNotificationService');
const { ROLES } = require('../utils/constants');

const ROLE_TO_MODEL = {
  [ROLES.PATIENT]: 'Patient',
  [ROLES.DOCTOR]: 'Doctor',
  [ROLES.LABORATORY]: 'Laboratory',
  [ROLES.PHARMACY]: 'Pharmacy',
  [ROLES.ADMIN]: 'Admin',
};

const publishNotification = async ({ type, recipients = [], context = {}, data = {} }) => {
  const template = getTemplate(type);

  if (!template) {
    throw new Error(`Notification template not defined for type ${type}`);
  }

  const message = template(context);
  const results = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const recipient of recipients) {
    const { role, userId } = recipient;
    const model = ROLE_TO_MODEL[role];

    if (!model) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const objectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

    const notification = await Notification.create({
      userId: objectId,
      title: message.title,
      message: message.body,
      type,
      channels: ['in_app', 'push'],
      data: {
        ...message.data,
        ...data,
      },
      recipients: [
        {
          user: objectId,
          role,
          deliveryStatus: {
            channel: 'push',
            status: 'pending',
          },
        },
      ],
    });

    // eslint-disable-next-line no-await-in-loop
    const tokens = await getActiveTokensForUser(objectId);

    if (!tokens.length) {
      await Notification.updateOne(
        { _id: notification._id },
        {
          $set: {
            'recipients.0.deliveryStatus': {
              channel: 'push',
              status: 'skipped',
              error: 'No active device tokens',
            },
          },
        }
      );
      results.push({
        role,
        userId: objectId.toString(),
        status: 'skipped',
        reason: 'no_tokens',
      });
      // eslint-disable-next-line no-continue
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const sendResult = await sendToTokens(
      {
        notification: {
          title: message.title,
          body: message.body,
        },
        data: {
          ...message.data,
          ...data,
          notificationId: notification._id.toString(),
          role,
        },
      },
      tokens
    );

    const status = sendResult.skipped
      ? 'skipped'
      : sendResult.successCount > 0 && sendResult.failureCount === 0
      ? 'sent'
      : sendResult.successCount > 0
      ? 'partial'
      : 'failed';

    await Notification.updateOne(
      { _id: notification._id },
      {
        $set: {
          'recipients.0.deliveryStatus': {
            channel: 'push',
            status,
            error: sendResult.errors?.[0]?.message,
          },
        },
      }
    );

    results.push({
      role,
      userId: objectId.toString(),
      status,
      sendResult,
    });
  }

  return results;
};

module.exports = {
  publishNotification,
};


