const asyncHandler = require('../../middleware/asyncHandler');
const Appointment = require('../../models/Appointment');
const Session = require('../../models/Session');
const Doctor = require('../../models/Doctor');
const Patient = require('../../models/Patient');
const { getIO } = require('../../config/socket');
const {
  sendAppointmentConfirmationEmail,
  sendDoctorAppointmentNotification,
  sendAppointmentCancellationEmail,
} = require('../../services/notificationService');
const {
  createAppointmentNotification,
} = require('../../services/inAppNotificationService');
const { ROLES } = require('../../utils/constants');
const { getOrCreateSession, checkSlotAvailability } = require('../../services/sessionService');
const { calculateAppointmentETA, recalculateSessionETAs } = require('../../services/etaService');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/patients/appointments
exports.getAppointments = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { status, date, doctor } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { patientId: id };
  if (status) filter.status = status;
  if (date) {
    const dateObj = new Date(date);
    filter.appointmentDate = {
      $gte: new Date(dateObj.setHours(0, 0, 0, 0)),
      $lt: new Date(dateObj.setHours(23, 59, 59, 999)),
    };
  }
  if (doctor) filter.doctorId = doctor;

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate('doctorId', 'firstName lastName specialization profileImage consultationFee')
      .populate('sessionId', 'date sessionStartTime sessionEndTime')
      .sort({ appointmentDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Appointment.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/patients/appointments/upcoming
exports.getUpcomingAppointments = asyncHandler(async (req, res) => {
  const { id } = req.auth;

  const appointments = await Appointment.find({
    patientId: id,
    appointmentDate: { $gte: new Date() },
    status: { $in: ['scheduled', 'confirmed'] },
  })
    .populate('doctorId', 'firstName lastName specialization profileImage consultationFee')
    .populate('sessionId', 'date sessionStartTime sessionEndTime')
    .sort({ appointmentDate: 1, time: 1 })
    .limit(10);

  return res.status(200).json({
    success: true,
    data: appointments,
  });
});

// POST /api/patients/appointments
exports.createAppointment = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { doctorId, appointmentDate, time, reason, appointmentType } = req.body;

  if (!doctorId || !appointmentDate || !time) {
    return res.status(400).json({
      success: false,
      message: 'Doctor ID, appointment date, and time are required',
    });
  }

  // Check if doctor exists and is approved
  const doctor = await Doctor.findById(doctorId);
  if (!doctor || doctor.status !== 'approved' || !doctor.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found or not available',
    });
  }

  // Check slot availability before booking
  const slotCheck = await checkSlotAvailability(doctorId, appointmentDate);
  if (!slotCheck.available) {
    return res.status(400).json({
      success: false,
      message: slotCheck.message || 'No available slots for this date. All slots are booked.',
      data: {
        totalSlots: slotCheck.totalSlots || 0,
        bookedSlots: slotCheck.bookedSlots || 0,
        availableSlots: 0,
      },
    });
  }

  // Get or create session automatically based on doctor's availability
  let session;
  try {
    session = await getOrCreateSession(doctorId, appointmentDate);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Unable to create session for this date',
    });
  }

  // Double check slot availability after session creation
  if (session.currentToken >= session.maxTokens) {
    return res.status(400).json({
      success: false,
      message: 'No available slots for this session. All slots are booked.',
      data: {
        totalSlots: session.maxTokens,
        bookedSlots: session.currentToken,
        availableSlots: 0,
      },
    });
  }

  // Create appointment
  const tokenNumber = session.currentToken + 1;
  const appointment = await Appointment.create({
    patientId: id,
    doctorId,
    sessionId: session._id,
    appointmentDate: new Date(appointmentDate),
    time,
    reason,
    appointmentType: appointmentType || 'New',
    tokenNumber,
    fee: doctor.consultationFee || 0,
    status: 'scheduled',
  });

  // Update session
  session.currentToken = tokenNumber;
  session.appointments.push(appointment._id);
  await session.save();

  // Calculate ETA for the appointment
  const eta = await calculateAppointmentETA(appointment._id);

  // Get patient data for email
  const patient = await Patient.findById(id);

  // Emit real-time event with ETA
  try {
    const io = getIO();
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'firstName lastName phone');

    io.to(`doctor-${doctorId}`).emit('appointment:created', {
      appointment: populatedAppointment,
      eta,
    });

    // Emit ETA update to patient
    if (eta) {
      io.to(`patient-${id}`).emit('token:eta:update', {
        appointmentId: appointment._id,
        estimatedWaitMinutes: eta.estimatedWaitMinutes,
        estimatedCallTime: eta.estimatedCallTime,
        patientsAhead: eta.patientsAhead,
        tokenNumber: appointment.tokenNumber,
      });
    }
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  // Send email notifications
  try {
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctorId', 'firstName lastName specialization profileImage')
      .populate('sessionId', 'date sessionStartTime sessionEndTime');

    // Send confirmation to patient
    await sendAppointmentConfirmationEmail({
      patient,
      doctor,
      appointment: populatedAppointment,
    }).catch((error) => console.error('Error sending appointment confirmation email:', error));

    // Send notification to doctor
    await sendDoctorAppointmentNotification({
      doctor,
      patient,
      appointment: populatedAppointment,
    }).catch((error) => console.error('Error sending doctor appointment notification:', error));
  } catch (error) {
    console.error('Error sending email notifications:', error);
  }

  // Create in-app notifications
  try {
    // Notification for patient
    await createAppointmentNotification({
      userId: id,
      userType: ROLES.PATIENT,
      appointment: appointment._id,
      action: 'created',
    }).catch((error) => console.error('Error creating patient notification:', error));

    // Notification for doctor
    await createAppointmentNotification({
      userId: doctorId,
      userType: ROLES.DOCTOR,
      appointment: appointment._id,
      action: 'created',
    }).catch((error) => console.error('Error creating doctor notification:', error));
  } catch (error) {
    console.error('Error creating in-app notifications:', error);
  }

  // Get appointment with ETA
  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate('doctorId', 'firstName lastName specialization profileImage')
    .populate('sessionId', 'date sessionStartTime sessionEndTime');

  return res.status(201).json({
    success: true,
    message: 'Appointment created successfully',
    data: {
      ...populatedAppointment.toObject(),
      eta,
    },
  });
});

