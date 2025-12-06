const asyncHandler = require('../../middleware/asyncHandler');
const Session = require('../../models/Session');
const Doctor = require('../../models/Doctor');
const Appointment = require('../../models/Appointment');
const { SESSION_STATUS } = require('../../utils/constants');
const { getOrCreateSession } = require('../../services/sessionService');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// POST /api/doctors/sessions
exports.createSession = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { date, sessionStartTime, sessionEndTime } = req.body;

  if (!date || !sessionStartTime || !sessionEndTime) {
    return res.status(400).json({
      success: false,
      message: 'Date, start time, and end time are required',
    });
  }

  const sessionDate = new Date(date);
  sessionDate.setHours(0, 0, 0, 0);
  const sessionEndDate = new Date(sessionDate);
  sessionEndDate.setHours(23, 59, 59, 999);

  // Check if session already exists for this date
  const existingSession = await Session.findOne({
    doctorId: id,
    date: { $gte: sessionDate, $lt: sessionEndDate },
  });

  if (existingSession) {
    return res.status(400).json({
      success: false,
      message: 'Session already exists for this date',
    });
  }

  // Get doctor to calculate max tokens
  const doctor = await Doctor.findById(id);
  const avgConsultation = doctor.averageConsultationMinutes || 20;

  // Calculate duration in minutes
  const [startHours, startMinutes] = sessionStartTime.split(':').map(Number);
  const [endHours, endMinutes] = sessionEndTime.split(':').map(Number);
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  const duration = endTotalMinutes - startTotalMinutes;
  const maxTokens = Math.floor(duration / avgConsultation);

  const session = await Session.create({
    doctorId: id,
    date: sessionDate,
    sessionStartTime,
    sessionEndTime,
    maxTokens,
    status: SESSION_STATUS.SCHEDULED,
  });

  return res.status(201).json({
    success: true,
    message: 'Session created successfully',
    data: session,
  });
});

