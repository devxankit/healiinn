const mongoose = require('mongoose');

const NOTIFICATION_CHANNELS = ['in_app', 'email', 'sms', 'push'];
const NOTIFICATION_PRIORITY = ['low', 'normal', 'high'];
const NOTIFICATION_STATUS = ['pending', 'sent', 'failed'];

const recipientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'laboratory', 'pharmacy', 'admin'],
      required: true,
    },
    deliveryStatus: {
      channel: { type: String, enum: NOTIFICATION_CHANNELS },
      status: { type: String, enum: NOTIFICATION_STATUS, default: 'pending' },
      error: { type: String, trim: true },
    },
    readAt: { type: Date },
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, index: true },
    title: { type: String, trim: true, required: true },
    message: { type: String, trim: true, required: true },
    type: { type: String, trim: true },
    priority: { type: String, enum: NOTIFICATION_PRIORITY, default: 'normal' },
    channels: [{ type: String, enum: NOTIFICATION_CHANNELS, default: 'in_app' }],
    recipients: { type: [recipientSchema], required: true },
    isRead: { type: Boolean, default: false },
    data: { type: mongoose.Schema.Types.Mixed },
    sentAt: { type: Date },
    expiresAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

notificationSchema.index({ 'recipients.user': 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { expiresAt: { $exists: true } } });

module.exports = mongoose.model('Notification', notificationSchema);
