const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');
const controller = require('../controllers/reviewController');

const router = express.Router();

router.post('/', protect(ROLES.PATIENT), controller.createReview);

router.get(
  '/patient/me',
  protect(ROLES.PATIENT),
  controller.listPatientReviews
);

router.get(
  '/target/:role/:targetId',
  protect(ROLES.PATIENT, ROLES.DOCTOR, ROLES.LABORATORY, ROLES.PHARMACY, ROLES.ADMIN),
  controller.listTargetReviews
);

router.patch(
  '/:reviewId/reply',
  protect(ROLES.DOCTOR, ROLES.LABORATORY, ROLES.PHARMACY),
  controller.replyToReview
);

module.exports = router;


