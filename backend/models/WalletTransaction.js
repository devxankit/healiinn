const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    grossAmount: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    netAmount: { type: Number, required: true },
    commissionRate: { type: Number, default: 0.1 },
    currency: { type: String, default: 'INR' },
    description: { type: String, trim: true },
    creditedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

walletTransactionSchema.index({ doctor: 1, createdAt: -1 });
walletTransactionSchema.index({ doctor: 1, creditedAt: -1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);


