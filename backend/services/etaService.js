const Appointment = require('../models/Appointment');
const Session = require('../models/Session');
const Doctor = require('../models/Doctor');

/**
 * Convert 12-hour format to 24-hour format for calculation
 */
const convert12HourTo24Hour = (time12) => {
  if (!time12) return '';
  
  // If already in 24-hour format (no AM/PM), return as is
  if (!time12.toString().includes('AM') && !time12.toString().includes('PM')) {
    return time12;
  }
  
  const timeStr = time12.toString().trim();
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  
  if (!match) return time12;
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

/**
 * Calculate time difference in minutes between two time strings
 * Handles both 12-hour (HH:MM AM/PM) and 24-hour (HH:MM) formats
 */
const timeToMinutes = (timeString) => {
  if (!timeString) return 0;
  
  // Convert to 24-hour format if needed
  const time24 = convert12HourTo24Hour(timeString);
  
  // Extract hours and minutes
  const [hours, minutes] = time24.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) {
    console.error(`❌ Invalid time format: ${timeString}`);
    return 0;
  }
  
  return hours * 60 + (minutes || 0);
};

/**
 * Calculate minutes between two time strings
 */
const getTimeDifference = (startTime, endTime) => {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
};

/**
 * Calculate ETA for appointment based on queue position and session status
 * @param {String} appointmentId - Appointment ID
 * @returns {Object} ETA information
 */
const calculateAppointmentETA = async (appointmentId) => {
  const appointment = await Appointment.findById(appointmentId)
    .populate('sessionId')
    .populate('doctorId', 'averageConsultationMinutes');

  if (!appointment || !appointment.sessionId) {
    return null;
  }

  const session = appointment.sessionId;
  const doctor = appointment.doctorId;
  const avgConsultation = doctor.averageConsultationMinutes || 20;

  // If session is paused, add paused duration to calculation
  let pausedAdjustment = 0;
  if (session.isPaused && session.pausedAt) {
    const pausedMinutes = Math.floor((new Date() - new Date(session.pausedAt)) / (1000 * 60));
    pausedAdjustment = pausedMinutes;
  }
  // Add total paused duration from history
  if (session.pausedDuration) {
    pausedAdjustment += session.pausedDuration;
  }

  // Calculate patients ahead in queue
  const patientsAhead = Math.max(0, appointment.tokenNumber - session.currentToken - 1);

  // Calculate estimated wait time in minutes
  // Base time: patients ahead × average consultation time
  // Plus: paused time adjustment
  const estimatedWaitMinutes = patientsAhead * avgConsultation + pausedAdjustment;

  // Calculate estimated call time
  const estimatedCallTime = new Date();
  estimatedCallTime.setMinutes(estimatedCallTime.getMinutes() + estimatedWaitMinutes);

  return {
    estimatedWaitMinutes,
    estimatedCallTime,
    patientsAhead,
    currentToken: session.currentToken,
    tokenNumber: appointment.tokenNumber,
    isPaused: session.isPaused || false,
    pausedAdjustment,
  };
};

/**
 * Calculate ETA for all appointments in queue
 * @param {String} sessionId - Session ID
 * @returns {Array} Array of ETA objects for each appointment
 */
const calculateQueueETAs = async (sessionId) => {
  const session = await Session.findById(sessionId)
    .populate('doctorId', 'averageConsultationMinutes');

  if (!session) return [];

  const appointments = await Appointment.find({
    sessionId,
    status: { $in: ['scheduled', 'confirmed'] },
    queueStatus: { $in: ['waiting', null] },
  })
    .populate('patientId', 'firstName lastName')
    .sort({ tokenNumber: 1 });

  const doctor = session.doctorId;
  const avgConsultation = doctor.averageConsultationMinutes || 20;

  // Calculate paused adjustment
  let pausedAdjustment = 0;
  if (session.isPaused && session.pausedAt) {
    const pausedMinutes = Math.floor((new Date() - new Date(session.pausedAt)) / (1000 * 60));
    pausedAdjustment = pausedMinutes;
  }
  if (session.pausedDuration) {
    pausedAdjustment += session.pausedDuration;
  }

  return appointments.map(appointment => {
    const patientsAhead = Math.max(0, appointment.tokenNumber - session.currentToken - 1);
    const estimatedWaitMinutes = patientsAhead * avgConsultation + pausedAdjustment;
    const estimatedCallTime = new Date();
    estimatedCallTime.setMinutes(estimatedCallTime.getMinutes() + estimatedWaitMinutes);

    return {
      appointmentId: appointment._id,
      patientId: appointment.patientId?._id,
      tokenNumber: appointment.tokenNumber,
      estimatedWaitMinutes,
      estimatedCallTime,
      patientsAhead,
      isPaused: session.isPaused || false,
    };
  });
};

/**
 * Recalculate and update ETAs for all waiting appointments in a session
 * @param {String} sessionId - Session ID
 */
const recalculateSessionETAs = async (sessionId) => {
  const etas = await calculateQueueETAs(sessionId);
  return etas;
};

/**
 * Get available slots for a doctor on a specific date
 * @param {String} doctorId - Doctor ID
 * @param {Date} date - Date to check
 * @returns {Object} Available slots information
 */
const getAvailableSlots = async (doctorId, date) => {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return { available: false, message: 'Doctor not found' };
  }

  // Get or create session for the date
  const sessionDate = new Date(date);
  sessionDate.setHours(0, 0, 0, 0);
  const sessionEndDate = new Date(sessionDate);
  sessionEndDate.setHours(23, 59, 59, 999);

  const Session = require('../models/Session');
  let session = await Session.findOne({
    doctorId,
    date: { $gte: sessionDate, $lt: sessionEndDate },
  });

  // If session doesn't exist, check if we can create one based on availability
  if (!session) {
    // Get day name (Monday, Tuesday, etc.)
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];

    // Check doctor's availability for this day
    const dayAvailability = doctor.availability?.find(avail => avail.day === dayName);
    if (!dayAvailability) {
      return { available: false, message: 'Doctor not available on this day' };
    }

    // Check if date is blocked
    const isBlocked = doctor.blockedDates?.some(blocked => {
      const blockedDate = new Date(blocked.date);
      blockedDate.setHours(0, 0, 0, 0);
      return blockedDate.getTime() === sessionDate.getTime();
    });

    if (isBlocked) {
      return { available: false, message: 'Doctor has blocked this date' };
    }

    // Calculate max tokens based on availability
    const avgConsultation = doctor.averageConsultationMinutes || 20;
    const duration = getTimeDifference(dayAvailability.startTime, dayAvailability.endTime);
    const maxTokens = Math.floor(duration / avgConsultation);

    return {
      available: true,
      maxTokens,
      availableSlots: maxTokens,
      sessionStartTime: dayAvailability.startTime,
      sessionEndTime: dayAvailability.endTime,
    };
  }

  // Session exists, calculate available slots
  const bookedSlots = session.currentToken || 0;
  const availableSlots = Math.max(0, session.maxTokens - bookedSlots);

  return {
    available: availableSlots > 0,
    maxTokens: session.maxTokens,
    bookedSlots,
    availableSlots,
    sessionStartTime: session.sessionStartTime,
    sessionEndTime: session.sessionEndTime,
    currentToken: session.currentToken,
  };
};

module.exports = {
  calculateAppointmentETA,
  calculateQueueETAs,
  recalculateSessionETAs,
  getAvailableSlots,
  timeToMinutes,
  getTimeDifference,
};

