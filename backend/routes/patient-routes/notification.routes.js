const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/patient-controllers/notificationController');

const router = express.Router();

// Get all notifications with pagination and filters
router.get('/', protect(ROLES.PATIENT), controller.getPatientNotifications);

// Get unread notifications count
router.get('/unread-count', protect(ROLES.PATIENT), controller.getUnreadCount);

// Mark specific notification as read
router.patch('/:notificationId/read', protect(ROLES.PATIENT), controller.markNotificationAsRead);

// Mark all notifications as read
router.patch('/read-all', protect(ROLES.PATIENT), controller.markAllNotificationsAsRead);

module.exports = router;

