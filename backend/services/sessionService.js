const Session = require('../models/Session');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { SESSION_STATUS } = require('../utils/constants');
const { timeToMinutes, getTimeDifference } = require('./etaService');

/**
 * Get day name from date
 */
const getDayName = (date) => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayNames[date.getDay()];
};

/**
 * Check if date is blocked
 */
const isDateBlocked = (doctor, date) => {
  if (!doctor.blockedDates || doctor.blockedDates.length === 0) {
    return false;
  }

  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  return doctor.blockedDates.some(blocked => {
    const blockedDate = new Date(blocked.date);
    blockedDate.setHours(0, 0, 0, 0);
    return blockedDate.getTime() === checkDate.getTime();
  });
};

/**
 * Get availability for a specific date
 */
const getAvailabilityForDate = (doctor, date) => {
  const dayName = getDayName(date);

  // Check temporary availability first
  if (doctor.temporaryAvailability && doctor.temporaryAvailability.length > 0) {
    const tempAvail = doctor.temporaryAvailability.find(avail => {
      const availDate = new Date(avail.date);
      availDate.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      return availDate.getTime() === checkDate.getTime();
    });

    if (tempAvail && tempAvail.slots && tempAvail.slots.length > 0) {
      // Use first slot for now (can be extended to handle multiple slots)
      return {
        startTime: tempAvail.slots[0].startTime,
        endTime: tempAvail.slots[0].endTime,
      };
    }
  }

  // Check regular availability
  const dayAvailability = doctor.availability?.find(avail => avail.day === dayName);
  if (dayAvailability) {
    return {
      startTime: dayAvailability.startTime,
      endTime: dayAvailability.endTime,
    };
  }

  return null;
};

/**
 * Create or get session for a doctor on a specific date
 * Automatically creates session based on doctor's availability
 */
const getOrCreateSession = async (doctorId, date) => {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new Error('Doctor not found');
  }

  const sessionDate = new Date(date);
  sessionDate.setHours(0, 0, 0, 0);
  const sessionEndDate = new Date(sessionDate);
  sessionEndDate.setHours(23, 59, 59, 999);

  // Check if session already exists
  let session = await Session.findOne({
    doctorId,
    date: { $gte: sessionDate, $lt: sessionEndDate },
  });

  if (session) {
    return session;
  }

  // Check if date is blocked
  if (isDateBlocked(doctor, date)) {
    throw new Error('Doctor has blocked this date');
  }

  // Get availability for this date
  const availability = getAvailabilityForDate(doctor, date);
  if (!availability) {
    throw new Error('Doctor not available on this day');
  }

  // Calculate max tokens based on availability and average consultation time
  const avgConsultation = doctor.averageConsultationMinutes || 20;
  const duration = getTimeDifference(availability.startTime, availability.endTime);
  const maxTokens = Math.max(1, Math.floor(duration / avgConsultation));

  // Create new session
  session = await Session.create({
    doctorId,
    date: sessionDate,
    sessionStartTime: availability.startTime,
    sessionEndTime: availability.endTime,
    maxTokens,
    status: SESSION_STATUS.SCHEDULED,
    currentToken: 0,
  });

  return session;
};

/**
 * Check if slots are available for booking
 */
const checkSlotAvailability = async (doctorId, date) => {
  try {
    const session = await getOrCreateSession(doctorId, date);
    const bookedSlots = session.currentToken || 0;
    const availableSlots = Math.max(0, session.maxTokens - bookedSlots);

    return {
      available: availableSlots > 0,
      totalSlots: session.maxTokens,
      bookedSlots,
      availableSlots,
      sessionId: session._id,
    };
  } catch (error) {
    return {
      available: false,
      message: error.message,
    };
  }
};

/**
 * Pause session
 */
const pauseSession = async (sessionId) => {
  const session = await Session.findById(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  if (session.isPaused) {
    throw new Error('Session is already paused');
  }

  if (session.status !== SESSION_STATUS.LIVE) {
    throw new Error('Can only pause live sessions');
  }

  session.isPaused = true;
  session.pausedAt = new Date();
  session.status = SESSION_STATUS.PAUSED;
  await session.save();

  return session;
};

/**
 * Resume session
 */
const resumeSession = async (sessionId) => {
  const session = await Session.findById(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  if (!session.isPaused) {
    throw new Error('Session is not paused');
  }

  if (!session.pausedAt) {
    throw new Error('Invalid pause state');
  }

  // Calculate pause duration
  const pauseEndTime = new Date();
  const pauseDuration = Math.floor((pauseEndTime - new Date(session.pausedAt)) / (1000 * 60));

  // Add to pause history
  if (!session.pauseHistory) {
    session.pauseHistory = [];
  }
  session.pauseHistory.push({
    pausedAt: session.pausedAt,
    resumedAt: pauseEndTime,
    duration: pauseDuration,
  });

  // Update total paused duration
  session.pausedDuration = (session.pausedDuration || 0) + pauseDuration;

  // Resume session
  session.isPaused = false;
  session.pausedAt = null;
  session.status = SESSION_STATUS.LIVE;
  await session.save();

  return session;
};

/**
 * Call next patient (increment current token)
 */
const callNextPatient = async (sessionId) => {
  const session = await Session.findById(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  if (session.isPaused) {
    throw new Error('Cannot call next patient while session is paused');
  }

  // Get next appointment
  const nextAppointment = await Appointment.findOne({
    sessionId,
    tokenNumber: session.currentToken + 1,
    status: { $in: ['scheduled', 'confirmed'] },
  }).sort({ tokenNumber: 1 });

  if (!nextAppointment) {
    throw new Error('No more patients in queue');
  }

  // Update session current token
  session.currentToken = nextAppointment.tokenNumber;
  
  // If session is scheduled, make it live
  if (session.status === SESSION_STATUS.SCHEDULED) {
    session.status = SESSION_STATUS.LIVE;
    if (!session.startedAt) {
      session.startedAt = new Date();
    }
  }

  await session.save();

  return {
    session,
    appointment: nextAppointment,
  };
};

module.exports = {
  getOrCreateSession,
  checkSlotAvailability,
  pauseSession,
  resumeSession,
  callNextPatient,
  getAvailabilityForDate,
  isDateBlocked,
};

