const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/doctor-controllers/dashboardController');

const router = express.Router();

router.get('/overview', protect(ROLES.DOCTOR), controller.getDashboardOverview);

module.exports = router;


