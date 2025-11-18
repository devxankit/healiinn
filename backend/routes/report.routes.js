const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');
const controller = require('../controllers/report-controller/reportController');

const router = express.Router();

// Patient routes
router.get('/patient/reports', protect(ROLES.PATIENT), controller.listMyReports);
router.get('/patient/reports/:reportId', protect(ROLES.PATIENT), controller.getReport);
router.post('/patient/reports/:reportId/share', protect(ROLES.PATIENT), controller.shareReportWithDoctor);
router.get('/patient/reports/:reportId/history', protect(ROLES.PATIENT), controller.getReportShareHistory);

// Doctor routes
router.get('/doctors/reports', protect(ROLES.DOCTOR), controller.listDoctorReports);
router.get('/doctors/reports/:reportId', protect(ROLES.DOCTOR), controller.getDoctorReport);

module.exports = router;

