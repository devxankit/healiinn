const mongoose = require('mongoose');
const { ROLES } = require('../utils/constants');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userType: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'appointment',
        'consultation',
        'prescription',
        'order',
        'report',
        'request',
        'payment',
        'review',
        'support',
        'system',
        'wallet',
        'withdrawal',
        'approval',
        'rejection',
      ],
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    actionUrl: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    icon: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for efficient queries
notificationSchema.index({ userId: 1, userType: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, userType: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1, createdAt: -1 });

// Method to mark as read
notificationSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

