const asyncHandler = require('../../middleware/asyncHandler');
const Appointment = require('../../models/Appointment');
const Session = require('../../models/Session');
const { getIO } = require('../../config/socket');
const { calculateQueueETAs, recalculateSessionETAs } = require('../../services/etaService');
const { pauseSession, resumeSession, callNextPatient } = require('../../services/sessionService');
const { SESSION_STATUS } = require('../../utils/constants');

// GET /api/doctors/queue
exports.getQueue = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { date } = req.query;

  const sessionDate = date ? new Date(date) : new Date();
  sessionDate.setHours(0, 0, 0, 0);
  const sessionEndDate = new Date(sessionDate);
  sessionEndDate.setHours(23, 59, 59, 999);

  const session = await Session.findOne({
    doctorId: id,
    date: { $gte: sessionDate, $lt: sessionEndDate },
    status: { $in: [SESSION_STATUS.SCHEDULED, SESSION_STATUS.LIVE, SESSION_STATUS.PAUSED] },
  });

  if (!session) {
    return res.status(200).json({
      success: true,
      data: {
        session: null,
        queue: [],
        currentToken: 0,
      },
    });
  }

  const appointments = await Appointment.find({
    sessionId: session._id,
    status: { $in: ['scheduled', 'confirmed'] },
  })
    .populate('patientId', 'firstName lastName phone profileImage')
    .sort({ tokenNumber: 1 });

  // Calculate ETAs for all appointments
  const etas = await calculateQueueETAs(session._id);
  const etaMap = {};
  etas.forEach(eta => {
    etaMap[eta.appointmentId.toString()] = {
      estimatedWaitMinutes: eta.estimatedWaitMinutes,
      estimatedCallTime: eta.estimatedCallTime,
      patientsAhead: eta.patientsAhead,
    };
  });

  // Add ETA to appointments
  const appointmentsWithETA = appointments.map(apt => ({
    ...apt.toObject(),
    eta: etaMap[apt._id.toString()] || null,
  }));

  return res.status(200).json({
    success: true,
    data: {
      session: {
        _id: session._id,
        date: session.date,
        currentToken: session.currentToken,
        maxTokens: session.maxTokens,
        status: session.status,
        isPaused: session.isPaused || false,
        sessionStartTime: session.sessionStartTime,
        sessionEndTime: session.sessionEndTime,
      },
      queue: appointmentsWithETA,
      currentToken: session.currentToken,
    },
  });
});

