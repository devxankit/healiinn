const mongoose = require('mongoose');
const { PHARMACY_LEAD_STATUS } = require('../utils/constants');

const pharmacyLeadSchema = new mongoose.Schema(
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
    preferredPharmacies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pharmacy',
      },
    ],
    status: {
      type: String,
      enum: Object.values(PHARMACY_LEAD_STATUS),
      default: PHARMACY_LEAD_STATUS.NEW,
      index: true,
    },
    medicines: [
      {
        name: { type: String, trim: true },
        dosage: { type: String, trim: true },
        quantity: { type: Number, min: 1, default: 1 },
        instructions: { type: String, trim: true },
        priority: { type: String, enum: ['normal', 'urgent'], default: 'normal' },
      },
    ],
    remarks: {
      type: String,
      trim: true,
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

pharmacyLeadSchema.index({ status: 1, createdAt: -1 });
pharmacyLeadSchema.index({ doctor: 1, status: 1 });
pharmacyLeadSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model('PharmacyLead', pharmacyLeadSchema);

