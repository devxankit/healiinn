const asyncHandler = require('../../middleware/asyncHandler');
const Request = require('../../models/Request');
const Order = require('../../models/Order');
const { getIO } = require('../../config/socket');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/laboratory/request-orders
exports.getRequestOrders = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { status } = req.query;
  const { page, limit, skip } = buildPagination(req);

  // Find requests where this laboratory is in admin response
  const filter = {
    type: 'book_test_visit',
    status: { $in: ['accepted', 'confirmed'] },
    'adminResponse.tests.labId': id,
  };

  if (status) filter.status = status;

  const [requests, total] = await Promise.all([
    Request.find(filter)
      .populate('patientId', 'firstName lastName phone address')
      .populate('prescriptionId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Request.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/laboratory/request-orders/:id
exports.getRequestOrderById = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { requestId } = req.params;

  const request = await Request.findOne({
    _id: requestId,
    type: 'book_test_visit',
    'adminResponse.tests.labId': id,
  })
    .populate('patientId')
    .populate('prescriptionId')
    .populate('orders');

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request order not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: request,
  });
});

// PATCH /api/laboratory/request-orders/:id/confirm
exports.confirmRequestOrder = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { requestId } = req.params;

  const request = await Request.findOne({
    _id: requestId,
    type: 'book_test_visit',
    'adminResponse.tests.labId': id,
  });

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request order not found',
    });
  }

  // Find or create order for this laboratory
  let order = await Order.findOne({
    requestId: request._id,
    providerId: id,
    providerType: 'laboratory',
  });

  if (!order) {
    // Create order from request tests for this laboratory
    const labTests = request.adminResponse.tests.filter(
      test => test.labId.toString() === id.toString()
    );

    const items = labTests.map(test => ({
      name: test.testName,
      quantity: 1,
      price: test.price,
      total: test.price,
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    order = await Order.create({
      patientId: request.patientId,
      providerId: id,
      providerType: 'laboratory',
      requestId: request._id,
      items,
      totalAmount,
      deliveryOption: request.visitType === 'home' ? 'home_delivery' : 'pickup',
      deliveryAddress: request.patientAddress,
      status: 'pending',
      paymentStatus: request.paymentStatus,
    });

    // Add order to request
    if (!request.orders) request.orders = [];
    request.orders.push(order._id);
    await request.save();
  }

  order.status = 'accepted';
  await order.save();

  // Emit real-time event
  try {
    const io = getIO();
    io.to(`patient-${request.patientId}`).emit('order:confirmed', {
      orderId: order._id,
      laboratoryId: id,
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Request order confirmed',
    data: order,
  });
});

// POST /api/laboratory/request-orders/:id/bill
exports.generateBill = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { requestId } = req.params;
  const { testAmount, deliveryCharge, additionalCharges } = req.body;

  const request = await Request.findOne({
    _id: requestId,
    type: 'book_test_visit',
    'adminResponse.tests.labId': id,
  });

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request order not found',
    });
  }

  const totalAmount = (testAmount || 0) + (deliveryCharge || 0) + (additionalCharges || 0);

  // Update request with billing summary
  if (!request.adminResponse.billingSummary) {
    request.adminResponse.billingSummary = {};
  }
  request.adminResponse.billingSummary = {
    testAmount: testAmount || 0,
    deliveryCharge: deliveryCharge || 0,
    additionalCharges: additionalCharges || 0,
    totalAmount,
  };
  await request.save();

  return res.status(200).json({
    success: true,
    message: 'Bill generated successfully',
    data: {
      billingSummary: request.adminResponse.billingSummary,
    },
  });
});

// PATCH /api/laboratory/request-orders/:id/status
exports.updateRequestOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { requestId } = req.params;
  const { status } = req.body;

  const order = await Order.findOne({
    requestId,
    providerId: id,
    providerType: 'laboratory',
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
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
    message: 'Order status updated',
    data: order,
  });
});

