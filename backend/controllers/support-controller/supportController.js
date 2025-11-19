const mongoose = require('mongoose');
const { SupportTicket, SUPPORT_TICKET_STATUS, SUPPORT_TICKET_PRIORITY } = require('../../models/SupportTicket');
const asyncHandler = require('../../middleware/asyncHandler');
const { ROLES } = require('../../utils/constants');
const { sendEmail } = require('../../services/emailService');
const { publishNotification } = require('../../services/notificationPublisher');
const Admin = require('../../models/Admin');

const ROLE_TO_MODEL = {
  [ROLES.PATIENT]: 'Patient',
  [ROLES.DOCTOR]: 'Doctor',
  [ROLES.LABORATORY]: 'Laboratory',
  [ROLES.PHARMACY]: 'Pharmacy',
};

const formatRoleName = (role) => {
  if (!role) return '';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const toObjectId = (id) => {
  if (!id) return null;
  return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
};

const parseEmails = (value = '') => {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item);
};

// Send email notification to admin about new support ticket
const notifyAdminNewTicket = async ({ ticket, role, name, email, subject }) => {
  try {
    const adminEmails = parseEmails(process.env.ADMIN_NOTIFICATION_EMAILS || '');
    const admins = await Admin.find({ isActive: true, email: { $exists: true, $ne: '' } }).select('email _id');
    const allEmails = [...new Set([...adminEmails, ...admins.map((a) => a.email)])];

    if (!allEmails.length) {
      console.warn('No admin emails configured for support ticket notification.');
      return;
    }

    const roleName = formatRoleName(role);
    const emailSubject = `New Support Ticket from ${roleName} - ${ticket.ticketNumber} | Healiinn`;
    const emailText = `Hello Admin,

A new support ticket has been submitted:

Ticket Number: ${ticket.ticketNumber}
Role: ${roleName}
Name: ${name}
Email: ${email}
Subject: ${subject}

Please review and take action in the admin panel.

Thank you,
Healiinn Platform`;

    const emailHtml = `
      <p>Hello Admin,</p>
      <p>A new support ticket has been submitted:</p>
      <ul>
        <li><strong>Ticket Number:</strong> ${ticket.ticketNumber}</li>
        <li><strong>Role:</strong> ${roleName}</li>
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Subject:</strong> ${subject}</li>
      </ul>
      <p>Please review and take action in the admin panel.</p>
      <p>Thank you,<br/>Healiinn Platform</p>
    `;

    // Send emails to all admins
    await Promise.all(
      allEmails.map((emailAddr) =>
        sendEmail({
          to: emailAddr,
          subject: emailSubject,
          text: emailText,
          html: emailHtml,
        }).catch((error) => console.error(`Failed to send support ticket email to ${emailAddr}`, error))
      )
    );

    // Send push notifications to admins
    if (admins.length) {
      try {
        await publishNotification({
          type: 'SUPPORT_TICKET_NEW',
          recipients: admins.map((admin) => ({
            role: ROLES.ADMIN,
            userId: admin._id,
          })),
          context: {
            ticketNumber: ticket.ticketNumber,
            roleName,
            name,
            subject,
          },
          data: {
            ticketId: ticket._id.toString(),
            ticketNumber: ticket.ticketNumber,
            role,
          },
        });
      } catch (error) {
        console.error('Failed to publish admin support ticket notification', error);
      }
    }
  } catch (error) {
    console.error('Failed to notify admin of new support ticket', error);
  }
};

