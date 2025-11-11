const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { registerModel, ROLES } = require('../utils/getModelForRole');
const { APPROVAL_STATUS } = require('../utils/constants');

const doctorSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    specialization: { type: String, required: true, trim: true },
    gender: { type: String,required: true, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    licenseNumber: { type: String, required: true, trim: true, unique: true },
    experienceYears: { type: Number, min: 0 },
    education: [{ institution: String, degree: String, year: Number }],
    qualification: { type: String, trim: true },
    languages: [{ type: String, trim: true }],
    consultationModes: [{ type: String, enum: ['in_person', 'video', 'audio', 'chat'] }],
    clinicDetails: {
      name: { type: String, trim: true },
      address: {
        line1: { type: String, trim: true },
        line2: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        postalCode: { type: String, trim: true },
        country: { type: String, trim: true },
      },
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
            message: 'Clinic location coordinates must be [lng, lat].',
          },
        },
      },
      locationSource: {
        type: String,
        enum: ['manual', 'gps'],
      },
    },
    bio: { type: String, trim: true },
    consultationFee: { type: Number, min: 0 },
    availableTimings: [{ type: String, trim: true }],
    availability: [
      {
        day: { type: String, trim: true },
        startTime: { type: String, trim: true },
        endTime: { type: String, trim: true },
      },
    ],
    profileImage: { type: String, trim: true },
    documents: {
      license: { type: String, trim: true },
      identityProof: { type: String, trim: true },
      profileImage: { type: String, trim: true },
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
    rating: { type: Number, min: 0, max: 5, default: 0 },
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

doctorSchema.pre('save', async function encryptPassword(next) {
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

doctorSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

doctorSchema.index({ specialization: 1, status: 1 });
doctorSchema.index({ 'clinicDetails.location': '2dsphere' });

const Doctor = mongoose.model('Doctor', doctorSchema);

registerModel(ROLES.DOCTOR, Doctor);

module.exports = Doctor;


