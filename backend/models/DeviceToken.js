const mongoose = require('mongoose');

const VALID_MODELS = ['Patient', 'Doctor', 'Laboratory', 'Pharmacy', 'Admin'];

const deviceTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'userModel',
      required: true,
      index: true,
    },
    userModel: {
      type: String,
      enum: VALID_MODELS,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'laboratory', 'pharmacy', 'admin'],
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: ['mobile', 'web'],
      required: true,
    },
    deviceType: {
      type: String,
      enum: ['android', 'ios', 'web'],
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

deviceTokenSchema.index({ user: 1, platform: 1 });
deviceTokenSchema.index({ role: 1, isActive: 1 });

module.exports = mongoose.model('DeviceToken', deviceTokenSchema);


