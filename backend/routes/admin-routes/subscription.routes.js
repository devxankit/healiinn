const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/admin-controllers/subscriptionAdminController');

const router = express.Router();

router.get('/plan', protect(ROLES.ADMIN), controller.getPlan);
router.put('/plan', protect(ROLES.ADMIN), controller.updatePlan);
router.get('/', protect(ROLES.ADMIN), controller.listSubscriptions);
router.get('/upcoming', protect(ROLES.ADMIN), controller.listUpcoming);
router.get('/:role/:subscriberId/history', protect(ROLES.ADMIN), controller.getSubscriberHistory);

module.exports = router;


