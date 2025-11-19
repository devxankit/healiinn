const mongoose = require('mongoose');
const { ROLES } = require('../utils/constants');

const walletTransactionSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'providerModel',
      required: true,
      index: true,
    },
    providerModel: {
      type: String,
      enum: ['Doctor', 'Laboratory', 'Pharmacy'],
      required: true,
      index: true,
    },
    providerRole: {
      type: String,
      enum: [ROLES.DOCTOR, ROLES.LABORATORY, ROLES.PHARMACY],
      required: true,
      index: true,
    },
    // Legacy support - keeping doctor field for backward compatibility
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    // Can be appointment, labLead, or pharmacyLead
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'bookingModel',
      required: true,
      index: true,
    },
    bookingModel: {
      type: String,
      enum: ['Appointment', 'LabLead', 'PharmacyLead'],
      required: true,
    },
    // Legacy support
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      index: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      index: true,
    },
    bookingType: {
      type: String,
      enum: ['appointment', 'lab_booking', 'pharmacy_booking'],
      required: true,
      default: 'appointment',
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

// Indexes for all roles
walletTransactionSchema.index({ provider: 1, providerRole: 1, createdAt: -1 });
walletTransactionSchema.index({ provider: 1, providerRole: 1, creditedAt: -1 });
walletTransactionSchema.index({ booking: 1, bookingModel: 1 }, { unique: true });
// Legacy indexes
walletTransactionSchema.index({ doctor: 1, createdAt: -1 });
walletTransactionSchema.index({ doctor: 1, creditedAt: -1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);


