const { publishNotification } = require('./notificationPublisher');
const { ROLES } = require('../utils/constants');

const notifyAppointmentConfirmed = async ({
  patientId,
  doctorId,
  doctorName,
  patientName,
  appointmentDate,
  appointmentId,
}) => {
  const tasks = [];

  if (patientId) {
    tasks.push(
      publishNotification({
        type: 'APPOINTMENT_CONFIRMED',
        recipients: [{ role: ROLES.PATIENT, userId: patientId }],
        context: { doctorName, appointmentDate },
        data: { appointmentId },
      })
    );
  }

  if (doctorId) {
    tasks.push(
      publishNotification({
        type: 'APPOINTMENT_NEW_FOR_DOCTOR',
        recipients: [{ role: ROLES.DOCTOR, userId: doctorId }],
        context: { patientName: patientName || 'Patient', appointmentDate },
        data: { appointmentId },
      })
    );
  }

  await Promise.all(tasks);
};

const notifyAppointmentCancelled = async ({ patientId, doctorName, appointmentDate, appointmentId }) =>
  publishNotification({
    type: 'APPOINTMENT_CANCELLED',
    recipients: [{ role: ROLES.PATIENT, userId: patientId }],
    context: { doctorName, appointmentDate },
    data: { appointmentId },
  });

const notifyDoctorOfNewAppointment = async ({ doctorId, patientName, appointmentDate, appointmentId }) =>
  publishNotification({
    type: 'APPOINTMENT_NEW_FOR_DOCTOR',
    recipients: [{ role: ROLES.DOCTOR, userId: doctorId }],
    context: { patientName: patientName || 'Patient', appointmentDate },
    data: { appointmentId },
  });

const notifyTokenCalled = async ({ patientId, doctorId, doctorName, tokenNumber, eta, sessionId }) => {
  const tasks = [];

  if (patientId) {
    tasks.push(
      publishNotification({
        type: 'TOKEN_CALLED',
        recipients: [{ role: ROLES.PATIENT, userId: patientId }],
        context: { doctorName, tokenNumber, eta },
        data: { sessionId, tokenNumber },
      })
    );
  }

  if (doctorId) {
    tasks.push(
      publishNotification({
        type: 'APPOINTMENT_NEW_FOR_DOCTOR',
        recipients: [{ role: ROLES.DOCTOR, userId: doctorId }],
        context: { patientName: 'Token called', appointmentDate: eta },
        data: { sessionId, tokenNumber },
      })
    );
  }

  await Promise.all(tasks);
};

const notifyTokenRecalled = async ({ patientId, doctorId, doctorName, tokenNumber, eta, sessionId }) =>
  publishNotification({
    type: 'TOKEN_RECALLED',
    recipients: [{ role: ROLES.PATIENT, userId: patientId }],
    context: { doctorName, tokenNumber, eta },
    data: { sessionId, tokenNumber },
  });

const notifyTokenSkipped = async ({ patientId, doctorId, tokenNumber, sessionId }) => {
  const recipients = [];
  if (patientId) {
    recipients.push({ role: ROLES.PATIENT, userId: patientId });
  }
  if (doctorId) {
    recipients.push({ role: ROLES.DOCTOR, userId: doctorId });
  }

  if (!recipients.length) {
    return null;
  }

  return publishNotification({
    type: 'TOKEN_SKIPPED',
    recipients,
    context: { tokenNumber },
    data: { sessionId, tokenNumber },
  });
};

const notifyTokenCompleted = async ({ patientId, doctorId, doctorName, tokenNumber, sessionId }) => {
  const recipients = [];

  if (patientId) {
    recipients.push({ role: ROLES.PATIENT, userId: patientId });
  }

  if (doctorId) {
    recipients.push({ role: ROLES.DOCTOR, userId: doctorId });
  }

  if (!recipients.length) {
    return null;
  }

  return publishNotification({
    type: 'TOKEN_COMPLETED',
    recipients,
    context: { doctorName, tokenNumber },
    data: { sessionId, tokenNumber },
  });
};

