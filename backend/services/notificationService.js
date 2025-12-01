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
    text: `Hello ${patientName},

Your appointment has been confirmed:

Doctor: ${doctorName}
Date: ${appointmentDate}
Time: ${appointmentTime}
${appointment.tokenNumber ? `Token Number: ${appointment.tokenNumber}` : ''}
${appointment.reason ? `Reason: ${appointment.reason}` : ''}

Please arrive on time for your appointment. If you need to reschedule or cancel, please do so at least 24 hours in advance.

Thank you,
Team Healiinn`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #11496c;">Appointment Confirmed</h2>
        <p>Hello ${patientName},</p>
        <p>Your appointment has been confirmed:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Doctor:</strong> ${doctorName}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${appointmentDate}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${appointmentTime}</p>
          ${appointment.tokenNumber ? `<p style="margin: 5px 0;"><strong>Token Number:</strong> ${appointment.tokenNumber}</p>` : ''}
          ${appointment.reason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${appointment.reason}</p>` : ''}
        </div>
        <p>Please arrive on time for your appointment. If you need to reschedule or cancel, please do so at least 24 hours in advance.</p>
        <p>Thank you,<br/>Team Healiinn</p>
      </div>
    `,
  });
};

/**
 * Send appointment notification to doctor
 */
const sendDoctorAppointmentNotification = async ({ doctor, patient, appointment }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!doctor?.email) return null;

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
    to: doctor.email,
    subject: `New Appointment - ${patientName} | Healiinn`,
    text: `Hello ${doctorName},

You have a new appointment:

Patient: ${patientName}
${patient.phone ? `Phone: ${patient.phone}` : ''}
Date: ${appointmentDate}
Time: ${appointmentTime}
${appointment.tokenNumber ? `Token Number: ${appointment.tokenNumber}` : ''}
${appointment.reason ? `Reason: ${appointment.reason}` : ''}

Please review the appointment details in your dashboard.

Thank you,
Team Healiinn`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #11496c;">New Appointment</h2>
        <p>Hello ${doctorName},</p>
        <p>You have a new appointment:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Patient:</strong> ${patientName}</p>
          ${patient.phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${patient.phone}</p>` : ''}
          <p style="margin: 5px 0;"><strong>Date:</strong> ${appointmentDate}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${appointmentTime}</p>
          ${appointment.tokenNumber ? `<p style="margin: 5px 0;"><strong>Token Number:</strong> ${appointment.tokenNumber}</p>` : ''}
          ${appointment.reason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${appointment.reason}</p>` : ''}
        </div>
        <p>Please review the appointment details in your dashboard.</p>
        <p>Thank you,<br/>Team Healiinn</p>
      </div>
    `,
  });
};

/**
 * Send appointment cancellation email
 */
const sendAppointmentCancellationEmail = async ({ patient, doctor, appointment, cancelledBy }) => {
  if (!(await isEmailNotificationsEnabled())) return null;

  const appointmentDate = appointment.appointmentDate
    ? new Date(appointment.appointmentDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const patientName = patient?.firstName
    ? `${patient.firstName} ${patient.lastName || ''}`.trim()
    : 'Patient';
  const doctorName = doctor?.firstName
    ? `Dr. ${doctor.firstName} ${doctor.lastName || ''}`.trim()
    : 'Doctor';

  const emails = [];
  if (patient?.email && cancelledBy !== 'patient') {
    emails.push(
      sendEmail({
        to: patient.email,
        subject: `Appointment Cancelled - ${doctorName} | Healiinn`,
        text: `Hello ${patientName},

Your appointment with ${doctorName} scheduled for ${appointmentDate} has been cancelled${cancelledBy === 'doctor' ? ' by the doctor' : ''}.

If you have any questions or would like to reschedule, please contact us.