// GET /api/doctors/sessions
exports.getSessions = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { date, status } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { doctorId: id };
  if (status) filter.status = status;
  if (date) {
    const dateObj = new Date(date);
    filter.date = {
      $gte: new Date(dateObj.setHours(0, 0, 0, 0)),
      $lt: new Date(dateObj.setHours(23, 59, 59, 999)),
    };
  }

  const [sessions, total] = await Promise.all([
    Session.find(filter)
      .populate('appointments', 'patientId appointmentDate time tokenNumber status')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    Session.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// PATCH /api/doctors/sessions/:id
exports.updateSession = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const sessionId = req.params.id || req.params.sessionId; // Support both :id and :sessionId
  const { status, sessionStartTime, sessionEndTime, notes } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: 'Session ID is required',
    });
  }

  const session = await Session.findOne({
    _id: sessionId,
    doctorId: id,
  });

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found',
    });
  }

      if (status === SESSION_STATUS.LIVE && !session.startedAt) {
        session.startedAt = new Date();
      }

  if (status === SESSION_STATUS.COMPLETED && !session.endedAt) {
    session.endedAt = new Date();
  }

  if (sessionStartTime) session.sessionStartTime = sessionStartTime;
  if (sessionEndTime) session.sessionEndTime = sessionEndTime;
  if (status) session.status = status;
  if (notes) session.notes = notes;

  await session.save();

  // If session status changed to LIVE, recalculate ETAs for all waiting appointments
  if (status === SESSION_STATUS.LIVE) {
    try {
      const { recalculateSessionETAs } = require('../../services/etaService');
      const { getIO } = require('../../config/socket');
      const io = getIO();
      
      const etas = await recalculateSessionETAs(session._id);
      
      // Send ETA updates to all waiting patients via Socket.IO
      for (const eta of etas) {
        if (eta.patientId) {
          io.to(`patient-${eta.patientId}`).emit('token:eta:update', {
            appointmentId: eta.appointmentId,
            estimatedWaitMinutes: eta.estimatedWaitMinutes,
            estimatedCallTime: eta.estimatedCallTime,
            patientsAhead: eta.patientsAhead,
            tokenNumber: eta.tokenNumber,
          });
        }
      }
      
      console.log(`✅ Session started: Recalculated and sent ETAs for ${etas.length} appointments`);
    } catch (error) {
      console.error('Error recalculating ETAs on session start:', error);
    }
  }

  // Emit real-time event
  try {
    const { getIO } = require('../../config/socket');
    const io = getIO();
    io.to(`doctor-${id}`).emit('session:updated', {
      session: await Session.findById(session._id),
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  // Create notification for doctor based on status
  if (status) {
    try {
      const { createSessionNotification } = require('../../services/notificationService');
      let eventType = null;
      
      if (status === SESSION_STATUS.LIVE) {
        eventType = 'started';
      } else if (status === SESSION_STATUS.PAUSED) {
        eventType = 'paused';
      } else if (status === SESSION_STATUS.COMPLETED) {
        eventType = 'completed';
      }

      if (eventType) {
        await createSessionNotification({
          userId: id,
          userType: 'doctor',
          session,
          eventType,
        }).catch((error) => console.error('Error creating session notification:', error));
      }
    } catch (error) {
      console.error('Error creating notifications:', error);
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Session updated successfully',
    data: session,
  });
});

// DELETE /api/doctors/sessions/:id
exports.deleteSession = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const sessionId = req.params.id || req.params.sessionId; // Support both :id and :sessionId
  
  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: 'Session ID is required',
    });
  }

  const session = await Session.findOne({
    _id: sessionId,
    doctorId: id,
  });

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found',
    });
  }

  if (session.status === SESSION_STATUS.LIVE || session.status === SESSION_STATUS.PAUSED) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete active or paused session',
    });
  }

  // Cancel all appointments in this session
  const cancelledAppointments = await Appointment.find({
    sessionId: session._id,
    status: { $in: ['scheduled', 'confirmed'] },
  }).populate('patientId', 'firstName lastName email').populate('doctorId', 'firstName lastName');

  await Appointment.updateMany(
    { sessionId: session._id, status: { $in: ['scheduled', 'confirmed'] } },
    { status: 'cancelled', cancelledAt: new Date() }
  );

  // Send notifications to all affected patients
  try {
    const { sendAppointmentCancellationEmail } = require('../../services/notificationService');
    const io = require('../../config/socket').getIO();

    for (const appointment of cancelledAppointments) {
      // Send email notification
      if (appointment.patientId && appointment.doctorId) {
        await sendAppointmentCancellationEmail({
          patient: appointment.patientId,
          doctor: appointment.doctorId,
          appointment,
          cancelledBy: 'doctor',
          reason: 'Session cancelled by doctor',
        }).catch((error) => console.error('Error sending cancellation email:', error));
      }

      // Emit real-time event
      io.to(`patient-${appointment.patientId._id}`).emit('appointment:cancelled', {
        appointmentId: appointment._id,
        reason: 'Session cancelled by doctor',
      });

      // Create in-app notification for patient
      try {
        const { createAppointmentNotification } = require('../../services/notificationService');
        await createAppointmentNotification({
          userId: appointment.patientId._id,
          userType: 'patient',
          appointment,
          eventType: 'cancelled',
          doctor: appointment.doctorId,
        }).catch((error) => console.error('Error creating cancellation notification:', error));
      } catch (error) {
        console.error('Error creating notifications:', error);
      }
    }
  } catch (error) {
    console.error('Error sending notifications:', error);
  }

  await Session.findByIdAndDelete(sessionId);

  return res.status(200).json({
    success: true,
    message: 'Session cancelled successfully. All appointments have been cancelled.',
    data: {
      cancelledAppointments: cancelledAppointments.length,
    },
  });
});