// Send email and notification to user about ticket update
const notifyUserTicketUpdate = async ({ ticket, status, adminResponse, adminName }) => {
  try {
    const roleName = formatRoleName(ticket.role);
    const statusMessages = {
      [SUPPORT_TICKET_STATUS.IN_PROGRESS]: 'Your support ticket is now being processed by our team.',
      [SUPPORT_TICKET_STATUS.RESOLVED]: 'Your support ticket has been resolved.',
      [SUPPORT_TICKET_STATUS.CLOSED]: 'Your support ticket has been closed.',
    };

    const statusMessage = statusMessages[status] || `Your support ticket status has been updated to ${formatRoleName(status)}.`;
    const responseText = adminResponse ? `\n\nAdmin Response:\n${adminResponse}` : '';
    const adminText = adminName ? `\n\nResponded by: ${adminName}` : '';

    const emailSubject = `Support Ticket Update - ${ticket.ticketNumber} | Healiinn`;
    const emailText = `Hello ${ticket.name},

${statusMessage}

Ticket Number: ${ticket.ticketNumber}
Subject: ${ticket.subject}${responseText}${adminText}

Thank you,
Healiinn Support Team`;

    const emailHtml = `
      <p>Hello ${ticket.name},</p>
      <p>${statusMessage}</p>
      <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
      <p><strong>Subject:</strong> ${ticket.subject}</p>
      ${adminResponse ? `<p><strong>Admin Response:</strong></p><p>${adminResponse}</p>` : ''}
      ${adminName ? `<p><strong>Responded by:</strong> ${adminName}</p>` : ''}
      <p>Thank you,<br/>Healiinn Support Team</p>
    `;

    // Send email to user
    await sendEmail({
      to: ticket.email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    }).catch((error) => console.error(`Failed to send support ticket update email to ${ticket.email}`, error));

    // Send push notification to user
    try {
      await publishNotification({
        type: 'SUPPORT_TICKET_UPDATED',
        recipients: [
          {
            role: ticket.role,
            userId: ticket.userId,
          },
        ],
        context: {
          ticketNumber: ticket.ticketNumber,
          status,
          adminResponse: adminResponse || undefined,
        },
        data: {
          ticketId: ticket._id.toString(),
          ticketNumber: ticket.ticketNumber,
          status,
        },
      });
    } catch (error) {
      console.error('Failed to publish user support ticket notification', error);
    }
  } catch (error) {
    console.error('Failed to notify user of support ticket update', error);
  }
};

// Create support ticket (All roles)
exports.createSupportTicket = asyncHandler(async (req, res) => {
  const { subject, message, priority, attachments } = req.body;
  const { id, role } = req.auth;

  // Get user details
  const Model = require(`../../models/${ROLE_TO_MODEL[role]}`);
  const user = await Model.findById(id).select('firstName lastName labName pharmacyName ownerName name email phone');

  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  // Extract name and email
  let userName = user.name;
  if (!userName) {
    if (user.firstName && user.lastName) {
      userName = `${user.firstName} ${user.lastName}`.trim();
    } else {
      userName = user.labName || user.pharmacyName || user.ownerName || 'User';
    }
  }

  const userEmail = user.email || req.body.email;
  if (!userEmail) {
    const error = new Error('Email is required');
    error.status = 400;
    throw error;
  }

  if (!subject || !message) {
    const error = new Error('Subject and message are required');
    error.status = 400;
    throw error;
  }

  // Validate priority
  const ticketPriority = priority && Object.values(SUPPORT_TICKET_PRIORITY).includes(priority) ? priority : SUPPORT_TICKET_PRIORITY.MEDIUM;

  // Create ticket
  const ticket = await SupportTicket.create({
    role,
    userId: toObjectId(id),
    userModel: ROLE_TO_MODEL[role],
    name: userName,
    email: userEmail,
    subject: subject.trim(),
    message: message.trim(),
    priority: ticketPriority,
    status: SUPPORT_TICKET_STATUS.OPEN,
    attachments: attachments || [],
  });

  // Notify admin asynchronously
  notifyAdminNewTicket({
    ticket,
    role,
    name: userName,
    email: userEmail,
    subject: subject.trim(),
  }).catch((error) => console.error('Failed to notify admin of new ticket', error));

  res.status(201).json({
    success: true,
    message: 'Support ticket created successfully',
    data: {
      ticket: {
        id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt,
      },
    },
  });
});

// List support tickets (Admin only - with filters)
exports.listSupportTickets = asyncHandler(async (req, res) => {
  if (req.auth.role !== ROLES.ADMIN) {
    const error = new Error('Only admins can list all support tickets');
    error.status = 403;
    throw error;
  }

  const { role, status, priority, page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(Number.parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  // Build query
  const query = {};
  if (role && Object.values(ROLES).includes(role) && role !== ROLES.ADMIN) {
    query.role = role;
  }
  if (status && Object.values(SUPPORT_TICKET_STATUS).includes(status)) {
    query.status = status;
  }
  if (priority && Object.values(SUPPORT_TICKET_PRIORITY).includes(priority)) {
    query.priority = priority;
  }

  const [tickets, total] = await Promise.all([
    SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('respondedBy', 'name email')
      .populate('closedBy', 'name email')
      .lean(),
    SupportTicket.countDocuments(query),
  ]);

  // Get counts by role and status
  const [countsByRole, countsByStatus] = await Promise.all([
    SupportTicket.aggregate([
      {
        $group: {
          _id: '$role',
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ['$status', SUPPORT_TICKET_STATUS.OPEN] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', SUPPORT_TICKET_STATUS.IN_PROGRESS] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', SUPPORT_TICKET_STATUS.RESOLVED] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ['$status', SUPPORT_TICKET_STATUS.CLOSED] }, 1, 0] } },
        },
      },
    ]),
    SupportTicket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const roleSummary = countsByRole.reduce((acc, item) => {
    acc[item._id] = {
      total: item.total,
      open: item.open,
      inProgress: item.inProgress,
      resolved: item.resolved,
      closed: item.closed,
    };
    return acc;
  }, {});

  const statusSummary = countsByStatus.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  res.json({
    success: true,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum) || 1,
    },
    summary: {
      byRole: roleSummary,
      byStatus: statusSummary,
    },
    tickets: tickets.map((ticket) => ({
      id: ticket._id,
      ticketNumber: ticket.ticketNumber,
      role: ticket.role,
      name: ticket.name,
      email: ticket.email,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
      priority: ticket.priority,
      adminResponse: ticket.adminResponse || null,
      respondedBy: ticket.respondedBy
        ? {
            id: ticket.respondedBy._id,
            name: ticket.respondedBy.name || ticket.respondedBy.email,
          }
        : null,
      respondedAt: ticket.respondedAt || null,
      closedBy: ticket.closedBy
        ? {
            id: ticket.closedBy._id,
            name: ticket.closedBy.name || ticket.closedBy.email,
          }
        : null,
      closedAt: ticket.closedAt || null,
      attachments: ticket.attachments || [],
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    })),
  });
});