const notifyTokenNoShow = async ({ doctorId, patientId, tokenNumber, sessionId }) => {
  const recipients = [];

  if (doctorId) {
    recipients.push({ role: ROLES.DOCTOR, userId: doctorId });
  }

  if (patientId) {
    recipients.push({ role: ROLES.PATIENT, userId: patientId });
  }

  if (!recipients.length) {
    return null;
  }

  return publishNotification({
    type: 'TOKEN_NO_SHOW',
    recipients,
    context: { tokenNumber },
    data: { sessionId, tokenNumber },
  });
};

const notifyLabOfTestRequest = async ({ laboratoryId, patientName, testBookingId }) =>
  publishNotification({
    type: 'LAB_TEST_REQUESTED',
    recipients: [{ role: ROLES.LABORATORY, userId: laboratoryId }],
    context: { patientName },
    data: { testBookingId },
  });

const notifyPatientLabReportReady = async ({ patientId, testName, testBookingId }) =>
  publishNotification({
    type: 'LAB_REPORT_READY',
    recipients: [{ role: ROLES.PATIENT, userId: patientId }],
    context: { testName },
    data: { testBookingId },
  });

const notifyPrescriptionReady = async ({ patientId, doctorName, prescriptionId }) =>
  publishNotification({
    type: 'PRESCRIPTION_READY',
    recipients: [{ role: ROLES.PATIENT, userId: patientId }],
    context: { doctorName },
    data: { prescriptionId },
  });

const notifyLabLeadStatusChange = async ({ patientId, laboratoryId, status, leadId, notes }) => {
  const recipients = [];
  
  if (patientId) {
    recipients.push({ role: ROLES.PATIENT, userId: patientId });
  }
  
  if (laboratoryId) {
    recipients.push({ role: ROLES.LABORATORY, userId: laboratoryId });
  }

  if (!recipients.length) {
    return null;
  }

  return publishNotification({
    type: 'LAB_LEAD_STATUS_CHANGED',
    recipients,
    context: { status, notes: notes || '' },
    data: { leadId },
  });
};

const notifyPharmacyLeadStatusChange = async ({ patientId, pharmacyId, status, leadId, notes }) => {
  const recipients = [];
  
  if (patientId) {
    recipients.push({ role: ROLES.PATIENT, userId: patientId });
  }
  
  if (pharmacyId) {
    recipients.push({ role: ROLES.PHARMACY, userId: pharmacyId });
  }

  if (!recipients.length) {
    return null;
  }

  return publishNotification({
    type: 'PHARMACY_LEAD_STATUS_CHANGED',
    recipients,
    context: { status, notes: notes || '' },
    data: { leadId },
  });
};

const notifyLabRequestReceived = async ({ laboratoryId, patientName, leadId }) =>
  publishNotification({
    type: 'LAB_REQUEST_RECEIVED',
    recipients: [{ role: ROLES.LABORATORY, userId: laboratoryId }],
    context: { patientName: patientName || 'Patient' },
    data: { leadId },
  });

const notifyPharmacyRequestReceived = async ({ pharmacyId, patientName, leadId }) =>
  publishNotification({
    type: 'PHARMACY_REQUEST_RECEIVED',
    recipients: [{ role: ROLES.PHARMACY, userId: pharmacyId }],
    context: { patientName: patientName || 'Patient' },
    data: { leadId },
  });

const notifyLabAccepted = async ({ patientId, laboratoryName, leadId, totalAmount }) =>
  publishNotification({
    type: 'LAB_REQUEST_ACCEPTED',
    recipients: [{ role: ROLES.PATIENT, userId: patientId }],
    context: { laboratoryName, totalAmount },
    data: { leadId },
  });

const notifyPharmacyAccepted = async ({ patientId, pharmacyName, leadId, totalAmount }) =>
  publishNotification({
    type: 'PHARMACY_REQUEST_ACCEPTED',
    recipients: [{ role: ROLES.PATIENT, userId: patientId }],
    context: { pharmacyName, totalAmount },
    data: { leadId },
  });

const notifyLabReportShared = async ({ doctorId, patientId, reportId, shareType }) => {
  const recipients = [];

  if (doctorId) {
    recipients.push({ role: ROLES.DOCTOR, userId: doctorId });
  }

  if (patientId) {
    recipients.push({ role: ROLES.PATIENT, userId: patientId });
  }

  if (!recipients.length) {
    return null;
  }

  return publishNotification({
    type: 'LAB_REPORT_SHARED',
    recipients,
    context: { shareType },
    data: { reportId },
  });
};

