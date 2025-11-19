const mongoose = require('mongoose');
const { SESSION_STATUS } = require('../utils/constants');

const sessionStatsSchema = new mongoose.Schema(
  {
    totalTokens: { type: Number, default: 0 },
    issuedTokens: { type: Number, default: 0 },
    completedTokens: { type: Number, default: 0 },
    skippedTokens: { type: Number, default: 0 },
    noShowTokens: { type: Number, default: 0 },
  },
  { _id: false }
);

const clinicSessionSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
    clinic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
      index: true,
    },
    averageConsultationMinutes: {
      type: Number,
      min: 5,
      max: 60,
      required: false, // Will be set by doctor before starting session
    },
    maxTokens: {
      type: Number,
      min: 1,
    },
    bufferMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(SESSION_STATUS),
      default: SESSION_STATUS.SCHEDULED,
      index: true,
    },
    currentTokenNumber: {
      type: Number,
      default: null,
    },
    nextTokenNumber: {
      type: Number,
      default: 1,
    },
    paused: {
      type: Boolean,
      default: false,
      index: true,
    },
    pausedAt: {
      type: Date,
    },
    pauseReason: {
      type: String,
      trim: true,
    },
    resumeAt: {
      type: Date,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    stats: {
      type: sessionStatsSchema,
      default: () => ({}),
    },
    notes: {
      type: String,
      trim: true,
    },
    lastBroadcastAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

clinicSessionSchema.index({ doctor: 1, status: 1, startTime: 1 });
clinicSessionSchema.index({ clinic: 1, startTime: -1 });

module.exports = mongoose.model('ClinicSession', clinicSessionSchema);

