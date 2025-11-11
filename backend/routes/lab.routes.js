const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');
const controller = require('../controllers/laboratory-controllers/labWorkflowController');

const router = express.Router();

router.get('/leads', protect(ROLES.LABORATORY), controller.listLeads);

module.exports = router;

