const asyncHandler = require('../../middleware/asyncHandler');
const Appointment = require('../../models/Appointment');

// PATCH /api/doctors/appointments/:id
exports.updateAppointment = asyncHandler(async (req, res) => {
  const { id: appointmentId } = req.params;
  const { id: doctorId } = req.auth;
  const updateData = req.body;

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  // Verify appointment belongs to this doctor
  if (appointment.doctorId.toString() !== doctorId) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to update this appointment',
    });
  }

  // Update appointment
  Object.assign(appointment, updateData);
  await appointment.save();

  // Emit real-time event
  try {
    const { getIO } = require('../../config/socket');
    const io = getIO();
    io.to(`patient-${appointment.patientId}`).emit('appointment:updated', {
      appointment: await Appointment.findById(appointment._id)
        .populate('patientId', 'firstName lastName phone')
        .populate('doctorId', 'firstName lastName specialization'),
    });
    io.to(`doctor-${appointment.doctorId}`).emit('appointment:updated', {
      appointment: await Appointment.findById(appointment._id)
        .populate('patientId', 'firstName lastName phone')
        .populate('doctorId', 'firstName lastName specialization'),
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Appointment updated successfully',
    data: await Appointment.findById(appointment._id)
      .populate('patientId', 'firstName lastName phone profileImage')
      .populate('sessionId', 'date sessionStartTime sessionEndTime'),
  });
});

// PATCH /api/doctors/appointments/:id/reschedule
exports.rescheduleAppointment = asyncHandler(async (req, res) => {
  const { id: appointmentId } = req.params;
  const { id: doctorId } = req.auth;
  const { appointmentDate, time, reason } = req.body;

  if (!appointmentDate || !time) {
    return res.status(400).json({
      success: false,
      message: 'Appointment date and time are required',
    });
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  // Verify appointment belongs to this doctor
  if (appointment.doctorId.toString() !== doctorId) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to reschedule this appointment',
    });
  }

  // Update appointment
  appointment.appointmentDate = new Date(appointmentDate);
  appointment.time = time;
  appointment.rescheduledBy = 'doctor';
  appointment.rescheduledAt = new Date();
  appointment.rescheduleReason = reason || 'Rescheduled by doctor';
  appointment.status = 'confirmed'; // Reset to confirmed when rescheduled
  await appointment.save();

  // Emit real-time event
  try {
    const { getIO } = require('../../config/socket');
    const io = getIO();
    io.to(`patient-${appointment.patientId}`).emit('appointment:rescheduled', {
      appointment: await Appointment.findById(appointment._id)
        .populate('patientId', 'firstName lastName phone')
        .populate('doctorId', 'firstName lastName specialization'),
      reason: reason || 'Rescheduled by doctor',
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Appointment rescheduled successfully',
    data: await Appointment.findById(appointment._id)
      .populate('patientId', 'firstName lastName phone profileImage')
      .populate('sessionId', 'date sessionStartTime sessionEndTime'),
  });
});
