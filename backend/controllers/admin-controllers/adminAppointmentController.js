const asyncHandler = require('../../middleware/asyncHandler');
const Appointment = require('../../models/Appointment');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/admin/appointments
exports.getAppointments = asyncHandler(async (req, res) => {
  const { doctor, date, status } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = {};
  if (doctor) filter.doctorId = doctor;
  if (status) filter.status = status;
  if (date) {
    const dateObj = new Date(date);
    filter.appointmentDate = {
      $gte: new Date(dateObj.setHours(0, 0, 0, 0)),
      $lt: new Date(dateObj.setHours(23, 59, 59, 999)),
    };
  }

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate('patientId', 'firstName lastName phone')
      .populate('doctorId', 'firstName lastName specialization')
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

// GET /api/admin/appointments/:id
exports.getAppointmentById = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;

  const appointment = await Appointment.findById(appointmentId)
    .populate('patientId')
    .populate('doctorId')
    .populate('sessionId')
    .populate('consultationId');

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: appointment,
  });
});

// PATCH /api/admin/appointments/:id
exports.updateAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const updateData = req.body;

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  Object.assign(appointment, updateData);
  await appointment.save();

  // Emit real-time event
  try {
    const { getIO } = require('../../config/socket');
    const io = getIO();
    io.to(`patient-${appointment.patientId}`).emit('appointment:updated', {
      appointment: await Appointment.findById(appointment._id),
    });
    io.to(`doctor-${appointment.doctorId}`).emit('appointment:updated', {
      appointment: await Appointment.findById(appointment._id),
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

// DELETE /api/admin/appointments/:id
exports.cancelAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  appointment.status = 'cancelled';
  appointment.cancelledAt = new Date();
  await appointment.save();

  // Emit real-time event
  try {
    const { getIO } = require('../../config/socket');
    const io = getIO();
    io.to(`patient-${appointment.patientId}`).emit('appointment:cancelled', {
      appointmentId: appointment._id,
    });
    io.to(`doctor-${appointment.doctorId}`).emit('appointment:cancelled', {
      appointmentId: appointment._id,
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Appointment cancelled successfully',
  });
});

