const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/laboratory-controllers/dashboardController');

const router = express.Router();

router.get('/overview', protect(ROLES.LABORATORY), controller.getDashboardOverview);

// Analytics endpoints
router.get('/analytics/revenue-trends', protect(ROLES.LABORATORY), controller.getRevenueTrends);
router.get('/analytics/lead-trends', protect(ROLES.LABORATORY), controller.getLeadTrends);
router.get('/analytics/patient-growth', protect(ROLES.LABORATORY), controller.getPatientGrowth);
router.get('/analytics/peak-hours', protect(ROLES.LABORATORY), controller.getPeakHours);
router.get('/analytics/comparison', protect(ROLES.LABORATORY), controller.getComparisonReport);

// Export reports
router.get('/analytics/export', protect(ROLES.LABORATORY), controller.exportAnalyticsReport);

module.exports = router;

