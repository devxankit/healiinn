const mongoose = require('mongoose');
const { CONSULTATION_STATUS } = require('../utils/constants');

const vitalsSchema = new mongoose.Schema(
  {
    heightCm: Number,
    weightKg: Number,
    systolic: Number,
    diastolic: Number,
    pulse: Number,
    temperatureC: Number,
    bmi: Number,
    respirationRate: Number,
    spo2: Number,
  },
  { _id: false }
);

const consultationSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClinicSession',
      required: true,
      index: true,
    },
    token: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SessionToken',
      required: true,
      unique: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(CONSULTATION_STATUS),
      default: CONSULTATION_STATUS.IN_PROGRESS,
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    notes: {
      subjective: { type: String, trim: true },
      objective: { type: String, trim: true },
      assessment: { type: String, trim: true },
      plan: { type: String, trim: true },
    },
    diagnosis: {
      primary: { type: String, trim: true },
      secondary: [{ type: String, trim: true }],
    },
    vitals: vitalsSchema,
    followUpAt: {
      type: Date,
    },
    pausedAt: {
      type: Date,
    },
    resumedAt: {
      type: Date,
    },
    pauseHistory: [
      {
        pausedAt: { type: Date, required: true },
        resumedAt: { type: Date },
        reason: { type: String, trim: true },
        durationMinutes: { type: Number },
      },
    ],
    attachments: [
      {
        label: { type: String, trim: true },
        url: { type: String, required: true, trim: true },
        fileName: { type: String, trim: true },
        mimeType: { type: String, trim: true },
        fileSize: { type: Number },
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
      },
    ],
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ConsultationTemplate',
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

consultationSchema.index({ doctor: 1, createdAt: -1 });
consultationSchema.index({ patient: 1, createdAt: -1 });
consultationSchema.index({ doctor: 1, status: 1, createdAt: -1 }); // For doctor consultations with status filter
consultationSchema.index({ patient: 1, status: 1, createdAt: -1 }); // For patient consultations with status filter
consultationSchema.index({ appointment: 1 }); // For appointment-based queries
consultationSchema.index({ status: 1, createdAt: -1 }); // For status-based queries

module.exports = mongoose.model('Consultation', consultationSchema);

