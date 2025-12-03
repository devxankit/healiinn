const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/authMiddleware');
const {
  getRevenueOverview,
} = require('../../controllers/admin-controllers/adminRevenueController');

router.get('/', protect('admin'), authorize('admin'), getRevenueOverview);

module.exports = router;

