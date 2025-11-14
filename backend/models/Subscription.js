const mongoose = require('mongoose');
const { ROLES, SUBSCRIPTION_STATUS } = require('../utils/constants');

const subscriptionSchema = new mongoose.Schema(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'subscriberModel',
      index: true,
    },
    subscriberModel: {
      type: String,
      required: true,
      enum: ['Laboratory', 'Pharmacy', 'Doctor'],
    },
    subscriberRole: {
      type: String,
      required: true,
      enum: [ROLES.LABORATORY, ROLES.PHARMACY, ROLES.DOCTOR],
      index: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
      index: true,
    },
    durationKey: {
      type: String,
      required: true,
      trim: true,
    },
    durationInDays: {
      type: Number,
      required: true,
      min: 1,
    },
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
    status: {
      type: String,
      enum: Object.values(SUBSCRIPTION_STATUS),
      default: SUBSCRIPTION_STATUS.PENDING,
      index: true,
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
    startsAt: {
      type: Date,
      index: true,
    },
    endsAt: {
      type: Date,
      index: true,
    },
    renewedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
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

subscriptionSchema.index({ subscriber: 1, status: 1 });
subscriptionSchema.index({ subscriber: 1, endsAt: 1 });
subscriptionSchema.index({ status: 1, endsAt: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);


