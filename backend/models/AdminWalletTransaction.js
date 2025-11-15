const mongoose = require('mongoose');
const { ROLES } = require('../utils/constants');

const adminWalletTransactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: [ROLES.DOCTOR, ROLES.LABORATORY, ROLES.PHARMACY],
      required: true,
      index: true,
    },
    subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'subscriberModel',
      required: true,
      index: true,
    },
    subscriberModel: {
      type: String,
      enum: ['Doctor', 'Laboratory', 'Pharmacy'],
      required: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      index: true,
    },
    orderId: {
      type: String,
      trim: true,
      index: true,
    },
    description: {
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

module.exports = mongoose.model('AdminWalletTransaction', adminWalletTransactionSchema);


