const mongoose = require('mongoose');
const { LAB_ORDER_STATUS } = require('../utils/constants');

const labOrderSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabLead',
      required: true,
      index: true,
    },
    quote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabQuote',
      required: true,
      index: true,
    },
    laboratory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Laboratory',
      required: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    tests: [
      {
        testName: { type: String, trim: true },
        price: { type: Number, min: 0 },
        status: {
          type: String,
          enum: ['pending', 'collected', 'processing', 'completed'],
          default: 'pending',
        },
        reportUrl: { type: String, trim: true },
      },
    ],
    status: {
      type: String,
      enum: Object.values(LAB_ORDER_STATUS),
      default: LAB_ORDER_STATUS.PENDING,
      index: true,
    },
    scheduledAt: {
      type: Date,
    },
    completedAt: {
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

labOrderSchema.index({ status: 1, createdAt: -1 });
labOrderSchema.index({ laboratory: 1, status: 1 });

module.exports = mongoose.model('LabOrder', labOrderSchema);

