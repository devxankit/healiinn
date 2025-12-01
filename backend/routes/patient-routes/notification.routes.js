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
} = require('../../controllers/patient-controllers/patientNotificationController');

router.get('/', protect('patient'), getNotifications);
router.get('/unread-count', protect('patient'), getUnreadCount);
router.patch('/:id/read', protect('patient'), markAsRead);
router.patch('/read-all', protect('patient'), markAllAsRead);
router.delete('/:id', protect('patient'), deleteNotification);
router.delete('/read', protect('patient'), deleteReadNotifications);

module.exports = router;

