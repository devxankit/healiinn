const Payment = require('../models/Payment');
const WalletTransaction = require('../models/WalletTransaction');
const AdminWalletTransaction = require('../models/AdminWalletTransaction');
const Appointment = require('../models/Appointment');
const LabLead = require('../models/LabLead');
const PharmacyLead = require('../models/PharmacyLead');
const { ROLES } = require('../utils/constants');

// Get all transactions for Patient
const getPatientTransactions = async ({ patientId, limit = 20, skip = 0, status, type }) => {
  const match = {
    user: patientId,
    role: ROLES.PATIENT,
  };

  if (status && ['pending', 'success', 'failed'].includes(status)) {
    match.status = status;
  }

  if (type && ['appointment', 'lab_booking', 'pharmacy_booking'].includes(type)) {
    match.type = type;
  }

  const transactions = await Payment.find(match)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Populate related booking details
  const populatedTransactions = await Promise.all(
    transactions.map(async (transaction) => {
      const metadata = transaction.metadata || {};
      let bookingDetails = null;

      if (transaction.type === 'appointment' && metadata.appointmentId) {
        bookingDetails = await Appointment.findById(metadata.appointmentId)
          .populate('doctor', 'firstName lastName specialization')
          .populate('clinic', 'name address')
          .lean();
      } else if (transaction.type === 'lab_booking' && metadata.labLeadId) {
        bookingDetails = await LabLead.findById(metadata.labLeadId)
          .populate('laboratory', 'labName address phone')
          .populate('doctor', 'firstName lastName')
          .lean();
      } else if (transaction.type === 'pharmacy_booking' && metadata.pharmacyLeadId) {
        bookingDetails = await PharmacyLead.findById(metadata.pharmacyLeadId)
          .populate('pharmacy', 'pharmacyName address phone')
          .populate('doctor', 'firstName lastName')
          .lean();
      }

      return {
        ...transaction,
        bookingDetails,
      };
    })
  );

  return populatedTransactions;
};

// Get all transactions for Doctor (payments received - wallet transactions)
const getDoctorTransactions = async ({ doctorId, limit = 20, skip = 0 }) => {
  const transactions = await WalletTransaction.find({
    $or: [
      { provider: doctorId, providerRole: ROLES.DOCTOR },
      { doctor: doctorId }, // Legacy support
    ],
  })
    .populate('patient', 'firstName lastName phone email')
    .populate('booking', 'scheduledFor status')
    .populate('payment', 'orderId paymentId status amount currency')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Add appointment details if booking is appointment
  const enrichedTransactions = await Promise.all(
    transactions.map(async (transaction) => {
      let bookingDetails = null;

      if (transaction.bookingModel === 'Appointment') {
        bookingDetails = await Appointment.findById(transaction.booking)
          .populate('clinic', 'name address')
          .lean();
      }

      return {
        ...transaction,
        bookingDetails,
      };
    })
  );

  return enrichedTransactions;
};

// Get all transactions for Laboratory (payments received - wallet transactions)
const getLaboratoryTransactions = async ({ laboratoryId, limit = 20, skip = 0 }) => {
  const transactions = await WalletTransaction.find({
    provider: laboratoryId,
    providerRole: ROLES.LABORATORY,
  })
    .populate('patient', 'firstName lastName phone email')
    .populate('booking', 'status tests billingSummary')
    .populate('payment', 'orderId paymentId status amount currency')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Add lab lead details
  const enrichedTransactions = await Promise.all(
    transactions.map(async (transaction) => {
      let bookingDetails = null;

      if (transaction.bookingModel === 'LabLead') {
        bookingDetails = await LabLead.findById(transaction.booking)
          .populate('doctor', 'firstName lastName')
          .lean();
      }

      return {
        ...transaction,
        bookingDetails,
      };
    })
  );

  return enrichedTransactions;
};