Thank you,
Team Healiinn`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #11496c;">Appointment Cancelled</h2>
            <p>Hello ${patientName},</p>
            <p>Your appointment with <strong>${doctorName}</strong> scheduled for <strong>${appointmentDate}</strong> has been cancelled${cancelledBy === 'doctor' ? ' by the doctor' : ''}.</p>
            <p>If you have any questions or would like to reschedule, please contact us.</p>
            <p>Thank you,<br/>Team Healiinn</p>
          </div>
        `,
      })
    );
  }

  if (doctor?.email && cancelledBy !== 'doctor') {
    emails.push(
      sendEmail({
        to: doctor.email,
        subject: `Appointment Cancelled - ${patientName} | Healiinn`,
        text: `Hello ${doctorName},

The appointment with ${patientName} scheduled for ${appointmentDate} has been cancelled${cancelledBy === 'patient' ? ' by the patient' : ''}.

Thank you,
Team Healiinn`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #11496c;">Appointment Cancelled</h2>
            <p>Hello ${doctorName},</p>
            <p>The appointment with <strong>${patientName}</strong> scheduled for <strong>${appointmentDate}</strong> has been cancelled${cancelledBy === 'patient' ? ' by the patient' : ''}.</p>
            <p>Thank you,<br/>Team Healiinn</p>
          </div>
        `,
      })
    );
  }

  return Promise.all(emails);
};

/**
 * Send order confirmation email
 */
const sendOrderConfirmationEmail = async ({ patient, order, provider, providerType }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!patient?.email) return null;

  const patientName = patient.firstName
    ? `${patient.firstName} ${patient.lastName || ''}`.trim()
    : 'Patient';
  const providerName =
    providerType === 'pharmacy'
      ? provider?.pharmacyName || 'Pharmacy'
      : provider?.labName || 'Laboratory';

  return sendEmail({
    to: patient.email,
    subject: `Order Confirmed - ${providerName} | Healiinn`,
    text: `Hello ${patientName},

Your order has been confirmed:

Order ID: ${order._id || order.id}
${providerType === 'pharmacy' ? 'Pharmacy' : 'Laboratory'}: ${providerName}
Total Amount: ₹${order.totalAmount || 0}
Status: ${order.status || 'confirmed'}
${order.deliveryOption ? `Delivery Option: ${order.deliveryOption}` : ''}

You will receive updates about your order status via email.

Thank you,
Team Healiinn`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #11496c;">Order Confirmed</h2>
        <p>Hello ${patientName},</p>
        <p>Your order has been confirmed:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order._id || order.id}</p>
          <p style="margin: 5px 0;"><strong>${providerType === 'pharmacy' ? 'Pharmacy' : 'Laboratory'}:</strong> ${providerName}</p>
          <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${order.totalAmount || 0}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> ${order.status || 'confirmed'}</p>
          ${order.deliveryOption ? `<p style="margin: 5px 0;"><strong>Delivery Option:</strong> ${order.deliveryOption}</p>` : ''}
        </div>
        <p>You will receive updates about your order status via email.</p>
        <p>Thank you,<br/>Team Healiinn</p>
      </div>
    `,
  });
};

/**
 * Send order status update email
 */
const sendOrderStatusUpdateEmail = async ({ patient, order, provider, providerType, newStatus }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!patient?.email) return null;

  const patientName = patient.firstName
    ? `${patient.firstName} ${patient.lastName || ''}`.trim()
    : 'Patient';
  const providerName =
    providerType === 'pharmacy'
      ? provider?.pharmacyName || 'Pharmacy'
      : provider?.labName || 'Laboratory';

  const statusMessages = {
    accepted: 'Your order has been accepted and is being processed.',
    processing: 'Your order is being processed.',
    ready: 'Your order is ready for pickup/delivery.',
    delivered: 'Your order has been delivered.',
    cancelled: 'Your order has been cancelled.',
  };

  return sendEmail({
    to: patient.email,
    subject: `Order Update - ${providerName} | Healiinn`,
    text: `Hello ${patientName},

Your order status has been updated:

Order ID: ${order._id || order.id}
${providerType === 'pharmacy' ? 'Pharmacy' : 'Laboratory'}: ${providerName}
New Status: ${newStatus}
${statusMessages[newStatus] || ''}

Thank you,
Team Healiinn`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #11496c;">Order Status Update</h2>
        <p>Hello ${patientName},</p>
        <p>Your order status has been updated:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order._id || order.id}</p>
          <p style="margin: 5px 0;"><strong>${providerType === 'pharmacy' ? 'Pharmacy' : 'Laboratory'}:</strong> ${providerName}</p>
          <p style="margin: 5px 0;"><strong>New Status:</strong> ${newStatus}</p>
        </div>
        ${statusMessages[newStatus] ? `<p>${statusMessages[newStatus]}</p>` : ''}
        <p>Thank you,<br/>Team Healiinn</p>
      </div>
    `,
  });
};

/**
 * Send new order notification to pharmacy/lab
 */
const sendProviderNewOrderNotification = async ({ provider, order, patient, providerType }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!provider?.email) return null;

  const providerName =
    providerType === 'pharmacy'
      ? provider?.pharmacyName || 'Pharmacy'
      : provider?.labName || 'Laboratory';
  const patientName = patient.firstName
    ? `${patient.firstName} ${patient.lastName || ''}`.trim()
    : 'Patient';

  return sendEmail({
    to: provider.email,
    subject: `New Order - ${patientName} | Healiinn`,
    text: `Hello ${providerName},

You have received a new order:

Order ID: ${order._id || order.id}
Patient: ${patientName}
${patient.phone ? `Phone: ${patient.phone}` : ''}
Total Amount: ₹${order.totalAmount || 0}
${order.deliveryOption ? `Delivery Option: ${order.deliveryOption}` : ''}

Please review and process the order in your dashboard.

Thank you,
Team Healiinn`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #11496c;">New Order</h2>
        <p>Hello ${providerName},</p>
        <p>You have received a new order:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order._id || order.id}</p>
          <p style="margin: 5px 0;"><strong>Patient:</strong> ${patientName}</p>
          ${patient.phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${patient.phone}</p>` : ''}
          <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${order.totalAmount || 0}</p>
          ${order.deliveryOption ? `<p style="margin: 5px 0;"><strong>Delivery Option:</strong> ${order.deliveryOption}</p>` : ''}
        </div>
        <p>Please review and process the order in your dashboard.</p>
        <p>Thank you,<br/>Team Healiinn</p>
      </div>
    `,
  });
};

/**
 * Send lab report ready email
 */
const sendLabReportReadyEmail = async ({ patient, report, laboratory }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!patient?.email) return null;

  const patientName = patient.firstName
    ? `${patient.firstName} ${patient.lastName || ''}`.trim()
    : 'Patient';
  const labName = laboratory?.labName || 'Laboratory';

  return sendEmail({
    to: patient.email,
    subject: `Lab Report Ready - ${labName} | Healiinn`,
    text: `Hello ${patientName},

Your lab report is ready:

Report ID: ${report._id || report.id}
Laboratory: ${labName}
Test Name: ${report.testName || 'Lab Test'}
${report.pdfFileUrl ? 'PDF: Available for download' : ''}

You can download your report from your dashboard or the link provided.

Thank you,
Team Healiinn`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #11496c;">Lab Report Ready</h2>
        <p>Hello ${patientName},</p>
        <p>Your lab report is ready:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Report ID:</strong> ${report._id || report.id}</p>
          <p style="margin: 5px 0;"><strong>Laboratory:</strong> ${labName}</p>
          <p style="margin: 5px 0;"><strong>Test Name:</strong> ${report.testName || 'Lab Test'}</p>
          ${report.pdfFileUrl ? '<p style="margin: 5px 0;"><strong>PDF:</strong> Available for download</p>' : ''}
        </div>
        <p>You can download your report from your dashboard or the link provided.</p>
        <p>Thank you,<br/>Team Healiinn</p>
      </div>
    `,
  });
};