// PATCH /api/patients/appointments/:id
exports.updateAppointment = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { appointmentId } = req.params;
  const updateData = req.body;

  const appointment = await Appointment.findOne({ _id: appointmentId, patientId: id });
  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  if (appointment.status === 'completed' || appointment.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update completed or cancelled appointment',
    });
  }

  Object.assign(appointment, updateData);
  await appointment.save();

  // Emit real-time event
  try {
    const io = getIO();
    io.to(`doctor-${appointment.doctorId}`).emit('appointment:updated', {
      appointment: await Appointment.findById(appointment._id)
        .populate('patientId', 'firstName lastName'),
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Appointment updated successfully',
    data: appointment,
  });
});

// DELETE /api/patients/appointments/:id
exports.cancelAppointment = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { appointmentId } = req.params;

  const appointment = await Appointment.findOne({ _id: appointmentId, patientId: id });
  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  if (appointment.status === 'completed' || appointment.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Appointment already completed or cancelled',
    });
  }

  appointment.status = 'cancelled';
  appointment.cancelledAt = new Date();
  await appointment.save();

  // Update session if exists
  if (appointment.sessionId) {
    const session = await Session.findById(appointment.sessionId);
    if (session) {
      session.currentToken = Math.max(0, session.currentToken - 1);
      await session.save();
    }
  }

  // Get patient and doctor data for email
  const patient = await Patient.findById(id);
  const doctor = await Doctor.findById(appointment.doctorId);

  // Emit real-time event
  try {
    const io = getIO();
    io.to(`doctor-${appointment.doctorId}`).emit('appointment:cancelled', {
      appointmentId: appointment._id,
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  // Send email notifications
  try {
    await sendAppointmentCancellationEmail({
      patient,
      doctor,
      appointment,
      cancelledBy: 'patient',
    }).catch((error) => console.error('Error sending appointment cancellation email:', error));
  } catch (error) {
    console.error('Error sending email notifications:', error);
  }

  // Create in-app notifications
  try {
    // Notification for patient
    await createAppointmentNotification({
      userId: id,
      userType: ROLES.PATIENT,
      appointment: appointment._id,
      action: 'cancelled',
    }).catch((error) => console.error('Error creating patient notification:', error));

    // Notification for doctor
    await createAppointmentNotification({
      userId: appointment.doctorId,
      userType: ROLES.DOCTOR,
      appointment: appointment._id,
      action: 'cancelled',
    }).catch((error) => console.error('Error creating doctor notification:', error));
  } catch (error) {
    console.error('Error creating in-app notifications:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Appointment cancelled successfully',
  });
});

// PATCH /api/patients/appointments/:id/reschedule - Reschedule appointment
exports.rescheduleAppointment = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { appointmentId } = req.params;
  const { appointmentDate, time } = req.body;

  if (!appointmentDate || !time) {
    return res.status(400).json({
      success: false,
      message: 'Appointment date and time are required',
    });
  }

  const appointment = await Appointment.findOne({ _id: appointmentId, patientId: id });
  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  if (appointment.status === 'completed' || appointment.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Cannot reschedule completed or cancelled appointment',
    });
  }

  // Check if new date has available slots
  const slotCheck = await checkSlotAvailability(appointment.doctorId, appointmentDate);
  if (!slotCheck.available) {
    return res.status(400).json({
      success: false,
      message: slotCheck.message || 'No available slots for the new date',
      data: {
        totalSlots: slotCheck.totalSlots || 0,
        bookedSlots: slotCheck.bookedSlots || 0,
        availableSlots: 0,
      },
    });
  }

  // Get or create session for new date
  let newSession;
  try {
    newSession = await getOrCreateSession(appointment.doctorId, appointmentDate);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Unable to create session for the new date',
    });
  }

  // Check if new session has available slots
  if (newSession.currentToken >= newSession.maxTokens) {
    return res.status(400).json({
      success: false,
      message: 'No available slots for the new date. All slots are booked.',
    });
  }

  // Update old session token count if it exists
  if (appointment.sessionId) {
    const oldSession = await Session.findById(appointment.sessionId);
    if (oldSession) {
      oldSession.currentToken = Math.max(0, oldSession.currentToken - 1);
      await oldSession.save();

      // Recalculate ETAs for old session
      const etas = await recalculateSessionETAs(oldSession._id);
      const io = getIO();
      for (const eta of etas) {
        io.to(`patient-${eta.patientId}`).emit('token:eta:update', {
          appointmentId: eta.appointmentId,
          estimatedWaitMinutes: eta.estimatedWaitMinutes,
          estimatedCallTime: eta.estimatedCallTime,
          patientsAhead: eta.patientsAhead,
          tokenNumber: eta.tokenNumber,
        });
      }
    }
  }

  // Assign new token number
  const newTokenNumber = newSession.currentToken + 1;

  // Update appointment
  appointment.appointmentDate = new Date(appointmentDate);
  appointment.time = time;
  appointment.sessionId = newSession._id;
  appointment.tokenNumber = newTokenNumber;
  appointment.status = 'scheduled';
  appointment.queueStatus = null;
  await appointment.save();

  // Update new session
  newSession.currentToken = newTokenNumber;
  newSession.appointments.push(appointment._id);
  await newSession.save();

  // Recalculate ETAs for new session
  const etas = await recalculateSessionETAs(newSession._id);
  const io = getIO();
  for (const eta of etas) {
    io.to(`patient-${eta.patientId}`).emit('token:eta:update', {
      appointmentId: eta.appointmentId,
      estimatedWaitMinutes: eta.estimatedWaitMinutes,
      estimatedCallTime: eta.estimatedCallTime,
      patientsAhead: eta.patientsAhead,
      tokenNumber: eta.tokenNumber,
    });
  }

  // Emit real-time event
  io.to(`doctor-${appointment.doctorId}`).emit('appointment:rescheduled', {
    appointment: await Appointment.findById(appointment._id)
      .populate('patientId', 'firstName lastName'),
  });

  // Send email notification
  try {
    const patient = await Patient.findById(id);
    const doctor = await Doctor.findById(appointment.doctorId);
    await sendAppointmentConfirmationEmail({
      patient,
      doctor,
      appointment: await Appointment.findById(appointment._id)
        .populate('sessionId', 'date sessionStartTime sessionEndTime'),
    }).catch((error) => console.error('Error sending reschedule email:', error));
  } catch (error) {
    console.error('Error sending email notification:', error);
  }

  // Create in-app notifications
  try {
    // Notification for patient
    await createAppointmentNotification({
      userId: id,
      userType: ROLES.PATIENT,
      appointment: appointment._id,
      action: 'rescheduled',
    }).catch((error) => console.error('Error creating patient notification:', error));

    // Notification for doctor
    await createAppointmentNotification({
      userId: appointment.doctorId,
      userType: ROLES.DOCTOR,
      appointment: appointment._id,
      action: 'rescheduled',
    }).catch((error) => console.error('Error creating doctor notification:', error));
  } catch (error) {
    console.error('Error creating in-app notifications:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Appointment rescheduled successfully',
    data: await Appointment.findById(appointment._id)
      .populate('doctorId', 'firstName lastName specialization profileImage')
      .populate('sessionId', 'date sessionStartTime sessionEndTime'),
  });
});

