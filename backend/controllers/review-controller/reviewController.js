const asyncHandler = require('../../middleware/asyncHandler');
const { getModelForRole, ROLES } = require('../../utils/getModelForRole');
const Review = require('../../models/Review');

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

// Get reviews for provider (doctor, lab, pharmacy) - their own reviews
exports.getProviderReviews = asyncHandler(async (req, res) => {
  const providerId = req.auth.id;
  const requesterRole = req.auth.role;

  if (!TARGET_ROLES.includes(requesterRole)) {
    return res.status(403).json({
      success: false,
      message: 'Only doctors, laboratories, and pharmacies can access their reviews.',
    });
  }

  const { page, limit: limitParam, rating } = req.query;
  const pageNum = Math.max(Number.parseInt(page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(limitParam, 10) || 20, 1), 100);
  const skip = (pageNum - 1) * limit;

  const criteria = {
    target: providerId,
    targetRole: requesterRole,
  };

  if (rating) {
    const ratingNum = Number.parseInt(rating, 10);
    if (!Number.isNaN(ratingNum) && ratingNum >= 1 && ratingNum <= 5) {
      criteria.rating = ratingNum;
    }
  }

  const [reviews, total] = await Promise.all([
    Review.find(criteria)
      .populate('patient', 'firstName lastName profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(criteria),
  ]);

  res.json({
    success: true,
    pagination: {
      total,
      page: pageNum,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
    reviews: reviews.map(sanitizeReview),
  });
});

// Get review statistics for provider (doctor, lab, pharmacy)
exports.getProviderReviewStatistics = asyncHandler(async (req, res) => {
  const providerId = req.auth.id;
  const requesterRole = req.auth.role;

  if (!TARGET_ROLES.includes(requesterRole)) {
    return res.status(403).json({
      success: false,
      message: 'Only doctors, laboratories, and pharmacies can access review statistics.',
    });
  }

  const [
    totalReviews,
    averageRating,
    ratingDistribution,
    reviewsWithComments,
    reviewsWithReplies,
  ] = await Promise.all([
    Review.countDocuments({ target: providerId, targetRole: requesterRole }),
    Review.aggregate([
      { $match: { target: providerId, targetRole: requesterRole } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]),
    Review.aggregate([
      { $match: { target: providerId, targetRole: requesterRole } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]),
    Review.countDocuments({
      target: providerId,
      targetRole: requesterRole,
      comment: { $exists: true, $ne: null, $ne: '' },
    }),
    Review.countDocuments({
      target: providerId,
      targetRole: requesterRole,
      'reply.message': { $exists: true, $ne: null, $ne: '' },
    }),
  ]);

  const avgRating = averageRating.length > 0 ? averageRating[0].avgRating : 0;
  const ratingDist = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  ratingDistribution.forEach((item) => {
    ratingDist[item._id] = item.count;
  });

  res.json({
    success: true,
    statistics: {
      totalReviews,
      averageRating: Math.round(avgRating * 10) / 10,
      ratingDistribution: ratingDist,
      reviewsWithComments,
      reviewsWithReplies,
    },
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

  // If reply already exists, use updateReply instead
  if (review.reply && review.reply.message) {
    return res.status(400).json({
      success: false,
      message: 'Reply already exists. Use PUT to update the reply.',
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
    message: 'Reply added successfully.',
    review: sanitizeReview(populated),
  });
});

// Update existing reply to review
exports.updateReply = asyncHandler(async (req, res) => {
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
      message: 'You are not allowed to update this reply.',
    });
  }

  if (String(review.target) !== String(req.auth.id)) {
    return res.status(403).json({
      success: false,
      message: 'You can only update replies to reviews left on your profile.',
    });
  }

  if (!review.reply || !review.reply.message) {
    return res.status(400).json({
      success: false,
      message: 'No reply exists to update. Use POST to create a reply.',
    });
  }

  review.reply.message = message.trim();
  review.reply.repliedAt = new Date();

  await review.save();

  const populated = await review.populate('patient', 'firstName lastName gender profileImage');

  res.json({
    success: true,
    message: 'Reply updated successfully.',
    review: sanitizeReview(populated),
  });
});


