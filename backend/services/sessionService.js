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
  const dayIndex = date.getDay();
  return dayNames[dayIndex];
};

/**
 * Normalize day name for matching (handles different formats)
 */
const normalizeDayName = (dayName) => {
  if (!dayName) return null;
  const day = dayName.trim();
  const dayMap = {
    'sun': 'Sunday',
    'mon': 'Monday',
    'tue': 'Tuesday',
    'wed': 'Wednesday',
    'thu': 'Thursday',
    'fri': 'Friday',
    'sat': 'Saturday',
    'sunday': 'Sunday',
    'monday': 'Monday',
    'tuesday': 'Tuesday',
    'wednesday': 'Wednesday',
    'thursday': 'Thursday',
    'friday': 'Friday',
    'saturday': 'Saturday',
  };
  return dayMap[day.toLowerCase()] || day;
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
  // Ensure date is a Date object
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) {
    console.error('❌ Invalid date provided to getAvailabilityForDate:', date);
    return null;
  }
  
  const dayName = getDayName(dateObj);
  console.log(`🔍 Checking availability for day: ${dayName} (date: ${dateObj.toISOString().split('T')[0]})`);

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
  // Normalize day names for matching (handle different formats)
  const normalizedDayName = normalizeDayName(dayName);
  const dayAvailability = doctor.availability?.find(avail => {
    const availDay = normalizeDayName(avail.day);
    return availDay === normalizedDayName;
  });
  
  if (dayAvailability) {
    console.log(`✅ Found availability for ${dayName}:`, {
      day: dayAvailability.day,
      startTime: dayAvailability.startTime,
      endTime: dayAvailability.endTime,
    });
    return {
      startTime: dayAvailability.startTime,
      endTime: dayAvailability.endTime,
    };
  }

  console.log(`⚠️ No availability found for ${dayName}. Doctor availability:`, 
    doctor.availability?.map(a => ({ day: a.day, startTime: a.startTime, endTime: a.endTime })) || []
  );
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

  // Handle date - can be Date object or string
  let sessionDate;
  if (date instanceof Date) {
    sessionDate = new Date(date);
  } else if (typeof date === 'string') {
    // If string, parse it (handle both ISO and YYYY-MM-DD formats)
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // YYYY-MM-DD format - parse as UTC then convert to local
      const [year, month, day] = date.split('-').map(Number);
      // Create date in UTC, then convert to local timezone
      sessionDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      // Convert to local timezone for query
      const localYear = sessionDate.getFullYear();
      const localMonth = sessionDate.getMonth();
      const localDay = sessionDate.getDate();
      sessionDate = new Date(localYear, localMonth, localDay, 0, 0, 0, 0);
    } else {
      sessionDate = new Date(date);
    }
  } else {
    sessionDate = new Date();
  }
  
  if (isNaN(sessionDate.getTime())) {
    throw new Error(`Invalid date format: ${date}`);
  }
  
  sessionDate.setHours(0, 0, 0, 0);
  const sessionEndDate = new Date(sessionDate);
  sessionEndDate.setHours(23, 59, 59, 999);
  
  const dayName = getDayName(sessionDate);
  console.log(`🔍 Getting/Creating session for doctor ${doctorId} on date:`, {
    inputDate: date,
    parsedDate: sessionDate.toISOString(),
    dayName: dayName,
    doctorAvailability: doctor.availability?.map(a => ({ day: a.day, startTime: a.startTime, endTime: a.endTime })) || [],
  });

  // Check if session already exists
  let session = await Session.findOne({
    doctorId,
    date: { $gte: sessionDate, $lt: sessionEndDate },
  });

  if (session) {
    // If session exists, verify it matches current doctor availability
    // If doctor's availability or consultation time changed, update the session
    const availability = getAvailabilityForDate(doctor, sessionDate);
    if (availability) {
      // Get fresh doctor data to ensure we have latest averageConsultationMinutes
      const freshDoctor = await Doctor.findById(doctorId).select('averageConsultationMinutes');
      const avgConsultation = freshDoctor?.averageConsultationMinutes || doctor.averageConsultationMinutes || 20;
      
      const duration = getTimeDifference(availability.startTime, availability.endTime);
      if (duration <= 0) {
        throw new Error(`Invalid session duration: ${availability.startTime} to ${availability.endTime}`);
      }
      
      const calculatedMaxTokens = Math.max(1, Math.floor(duration / avgConsultation));
      
      console.log(`🔍 Checking session sync for ${sessionDate.toISOString().split('T')[0]}:`, {
        currentStartTime: session.sessionStartTime,
        newStartTime: availability.startTime,
        currentEndTime: session.sessionEndTime,
        newEndTime: availability.endTime,
        currentMaxTokens: session.maxTokens,
        calculatedMaxTokens,
        avgConsultationMinutes: avgConsultation,
        durationMinutes: duration,
        calculation: `${duration} minutes / ${avgConsultation} minutes = ${calculatedMaxTokens} tokens`,
      });
      
      // Always update session to match current doctor availability (force sync)
      if (session.sessionStartTime !== availability.startTime || 
          session.sessionEndTime !== availability.endTime ||
          session.maxTokens !== calculatedMaxTokens) {
        console.log(`🔄 Updating existing session for ${sessionDate.toISOString().split('T')[0]} (${dayName}):`, {
          oldStartTime: session.sessionStartTime,
          newStartTime: availability.startTime,
          oldEndTime: session.sessionEndTime,
          newEndTime: availability.endTime,
          oldMaxTokens: session.maxTokens,
          newMaxTokens: calculatedMaxTokens,
          avgConsultationMinutes: avgConsultation,
          durationMinutes: duration,
          reason: 'Doctor profile availability or consultation time changed',
        });
        
        session.sessionStartTime = availability.startTime;
        session.sessionEndTime = availability.endTime;
        session.maxTokens = calculatedMaxTokens;
        // Don't reset currentToken if there are already bookings
        await session.save();
      } else {
        console.log(`✅ Existing session matches doctor availability:`, {
          date: sessionDate.toISOString().split('T')[0],
          startTime: session.sessionStartTime,
          endTime: session.sessionEndTime,
          maxTokens: session.maxTokens,
          avgConsultationMinutes: avgConsultation,
        });
      }
    } else {
      console.log(`⚠️ Session exists but no availability found for ${dayName}`);
    }
    return session;
  }

  // Check if date is blocked
  if (isDateBlocked(doctor, sessionDate)) {
    throw new Error('Doctor has blocked this date');
  }

  // Get availability for this date
  const availability = getAvailabilityForDate(doctor, sessionDate);
  if (!availability) {
    console.error(`❌ No availability found for doctor ${doctorId} on ${dayName} (${sessionDate.toISOString().split('T')[0]})`);
    console.error(`Doctor availability:`, doctor.availability?.map(a => ({ day: a.day, startTime: a.startTime, endTime: a.endTime })) || 'No availability set');
    throw new Error(`Doctor not available on ${dayName}. Please check doctor's availability settings.`);
  }

  // Validate availability times
  if (!availability.startTime || !availability.endTime) {
    console.error(`❌ Invalid availability times for doctor ${doctorId}:`, {
      startTime: availability.startTime,
      endTime: availability.endTime,
    });
    throw new Error('Doctor availability times are not properly configured');
  }
  
  console.log(`✅ Availability found for ${dayName}:`, {
    startTime: availability.startTime,
    endTime: availability.endTime,
  });

  // Calculate max tokens based on availability and average consultation time
  // Get fresh doctor data to ensure we have latest averageConsultationMinutes
  const freshDoctor = await Doctor.findById(doctorId).select('averageConsultationMinutes');
  const avgConsultation = freshDoctor?.averageConsultationMinutes || doctor.averageConsultationMinutes || 20;
  
  if (avgConsultation <= 0) {
    throw new Error('Doctor average consultation time must be greater than 0');
  }

  const duration = getTimeDifference(availability.startTime, availability.endTime);
  if (duration <= 0) {
    throw new Error(`Invalid session duration: ${availability.startTime} to ${availability.endTime}`);
  }

  const maxTokens = Math.max(1, Math.floor(duration / avgConsultation));

  // Debug log for session creation with detailed calculation
  console.log(`🆕 Creating new session for ${sessionDate.toISOString().split('T')[0]} (${dayName}):`, {
    doctorId,
    doctorName: `${doctor.firstName} ${doctor.lastName}`,
    dayName: dayName,
    startTime: availability.startTime,
    endTime: availability.endTime,
    startTimeMinutes: timeToMinutes(availability.startTime),
    endTimeMinutes: timeToMinutes(availability.endTime),
    durationMinutes: duration,
    durationHours: (duration / 60).toFixed(2),
    avgConsultationMinutes: avgConsultation,
    calculatedMaxTokens: maxTokens,
    calculation: `${duration} minutes / ${avgConsultation} minutes = ${maxTokens} tokens`,
    verification: `Session: ${availability.startTime} to ${availability.endTime} = ${duration} min, ${maxTokens} slots available`,
  });

  // Create new session with error handling
  try {
    session = await Session.create({
      doctorId,
      date: sessionDate,
      sessionStartTime: availability.startTime,
      sessionEndTime: availability.endTime,
      maxTokens,
      status: SESSION_STATUS.SCHEDULED,
      currentToken: 0,
    });
    
    console.log(`✅ Session created successfully:`, {
      sessionId: session._id,
      doctorId: session.doctorId,
      date: session.date,
      sessionStartTime: session.sessionStartTime,
      sessionEndTime: session.sessionEndTime,
      maxTokens: session.maxTokens,
      status: session.status,
    });
    
    return session;
  } catch (error) {
    console.error(`❌ Error creating session:`, {
      error: error.message,
      stack: error.stack,
      doctorId,
      date: sessionDate,
      sessionStartTime: availability.startTime,
      sessionEndTime: availability.endTime,
      maxTokens,
    });
    throw new Error(`Failed to create session: ${error.message}`);
  }
};

