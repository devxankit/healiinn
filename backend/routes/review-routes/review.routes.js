const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/review-controller/reviewController');

const router = express.Router();

// Patient routes
router.post('/', protect(ROLES.PATIENT), controller.createReview);
router.get('/patient/me', protect(ROLES.PATIENT), controller.listPatientReviews);

// Provider routes (doctor, laboratory, pharmacy) - their own reviews
router.get('/provider/me', protect(ROLES.DOCTOR, ROLES.LABORATORY, ROLES.PHARMACY), controller.getProviderReviews);
router.get('/provider/statistics', protect(ROLES.DOCTOR, ROLES.LABORATORY, ROLES.PHARMACY), controller.getProviderReviewStatistics);

// Public routes - view reviews for any target
router.get(
  '/target/:role/:targetId',
  protect(ROLES.PATIENT, ROLES.DOCTOR, ROLES.LABORATORY, ROLES.PHARMACY, ROLES.ADMIN),
  controller.listTargetReviews
);

// Provider routes - reply to reviews
router.post('/:reviewId/reply', protect(ROLES.DOCTOR, ROLES.LABORATORY, ROLES.PHARMACY), controller.replyToReview);
router.put('/:reviewId/reply', protect(ROLES.DOCTOR, ROLES.LABORATORY, ROLES.PHARMACY), controller.updateReply);

module.exports = router;

