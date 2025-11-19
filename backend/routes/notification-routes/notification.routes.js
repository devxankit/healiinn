const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const {
  registerDevice,
  unregisterDevice,
} = require('../../controllers/notification-controller/notificationController');

const router = express.Router();

router.post('/device/register', protect(), registerDevice);
router.post('/device/unregister', unregisterDevice);

module.exports = router;

