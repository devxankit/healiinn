const mongoose = require('mongoose');

const medicationTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, trim: true },
    frequency: { type: String, trim: true },
    duration: { type: String, trim: true },
    route: { type: String, trim: true },
    instructions: { type: String, trim: true },
    mealRelation: { type: String, enum: ['before_meal', 'after_meal', 'any'], default: 'any' },
  },
  { _id: false }
);

const investigationTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    code: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const prescriptionTemplateSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    medications: [medicationTemplateSchema],
    investigations: [investigationTemplateSchema],
    diagnosis: {
      type: String,
      trim: true,
    },
    advice: {
      type: String,
      trim: true,
    },
    lifestyleAdvice: {
      type: String,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    lastUsedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

prescriptionTemplateSchema.index({ doctor: 1, isActive: 1 });
prescriptionTemplateSchema.index({ doctor: 1, isDefault: 1 });

module.exports = mongoose.model('PrescriptionTemplate', prescriptionTemplateSchema);

