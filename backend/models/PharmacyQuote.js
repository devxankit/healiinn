const mongoose = require('mongoose');
const { PHARMACY_LEAD_STATUS } = require('../utils/constants');

const pharmacyQuoteSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PharmacyLead',
      required: true,
      index: true,
    },
    pharmacy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
      index: true,
    },
    medicines: [
      {
        name: { type: String, trim: true },
        brand: { type: String, trim: true },
        dosage: { type: String, trim: true },
        quantity: { type: Number, min: 1, default: 1 },
        price: { type: Number, min: 0 },
        availability: { type: String, enum: ['in_stock', 'backorder'], default: 'in_stock' },
      },
    ],
    totalAmount: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: [PHARMACY_LEAD_STATUS.QUOTED, PHARMACY_LEAD_STATUS.ACCEPTED, PHARMACY_LEAD_STATUS.REJECTED],
      default: PHARMACY_LEAD_STATUS.QUOTED,
      index: true,
    },
    expiresAt: {
      type: Date,
    },
    acceptedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    remarks: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

pharmacyQuoteSchema.index({ pharmacy: 1, status: 1 });
pharmacyQuoteSchema.index({ lead: 1, createdAt: -1 });

module.exports = mongoose.model('PharmacyQuote', pharmacyQuoteSchema);

