const mongoose = require('mongoose');
const { ROLES } = require('../utils/constants');

const earningsSchema = new mongoose.Schema(
  {
    [ROLES.DOCTOR]: { type: Number, default: 0 },
    [ROLES.LABORATORY]: { type: Number, default: 0 },
    [ROLES.PHARMACY]: { type: Number, default: 0 },
  },
  { _id: false }
);

const adminWalletSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'primary',
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    earningsByRole: {
      type: earningsSchema,
      default: () => ({}),
    },
    lastTransactionAt: {
      type: Date,
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

module.exports = mongoose.model('AdminWallet', adminWalletSchema);


