const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');
const {
  sendEmail,
  sendRoleApprovalEmail,
  sendSignupAcknowledgementEmail,
  sendPasswordResetOtpEmail,
  sendAppointmentReminderEmail,
  sendPrescriptionEmail,
} = require('./emailService');
const AdminSettings = require('../models/AdminSettings');

/**
 * Create and send notification
 * @param {Object} params - Notification parameters
 * @param {String} params.userId - User ID
 * @param {String} params.userType - User type (patient, doctor, pharmacy, laboratory, admin)
 * @param {String} params.type - Notification type
 * @param {String} params.title - Notification title
 * @param {String} params.message - Notification message
 * @param {Object} params.data - Additional data
 * @param {String} params.priority - Priority level (low, medium, high, urgent)
 * @param {String} params.actionUrl - URL to navigate on click
 * @param {String} params.icon - Icon name
 * @param {Boolean} params.emitSocket - Whether to emit Socket.IO event (default: true)
 */
const createNotification = async ({
  userId,
  userType,
  type,
  title,
  message,
  data = {},
  priority = 'medium',
  actionUrl = null,
  icon = null,
  emitSocket = true,
}) => {
  try {
    // Create notification in database
    const notification = await Notification.create({
      userId,
      userType,
      type,
      title,
      message,
      data,
      priority,
      actionUrl,
      icon,
    });

    // Emit Socket.IO event if enabled
    if (emitSocket) {
      try {
        const io = getIO();
        io.to(`${userType}-${userId}`).emit('notification:new', {
          notification: notification.toObject(),
        });
      } catch (error) {
        console.error('Socket.IO error in createNotification:', error);
      }
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create notification for appointment events
 */
const createAppointmentNotification = async ({ userId, userType, appointment, eventType, doctor, patient }) => {
  let title, message, actionUrl;

  switch (eventType) {
    case 'created':
      title = 'New Appointment';
      message = patient
        ? `Appointment booked with ${patient.firstName} ${patient.lastName || ''}`
        : 'New appointment has been booked';
      actionUrl = userType === 'patient' ? '/patient/appointments' : '/doctor/patients';
      break;
    case 'cancelled':
      title = 'Appointment Cancelled';
      message = doctor
        ? `Your appointment with Dr. ${doctor.firstName} ${doctor.lastName || ''} has been cancelled`
        : 'Appointment has been cancelled';
      actionUrl = '/patient/appointments';
      break;
    case 'rescheduled':
      title = 'Appointment Rescheduled';
      message = doctor
        ? `Your appointment with Dr. ${doctor.firstName} ${doctor.lastName || ''} has been rescheduled`
        : 'Appointment has been rescheduled';
      actionUrl = '/patient/appointments';
      break;
    case 'payment_confirmed':
      title = 'Payment Confirmed';
      message = `Payment of ₹${appointment.fee || 0} confirmed for your appointment`;
      actionUrl = '/patient/appointments';
      break;
    case 'token_called':
      title = 'Your Turn';
      message = `Token ${appointment.tokenNumber} has been called. Please proceed to consultation room.`;
      actionUrl = '/patient/appointments';
      break;
    case 'token_recalled':
      title = 'Token Recalled';
      message = `Your token ${appointment.tokenNumber} has been recalled. Please wait for your turn.`;
      actionUrl = '/patient/appointments';
      break;
    default:
      title = 'Appointment Update';
      message = 'Your appointment has been updated';
      actionUrl = '/patient/appointments';
  }

  return createNotification({
    userId,
    userType,
    type: 'appointment',
    title,
    message,
    data: {
      appointmentId: appointment._id || appointment.id,
      eventType,
      tokenNumber: appointment.tokenNumber,
    },
    priority: eventType === 'token_called' ? 'urgent' : 'medium',
    actionUrl,
    icon: 'appointment',
  });
};

/**
 * Create notification for prescription events
 */
const createPrescriptionNotification = async ({ userId, userType, prescription, doctor, patient }) => {
  const title = 'New Prescription';
  const message = doctor
    ? `Prescription received from Dr. ${doctor.firstName} ${doctor.lastName || ''}`
    : `Prescription created for ${patient.firstName} ${patient.lastName || ''}`;
  
  return createNotification({
    userId,
    userType,
    type: 'prescription',
    title,
    message,
    data: {
      prescriptionId: prescription._id || prescription.id,
      consultationId: prescription.consultationId,
    },
    priority: 'high',
    actionUrl: userType === 'patient' ? '/patient/prescriptions' : '/doctor/consultations',
    icon: 'prescription',
  });
};

/**
 * Create notification for wallet events
 */
const createWalletNotification = async ({ userId, userType, amount, eventType, withdrawal = null }) => {
  let title, message, priority, actionUrl;

  switch (eventType) {
    case 'credited':
      title = 'Wallet Credited';
      message = `₹${amount} has been credited to your wallet`;
      priority = 'high';
      actionUrl = '/doctor/wallet';
      break;
    case 'withdrawal_requested':
      title = 'Withdrawal Requested';
      message = `Withdrawal request of ₹${amount} has been submitted`;
      priority = 'medium';
      actionUrl = '/doctor/wallet';
      break;
    case 'withdrawal_approved':
      title = 'Withdrawal Approved';
      message = `Your withdrawal request of ₹${amount} has been approved`;
      priority = 'high';
      actionUrl = '/doctor/wallet';
      break;
    case 'withdrawal_rejected':
      title = 'Withdrawal Rejected';
      message = `Your withdrawal request of ₹${amount} has been rejected`;
      priority = 'high';
      actionUrl = '/doctor/wallet';
      break;
    default:
      title = 'Wallet Update';
      message = 'Your wallet has been updated';
      priority = 'medium';
      actionUrl = '/doctor/wallet';
  }

  return createNotification({
    userId,
    userType,
    type: 'wallet',
    title,
    message,
    data: {
      amount,
      eventType,
      withdrawalId: withdrawal?._id || withdrawal?.id,
    },
    priority,
    actionUrl,
    icon: 'wallet',
  });
};

/**
 * Create notification for order events
 */
const createOrderNotification = async ({ userId, userType, order, eventType, pharmacy, laboratory, patient }) => {
  let title, message, actionUrl;

  switch (eventType) {
    case 'created':
      title = 'New Order';
      message = patient
        ? `New order from ${patient.firstName} ${patient.lastName || ''}`
        : 'Your order has been placed';
      actionUrl = userType === 'patient' ? '/patient/orders' : userType === 'pharmacy' ? '/pharmacy/orders' : '/laboratory/orders';
      break;
    case 'confirmed':
      title = 'Order Confirmed';
      message = pharmacy
        ? `Your order has been confirmed by ${pharmacy.pharmacyName || 'Pharmacy'}`
        : laboratory
        ? `Your order has been confirmed by ${laboratory.labName || 'Laboratory'}`
        : 'Order has been confirmed';
      actionUrl = '/patient/orders';
      break;
    case 'completed':
      title = 'Order Completed';
      message = pharmacy
        ? `Your order has been completed by ${pharmacy.pharmacyName || 'Pharmacy'}`
        : laboratory
        ? `Your test report is ready from ${laboratory.labName || 'Laboratory'}`
        : 'Order has been completed';
      actionUrl = '/patient/orders';
      break;
    case 'cancelled':
      title = 'Order Cancelled';
      message = 'Your order has been cancelled';
      actionUrl = '/patient/orders';
      break;
    default:
      title = 'Order Update';
      message = 'Your order has been updated';
      actionUrl = '/patient/orders';
  }

  return createNotification({
    userId,
    userType,
    type: 'order',
    title,
    message,
    data: {
      orderId: order._id || order.id,
      eventType,
    },
    priority: eventType === 'completed' ? 'high' : 'medium',
    actionUrl,
    icon: 'order',
  });
};

/**
 * Create notification for request events
 */
const createRequestNotification = async ({ userId, userType, request, eventType, admin, pharmacy, laboratory }) => {
  let title, message, actionUrl;

  switch (eventType) {
    case 'created':
      title = 'New Request';
      message = 'New request has been submitted';
      actionUrl = userType === 'patient' ? '/patient/requests' : '/admin/requests';
      break;
    case 'responded':
      title = 'Request Response';
      message = admin
        ? 'Admin has responded to your request'
        : 'Request has been responded';
      actionUrl = '/patient/requests';
      break;
    case 'assigned':
      title = 'Request Assigned';
      message = pharmacy
        ? `Request assigned to ${pharmacy.pharmacyName || 'Pharmacy'}`
        : laboratory
        ? `Request assigned to ${laboratory.labName || 'Laboratory'}`
        : 'Request has been assigned';
      actionUrl = userType === 'pharmacy' ? '/pharmacy/orders' : '/laboratory/orders';
      break;
    case 'confirmed':
      title = 'Request Confirmed';
      message = 'Your request has been confirmed';
      actionUrl = '/patient/requests';
      break;
    default:
      title = 'Request Update';
      message = 'Your request has been updated';
      actionUrl = '/patient/requests';
  }

  return createNotification({
    userId,
    userType,
    type: 'request',
    title,
    message,
    data: {
      requestId: request._id || request.id,
      eventType,
    },
    priority: 'medium',
    actionUrl,
    icon: 'request',
  });
};

/**
 * Create notification for report events
 */
const createReportNotification = async ({ userId, userType, report, laboratory, patient }) => {
  const title = 'Test Report Ready';
  const message = laboratory
    ? `Test report is ready from ${laboratory.labName || 'Laboratory'}`
    : `Test report created for ${patient.firstName} ${patient.lastName || ''}`;
  
  return createNotification({
    userId,
    userType,
    type: 'report',
    title,
    message,
    data: {
      reportId: report._id || report.id,
      orderId: report.orderId,
    },
    priority: 'high',
    actionUrl: userType === 'patient' ? '/patient/reports' : '/laboratory/patients',
    icon: 'report',
  });
};

/**
 * Create notification for admin events
 */
const createAdminNotification = async ({ userId, userType, eventType, data }) => {
  let title, message, actionUrl, priority = 'medium';

  switch (eventType) {
    case 'payment_received':
      title = 'Payment Received';
      message = `Payment of ₹${data.amount || 0} received from patient`;
      actionUrl = '/admin/wallet';
      priority = 'high';
      break;
    case 'withdrawal_requested':
      title = 'Withdrawal Request';
      message = `New withdrawal request of ₹${data.amount || 0} from ${data.userType || 'provider'}`;
      actionUrl = '/admin/wallet';
      priority = 'high';
      break;
    case 'request_created':
      title = 'New Request';
      message = 'New patient request has been submitted';
      actionUrl = '/admin/requests';
      break;
    case 'request_confirmed':
      title = 'Request Confirmed';
      message = 'Patient request has been confirmed';
      actionUrl = '/admin/requests';
      break;
    default:
      title = 'System Update';
      message = 'System update received';
      actionUrl = '/admin/dashboard';
  }

  return createNotification({
    userId,
    userType,
    type: eventType === 'payment_received' || eventType === 'withdrawal_requested' ? 'wallet' : 'request',
    title,
    message,
    data,
    priority,
    actionUrl,
    icon: 'system',
  });
};

/**
 * Create notification for session/queue events
 */
const createSessionNotification = async ({ userId, userType, session, eventType }) => {
  let title, message, actionUrl;

  switch (eventType) {
    case 'started':
      title = 'Session Started';
      message = 'Your session has started';
      actionUrl = '/doctor/patients';
      break;
    case 'paused':
      title = 'Session Paused';
      message = 'Your session has been paused';
      actionUrl = '/doctor/patients';
      break;
    case 'resumed':
      title = 'Session Resumed';
      message = 'Your session has been resumed';
      actionUrl = '/doctor/patients';
      break;
    case 'cancelled':
      title = 'Session Cancelled';
      message = 'Your session has been cancelled';
      actionUrl = '/doctor/patients';
      break;
    case 'queue_updated':
      title = 'Queue Updated';
      message = 'Patient queue has been updated';
      actionUrl = '/doctor/patients';
      break;
    default:
      title = 'Session Update';
      message = 'Your session has been updated';
      actionUrl = '/doctor/patients';
  }

  return createNotification({
    userId,
    userType,
    type: 'session',
    title,
    message,
    data: {
      sessionId: session._id || session.id,
      eventType,
    },
    priority: 'medium',
    actionUrl,
    icon: 'session',
  });
};

/**
 * Check if email notifications are enabled globally
 */
const isEmailNotificationsEnabled = async () => {
  try {
    const settings = await AdminSettings.findOne();
    return settings?.emailNotifications !== false; // Default to true if not set
  } catch (error) {
    console.error('Error checking email notification settings:', error);
    return true; // Default to enabled on error
  }
};

/**
 * Send appointment confirmation email to patient
 */
const sendAppointmentConfirmationEmail = async ({ patient, doctor, appointment }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!patient?.email) return null;

  const appointmentDate = appointment.appointmentDate
    ? new Date(appointment.appointmentDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';
  const appointmentTime = appointment.time || '';

  const patientName = patient.firstName
    ? `${patient.firstName} ${patient.lastName || ''}`.trim()
    : 'Patient';
  const doctorName = doctor.firstName
    ? `Dr. ${doctor.firstName} ${doctor.lastName || ''}`.trim()
    : 'Doctor';

  return sendEmail({
    to: patient.email,
    subject: `Appointment Confirmed - ${doctorName} | Healiinn`,
    text: `Hello ${patientName},\n\nYour appointment has been confirmed:\n\nDoctor: ${doctorName}\nDate: ${appointmentDate}\nTime: ${appointmentTime}\nToken Number: ${appointment.tokenNumber || 'N/A'}\n\nThank you,\nTeam Healiinn`,
    html: `<p>Hello ${patientName},</p><p>Your appointment has been confirmed:</p><ul><li><strong>Doctor:</strong> ${doctorName}</li><li><strong>Date:</strong> ${appointmentDate}</li><li><strong>Time:</strong> ${appointmentTime}</li><li><strong>Token Number:</strong> ${appointment.tokenNumber || 'N/A'}</li></ul><p>Thank you,<br/>Team Healiinn</p>`,
  });
};

/**
 * Send appointment notification to doctor
 */
const sendDoctorAppointmentNotification = async ({ doctor, patient, appointment }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!doctor?.email) return null;

  const patientName = patient.firstName
    ? `${patient.firstName} ${patient.lastName || ''}`.trim()
    : 'Patient';
  const appointmentDate = appointment.appointmentDate
    ? new Date(appointment.appointmentDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return sendEmail({
    to: doctor.email,
    subject: `New Appointment - ${patientName} | Healiinn`,
    text: `Hello Dr. ${doctor.firstName || 'Doctor'},\n\nYou have a new appointment:\n\nPatient: ${patientName}\nDate: ${appointmentDate}\nToken Number: ${appointment.tokenNumber || 'N/A'}\n\nThank you,\nTeam Healiinn`,
    html: `<p>Hello Dr. ${doctor.firstName || 'Doctor'},</p><p>You have a new appointment:</p><ul><li><strong>Patient:</strong> ${patientName}</li><li><strong>Date:</strong> ${appointmentDate}</li><li><strong>Token Number:</strong> ${appointment.tokenNumber || 'N/A'}</li></ul><p>Thank you,<br/>Team Healiinn</p>`,
  });
};

/**
 * Send appointment cancellation email
 */
const sendAppointmentCancellationEmail = async ({ patient, doctor, appointment }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!patient?.email) return null;

  const patientName = patient.firstName
    ? `${patient.firstName} ${patient.lastName || ''}`.trim()
    : 'Patient';
  const doctorName = doctor.firstName
    ? `Dr. ${doctor.firstName} ${doctor.lastName || ''}`.trim()
    : 'Doctor';

  return sendEmail({
    to: patient.email,
    subject: `Appointment Cancelled - ${doctorName} | Healiinn`,
    text: `Hello ${patientName},\n\nYour appointment with ${doctorName} has been cancelled. You can reschedule your appointment from the app.\n\nThank you,\nTeam Healiinn`,
    html: `<p>Hello ${patientName},</p><p>Your appointment with <strong>${doctorName}</strong> has been cancelled. You can reschedule your appointment from the app.</p><p>Thank you,<br/>Team Healiinn</p>`,
  });
};

/**
 * Send lab report ready email
 */
const sendLabReportReadyEmail = async ({ patient, laboratory, report, order }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!patient?.email) return null;

  const patientName = patient.firstName
    ? `${patient.firstName} ${patient.lastName || ''}`.trim()
    : 'Patient';
  const labName = laboratory?.labName || 'Laboratory';

  return sendEmail({
    to: patient.email,
    subject: `Test Report Ready - ${labName} | Healiinn`,
    text: `Hello ${patientName},\n\nYour test report is ready from ${labName}. You can view and download it from the app.\n\nThank you,\nTeam Healiinn`,
    html: `<p>Hello ${patientName},</p><p>Your test report is ready from <strong>${labName}</strong>. You can view and download it from the app.</p><p>Thank you,<br/>Team Healiinn</p>`,
  });
};

/**
 * Send order status update email
 */
const sendOrderStatusUpdateEmail = async ({ patient, pharmacy, laboratory, order, status }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!patient?.email) return null;

  const patientName = patient.firstName
    ? `${patient.firstName} ${patient.lastName || ''}`.trim()
    : 'Patient';
  const providerName = pharmacy?.pharmacyName || laboratory?.labName || 'Provider';

  const statusMessages = {
    confirmed: 'has been confirmed',
    processing: 'is being processed',
    ready: 'is ready for pickup/delivery',
    completed: 'has been completed',
    cancelled: 'has been cancelled',
  };

  const message = statusMessages[status] || 'has been updated';

  return sendEmail({
    to: patient.email,
    subject: `Order Update - ${providerName} | Healiinn`,
    text: `Hello ${patientName},\n\nYour order ${message} by ${providerName}.\n\nOrder ID: ${order._id || order.id}\nStatus: ${status}\n\nThank you,\nTeam Healiinn`,
    html: `<p>Hello ${patientName},</p><p>Your order ${message} by <strong>${providerName}</strong>.</p><ul><li><strong>Order ID:</strong> ${order._id || order.id}</li><li><strong>Status:</strong> ${status}</li></ul><p>Thank you,<br/>Team Healiinn</p>`,
  });
};

