const asyncHandler = require('../../middleware/asyncHandler');
const Request = require('../../models/Request');
const Prescription = require('../../models/Prescription');
const Patient = require('../../models/Patient');
const { createOrder } = require('../../services/paymentService');
const { getIO } = require('../../config/socket');
const { notifyAdminsOfPendingSignup } = require('../../services/adminNotificationService');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// POST /api/patients/requests
exports.createRequest = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { type, prescriptionId, visitType, patientAddress } = req.body;

  if (!type || !['order_medicine', 'book_test_visit'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request type',
    });
  }

  // Get patient data
  const Patient = require('../../models/Patient');
  const patient = await Patient.findById(id);
  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found',
    });
  }

  // Get prescription if provided
  let prescription = null;
  if (prescriptionId) {
    prescription = await Prescription.findOne({
      _id: prescriptionId,
      patientId: id,
    });
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
      });
    }
  }

  const request = await Request.create({
    patientId: id,
    type,
    prescriptionId: prescriptionId || null,
    prescription: prescription ? prescription.toObject() : null,
    visitType: type === 'book_test_visit' ? visitType : null,
    patientName: `${patient.firstName} ${patient.lastName}`,
    patientPhone: patient.phone,
    patientEmail: patient.email,
    patientAddress: patientAddress || patient.address,
    status: 'pending',
    paymentStatus: 'pending',
  });

  // Emit real-time event to admin
  try {
    const io = getIO();
    io.to('admins').emit('request:created', {
      request: await Request.findById(request._id)
        .populate('patientId', 'firstName lastName phone email'),
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  // Send email notification to admin (using existing admin notification service)
  try {
    await notifyAdminsOfPendingSignup({
      role: 'request',
      entity: request,
    }).catch((error) => console.error('Error sending admin request notification:', error));
  } catch (error) {
    console.error('Error sending email notifications:', error);
  }

  // Create in-app notification for patient
  try {
    const { createRequestNotification } = require('../../services/inAppNotificationService');
    const { ROLES } = require('../../utils/constants');
    await createRequestNotification({
      userId: id,
      userType: ROLES.PATIENT,
      request: request._id,
      action: 'created',
    }).catch((error) => console.error('Error creating request notification:', error));
  } catch (error) {
    console.error('Error creating in-app notification:', error);
  }

  return res.status(201).json({
    success: true,
    message: 'Request created successfully',
    data: request,
  });
});

// GET /api/patients/requests
exports.getRequests = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { status, type } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { patientId: id };
  if (status) filter.status = status;
  if (type) filter.type = type;

  const [requests, total] = await Promise.all([
    Request.find(filter)
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

// GET /api/patients/requests/:id
exports.getRequestById = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { requestId } = req.params;

  const request = await Request.findOne({
    _id: requestId,
    patientId: id,
  })
    .populate('prescriptionId')
    .populate('orders');

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: request,
  });
});

// POST /api/patients/requests/:id/payment/order - Create payment order for request
exports.createRequestPaymentOrder = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { requestId } = req.params;

  const request = await Request.findOne({
    _id: requestId,
    patientId: id,
  });

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found',
    });
  }

  if (request.status !== 'accepted') {
    return res.status(400).json({
      success: false,
      message: 'Request must be accepted by admin before payment',
    });
  }

  if (request.paymentConfirmed) {
    return res.status(400).json({
      success: false,
      message: 'Payment already confirmed for this request',
    });
  }

  const totalAmount = request.adminResponse?.totalAmount || 0;
  if (!totalAmount || totalAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Total amount is not set or invalid. Please wait for admin to create the bill.',
    });
  }

  // Create Razorpay order
  const order = await createOrder(totalAmount, 'INR', {
    requestId: request._id.toString(),
    patientId: id,
    type: request.type,
  });

  return res.status(200).json({
    success: true,
    message: 'Payment order created successfully',
    data: {
      orderId: order.orderId,
      amount: order.amount / 100, // Convert from paise to rupees
      currency: order.currency,
      requestId: request._id,
      totalAmount: totalAmount,
    },
  });
});

