const mongoose = require('mongoose');
const { ROLES } = require('../utils/constants');

const TARGET_ROLES = [ROLES.DOCTOR, ROLES.LABORATORY, ROLES.PHARMACY];

const replySchema = new mongoose.Schema(
  {
    message: { type: String, trim: true },
    repliedBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'reply.repliedByRoleModel' },
    repliedByRole: { type: String, enum: TARGET_ROLES },
    repliedAt: { type: Date },
    repliedByRoleModel: {
      type: String,
      enum: ['Doctor', 'Laboratory', 'Pharmacy'],
    },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    targetRole: {
      type: String,
      enum: TARGET_ROLES,
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
    reply: replySchema,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

reviewSchema.index({ patient: 1, targetRole: 1, target: 1 }, { unique: true });
reviewSchema.index({ targetRole: 1, target: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);


