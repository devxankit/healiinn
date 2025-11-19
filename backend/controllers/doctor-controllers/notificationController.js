const asyncHandler = require('../../middleware/asyncHandler');
const mongoose = require('mongoose');
const Notification = require('../../models/Notification');
const Doctor = require('../../models/Doctor');
const { ROLES } = require('../../utils/constants');
const { getPaginationParams, getPaginationMeta } = require('../../utils/pagination');

const toObjectId = (value) =>
  typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value;

exports.listNotifications = asyncHandler(async (req, res) => {
  const doctorId = toObjectId(req.auth.id);
  const { read, type, priority, sortBy = 'created', sortOrder = 'desc' } = req.query;
  const { page: pageNum, limit, skip } = getPaginationParams(req.query);

  const matchCriteria = {
    'recipients.user': doctorId,
    'recipients.role': ROLES.DOCTOR,
  };

  if (read !== undefined) {
    if (read === 'true') {
      matchCriteria['recipients.readAt'] = { $exists: true, $ne: null };
    } else if (read === 'false') {
      matchCriteria['recipients.readAt'] = { $exists: false };
    }
  }

  if (type) {
    matchCriteria.type = type;
  }

  if (priority) {
    matchCriteria.priority = priority;
  }

  // Build sort criteria
  let sortCriteria = {};
  const order = sortOrder === 'asc' ? 1 : -1;
  switch (sortBy.toLowerCase()) {
    case 'created':
      sortCriteria = { createdAt: order };
      break;
    case 'priority':
      // Priority order: high > normal > low
      sortCriteria = { priority: order === 1 ? 1 : -1, createdAt: -1 };
      break;
    case 'read':
      // Unread first, then read
      sortCriteria = { 'recipients.readAt': order === 1 ? 1 : -1, createdAt: -1 };
      break;
    default:
      sortCriteria = { createdAt: -1 };
  }

  const [notifications, total] = await Promise.all([
    Notification.find(matchCriteria)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(matchCriteria),
  ]);

  const formattedNotifications = notifications.map((notification) => {
    const recipient = (notification.recipients || []).find(
      (entry) =>
        entry.role === ROLES.DOCTOR &&
        entry.user &&
        entry.user.toString() === doctorId.toString()
    );

    return {
      id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type || null,
      priority: notification.priority || 'normal',
      createdAt: notification.createdAt,
      readAt: recipient?.readAt || null,
      isRead: !!recipient?.readAt,
      data: notification.data || null,
    };
  });

  res.json({
    success: true,
    pagination: getPaginationMeta(total, pageNum, limit),
    filters: {
      read: read || null,
      type: type || null,
      priority: priority || null,
      sortBy,
      sortOrder,
    },
    notifications: formattedNotifications,
  });
});

exports.getUnreadCount = asyncHandler(async (req, res) => {
  const doctorId = toObjectId(req.auth.id);

  const unreadCount = await Notification.countDocuments({
    'recipients.user': doctorId,
    'recipients.role': ROLES.DOCTOR,
    'recipients.readAt': { $exists: false },
  });

  res.json({
    success: true,
    unreadCount,
  });
});

exports.markAsRead = asyncHandler(async (req, res) => {
  const doctorId = toObjectId(req.auth.id);
  const notificationId = req.params.notificationId || req.params.id;

  if (!notificationId) {
    return res.status(400).json({
      success: false,
      message: 'Notification ID is required.',
    });
  }

  const notification = await Notification.findById(notificationId);

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found.',
    });
  }

  const recipient = notification.recipients.find(
    (entry) =>
      entry.role === ROLES.DOCTOR &&
      entry.user &&
      entry.user.toString() === doctorId.toString()
  );

  if (!recipient) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this notification.',
    });
  }

  if (!recipient.readAt) {
    recipient.readAt = new Date();
    await notification.save();
  }

  res.json({
    success: true,
    message: 'Notification marked as read.',
  });
});

exports.markAllAsRead = asyncHandler(async (req, res) => {
  const doctorId = toObjectId(req.auth.id);

  const result = await Notification.updateMany(
    {
      'recipients.user': doctorId,
      'recipients.role': ROLES.DOCTOR,
      'recipients.readAt': { $exists: false },
    },
    {
      $set: {
        'recipients.$[elem].readAt': new Date(),
      },
    },
    {
      arrayFilters: [
        {
          'elem.user': doctorId,
          'elem.role': ROLES.DOCTOR,
        },
      ],
    }
  );

  res.json({
    success: true,
    message: `${result.modifiedCount} notifications marked as read.`,
    count: result.modifiedCount,
  });
});

exports.deleteNotification = asyncHandler(async (req, res) => {
  const doctorId = toObjectId(req.auth.id);
  const notificationId = req.params.notificationId || req.params.id;

  if (!notificationId) {
    return res.status(400).json({
      success: false,
      message: 'Notification ID is required.',
    });
  }

  const notification = await Notification.findById(notificationId);

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found.',
    });
  }

  // Remove the recipient entry for this doctor
  notification.recipients = notification.recipients.filter(
    (entry) =>
      !(
        entry.role === ROLES.DOCTOR &&
        entry.user &&
        entry.user.toString() === doctorId.toString()
      )
  );

  // If no recipients left, delete the notification
  if (notification.recipients.length === 0) {
    await Notification.findByIdAndDelete(notificationId);
  } else {
    await notification.save();
  }

  res.json({
    success: true,
    message: 'Notification deleted.',
  });
});