// PATCH /api/doctors/queue/:appointmentId/move
exports.moveInQueue = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { appointmentId } = req.params;
  const { direction } = req.body; // 'up' or 'down'

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    doctorId: id,
  }).populate('sessionId');

  if (!appointment || !appointment.sessionId) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found or no session',
    });
  }

  const session = appointment.sessionId;
  const appointments = await Appointment.find({
    sessionId: session._id,
    status: { $in: ['scheduled', 'confirmed'] },
  }).sort({ tokenNumber: 1 });

  const currentIndex = appointments.findIndex(a => a._id.toString() === appointmentId);
  if (currentIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found in queue',
    });
  }

  if (direction === 'up' && currentIndex > 0) {
    // Swap with previous
    const prevAppointment = appointments[currentIndex - 1];
    const tempToken = appointment.tokenNumber;
    appointment.tokenNumber = prevAppointment.tokenNumber;
    prevAppointment.tokenNumber = tempToken;
    await appointment.save();
    await prevAppointment.save();
  } else if (direction === 'down' && currentIndex < appointments.length - 1) {
    // Swap with next
    const nextAppointment = appointments[currentIndex + 1];
    const tempToken = appointment.tokenNumber;
    appointment.tokenNumber = nextAppointment.tokenNumber;
    nextAppointment.tokenNumber = tempToken;
    await appointment.save();
    await nextAppointment.save();
  }

  // Emit real-time event
  try {
    const io = getIO();
    io.to(`doctor-${id}`).emit('queue:updated', {
      sessionId: session._id,
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  // Recalculate ETAs after queue move
  try {
    const etas = await recalculateSessionETAs(session._id);
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
  } catch (error) {
    console.error('Error recalculating ETAs:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Queue position updated',
  });
});

// PATCH /api/doctors/queue/:appointmentId/skip
exports.skipPatient = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { appointmentId } = req.params;

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    doctorId: id,
  });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  appointment.queueStatus = 'skipped';
  await appointment.save();

  // Update session current token if this was the current token
  if (appointment.sessionId) {
    const session = await Session.findById(appointment.sessionId);
    if (session && session.currentToken === appointment.tokenNumber) {
      // Move to next token if this was current
      session.currentToken = appointment.tokenNumber + 1;
      await session.save();
    }
  }

  // Emit real-time event
  try {
    const io = getIO();
    io.to(`doctor-${id}`).emit('queue:updated', {
      appointmentId: appointment._id,
    });
    io.to(`patient-${appointment.patientId}`).emit('appointment:skipped', {
      appointmentId: appointment._id,
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  // Create notification for patient
  try {
    const { createAppointmentNotification } = require('../../services/notificationService');
    const Doctor = require('../../models/Doctor');
    const doctor = await Doctor.findById(id);

    await createAppointmentNotification({
      userId: appointment.patientId,
      userType: 'patient',
      appointment,
      eventType: 'skipped',
      doctor,
    }).catch((error) => console.error('Error creating skip notification:', error));
  } catch (error) {
    console.error('Error creating notifications:', error);
  }

  // Recalculate ETAs after skip
  try {
    if (appointment.sessionId) {
      const etas = await recalculateSessionETAs(appointment.sessionId);
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
  } catch (error) {
    console.error('Error recalculating ETAs:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Patient skipped',
  });
});

// PATCH /api/doctors/queue/:appointmentId/recall - Re-call a patient
exports.recallPatient = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { appointmentId } = req.params;

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    doctorId: id,
  });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  // Can only recall skipped or no-show patients
  if (!['skipped', 'no-show'].includes(appointment.queueStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Can only recall skipped or no-show patients',
    });
  }

  // Change status back to waiting
  appointment.queueStatus = 'waiting';
  await appointment.save();

  // Recalculate ETAs
  try {
    if (appointment.sessionId) {
      const etas = await recalculateSessionETAs(appointment.sessionId);
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
  } catch (error) {
    console.error('Error recalculating ETAs:', error);
  }

  // Emit real-time event
  try {
    const io = getIO();
    io.to(`doctor-${id}`).emit('queue:updated', {
      appointmentId: appointment._id,
      status: 'waiting',
    });
    io.to(`patient-${appointment.patientId}`).emit('token:recalled', {
      appointmentId: appointment._id,
      tokenNumber: appointment.tokenNumber,
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  // Create notification for patient
  try {
    const { createAppointmentNotification } = require('../../services/notificationService');
    const Doctor = require('../../models/Doctor');
    const doctor = await Doctor.findById(id);

    await createAppointmentNotification({
      userId: appointment.patientId,
      userType: 'patient',
      appointment,
      eventType: 'token_recalled',
      doctor,
    }).catch((error) => console.error('Error creating recall notification:', error));
  } catch (error) {
    console.error('Error creating notifications:', error);
  }

        // Create notification for patient
        try {
          const { createAppointmentNotification } = require('../../services/notificationService');
          const Doctor = require('../../models/Doctor');
          const doctor = await Doctor.findById(id);

          await createAppointmentNotification({
            userId: appointment.patientId,
            userType: 'patient',
            appointment,
            eventType: 'token_recalled',
            doctor,
          }).catch((error) => console.error('Error creating recall notification:', error));
        } catch (error) {
          console.error('Error creating notifications:', error);
        }

  return res.status(200).json({
    success: true,
    message: 'Patient recalled to waiting queue',
    data: appointment,
  });
});

// PATCH /api/doctors/queue/:appointmentId/status
exports.updateQueueStatus = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { appointmentId } = req.params;
  const { status } = req.body; // 'waiting', 'in-consultation', 'no-show', 'completed'

  if (!['waiting', 'in-consultation', 'no-show', 'completed'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status',
    });
  }

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    doctorId: id,
  });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  appointment.queueStatus = status;
  if (status === 'completed') {
    appointment.status = 'completed';
  } else if (status === 'no-show') {
    appointment.status = 'cancelled';
  }
  await appointment.save();

  // Create notification for patient if status is completed
  if (status === 'completed') {
    try {
      const { createAppointmentNotification } = require('../../services/notificationService');
      const Doctor = require('../../models/Doctor');
      const doctor = await Doctor.findById(id);

      await createAppointmentNotification({
        userId: appointment.patientId,
        userType: 'patient',
        appointment,
        eventType: 'completed',
        doctor,
      }).catch((error) => console.error('Error creating completion notification:', error));
    } catch (error) {
      console.error('Error creating notifications:', error);
    }
  }

  // Update session current token if completed or no-show
  if ((status === 'completed' || status === 'no-show') && appointment.sessionId) {
    const session = await Session.findById(appointment.sessionId);
    if (session && session.currentToken < appointment.tokenNumber) {
      session.currentToken = appointment.tokenNumber;
      await session.save();

      // Recalculate and emit ETA updates for all waiting patients
      const etas = await recalculateSessionETAs(session._id);
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

  // Recalculate ETAs for skip and no-show as well
  if ((status === 'skipped' || status === 'no-show') && appointment.sessionId) {
    const etas = await recalculateSessionETAs(appointment.sessionId);
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

  // Emit real-time event
  try {
    const io = getIO();
    io.to(`doctor-${id}`).emit('queue:updated', {
      appointmentId: appointment._id,
      status,
    });
    io.to(`patient-${appointment.patientId}`).emit('appointment:status:updated', {
      appointmentId: appointment._id,
      status,
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Queue status updated',
    data: appointment,
  });
});

// POST /api/doctors/queue/call-next - Call next patient
exports.callNextPatient = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: 'Session ID is required',
    });
  }

  try {
    const result = await callNextPatient(sessionId);

    // Verify doctor owns this session
    if (result.session.doctorId.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this session',
      });
    }

    // Recalculate ETAs for all waiting patients
    const etas = await recalculateSessionETAs(sessionId);
    const io = getIO();

    // Emit to doctor
    io.to(`doctor-${id}`).emit('queue:next:called', {
      appointment: result.appointment,
      session: result.session,
    });

    // Emit to called patient
    io.to(`patient-${result.appointment.patientId}`).emit('token:called', {
      appointmentId: result.appointment._id,
      tokenNumber: result.appointment.tokenNumber,
    });

    // Emit ETA updates to all waiting patients
    for (const eta of etas) {
      io.to(`patient-${eta.patientId}`).emit('token:eta:update', {
        appointmentId: eta.appointmentId,
        estimatedWaitMinutes: eta.estimatedWaitMinutes,
        estimatedCallTime: eta.estimatedCallTime,
        patientsAhead: eta.patientsAhead,
        tokenNumber: eta.tokenNumber,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Next patient called',
      data: {
        appointment: result.appointment,
        session: result.session,
        etas,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to call next patient',
    });
  }
});

