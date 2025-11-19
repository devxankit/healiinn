const asyncHandler = require('../../middleware/asyncHandler');
const Doctor = require('../../models/Doctor');
const Appointment = require('../../models/Appointment');
const { ROLES } = require('../../utils/constants');

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const DAY_INDEX_MAP = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0,
};

const validateTimeFormat = (time) => {
  if (!time || typeof time !== 'string') return false;
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

const validateTimeRange = (startTime, endTime) => {
  if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
    return false;
  }
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return endMinutes > startMinutes;
};

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const getDayOfWeek = (date) => {
  const dayIndex = date.getDay();
  return Object.keys(DAY_INDEX_MAP).find((day) => DAY_INDEX_MAP[day] === dayIndex);
};

const checkTimeOverlap = (start1, end1, start2, end2) => {
  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);
  
  return (
    (start1Min >= start2Min && start1Min < end2Min) ||
    (end1Min > start2Min && end1Min <= end2Min) ||
    (start1Min <= start2Min && end1Min >= end2Min)
  );
};

const checkAvailabilitySlotConflicts = (availability) => {
  const slotsByDay = {};
  const conflicts = [];
  
  availability.forEach((slot) => {
    if (!slotsByDay[slot.day]) {
      slotsByDay[slot.day] = [];
    }
    slotsByDay[slot.day].push(slot);
  });

  for (const day in slotsByDay) {
    const daySlots = slotsByDay[day].sort((a, b) => 
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );
    
    for (let i = 0; i < daySlots.length; i++) {
      for (let j = i + 1; j < daySlots.length; j++) {
        if (
          checkTimeOverlap(
            daySlots[i].startTime,
            daySlots[i].endTime,
            daySlots[j].startTime,
            daySlots[j].endTime
          )
        ) {
          conflicts.push({
            day,
            slot1: daySlots[i],
            slot2: daySlots[j],
            message: `Overlapping slots on ${day}: ${daySlots[i].startTime}-${daySlots[i].endTime} and ${daySlots[j].startTime}-${daySlots[j].endTime}`,
          });
        }
      }
    }
  }

  return conflicts;
};

const checkAppointmentConflicts = async (doctorId, availability) => {
  const now = new Date();
  const conflicts = [];

  // Get all upcoming appointments
  const upcomingAppointments = await Appointment.find({
    doctor: doctorId,
    scheduledFor: { $gte: now },
    status: { $in: ['scheduled', 'confirmed'] },
  })
    .select('scheduledFor durationMinutes status patient')
    .populate('patient', 'firstName lastName')
    .lean();

  if (upcomingAppointments.length === 0) {
    return { hasConflicts: false, conflicts: [] };
  }

  for (const appointment of upcomingAppointments) {
    const appointmentDate = new Date(appointment.scheduledFor);
    const appointmentDay = getDayOfWeek(appointmentDate);
    const appointmentTime = minutesToTime(
      appointmentDate.getHours() * 60 + appointmentDate.getMinutes()
    );
    const appointmentEndTime = minutesToTime(
      appointmentDate.getHours() * 60 +
        appointmentDate.getMinutes() +
        (appointment.durationMinutes || 20)
    );

    // Find matching availability slot for this day
    const matchingSlots = availability.filter((slot) => slot.day === appointmentDay);

    if (matchingSlots.length === 0) {
      conflicts.push({
        appointmentId: appointment._id,
        scheduledFor: appointment.scheduledFor,
        status: appointment.status,
        patient: appointment.patient ? {
          id: appointment.patient._id,
          name: `${appointment.patient.firstName || ''} ${appointment.patient.lastName || ''}`.trim(),
        } : null,
        reason: `No availability slot found for ${appointmentDay}`,
        day: appointmentDay,
        appointmentTime,
        appointmentEndTime,
      });
      continue;
    }

    // Check if appointment time falls within any slot
    let fitsInSlot = false;
    for (const slot of matchingSlots) {
      if (
        checkTimeOverlap(
          appointmentTime,
          appointmentEndTime,
          slot.startTime,
          slot.endTime
        )
      ) {
        // Check if appointment is fully within the slot
        const apptStartMin = timeToMinutes(appointmentTime);
        const apptEndMin = timeToMinutes(appointmentEndTime);
        const slotStartMin = timeToMinutes(slot.startTime);
        const slotEndMin = timeToMinutes(slot.endTime);

        if (apptStartMin >= slotStartMin && apptEndMin <= slotEndMin) {
          fitsInSlot = true;
          break;
        }
      }
    }

    if (!fitsInSlot) {
      conflicts.push({
        appointmentId: appointment._id,
        scheduledFor: appointment.scheduledFor,
        status: appointment.status,
        patient: appointment.patient ? {
          id: appointment.patient._id,
          name: `${appointment.patient.firstName || ''} ${appointment.patient.lastName || ''}`.trim(),
        } : null,
        reason: `Appointment scheduled outside availability slots for ${appointmentDay}`,
        day: appointmentDay,
        appointmentTime,
        appointmentEndTime,
        availableSlots: matchingSlots.map((s) => `${s.startTime}-${s.endTime}`),
      });
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
};

exports.getAvailability = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.auth.id).select('availability availableTimings');

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found.',
    });
  }

  res.json({
    success: true,
    availability: doctor.availability || [],
    availableTimings: doctor.availableTimings || [],
  });
});

