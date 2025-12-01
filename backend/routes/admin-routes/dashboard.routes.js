const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/authMiddleware');
const {
  getDashboardStats,
  getRecentActivities,
} = require('../../controllers/admin-controllers/adminDashboardController');

router.get('/stats', protect('admin'), authorize('admin'), getDashboardStats);
router.get('/activities', protect('admin'), authorize('admin'), getRecentActivities);

module.exports = router;

