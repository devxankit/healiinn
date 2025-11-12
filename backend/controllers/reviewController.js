const asyncHandler = require('../middleware/asyncHandler');
const { getModelForRole, ROLES } = require('../utils/getModelForRole');
const Review = require('../models/Review');

const TARGET_ROLES = [ROLES.DOCTOR, ROLES.LABORATORY, ROLES.PHARMACY];

const normalizeRole = (role) => (role ? String(role).toLowerCase() : '');

const sanitizeReview = (review) => {
  if (!review) {
    return review;
  }
  const data = review.toObject ? review.toObject() : review;

  return {
    id: data._id,
    patient: data.patient
      ? {
          id: data.patient._id,
          firstName: data.patient.firstName,
          lastName: data.patient.lastName,
          gender: data.patient.gender || null,
          profileImage: data.patient.profileImage || null,
        }
      : null,
    target: data.target,
    targetRole: data.targetRole,
    rating: data.rating,
    comment: data.comment || null,
    reply: data.reply
      ? {
          message: data.reply.message,
          repliedAt: data.reply.repliedAt || null,
          repliedByRole: data.reply.repliedByRole || null,
        }
      : null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

exports.createReview = asyncHandler(async (req, res) => {
  const { targetRole, targetId, rating, comment } = req.body;

  if (!targetRole || !targetId || rating === undefined) {
    return res.status(400).json({
      success: false,
      message: 'targetRole, targetId and rating are required.',
    });
  }

  const normalizedRole = normalizeRole(targetRole);

  if (!TARGET_ROLES.includes(normalizedRole)) {
    return res.status(400).json({
      success: false,
      message: 'targetRole must be one of doctor, laboratory, pharmacy.',
    });
  }

  const numericRating = Number(rating);
  if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({
      success: false,
      message: 'rating must be a number between 1 and 5.',
    });
  }

  const Model = getModelForRole(normalizedRole);
  const target = await Model.findById(targetId);

  if (!target) {
    return res.status(404).json({
      success: false,
      message: `${normalizedRole} not found.`,
    });
  }

  const existing = await Review.findOne({
    patient: req.auth.id,
    targetRole: normalizedRole,
    target: targetId,
  });

  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'You have already submitted a review for this profile.',
    });
  }

  const review = await Review.create({
    patient: req.auth.id,
    target: targetId,
    targetRole: normalizedRole,
    rating: numericRating,
    comment,
  });

  const populated = await review.populate('patient', 'firstName lastName gender profileImage');

  res.status(201).json({
    success: true,
    review: sanitizeReview(populated),
  });
});

exports.listPatientReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ patient: req.auth.id })
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    reviews: reviews.map(sanitizeReview),
  });
});

exports.listTargetReviews = asyncHandler(async (req, res) => {
  const { role, targetId } = req.params;
  const normalizedRole = normalizeRole(role);

  if (!TARGET_ROLES.includes(normalizedRole)) {
    return res.status(400).json({
      success: false,
      message: 'role must be one of doctor, laboratory, pharmacy.',
    });
  }

  const reviews = await Review.find({ targetRole: normalizedRole, target: targetId })
    .populate('patient', 'firstName lastName gender profileImage')
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    reviews: reviews.map(sanitizeReview),
  });
});

exports.replyToReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: 'message is required.',
    });
  }

  const review = await Review.findById(reviewId);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found.',
    });
  }

  const requesterRole = req.auth.role;
  const allowedRole = review.targetRole;

  if (requesterRole !== allowedRole) {
    return res.status(403).json({
      success: false,
      message: 'You are not allowed to reply to this review.',
    });
  }

  if (String(review.target) !== String(req.auth.id)) {
    return res.status(403).json({
      success: false,
      message: 'You can only reply to reviews left on your profile.',
    });
  }

  review.reply = {
    message: message.trim(),
    repliedBy: req.auth.id,
    repliedByRole: requesterRole,
    repliedAt: new Date(),
    repliedByRoleModel:
      requesterRole === ROLES.DOCTOR
        ? 'Doctor'
        : requesterRole === ROLES.LABORATORY
        ? 'Laboratory'
        : 'Pharmacy',
  };

  await review.save();

  const populated = await review.populate('patient', 'firstName lastName gender profileImage');

  res.json({
    success: true,
    review: sanitizeReview(populated),
  });
});


