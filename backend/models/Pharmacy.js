const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { registerModel, ROLES } = require('../utils/getModelForRole');
const { APPROVAL_STATUS } = require('../utils/constants');

const pharmacySchema = new mongoose.Schema(
  {
    pharmacyName: { type: String, required: true, trim: true },
    ownerName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    licenseNumber: { type: String, required: true, trim: true, unique: true },
    gstNumber: { type: String, trim: true },
    address: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true },
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number],
          validate: {
            validator(value) {
              return Array.isArray(value) && value.length === 2;
            },
            message: 'Address location coordinates must be [lng, lat].',
          },
        },
      },
      locationSource: {
        type: String,
        enum: ['manual', 'gps'],
      },
    },
    deliveryOptions: [{ type: String, enum: ['pickup', 'delivery', 'both'] }],
    serviceRadiusKm: { type: Number, default: 0 },
    timings: [{ type: String, trim: true }],
    medicinesAvailable: [
      {
        name: { type: String, trim: true },
        brand: { type: String, trim: true },
        price: { type: Number, min: 0 },
        stock: { type: Number, min: 0 },
        expiryDate: { type: Date },
      },
    ],
    contactPerson: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
    },
    documents: {
      license: { type: String, trim: true },
      gstCertificate: { type: String, trim: true },
    },
    profileImage: { type: String, trim: true },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    status: {
      type: String,
      enum: Object.values(APPROVAL_STATUS),
      default: APPROVAL_STATUS.PENDING,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    rejectionReason: { type: String, trim: true },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_, ret) => {
        delete ret.password;
        return ret;
      },
    },
  }
);

pharmacySchema.pre('save', async function encryptPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

pharmacySchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

pharmacySchema.index({ status: 1, pharmacyName: 1 });
pharmacySchema.index({ 'address.location': '2dsphere' });

const Pharmacy = mongoose.model('Pharmacy', pharmacySchema);

registerModel(ROLES.PHARMACY, Pharmacy);

module.exports = Pharmacy;


