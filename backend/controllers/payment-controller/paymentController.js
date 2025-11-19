const Payment = require('../../models/Payment');
const Appointment = require('../../models/Appointment');
const LabLead = require('../../models/LabLead');
const PharmacyLead = require('../../models/PharmacyLead');
const asyncHandler = require('../../middleware/asyncHandler');
const { createOrder, verifySignature } = require('../../services/razorpayService');
const { COMMISSION_RATE, ROLES, LAB_LEAD_STATUS, PHARMACY_LEAD_STATUS } = require('../../utils/constants');
const { createWalletTransaction } = require('../../services/walletService');
const { notifyLabLeadStatusChange, notifyPharmacyLeadStatusChange } = require('../../services/notificationEvents');

const ROLE_TO_MODEL = {
  [ROLES.PATIENT]: 'Patient',
  [ROLES.DOCTOR]: 'Doctor',
  [ROLES.LABORATORY]: 'Laboratory',
  [ROLES.PHARMACY]: 'Pharmacy',
  [ROLES.ADMIN]: 'Admin',
};

exports.createPaymentOrder = asyncHandler(async (req, res) => {
  const { amount, currency = 'INR', receipt, notes, type = 'appointment', metadata } = req.body;

  if (amount === undefined) {
    return res.status(400).json({
      success: false,
      message: 'amount is required to create a Razorpay order.',
    });
  }

  const order = await createOrder({ amount, currency, receipt, notes });

  const userId = req.auth?.id;
  const role = req.auth?.role;
  const userModel = role ? ROLE_TO_MODEL[role] : undefined;

  await Payment.create({
    orderId: order.id,
    amount,
    currency,
    type,
    status: 'pending',
    user: userId,
    userModel,
    role,
    metadata,
    razorpayResponse: order,
  });

  res.status(201).json({
    success: true,
    data: order,
  });
});

exports.verifyPaymentSignature = asyncHandler(async (req, res) => {
  const { orderId, paymentId, signature } = req.body;

  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({
      success: false,
      message: 'orderId, paymentId, and signature are required for verification.',
    });
  }

  const isValid = verifySignature({ orderId, paymentId, signature });

  if (!isValid) {
    await Payment.findOneAndUpdate(
      { orderId },
      {
        paymentId,
        status: 'failed',
        'metadata.signature': signature,
      }
    );
    return res.status(400).json({
      success: false,
      message: 'Invalid payment signature.',
    });
  }

  const payment = await Payment.findOneAndUpdate(
    { orderId },
    {
      paymentId,
      status: 'success',
      'metadata.signature': signature,
    },
    { new: true }
  );

  if (payment) {
    await handlePostPaymentProcessing({ payment, paymentId, orderId });
  }

  res.status(200).json({
    success: true,
    message: 'Signature verified successfully.',
  });
});