// Get all transactions for Pharmacy (payments received - wallet transactions)
const getPharmacyTransactions = async ({ pharmacyId, limit = 20, skip = 0 }) => {
  const transactions = await WalletTransaction.find({
    provider: pharmacyId,
    providerRole: ROLES.PHARMACY,
  })
    .populate('patient', 'firstName lastName phone email')
    .populate('booking', 'status medicines billingSummary')
    .populate('payment', 'orderId paymentId status amount currency')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Add pharmacy lead details
  const enrichedTransactions = await Promise.all(
    transactions.map(async (transaction) => {
      let bookingDetails = null;

      if (transaction.bookingModel === 'PharmacyLead') {
        bookingDetails = await PharmacyLead.findById(transaction.booking)
          .populate('doctor', 'firstName lastName')
          .lean();
      }

      return {
        ...transaction,
        bookingDetails,
      };
    })
  );

  return enrichedTransactions;
};

// Get transaction counts for Patient
const getPatientTransactionCount = async ({ patientId, status, type }) => {
  const match = {
    user: patientId,
    role: ROLES.PATIENT,
  };

  if (status && ['pending', 'success', 'failed'].includes(status)) {
    match.status = status;
  }

  if (type && ['appointment', 'lab_booking', 'pharmacy_booking'].includes(type)) {
    match.type = type;
  }

  return Payment.countDocuments(match);
};

// Get transaction counts for Doctor
const getDoctorTransactionCount = async ({ doctorId }) => {
  return WalletTransaction.countDocuments({
    $or: [
      { provider: doctorId, providerRole: ROLES.DOCTOR },
      { doctor: doctorId }, // Legacy support
    ],
  });
};

// Get transaction counts for Laboratory
const getLaboratoryTransactionCount = async ({ laboratoryId }) => {
  return WalletTransaction.countDocuments({
    provider: laboratoryId,
    providerRole: ROLES.LABORATORY,
  });
};

// Get transaction counts for Pharmacy
const getPharmacyTransactionCount = async ({ pharmacyId }) => {
  return WalletTransaction.countDocuments({
    provider: pharmacyId,
    providerRole: ROLES.PHARMACY,
  });
};

