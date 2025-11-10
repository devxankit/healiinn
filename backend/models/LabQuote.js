const mongoose = require('mongoose');
const { LAB_LEAD_STATUS, LAB_ORDER_STATUS } = require('../utils/constants');

const labQuoteSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabLead',
      required: true,
      index: true,
    },
    laboratory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Laboratory',
      required: true,
      index: true,
    },
    tests: [
      {
        testName: { type: String, trim: true },
        price: { type: Number, min: 0 },
        tatHours: { type: Number, min: 0 },
        preparation: { type: String, trim: true },
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
      enum: [LAB_LEAD_STATUS.QUOTED, LAB_LEAD_STATUS.ACCEPTED, LAB_LEAD_STATUS.REJECTED],
      default: LAB_LEAD_STATUS.QUOTED,
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

labQuoteSchema.index({ laboratory: 1, status: 1 });
labQuoteSchema.index({ lead: 1, createdAt: -1 });

module.exports = mongoose.model('LabQuote', labQuoteSchema);

