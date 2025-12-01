const asyncHandler = require('../../middleware/asyncHandler');
const Notification = require('../../models/Notification');
const { ROLES } = require('../../utils/constants');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/pharmacy/notifications
exports.getNotifications = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { isRead, type, limit: queryLimit } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = {
    userId: id,
    userType: ROLES.PHARMACY,
  };

  if (isRead !== undefined) {
    filter.isRead = isRead === 'true';
  }

  if (type) {
    filter.type = type;
  }

  const finalLimit = queryLimit ? parseInt(queryLimit, 10) : limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(finalLimit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, isRead: false }),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: notifications,
      pagination: {
        page,
        limit: finalLimit,
        total,
        totalPages: Math.ceil(total / finalLimit) || 1,
      },
      unreadCount,
    },
  });
});

// GET /api/pharmacy/notifications/unread-count
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const { id } = req.auth;

  const unreadCount = await Notification.countDocuments({
    userId: id,
    userType: ROLES.PHARMACY,
    isRead: false,
  });

  return res.status(200).json({
    success: true,
    data: {
      unreadCount,
    },
  });
});

// PATCH /api/pharmacy/notifications/:id/read
exports.markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { notificationId } = req.params;

  const notification = await Notification.findOne({
    _id: notificationId,
    userId: id,
    userType: ROLES.PHARMACY,
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found',
    });
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  return res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    data: notification,
  });
});

// PATCH /api/pharmacy/notifications/read-all
exports.markAllAsRead = asyncHandler(async (req, res) => {
  const { id } = req.auth;

  const result = await Notification.updateMany(
    {
      userId: id,
      userType: ROLES.PHARMACY,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );

  return res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
    data: {
      updatedCount: result.modifiedCount,
    },
  });
});

// DELETE /api/pharmacy/notifications/:id
exports.deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { notificationId } = req.params;

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    userId: id,
    userType: ROLES.PHARMACY,
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Notification deleted successfully',
  });
});

// DELETE /api/pharmacy/notifications/read
exports.deleteReadNotifications = asyncHandler(async (req, res) => {
  const { id } = req.auth;

  const result = await Notification.deleteMany({
    userId: id,
    userType: ROLES.PHARMACY,
    isRead: true,
  });

  return res.status(200).json({
    success: true,
    message: 'Read notifications deleted successfully',
    data: {
      deletedCount: result.deletedCount,
    },
  });
});

