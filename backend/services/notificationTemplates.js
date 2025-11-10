const formatTime = (date) => {
  if (!date) {
    return '';
  }

  const instance = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(instance.getTime())) {
    return '';
  }

  return instance.toLocaleString('en-IN', {
    hour: 'numeric',
    minute: 'numeric',
    day: 'numeric',
    month: 'short',
  });
};

const titleCase = (value) => {
  if (!value) {
    return '';
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatTokenNumber = (tokenNumber) => (tokenNumber ? `Token #${tokenNumber}` : 'Your token');

const templates = {
  APPOINTMENT_CONFIRMED: ({ doctorName, appointmentDate }) => ({
    title: 'Appointment confirmed',
    body: `Your appointment with ${doctorName} is confirmed for ${formatTime(appointmentDate)}.`,
    data: { category: 'appointment' },
  }),
  APPOINTMENT_CANCELLED: ({ doctorName, appointmentDate }) => ({
    title: 'Appointment update',
    body: `Your appointment with ${doctorName} on ${formatTime(appointmentDate)} has been cancelled.`,
    data: { category: 'appointment' },
  }),
  APPOINTMENT_NEW_FOR_DOCTOR: ({ patientName, appointmentDate }) => ({
    title: 'New appointment booked',
    body: `${patientName} booked an appointment for ${formatTime(appointmentDate)}.`,
    data: { category: 'appointment' },
  }),
  LAB_TEST_REQUESTED: ({ patientName }) => ({
    title: 'New test order',
    body: `You received a new test request for ${patientName}.`,
    data: { category: 'laboratory' },
  }),
  LAB_REPORT_READY: ({ testName }) => ({
    title: 'Lab report ready',
    body: `Your ${testName || 'lab'} report is now available.`,
    data: { category: 'laboratory' },
  }),
  PHARMACY_NEW_ORDER: ({ patientName }) => ({
    title: 'New medicine order',
    body: `New order request received${patientName ? ` from ${patientName}` : ''}.`,
    data: { category: 'pharmacy' },
  }),
  ORDER_STATUS_UPDATED: ({ orderNumber, status }) => ({
    title: 'Order update',
    body: `Your order${orderNumber ? ` #${orderNumber}` : ''} is now ${status}.`,
    data: { category: 'pharmacy' },
  }),
  ADMIN_KYC_SUBMITTED: ({ name, role }) => ({
    title: 'New verification submitted',
    body: `${name || 'A user'} submitted ${titleCase(role) || 'verification'} for approval.`,
    data: { category: 'admin' },
  }),
  ACCOUNT_APPROVED: ({ role }) => {
    const readable = role ? `${titleCase(role)} account` : 'Your account';
    return {
      title: 'Account approved',
      body: `${readable} has been approved. You can now sign in.`,
      data: { category: 'account' },
    };
  },
  ACCOUNT_REJECTED: ({ role, reason }) => {
    const readable = role ? `${titleCase(role)} account` : 'Your account';
    return {
      title: 'Account update',
      body: `${readable} could not be approved.${reason ? ` Reason: ${reason}.` : ''}`,
      data: { category: 'account' },
    };
  },
  TOKEN_CALLED: ({ doctorName, tokenNumber, eta }) => ({
    title: 'It’s your turn',
    body: `${formatTokenNumber(tokenNumber)} with ${doctorName} is being called. Please head to the clinic.`,
    data: { category: 'queue', eta: eta ? new Date(eta).toISOString() : undefined },
  }),
  TOKEN_RECALLED: ({ doctorName, tokenNumber, eta }) => ({
    title: 'Token recalled',
    body: `${formatTokenNumber(tokenNumber)} for ${doctorName} has been recalled. Please be ready.`,
    data: { category: 'queue', eta: eta ? new Date(eta).toISOString() : undefined },
  }),
  TOKEN_SKIPPED: ({ tokenNumber }) => ({
    title: 'Token skipped',
    body: `${formatTokenNumber(tokenNumber)} was marked as skipped. Reach out if you need assistance.`,
    data: { category: 'queue' },
  }),
  TOKEN_COMPLETED: ({ doctorName, tokenNumber }) => ({
    title: 'Consultation completed',
    body: `${formatTokenNumber(tokenNumber)} with ${doctorName} is completed. Thanks for visiting.`,
    data: { category: 'queue' },
  }),
  TOKEN_NO_SHOW: ({ tokenNumber }) => ({
    title: 'Token marked no-show',
    body: `${formatTokenNumber(tokenNumber)} was marked as no-show.`,
    data: { category: 'queue' },
  }),
  PRESCRIPTION_READY: ({ doctorName }) => ({
    title: 'Prescription ready',
    body: `Your prescription from ${doctorName || 'your doctor'} is ready to view.`,
    data: { category: 'prescription' },
  }),
};

const getTemplate = (type) => templates[type];

module.exports = {
  getTemplate,
  TEMPLATES: templates,
};


