const mongoose = require('mongoose');
const { WITHDRAWAL_STATUS, ROLES } = require('../utils/constants');

const withdrawalRequestSchema = new mongoose.Schema(
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
    // Legacy support
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: Object.values(WITHDRAWAL_STATUS),
      default: WITHDRAWAL_STATUS.PENDING,
      index: true,
    },
    payoutMethod: {
      type: mongoose.Schema.Types.Mixed,
    },
    notes: { type: String, trim: true },
    adminNote: { type: String, trim: true },
    payoutReference: { type: String, trim: true },
    processedAt: { type: Date },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: Object.values(WITHDRAWAL_STATUS),
        },
        changedAt: { type: Date, default: Date.now },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: 'statusHistory.changedByRoleModel',
        },
        changedByRole: {
          type: String,
          enum: ['doctor', 'laboratory', 'pharmacy', 'admin'],
        },
        changedByRoleModel: {
          type: String,
          enum: ['Doctor', 'Laboratory', 'Pharmacy', 'Admin'],
        },
        note: { type: String, trim: true },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

withdrawalRequestSchema.index({ provider: 1, providerRole: 1, status: 1, createdAt: -1 });
// Legacy index
withdrawalRequestSchema.index({ doctor: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);


