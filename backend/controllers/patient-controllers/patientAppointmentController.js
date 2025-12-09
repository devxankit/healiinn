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
  createAppointmentNotification,
} = require('../../services/notificationService');
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

  // Auto-cancel pending appointments older than 30 minutes
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  await Appointment.updateMany(
    {
      patientId: id,
      paymentStatus: 'pending',
      status: { $in: ['scheduled', 'confirmed'] },
      createdAt: { $lt: thirtyMinutesAgo },
    },
    {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: 'Payment not completed within 30 minutes',
    }
  );

  const filter = { patientId: id };
  
  // For status filter, handle different cases
  if (status) {
    if (status === 'scheduled') {
      // Include both 'scheduled' and rescheduled appointments (they are scheduled for new date)
      filter.status = { $in: ['scheduled', 'confirmed'] };
      filter.rescheduledAt = { $exists: false }; // Don't show old rescheduled appointments
      filter.paymentStatus = { $ne: 'pending' }; // Exclude pending payment appointments
    } else if (status === 'rescheduled') {
      // Show only rescheduled appointments
      filter.rescheduledAt = { $exists: true };
      filter.status = { $in: ['scheduled', 'confirmed'] };
      filter.paymentStatus = { $ne: 'pending' }; // Exclude pending payment appointments
    } else if (status === 'cancelled') {
      // Show cancelled appointments (include both paid and pending payment cancelled appointments)
      filter.status = 'cancelled';
      // Don't filter by paymentStatus for cancelled - show all cancelled appointments
    } else {
      filter.status = status;
      // For other statuses, exclude pending payment appointments
      if (status !== 'cancelled') {
        filter.paymentStatus = { $ne: 'pending' };
      }
    }
  } else {
    // By default, include all appointments (including cancelled) but exclude pending payment appointments
    // Only exclude pending payment appointments that are not cancelled
    // This allows cancelled appointments to show even if payment was pending
    filter.$or = [
      { 
        paymentStatus: { $ne: 'pending' },
        status: { $ne: 'cancelled' } // Non-cancelled appointments must have paid status
      },
      { status: 'cancelled' } // Include cancelled appointments regardless of payment status
    ];
  }
  
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
      .populate('doctorId', 'firstName lastName specialization profileImage consultationFee clinicDetails')
      .populate('sessionId', 'date sessionStartTime sessionEndTime status') // Include session status to check if cancelled
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
    paymentStatus: { $ne: 'pending' }, // Exclude pending payment appointments
  })
    .populate('doctorId', 'firstName lastName specialization profileImage consultationFee clinicDetails')
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
  const { doctorId, appointmentDate, time, reason, appointmentType, consultationMode } = req.body;

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

  // Parse appointment date properly (YYYY-MM-DD format)
  let parsedAppointmentDate;
  if (typeof appointmentDate === 'string' && appointmentDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // YYYY-MM-DD format - parse as UTC then convert to local
    const [year, month, day] = appointmentDate.split('-').map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    // Convert to local timezone
    const localYear = utcDate.getFullYear();
    const localMonth = utcDate.getMonth();
    const localDay = utcDate.getDate();
    parsedAppointmentDate = new Date(localYear, localMonth, localDay, 0, 0, 0, 0);
  } else {
    parsedAppointmentDate = new Date(appointmentDate);
  }
  parsedAppointmentDate.setHours(0, 0, 0, 0);

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

  // Check if there's a cancelled session for this date before creating appointment
  const sessionDateStart = new Date(parsedAppointmentDate);
  sessionDateStart.setHours(0, 0, 0, 0);
  const sessionDateEnd = new Date(parsedAppointmentDate);
  sessionDateEnd.setHours(23, 59, 59, 999);
  
  const cancelledSession = await Session.findOne({
    doctorId,
    date: { $gte: sessionDateStart, $lt: sessionDateEnd },
    status: 'cancelled',
  });
  
  if (cancelledSession) {
    return res.status(400).json({
      success: false,
      message: 'Session was cancelled for this date. Please select a different date.',
      data: {
        cancelledSessionDate: cancelledSession.date.toISOString().split('T')[0],
        selectedDate: appointmentDate,
      },
    });
  }

  // Get or create session automatically based on doctor's availability
  let session;
  try {
    console.log(`📅 Attempting to get/create session for doctor ${doctorId} on date ${appointmentDate}`);
    session = await getOrCreateSession(doctorId, appointmentDate);
    console.log(`✅ Session retrieved/created:`, {
      sessionId: session?._id,
      doctorId: session?.doctorId,
      date: session?.date,
      sessionStartTime: session?.sessionStartTime,
      sessionEndTime: session?.sessionEndTime,
      maxTokens: session?.maxTokens,
      currentToken: session?.currentToken,
    });
  } catch (error) {
    console.error(`❌ Error getting/creating session:`, {
      error: error.message,
      stack: error.stack,
      doctorId,
      appointmentDate,
    });
    return res.status(400).json({
      success: false,
      message: error.message || 'Unable to create session for this date',
    });
  }

  // Check if session end time has passed - if yes, reject new bookings
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isSameDay = parsedAppointmentDate.getTime() === today.getTime();
  
  if (isSameDay) {
    const { timeToMinutes } = require('../../services/etaService');
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    const sessionEndMinutes = timeToMinutes(session.sessionEndTime);
    
    // If session end time has passed, reject new booking
    if (sessionEndMinutes !== null && currentTimeMinutes >= sessionEndMinutes) {
      return res.status(400).json({
        success: false,
        message: 'Session time has ended. No new appointments can be booked for this session. Existing appointments will continue.',
        data: {
          sessionEndTime: session.sessionEndTime,
          currentTime: `${currentHour}:${currentMinute.toString().padStart(2, '0')}`,
        },
      });
    }
  }

  // Calculate token number based on current time for same-day bookings
  let tokenNumber;
  
  if (isSameDay && slotCheck.pastSlotsCount > 0) {
    // For same-day bookings with past slots, calculate token from current time
    // We need to find the minimum token that is >= pastSlotsCount + 1
    // and also account for already booked tokens
    const minTokenFromCurrentTime = slotCheck.pastSlotsCount + 1;
    const nextAvailableToken = Math.max(minTokenFromCurrentTime, (session.currentToken || 0) + 1);
    tokenNumber = nextAvailableToken;
    
    console.log(`⏰ Same-day booking token calculation:`, {
      pastSlotsCount: slotCheck.pastSlotsCount,
      minTokenFromCurrentTime,
      currentToken: session.currentToken || 0,
      calculatedToken: tokenNumber,
      sessionMaxTokens: session.maxTokens,
    });
  } else {
    // For future bookings or same-day without past slots, use normal increment
    // Token should be next available token (currentToken + 1)
    // But ensure we don't skip tokens if there are existing appointments
    const existingAppointments = await Appointment.countDocuments({
      sessionId: session._id,
      status: { $in: ['scheduled', 'confirmed'] },
    });
    
    // Token number should be max of (currentToken + 1) or (existing appointments + 1)
    // This ensures tokens are sequential and don't skip numbers
    tokenNumber = Math.max((session.currentToken || 0) + 1, existingAppointments + 1);
    
    console.log(`📊 Token calculation for future booking:`, {
      currentToken: session.currentToken || 0,
      existingAppointments,
      calculatedToken: tokenNumber,
    });
  }

  // Double check slot availability after session creation
  // For same-day bookings, max token is still session.maxTokens (not reduced)
  if (tokenNumber > session.maxTokens) {
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
  // Always calculate appointment time based on token number for consistency
  // This ensures time is always calculated correctly regardless of booking type
  const { timeToMinutes } = require('../../services/etaService');
  const sessionStartMinutes = timeToMinutes(session.sessionStartTime);
  const avgConsultation = doctor.averageConsultationMinutes || 20;
  
  // Calculate time for this token (token - 1 because token 1 starts at session start)
  const tokenTimeMinutes = sessionStartMinutes + (tokenNumber - 1) * avgConsultation;
  const tokenHour = Math.floor(tokenTimeMinutes / 60);
  const tokenMin = tokenTimeMinutes % 60;
  
  // Convert to 12-hour format
  let displayHour = tokenHour;
  let period = 'AM';
  if (tokenHour >= 12) {
    period = 'PM';
    if (tokenHour > 12) {
      displayHour = tokenHour - 12;
    }
  } else if (tokenHour === 0) {
    displayHour = 12;
  }
  
  const appointmentTime = `${displayHour}:${tokenMin.toString().padStart(2, '0')} ${period}`;
  
  console.log(`⏰ Calculated appointment time for token ${tokenNumber}:`, {
    sessionStartTime: session.sessionStartTime,
    sessionStartMinutes,
    tokenNumber,
    avgConsultationMinutes: avgConsultation,
    tokenTimeMinutes,
    calculatedTime: appointmentTime,
  });

  const appointment = await Appointment.create({
    patientId: id,
    doctorId,
    sessionId: session._id,
    appointmentDate: parsedAppointmentDate,
    time: appointmentTime,
    reason: reason || 'Consultation',
    appointmentType: appointmentType || 'New',
    consultationMode: consultationMode || 'in_person',
    duration: doctor.averageConsultationMinutes || 30, // Use doctor's average consultation time instead of default 30
    tokenNumber,
    fee: doctor.consultationFee || 0,
    status: 'scheduled',
    queueStatus: 'waiting',
  });

  // Update session - ensure currentToken reflects the highest token number
  // This ensures consistency even if appointments were cancelled
  const maxTokenInSession = await Appointment.findOne({
    sessionId: session._id,
    status: { $in: ['scheduled', 'confirmed'] },
  }).sort({ tokenNumber: -1 }).select('tokenNumber');
  
  const highestToken = maxTokenInSession?.tokenNumber || tokenNumber;
  session.currentToken = Math.max(session.currentToken || 0, highestToken);
  session.appointments.push(appointment._id);
  await session.save();
  
  console.log(`✅ Session updated:`, {
    sessionId: session._id,
    newTokenNumber: tokenNumber,
    highestTokenInSession: highestToken,
    currentToken: session.currentToken,
    maxTokens: session.maxTokens,
  });

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

  // NOTE: Email and notification will be sent only after payment is verified
  // See verifyAppointmentPayment() function

  // Get appointment with ETA - only necessary fields
  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate('doctorId', 'firstName lastName specialization profileImage')
    .populate('sessionId', 'date sessionStartTime sessionEndTime status')
    .select('-__v'); // Exclude version key

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
  const appointmentId = req.params.id; // Route parameter is :id, not :appointmentId

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
  appointment.cancellationReason = req.body.reason || 'Cancelled by patient';
  await appointment.save();

  // Update session if exists
  if (appointment.sessionId) {
    const session = await Session.findById(appointment.sessionId);
    if (session) {
      // Remove appointment from session's appointments array
      session.appointments = session.appointments.filter(
        apptId => apptId.toString() !== appointment._id.toString()
      );
      
      // Recalculate currentToken based on actual booked appointments
      const actualBookedCount = await Appointment.countDocuments({
        sessionId: session._id,
        status: { $in: ['scheduled', 'confirmed', 'in_progress'] },
      });
      session.currentToken = Math.max(0, actualBookedCount);
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
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctorId', 'firstName lastName specialization profileImage');

    // Notify patient
    await createAppointmentNotification({
      userId: id,
      userType: 'patient',
      appointment: populatedAppointment,
      eventType: 'cancelled',
      doctor: populatedAppointment.doctorId,
    }).catch((error) => console.error('Error creating patient cancellation notification:', error));

    // Notify doctor
    await createAppointmentNotification({
      userId: appointment.doctorId,
      userType: 'doctor',
      appointment: populatedAppointment,
      eventType: 'cancelled',
      patient,
    }).catch((error) => console.error('Error creating doctor cancellation notification:', error));
  } catch (error) {
    console.error('Error creating notifications:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Appointment cancelled successfully',
  });
});

