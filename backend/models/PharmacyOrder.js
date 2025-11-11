const mongoose = require('mongoose');
const { PHARMACY_ORDER_STATUS } = require('../utils/constants');

const pharmacyOrderSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PharmacyLead',
      required: true,
      index: true,
    },
    quote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PharmacyQuote',
      required: true,
      index: true,
    },
    pharmacy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
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
        status: {
          type: String,
          enum: ['pending', 'preparing', 'ready', 'dispensed'],
          default: 'pending',
        },
      },
    ],
    status: {
      type: String,
      enum: Object.values(PHARMACY_ORDER_STATUS),
      default: PHARMACY_ORDER_STATUS.PENDING,
      index: true,
    },
    deliveryType: {
      type: String,
      enum: ['pickup', 'delivery'],
      default: 'pickup',
    },
    scheduledAt: {
      type: Date,
    },
    dispatchedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    payment: {
      orderId: { type: String, trim: true },
      paymentId: { type: String, trim: true },
      status: { type: String, default: 'pending' },
      amount: { type: Number, min: 0 },
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

pharmacyOrderSchema.index({ status: 1, createdAt: -1 });
pharmacyOrderSchema.index({ pharmacy: 1, status: 1 });

module.exports = mongoose.model('PharmacyOrder', pharmacyOrderSchema);

