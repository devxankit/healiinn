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
    title: 'New lab request',
    body: `You received a new lab request for ${patientName}.`,
    data: { category: 'laboratory' },
  }),
  LAB_REPORT_READY: ({ testName }) => ({
    title: 'Lab report ready',
    body: `Your ${testName || 'lab'} report is now available.`,
    data: { category: 'laboratory' },
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
  LAB_REQUEST_RECEIVED: ({ patientName }) => ({
    title: 'New lab request',
    body: `You received a new lab test request from ${patientName || 'a patient'}. Please review and accept.`,
    data: { category: 'laboratory' },
  }),
  PHARMACY_REQUEST_RECEIVED: ({ patientName }) => ({
    title: 'New pharmacy request',
    body: `You received a new medicine order from ${patientName || 'a patient'}. Please review and accept.`,
    data: { category: 'pharmacy' },
  }),
  LAB_REQUEST_ACCEPTED: ({ laboratoryName, totalAmount }) => ({
    title: 'Lab request accepted',
    body: `${laboratoryName || 'Laboratory'} has accepted your request. Total amount: ₹${totalAmount || 0}. Please proceed with payment.`,
    data: { category: 'laboratory' },
  }),
  PHARMACY_REQUEST_ACCEPTED: ({ pharmacyName, totalAmount }) => ({
    title: 'Pharmacy request accepted',
    body: `${pharmacyName || 'Pharmacy'} has accepted your order. Total amount: ₹${totalAmount || 0}. Please proceed with payment.`,
    data: { category: 'pharmacy' },
  }),
  LAB_LEAD_STATUS_CHANGED: ({ status, notes }) => ({
    title: 'Lab request update',
    body: `Your lab request status has been updated to ${titleCase(status || '')}.${notes ? ` ${notes}` : ''}`,
    data: { category: 'laboratory' },
  }),
  PHARMACY_LEAD_STATUS_CHANGED: ({ status, notes }) => ({
    title: 'Pharmacy order update',
    body: `Your pharmacy order status has been updated to ${titleCase(status || '')}.${notes ? ` ${notes}` : ''}`,
    data: { category: 'pharmacy' },
  }),
  LAB_REPORT_READY: ({ laboratoryName }) => ({
    title: 'Lab report ready',
    body: `Your lab report from ${laboratoryName || 'laboratory'} is ready. You can now view and share it.`,
    data: { category: 'laboratory' },
  }),
  LAB_REPORT_SHARED: ({ shareType }) => ({
    title: shareType === 'direct' ? 'Report shared with doctor' : 'Report shared via appointment',
    body: shareType === 'direct'
      ? 'Your lab report has been shared with the prescribing doctor.'
      : 'Your lab report has been shared with the doctor through your appointment.',
    data: { category: 'laboratory' },
  }),
  WITHDRAWAL_REQUESTED: ({ amount, providerRole, isProvider, isAdmin }) => {
    const roleName = providerRole === 'doctor' ? 'Doctor' : providerRole === 'laboratory' ? 'Laboratory' : 'Pharmacy';
    if (isAdmin) {
      return {
        title: 'New withdrawal request',
        body: `New withdrawal request of ₹${amount || 0} from ${roleName}. Please review.`,
        data: { category: 'wallet' },
      };
    }
    return {
      title: 'Withdrawal request submitted',
      body: `Your withdrawal request of ₹${amount || 0} has been submitted and is under review.`,
      data: { category: 'wallet' },
    };
  },
  WITHDRAWAL_STATUS_UPDATED: ({ status, amount, adminNote }) => {
    const statusMessages = {
      approved: `Your withdrawal request of ₹${amount || 0} has been approved.${adminNote ? ` ${adminNote}` : ''}`,
      rejected: `Your withdrawal request of ₹${amount || 0} has been rejected.${adminNote ? ` Reason: ${adminNote}` : ''}`,
      paid: `Your withdrawal of ₹${amount || 0} has been processed and paid.`,
      pending: `Your withdrawal request of ₹${amount || 0} is pending review.`,
    };
    return {
      title: 'Withdrawal status updated',
      body: statusMessages[status] || `Your withdrawal request status has been updated to ${titleCase(status || '')}.`,
      data: { category: 'wallet' },
    };
  },
  TRANSACTION_CREDITED: ({ amount, netAmount, commissionAmount, bookingType }) => {
    const bookingTypeName = bookingType === 'appointment' ? 'appointment' : bookingType === 'lab_booking' ? 'lab booking' : 'pharmacy order';
    return {
      title: 'Payment received',
      body: `You received ₹${netAmount || 0} from ${bookingTypeName}. Gross: ₹${amount || 0}, Commission: ₹${commissionAmount || 0}.`,
      data: { category: 'wallet' },
    };
  },
  PAYMENT_RECEIVED: ({ amount, bookingType }) => {
    const bookingTypeName = bookingType === 'appointment' ? 'appointment' : bookingType === 'lab_booking' ? 'lab booking' : 'pharmacy order';
    return {
      title: 'Payment confirmed',
      body: `Payment of ₹${amount || 0} for ${bookingTypeName} has been confirmed and credited to your wallet.`,
      data: { category: 'wallet' },
    };
  },
};

const getTemplate = (type) => templates[type];

module.exports = {
  getTemplate,
  TEMPLATES: templates,
};


