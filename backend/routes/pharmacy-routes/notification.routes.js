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
} = require('../../controllers/pharmacy-controllers/pharmacyNotificationController');

router.get('/', protect('pharmacy'), getNotifications);
router.get('/unread-count', protect('pharmacy'), getUnreadCount);
router.patch('/:id/read', protect('pharmacy'), markAsRead);
router.patch('/read-all', protect('pharmacy'), markAllAsRead);
router.delete('/:id', protect('pharmacy'), deleteNotification);
router.delete('/read', protect('pharmacy'), deleteReadNotifications);

module.exports = router;