// POST /api/patients/requests/:id/payment
exports.confirmPayment = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { requestId } = req.params;
  const { paymentId, paymentMethod, orderId, signature } = req.body;

  const request = await Request.findOne({
    _id: requestId,
    patientId: id,
  });

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found',
    });
  }

  if (request.status !== 'accepted') {
    return res.status(400).json({
      success: false,
      message: 'Request must be accepted before payment',
    });
  }

  if (request.paymentConfirmed) {
    return res.status(400).json({
      success: false,
      message: 'Payment already confirmed',
    });
  }

  // Verify payment if paymentId provided
  let paymentVerified = false;
  if (paymentId && paymentMethod === 'razorpay') {
    const { verifyPayment, getPaymentDetails } = require('../../services/paymentService');
    const { orderId } = req.body;
    
    if (!orderId || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and Signature are required for Razorpay payment verification',
      });
    }

    const isValid = verifyPayment(orderId, paymentId, signature);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
      });
    }

    // Get payment details from Razorpay
    const paymentDetails = await getPaymentDetails(paymentId);
    if (paymentDetails.payment.status !== 'captured' && paymentDetails.payment.status !== 'authorized') {
      return res.status(400).json({
        success: false,
        message: 'Payment not successful',
      });
    }

    paymentVerified = true;
  } else if (!paymentId) {
    // For cash or other payment methods, allow direct confirmation
    paymentVerified = true;
  }

  if (!paymentVerified) {
    return res.status(400).json({
      success: false,
      message: 'Payment verification failed',
    });
  }

  request.paymentStatus = 'paid';
  request.paymentConfirmed = true;
  request.paymentId = paymentId || null;
  request.razorpayOrderId = req.body.orderId || null;
  request.paidAt = new Date();
  request.status = 'confirmed';
  await request.save();

  // Get patient data for email
  const patient = await Patient.findById(id);

  // Create orders for each pharmacy/lab in admin response
  const Order = require('../../models/Order');
  const orders = [];

  if (request.adminResponse.medicines && request.adminResponse.medicines.length > 0) {
    // Group medicines by pharmacy
    const pharmacyGroups = {};
    request.adminResponse.medicines.forEach((med) => {
      if (!pharmacyGroups[med.pharmacyId]) {
        pharmacyGroups[med.pharmacyId] = [];
      }
      pharmacyGroups[med.pharmacyId].push(med);
    });

    for (const [pharmacyId, medicines] of Object.entries(pharmacyGroups)) {
      const items = medicines.map(med => ({
        name: med.name,
        quantity: med.quantity,
        price: med.price,
        total: med.price * med.quantity,
      }));

      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

      const order = await Order.create({
        patientId: id,
        providerId: pharmacyId,
        providerType: 'pharmacy',
        requestId: request._id,
        items,
        totalAmount,
        deliveryOption: 'home_delivery',
        deliveryAddress: request.patientAddress,
        status: 'pending',
        paymentStatus: 'paid',
      });

      orders.push(order._id);

      // Emit real-time event
      try {
        const io = getIO();
        io.to(`pharmacy-${pharmacyId}`).emit('order:created', {
          order: await Order.findById(order._id).populate('patientId', 'firstName lastName phone'),
        });
      } catch (error) {
        console.error('Socket.IO error:', error);
      }
    }
  }

  if (request.adminResponse.tests && request.adminResponse.tests.length > 0) {
    // Group tests by lab
    const labGroups = {};
    request.adminResponse.tests.forEach((test) => {
      if (!labGroups[test.labId]) {
        labGroups[test.labId] = [];
      }
      labGroups[test.labId].push(test);
    });

    for (const [labId, tests] of Object.entries(labGroups)) {
      const items = tests.map(test => ({
        name: test.testName,
        quantity: 1,
        price: test.price,
        total: test.price,
      }));

      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

      const order = await Order.create({
        patientId: id,
        providerId: labId,
        providerType: 'laboratory',
        requestId: request._id,
        items,
        totalAmount,
        deliveryOption: request.visitType === 'home' ? 'home_delivery' : 'pickup',
        deliveryAddress: request.patientAddress,
        status: 'pending',
        paymentStatus: 'paid',
      });

      orders.push(order._id);

      // Emit real-time event
      try {
        const io = getIO();
        io.to(`laboratory-${labId}`).emit('order:created', {
          order: await Order.findById(order._id).populate('patientId', 'firstName lastName phone'),
        });
      } catch (error) {
        console.error('Socket.IO error:', error);
      }
    }
  }

  // Update request with orders
  request.orders = orders;
  await request.save();

  // Create transaction record for patient
  const Transaction = require('../../models/Transaction');
  const totalAmount = request.adminResponse.totalAmount || 0;
  
  const patientTransaction = await Transaction.create({
    userId: id,
    userType: 'patient',
    type: 'payment',
    amount: totalAmount,
    status: 'completed',
    description: `Payment for ${request.type === 'order_medicine' ? 'medicine order' : 'test booking'}`,
    referenceId: request._id.toString(),
    category: request.type === 'order_medicine' ? 'medicine' : 'test',
    paymentMethod: paymentMethod || 'razorpay',
    paymentId: paymentId || null,
    metadata: {
      requestId: request._id.toString(),
      orderId: req.body.orderId || null,
      razorpayPaymentId: paymentId || null,
    },
  });

  // Create admin transaction (payment goes to admin wallet)
  await Transaction.create({
    userId: null, // Admin doesn't have a specific user ID
    userType: 'admin',
    type: 'payment',
    amount: totalAmount,
    status: 'completed',
    description: `Payment received from patient for ${request.type === 'order_medicine' ? 'medicine order' : 'test booking'} - Request ${request._id}`,
    referenceId: request._id.toString(),
    category: request.type === 'order_medicine' ? 'medicine' : 'test',
    paymentMethod: paymentMethod || 'razorpay',
    paymentId: paymentId || null,
    metadata: {
      patientId: id,
      requestId: request._id.toString(),
      orderId: req.body.orderId || null,
      razorpayPaymentId: paymentId || null,
      totalAmount: totalAmount,
    },
  });

  // Emit real-time event
  try {
    const io = getIO();
    io.to('admins').emit('request:confirmed', {
      request: await Request.findById(request._id),
    });
    io.to('admins').emit('admin:payment:received', {
      type: request.type === 'order_medicine' ? 'medicine' : 'test',
      amount: totalAmount,
      requestId: request._id,
      patientId: id,
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  // Send payment confirmation email
  try {
    const { sendPaymentConfirmationEmail } = require('../../services/notificationService');
    await sendPaymentConfirmationEmail({
      patient,
      transaction: patientTransaction,
      order: orders.length > 0 ? { _id: orders[0] } : null,
    }).catch((error) => console.error('Error sending payment confirmation email:', error));
  } catch (error) {
    console.error('Error sending email notifications:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Payment confirmed and orders created',
    data: {
      request,
      orders,
    },
  });
});

// DELETE /api/patients/requests/:id
exports.cancelRequest = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { requestId } = req.params;

  const request = await Request.findOne({
    _id: requestId,
    patientId: id,
  });

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found',
    });
  }

  if (request.status === 'completed' || request.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Request already completed or cancelled',
    });
  }

  request.status = 'cancelled';
  await request.save();

  // Emit real-time event
  try {
    const io = getIO();
    io.to('admins').emit('request:cancelled', {
      requestId: request._id,
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Request cancelled successfully',
  });
});

