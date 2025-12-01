const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');
const { ROLES } = require('../utils/constants');

/**
 * Create in-app notification
 * @param {Object} options - Notification options
 * @param {String} options.userId - User ID
 * @param {String} options.userType - User type (patient, doctor, pharmacy, laboratory, admin)
 * @param {String} options.type - Notification type
 * @param {String} options.title - Notification title
 * @param {String} options.message - Notification message
 * @param {Object} options.data - Additional data
 * @param {String} options.actionUrl - URL for action
 * @param {String} options.priority - Priority level
 * @param {String} options.icon - Icon name
 * @returns {Promise<Object>} Created notification
 */
const createNotification = async ({
  userId,
  userType,
  type,
  title,
  message,
  data = {},
  actionUrl = null,
  priority = 'medium',
  icon = null,
}) => {
  if (!userId || !userType || !type || !title || !message) {
    throw new Error('Missing required notification fields');
  }

  try {
    // Create notification in database
    const notification = await Notification.create({
      userId,
      userType,
      type,
      title,
      message,
      data,
      actionUrl,
      priority,
      icon: icon || getIconForType(type),
    });

    // Emit real-time notification via Socket.IO
    try {
      const io = getIO();
      const room = `${userType}-${userId}`;
      io.to(room).emit('notification:new', {
        notification: {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          actionUrl: notification.actionUrl,
          priority: notification.priority,
          icon: notification.icon,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
        },
      });
    } catch (error) {
      console.error('Error emitting notification via Socket.IO:', error);
      // Continue even if Socket.IO fails
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Get icon for notification type
 */
const getIconForType = (type) => {
  const iconMap = {
    appointment: 'calendar',
    consultation: 'stethoscope',
    prescription: 'file-text',
    order: 'shopping-cart',
    report: 'file',
    request: 'inbox',
    payment: 'credit-card',
    review: 'star',
    support: 'help-circle',
    system: 'bell',
    wallet: 'wallet',
    withdrawal: 'dollar-sign',
    approval: 'check-circle',
    rejection: 'x-circle',
  };
  return iconMap[type] || 'bell';
};

/**
 * Create appointment notification
 */
const createAppointmentNotification = async ({ userId, userType, appointment, action = 'created' }) => {
  const actions = {
    created: {
      title: 'New Appointment',
      message: `Your appointment has been ${action === 'created' ? 'booked' : action} successfully.`,
    },
    cancelled: {
      title: 'Appointment Cancelled',
      message: 'Your appointment has been cancelled.',
    },
    rescheduled: {
      title: 'Appointment Rescheduled',
      message: 'Your appointment has been rescheduled.',
    },
    confirmed: {
      title: 'Appointment Confirmed',
      message: 'Your appointment has been confirmed.',
    },
  };

  const actionData = actions[action] || actions.created;

  return createNotification({
    userId,
    userType,
    type: 'appointment',
    title: actionData.title,
    message: actionData.message,
    data: {
      appointmentId: appointment._id || appointment,
      action,
    },
    actionUrl: `/appointments/${appointment._id || appointment}`,
    priority: action === 'cancelled' ? 'high' : 'medium',
  });
};

/**
 * Create prescription notification
 */
const createPrescriptionNotification = async ({ userId, userType, prescription }) => {
  return createNotification({
    userId,
    userType,
    type: 'prescription',
    title: 'New Prescription',
    message: 'A new prescription has been created for you.',
    data: {
      prescriptionId: prescription._id || prescription,
    },
    actionUrl: `/prescriptions/${prescription._id || prescription}`,
    priority: 'high',
  });
};

/**
 * Create order notification
 */
const createOrderNotification = async ({ userId, userType, order, status }) => {
  const statusMessages = {
    placed: 'Your order has been placed successfully.',
    accepted: 'Your order has been accepted.',
    processing: 'Your order is being processed.',
    ready: 'Your order is ready for pickup/delivery.',
    delivered: 'Your order has been delivered.',
    cancelled: 'Your order has been cancelled.',
  };

  return createNotification({
    userId,
    userType,
    type: 'order',
    title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: statusMessages[status] || 'Your order status has been updated.',
    data: {
      orderId: order._id || order,
      status,
    },
    actionUrl: `/orders/${order._id || order}`,
    priority: status === 'cancelled' ? 'high' : 'medium',
  });
};

/**
 * Create report notification
 */
const createReportNotification = async ({ userId, userType, report }) => {
  return createNotification({
    userId,
    userType,
    type: 'report',
    title: 'Lab Report Ready',
    message: 'Your lab report is ready for download.',
    data: {
      reportId: report._id || report,
    },
    actionUrl: `/reports/${report._id || report}`,
    priority: 'high',
  });
};

/**
 * Create request notification
 */
const createRequestNotification = async ({ userId, userType, request, action = 'created' }) => {
  const actions = {
    created: {
      title: 'Request Created',
      message: 'Your request has been created and sent to admin.',
    },
    responded: {
      title: 'Request Responded',
      message: 'Admin has responded to your request.',
    },
    accepted: {
      title: 'Request Accepted',
      message: 'Your request has been accepted.',
    },
    cancelled: {
      title: 'Request Cancelled',
      message: 'Your request has been cancelled.',
    },
  };

  const actionData = actions[action] || actions.created;

  return createNotification({
    userId,
    userType,
    type: 'request',
    title: actionData.title,
    message: actionData.message,
    data: {
      requestId: request._id || request,
      action,
    },
    actionUrl: `/requests/${request._id || request}`,
    priority: 'medium',
  });
};

/**
 * Create payment notification
 */
const createPaymentNotification = async ({ userId, userType, transaction, status }) => {
  return createNotification({
    userId,
    userType,
    type: 'payment',
    title: `Payment ${status === 'success' ? 'Successful' : 'Failed'}`,
    message: `Your payment of ₹${transaction.amount || 0} has been ${status === 'success' ? 'processed successfully' : 'failed'}.`,
    data: {
      transactionId: transaction._id || transaction,
      status,
    },
    actionUrl: `/transactions/${transaction._id || transaction}`,
    priority: status === 'success' ? 'medium' : 'high',
  });
};

/**
 * Create wallet notification
 */
const createWalletNotification = async ({ userId, userType, transaction, action = 'credit' }) => {
  const actions = {
    credit: {
      title: 'Wallet Credited',
      message: `₹${transaction.amount || 0} has been credited to your wallet.`,
    },
    debit: {
      title: 'Wallet Debited',
      message: `₹${transaction.amount || 0} has been debited from your wallet.`,
    },
    withdrawal: {
      title: 'Withdrawal Request',
      message: 'Your withdrawal request has been submitted.',
    },
    withdrawal_approved: {
      title: 'Withdrawal Approved',
      message: 'Your withdrawal request has been approved.',
    },
    withdrawal_rejected: {
      title: 'Withdrawal Rejected',
      message: 'Your withdrawal request has been rejected.',
    },
  };

  const actionData = actions[action] || actions.credit;

  return createNotification({
    userId,
    userType,
    type: action === 'withdrawal' || action.startsWith('withdrawal_') ? 'withdrawal' : 'wallet',
    title: actionData.title,
    message: actionData.message,
    data: {
      transactionId: transaction._id || transaction,
      action,
    },
    actionUrl: `/wallet/transactions`,
    priority: 'medium',
  });
};

/**
 * Create approval/rejection notification
 */
const createApprovalNotification = async ({ userId, userType, status, reason = null }) => {
  return createNotification({
    userId,
    userType,
    type: status === 'approved' ? 'approval' : 'rejection',
    title: status === 'approved' ? 'Account Approved' : 'Account Rejected',
    message:
      status === 'approved'
        ? 'Your account has been approved. You can now login and start using the platform.'
        : `Your account has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
    data: {
      status,
      reason,
    },
    actionUrl: status === 'approved' ? '/dashboard' : '/profile',
    priority: 'high',
  });
};

/**
 * Create support ticket notification
 */
const createSupportNotification = async ({ userId, userType, ticket, action = 'created' }) => {
  const actions = {
    created: {
      title: 'Support Ticket Created',
      message: 'Your support ticket has been created successfully.',
    },
    responded: {
      title: 'Support Ticket Response',
      message: 'You have received a response to your support ticket.',
    },
    resolved: {
      title: 'Support Ticket Resolved',
      message: 'Your support ticket has been resolved.',
    },
  };

  const actionData = actions[action] || actions.created;

  return createNotification({
    userId,
    userType,
    type: 'support',
    title: actionData.title,
    message: actionData.message,
    data: {
      ticketId: ticket._id || ticket,
      action,
    },
    actionUrl: `/support/${ticket._id || ticket}`,
    priority: 'medium',
  });
};

/**
 * Create system notification
 */
const createSystemNotification = async ({ userId, userType, title, message, data = {} }) => {
  return createNotification({
    userId,
    userType,
    type: 'system',
    title,
    message,
    data,
    priority: 'low',
  });
};

module.exports = {
  createNotification,
  createAppointmentNotification,
  createPrescriptionNotification,
  createOrderNotification,
  createReportNotification,
  createRequestNotification,
  createPaymentNotification,
  createWalletNotification,
  createApprovalNotification,
  createSupportNotification,
  createSystemNotification,
};