// PATCH /api/patients/appointments/:id/reschedule - Reschedule appointment
exports.rescheduleAppointment = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const appointmentId = req.params.id; // Fix: route parameter is :id, not :appointmentId
  const { appointmentDate, time } = req.body; // time is optional - will be calculated automatically

  if (!appointmentDate) {
    return res.status(400).json({
      success: false,
      message: 'Appointment date is required',
    });
  }

  const appointment = await Appointment.findOne({ _id: appointmentId, patientId: id });
  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  // Prevent rescheduling completed appointments
  if (appointment.status === 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Cannot reschedule a completed appointment',
    });
  }

  // Allow rescheduling cancelled appointments (patient can book new appointment after cancellation)
  // If appointment is cancelled, we'll update it to rescheduled status
  const isCancelled = appointment.status === 'cancelled';

  // If rescheduling a cancelled appointment, check if the new date is the same as the cancelled session date
  if (isCancelled && appointment.sessionId) {
    const Session = require('../../models/Session');
    const cancelledSession = await Session.findById(appointment.sessionId);
    
    if (cancelledSession && cancelledSession.status === 'cancelled') {
      // Get the cancelled session date
      const cancelledSessionDate = new Date(cancelledSession.date);
      cancelledSessionDate.setHours(0, 0, 0, 0);
      
      // Parse the new appointment date
      let parsedNewDate;
      if (typeof appointmentDate === 'string' && appointmentDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = appointmentDate.split('-').map(Number);
        parsedNewDate = new Date(year, month - 1, day, 0, 0, 0, 0);
      } else {
        parsedNewDate = new Date(appointmentDate);
      }
      parsedNewDate.setHours(0, 0, 0, 0);
      
      // Check if new date matches cancelled session date
      if (cancelledSessionDate.getTime() === parsedNewDate.getTime()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot reschedule to the same date when the session was cancelled. Please select a different date.',
          data: {
            cancelledSessionDate: cancelledSessionDate.toISOString().split('T')[0],
            selectedDate: appointmentDate,
          },
        });
      }
    }
  }

  // Check if new date has available slots (this also checks for cancelled sessions)
  const slotCheck = await checkSlotAvailability(appointment.doctorId, appointmentDate);
  if (!slotCheck.available) {
    return res.status(400).json({
      success: false,
      message: slotCheck.message || 'No available slots for the new date',
      data: {
        totalSlots: slotCheck.totalSlots || 0,
        bookedSlots: slotCheck.bookedSlots || 0,
        availableSlots: 0,
        isCancelled: slotCheck.isCancelled || false,
      },
    });
  }

  // Additional check: Ensure no cancelled session exists for the new date
  // (checkSlotAvailability already does this, but double-check for safety)
  let parsedNewDate;
  if (typeof appointmentDate === 'string' && appointmentDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = appointmentDate.split('-').map(Number);
    parsedNewDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  } else {
    parsedNewDate = new Date(appointmentDate);
  }
  parsedNewDate.setHours(0, 0, 0, 0);
  
  const sessionDateStart = new Date(parsedNewDate);
  sessionDateStart.setHours(0, 0, 0, 0);
  const sessionDateEnd = new Date(parsedNewDate);
  sessionDateEnd.setHours(23, 59, 59, 999);
  
  // Check if there's a cancelled session for the new date
  const cancelledSessionForNewDate = await Session.findOne({
    doctorId: appointment.doctorId,
    date: { $gte: sessionDateStart, $lt: sessionDateEnd },
    status: 'cancelled',
  });
  
  if (cancelledSessionForNewDate) {
    return res.status(400).json({
      success: false,
      message: 'Session was cancelled for this date. Please select a different date.',
      data: {
        cancelledSessionDate: cancelledSessionForNewDate.date.toISOString().split('T')[0],
        selectedDate: appointmentDate,
      },
    });
  }

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

  // Store old appointment data for cancellation
  const oldAppointmentDate = appointment.appointmentDate;
  const oldSessionId = appointment.sessionId;
  const oldTokenNumber = appointment.tokenNumber;
  
  // Update old session token count if it exists
  if (oldSessionId) {
    const oldSession = await Session.findById(oldSessionId);
    if (oldSession) {
      // Remove appointment from old session's appointments array
      oldSession.appointments = oldSession.appointments.filter(
        apptId => apptId.toString() !== appointment._id.toString()
      );
      
      // Recalculate currentToken based on actual booked appointments
      const Appointment = require('../../models/Appointment');
      const actualBookedCount = await Appointment.countDocuments({
        sessionId: oldSessionId,
        status: { $in: ['scheduled', 'confirmed', 'in_progress'] },
        _id: { $ne: appointment._id }, // Exclude the rescheduled appointment
      });
      
      oldSession.currentToken = Math.max(0, actualBookedCount);
      await oldSession.save();

      console.log(`🔄 Updated old session ${oldSession._id}:`, {
        oldSessionDate: oldSession.date,
        oldTokenNumber,
        newCurrentToken: oldSession.currentToken,
        actualBookedCount,
        appointmentsCount: oldSession.appointments.length,
      });

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

  // Get doctor to calculate time based on average consultation minutes
  const doctor = await Doctor.findById(appointment.doctorId);
  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found',
    });
  }

  // Calculate appointment time based on token number and session time (same logic as createAppointment)
  const { timeToMinutes } = require('../../services/etaService');
  const sessionStartMinutes = timeToMinutes(newSession.sessionStartTime);
  const avgConsultation = doctor.averageConsultationMinutes || 20;
  
  // Calculate time for this token (token - 1 because token 1 starts at session start)
  const tokenTimeMinutes = sessionStartMinutes + (newTokenNumber - 1) * avgConsultation;
  const tokenHour = Math.floor(tokenTimeMinutes / 60);
  const tokenMin = tokenTimeMinutes % 60;
  
  // Convert to 12-hour format
  let displayHour = tokenHour;
  let period = 'AM';
  if (tokenHour >= 12) {
    period = 'PM';
    if (tokenHour > 12) {
      displayHour = tokenHour - 12;
    }
  } else if (tokenHour === 0) {
    displayHour = 12;
  }
  
  const calculatedTime = `${displayHour}:${tokenMin.toString().padStart(2, '0')} ${period}`;

  // Update appointment with new date and session
  // Normalize appointment date to match session date format (start of day in local timezone)
  const oldDate = appointment.appointmentDate;
  let normalizedAppointmentDate;
  if (typeof appointmentDate === 'string' && appointmentDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // YYYY-MM-DD format - parse and normalize to start of day in local timezone
    const [year, month, day] = appointmentDate.split('-').map(Number);
    normalizedAppointmentDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  } else {
    normalizedAppointmentDate = new Date(appointmentDate);
    normalizedAppointmentDate.setHours(0, 0, 0, 0);
  }
  
  // Ensure appointment date matches session date exactly
  const sessionDateNormalized = new Date(newSession.date);
  sessionDateNormalized.setHours(0, 0, 0, 0);
  
  appointment.appointmentDate = normalizedAppointmentDate;
  appointment.time = calculatedTime; // Use calculated time based on token number, not user-provided time
  appointment.sessionId = newSession._id;
  appointment.tokenNumber = newTokenNumber;
  // If appointment was cancelled, reactivate it; otherwise keep as scheduled
  appointment.status = isCancelled ? 'scheduled' : 'scheduled';
  appointment.queueStatus = null;
  appointment.rescheduledAt = new Date();
  appointment.rescheduledBy = 'patient';
  appointment.rescheduleReason = isCancelled 
    ? `Appointment rebooked after cancellation. New date: ${normalizedAppointmentDate.toLocaleDateString('en-US')}`
    : `Rescheduled from ${oldDate.toLocaleDateString('en-US')} to ${normalizedAppointmentDate.toLocaleDateString('en-US')}`;
  // Clear cancellation fields if it was cancelled
  if (isCancelled) {
    appointment.cancelledAt = undefined;
    appointment.cancellationReason = undefined;
    appointment.cancelledBy = undefined;
  }
  // Keep existing payment - no new payment required for reschedule
  await appointment.save();
  
  console.log(`✅ Appointment rescheduled and saved:`, {
    appointmentId: appointment._id,
    oldDate: oldDate.toISOString().split('T')[0],
    newDate: appointmentDate,
    newAppointmentDate: appointment.appointmentDate.toISOString().split('T')[0],
    oldSessionId: oldSessionId?.toString(),
    newSessionId: newSession._id.toString(),
    newSessionDate: newSession.date.toISOString().split('T')[0],
    oldToken: oldTokenNumber,
    newToken: newTokenNumber,
    status: appointment.status,
  });
  
  // Verify appointment is properly linked to new session
  const verifyAppointment = await Appointment.findById(appointment._id)
    .populate('sessionId', 'date sessionStartTime sessionEndTime');
  console.log(`🔍 Verification - Appointment in new session:`, {
    appointmentId: verifyAppointment._id,
    appointmentDate: verifyAppointment.appointmentDate.toISOString().split('T')[0],
    sessionId: verifyAppointment.sessionId?._id?.toString(),
    sessionDate: verifyAppointment.sessionId?.date?.toISOString().split('T')[0],
    status: verifyAppointment.status,
    tokenNumber: verifyAppointment.tokenNumber,
    rescheduledAt: verifyAppointment.rescheduledAt,
    match: verifyAppointment.appointmentDate.toISOString().split('T')[0] === verifyAppointment.sessionId?.date?.toISOString().split('T')[0],
  });

  // Update new session
  newSession.currentToken = newTokenNumber;
  // Add appointment to new session's appointments array if not already present
  if (!newSession.appointments.includes(appointment._id)) {
    newSession.appointments.push(appointment._id);
  }
  await newSession.save();

  console.log(`✅ Rescheduled appointment ${appointment._id}:`, {
    oldSessionId: appointment.sessionId?.toString(),
    newSessionId: newSession._id.toString(),
    newDate: appointmentDate,
    newTime: time,
    newTokenNumber: newTokenNumber,
  });

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
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctorId', 'firstName lastName specialization profileImage')
      .populate('sessionId', 'date sessionStartTime sessionEndTime');
    const patient = await Patient.findById(id);
    const doctor = await Doctor.findById(appointment.doctorId);

    // Notify patient
    await createAppointmentNotification({
      userId: id,
      userType: 'patient',
      appointment: populatedAppointment,
      eventType: 'rescheduled',
      doctor,
    }).catch((error) => console.error('Error creating patient reschedule notification:', error));

    // Notify doctor
    await createAppointmentNotification({
      userId: appointment.doctorId,
      userType: 'doctor',
      appointment: populatedAppointment,
      eventType: 'rescheduled',
      patient,
    }).catch((error) => console.error('Error creating doctor reschedule notification:', error));
  } catch (error) {
    console.error('Error creating notifications:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Appointment rescheduled successfully',
    data: await Appointment.findById(appointment._id)
      .populate('doctorId', 'firstName lastName specialization profileImage consultationFee clinicDetails')
      .populate('sessionId', 'date sessionStartTime sessionEndTime'),
  });
});

