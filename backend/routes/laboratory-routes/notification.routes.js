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
} = require('../../controllers/laboratory-controllers/laboratoryNotificationController');

router.get('/', protect('laboratory'), getNotifications);
router.get('/unread-count', protect('laboratory'), getUnreadCount);
router.patch('/:id/read', protect('laboratory'), markAsRead);
router.patch('/read-all', protect('laboratory'), markAllAsRead);
router.delete('/:id', protect('laboratory'), deleteNotification);
router.delete('/read', protect('laboratory'), deleteReadNotifications);

module.exports = router;