// Get all payments for Admin (all user payments)
const getAdminPayments = async ({ limit = 20, skip = 0, status, type, role, userId }) => {
  const match = {};

  if (status && ['pending', 'success', 'failed'].includes(status)) {
    match.status = status;
  }

  if (type && ['appointment', 'lab_booking', 'pharmacy_booking'].includes(type)) {
    match.type = type;
  }

  if (role && [ROLES.PATIENT, ROLES.DOCTOR, ROLES.LABORATORY, ROLES.PHARMACY].includes(role)) {
    match.role = role;
  }

  if (userId) {
    match.user = userId;
  }

  const payments = await Payment.find(match)
    .populate('user', 'firstName lastName email phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Populate booking details
  const populatedPayments = await Promise.all(
    payments.map(async (payment) => {
      const metadata = payment.metadata || {};
      let bookingDetails = null;

      if (payment.type === 'appointment' && metadata.appointmentId) {
        bookingDetails = await Appointment.findById(metadata.appointmentId)
          .populate('doctor', 'firstName lastName specialization')
          .populate('patient', 'firstName lastName')
          .populate('clinic', 'name address')
          .lean();
      } else if (payment.type === 'lab_booking' && metadata.labLeadId) {
        bookingDetails = await LabLead.findById(metadata.labLeadId)
          .populate('laboratory', 'labName address phone')
          .populate('patient', 'firstName lastName')
          .populate('doctor', 'firstName lastName')
          .lean();
      } else if (payment.type === 'pharmacy_booking' && metadata.pharmacyLeadId) {
        bookingDetails = await PharmacyLead.findById(metadata.pharmacyLeadId)
          .populate('pharmacy', 'pharmacyName address phone')
          .populate('patient', 'firstName lastName')
          .populate('doctor', 'firstName lastName')
          .lean();
      }

      return {
        ...payment,
        bookingDetails,
      };
    })
  );

  return populatedPayments;
};

// Get all wallet transactions for Admin (provider earnings)
const getAdminWalletTransactions = async ({ limit = 20, skip = 0, providerRole, providerId }) => {
  const match = {};

  if (providerRole && [ROLES.DOCTOR, ROLES.LABORATORY, ROLES.PHARMACY].includes(providerRole)) {
    match.providerRole = providerRole;
  }

  if (providerId) {
    match.provider = providerId;
  }

  const transactions = await WalletTransaction.find(match)
    .populate('provider', 'firstName lastName labName pharmacyName')
    .populate('patient', 'firstName lastName phone email')
    .populate('booking', 'scheduledFor status')
    .populate('payment', 'orderId paymentId status amount currency')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Add booking details
  const enrichedTransactions = await Promise.all(
    transactions.map(async (transaction) => {
      let bookingDetails = null;

      if (transaction.bookingModel === 'Appointment') {
        bookingDetails = await Appointment.findById(transaction.booking)
          .populate('clinic', 'name address')
          .lean();
      } else if (transaction.bookingModel === 'LabLead') {
        bookingDetails = await LabLead.findById(transaction.booking)
          .populate('doctor', 'firstName lastName')
          .lean();
      } else if (transaction.bookingModel === 'PharmacyLead') {
        bookingDetails = await PharmacyLead.findById(transaction.booking)
          .populate('doctor', 'firstName lastName')
          .lean();
      }

      return {
        ...transaction,
        bookingDetails,
      };
    })
  );

  return enrichedTransactions;
};

// Get all admin wallet transactions (commission earnings)
const getAdminCommissionTransactions = async ({ limit = 20, skip = 0, role, subscriberId }) => {
  const match = {};

  if (role && [ROLES.DOCTOR, ROLES.LABORATORY, ROLES.PHARMACY].includes(role)) {
    match.role = role;
  }

  if (subscriberId) {
    match.subscriber = subscriberId;
  }

  const transactions = await AdminWalletTransaction.find(match)
    .populate('subscriber', 'firstName lastName labName pharmacyName')
    .populate('payment', 'orderId paymentId status amount currency user userModel')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return transactions;
};

// Get transaction counts for Admin
const getAdminPaymentCount = async ({ status, type, role, userId }) => {
  const match = {};

  if (status && ['pending', 'success', 'failed'].includes(status)) {
    match.status = status;
  }

  if (type && ['appointment', 'lab_booking', 'pharmacy_booking'].includes(type)) {
    match.type = type;
  }

  if (role && [ROLES.PATIENT, ROLES.DOCTOR, ROLES.LABORATORY, ROLES.PHARMACY].includes(role)) {
    match.role = role;
  }

  if (userId) {
    match.user = userId;
  }

  return Payment.countDocuments(match);
};

const getAdminWalletTransactionCount = async ({ providerRole, providerId }) => {
  const match = {};

  if (providerRole && [ROLES.DOCTOR, ROLES.LABORATORY, ROLES.PHARMACY].includes(providerRole)) {
    match.providerRole = providerRole;
  }

  if (providerId) {
    match.provider = providerId;
  }

  return WalletTransaction.countDocuments(match);
};

const getAdminCommissionTransactionCount = async ({ role, subscriberId }) => {
  const match = {};

  if (role && [ROLES.DOCTOR, ROLES.LABORATORY, ROLES.PHARMACY].includes(role)) {
    match.role = role;
  }

  if (subscriberId) {
    match.subscriber = subscriberId;
  }

  return AdminWalletTransaction.countDocuments(match);
};

module.exports = {
  getPatientTransactions,
  getDoctorTransactions,
  getLaboratoryTransactions,
  getPharmacyTransactions,
  getPatientTransactionCount,
  getDoctorTransactionCount,
  getLaboratoryTransactionCount,
  getPharmacyTransactionCount,
  getAdminPayments,
  getAdminWalletTransactions,
  getAdminCommissionTransactions,
  getAdminPaymentCount,
  getAdminWalletTransactionCount,
  getAdminCommissionTransactionCount,
};

