const mongoose = require('mongoose');

const PAYMENT_STATUS = ['pending', 'success', 'failed'];

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, trim: true },
    paymentId: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    user: { type: mongoose.Schema.Types.ObjectId, refPath: 'userModel', index: true },
    userModel: {
      type: String,
      enum: ['Patient', 'Doctor', 'Laboratory', 'Pharmacy', 'Admin'],
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'laboratory', 'pharmacy', 'admin'],
    },
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