// Get user's own support tickets (All roles)
exports.getMySupportTickets = asyncHandler(async (req, res) => {
  const { id, role } = req.auth;
  const { status, page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(Number.parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const query = { userId: toObjectId(id), role };
  if (status && Object.values(SUPPORT_TICKET_STATUS).includes(status)) {
    query.status = status;
  }

  const [tickets, total] = await Promise.all([
    SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    SupportTicket.countDocuments(query),
  ]);

  res.json({
    success: true,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum) || 1,
    },
    tickets: tickets.map((ticket) => ({
      id: ticket._id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
      priority: ticket.priority,
      adminResponse: ticket.adminResponse || null,
      respondedAt: ticket.respondedAt || null,
      closedAt: ticket.closedAt || null,
      attachments: ticket.attachments || [],
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    })),
  });
});

// Get support ticket details (Admin or ticket owner)
exports.getSupportTicketDetails = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const { id, role } = req.auth;

  const ticket = await SupportTicket.findById(ticketId)
    .populate('respondedBy', 'name email')
    .populate('closedBy', 'name email')
    .lean();

  if (!ticket) {
    const error = new Error('Support ticket not found');
    error.status = 404;
    throw error;
  }

  // Check access: Admin or ticket owner
  if (role !== ROLES.ADMIN && (ticket.userId.toString() !== id || ticket.role !== role)) {
    const error = new Error('You do not have access to this ticket');
    error.status = 403;
    throw error;
  }

  res.json({
    success: true,
    ticket: {
      id: ticket._id,
      ticketNumber: ticket.ticketNumber,
      role: ticket.role,
      name: ticket.name,
      email: ticket.email,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
      priority: ticket.priority,
      adminResponse: ticket.adminResponse || null,
      respondedBy: ticket.respondedBy
        ? {
            id: ticket.respondedBy._id,
            name: ticket.respondedBy.name || ticket.respondedBy.email,
            email: ticket.respondedBy.email,
          }
        : null,
      respondedAt: ticket.respondedAt || null,
      closedBy: ticket.closedBy
        ? {
            id: ticket.closedBy._id,
            name: ticket.closedBy.name || ticket.closedBy.email,
            email: ticket.closedBy.email,
          }
        : null,
      closedAt: ticket.closedAt || null,
      attachments: ticket.attachments || [],
      metadata: ticket.metadata || null,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    },
  });
});