// POST /api/doctors/queue/pause - Pause session
exports.pauseSession = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: 'Session ID is required',
    });
  }

  try {
    const session = await pauseSession(sessionId);

    // Verify doctor owns this session
    if (session.doctorId.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this session',
      });
    }

    // Recalculate ETAs with pause adjustment
    const etas = await recalculateSessionETAs(sessionId);
    const io = getIO();

    // Emit to doctor
    io.to(`doctor-${id}`).emit('session:paused', {
      sessionId: session._id,
      pausedAt: session.pausedAt,
    });

    // Emit ETA updates to all waiting patients
    for (const eta of etas) {
      io.to(`patient-${eta.patientId}`).emit('token:eta:update', {
        appointmentId: eta.appointmentId,
        estimatedWaitMinutes: eta.estimatedWaitMinutes,
        estimatedCallTime: eta.estimatedCallTime,
        patientsAhead: eta.patientsAhead,
        tokenNumber: eta.tokenNumber,
        isPaused: true,
      });
    }

    // Create notification for doctor
    try {
      const { createSessionNotification } = require('../../services/notificationService');
      await createSessionNotification({
        userId: id,
        userType: 'doctor',
        session,
        eventType: 'paused',
      }).catch((error) => console.error('Error creating pause notification:', error));
    } catch (error) {
      console.error('Error creating notifications:', error);
    }

    return res.status(200).json({
      success: true,
      message: 'Session paused successfully',
      data: session,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to pause session',
    });
  }
});

// POST /api/doctors/queue/resume - Resume session
exports.resumeSession = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: 'Session ID is required',
    });
  }

  try {
    const session = await resumeSession(sessionId);

    // Verify doctor owns this session
    if (session.doctorId.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this session',
      });
    }

    // Recalculate ETAs after resume
    const etas = await recalculateSessionETAs(sessionId);
    const io = getIO();

    // Emit to doctor
    io.to(`doctor-${id}`).emit('session:resumed', {
      sessionId: session._id,
      pausedDuration: session.pauseHistory[session.pauseHistory.length - 1]?.duration || 0,
    });

    // Emit ETA updates to all waiting patients
    for (const eta of etas) {
      io.to(`patient-${eta.patientId}`).emit('token:eta:update', {
        appointmentId: eta.appointmentId,
        estimatedWaitMinutes: eta.estimatedWaitMinutes,
        estimatedCallTime: eta.estimatedCallTime,
        patientsAhead: eta.patientsAhead,
        tokenNumber: eta.tokenNumber,
        isPaused: false,
      });
    }

    // Create notification for doctor
    try {
      const { createSessionNotification } = require('../../services/notificationService');
      await createSessionNotification({
        userId: id,
        userType: 'doctor',
        session,
        eventType: 'resumed',
      }).catch((error) => console.error('Error creating resume notification:', error));
    } catch (error) {
      console.error('Error creating notifications:', error);
    }

    return res.status(200).json({
      success: true,
      message: 'Session resumed successfully',
      data: session,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to resume session',
    });
  }
});

// GET /api/doctors/queue/:appointmentId/eta - Get ETA for specific appointment
exports.getAppointmentETA = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { appointmentId } = req.params;

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    doctorId: id,
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

