const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/admin-controllers/adminDashboardController');

const router = express.Router();

router.get('/overview', protect(ROLES.ADMIN), controller.getDashboardOverview);

module.exports = router;


