const asyncHandler = require('../../middleware/asyncHandler');
const mongoose = require('mongoose');
const { ROLES } = require('../../utils/constants');
const { getPaginationParams, getPaginationMeta } = require('../../utils/pagination');
const { getCache, setCache, generateCacheKey, deleteCacheByPattern } = require('../../utils/cache');
const Review = require('../../models/Review');
const Laboratory = require('../../models/Laboratory');

const toObjectId = (value) =>
  typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value;

const ensureRole = (role, allowed) => {
  if (!allowed.includes(role)) {
    const error = new Error('You do not have access to this resource');
    error.status = 403;
    throw error;
  }
};

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
    rating: data.rating,
    comment: data.comment || null,
    reply: data.reply
      ? {
          message: data.reply.message,
          repliedAt: data.reply.repliedAt || null,
        }
      : null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

// View Reviews for Laboratory
exports.listReviews = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.LABORATORY]);

  const laboratoryId = toObjectId(req.auth.id);
  const { page, limit, skip } = getPaginationParams(req.query);
  const { rating, hasReply, from, to } = req.query;

  // Build query
  const query = {
    target: laboratoryId,
    targetRole: ROLES.LABORATORY,
  };

  // Rating filter
  if (rating) {
    const ratingNum = Number.parseInt(rating, 10);
    if (!Number.isNaN(ratingNum) && ratingNum >= 1 && ratingNum <= 5) {
      query.rating = ratingNum;
    }
  }

  // Reply filter
  if (hasReply === 'true') {
    query['reply.message'] = { $exists: true, $ne: '' };
  } else if (hasReply === 'false') {
    query.$or = [
      { 'reply.message': { $exists: false } },
      { 'reply.message': '' },
    ];
  }

  // Date range filter
  if (from || to) {
    query.createdAt = {};
    if (from) {
      query.createdAt.$gte = new Date(from);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      query.createdAt.$lte = toDate;
    }
  }

  // Get total count
  const total = await Review.countDocuments(query);

  // Get reviews (optimized with explicit field selection)
  const reviews = await Review.find(query)
    .populate('patient', 'firstName lastName gender profileImage _id')
    .select('patient rating comment reply.message reply.repliedAt createdAt updatedAt _id')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  res.json({
    success: true,
    pagination: getPaginationMeta(total, page, limit),
    reviews: reviews.map(sanitizeReview),
  });
});

// Get Single Review
exports.getReview = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.LABORATORY]);

  const { reviewId } = req.params;
  const laboratoryId = toObjectId(req.auth.id);

  // Try cache first
  const cacheKey = generateCacheKey('laboratory:review', {
    laboratoryId: laboratoryId.toString(),
    reviewId,
  });

  let review = await getCache(cacheKey);
  if (!review) {
    review = await Review.findOne({
      _id: reviewId,
      target: laboratoryId,
      targetRole: ROLES.LABORATORY,
    })
      .populate('patient', 'firstName lastName gender profileImage _id')
      .select('patient rating comment reply createdAt updatedAt _id')
      .lean();

    if (review) {
      // Cache for 5 minutes
      await setCache(cacheKey, review, 300);
    }
  }

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found or you do not have access to this review.',
    });
  }

  res.json({
    success: true,
    review: sanitizeReview(review),
  });
});

// Respond to Review
exports.replyToReview = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.LABORATORY]);

  const { reviewId } = req.params;
  const laboratoryId = toObjectId(req.auth.id);
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Reply message is required.',
    });
  }

  const review = await Review.findOne({
    _id: reviewId,
    target: laboratoryId,
    targetRole: ROLES.LABORATORY,
  });

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found or you do not have access to this review.',
    });
  }

  // Update or create reply
  review.reply = {
    message: message.trim(),
    repliedBy: laboratoryId,
    repliedByRole: ROLES.LABORATORY,
    repliedAt: new Date(),
    repliedByRoleModel: 'Laboratory',
  };

  await review.save();

  // Invalidate cache
  await deleteCacheByPattern(`laboratory:review:*:${reviewId}`);
  await deleteCacheByPattern(`laboratory:reviews:analytics:*`);

  const populated = await review.populate('patient', 'firstName lastName gender profileImage _id');

  res.json({
    success: true,
    message: 'Reply added successfully.',
    review: sanitizeReview(populated),
  });
});

