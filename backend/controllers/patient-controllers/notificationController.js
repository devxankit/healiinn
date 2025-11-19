const asyncHandler = require('../../middleware/asyncHandler');
const { ROLES } = require('../../utils/constants');
const Notification = require('../../models/Notification');

const ensureRole = (role, allowedRoles) => {
  if (!allowedRoles.includes(role)) {
    const error = new Error('Access denied');
    error.status = 403;
    throw error;
  }
};

// Helper function to sanitize notification data
const sanitizeNotification = (notification, patientId) => {
  if (!notification) return null;

  const data = notification.toObject ? notification.toObject() : notification;

  // Find patient's recipient entry
  const recipient = (data.recipients || []).find(
    (r) =>
      r.user &&
      (r.user.toString ? r.user.toString() === patientId.toString() : r.user === patientId.toString()) &&
      r.role === ROLES.PATIENT
  );

  return {
    id: data._id,
    title: data.title,
    message: data.message,
    type: data.type || null,
    priority: data.priority || 'normal',
    isRead: !!recipient?.readAt,
    readAt: recipient?.readAt || null,
    data: data.data || null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

// GET /api/patients/notifications
exports.getPatientNotifications = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const patientId = req.auth.id;
  const { type, page = 1, limit = 20, read } = req.query;

  // Build query
  const query = {
    'recipients.user': patientId,
    'recipients.role': ROLES.PATIENT,
  };

  // Filter by type
  if (type && type.trim()) {
    query.type = type.trim();
  }

  // Filter by read status
  if (read === 'true') {
    query['recipients.readAt'] = { $ne: null };
  } else if (read === 'false') {
    query['recipients.readAt'] = null;
  }

  // Pagination
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  // Get notifications with pagination
  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Notification.countDocuments(query),
  ]);

  // Format response - extract patient-specific recipient data
  const formatted = notifications
    .map((notif) => sanitizeNotification(notif, patientId))
    .filter((notif) => notif !== null);

  res.json({
    success: true,
    notifications: formatted,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

// PATCH /api/patients/notifications/:notificationId/read
exports.markNotificationAsRead = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const { notificationId } = req.params;
  const patientId = req.auth.id;

  const notification = await Notification.findById(notificationId);

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found',
    });
  }

  // Find patient's recipient entry index
  const recipientIndex = notification.recipients.findIndex(
    (r) =>
      r.user &&
      (r.user.toString ? r.user.toString() === patientId.toString() : r.user === patientId.toString()) &&
      r.role === ROLES.PATIENT
  );

  if (recipientIndex === -1) {
    return res.status(403).json({
      success: false,
      message: 'Notification does not belong to this patient',
    });
  }

  // Update readAt if not already read
  if (!notification.recipients[recipientIndex].readAt) {
    notification.recipients[recipientIndex].readAt = new Date();
    await notification.save();
  }

  const formatted = sanitizeNotification(notification, patientId);

  res.json({
    success: true,
    message: 'Notification marked as read',
    notification: formatted,
  });
});

// PATCH /api/patients/notifications/read-all
exports.markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const patientId = req.auth.id;

  // Update all unread notifications for this patient using arrayFilters
  const result = await Notification.updateMany(
    {
      'recipients.user': patientId,
      'recipients.role': ROLES.PATIENT,
      'recipients.readAt': null,
    },
    {
      $set: {
        'recipients.$[elem].readAt': new Date(),
      },
    },
    {
      arrayFilters: [
        {
          'elem.user': patientId,
          'elem.role': ROLES.PATIENT,
          'elem.readAt': null,
        },
      ],
    }
  );

  res.json({
    success: true,
    message: 'All notifications marked as read',
    updatedCount: result.modifiedCount,
  });
});

// GET /api/patients/notifications/unread-count
exports.getUnreadCount = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const patientId = req.auth.id;

  // Use aggregation to count unread notifications
  const result = await Notification.aggregate([
    {
      $match: {
        'recipients.user': patientId,
        'recipients.role': ROLES.PATIENT,
      },
    },
    {
      $unwind: '$recipients',
    },
    {
      $match: {
        'recipients.user': patientId,
        'recipients.role': ROLES.PATIENT,
        $or: [{ 'recipients.readAt': null }, { 'recipients.readAt': { $exists: false } }],
      },
    },
    {
      $count: 'count',
    },
  ]);

  const unreadCount = result[0]?.count || 0;

  res.json({
    success: true,
    unreadCount,
  });
});

