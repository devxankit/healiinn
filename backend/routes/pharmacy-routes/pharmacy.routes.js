const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/pharmacy-controllers/pharmacyWorkflowController');

const router = express.Router();

router.get(
  '/leads',
  protect(ROLES.PHARMACY),
  controller.listLeads
);

router.patch(
  '/leads/:leadId/status',
  protect(ROLES.PHARMACY),
  controller.updateStatus
);

module.exports = router;

