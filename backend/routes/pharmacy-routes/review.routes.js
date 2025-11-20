const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/pharmacy-controllers/reviewController');

const router = express.Router();

// List reviews
router.get('/', protect(ROLES.PHARMACY), controller.listReviews);

// Get rating analytics
router.get('/analytics', protect(ROLES.PHARMACY), controller.getRatingAnalytics);

// Get single review
router.get('/:reviewId', protect(ROLES.PHARMACY), controller.getReview);

// Reply to review
router.post('/:reviewId/reply', protect(ROLES.PHARMACY), controller.replyToReview);

// Update reply
router.put('/:reviewId/reply', protect(ROLES.PHARMACY), controller.updateReply);

// Delete reply
router.delete('/:reviewId/reply', protect(ROLES.PHARMACY), controller.deleteReply);

module.exports = router;