// GET /api/patients/appointments/:id/eta - Get ETA for appointment
exports.getAppointmentETA = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { id: appointmentId } = req.params;

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    patientId: id,
  });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  const eta = await calculateAppointmentETA(appointmentId);

  if (!eta) {
    return res.status(400).json({
      success: false,
      message: 'Unable to calculate ETA for this appointment',
    });
  }

  return res.status(200).json({
    success: true,
    data: eta,
  });
});

// POST /api/patients/appointments/:id/payment/order - Create payment order for appointment
exports.createAppointmentPaymentOrder = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { appointmentId } = req.params;

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    patientId: id,
  });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  if (appointment.paymentStatus === 'paid') {
    return res.status(400).json({
      success: false,
      message: 'Payment already completed for this appointment',
    });
  }

  if (!appointment.fee || appointment.fee <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Appointment fee is not set or invalid',
    });
  }

  // Create Razorpay order
  const { createOrder } = require('../../services/paymentService');
  const order = await createOrder(appointment.fee, 'INR', {
    appointmentId: appointment._id.toString(),
    patientId: id,
    type: 'appointment',
  });

  return res.status(200).json({
    success: true,
    message: 'Payment order created successfully',
    data: {
      orderId: order.orderId,
      amount: order.amount / 100, // Convert from paise to rupees
      currency: order.currency,
      appointmentId: appointment._id,
    },
  });
});