// GET /api/patients/appointments/:id/eta - Get ETA for appointment
exports.getAppointmentETA = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const appointmentId = req.params.id; // Route uses :id

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
  const appointmentId = req.params.id; // Route uses :id, not :appointmentId

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
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || '', // Return Razorpay key ID for frontend
    },
  });
});

// POST /api/patients/appointments/:id/payment/verify - Verify and confirm appointment payment
exports.verifyAppointmentPayment = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const appointmentId = req.params.id; // Route uses :id, not :appointmentId
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
    description: `Appointment payment for appointment ${appointment._id}`,
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
  // Get first admin user for admin transactions
  const Admin = require('../../models/Admin');
  const mongoose = require('mongoose');
  const adminUser = await Admin.findOne({ isActive: true }).sort({ createdAt: 1 });
  const adminUserId = adminUser?._id || new mongoose.Types.ObjectId('000000000000000000000000'); // Fallback to a system admin ID
  
  await Transaction.create({
    userId: adminUserId,
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

  // Get IO instance for real-time events (must be before wallet credit)
  const io = getIO();

  // Credit doctor wallet (doctor earns from appointment)
  const WalletTransaction = require('../../models/WalletTransaction');
  const Doctor = require('../../models/Doctor');
  
  console.log(`💳 Processing wallet credit for appointment: ${appointment._id}, doctorId: ${appointment.doctorId}`);
  
  // Get doctor's current wallet balance
  const doctor = await Doctor.findById(appointment.doctorId);
  if (!doctor) {
    console.error(`❌ Doctor not found for appointment: ${appointment._id}, doctorId: ${appointment.doctorId}`);
  } else {
    console.log(`✅ Doctor found: ${doctor.firstName} ${doctor.lastName}, ID: ${doctor._id.toString()}`);
    console.log(`✅ Doctor found: ${doctor.firstName} ${doctor.lastName}, ID: ${doctor._id}`);
    // Calculate doctor's earning using commission config from .env
    const { calculateProviderEarning } = require('../../utils/commissionConfig');
    const { earning: doctorEarning, commission, commissionRate } = calculateProviderEarning(
      appointment.fee,
      'doctor'
    );
    
    console.log(`💰 Calculating earnings:`, {
      appointmentFee: appointment.fee,
      doctorEarning,
      commission,
      commissionRate,
    });
    
    // Get current wallet balance - get the latest earning transaction balance
    // or calculate from all earning transactions minus withdrawals
    const lastEarningTransaction = await WalletTransaction.findOne({
      userId: appointment.doctorId,
      userType: 'doctor',
      type: 'earning',
      status: 'completed',
    }).sort({ createdAt: -1 });
    
    // Calculate current balance from all transactions
    const allEarnings = await WalletTransaction.aggregate([
      {
        $match: {
          userId: appointment.doctorId,
          userType: 'doctor',
          type: 'earning',
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);
    
    const allWithdrawals = await WalletTransaction.aggregate([
      {
        $match: {
          userId: appointment.doctorId,
          userType: 'doctor',
          type: 'withdrawal',
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);
    
    const currentBalance = (allEarnings[0]?.total || 0) - (allWithdrawals[0]?.total || 0);
    const newBalance = currentBalance + doctorEarning;
    
    // Also update the last transaction balance reference for consistency
    const lastTransactionBalance = lastEarningTransaction?.balance || currentBalance;
    
    // Create wallet transaction for doctor earning
    try {
      const walletTransaction = await WalletTransaction.create({
      userId: appointment.doctorId,
      userType: 'doctor',
      type: 'earning',
      amount: doctorEarning,
      balance: newBalance,
      status: 'completed',
      description: `Earning from appointment ${appointment._id} (Commission: ${(commissionRate * 100).toFixed(1)}%)`,
      referenceId: appointment._id.toString(),
      appointmentId: appointment._id,
      metadata: {
        totalAmount: appointment.fee,
        commission,
        commissionRate,
        earning: doctorEarning,
      },
    });
      
      console.log(`✅ Doctor wallet transaction created successfully:`, {
        doctorId: appointment.doctorId.toString(),
        amount: doctorEarning,
        balance: newBalance,
        transactionId: walletTransaction._id,
        appointmentId: appointment._id.toString(),
      });
    } catch (walletError) {
      console.error(`❌ Error creating doctor wallet transaction:`, {
        error: walletError.message,
        stack: walletError.stack,
        doctorId: appointment.doctorId.toString(),
        appointmentId: appointment._id.toString(),
        amount: doctorEarning,
      });
      // Don't throw - payment is already successful, just log the error
    }
    
    // Note: Commission deduction transaction is NOT created in doctor's wallet
    // because doctor already receives commission-deducted amount (earning)
    // Admin commission is tracked separately through appointment/order records
    // No need to create a deduction transaction that would incorrectly reduce doctor's balance
    
    // Emit real-time event to doctor
    try {
      io.to(`doctor-${appointment.doctorId}`).emit('wallet:credited', {
        amount: doctorEarning,
        balance: newBalance,
        appointmentId: appointment._id,
        commission,
        commissionRate,
      });
    } catch (error) {
      console.error('Socket.IO error for wallet credit:', error);
    }
  }

  // Get patient data for notifications and emails
  const patient = await Patient.findById(id);

  // Doctor is already fetched above (line 975), reuse it
  // Get populated appointment for notifications and emails
  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate('doctorId', 'firstName lastName specialization profileImage')
    .populate('sessionId', 'date sessionStartTime sessionEndTime');

  // Send email notifications (only after payment is verified)
  try {
    // Send appointment confirmation email to patient
    if (patient) {
      await sendAppointmentConfirmationEmail({
        patient,
        doctor,
        appointment: populatedAppointment,
      }).catch((error) => console.error('Error sending appointment confirmation email:', error));
    }

    // Send notification email to doctor (only if doctor exists)
    // DISABLED: Doctor appointment booking notification email removed as per requirements
    // if (doctor) {
    //   await sendDoctorAppointmentNotification({
    //     doctor,
    //     patient,
    //     appointment: populatedAppointment,
    //   }).catch((error) => console.error('Error sending doctor appointment notification:', error));
    // }

    // Send payment confirmation email to patient
    if (patient) {
    const { sendPaymentConfirmationEmail } = require('../../services/notificationService');
    await sendPaymentConfirmationEmail({
      patient,
        amount: appointment.fee,
        appointmentId: appointment._id,
        transaction,
      order: null,
    }).catch((error) => console.error('Error sending payment confirmation email:', error));
    }
  } catch (error) {
    console.error('Error sending email notifications:', error);
  }

  // Create in-app notifications (only after payment is verified)
  try {
    // Notify patient about appointment creation
    if (patient) {
      await createAppointmentNotification({
        userId: id,
        userType: 'patient',
        appointment: populatedAppointment,
        eventType: 'created',
        doctor,
      }).catch((error) => console.error('Error creating patient notification:', error));
    }

    // Notify doctor about new appointment (only if doctor exists)
    if (doctor) {
      await createAppointmentNotification({
        userId: appointment.doctorId,
        userType: 'doctor',
        appointment: populatedAppointment,
        eventType: 'created',
        patient,
      }).catch((error) => console.error('Error creating doctor notification:', error));
    }

    // Notify patient about payment confirmation
    if (patient) {
      await createAppointmentNotification({
        userId: id,
        userType: 'patient',
        appointment: populatedAppointment,
        eventType: 'payment_confirmed',
        doctor,
      }).catch((error) => console.error('Error creating payment confirmation notification:', error));
    }
  } catch (error) {
    console.error('Error creating notifications:', error);
  }

  // Emit real-time event
  try {
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
  
  console.log(`✅ Payment verification completed for appointment: ${appointment._id}`);

  return res.status(200).json({
    success: true,
    message: 'Payment verified and confirmed successfully',
    data: {
      appointment: populatedAppointment.toObject(),
      transaction: transaction.toObject(),
    },
  });
});

