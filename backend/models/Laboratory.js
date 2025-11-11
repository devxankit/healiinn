const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { registerModel, ROLES } = require('../utils/getModelForRole');
const { APPROVAL_STATUS } = require('../utils/constants');

const laboratorySchema = new mongoose.Schema(
  {
    labName: { type: String, required: true, trim: true },
    ownerName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    licenseNumber: { type: String, required: true, trim: true, unique: true },
    certifications: [{ type: String, trim: true }],
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
    servicesOffered: [{ type: String, trim: true }],
    testsOffered: [
      {
        testName: { type: String, trim: true },
        price: { type: Number, min: 0 },
        description: { type: String, trim: true },
      },
    ],
    timings: [{ type: String, trim: true }],
    contactPerson: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
    },
    documents: {
      license: { type: String, trim: true },
      accreditation: { type: String, trim: true },
    },
    profileImage: { type: String, trim: true },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    operatingHours: {
      opening: { type: String, trim: true },
      closing: { type: String, trim: true },
      days: [{ type: String }],
    },
    status: {
      type: String,
      enum: Object.values(APPROVAL_STATUS),
      default: APPROVAL_STATUS.PENDING,
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

laboratorySchema.pre('save', async function encryptPassword(next) {
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

laboratorySchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

laboratorySchema.index({ status: 1, labName: 1 });
laboratorySchema.index({ 'address.location': '2dsphere' });

const Laboratory = mongoose.model('Laboratory', laboratorySchema);

registerModel(ROLES.LABORATORY, Laboratory);

module.exports = Laboratory;


