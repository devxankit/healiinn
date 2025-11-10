const Admin = require('../models/Admin');
const { sendAdminPendingApprovalEmail } = require('./emailService');
const { publishNotification } = require('./notificationPublisher');
const { ROLES } = require('../utils/constants');

const parseEmails = (value = '') =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item);

const unique = (arr) => [...new Set(arr)];

const notifyAdminsOfPendingSignup = async ({ role, entity }) => {
  const fallback = parseEmails(process.env.ADMIN_NOTIFICATION_EMAILS);

  let recipients = [];

  let admins = [];

  try {
    const adminRecords = await Admin.find({ isActive: true, email: { $exists: true, $ne: '' } }).select('email');
    recipients = adminRecords.map((admin) => admin.email);
  } catch (error) {
    console.error('Failed to fetch admin emails for notification', error);
  }

  try {
    admins = await Admin.find({ isActive: true }).select('email name');
  } catch (error) {
    console.error('Failed to fetch admin emails for notification', error);
  }

  recipients = unique([...recipients, ...fallback]);

  if (!recipients.length) {
    console.warn('No admin notification recipients configured. Skipping admin notification email.');
    return;
  }

  await Promise.all(
    recipients.map((email) =>
      sendAdminPendingApprovalEmail({
        email,
        role,
        entity,
      }).catch((error) => console.error(`Failed to send admin pending approval email to ${email}`, error))
    )
  );

  if (admins.length) {
    try {
      await publishNotification({
        type: 'ADMIN_KYC_SUBMITTED',
        recipients: admins.map((admin) => ({
          role: ROLES.ADMIN,
          userId: admin._id,
        })),
        context: {
          name:
            entity?.firstName && entity?.lastName
              ? `${entity.firstName} ${entity.lastName}`.trim()
              : entity?.labName || entity?.pharmacyName || entity?.name || 'A user',
          role,
        },
        data: {
          role,
          entityId: entity?._id ? String(entity._id) : undefined,
          email: entity?.email,
        },
      });
    } catch (error) {
      console.error('Failed to publish admin pending approval notification', error);
    }
  }
};

module.exports = {
  notifyAdminsOfPendingSignup,
};