const notifyLabReportReady = async ({ patientId, laboratoryName, reportId }) =>
  publishNotification({
    type: 'LAB_REPORT_READY',
    recipients: [{ role: ROLES.PATIENT, userId: patientId }],
    context: { laboratoryName },
    data: { reportId },
  });

// Withdrawal notifications
const notifyWithdrawalRequested = async ({ providerId, providerRole, amount, withdrawalId }) => {
  // Send notification to provider
  const providerNotification = await publishNotification({
    type: 'WITHDRAWAL_REQUESTED',
    recipients: [{ role: providerRole, userId: providerId }],
    context: { amount, providerRole, isProvider: true },
    data: { withdrawalId },
  });

  // Notify all active admins separately
  try {
    const Admin = require('../models/Admin');
    const admins = await Admin.find({ isActive: true }).select('_id').lean();
    if (admins.length > 0) {
      await publishNotification({
        type: 'WITHDRAWAL_REQUESTED',
        recipients: admins.map((admin) => ({ role: ROLES.ADMIN, userId: admin._id })),
        context: { amount, providerRole, isAdmin: true },
        data: { withdrawalId },
      });
    }
  } catch (error) {
    console.error('Failed to notify admins about withdrawal request:', error);
  }

  return providerNotification;
};

const notifyWithdrawalStatusUpdated = async ({ providerId, providerRole, status, amount, withdrawalId, adminNote }) => {
  const recipients = [];
  
  if (providerId) {
    recipients.push({ role: providerRole, userId: providerId });
  }

  if (!recipients.length) {
    return null;
  }

  return publishNotification({
    type: 'WITHDRAWAL_STATUS_UPDATED',
    recipients,
    context: { status, amount, adminNote: adminNote || '' },
    data: { withdrawalId },
  });
};

// Transaction notifications
const notifyTransactionCredited = async ({ providerId, providerRole, amount, netAmount, commissionAmount, transactionId, bookingType }) => {
  const recipients = [];
  
  if (providerId) {
    recipients.push({ role: providerRole, userId: providerId });
  }

  if (!recipients.length) {
    return null;
  }

  return publishNotification({
    type: 'TRANSACTION_CREDITED',
    recipients,
    context: { amount, netAmount, commissionAmount, bookingType },
    data: { transactionId },
  });
};

const notifyPaymentReceived = async ({ providerId, providerRole, amount, paymentId, bookingType }) => {
  const recipients = [];
  
  if (providerId) {
    recipients.push({ role: providerRole, userId: providerId });
  }

  if (!recipients.length) {
    return null;
  }

  return publishNotification({
    type: 'PAYMENT_RECEIVED',
    recipients,
    context: { amount, bookingType },
    data: { paymentId },
  });
};

const notifyAppointmentReminder = async ({ patientId, doctorId, doctorName, patientName, appointmentDate, appointmentId, hoursBefore = 24 }) => {
  const recipients = [];
  
  if (patientId) {
    recipients.push({ role: ROLES.PATIENT, userId: patientId });
  }
  
  if (doctorId) {
    recipients.push({ role: ROLES.DOCTOR, userId: doctorId });
  }

  if (!recipients.length) {
    return null;
  }

  return publishNotification({
    type: 'APPOINTMENT_REMINDER',
    recipients,
    context: { doctorName, patientName, appointmentDate, hoursBefore },
    data: { appointmentId },
  });
};

module.exports = {
  notifyAppointmentConfirmed,
  notifyAppointmentCancelled,
  notifyDoctorOfNewAppointment,
  notifyAppointmentReminder,
  notifyLabOfTestRequest,
  notifyPatientLabReportReady,
  notifyTokenCalled,
  notifyTokenRecalled,
  notifyTokenSkipped,
  notifyTokenCompleted,
  notifyTokenNoShow,
  notifyPrescriptionReady,
  notifyLabLeadStatusChange,
  notifyPharmacyLeadStatusChange,
  notifyLabRequestReceived,
  notifyPharmacyRequestReceived,
  notifyLabAccepted,
  notifyPharmacyAccepted,
  notifyLabReportShared,
  notifyLabReportReady,
  notifyWithdrawalRequested,
  notifyWithdrawalStatusUpdated,
  notifyTransactionCredited,
  notifyPaymentReceived,
};