const handlePostPaymentProcessing = async ({ payment, paymentId, orderId }) => {
  const metadata = payment.metadata || {};
  const paymentType = payment.type || 'appointment';

  // Handle Appointment Payment (Doctor)
  if (paymentType === 'appointment') {
    const appointmentId = metadata.appointmentId;
    if (!appointmentId) {
      return;
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return;
    }

    const doctorId = metadata.doctorId || appointment.doctor;
    const patientId = metadata.patientId || appointment.patient;
    if (!doctorId || !patientId) {
      return;
    }

    const grossAmount =
      Number(metadata.amount) ||
      Number(appointment.billing?.amount) ||
      Number(payment.amount);

    if (!grossAmount || Number.isNaN(grossAmount)) {
      return;
    }

    const commissionRate =
      typeof metadata.commissionRate === 'number'
        ? metadata.commissionRate
        : COMMISSION_RATE;

    const commissionAmount = Number((grossAmount * commissionRate).toFixed(2));
    const netAmount = Number((grossAmount - commissionAmount).toFixed(2));

    await Appointment.findByIdAndUpdate(appointmentId, {
      $set: {
        'billing.paid': true,
        'billing.paymentStatus': 'paid',
        'billing.paymentId': paymentId,
        'billing.transactionId': paymentId,
        'billing.razorpayPaymentId': paymentId,
        'billing.razorpayOrderId': orderId,
        'billing.paidAt': new Date(),
        'billing.commissionRate': commissionRate,
        'billing.commissionAmount': commissionAmount,
        'billing.netAmount': netAmount,
      },
    });

    // Create wallet transaction
    await createWalletTransaction({
      providerId: doctorId,
      providerRole: ROLES.DOCTOR,
      patientId,
      bookingId: appointmentId,
      bookingModel: 'Appointment',
      bookingType: 'appointment',
      paymentId: payment._id,
      grossAmount,
      commissionRate,
      currency: appointment.billing?.currency || payment.currency || 'INR',
      description: metadata.description || `Appointment payment ${appointmentId.toString()}`,
    });
  }

  // Handle Lab Booking Payment (Laboratory)
  else if (paymentType === 'lab_booking') {
    const labLeadId = metadata.labLeadId;
    if (!labLeadId) {
      return;
    }

    const labLead = await LabLead.findById(labLeadId).populate('preferredLaboratories');
    if (!labLead) {
      return;
    }

    // Validate that lab has accepted the request
    if (labLead.status !== LAB_LEAD_STATUS.ACCEPTED) {
      console.error(`Lab lead ${labLeadId} is not accepted. Current status: ${labLead.status}`);
      return;
    }

    // Validate that billing summary exists
    if (!labLead.billingSummary || !labLead.billingSummary.totalAmount) {
      console.error(`Lab lead ${labLeadId} does not have billing summary`);
      return;
    }

    // Get the laboratory that accepted the booking
    const laboratoryId = metadata.laboratoryId || labLead.acceptedBy || (labLead.preferredLaboratories && labLead.preferredLaboratories[0]?._id);
    if (!laboratoryId) {
      return;
    }

    const patientId = metadata.patientId || labLead.patient;
    if (!patientId) {
      return;
    }

    const expectedAmount = Number(labLead.billingSummary.totalAmount) + (Number(labLead.billingSummary.homeCollectionCharge) || 0);
    const grossAmount =
      Number(metadata.amount) ||
      Number(payment.amount);

    // Validate payment amount matches billing summary (allow small tolerance for rounding)
    if (Math.abs(grossAmount - expectedAmount) > 0.01) {
      console.error(`Payment amount mismatch for lab lead ${labLeadId}. Expected: ${expectedAmount}, Got: ${grossAmount}`);
      return;
    }

    if (!grossAmount || Number.isNaN(grossAmount)) {
      return;
    }

    const commissionRate =
      typeof metadata.commissionRate === 'number'
        ? metadata.commissionRate
        : COMMISSION_RATE;

    const commissionAmount = Number((grossAmount * commissionRate).toFixed(2));
    const netAmount = Number((grossAmount - commissionAmount).toFixed(2));

    await LabLead.findByIdAndUpdate(labLeadId, {
      $set: {
        'payment.paid': true,
        'payment.paymentStatus': 'paid',
        'payment.paymentId': paymentId,
        'payment.transactionId': paymentId,
        'payment.razorpayPaymentId': paymentId,
        'payment.razorpayOrderId': orderId,
        'payment.paidAt': new Date(),
        'payment.commissionRate': commissionRate,
        'payment.commissionAmount': commissionAmount,
        'payment.netAmount': netAmount,
      },
    });

    // Create wallet transaction
    await createWalletTransaction({
      providerId: laboratoryId,
      providerRole: ROLES.LABORATORY,
      patientId,
      bookingId: labLeadId,
      bookingModel: 'LabLead',
      bookingType: 'lab_booking',
      paymentId: payment._id,
      grossAmount,
      commissionRate,
      currency: labLead.billingSummary?.currency || payment.currency || 'INR',
      description: metadata.description || `Lab booking payment ${labLeadId.toString()}`,
    });

    // Notify patient about payment confirmation
    try {
      await notifyLabLeadStatusChange({
        patientId,
        laboratoryId,
        status: 'payment_confirmed',
        leadId: labLeadId,
        notes: 'Payment confirmed. Your lab booking is now confirmed.',
      });
    } catch (notificationError) {
      console.error('Failed to send lab payment confirmation notification:', notificationError);
    }
  }

  // Handle Pharmacy Booking Payment (Pharmacy)
  else if (paymentType === 'pharmacy_booking') {
    const pharmacyLeadId = metadata.pharmacyLeadId;
    if (!pharmacyLeadId) {
      return;
    }

    const pharmacyLead = await PharmacyLead.findById(pharmacyLeadId).populate('preferredPharmacies');
    if (!pharmacyLead) {
      return;
    }

    // Validate that pharmacy has accepted the request
    if (pharmacyLead.status !== PHARMACY_LEAD_STATUS.ACCEPTED) {
      console.error(`Pharmacy lead ${pharmacyLeadId} is not accepted. Current status: ${pharmacyLead.status}`);
      return;
    }

    // Validate that billing summary exists
    if (!pharmacyLead.billingSummary || !pharmacyLead.billingSummary.totalAmount) {
      console.error(`Pharmacy lead ${pharmacyLeadId} does not have billing summary`);
      return;
    }

    // Get the pharmacy that accepted the booking
    const pharmacyId = metadata.pharmacyId || pharmacyLead.acceptedBy || (pharmacyLead.preferredPharmacies && pharmacyLead.preferredPharmacies[0]?._id);
    if (!pharmacyId) {
      return;
    }

    const patientId = metadata.patientId || pharmacyLead.patient;
    if (!patientId) {
      return;
    }

    const expectedAmount = Number(pharmacyLead.billingSummary.totalAmount) + (Number(pharmacyLead.billingSummary.deliveryCharge) || 0);
    const grossAmount =
      Number(metadata.amount) ||
      Number(payment.amount);

    // Validate payment amount matches billing summary (allow small tolerance for rounding)
    if (Math.abs(grossAmount - expectedAmount) > 0.01) {
      console.error(`Payment amount mismatch for pharmacy lead ${pharmacyLeadId}. Expected: ${expectedAmount}, Got: ${grossAmount}`);
      return;
    }

    if (!grossAmount || Number.isNaN(grossAmount)) {
      return;
    }

    const commissionRate =
      typeof metadata.commissionRate === 'number'
        ? metadata.commissionRate
        : COMMISSION_RATE;

    const commissionAmount = Number((grossAmount * commissionRate).toFixed(2));
    const netAmount = Number((grossAmount - commissionAmount).toFixed(2));

    await PharmacyLead.findByIdAndUpdate(pharmacyLeadId, {
      $set: {
        'payment.paid': true,
        'payment.paymentStatus': 'paid',
        'payment.paymentId': paymentId,
        'payment.transactionId': paymentId,
        'payment.razorpayPaymentId': paymentId,
        'payment.razorpayOrderId': orderId,
        'payment.paidAt': new Date(),
        'payment.commissionRate': commissionRate,
        'payment.commissionAmount': commissionAmount,
        'payment.netAmount': netAmount,
      },
    });

    // Create wallet transaction
    await createWalletTransaction({
      providerId: pharmacyId,
      providerRole: ROLES.PHARMACY,
      patientId,
      bookingId: pharmacyLeadId,
      bookingModel: 'PharmacyLead',
      bookingType: 'pharmacy_booking',
      paymentId: payment._id,
      grossAmount,
      commissionRate,
      currency: pharmacyLead.billingSummary?.currency || payment.currency || 'INR',
      description: metadata.description || `Pharmacy booking payment ${pharmacyLeadId.toString()}`,
    });

    // Notify patient about payment confirmation
    try {
      await notifyPharmacyLeadStatusChange({
        patientId,
        pharmacyId,
        status: 'payment_confirmed',
        leadId: pharmacyLeadId,
        notes: 'Payment confirmed. Your pharmacy order is now confirmed.',
      });
    } catch (notificationError) {
      console.error('Failed to send pharmacy payment confirmation notification:', notificationError);
    }
  }
};
