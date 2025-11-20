const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/laboratory-controllers/reportController');

const router = express.Router();

// Get detailed analytics
router.get('/analytics', protect(ROLES.LABORATORY), controller.getDetailedAnalytics);

// Get performance metrics
router.get('/performance', protect(ROLES.LABORATORY), controller.getPerformanceMetrics);

// Export detailed report
router.get('/export', protect(ROLES.LABORATORY), controller.exportDetailedReport);

module.exports = router;

