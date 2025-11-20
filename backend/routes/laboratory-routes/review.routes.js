const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/laboratory-controllers/reviewController');

const router = express.Router();

// List reviews
router.get('/', protect(ROLES.LABORATORY), controller.listReviews);

// Get rating analytics
router.get('/analytics', protect(ROLES.LABORATORY), controller.getRatingAnalytics);

// Get single review
router.get('/:reviewId', protect(ROLES.LABORATORY), controller.getReview);

// Reply to review
router.post('/:reviewId/reply', protect(ROLES.LABORATORY), controller.replyToReview);

// Update reply
router.put('/:reviewId/reply', protect(ROLES.LABORATORY), controller.updateReply);

// Delete reply
router.delete('/:reviewId/reply', protect(ROLES.LABORATORY), controller.deleteReply);

module.exports = router;

