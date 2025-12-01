const asyncHandler = require('../../middleware/asyncHandler');
const SupportTicket = require('../../models/SupportTicket');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const Pharmacy = require('../../models/Pharmacy');
const Laboratory = require('../../models/Laboratory');
const { sendSupportTicketNotification } = require('../../services/notificationService');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/admin/support
exports.getSupportTickets = asyncHandler(async (req, res) => {
  const { status, priority, userType } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (userType) filter.userType = userType;

  const [tickets, total] = await Promise.all([
    SupportTicket.find(filter)
      .populate('userId', 'firstName lastName pharmacyName labName email phone')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SupportTicket.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/admin/support/:id
exports.getSupportTicketById = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;

  const ticket = await SupportTicket.findById(ticketId)
    .populate('userId')
    .populate('assignedTo', 'name email')
    .populate('responses.userId', 'name firstName lastName pharmacyName labName');

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Support ticket not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: ticket,
  });
});

// POST /api/admin/support/:id/respond
exports.respondToTicket = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { ticketId } = req.params;
  const { message, attachments } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'Message is required',
    });
  }

  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Support ticket not found',
    });
  }

  ticket.responses.push({
    userId: id,
    userType: 'admin',
    message,
    attachments: attachments || [],
    createdAt: new Date(),
  });

  if (ticket.status === 'open') {
    ticket.status = 'in_progress';
    ticket.assignedTo = id;
  }

  await ticket.save();

  // Get user data for email
  let user = null;
  if (ticket.userType === 'patient') {
    user = await Patient.findById(ticket.userId);
  } else if (ticket.userType === 'doctor') {
    user = await Doctor.findById(ticket.userId);
  } else if (ticket.userType === 'pharmacy') {
    user = await Pharmacy.findById(ticket.userId);
  } else if (ticket.userType === 'laboratory') {
    user = await Laboratory.findById(ticket.userId);
  }

  // Emit real-time event
  try {
    const { getIO } = require('../../config/socket');
    const io = getIO();
    io.to(`${ticket.userType}-${ticket.userId}`).emit('support:ticket:responded', {
      ticket: await SupportTicket.findById(ticket._id),
    });

    // Create in-app notification for user
    try {
      const { createSupportNotification } = require('../../services/inAppNotificationService');
      const { ROLES } = require('../../utils/constants');
      await createSupportNotification({
        userId: ticket.userId,
        userType: ticket.userType,
        ticket: ticket._id,
        action: 'responded',
      }).catch((error) => console.error('Error creating support notification:', error));
    } catch (error) {
      console.error('Error creating in-app notification:', error);
    }
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  // Send email notification to user
  if (user) {
    try {
      await sendSupportTicketNotification({
        user,
        ticket,
        userType: ticket.userType,
        isResponse: true,
      }).catch((error) => console.error('Error sending support ticket response email:', error));
    } catch (error) {
      console.error('Error sending email notifications:', error);
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Response added successfully',
    data: ticket,
  });
});

// PATCH /api/admin/support/:id/status
exports.updateTicketStatus = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const { status } = req.body;

  if (!status || !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Valid status is required',
    });
  }

  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Support ticket not found',
    });
  }

  ticket.status = status;
  if (status === 'resolved') {
    ticket.resolvedAt = new Date();
  }
  if (status === 'closed') {
    ticket.closedAt = new Date();
  }

  await ticket.save();

  // Emit real-time event
  try {
    const { getIO } = require('../../config/socket');
    const io = getIO();
    io.to(`${ticket.userType}-${ticket.userId}`).emit('support:ticket:status:updated', {
      ticketId: ticket._id,
      status,
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Ticket status updated',
    data: ticket,
  });
});