/**
 * Send request response email to patient
 */
const sendRequestResponseEmail = async ({ patient, request }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!patient?.email) return null;

  const patientName = patient.firstName
    ? `${patient.firstName} ${patient.lastName || ''}`.trim()
    : 'Patient';

  return sendEmail({
    to: patient.email,
    subject: `Request Response - Healiinn`,
    text: `Hello ${patientName},

Your request has been processed:

Request ID: ${request._id || request.id}
Request Type: ${request.type === 'order_medicine' ? 'Medicine Order' : 'Test Booking'}
Status: ${request.status}
${request.adminResponse?.totalAmount ? `Total Amount: ₹${request.adminResponse.totalAmount}` : ''}

${request.adminResponse?.message || 'Please check your dashboard for details.'}

Thank you,
Team Healiinn`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #11496c;">Request Response</h2>
        <p>Hello ${patientName},</p>
        <p>Your request has been processed:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Request ID:</strong> ${request._id || request.id}</p>
          <p style="margin: 5px 0;"><strong>Request Type:</strong> ${request.type === 'order_medicine' ? 'Medicine Order' : 'Test Booking'}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> ${request.status}</p>
          ${request.adminResponse?.totalAmount ? `<p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${request.adminResponse.totalAmount}</p>` : ''}
        </div>
        <p>${request.adminResponse?.message || 'Please check your dashboard for details.'}</p>
        <p>Thank you,<br/>Team Healiinn</p>
      </div>
    `,
  });
};

/**
 * Send payment confirmation email
 */
const sendPaymentConfirmationEmail = async ({ patient, transaction, order }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!patient?.email) return null;

  const patientName = patient.firstName
    ? `${patient.firstName} ${patient.lastName || ''}`.trim()
    : 'Patient';

  return sendEmail({
    to: patient.email,
    subject: `Payment Confirmed - ₹${transaction.amount || 0} | Healiinn`,
    text: `Hello ${patientName},

Your payment has been confirmed:

Transaction ID: ${transaction._id || transaction.id}
Amount: ₹${transaction.amount || 0}
Status: ${transaction.status || 'completed'}
${order ? `Order ID: ${order._id || order.id}` : ''}
Date: ${new Date().toLocaleDateString('en-IN')}

Thank you for your payment.

Thank you,
Team Healiinn`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #11496c;">Payment Confirmed</h2>
        <p>Hello ${patientName},</p>
        <p>Your payment has been confirmed:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${transaction._id || transaction.id}</p>
          <p style="margin: 5px 0;"><strong>Amount:</strong> ₹${transaction.amount || 0}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> ${transaction.status || 'completed'}</p>
          ${order ? `<p style="margin: 5px 0;"><strong>Order ID:</strong> ${order._id || order.id}</p>` : ''}
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
        </div>
        <p>Thank you for your payment.</p>
        <p>Thank you,<br/>Team Healiinn</p>
      </div>
    `,
  });
};