/**
 * Check if slots are available for booking
 * For same-day bookings, excludes past time slots based on current time
 */
const checkSlotAvailability = async (doctorId, date) => {
  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return {
        available: false,
        message: 'Doctor not found',
      };
    }

    const session = await getOrCreateSession(doctorId, date);
    const avgConsultation = doctor.averageConsultationMinutes || 20;
    
    // Check if booking is for today (same day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let parsedDate;
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split('-').map(Number);
      const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      const localYear = utcDate.getFullYear();
      const localMonth = utcDate.getMonth();
      const localDay = utcDate.getDate();
      parsedDate = new Date(localYear, localMonth, localDay, 0, 0, 0, 0);
    } else {
      parsedDate = new Date(date);
      parsedDate.setHours(0, 0, 0, 0);
    }
    
    const isSameDay = parsedDate.getTime() === today.getTime();
    
    let effectiveMaxTokens = session.maxTokens;
    let pastSlotsCount = 0;
    let effectiveStartTime = session.sessionStartTime;
    
    // If same day booking, calculate available slots from current time
    if (isSameDay) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      
      // Convert session start time to minutes
      const sessionStartMinutes = timeToMinutes(session.sessionStartTime);
      const sessionEndMinutes = timeToMinutes(session.sessionEndTime);
      
      // If current time is past session start time, exclude past slots
      if (currentTimeMinutes > sessionStartMinutes && currentTimeMinutes < sessionEndMinutes) {
        // Calculate how many slots have passed
        const elapsedMinutes = currentTimeMinutes - sessionStartMinutes;
        pastSlotsCount = Math.floor(elapsedMinutes / avgConsultation);
        
        // Calculate effective max tokens from current time to end time
        const remainingMinutes = sessionEndMinutes - currentTimeMinutes;
        effectiveMaxTokens = Math.max(1, Math.floor(remainingMinutes / avgConsultation));
        
        // Calculate effective start time (next available slot time)
        // Next slot starts at: sessionStart + (pastSlotsCount + 1) * avgConsultation
        const nextSlotMinutes = sessionStartMinutes + (pastSlotsCount + 1) * avgConsultation;
        const nextSlotHour = Math.floor(nextSlotMinutes / 60);
        const nextSlotMin = nextSlotMinutes % 60;
        
        // Convert to 12-hour format for display
        let displayHour = nextSlotHour;
        let period = 'AM';
        if (nextSlotHour >= 12) {
          period = 'PM';
          if (nextSlotHour > 12) {
            displayHour = nextSlotHour - 12;
          }
        } else if (nextSlotHour === 0) {
          displayHour = 12;
        }
        effectiveStartTime = `${displayHour}:${nextSlotMin.toString().padStart(2, '0')} ${period}`;
        
        console.log(`⏰ Same-day booking detected. Current time: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`, {
          sessionStartTime: session.sessionStartTime,
          sessionEndTime: session.sessionEndTime,
          pastSlotsCount,
          effectiveMaxTokens,
          effectiveStartTime,
        });
      }
    }
    
    // Get actual booked appointments count (not just currentToken)
    const Appointment = require('../models/Appointment');
    const actualBookedCount = await Appointment.countDocuments({
      sessionId: session._id,
      status: { $in: ['scheduled', 'confirmed', 'in_progress'] },
    });
    
    // Use actual booked count instead of currentToken for accurate slot calculation
    // currentToken might be incorrect if appointments were cancelled or deleted
    const bookedSlots = actualBookedCount;
    
    // For same-day bookings, adjust available slots calculation
    const availableSlots = isSameDay && pastSlotsCount > 0
      ? Math.max(0, effectiveMaxTokens - Math.max(0, bookedSlots - pastSlotsCount))
      : Math.max(0, session.maxTokens - bookedSlots);

    // Debug log to verify calculation
    console.log(`📊 Slot Availability for ${date}:`, {
      doctorId,
      sessionId: session._id,
      sessionStartTime: session.sessionStartTime,
      sessionEndTime: session.sessionEndTime,
      maxTokens: session.maxTokens,
      currentToken: session.currentToken,
      actualBookedCount,
      bookedSlots,
      availableSlots,
      isSameDay,
      pastSlotsCount,
      effectiveMaxTokens: isSameDay ? effectiveMaxTokens : session.maxTokens,
      effectiveStartTime: isSameDay && pastSlotsCount > 0 ? effectiveStartTime : session.sessionStartTime,
      avgConsultationMinutes: avgConsultation,
    });

    return {
      available: availableSlots > 0,
      totalSlots: isSameDay && pastSlotsCount > 0 ? effectiveMaxTokens : session.maxTokens,
      bookedSlots,
      availableSlots,
      sessionId: session._id,
      sessionStartTime: isSameDay && pastSlotsCount > 0 ? effectiveStartTime : session.sessionStartTime,
      sessionEndTime: session.sessionEndTime,
      avgConsultationMinutes: avgConsultation,
      isSameDay,
      pastSlotsCount,
    };
  } catch (error) {
    console.error(`❌ Error checking slot availability for ${date}:`, error);
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