exports.updateAvailability = asyncHandler(async (req, res) => {
  const { availability, availableTimings, checkConflicts = true } = req.body;
  const doctor = await Doctor.findById(req.auth.id);

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found.',
    });
  }

  // Validate and update availability
  if (availability !== undefined) {
    if (!Array.isArray(availability)) {
      return res.status(400).json({
        success: false,
        message: 'Availability must be an array.',
      });
    }

    // Validate each availability entry
    for (const entry of availability) {
      if (!entry.day || !entry.startTime || !entry.endTime) {
        return res.status(400).json({
          success: false,
          message: 'Each availability entry must have day, startTime, and endTime.',
        });
      }

      const day = entry.day.toLowerCase();
      if (!DAYS_OF_WEEK.includes(day)) {
        return res.status(400).json({
          success: false,
          message: `Invalid day: ${entry.day}. Must be one of: ${DAYS_OF_WEEK.join(', ')}.`,
        });
      }

      if (!validateTimeRange(entry.startTime, entry.endTime)) {
        return res.status(400).json({
          success: false,
          message: `Invalid time range for ${entry.day}. End time must be after start time.`,
        });
      }

      entry.day = day;
    }

    // Check for overlapping slots within availability array
    const slotConflicts = checkAvailabilitySlotConflicts(availability);
    if (slotConflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Availability slots have conflicts.',
        conflicts: slotConflicts,
      });
    }

    // Check for appointment conflicts if requested
    if (checkConflicts) {
      const appointmentConflicts = await checkAppointmentConflicts(
        doctor._id,
        availability
      );

      if (appointmentConflicts.hasConflicts) {
        return res.status(400).json({
          success: false,
          message: 'Availability update conflicts with existing appointments.',
          appointmentConflicts: appointmentConflicts.conflicts,
        });
      }
    }

    doctor.availability = availability;
  }

  // Validate and update availableTimings
  if (availableTimings !== undefined) {
    if (!Array.isArray(availableTimings)) {
      return res.status(400).json({
        success: false,
        message: 'AvailableTimings must be an array.',
      });
    }

    doctor.availableTimings = availableTimings;
  }

  await doctor.save();

  res.json({
    success: true,
    message: 'Availability updated successfully.',
    availability: doctor.availability,
    availableTimings: doctor.availableTimings,
  });
});