/**
 * Send withdrawal request notification
 */
const sendWithdrawalRequestNotification = async ({ provider, withdrawal, providerType }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!provider?.email) return null;

  const providerName =
    providerType === 'doctor'
      ? `Dr. ${provider.firstName || ''} ${provider.lastName || ''}`.trim()
      : providerType === 'pharmacy'
      ? provider?.pharmacyName || 'Pharmacy'
      : provider?.labName || 'Laboratory';

  return sendEmail({
    to: provider.email,
    subject: `Withdrawal Request Submitted - ₹${withdrawal.amount || 0} | Healiinn`,
    text: `Hello ${providerName},

Your withdrawal request has been submitted:

Request ID: ${withdrawal._id || withdrawal.id}
Amount: ₹${withdrawal.amount || 0}
Status: ${withdrawal.status || 'pending'}

Your request is under review. You will be notified once it's processed.

Thank you,
Team Healiinn`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #11496c;">Withdrawal Request Submitted</h2>
        <p>Hello ${providerName},</p>
        <p>Your withdrawal request has been submitted:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Request ID:</strong> ${withdrawal._id || withdrawal.id}</p>
          <p style="margin: 5px 0;"><strong>Amount:</strong> ₹${withdrawal.amount || 0}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> ${withdrawal.status || 'pending'}</p>
        </div>
        <p>Your request is under review. You will be notified once it's processed.</p>
        <p>Thank you,<br/>Team Healiinn</p>
      </div>
    `,
  });
};

/**
 * Send withdrawal status update email
 */
const sendWithdrawalStatusUpdateEmail = async ({ provider, withdrawal, providerType }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!provider?.email) return null;

  const providerName =
    providerType === 'doctor'
      ? `Dr. ${provider.firstName || ''} ${provider.lastName || ''}`.trim()
      : providerType === 'pharmacy'
      ? provider?.pharmacyName || 'Pharmacy'
      : provider?.labName || 'Laboratory';

  const statusMessages = {
    approved: 'Your withdrawal request has been approved and is being processed.',
    rejected: 'Your withdrawal request has been rejected.',
    processed: 'Your withdrawal has been processed and the amount has been transferred.',
  };

  return sendEmail({
    to: provider.email,
    subject: `Withdrawal Update - ₹${withdrawal.amount || 0} | Healiinn`,
    text: `Hello ${providerName},

Your withdrawal request status has been updated:

Request ID: ${withdrawal._id || withdrawal.id}
Amount: ₹${withdrawal.amount || 0}
Status: ${withdrawal.status}
${statusMessages[withdrawal.status] || ''}
${withdrawal.adminNote ? `Admin Note: ${withdrawal.adminNote}` : ''}

Thank you,
Team Healiinn`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #11496c;">Withdrawal Status Update</h2>
        <p>Hello ${providerName},</p>
        <p>Your withdrawal request status has been updated:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Request ID:</strong> ${withdrawal._id || withdrawal.id}</p>
          <p style="margin: 5px 0;"><strong>Amount:</strong> ₹${withdrawal.amount || 0}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> ${withdrawal.status}</p>
        </div>
        ${statusMessages[withdrawal.status] ? `<p>${statusMessages[withdrawal.status]}</p>` : ''}
        ${withdrawal.adminNote ? `<p><strong>Admin Note:</strong> ${withdrawal.adminNote}</p>` : ''}
        <p>Thank you,<br/>Team Healiinn</p>
      </div>
    `,
  });
};

/**
 * Send support ticket notification
 */
