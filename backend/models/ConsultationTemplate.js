const mongoose = require('mongoose');

const consultationTemplateSchema = new mongoose.Schema(
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

consultationTemplateSchema.index({ doctor: 1, isActive: 1 });
consultationTemplateSchema.index({ doctor: 1, isDefault: 1 });

module.exports = mongoose.model('ConsultationTemplate', consultationTemplateSchema);

