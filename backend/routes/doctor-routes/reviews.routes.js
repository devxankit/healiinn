const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/review-controller/reviewController');

const router = express.Router();

// Get doctor's reviews
router.get('/', protect(ROLES.DOCTOR), controller.getProviderReviews);

// Get doctor's review statistics
router.get('/stats', protect(ROLES.DOCTOR), controller.getProviderReviewStatistics);

// Reply to review
router.post('/:reviewId/reply', protect(ROLES.DOCTOR), controller.replyToReview);

// Update reply to review
router.put('/:reviewId/reply', protect(ROLES.DOCTOR), controller.updateReply);

module.exports = router;

