const mongoose = require('mongoose');
const { TOKEN_STATUS } = require('../utils/constants');

const tokenHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: Object.values(TOKEN_STATUS),
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
    },
    actorRole: {
      type: String,
      enum: ['doctor', 'patient', 'admin'],
    },
  },
  { _id: false }
);

const sessionTokenSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClinicSession',
      required: true,
      index: true,
    },
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
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      index: true,
    },
    paymentId: {
      type: String,
      trim: true,
    },
    tokenNumber: {
      type: Number,
      required: true,
      index: true,
    },
    priority: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    priorityReason: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(TOKEN_STATUS),
      default: TOKEN_STATUS.WAITING,
      index: true,
    },
    eta: {
      type: Date,
      index: true,
    },
    calledAt: {
      type: Date,
    },
    visitedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    skippedAt: {
      type: Date,
    },
    recalledAt: {
      type: Date,
    },
    recallCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dynamicBufferMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    noShowAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    checkinAt: {
      type: Date,
    },
    history: [tokenHistorySchema],
    vitals: {
      heightCm: Number,
      weightKg: Number,
      systolic: Number,
      diastolic: Number,
      pulse: Number,
      temperatureC: Number,
      spo2: Number,
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

sessionTokenSchema.index({ session: 1, tokenNumber: 1 }, { unique: true });
sessionTokenSchema.index({ patient: 1, session: 1 }, { unique: true });
sessionTokenSchema.index({ status: 1, eta: 1 });

module.exports = mongoose.model('SessionToken', sessionTokenSchema);

