const Payment = require('../../models/Payment');
const Appointment = require('../../models/Appointment');
const WalletTransaction = require('../../models/WalletTransaction');
const asyncHandler = require('../../middleware/asyncHandler');
const { createOrder, verifySignature } = require('../../services/razorpayService');
const { COMMISSION_RATE } = require('../../utils/constants');

exports.createPaymentOrder = asyncHandler(async (req, res) => {
  const { amount, currency = 'INR', receipt, notes, type = 'appointment', metadata } = req.body;

  if (amount === undefined) {
    return res.status(400).json({
      success: false,
      message: 'amount is required to create a Razorpay order.',
    });
  }

  const order = await createOrder({ amount, currency, receipt, notes });

  await Payment.create({
    orderId: order.id,
    amount,
    currency,
    type,
    status: 'pending',
    user: req.auth?.id,
    userId: req.auth?.id,
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
  if (payment.type !== 'appointment') {
    return;
  }

  const metadata = payment.metadata || {};
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

  await WalletTransaction.findOneAndUpdate(
    { appointment: appointmentId },
    {
      doctor: doctorId,
      patient: patientId,
      appointment: appointmentId,
      payment: payment._id,
      grossAmount,
      commissionAmount,
      netAmount,
      commissionRate,
      currency: appointment.billing?.currency || payment.currency || 'INR',
      description:
        metadata.description ||
        `Appointment payment ${appointmentId.toString()}`,
      creditedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};