exports.addAvailabilitySlot = asyncHandler(async (req, res) => {
  const { day, startTime, endTime } = req.body;
  const doctor = await Doctor.findById(req.auth.id);

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found.',
    });
  }

  if (!day || !startTime || !endTime) {
    return res.status(400).json({
      success: false,
      message: 'day, startTime, and endTime are required.',
    });
  }

  const dayLower = day.toLowerCase();
  if (!DAYS_OF_WEEK.includes(dayLower)) {
    return res.status(400).json({
      success: false,
      message: `Invalid day: ${day}. Must be one of: ${DAYS_OF_WEEK.join(', ')}.`,
    });
  }

  if (!validateTimeRange(startTime, endTime)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid time range. End time must be after start time.',
    });
  }

  // Check if slot already exists
  const existingSlot = doctor.availability.find(
    (slot) => slot.day === dayLower && slot.startTime === startTime && slot.endTime === endTime
  );

  if (existingSlot) {
    return res.status(400).json({
      success: false,
      message: 'This availability slot already exists.',
    });
  }

  // Check for overlapping slots
  const overlappingSlot = doctor.availability.find(
    (slot) =>
      slot.day === dayLower &&
      ((startTime >= slot.startTime && startTime < slot.endTime) ||
        (endTime > slot.startTime && endTime <= slot.endTime) ||
        (startTime <= slot.startTime && endTime >= slot.endTime))
  );

  if (overlappingSlot) {
    return res.status(400).json({
      success: false,
      message: 'This slot overlaps with an existing availability slot.',
    });
  }

  doctor.availability.push({
    day: dayLower,
    startTime,
    endTime,
  });

  await doctor.save();

  res.json({
    success: true,
    message: 'Availability slot added successfully.',
    availability: doctor.availability,
  });
});

exports.removeAvailabilitySlot = asyncHandler(async (req, res) => {
  const { slotId } = req.params;
  const { checkConflicts = true } = req.query;
  const doctor = await Doctor.findById(req.auth.id);

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found.',
    });
  }

  if (!doctor.availability || doctor.availability.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No availability slots to remove.',
    });
  }

  // Find slot by index
  const slotIndex = Number.parseInt(slotId, 10);
  
  if (Number.isNaN(slotIndex) || slotIndex < 0 || slotIndex >= doctor.availability.length) {
    return res.status(400).json({
      success: false,
      message: 'Invalid slot ID.',
    });
  }

  const slotToRemove = doctor.availability[slotIndex];

  // Check if removing this slot will conflict with appointments
  if (checkConflicts === 'true' || checkConflicts === true) {
    const newAvailability = doctor.availability.filter((_, index) => index !== slotIndex);
    const appointmentConflicts = await checkAppointmentConflicts(
      doctor._id,
      newAvailability
    );

    if (appointmentConflicts.hasConflicts) {
      // Filter conflicts to only show those affected by this slot removal
      const affectedConflicts = appointmentConflicts.conflicts.filter(
        (conflict) => conflict.day === slotToRemove.day
      );

      if (affectedConflicts.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove this slot as it will conflict with existing appointments.',
          slotToRemove,
          affectedAppointments: affectedConflicts,
        });
      }
    }
  }

  doctor.availability.splice(slotIndex, 1);
  await doctor.save();

  res.json({
    success: true,
    message: 'Availability slot removed successfully.',
    removedSlot: slotToRemove,
    availability: doctor.availability,
  });
});

