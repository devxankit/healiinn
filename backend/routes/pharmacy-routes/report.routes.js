const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/pharmacy-controllers/reportController');

const router = express.Router();

// Get detailed analytics
router.get('/analytics', protect(ROLES.PHARMACY), controller.getDetailedAnalytics);

// Get performance metrics
router.get('/performance', protect(ROLES.PHARMACY), controller.getPerformanceMetrics);

// Export detailed report
router.get('/export', protect(ROLES.PHARMACY), controller.exportDetailedReport);

module.exports = router;

