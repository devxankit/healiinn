const asyncHandler = require('../../middleware/asyncHandler');
const { ROLES } = require('../../utils/constants');
const {
  getPatientTransactions,
  getPatientTransactionCount,
} = require('../../services/transactionService');

const ensureRole = (role, allowed) => {
  if (!allowed.includes(role)) {
    const error = new Error('You do not have access to this resource');
    error.status = 403;
    throw error;
  }
};

exports.listTransactions = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const status = req.query.status;
  const type = req.query.type;

  const [transactions, total] = await Promise.all([
    getPatientTransactions({
      patientId: req.auth.id,
      limit,
      skip,
      status,
      type,
    }),
    getPatientTransactionCount({
      patientId: req.auth.id,
      status,
      type,
    }),
  ]);

  res.json({
    success: true,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
    transactions,
  });
});

exports.getTransaction = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const Payment = require('../../models/Payment');
  const transaction = await Payment.findOne({
    _id: req.params.transactionId,
    user: req.auth.id,
    role: ROLES.PATIENT,
  })
    .lean();

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found',
    });
  }

  // Populate booking details
  const metadata = transaction.metadata || {};
  let bookingDetails = null;

  if (transaction.type === 'appointment' && metadata.appointmentId) {
    const Appointment = require('../../models/Appointment');
    bookingDetails = await Appointment.findById(metadata.appointmentId)
      .populate('doctor', 'firstName lastName specialization')
      .populate('clinic', 'name address')
      .lean();
  } else if (transaction.type === 'lab_booking' && metadata.labLeadId) {
    const LabLead = require('../../models/LabLead');
    bookingDetails = await LabLead.findById(metadata.labLeadId)
      .populate('laboratory', 'labName address phone')
      .populate('doctor', 'firstName lastName')
      .lean();
  } else if (transaction.type === 'pharmacy_booking' && metadata.pharmacyLeadId) {
    const PharmacyLead = require('../../models/PharmacyLead');
    bookingDetails = await PharmacyLead.findById(metadata.pharmacyLeadId)
      .populate('pharmacy', 'pharmacyName address phone')
      .populate('doctor', 'firstName lastName')
      .lean();
  }

  res.json({
    success: true,
    transaction: {
      ...transaction,
      bookingDetails,
    },
  });
});