const sendSupportTicketNotification = async ({ user, ticket, userType, isResponse = false }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!user?.email) return null;

  const userName =
    userType === 'patient'
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
      : userType === 'doctor'
      ? `Dr. ${user.firstName || ''} ${user.lastName || ''}`.trim()
      : userType === 'pharmacy'
      ? user?.pharmacyName || 'Pharmacy'
      : userType === 'laboratory'
      ? user?.labName || 'Laboratory'
      : user?.name || 'User';

  if (isResponse) {
    return sendEmail({
      to: user.email,
      subject: `Support Ticket Response - #${ticket._id || ticket.id} | Healiinn`,
      text: `Hello ${userName},

Your support ticket has received a response:

Ticket ID: ${ticket._id || ticket.id}
Subject: ${ticket.subject || 'Support Request'}
Status: ${ticket.status || 'in_progress'}

Please check your dashboard for the response details.

Thank you,
Team Healiinn`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #11496c;">Support Ticket Response</h2>
          <p>Hello ${userName},</p>
          <p>Your support ticket has received a response:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Ticket ID:</strong> #${ticket._id || ticket.id}</p>
            <p style="margin: 5px 0;"><strong>Subject:</strong> ${ticket.subject || 'Support Request'}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${ticket.status || 'in_progress'}</p>
          </div>
          <p>Please check your dashboard for the response details.</p>
          <p>Thank you,<br/>Team Healiinn</p>
        </div>
      `,
    });
  }

  return sendEmail({
    to: user.email,
    subject: `Support Ticket Created - #${ticket._id || ticket.id} | Healiinn`,
    text: `Hello ${userName},

Your support ticket has been created:

Ticket ID: ${ticket._id || ticket.id}
Subject: ${ticket.subject || 'Support Request'}
Status: ${ticket.status || 'open'}

We will review your ticket and respond as soon as possible.

Thank you,
Team Healiinn`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #11496c;">Support Ticket Created</h2>
        <p>Hello ${userName},</p>
        <p>Your support ticket has been created:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Ticket ID:</strong> #${ticket._id || ticket.id}</p>
          <p style="margin: 5px 0;"><strong>Subject:</strong> ${ticket.subject || 'Support Request'}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> ${ticket.status || 'open'}</p>
        </div>
        <p>We will review your ticket and respond as soon as possible.</p>
        <p>Thank you,<br/>Team Healiinn</p>
      </div>
    `,
  });
};

/**
 * Send new support ticket notification to admin
 */
const sendAdminSupportTicketNotification = async ({ admin, ticket, user, userType }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!admin?.email) return null;

  const userName =
    userType === 'patient'
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
      : userType === 'doctor'
      ? `Dr. ${user.firstName || ''} ${user.lastName || ''}`.trim()
      : userType === 'pharmacy'
      ? user?.pharmacyName || 'Pharmacy'
      : userType === 'laboratory'
      ? user?.labName || 'Laboratory'
      : user?.name || 'User';

  return sendEmail({
    to: admin.email,
    subject: `New Support Ticket - ${userType} | Healiinn`,
    text: `Hello Admin,

A new support ticket has been created:

Ticket ID: ${ticket._id || ticket.id}
User: ${userName} (${userType})
Subject: ${ticket.subject || 'Support Request'}
Priority: ${ticket.priority || 'medium'}

Please review and respond to the ticket in the admin panel.

Thank you,
Healiinn Platform`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #11496c;">New Support Ticket</h2>
        <p>Hello Admin,</p>
        <p>A new support ticket has been created:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Ticket ID:</strong> #${ticket._id || ticket.id}</p>
          <p style="margin: 5px 0;"><strong>User:</strong> ${userName} (${userType})</p>
          <p style="margin: 5px 0;"><strong>Subject:</strong> ${ticket.subject || 'Support Request'}</p>
          <p style="margin: 5px 0;"><strong>Priority:</strong> ${ticket.priority || 'medium'}</p>
        </div>
        <p>Please review and respond to the ticket in the admin panel.</p>
        <p>Thank you,<br/>Healiinn Platform</p>
      </div>
    `,
  });
};

module.exports = {
  sendAppointmentConfirmationEmail,
  sendDoctorAppointmentNotification,
  sendAppointmentCancellationEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendProviderNewOrderNotification,
  sendLabReportReadyEmail,
  sendRequestResponseEmail,
  sendPaymentConfirmationEmail,
  sendWithdrawalRequestNotification,
  sendWithdrawalStatusUpdateEmail,
  sendSupportTicketNotification,
  sendAdminSupportTicketNotification,
  // Re-export existing functions
  sendRoleApprovalEmail,
  sendSignupAcknowledgementEmail,
  sendPasswordResetOtpEmail,
  sendAppointmentReminderEmail,
  sendPrescriptionEmail,
};