exports.deleteMultipleNotifications = asyncHandler(async (req, res) => {
  const doctorId = toObjectId(req.auth.id);
  const { notificationIds } = req.body;

  if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'notificationIds must be a non-empty array.',
    });
  }

  const notifications = await Notification.find({
    _id: { $in: notificationIds },
    'recipients.user': doctorId,
    'recipients.role': ROLES.DOCTOR,
  });

  if (notifications.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No notifications found to delete.',
    });
  }

  let deletedCount = 0;
  let removedCount = 0;

  for (const notification of notifications) {
    // Remove the recipient entry for this doctor
    const originalLength = notification.recipients.length;
    notification.recipients = notification.recipients.filter(
      (entry) =>
        !(
          entry.role === ROLES.DOCTOR &&
          entry.user &&
          entry.user.toString() === doctorId.toString()
        )
    );

    // If no recipients left, delete the notification
    if (notification.recipients.length === 0) {
      await Notification.findByIdAndDelete(notification._id);
      deletedCount++;
    } else {
      await notification.save();
      removedCount++;
    }
  }

  res.json({
    success: true,
    message: `${deletedCount + removedCount} notifications processed.`,
    deleted: deletedCount,
    removed: removedCount,
  });
});

exports.getNotificationPreferences = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.auth.id).select('notificationPreferences');

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found.',
    });
  }

  res.json({
    success: true,
    preferences: doctor.notificationPreferences || {
      email: true,
      sms: false,
      push: true,
      inApp: true,
      types: {
        appointment: true,
        consultation: true,
        prescription: true,
        payment: true,
        review: true,
        system: true,
        marketing: false,
      },
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
      },
    },
  });
});

exports.updateNotificationPreferences = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.auth.id);

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found.',
    });
  }

  const {
    email,
    sms,
    push,
    inApp,
    types,
    quietHours,
  } = req.body;

  // Initialize preferences if not exists
  if (!doctor.notificationPreferences) {
    doctor.notificationPreferences = {
      email: true,
      sms: false,
      push: true,
      inApp: true,
      types: {
        appointment: true,
        consultation: true,
        prescription: true,
        payment: true,
        review: true,
        system: true,
        marketing: false,
      },
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
      },
    };
  }

  // Update channel preferences
  if (email !== undefined) {
    doctor.notificationPreferences.email = Boolean(email);
  }
  if (sms !== undefined) {
    doctor.notificationPreferences.sms = Boolean(sms);
  }
  if (push !== undefined) {
    doctor.notificationPreferences.push = Boolean(push);
  }
  if (inApp !== undefined) {
    doctor.notificationPreferences.inApp = Boolean(inApp);
  }

  // Update type preferences
  if (types && typeof types === 'object') {
    doctor.notificationPreferences.types = {
      ...doctor.notificationPreferences.types,
      ...types,
    };
  }

  // Update quiet hours
  if (quietHours && typeof quietHours === 'object') {
    if (quietHours.enabled !== undefined) {
      doctor.notificationPreferences.quietHours.enabled = Boolean(quietHours.enabled);
    }
    if (quietHours.startTime) {
      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (timeRegex.test(quietHours.startTime)) {
        doctor.notificationPreferences.quietHours.startTime = quietHours.startTime;
      }
    }
    if (quietHours.endTime) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (timeRegex.test(quietHours.endTime)) {
        doctor.notificationPreferences.quietHours.endTime = quietHours.endTime;
      }
    }
  }

  await doctor.save();

  res.json({
    success: true,
    message: 'Notification preferences updated successfully.',
    preferences: doctor.notificationPreferences,
  });
});

exports.getNotificationSummary = asyncHandler(async (req, res) => {
  const doctorId = toObjectId(req.auth.id);

  const [
    totalNotifications,
    unreadCount,
    readCount,
    notificationsByType,
    notificationsByPriority,
    recentNotifications,
  ] = await Promise.all([
    Notification.countDocuments({
      'recipients.user': doctorId,
      'recipients.role': ROLES.DOCTOR,
    }),
    Notification.countDocuments({
      'recipients.user': doctorId,
      'recipients.role': ROLES.DOCTOR,
      'recipients.readAt': { $exists: false },
    }),
    Notification.countDocuments({
      'recipients.user': doctorId,
      'recipients.role': ROLES.DOCTOR,
      'recipients.readAt': { $exists: true, $ne: null },
    }),
    Notification.aggregate([
      {
        $match: {
          'recipients.user': doctorId,
          'recipients.role': ROLES.DOCTOR,
        },
      },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
    Notification.aggregate([
      {
        $match: {
          'recipients.user': doctorId,
          'recipients.role': ROLES.DOCTOR,
        },
      },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
    Notification.find({
      'recipients.user': doctorId,
      'recipients.role': ROLES.DOCTOR,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title type priority createdAt')
      .lean(),
  ]);

  const typeMap = {};
  notificationsByType.forEach((item) => {
    typeMap[item._id || 'unknown'] = item.count;
  });

  const priorityMap = {};
  notificationsByPriority.forEach((item) => {
    priorityMap[item._id || 'normal'] = item.count;
  });

  res.json({
    success: true,
    summary: {
      total: totalNotifications,
      unread: unreadCount,
      read: readCount,
      byType: typeMap,
      byPriority: priorityMap,
      recent: recentNotifications.map((n) => ({
        id: n._id,
        title: n.title,
        type: n.type || null,
        priority: n.priority || 'normal',
        createdAt: n.createdAt,
      })),
    },
  });
});

