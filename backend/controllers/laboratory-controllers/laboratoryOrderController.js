const asyncHandler = require('../../middleware/asyncHandler');
const Order = require('../../models/Order');
const { getIO } = require('../../config/socket');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/labs/leads
exports.getLeads = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { startDate, endDate, status, limit: limitParam } = req.query;
  const limit = Math.min(Math.max(parseInt(limitParam, 10) || 20, 1), 100);

  const filter = { providerId: id, providerType: 'laboratory' };
  if (status) filter.status = status;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const orders = await Order.find(filter)
    .populate('patientId', 'firstName lastName phone address')
    .populate('prescriptionId')
    .sort({ createdAt: -1 })
    .limit(limit);

  return res.status(200).json({
    success: true,
    data: orders,
  });
});

// GET /api/labs/leads/:id
exports.getLeadById = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { leadId } = req.params;

  const order = await Order.findOne({
    _id: leadId,
    providerId: id,
    providerType: 'laboratory',
  })
    .populate('patientId')
    .populate('prescriptionId')
    .populate('requestId');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Lead not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: order,
  });
});

// PATCH /api/labs/leads/:id/status
exports.updateLeadStatus = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { leadId } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'accepted', 'processing', 'ready', 'delivered', 'cancelled'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Valid status is required',
    });
  }

  const order = await Order.findOne({
    _id: leadId,
    providerId: id,
    providerType: 'laboratory',
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Lead not found',
    });
  }

  order.status = status;
  await order.save();

  // Emit real-time event
  try {
    const io = getIO();
    io.to(`patient-${order.patientId}`).emit('order:status:updated', {
      orderId: order._id,
      status,
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Lead status updated successfully',
    data: order,
  });
});

