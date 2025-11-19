const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/doctor-controllers/dashboardController');

const router = express.Router();

router.get('/overview', protect(ROLES.DOCTOR), controller.getDashboardOverview);

// Analytics endpoints
router.get('/analytics/revenue-trends', protect(ROLES.DOCTOR), controller.getRevenueTrends);
router.get('/analytics/patient-growth', protect(ROLES.DOCTOR), controller.getPatientGrowth);
router.get('/analytics/consultation-trends', protect(ROLES.DOCTOR), controller.getConsultationTrends);
router.get('/analytics/prescription-trends', protect(ROLES.DOCTOR), controller.getPrescriptionTrends);
router.get('/analytics/peak-hours', protect(ROLES.DOCTOR), controller.getPeakHours);
router.get('/analytics/comparison', protect(ROLES.DOCTOR), controller.getComparisonReport);

// Export reports
router.get('/analytics/export', protect(ROLES.DOCTOR), controller.exportAnalyticsReport);

module.exports = router;


