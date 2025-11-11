const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const settingsController = require('../../controllers/admin-controllers/settingsController');

const router = express.Router();

router
  .route('/nearby-radius')
  .get(protect(ROLES.ADMIN), settingsController.getNearbyRadius)
  .patch(protect(ROLES.ADMIN), settingsController.updateNearbyRadius);

module.exports = router;


