const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
// Appointments are handled in dashboard controller
// This file exists for consistency but routes are in dashboard.routes.js

module.exports = router;

