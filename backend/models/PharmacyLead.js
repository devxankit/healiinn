const mongoose = require('mongoose');
const { PHARMACY_LEAD_STATUS, ROLES } = require('../utils/constants');

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
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      index: true,
    },
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
        available: { type: Boolean, default: true }, // Pharmacy sets this
        price: { type: Number, min: 0 }, // Pharmacy sets price per medicine
        availableQuantity: { type: Number, min: 0 }, // Available stock
        availabilityNotes: { type: String, trim: true }, // Pharmacy notes about availability
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
          enum: Object.values(PHARMACY_LEAD_STATUS),
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
          deliveryCharge: { type: Number, min: 0 },
          currency: { type: String, trim: true },
        },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    billingSummary: {
      totalAmount: { type: Number, min: 0 },
      deliveryCharge: { type: Number, min: 0 },
      currency: { type: String, trim: true, default: 'INR' },
      notes: { type: String, trim: true },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pharmacy',
      },
      updatedAt: { type: Date },
    },
    payment: {
      paid: { type: Boolean, default: false },
      paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
      paymentId: { type: String, trim: true },
      transactionId: { type: String, trim: true },
      razorpayOrderId: { type: String, trim: true },
      razorpayPaymentId: { type: String, trim: true },
      razorpaySignature: { type: String, trim: true },
      paidAt: { type: Date },
      commissionRate: { type: Number, default: 0.1 },
      commissionAmount: { type: Number, default: 0 },
      netAmount: { type: Number, default: 0 },
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

// Indexes for query optimization
pharmacyLeadSchema.index({ status: 1, createdAt: -1 });
pharmacyLeadSchema.index({ doctor: 1, status: 1 });
pharmacyLeadSchema.index({ patient: 1, createdAt: -1 });
pharmacyLeadSchema.index({ acceptedBy: 1, status: 1, createdAt: -1 });
pharmacyLeadSchema.index({ preferredPharmacies: 1, status: 1, createdAt: -1 });
pharmacyLeadSchema.index({ acceptedBy: 1, createdAt: -1 });
pharmacyLeadSchema.index({ patient: 1, acceptedBy: 1, status: 1 });
pharmacyLeadSchema.index({ 'billingSummary.totalAmount': 1 });
pharmacyLeadSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('PharmacyLead', pharmacyLeadSchema);