exports.bulkUpdateAvailability = asyncHandler(async (req, res) => {
  const { slots, checkConflicts = true } = req.body;
  const doctor = await Doctor.findById(req.auth.id);

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found.',
    });
  }

  if (!Array.isArray(slots)) {
    return res.status(400).json({
      success: false,
      message: 'slots must be an array.',
    });
  }

  // Validate all slots
  for (const entry of slots) {
    if (!entry.day || !entry.startTime || !entry.endTime) {
      return res.status(400).json({
        success: false,
        message: 'Each slot must have day, startTime, and endTime.',
      });
    }

    const day = entry.day.toLowerCase();
    if (!DAYS_OF_WEEK.includes(day)) {
      return res.status(400).json({
        success: false,
        message: `Invalid day: ${entry.day}. Must be one of: ${DAYS_OF_WEEK.join(', ')}.`,
      });
    }

    if (!validateTimeRange(entry.startTime, entry.endTime)) {
      return res.status(400).json({
        success: false,
        message: `Invalid time range for ${entry.day}. End time must be after start time.`,
      });
    }

    entry.day = day;
  }

  // Check for overlapping slots within the array
  const slotConflicts = checkAvailabilitySlotConflicts(slots);
  if (slotConflicts.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Availability slots have conflicts.',
      conflicts: slotConflicts,
    });
  }

  // Check for appointment conflicts if requested
  if (checkConflicts) {
    const appointmentConflicts = await checkAppointmentConflicts(
      doctor._id,
      slots
    );

    if (appointmentConflicts.hasConflicts) {
      return res.status(400).json({
        success: false,
        message: 'Availability update conflicts with existing appointments.',
        appointmentConflicts: appointmentConflicts.conflicts,
      });
    }
  }

  doctor.availability = slots;
  await doctor.save();

  res.json({
    success: true,
    message: 'Availability updated successfully.',
    availability: doctor.availability,
  });
});

exports.checkAvailabilityConflicts = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.auth.id);

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found.',
    });
  }

  const availability = doctor.availability || [];

  // Check for slot conflicts
  const slotConflicts = checkAvailabilitySlotConflicts(availability);

  // Check for appointment conflicts
  const appointmentConflicts = await checkAppointmentConflicts(
    doctor._id,
    availability
  );

  res.json({
    success: true,
    slotConflicts: {
      hasConflicts: slotConflicts.length > 0,
      conflicts: slotConflicts,
    },
    appointmentConflicts: {
      hasConflicts: appointmentConflicts.hasConflicts,
      conflicts: appointmentConflicts.conflicts,
      totalConflicts: appointmentConflicts.conflicts.length,
    },
    summary: {
      totalSlots: availability.length,
      conflictingSlots: slotConflicts.length,
      conflictingAppointments: appointmentConflicts.conflicts.length,
      hasAnyConflicts: slotConflicts.length > 0 || appointmentConflicts.hasConflicts,
    },
  });
});

exports.validateAvailabilitySlot = asyncHandler(async (req, res) => {
  const { day, startTime, endTime } = req.body;
  const doctor = await Doctor.findById(req.auth.id);

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found.',
    });
  }

  if (!day || !startTime || !endTime) {
    return res.status(400).json({
      success: false,
      message: 'day, startTime, and endTime are required.',
    });
  }

  const dayLower = day.toLowerCase();
  if (!DAYS_OF_WEEK.includes(dayLower)) {
    return res.status(400).json({
      success: false,
      message: `Invalid day: ${day}. Must be one of: ${DAYS_OF_WEEK.join(', ')}.`,
    });
  }

  if (!validateTimeRange(startTime, endTime)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid time range. End time must be after start time.',
    });
  }

  // Check if slot conflicts with existing slots
  const existingSlots = doctor.availability || [];
  const overlappingSlot = existingSlots.find(
    (slot) =>
      slot.day === dayLower &&
      checkTimeOverlap(startTime, endTime, slot.startTime, slot.endTime)
  );

  // Check if this slot would conflict with appointments
  const testAvailability = [
    ...existingSlots,
    { day: dayLower, startTime, endTime },
  ];
  const appointmentConflicts = await checkAppointmentConflicts(
    doctor._id,
    testAvailability
  );

  res.json({
    success: true,
    isValid: !overlappingSlot && !appointmentConflicts.hasConflicts,
    conflicts: {
      overlapsWithExistingSlot: !!overlappingSlot,
      overlappingSlot: overlappingSlot || null,
      appointmentConflicts: appointmentConflicts.hasConflicts,
      conflictingAppointments: appointmentConflicts.conflicts,
    },
  });
});

