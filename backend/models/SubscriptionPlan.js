const mongoose = require('mongoose');
const { ROLES } = require('../utils/constants');

const durationSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      trim: true,
      required: true,
    },
    label: {
      type: String,
      trim: true,
    },
    durationInDays: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

durationSchema.index({ key: 1 }, { unique: true, sparse: true });

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    applicableRoles: [
      {
        type: String,
        enum: [ROLES.LABORATORY, ROLES.PHARMACY, ROLES.DOCTOR],
      },
    ],
    durations: {
      type: [durationSchema],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: 'At least one duration configuration is required.',
      },
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

subscriptionPlanSchema.index({ isActive: 1 });
subscriptionPlanSchema.index({ applicableRoles: 1 });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);


