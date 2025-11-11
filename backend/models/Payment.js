const mongoose = require('mongoose');

const PAYMENT_STATUS = ['pending', 'success', 'failed'];

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, trim: true },
    paymentId: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    type: { type: String, enum: ['appointment'], default: 'appointment' },
    status: { type: String, enum: PAYMENT_STATUS, default: 'pending' },
    metadata: { type: mongoose.Schema.Types.Mixed },
    razorpayResponse: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

paymentSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
