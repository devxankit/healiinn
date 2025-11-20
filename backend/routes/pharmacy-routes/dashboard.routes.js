const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/pharmacy-controllers/dashboardController');

const router = express.Router();

router.get('/overview', protect(ROLES.PHARMACY), controller.getDashboardOverview);

// Analytics endpoints
router.get('/analytics/revenue-trends', protect(ROLES.PHARMACY), controller.getRevenueTrends);
router.get('/analytics/order-trends', protect(ROLES.PHARMACY), controller.getOrderTrends);
router.get('/analytics/patient-growth', protect(ROLES.PHARMACY), controller.getPatientGrowth);
router.get('/analytics/peak-hours', protect(ROLES.PHARMACY), controller.getPeakHours);
router.get('/analytics/comparison', protect(ROLES.PHARMACY), controller.getComparisonReport);

// Export reports
router.get('/analytics/export', protect(ROLES.PHARMACY), controller.exportAnalyticsReport);

module.exports = router;