// Update support ticket status (Admin only)
exports.updateSupportTicketStatus = asyncHandler(async (req, res) => {
  if (req.auth.role !== ROLES.ADMIN) {
    const error = new Error('Only admins can update ticket status');
    error.status = 403;
    throw error;
  }

  const { ticketId } = req.params;
  const { status, adminResponse } = req.body;

  if (!status || !Object.values(SUPPORT_TICKET_STATUS).includes(status)) {
    const error = new Error(`Status must be one of: ${Object.values(SUPPORT_TICKET_STATUS).join(', ')}`);
    error.status = 400;
    throw error;
  }

  const ticket = await SupportTicket.findById(ticketId).populate('respondedBy', 'name email');

  if (!ticket) {
    const error = new Error('Support ticket not found');
    error.status = 404;
    throw error;
  }

  // Update ticket
  const updateData = {
    status,
  };

  if (adminResponse && adminResponse.trim()) {
    updateData.adminResponse = adminResponse.trim();
    updateData.respondedBy = toObjectId(req.auth.id);
    updateData.respondedAt = new Date();
  }

  if (status === SUPPORT_TICKET_STATUS.CLOSED) {
    updateData.closedBy = toObjectId(req.auth.id);
    updateData.closedAt = new Date();
  }

  const updatedTicket = await SupportTicket.findByIdAndUpdate(ticketId, updateData, { new: true })
    .populate('respondedBy', 'name email')
    .populate('closedBy', 'name email')
    .lean();

  // Get admin name for notification
  const admin = await Admin.findById(req.auth.id).select('name email');
  const adminName = admin?.name || admin?.email || 'Admin';

  // Notify user asynchronously
  notifyUserTicketUpdate({
    ticket: updatedTicket,
    status,
    adminResponse: adminResponse || updatedTicket.adminResponse,
    adminName,
  }).catch((error) => console.error('Failed to notify user of ticket update', error));

  res.json({
    success: true,
    message: 'Support ticket updated successfully',
    ticket: {
      id: updatedTicket._id,
      ticketNumber: updatedTicket.ticketNumber,
      status: updatedTicket.status,
      priority: updatedTicket.priority,
      adminResponse: updatedTicket.adminResponse || null,
      respondedBy: updatedTicket.respondedBy
        ? {
            id: updatedTicket.respondedBy._id,
            name: updatedTicket.respondedBy.name || updatedTicket.respondedBy.email,
          }
        : null,
      respondedAt: updatedTicket.respondedAt || null,
      closedBy: updatedTicket.closedBy
        ? {
            id: updatedTicket.closedBy._id,
            name: updatedTicket.closedBy.name || updatedTicket.closedBy.email,
          }
        : null,
      closedAt: updatedTicket.closedAt || null,
      updatedAt: updatedTicket.updatedAt,
    },
  });
});

// Add admin response to ticket (Admin only)
exports.addAdminResponse = asyncHandler(async (req, res) => {
  if (req.auth.role !== ROLES.ADMIN) {
    const error = new Error('Only admins can add responses');
    error.status = 403;
    throw error;
  }

  const { ticketId } = req.params;
  const { response, status } = req.body;

  if (!response || !response.trim()) {
    const error = new Error('Response is required');
    error.status = 400;
    throw error;
  }

  const ticket = await SupportTicket.findById(ticketId);

  if (!ticket) {
    const error = new Error('Support ticket not found');
    error.status = 404;
    throw error;
  }

  // Update ticket
  const updateData = {
    adminResponse: response.trim(),
    respondedBy: toObjectId(req.auth.id),
    respondedAt: new Date(),
  };

  // If status is provided and different, update it
  if (status && Object.values(SUPPORT_TICKET_STATUS).includes(status) && status !== ticket.status) {
    updateData.status = status;

    if (status === SUPPORT_TICKET_STATUS.CLOSED) {
      updateData.closedBy = toObjectId(req.auth.id);
      updateData.closedAt = new Date();
    }
  } else if (!updateData.status) {
    // If no status provided, set to IN_PROGRESS if it's OPEN
    if (ticket.status === SUPPORT_TICKET_STATUS.OPEN) {
      updateData.status = SUPPORT_TICKET_STATUS.IN_PROGRESS;
    }
  }

  const updatedTicket = await SupportTicket.findByIdAndUpdate(ticketId, updateData, { new: true })
    .populate('respondedBy', 'name email')
    .populate('closedBy', 'name email')
    .lean();

  // Get admin name for notification
  const admin = await Admin.findById(req.auth.id).select('name email');
  const adminName = admin?.name || admin?.email || 'Admin';

  // Notify user asynchronously
  notifyUserTicketUpdate({
    ticket: updatedTicket,
    status: updateData.status || ticket.status,
    adminResponse: response.trim(),
    adminName,
  }).catch((error) => console.error('Failed to notify user of ticket response', error));

  res.json({
    success: true,
    message: 'Response added successfully',
    ticket: {
      id: updatedTicket._id,
      ticketNumber: updatedTicket.ticketNumber,
      status: updatedTicket.status,
      priority: updatedTicket.priority,
      adminResponse: updatedTicket.adminResponse,
      respondedBy: updatedTicket.respondedBy
        ? {
            id: updatedTicket.respondedBy._id,
            name: updatedTicket.respondedBy.name || updatedTicket.respondedBy.email,
          }
        : null,
      respondedAt: updatedTicket.respondedAt,
      closedBy: updatedTicket.closedBy
        ? {
            id: updatedTicket.closedBy._id,
            name: updatedTicket.closedBy.name || updatedTicket.closedBy.email,
          }
        : null,
      closedAt: updatedTicket.closedAt || null,
      updatedAt: updatedTicket.updatedAt,
    },
  });
});

