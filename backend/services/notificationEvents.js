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

const notifyPharmacyNewOrder = async ({ pharmacyId, patientName, orderId }) =>
  publishNotification({
    type: 'PHARMACY_NEW_ORDER',
    recipients: [{ role: ROLES.PHARMACY, userId: pharmacyId }],
    context: { patientName },
    data: { orderId },
  });

const notifyPatientOrderStatusUpdate = async ({ patientId, orderNumber, status, orderId }) =>
  publishNotification({
    type: 'ORDER_STATUS_UPDATED',
    recipients: [{ role: ROLES.PATIENT, userId: patientId }],
    context: { orderNumber, status },
    data: { orderId, status },
  });

const notifyPrescriptionReady = async ({ patientId, doctorName, prescriptionId }) =>
  publishNotification({
    type: 'PRESCRIPTION_READY',
    recipients: [{ role: ROLES.PATIENT, userId: patientId }],
    context: { doctorName },
    data: { prescriptionId },
  });

module.exports = {
  notifyAppointmentConfirmed,
  notifyAppointmentCancelled,
  notifyDoctorOfNewAppointment,
  notifyLabOfTestRequest,
  notifyPatientLabReportReady,
  notifyPharmacyNewOrder,
  notifyPatientOrderStatusUpdate,
  notifyTokenCalled,
  notifyTokenRecalled,
  notifyTokenSkipped,
  notifyTokenCompleted,
  notifyTokenNoShow,
  notifyPrescriptionReady,
};


