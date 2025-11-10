const mongoose = require('mongoose');

const clinicSchema = new mongoose.Schema(
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
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: undefined,
      },
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    averageConsultationMinutes: {
      type: Number,
      min: 5,
      default: () => Number(process.env.TOKEN_QUEUE_DEFAULT_AVG_MINUTES) || 15,
    },
    bufferMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    isPrimary: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

clinicSchema.index({ doctor: 1, isPrimary: -1, createdAt: -1 });
clinicSchema.index({ slug: 1, doctor: 1 }, { unique: true, sparse: true });
clinicSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Clinic', clinicSchema);