// Block specific dates/times (holidays, leaves)
exports.blockDate = asyncHandler(async (req, res) => {
  const { date, reason = 'other', description, isRecurring = false, recurringPattern } = req.body;
  const doctor = await Doctor.findById(req.auth.id);

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found.',
    });
  }

  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'Date is required.',
    });
  }

  const blockDate = new Date(date);
  const today = startOfDay(new Date());

  if (blockDate < today) {
    return res.status(400).json({
      success: false,
      message: 'Cannot block past dates.',
    });
  }

  // Check if date is already blocked
  const existingBlock = doctor.blockedDates.find(
    (bd) => bd.date.toDateString() === blockDate.toDateString()
  );

  if (existingBlock) {
    return res.status(400).json({
      success: false,
      message: 'This date is already blocked.',
    });
  }

  // Check for appointment conflicts
  const appointmentsOnDate = await Appointment.find({
    doctor: doctor._id,
    scheduledFor: {
      $gte: startOfDay(blockDate),
      $lt: addDays(startOfDay(blockDate), 1),
    },
    status: { $in: ['scheduled', 'confirmed'] },
  }).lean();

  if (appointmentsOnDate.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot block date with existing appointments.',
      conflictingAppointments: appointmentsOnDate.map((apt) => ({
        id: apt._id,
        scheduledFor: apt.scheduledFor,
        patient: apt.patient,
      })),
    });
  }

  const blockEntry = {
    date: startOfDay(blockDate),
    reason,
    description: description || null,
    isRecurring,
    recurringPattern: isRecurring && recurringPattern ? recurringPattern : null,
  };

  doctor.blockedDates.push(blockEntry);
  await doctor.save();

  res.json({
    success: true,
    message: 'Date blocked successfully.',
    blockedDate: blockEntry,
  });
});

// Remove blocked date
exports.unblockDate = asyncHandler(async (req, res) => {
  const { blockId } = req.params;
  const doctor = await Doctor.findById(req.auth.id);

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found.',
    });
  }

  const blockIndex = Number.parseInt(blockId, 10);
  if (Number.isNaN(blockIndex) || blockIndex < 0 || blockIndex >= doctor.blockedDates.length) {
    return res.status(400).json({
      success: false,
      message: 'Invalid block ID.',
    });
  }

  const removedBlock = doctor.blockedDates[blockIndex];
  doctor.blockedDates.splice(blockIndex, 1);
  await doctor.save();

  res.json({
    success: true,
    message: 'Date unblocked successfully.',
    removedBlock,
  });
});

// Get blocked dates
exports.getBlockedDates = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.auth.id).select('blockedDates');

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found.',
    });
  }

  res.json({
    success: true,
    blockedDates: doctor.blockedDates || [],
  });
});

// Add break time
exports.addBreakTime = asyncHandler(async (req, res) => {
  const { day, startTime, endTime, isRecurring = true, specificDate } = req.body;
  const doctor = await Doctor.findById(req.auth.id);

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found.',
    });
  }

  if (!day || !startTime || !endTime) {
    return res.status(400).json({
      success: false,
      message: 'day, startTime, and endTime are required.',
    });
  }

  if (!isRecurring && !specificDate) {
    return res.status(400).json({
      success: false,
      message: 'specificDate is required when isRecurring is false.',
    });
  }

  const dayLower = day.toLowerCase();
  if (!DAYS_OF_WEEK.includes(dayLower) && !specificDate) {
    return res.status(400).json({
      success: false,
      message: `Invalid day: ${day}. Must be one of: ${DAYS_OF_WEEK.join(', ')}.`,
    });
  }

  if (!validateTimeRange(startTime, endTime)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid time range. End time must be after start time.',
    });
  }

  // Check if break overlaps with availability
  if (isRecurring && dayLower) {
    const dayAvailability = doctor.availability.filter((slot) => slot.day === dayLower);
    const hasOverlap = dayAvailability.some((slot) =>
      checkTimeOverlap(startTime, endTime, slot.startTime, slot.endTime)
    );

    if (!hasOverlap) {
      return res.status(400).json({
        success: false,
        message: 'Break time must be within available hours.',
      });
    }
  }

  const breakEntry = {
    day: isRecurring ? dayLower : null,
    startTime,
    endTime,
    isRecurring,
    specificDate: isRecurring ? null : new Date(specificDate),
  };

  doctor.breakTimes.push(breakEntry);
  await doctor.save();

  res.json({
    success: true,
    message: 'Break time added successfully.',
    breakTime: breakEntry,
  });
});