// Update Reply to Review
exports.updateReply = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.LABORATORY]);

  const { reviewId } = req.params;
  const laboratoryId = toObjectId(req.auth.id);
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Reply message is required.',
    });
  }

  const review = await Review.findOne({
    _id: reviewId,
    target: laboratoryId,
    targetRole: ROLES.LABORATORY,
  });

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found or you do not have access to this review.',
    });
  }

  if (!review.reply || !review.reply.message) {
    return res.status(400).json({
      success: false,
      message: 'No reply exists. Use POST to create a reply.',
    });
  }

  // Update reply
  review.reply.message = message.trim();
  review.reply.repliedAt = new Date();

  await review.save();

  // Invalidate cache
  await deleteCacheByPattern(`laboratory:review:*:${reviewId}`);
  await deleteCacheByPattern(`laboratory:reviews:analytics:*`);

  const populated = await review.populate('patient', 'firstName lastName gender profileImage _id');

  res.json({
    success: true,
    message: 'Reply updated successfully.',
    review: sanitizeReview(populated),
  });
});

// Delete Reply to Review
exports.deleteReply = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.LABORATORY]);

  const { reviewId } = req.params;
  const laboratoryId = toObjectId(req.auth.id);

  const review = await Review.findOne({
    _id: reviewId,
    target: laboratoryId,
    targetRole: ROLES.LABORATORY,
  });

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found or you do not have access to this review.',
    });
  }

  if (!review.reply || !review.reply.message) {
    return res.status(400).json({
      success: false,
      message: 'No reply exists to delete.',
    });
  }

  // Remove reply
  review.reply = undefined;
  await review.save();

  // Invalidate cache
  await deleteCacheByPattern(`laboratory:review:*:${reviewId}`);
  await deleteCacheByPattern(`laboratory:reviews:analytics:*`);

  const populated = await review.populate('patient', 'firstName lastName gender profileImage _id');

  res.json({
    success: true,
    message: 'Reply deleted successfully.',
    review: sanitizeReview(populated),
  });
});

// Rating Analytics
exports.getRatingAnalytics = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.LABORATORY]);

  const laboratoryId = toObjectId(req.auth.id);
  const { from, to } = req.query;

  const cacheKey = generateCacheKey('laboratory:reviews:analytics', {
    laboratoryId: laboratoryId.toString(),
    from: from || '',
    to: to || '',
  });

  // Try to get from cache first (cache for 10 minutes)
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  // Build query
  const query = {
    target: laboratoryId,
    targetRole: ROLES.LABORATORY,
  };

  // Date range filter
  if (from || to) {
    query.createdAt = {};
    if (from) {
      query.createdAt.$gte = new Date(from);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      query.createdAt.$lte = toDate;
    }
  }

  // Get rating distribution
  const ratingDistribution = await Review.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  // Get overall statistics
  const stats = await Review.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        reviewsWithReply: {
          $sum: {
            $cond: [{ $ifNull: ['$reply.message', false] }, 1, 0],
          },
        },
      },
    },
  ]);

  const statistics = stats[0] || {
    totalReviews: 0,
    averageRating: 0,
    reviewsWithReply: 0,
  };

  // Build rating distribution object
  const distribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  ratingDistribution.forEach((item) => {
    distribution[item._id] = item.count;
  });

  // Update laboratory rating
  const laboratory = await Laboratory.findById(laboratoryId).select('rating');
  if (laboratory && statistics.totalReviews > 0) {
    laboratory.rating = Number.parseFloat(statistics.averageRating.toFixed(2));
    await laboratory.save();
  }

  const response = {
    success: true,
    analytics: {
      totalReviews: statistics.totalReviews,
      averageRating: Number.parseFloat(statistics.averageRating.toFixed(2)),
      reviewsWithReply: statistics.reviewsWithReply,
      reviewsWithoutReply: statistics.totalReviews - statistics.reviewsWithReply,
      replyRate:
        statistics.totalReviews > 0
          ? Number.parseFloat(
              ((statistics.reviewsWithReply / statistics.totalReviews) * 100).toFixed(2)
            )
          : 0,
      distribution,
    },
  };

  // Cache for 10 minutes (600 seconds)
  await setCache(cacheKey, response, 600);

  res.json(response);
});