// POST /api/patients/appointments/:id/payment/verify - Verify and confirm appointment payment
exports.verifyAppointmentPayment = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { appointmentId } = req.params;
  const { paymentId, orderId, signature, paymentMethod } = req.body;

  if (!paymentId || !orderId || !signature) {
    return res.status(400).json({
      success: false,
      message: 'Payment ID, Order ID, and Signature are required',
    });
  }

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    patientId: id,
  });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  if (appointment.paymentStatus === 'paid') {
    return res.status(400).json({
      success: false,
      message: 'Payment already completed for this appointment',
    });
  }

  // Verify payment signature
  const { verifyPayment, getPaymentDetails } = require('../../services/paymentService');
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

  // Update appointment payment status
  appointment.paymentStatus = 'paid';
  appointment.paymentId = paymentId;
  appointment.razorpayOrderId = orderId;
  appointment.paidAt = new Date();
  await appointment.save();

  // Create transaction record
  const Transaction = require('../../models/Transaction');
  const transaction = await Transaction.create({
    userId: id,
    userType: 'patient',
    type: 'payment',
    amount: appointment.fee,
    status: 'completed',
    description: `Appointment payment for Dr. ${appointment.doctorId}`,
    referenceId: appointment._id.toString(),
    category: 'appointment',
    paymentMethod: paymentMethod || 'razorpay',
    paymentId: paymentId,
    appointmentId: appointment._id,
    metadata: {
      orderId: orderId,
      razorpayPaymentId: paymentId,
    },
  });

  // Create admin transaction (payment goes to admin wallet)
  await Transaction.create({
    userId: null, // Admin doesn't have a specific user ID, we'll use null
    userType: 'admin',
    type: 'payment',
    amount: appointment.fee,
    status: 'completed',
    description: `Appointment payment received from patient for appointment ${appointment._id}`,
    referenceId: appointment._id.toString(),
    category: 'appointment',
    paymentMethod: paymentMethod || 'razorpay',
    paymentId: paymentId,
    appointmentId: appointment._id,
    metadata: {
      patientId: id,
      orderId: orderId,
      razorpayPaymentId: paymentId,
    },
  });

  // Get patient data for email
  const patient = await Patient.findById(id);

  // Send payment confirmation email
  try {
    const { sendPaymentConfirmationEmail } = require('../../services/notificationService');
    await sendPaymentConfirmationEmail({
      patient,
      transaction,
      order: null,
    }).catch((error) => console.error('Error sending payment confirmation email:', error));
  } catch (error) {
    console.error('Error sending email notifications:', error);
  }

  // Emit real-time event
  try {
    const io = getIO();
    io.to(`patient-${id}`).emit('appointment:payment:confirmed', {
      appointmentId: appointment._id,
      paymentId: paymentId,
    });
    io.to('admins').emit('admin:payment:received', {
      type: 'appointment',
      amount: appointment.fee,
      appointmentId: appointment._id,
      patientId: id,
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Payment verified and confirmed successfully',
    data: {
      appointment: await Appointment.findById(appointment._id)
        .populate('doctorId', 'firstName lastName specialization'),
      transaction,
    },
  });
});

