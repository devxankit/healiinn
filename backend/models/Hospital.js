const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    address: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true, index: true },
      state: { type: String, trim: true, index: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    image: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    doctors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
      },
    ],
    specialties: [
      {
        type: String,
        trim: true,
      },
    ],
    contact: {
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
      website: { type: String, trim: true },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
hospitalSchema.index({ name: 1 });
hospitalSchema.index({ 'address.city': 1, 'address.state': 1 });
hospitalSchema.index({ isActive: 1 });

const Hospital = mongoose.model('Hospital', hospitalSchema);

module.exports = Hospital;