// Remove break time
exports.removeBreakTime = asyncHandler(async (req, res) => {
  const { breakId } = req.params;
  const doctor = await Doctor.findById(req.auth.id);

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found.',
    });
  }

  const breakIndex = Number.parseInt(breakId, 10);
  if (Number.isNaN(breakIndex) || breakIndex < 0 || breakIndex >= doctor.breakTimes.length) {
    return res.status(400).json({
      success: false,
      message: 'Invalid break ID.',
    });
  }

  const removedBreak = doctor.breakTimes[breakIndex];
  doctor.breakTimes.splice(breakIndex, 1);
  await doctor.save();

  res.json({
    success: true,
    message: 'Break time removed successfully.',
    removedBreak,
  });
});

// Get break times
exports.getBreakTimes = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.auth.id).select('breakTimes');

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found.',
    });
  }

  res.json({
    success: true,
    breakTimes: doctor.breakTimes || [],
  });
});

// Add temporary availability
exports.addTemporaryAvailability = asyncHandler(async (req, res) => {
  const { date, slots, reason } = req.body;
  const doctor = await Doctor.findById(req.auth.id);

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found.',
    });
  }

  if (!date || !slots || !Array.isArray(slots) || slots.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'date and slots (array) are required.',
    });
  }

  const tempDate = new Date(date);
  const today = startOfDay(new Date());

  if (tempDate < today) {
    return res.status(400).json({
      success: false,
      message: 'Cannot set temporary availability for past dates.',
    });
  }

  // Validate slots
  for (const slot of slots) {
    if (!slot.startTime || !slot.endTime) {
      return res.status(400).json({
        success: false,
        message: 'Each slot must have startTime and endTime.',
      });
    }

    if (!validateTimeRange(slot.startTime, slot.endTime)) {
      return res.status(400).json({
        success: false,
        message: `Invalid time range: ${slot.startTime}-${slot.endTime}.`,
      });
    }
  }

  // Check for overlapping slots
  const slotConflicts = checkAvailabilitySlotConflicts(slots);
  if (slotConflicts.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Slots have conflicts.',
      conflicts: slotConflicts,
    });
  }

  // Check if date already has temporary availability
  const existingTemp = doctor.temporaryAvailability.find(
    (ta) => ta.date.toDateString() === startOfDay(tempDate).toDateString()
  );

  if (existingTemp) {
    existingTemp.slots = slots;
    existingTemp.reason = reason || null;
  } else {
    doctor.temporaryAvailability.push({
      date: startOfDay(tempDate),
      slots,
      reason: reason || null,
    });
  }

  await doctor.save();

  res.json({
    success: true,
    message: 'Temporary availability added successfully.',
    temporaryAvailability: existingTemp || doctor.temporaryAvailability[doctor.temporaryAvailability.length - 1],
  });
});

// Remove temporary availability
exports.removeTemporaryAvailability = asyncHandler(async (req, res) => {
  const { tempId } = req.params;
  const doctor = await Doctor.findById(req.auth.id);

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found.',
    });
  }

  const tempIndex = Number.parseInt(tempId, 10);
  if (Number.isNaN(tempIndex) || tempIndex < 0 || tempIndex >= doctor.temporaryAvailability.length) {
    return res.status(400).json({
      success: false,
      message: 'Invalid temporary availability ID.',
    });
  }

  const removedTemp = doctor.temporaryAvailability[tempIndex];
  doctor.temporaryAvailability.splice(tempIndex, 1);
  await doctor.save();

  res.json({
    success: true,
    message: 'Temporary availability removed successfully.',
    removedTemporaryAvailability: removedTemp,
  });
});

// Get temporary availability
exports.getTemporaryAvailability = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.auth.id).select('temporaryAvailability');

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found.',
    });
  }

  res.json({
    success: true,
    temporaryAvailability: doctor.temporaryAvailability || [],
  });
});

