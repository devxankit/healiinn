const mongoose = require('mongoose');
const { ROLES } = require('../utils/constants');

const reportShareSchema = new mongoose.Schema(
  {
    sharedWith: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'reportShare.sharedWithModel',
      required: true,
      index: true,
    },
    sharedWithModel: {
      type: String,
      enum: ['Doctor', 'Patient'],
      required: true,
    },
    sharedWithRole: {
      type: String,
      enum: [ROLES.DOCTOR, ROLES.PATIENT],
      required: true,
    },
    shareType: {
      type: String,
      enum: ['direct', 'appointment_based'],
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      index: true,
    },
    sharedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    viewedAt: {
      type: Date,
    },
    viewed: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const labReportSchema = new mongoose.Schema(
  {
    labLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabLead',
      required: true,
      unique: true,
      index: true,
    },
    prescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      required: true,
      index: true,
    },
    consultation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consultation',
      index: true,
    },
    laboratory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Laboratory',
      required: true,
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
    reportFile: {
      fileUrl: { type: String, trim: true, required: true },
      fileName: { type: String, trim: true, required: true },
      mimeType: { type: String, trim: true, default: 'application/pdf' },
      fileSize: { type: Number }, // in bytes
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Laboratory',
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
    reportData: {
      tests: [
        {
          testName: { type: String, trim: true },
          result: { type: String, trim: true },
          value: { type: String, trim: true },
          unit: { type: String, trim: true },
          referenceRange: { type: String, trim: true },
          status: { type: String, enum: ['normal', 'abnormal', 'critical'], default: 'normal' },
          notes: { type: String, trim: true },
        },
      ],
      summary: { type: String, trim: true },
      recommendations: { type: String, trim: true },
      notes: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: ['uploaded', 'shared_with_patient', 'shared_with_doctor', 'completed'],
      default: 'uploaded',
      index: true,
    },
    sharedWith: [reportShareSchema],
    shareHistory: [
      {
        sharedWith: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: 'shareHistory.sharedWithModel',
        },
        sharedWithModel: {
          type: String,
          enum: ['Doctor', 'Patient'],
        },
        sharedWithRole: {
          type: String,
          enum: [ROLES.DOCTOR, ROLES.PATIENT],
        },
        shareType: {
          type: String,
          enum: ['direct', 'appointment_based'],
        },
        appointmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Appointment',
        },
        sharedAt: {
          type: Date,
          default: Date.now,
        },
        sharedBy: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: 'shareHistory.sharedByModel',
        },
        sharedByModel: {
          type: String,
          enum: ['Patient', 'Laboratory'],
        },
        sharedByRole: {
          type: String,
          enum: [ROLES.PATIENT, ROLES.LABORATORY],
        },
        notes: {
          type: String,
          trim: true,
        },
      },
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
labReportSchema.index({ patient: 1, createdAt: -1 });
labReportSchema.index({ doctor: 1, createdAt: -1 });
labReportSchema.index({ laboratory: 1, createdAt: -1 });
labReportSchema.index({ 'sharedWith.sharedWith': 1, 'sharedWith.sharedWithModel': 1 });
labReportSchema.index({ 'sharedWith.expiresAt': 1 }, { expireAfterSeconds: 0 }); // Auto-cleanup expired shares

module.exports = mongoose.model('LabReport', labReportSchema);

