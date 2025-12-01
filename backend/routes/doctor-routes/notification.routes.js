const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
} = require('../../controllers/doctor-controllers/doctorNotificationController');

router.get('/', protect('doctor'), getNotifications);
router.get('/unread-count', protect('doctor'), getUnreadCount);
router.patch('/:id/read', protect('doctor'), markAsRead);
router.patch('/read-all', protect('doctor'), markAllAsRead);
router.delete('/:id', protect('doctor'), deleteNotification);
router.delete('/read', protect('doctor'), deleteReadNotifications);

module.exports = router;