/**
 * Send payment confirmation email
 * Accepts either:
 * - { patient, amount, orderId, appointmentId } (direct values)
 * - { patient, transaction, order } (objects to extract from)
 */
const sendPaymentConfirmationEmail = async ({ patient, amount, orderId, appointmentId, transaction, order }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!patient?.email) return null;

  // Extract values from transaction/order objects if provided
  let paymentAmount = amount;
  let referenceId = orderId || appointmentId || 'N/A';
  
  if (transaction) {
    // Extract amount from transaction
    if (!paymentAmount && transaction.amount) {
      paymentAmount = transaction.amount;
    }
    // Extract reference ID from transaction
    if (transaction.referenceId) {
      referenceId = transaction.referenceId;
    } else if (transaction._id) {
      referenceId = transaction._id.toString();
    } else if (transaction.id) {
      referenceId = transaction.id.toString();
    }
    // Extract appointmentId from transaction if available
    if (!appointmentId && transaction.appointmentId) {
      appointmentId = transaction.appointmentId;
      if (typeof appointmentId === 'object' && appointmentId._id) {
        referenceId = appointmentId._id.toString();
      } else if (typeof appointmentId === 'string') {
        referenceId = appointmentId;
      }
    }
  }
  
  if (order) {
    // Extract order ID from order object
    if (order._id) {
      referenceId = order._id.toString();
    } else if (order.id) {
      referenceId = order.id.toString();
    }
  }
  
  // Fallback: if still no amount, try to get from transaction metadata
  if (!paymentAmount && transaction?.metadata?.totalAmount) {
    paymentAmount = transaction.metadata.totalAmount;
  }
  
  // Ensure amount is a number and format it
  if (paymentAmount === undefined || paymentAmount === null) {
    console.error('Payment amount is undefined in sendPaymentConfirmationEmail:', {
      amount,
      transaction: transaction ? {
        amount: transaction.amount,
        metadata: transaction.metadata,
      } : null,
    });
    paymentAmount = 0; // Fallback to 0 if still undefined
  }
  
  // Format reference ID
  if (referenceId === 'N/A' && appointmentId) {
    if (typeof appointmentId === 'object' && appointmentId._id) {
      referenceId = appointmentId._id.toString();
    } else if (typeof appointmentId === 'string') {
      referenceId = appointmentId;
    }
  }

  const patientName = patient.firstName
    ? `${patient.firstName} ${patient.lastName || ''}`.trim()
    : 'Patient';

  return sendEmail({
    to: patient.email,
    subject: `Payment Confirmed - ₹${paymentAmount} | Healiinn`,
    text: `Hello ${patientName},\n\nYour payment of ₹${paymentAmount} has been confirmed.\n\nReference ID: ${referenceId}\n\nThank you,\nTeam Healiinn`,
    html: `<p>Hello ${patientName},</p><p>Your payment of <strong>₹${paymentAmount}</strong> has been confirmed.</p><p><strong>Reference ID:</strong> ${referenceId}</p><p>Thank you,<br/>Team Healiinn</p>`,
  });
};

module.exports = {
  createNotification,
  createAppointmentNotification,
  createPrescriptionNotification,
  createWalletNotification,
  createOrderNotification,
  createRequestNotification,
  createReportNotification,
  createAdminNotification,
  createSessionNotification,
  // Email notification functions
  sendAppointmentConfirmationEmail,
  sendDoctorAppointmentNotification,
  sendAppointmentCancellationEmail,
  sendLabReportReadyEmail,
  sendOrderStatusUpdateEmail,
  sendPaymentConfirmationEmail,
  // Re-export email service functions
  sendEmail,
  sendRoleApprovalEmail,
  sendSignupAcknowledgementEmail,
  sendPasswordResetOtpEmail,
  sendAppointmentReminderEmail,
  sendPrescriptionEmail,
};
