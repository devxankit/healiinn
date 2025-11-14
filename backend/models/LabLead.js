const mongoose = require('mongoose');
const { LAB_LEAD_STATUS, ROLES } = require('../utils/constants');

const labLeadSchema = new mongoose.Schema(
  {
    prescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      required: true,
      index: true,
    },
    consultation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consultation',
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
    preferredLaboratories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Laboratory',
      },
    ],
    status: {
      type: String,
      enum: Object.values(LAB_LEAD_STATUS),
      default: LAB_LEAD_STATUS.NEW,
      index: true,
    },
    tests: [
      {
        testName: { type: String, trim: true },
        description: { type: String, trim: true },
        notes: { type: String, trim: true },
        priority: { type: String, enum: ['normal', 'urgent'], default: 'normal' },
      },
    ],
    remarks: {
      type: String,
      trim: true,
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: Object.values(LAB_LEAD_STATUS),
          required: true,
        },
        notes: { type: String, trim: true },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
        },
        updatedByRole: {
          type: String,
          enum: Object.values(ROLES),
        },
        billingSnapshot: {
          totalAmount: { type: Number, min: 0 },
          homeCollectionCharge: { type: Number, min: 0 },
          currency: { type: String, trim: true },
        },
        reportSnapshot: {
          fileUrl: { type: String, trim: true },
          fileName: { type: String, trim: true },
          mimeType: { type: String, trim: true },
        },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    billingSummary: {
      totalAmount: { type: Number, min: 0 },
      homeCollectionCharge: { type: Number, min: 0 },
      currency: { type: String, trim: true, default: 'INR' },
      notes: { type: String, trim: true },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Laboratory',
      },
      updatedAt: { type: Date },
    },
    reportDetails: {
      fileUrl: { type: String, trim: true },
      fileName: { type: String, trim: true },
      mimeType: { type: String, trim: true },
      notes: { type: String, trim: true },
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Laboratory',
      },
      uploadedAt: { type: Date },
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

labLeadSchema.index({ status: 1, createdAt: -1 });
labLeadSchema.index({ doctor: 1, status: 1 });
labLeadSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model('LabLead', labLeadSchema);

