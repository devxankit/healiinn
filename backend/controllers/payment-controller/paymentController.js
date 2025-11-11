const Payment = require('../../models/Payment');
const asyncHandler = require('../../middleware/asyncHandler');
const { createOrder, verifySignature } = require('../../services/razorpayService');

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

  await Payment.findOneAndUpdate(
    { orderId },
    {
      paymentId,
      status: 'success',
      'metadata.signature': signature,
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: 'Signature verified successfully.',
  });
});
