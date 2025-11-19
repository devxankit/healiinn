const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/doctor-controllers/notificationController');

const router = express.Router();

// List notifications
router.get('/', protect(ROLES.DOCTOR), controller.listNotifications);

// Get unread count
router.get('/unread-count', protect(ROLES.DOCTOR), controller.getUnreadCount);

// Get notification summary
router.get('/summary', protect(ROLES.DOCTOR), controller.getNotificationSummary);

// Get notification preferences
router.get('/preferences', protect(ROLES.DOCTOR), controller.getNotificationPreferences);

// Update notification preferences
router.put('/preferences', protect(ROLES.DOCTOR), controller.updateNotificationPreferences);

// Mark all as read
router.put('/read-all', protect(ROLES.DOCTOR), controller.markAllAsRead);

// Delete multiple notifications (must come before :id routes)
router.delete('/bulk/delete', protect(ROLES.DOCTOR), controller.deleteMultipleNotifications);

// Mark notification as read (support both :id and :notificationId)
router.put('/:notificationId/read', protect(ROLES.DOCTOR), controller.markAsRead);
router.put('/:id/read', protect(ROLES.DOCTOR), controller.markAsRead);

// Delete single notification (support both :id and :notificationId)
router.delete('/:notificationId', protect(ROLES.DOCTOR), controller.deleteNotification);
router.delete('/:id', protect(ROLES.DOCTOR), controller.deleteNotification);

module.exports = router;

