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

  // Get all appointments including those called/in-consultation/no-show/completed so doctor can see all
  // Include no-show and cancelled appointments so they remain visible in the list
  const appointments = await Appointment.find({
    sessionId: session._id,
    status: { $in: ['scheduled', 'confirmed', 'called', 'in-consultation', 'in_progress', 'waiting', 'cancelled', 'completed', 'no-show'] },
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
      appointmentId: appointment._id,
      appointment: {
        _id: appointment._id,
        patientId: appointment.patientId,
        status: appointment.status,
        tokenNumber: appointment.tokenNumber,
      },
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

  if (!appointment.sessionId) {
    return res.status(400).json({
      success: false,
      message: 'Appointment does not have a session',
    });
  }

  const session = await Session.findById(appointment.sessionId);
  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found',
    });
  }

  // Prevent skipping cancelled/no-show appointments
  if (appointment.status === 'cancelled' || appointment.status === 'cancelled_by_session' || 
      appointment.queueStatus === 'no-show' || appointment.queueStatus === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Cannot skip a cancelled or no-show appointment',
    });
  }

  // IMPORTANT: End any active calls for this appointment before skipping
  // This prevents "A call is already in progress" error when test script runs again
  try {
    const Call = require('../../models/Call');
    const { cleanupCall } = require('../../config/mediasoup');
    const io = getIO();
    
    // Find all active calls for this appointment
    const activeCalls = await Call.find({
      appointmentId: appointment._id,
      status: { $in: ['initiated', 'accepted'] },
    });

    // End all active calls
    for (const call of activeCalls) {
      try {
        console.log(`📞 Ending active call ${call.callId} for skipped appointment ${appointmentId}`);
        
        // End the call (updates status to 'ended')
        await call.endCall();
        
        // Cleanup mediasoup resources (WebRTC transports, producers, etc.)
        await cleanupCall(call.callId);
        
        // Notify all participants that call has ended
        io.to(`call-${call.callId}`).emit('call:ended', { 
          callId: call.callId, 
          reason: 'patient_skipped' 
        });
        
        console.log(`✅ Successfully ended call ${call.callId}`);
      } catch (callError) {
        console.error(`❌ Error ending call ${call.callId}:`, callError);
        // Continue with skip even if call cleanup fails
      }
    }
  } catch (error) {
    console.error('❌ Error checking/ending active calls:', error);
    // Continue with skip even if call cleanup fails
  }

  const originalTokenNumber = appointment.tokenNumber;

  // Get ALL completed appointments to ensure we NEVER reuse their token numbers
  // CRITICAL: Completed appointments' token numbers must NEVER be reused
  const completedAppointments = await Appointment.find({
    sessionId: session._id,
    status: 'completed',
    tokenNumber: { $ne: null },
  }).select('tokenNumber');

  const completedTokenNumbers = new Set(completedAppointments.map(apt => apt.tokenNumber));

  // Get ALL cancelled appointments to ensure we NEVER reuse their token numbers
  // CRITICAL: Cancelled appointments' token numbers must NEVER be reused
  const cancelledAppointments = await Appointment.find({
    sessionId: session._id,
    status: { $in: ['cancelled', 'cancelled_by_session'] },
    tokenNumber: { $ne: null },
  }).select('tokenNumber');

  const cancelledTokenNumbers = new Set(cancelledAppointments.map(apt => apt.tokenNumber));

  // Create combined set of protected tokens that should NEVER be reused
  // These tokens belong to completed or cancelled appointments and must remain untouched
  const protectedTokenNumbers = new Set([...completedTokenNumbers, ...cancelledTokenNumbers]);

  // Get ALL active appointments (excluding skipped, no-show, completed, cancelled, cancelled_by_session)
  // CRITICAL: Cancelled/no-show appointments must be completely excluded from token number calculations
  // IMPORTANT: Completed appointments are excluded from active list, but we track their token numbers separately
  // We want to reuse available tokens, but NEVER reuse completed appointment tokens
  const activeAppointments = await Appointment.find({
    sessionId: session._id,
    status: { $nin: ['completed', 'cancelled', 'cancelled_by_session'] },
    queueStatus: { $nin: ['skipped', 'no-show', 'completed', 'cancelled'] },
    _id: { $ne: appointmentId }, // Exclude the patient being skipped
  }).sort({ tokenNumber: 1 });

  // Get ALL skipped appointments (excluding the one being skipped)
  // Also exclude cancelled_by_session status
  const skippedAppointments = await Appointment.find({
    sessionId: session._id,
    status: { $nin: ['completed', 'cancelled', 'cancelled_by_session'] },
    queueStatus: 'skipped',
    _id: { $ne: appointmentId }, // Exclude the patient being skipped
  }).sort({ tokenNumber: 1 });

  // Find the last active token number
  // IMPORTANT: Only consider active appointments (cancelled/no-show are already excluded in query)
  let lastActiveTokenNumber = 0;
  if (activeAppointments.length > 0) {
    lastActiveTokenNumber = Math.max(...activeAppointments.map(apt => apt.tokenNumber));
  }

  // Find the last skipped token number
  // IMPORTANT: Only consider skipped appointments (cancelled/no-show are already excluded in query)
  let lastSkippedTokenNumber = 0;
  if (skippedAppointments.length > 0) {
    lastSkippedTokenNumber = Math.max(...skippedAppointments.map(apt => apt.tokenNumber));
  }
  
  // Verify that we're not accidentally including cancelled appointments
  // This is a safety check - cancelled appointments should never be in activeAppointments or skippedAppointments
  // The queries above already exclude them, but this is an extra safeguard
  const filteredActiveAppointments = activeAppointments.filter(apt => 
    apt.status !== 'cancelled' && apt.status !== 'cancelled_by_session' && 
    apt.queueStatus !== 'no-show' && apt.queueStatus !== 'cancelled'
  );
  const filteredSkippedAppointments = skippedAppointments.filter(apt => 
    apt.status !== 'cancelled' && apt.status !== 'cancelled_by_session' && 
    apt.queueStatus !== 'no-show' && apt.queueStatus !== 'cancelled'
  );
  
  // Use filtered lists for calculations (should be same as original, but ensures safety)
  const safeActiveAppointments = filteredActiveAppointments;
  const safeSkippedAppointments = filteredSkippedAppointments;
  
  // Recalculate lastActiveTokenNumber using safe list
  if (safeActiveAppointments.length > 0) {
    lastActiveTokenNumber = Math.max(...safeActiveAppointments.map(apt => apt.tokenNumber));
  } else {
    lastActiveTokenNumber = 0;
  }
  
  // Recalculate lastSkippedTokenNumber using safe list
  if (safeSkippedAppointments.length > 0) {
    lastSkippedTokenNumber = Math.max(...safeSkippedAppointments.map(apt => apt.tokenNumber));
  } else {
    lastSkippedTokenNumber = 0;
  }
  
  // Get ALL active appointments that need to shift down (those after original position)
  // IMPORTANT: We need to shift ALL active appointments that come after the skipped patient,
  // not just those up to lastActiveTokenNumber. This ensures proper queue reorganization.
  // Use safe list to ensure cancelled appointments are never included
  const activeAppointmentsToShift = safeActiveAppointments.filter(
    apt => apt.tokenNumber > originalTokenNumber
  ).sort((a, b) => a.tokenNumber - b.tokenNumber); // Sort by token number to shift in order

  // Calculate the target token number for the new skipped patient
  // SIMPLIFIED: Find MAX token from ALL appointments (active + skipped + completed, excluding cancelled)
  // Skipped patient goes to this MAX token position (no new tokens created)
  // If MAX is protected, find last non-protected token
  const allAppointmentsForMaxToken = await Appointment.find({
    sessionId: session._id,
    tokenNumber: { $ne: null },
    status: { $ne: 'cancelled' }, // Exclude cancelled, but include completed
  }).select('tokenNumber');

  const maxTokenFromAll = allAppointmentsForMaxToken.length > 0
    ? Math.max(...allAppointmentsForMaxToken.map(apt => apt.tokenNumber))
    : 0;
  
  // Start with MAX token as target
  let targetTokenNumber = maxTokenFromAll;
  
  // If MAX token is protected (completed/cancelled), find the last non-protected token
  // Work backwards from max to find the last available position
  while (protectedTokenNumbers.has(targetTokenNumber) && targetTokenNumber > originalTokenNumber) {
    targetTokenNumber--;
  }
  
  // Safety: If we went below skipped patient's token, use skipped patient's token as minimum
  if (targetTokenNumber < originalTokenNumber) {
    targetTokenNumber = originalTokenNumber;
  }
  
  // Final check: Ensure target is not protected
  while (protectedTokenNumbers.has(targetTokenNumber) && targetTokenNumber <= maxTokenFromAll) {
    targetTokenNumber++;
    // If we exceed max, we've run out of non-protected tokens - use max itself
    if (targetTokenNumber > maxTokenFromAll) {
      targetTokenNumber = maxTokenFromAll;
      break;
    }
  }
  
  // Calculate how many appointments will actually shift (for logging/debugging)
  const appointmentsThatWillShift = activeAppointmentsToShift.filter(apt => {
    const targetToken = apt.tokenNumber - 1;
    // Will shift if target is not protected (or is the skipped patient's token which becomes available)
    return !protectedTokenNumbers.has(targetToken) || targetToken === originalTokenNumber;
  });
  
  const activeShiftedCount = appointmentsThatWillShift.length;
  const newLastActiveToken = lastActiveTokenNumber - activeShiftedCount;
  const previouslySkippedCount = safeSkippedAppointments.length;
  
  console.log(`🔢 Skip token calculation:`, {
    originalTokenNumber,
    lastActiveTokenNumber,
    lastSkippedTokenNumber,
    activeShiftedCount,
    newLastActiveToken,
    previouslySkippedCount,
    targetTokenNumber,
    activeCount: safeActiveAppointments.length,
    skippedCount: safeSkippedAppointments.length,
  });

  // If this patient is already at the target position and is already skipped, just return
  // (This handles the case where a skipped patient is being skipped again - they're already at the end)
  if (appointment.queueStatus === 'skipped' && originalTokenNumber >= targetTokenNumber) {
    // Patient is already skipped at last position, no need to move
    // Just update status if needed and ensure time is correct
    appointment.status = appointment.status === 'called' || appointment.status === 'in-consultation' || appointment.status === 'in_progress' 
      ? 'scheduled' 
      : appointment.status;
    
    // Ensure appointment time is correct for the token position
    const Doctor = require('../../models/Doctor');
    const doctor = await Doctor.findById(session.doctorId).select('averageConsultationMinutes');
    if (doctor && session.sessionStartTime) {
      const { timeToMinutes } = require('../../services/etaService');
      const sessionStartMinutes = timeToMinutes(session.sessionStartTime);
      const avgConsultation = doctor.averageConsultationMinutes || 20;
      
      // Calculate time for this token (token - 1 because token 1 starts at session start)
      const tokenTimeMinutes = sessionStartMinutes + (appointment.tokenNumber - 1) * avgConsultation;
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
      appointment.time = calculatedTime;
    }
    
    await appointment.save();

    // Update session current token if this was the current token
    if (session.currentToken === originalTokenNumber) {
      // Find next active appointment (use safe list to exclude cancelled)
      const nextAppointment = safeActiveAppointments.find(apt => apt.tokenNumber > originalTokenNumber);
      if (nextAppointment) {
        session.currentToken = nextAppointment.tokenNumber;
      } else {
        // No more patients, keep current token or increment
        session.currentToken = originalTokenNumber + 1;
      }
      await session.save();
    }

    // Recalculate ETAs to get ETA for skipped patient
    let skippedPatientETA = null;
    try {
      const etas = await recalculateSessionETAs(session._id);
      const io = getIO();

      // Find ETA for skipped patient
      skippedPatientETA = etas.find(eta =>
        eta.appointmentId.toString() === appointment._id.toString()
      );

      // Emit ETA updates to all patients
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

    // Format short notification message with time information
    let notificationMessage = `Skipped. Token: ${originalTokenNumber}`;
    
    if (skippedPatientETA && skippedPatientETA.estimatedCallTime) {
      // Format estimated call time
      const callTime = new Date(skippedPatientETA.estimatedCallTime);
      const hours = callTime.getHours();
      const minutes = callTime.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const callTimeText = `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
      notificationMessage += ` • Time: ${callTimeText}`;
    }

    // Get patient data for email notification
    const Patient = require('../../models/Patient');
    const patient = await Patient.findById(appointment.patientId).select('email firstName lastName');

    // Send notification (with email)
    try {
      const { createNotification } = require('../../services/notificationService');
      await createNotification({
        userId: appointment.patientId,
        userType: 'patient',
        type: 'appointment',
        title: 'Appointment Skipped',
        message: notificationMessage,
        data: {
          sessionId: session._id.toString(),
          appointmentId: appointment._id.toString(),
          tokenNumber: originalTokenNumber,
          oldTokenNumber: originalTokenNumber,
          estimatedWaitMinutes: skippedPatientETA?.estimatedWaitMinutes || 0,
          estimatedCallTime: skippedPatientETA?.estimatedCallTime || null,
          patientsAhead: skippedPatientETA?.patientsAhead || 0,
        },
        priority: 'medium',
        actionUrl: '/patient/appointments',
        icon: 'queue',
        sendEmail: true,
        user: patient,
      }).catch((error) => console.error('Error creating skip notification:', error));
    } catch (error) {
      console.error('Error creating notifications:', error);
    }

    return res.status(200).json({
      success: true,
      message: 'Patient skipped',
      data: {
        oldTokenNumber: originalTokenNumber,
        newTokenNumber: originalTokenNumber,
      },
    });
  }

  // Strategy for shifting:
  // 1. Shift active appointments DOWN by 1 if they are after the original position
  // 2. Reorganize all previously skipped patients to sequential positions after active appointments
  // 3. Assign the new skipped patient to the absolute last position

  // Use a transaction-like approach: update all appointments
  // (activeAppointmentsToShift is already calculated above)
  const updatePromises = [];

  // Get doctor data once for all time calculations
  const Doctor = require('../../models/Doctor');
  let doctor = await Doctor.findById(session.doctorId).select('averageConsultationMinutes');

  // Helper function to calculate appointment time from token number
  const calculateTimeFromToken = (tokenNum, sessionStart, avgConsultation) => {
    const { timeToMinutes } = require('../../services/etaService');
    const sessionStartMinutes = timeToMinutes(sessionStart);
    const tokenTimeMinutes = sessionStartMinutes + (tokenNum - 1) * avgConsultation;
    const tokenHour = Math.floor(tokenTimeMinutes / 60);
    const tokenMin = tokenTimeMinutes % 60;
    
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
    
    return `${displayHour}:${tokenMin.toString().padStart(2, '0')} ${period}`;
  };

  // If the skipped patient is not already at the absolute last position, we need to shift
  if (originalTokenNumber < targetTokenNumber) {
    // Step 1: Shift ALL active appointments DOWN by 1 position (in reverse order to avoid conflicts)
    // CRITICAL: We shift sequentially, but NEVER reuse completed appointment token numbers
    // The skipped patient's token becomes available, so appointments shift down to fill the gap
    // Also recalculate their appointment times based on new token number
    // IMPORTANT: Track tokens being assigned AND tokens being vacated during shift to prevent duplicates
    const tokensBeingAssigned = new Set();
    const tokensBeingVacated = new Set(); // Tokens that will become available when appointments shift
    
    // Get all existing token numbers from database to check for conflicts
    // This includes all appointments (active, skipped, completed) except cancelled
    // CRITICAL: Exclude appointments that are being shifted, as their tokens will change
    const appointmentsBeingShiftedIds = new Set(activeAppointmentsToShift.map(apt => apt._id.toString()));
    
    const allExistingAppointments = await Appointment.find({
      sessionId: session._id,
      tokenNumber: { $ne: null },
      status: { $ne: 'cancelled' },
      _id: { $ne: appointment._id }, // Exclude the skipped appointment
    }).select('tokenNumber _id');
    
    // Filter out appointments that are being shifted (their tokens will change, so don't count current tokens as conflicts)
    const existingTokenNumbers = new Set(
      allExistingAppointments
        .filter(apt => !appointmentsBeingShiftedIds.has(apt._id.toString()))
        .map(apt => apt.tokenNumber)
    );
    
    // Track which tokens will be vacated (freed up) by the shift operation
    // When appointment at token N shifts to N-1, token N becomes available
    activeAppointmentsToShift.forEach(apt => {
      tokensBeingVacated.add(apt.tokenNumber); // This token will be freed when apt shifts
    });
    // Also, skipped patient's token becomes available
    tokensBeingVacated.add(originalTokenNumber);
    
    // Create a map to track which appointments are currently at which tokens (for conflict detection)
    // This helps us check if the target token is occupied by another appointment in the shift list
    const currentTokenToAppointmentMap = new Map(); // Maps: currentToken -> appointmentId
    activeAppointmentsToShift.forEach(apt => {
      currentTokenToAppointmentMap.set(apt.tokenNumber, apt._id.toString());
    });
    
    // CRITICAL: Process in forward order (lowest token first) to ensure sequential shifts
    // This ensures token 2 shifts to 1 before token 3 tries to shift to 2
    const sortedAppointmentsToShift = [...activeAppointmentsToShift].sort((a, b) => a.tokenNumber - b.tokenNumber);
    
    for (const apt of sortedAppointmentsToShift) {
      // Shift exactly by 1 position: token N → N-1
      const newTokenNumber = apt.tokenNumber - 1;
      
      // CRITICAL: Only shift if ALL conditions are met:
      // 1. Target token is not protected (completed/cancelled)
      // 2. Target token doesn't conflict with another appointment being shifted to same token
      // 3. Target token is not occupied by an appointment that's NOT being shifted (unless it's the skipped patient's token)
      // 4. Target token is >= skipped patient's token (don't go above skipped patient)
      // 5. Target token is >= 1
      
      // Check 1: Protected token check
      if (protectedTokenNumbers.has(newTokenNumber) && newTokenNumber !== originalTokenNumber) {
        // Target token is protected, can't shift here - keep at current position
        console.log(`⚠️ Cannot shift appointment ${apt._id} from token ${apt.tokenNumber} to ${newTokenNumber}: token is protected (completed/cancelled)`);
        continue;
      }
      
      // Check 2: Conflict with tokens already being assigned in this batch
      // Since we process in forward order (lowest token first), if a token is already assigned,
      // it means a lower token appointment already took it - this is a duplicate conflict
      if (tokensBeingAssigned.has(newTokenNumber)) {
        // Another appointment is already being assigned this token - skip this shift to prevent duplicate
        console.log(`⚠️ Cannot shift appointment ${apt._id} from token ${apt.tokenNumber} to ${newTokenNumber}: token already being assigned to another appointment`);
        continue;
      }
      
      // Check 2b: Check if target token is currently occupied by another appointment in the shift list
      // Since we process in forward order, if an appointment at target token is also shifting,
      // it should have already shifted (if it could). If it's still there, it means it couldn't shift,
      // so this token is still occupied
      const appointmentAtTargetToken = currentTokenToAppointmentMap.get(newTokenNumber);
      if (appointmentAtTargetToken && appointmentAtTargetToken !== apt._id.toString()) {
        // Another appointment in the shift list is currently at this token
        // Check if it already shifted (should be in tokensBeingAssigned if it did)
        const conflictingApt = sortedAppointmentsToShift.find(a => a._id.toString() === appointmentAtTargetToken);
        if (conflictingApt) {
          const conflictingNewToken = conflictingApt.tokenNumber - 1;
          // If conflicting appointment is before us in the sorted list and hasn't shifted yet, it's a conflict
          // (It should have shifted already if it could)
          if (conflictingApt.tokenNumber < apt.tokenNumber && !tokensBeingAssigned.has(conflictingNewToken)) {
            // Conflicting appointment is before us and hasn't shifted - token is still occupied
            console.log(`⚠️ Cannot shift appointment ${apt._id} from token ${apt.tokenNumber} to ${newTokenNumber}: appointment ${appointmentAtTargetToken} at this token hasn't shifted yet`);
            continue;
          }
          // If conflicting appointment already shifted or is after us, target becomes available - OK to proceed
        }
      }
      
      // Check 3: Conflict with existing appointments that are NOT being shifted
      // IMPORTANT: If the target token is being vacated (freed up) by another shift, it's available
      // If it's the skipped patient's token, it's available
      // Otherwise, if it exists in database and is NOT being vacated, it's a conflict
      if (existingTokenNumbers.has(newTokenNumber) && 
          newTokenNumber !== originalTokenNumber && 
          !tokensBeingVacated.has(newTokenNumber)) {
        // Token already exists in database and is NOT being freed - skip this shift
        console.log(`⚠️ Cannot shift appointment ${apt._id} from token ${apt.tokenNumber} to ${newTokenNumber}: token already exists and is not being vacated`);
        continue;
      }
      
      // Check 4: Don't go above skipped patient's token
      if (newTokenNumber < originalTokenNumber) {
        // Would go above skipped patient - skip this shift
        console.log(`⚠️ Cannot shift appointment ${apt._id} from token ${apt.tokenNumber} to ${newTokenNumber}: would go above skipped patient's token ${originalTokenNumber}`);
        continue;
      }
      
      // Check 5: Don't go below 1
      if (newTokenNumber < 1) {
        console.error(`❌ Cannot shift appointment ${apt._id} from token ${apt.tokenNumber} to ${newTokenNumber}: would go below token 1`);
        continue;
      }
      
      // Mark this token as being assigned
      tokensBeingAssigned.add(newTokenNumber);
      // Also add to existing set to prevent conflicts in subsequent iterations
      existingTokenNumbers.add(newTokenNumber);
      // Remove from vacated set since we're now using it
      tokensBeingVacated.delete(newTokenNumber);
      
      // Calculate new time for the shifted active appointment
      let timeUpdate = {};
      if (doctor && session.sessionStartTime) {
        const calculatedTime = calculateTimeFromToken(newTokenNumber, session.sessionStartTime, doctor.averageConsultationMinutes || 20);
        timeUpdate.time = calculatedTime;
      }
      
      updatePromises.push(
        Appointment.updateOne(
          { _id: apt._id },
          { $set: { tokenNumber: newTokenNumber, ...timeUpdate } }
        )
      );
    }

    // Step 2: Reorganize all previously skipped patients to sequential positions after active appointments
    // After active appointments shift up, we need to place skipped patients sequentially
    // CRITICAL: NEVER reuse protected token numbers (completed/cancelled)
    // Logic: After active shift, last active token = newLastActiveToken
    // Previously skipped count = safeSkippedAppointments.length
    // New skipped will be at: targetTokenNumber (calculated above)
    // Previously skipped should be at: (newLastActiveToken + 1), (newLastActiveToken + 2), ..., (targetTokenNumber - 1)
    // IMPORTANT: Use safeSkippedAppointments to ensure cancelled appointments are never included
    // IMPORTANT: Skip over any token numbers that belong to protected appointments (completed/cancelled)
    
    // Sort skipped appointments by their current token number to maintain order
    const sortedSkipped = [...safeSkippedAppointments].sort((a, b) => a.tokenNumber - b.tokenNumber);
    
    // Track tokens being assigned to skipped appointments to prevent duplicates
    const skippedTokensBeingAssigned = new Set();
    
    // Place previously skipped appointments sequentially after active appointments
    // Start from newLastActiveToken + 1 and increment, skipping protected tokens and conflicts
    let nextAvailableToken = newLastActiveToken + 1;
    
    sortedSkipped.forEach((skippedApt) => {
      // Find next available token that:
      // 1. Is not protected (completed/cancelled)
      // 2. Doesn't conflict with active appointments being shifted
      // 3. Doesn't conflict with other skipped appointments being reorganized
      // 4. Doesn't conflict with existing appointments in database
      // 5. Is less than targetTokenNumber (before the new skipped patient)
      
      while (
        nextAvailableToken < targetTokenNumber &&
        (
          protectedTokenNumbers.has(nextAvailableToken) ||
          tokensBeingAssigned.has(nextAvailableToken) ||
          skippedTokensBeingAssigned.has(nextAvailableToken) ||
          (existingTokenNumbers.has(nextAvailableToken) && nextAvailableToken !== originalTokenNumber)
        )
      ) {
        nextAvailableToken++;
      }
      
      // Only update if we found a valid token and it's different from current
      if (nextAvailableToken < targetTokenNumber && skippedApt.tokenNumber !== nextAvailableToken) {
        const newTokenNumber = nextAvailableToken;
        
        // Mark this token as being assigned
        skippedTokensBeingAssigned.add(newTokenNumber);
        existingTokenNumbers.add(newTokenNumber);
        
        // Calculate new time for the reorganized skipped appointment
        let timeUpdate = {};
        if (doctor && session.sessionStartTime) {
          const calculatedTime = calculateTimeFromToken(newTokenNumber, session.sessionStartTime, doctor.averageConsultationMinutes || 20);
          timeUpdate.time = calculatedTime;
        }
        
        updatePromises.push(
          Appointment.updateOne(
            { _id: skippedApt._id },
            { $set: { tokenNumber: newTokenNumber, ...timeUpdate } }
          )
        );
        
        // Move to next token for next skipped appointment
        nextAvailableToken++;
      } else if (nextAvailableToken >= targetTokenNumber) {
        // No more available tokens before target - keep current token
        console.log(`⚠️ No available token for skipped appointment ${skippedApt._id} before target ${targetTokenNumber}, keeping current token ${skippedApt.tokenNumber}`);
      }
    });
    
    // Step 3: Assign the new skipped patient to the absolute last position
    // CRITICAL: Ensure targetTokenNumber is not a protected token (completed/cancelled)
    // If it is protected, find the last non-protected token (work backwards, no new tokens)
    let finalTargetToken = targetTokenNumber;
    
    // If target is protected, find last non-protected token by working backwards
    if (protectedTokenNumbers.has(finalTargetToken)) {
      let candidateToken = finalTargetToken - 1;
      while (candidateToken > originalTokenNumber && protectedTokenNumbers.has(candidateToken)) {
        candidateToken--;
      }
      
      // If we found a non-protected token above skipped patient, use it
      if (candidateToken >= originalTokenNumber && !protectedTokenNumbers.has(candidateToken)) {
        finalTargetToken = candidateToken;
        console.log(`⚠️ Target token ${targetTokenNumber} is protected, using last non-protected token ${finalTargetToken} instead`);
      } else {
        // All tokens are protected - use original token (shouldn't happen, but safety)
        finalTargetToken = originalTokenNumber;
        console.log(`⚠️ All tokens are protected, keeping skipped patient at original token ${originalTokenNumber}`);
      }
    }
    
    appointment.tokenNumber = finalTargetToken;
  } else if (originalTokenNumber === targetTokenNumber) {
    // Patient is already at the absolute last position
    // This means they are already skipped and at last position
    // No need to reorganize other appointments, just ensure time is correct
    // Still check if target token is protected (shouldn't happen, but safety check)
    let finalTargetToken = targetTokenNumber;
    
    // If target is protected, find last non-protected token (work backwards, no new tokens)
    if (protectedTokenNumbers.has(finalTargetToken)) {
      let candidateToken = finalTargetToken - 1;
      while (candidateToken > 0 && protectedTokenNumbers.has(candidateToken)) {
        candidateToken--;
      }
      if (candidateToken > 0 && !protectedTokenNumbers.has(candidateToken)) {
        finalTargetToken = candidateToken;
        console.log(`⚠️ Target token ${targetTokenNumber} is protected, using last non-protected token ${finalTargetToken} instead`);
      }
    }
    
    appointment.tokenNumber = finalTargetToken;
  } else {
    // Patient is beyond target position (shouldn't happen, but handle it)
    // This case handles if somehow the patient is already beyond the last position
    // Just assign them to the target token number, but check for protected tokens
    let finalTargetToken = targetTokenNumber;
    
    // If target is protected, find last non-protected token (work backwards, no new tokens)
    if (protectedTokenNumbers.has(finalTargetToken)) {
      let candidateToken = finalTargetToken - 1;
      while (candidateToken > originalTokenNumber && protectedTokenNumbers.has(candidateToken)) {
        candidateToken--;
      }
      if (candidateToken >= originalTokenNumber && !protectedTokenNumbers.has(candidateToken)) {
        finalTargetToken = candidateToken;
        console.log(`⚠️ Target token ${targetTokenNumber} is protected, using last non-protected token ${finalTargetToken} instead`);
      } else {
        finalTargetToken = originalTokenNumber;
      }
    }
    
    appointment.tokenNumber = finalTargetToken;
  }
  
  appointment.queueStatus = 'skipped';
  appointment.status = appointment.status === 'called' || appointment.status === 'in-consultation' || appointment.status === 'in_progress' 
    ? 'scheduled' 
    : appointment.status;
  
  // Calculate and update appointment time based on token number and session start time
  // This ensures skipped patients get the correct time for their token position
  // (doctor is already fetched above)
  if (doctor && session.sessionStartTime) {
    const { timeToMinutes } = require('../../services/etaService');
    const sessionStartMinutes = timeToMinutes(session.sessionStartTime);
    const avgConsultation = doctor.averageConsultationMinutes || 20;
    
    // Calculate time for this token (token - 1 because token 1 starts at session start)
    const tokenTimeMinutes = sessionStartMinutes + (appointment.tokenNumber - 1) * avgConsultation;
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
    appointment.time = calculatedTime;
    
    console.log(`⏰ Updated skipped patient time:`, {
      appointmentId: appointment._id,
      originalTokenNumber,
      newTokenNumber: appointment.tokenNumber,
      targetTokenNumber,
      sessionStartTime: session.sessionStartTime,
      calculatedTime,
      sessionStartMinutes,
      tokenTimeMinutes,
      avgConsultationMinutes: avgConsultation,
      formula: `sessionStart(${sessionStartMinutes}min) + (tokenNumber(${appointment.tokenNumber}) - 1) × avgConsultation(${avgConsultation}min) = ${tokenTimeMinutes}min`,
    });
  }
  
  // Save the appointment with updated token number and time
  // We need to save it separately to ensure time is properly persisted
  await appointment.save();
  
  // Then execute other updates (shifting other appointments)
  await Promise.all(updatePromises);
  
  // CRITICAL: Enhanced validation to ensure no duplicate tokens exist after skip operation
  // This ensures data integrity and prevents token conflicts
  const allAppointmentsAfterSkip = await Appointment.find({
    sessionId: session._id,
    tokenNumber: { $ne: null },
  }).select('tokenNumber _id status queueStatus paymentStatus');
  
  const tokenCounts = {};
  const duplicateTokens = [];
  const protectedTokensFound = [];
  
  allAppointmentsAfterSkip.forEach(apt => {
    const token = apt.tokenNumber;
    
    // Check if protected token is being reused (should never happen)
    if (protectedTokenNumbers.has(token) && 
        apt.status !== 'completed' && 
        apt.status !== 'cancelled' && 
        apt.status !== 'cancelled_by_session') {
      protectedTokensFound.push({
        tokenNumber: token,
        appointmentId: apt._id.toString(),
        status: apt.status,
        queueStatus: apt.queueStatus,
      });
    }
    
    // Count token usage
    if (!tokenCounts[token]) {
      tokenCounts[token] = [];
    }
    tokenCounts[token].push({
      appointmentId: apt._id.toString(),
      status: apt.status,
      queueStatus: apt.queueStatus,
      paymentStatus: apt.paymentStatus,
    });
  });
  
  // Find duplicates
  Object.keys(tokenCounts).forEach(token => {
    if (tokenCounts[token].length > 1) {
      duplicateTokens.push({
        tokenNumber: parseInt(token),
        appointments: tokenCounts[token],
      });
    }
  });
  
  // Log validation results
  if (duplicateTokens.length > 0) {
    console.error('❌ CRITICAL: DUPLICATE TOKENS DETECTED AFTER SKIP OPERATION:', {
      duplicateCount: duplicateTokens.length,
      duplicates: duplicateTokens,
      skippedAppointmentId: appointment._id.toString(),
      originalTokenNumber,
      finalTokenNumber: appointment.tokenNumber,
    });
    // Log detailed information for debugging
    duplicateTokens.forEach(dup => {
      console.error(`  Token ${dup.tokenNumber} is assigned to ${dup.appointments.length} appointments:`, dup.appointments);
    });
    // Note: We don't throw an error here to avoid breaking the user experience
    // But we log it so it can be investigated and fixed
  }
  
  if (protectedTokensFound.length > 0) {
    console.error('❌ CRITICAL: PROTECTED TOKENS BEING REUSED AFTER SKIP OPERATION:', {
      protectedCount: protectedTokensFound.length,
      violations: protectedTokensFound,
      skippedAppointmentId: appointment._id.toString(),
    });
  }
  
  if (duplicateTokens.length === 0 && protectedTokensFound.length === 0) {
    console.log('✅ Token validation passed: No duplicate tokens or protected token reuse found after skip operation');
  }
  
  
  // Reload the appointment to ensure we have the latest data
  const updatedAppointment = await Appointment.findById(appointment._id);
  const finalTokenNumber = updatedAppointment.tokenNumber;
  const finalTime = updatedAppointment.time;
  
  console.log(`✅ Skipped patient saved:`, {
    appointmentId: updatedAppointment._id,
    finalTokenNumber,
    finalTime,
    tokenNumberMatches: finalTokenNumber === targetTokenNumber,
    duplicateTokensFound: duplicateTokens.length > 0,
  });

  // Update session current token if needed
  if (session.currentToken === originalTokenNumber) {
    // After shifting, the next active appointment would be at (originalTokenNumber + 1) position
    // But we need to find it after the shift is complete, so check what's at that position now
    const nextAppointment = await Appointment.findOne({
      sessionId: session._id,
      tokenNumber: originalTokenNumber + 1,
      status: { $nin: ['completed', 'cancelled'] },
      queueStatus: { $nin: ['skipped', 'no-show', 'completed', 'cancelled'] },
    });

    if (nextAppointment) {
      session.currentToken = nextAppointment.tokenNumber;
    } else {
      // Check if there's any active appointment after originalTokenNumber + 1
      const nextActiveAppointment = await Appointment.findOne({
        sessionId: session._id,
        tokenNumber: { $gt: originalTokenNumber + 1 },
        status: { $nin: ['completed', 'cancelled'] },
        queueStatus: { $nin: ['skipped', 'no-show', 'completed', 'cancelled'] },
      }).sort({ tokenNumber: 1 });

      if (nextActiveAppointment) {
        session.currentToken = nextActiveAppointment.tokenNumber;
      } else {
        // No more active patients, set to next token
        session.currentToken = originalTokenNumber + 1;
      }
    }
    await session.save();
  } else if (session.currentToken > originalTokenNumber && session.currentToken <= lastActiveTokenNumber) {
    // If currentToken was between original and last active token, it needs to shift down by 1
    session.currentToken = session.currentToken - 1;
    await session.save();
  }

  // Recalculate ETAs for all appointments
  let skippedPatientETA = null;
  try {
    const etas = await recalculateSessionETAs(session._id);
    const io = getIO();

    // Find ETA for skipped patient
    skippedPatientETA = etas.find(eta =>
      eta.appointmentId.toString() === appointment._id.toString()
    );

    // Emit ETA updates to all patients
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

  // finalTokenNumber and finalTime are already set above from reloaded appointment
  // Format short notification message with time information
  let notificationMessage = `Skipped. Token: ${finalTokenNumber}`;
  
  // Use the calculated time from the appointment, or ETA if available
  if (finalTime) {
    // Use the time that was calculated and saved to the appointment
    notificationMessage += ` • Time: ${finalTime}`;
  } else if (skippedPatientETA && skippedPatientETA.estimatedCallTime) {
    // Fallback to ETA if time is not available
    const callTime = new Date(skippedPatientETA.estimatedCallTime);
    const hours = callTime.getHours();
    const minutes = callTime.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const callTimeText = `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
    notificationMessage += ` • Time: ${callTimeText}`;
  }

  // Get patient data for email notification
  const Patient = require('../../models/Patient');
  const patient = await Patient.findById(appointment.patientId).select('email firstName lastName');

  // Create notification for skipped patient (with email)
  try {
    const { createNotification } = require('../../services/notificationService');
    await createNotification({
      userId: appointment.patientId,
      userType: 'patient',
      type: 'appointment',
      title: 'Appointment Skipped',
      message: notificationMessage,
        data: {
          sessionId: session._id.toString(),
          appointmentId: appointment._id.toString(),
          tokenNumber: finalTokenNumber,
          oldTokenNumber: originalTokenNumber,
          estimatedWaitMinutes: skippedPatientETA?.estimatedWaitMinutes || 0,
          estimatedCallTime: skippedPatientETA?.estimatedCallTime || null,
          patientsAhead: skippedPatientETA?.patientsAhead || 0,
        },
      priority: 'medium',
      actionUrl: '/patient/appointments',
      icon: 'queue',
      sendEmail: true,
      user: patient,
    }).catch((error) => console.error('Error creating skip notification:', error));
  } catch (error) {
    console.error('Error creating notifications:', error);
  }

  // Emit real-time events
  try {
    const io = getIO();
    io.to(`doctor-${id}`).emit('queue:updated', {
      appointmentId: appointment._id,
      tokenReordered: true,
      status: updatedAppointment.status, // Send updated status
      queueStatus: updatedAppointment.queueStatus, // Send updated queueStatus
    });
    io.to(`patient-${appointment.patientId}`).emit('appointment:skipped', {
      appointmentId: appointment._id,
      oldTokenNumber: originalTokenNumber,
      newTokenNumber: finalTokenNumber,
      estimatedWaitMinutes: skippedPatientETA?.estimatedWaitMinutes || 0,
      estimatedCallTime: skippedPatientETA?.estimatedCallTime || null,
      // Don't clear consultation room - patient might be recalled
      keepConsultationRoom: true,
    });

    // Notify all affected patients about token changes
    // Reload appointments after updates to get latest data including updated times
    const reloadedActiveAppointments = await Appointment.find({
      _id: { $in: activeAppointmentsToShift.map(apt => apt._id) }
    }).select('_id tokenNumber time patientId');
    
    // Get Patient model for notifications
    const Patient = require('../../models/Patient');
    const { createNotification } = require('../../services/notificationService');
    
    // Notify active appointments that shifted down
    for (const apt of activeAppointmentsToShift) {
      const reloadedApt = reloadedActiveAppointments.find(r => r._id.toString() === apt._id.toString());
      const newTokenNumber = apt.tokenNumber - 1; // Calculate new token number
      const oldTokenNumber = apt.tokenNumber;
      const oldTime = apt.time || 'N/A';
      const newTime = reloadedApt?.time || 'N/A';
      
      // Emit socket event
      io.to(`patient-${apt.patientId}`).emit('token:reordered', {
        appointmentId: apt._id,
        oldTokenNumber: oldTokenNumber,
        newTokenNumber: newTokenNumber,
        oldTime: oldTime,
        time: newTime, // Include updated appointment time
      });
      
      // Send email and in-app notification if token or time changed
      if (oldTokenNumber !== newTokenNumber || oldTime !== newTime) {
        try {
          const patient = await Patient.findById(apt.patientId).select('email firstName lastName');
          if (patient) {
            const notificationMessage = `Your appointment token number has changed from ${oldTokenNumber} to ${newTokenNumber}. New appointment time: ${newTime}`;
            
            await createNotification({
              userId: apt.patientId,
              userType: 'patient',
              type: 'appointment',
              title: 'Appointment Token & Time Updated',
              message: notificationMessage,
              data: {
                sessionId: session._id.toString(),
                appointmentId: apt._id.toString(),
                oldTokenNumber: oldTokenNumber,
                newTokenNumber: newTokenNumber,
                oldTime: oldTime,
                newTime: newTime,
                reason: 'Another patient was skipped, your appointment moved forward',
              },
              priority: 'medium',
              actionUrl: '/patient/appointments',
              icon: 'queue',
              sendEmail: true,
              user: patient,
            }).catch((error) => console.error(`Error creating notification for patient ${apt.patientId}:`, error));
          }
        } catch (error) {
          console.error(`Error sending notification to active patient ${apt.patientId}:`, error);
        }
      }
    }
    
    // Reload skipped appointments after updates (use safe list)
    const reloadedSkippedAppointments = safeSkippedAppointments.length > 0
      ? await Appointment.find({
          _id: { $in: safeSkippedAppointments.map(apt => apt._id) }
        }).select('_id tokenNumber time patientId')
      : [];
    
    // Notify previously skipped patients that shifted up (use safe list)
    for (const skippedApt of safeSkippedAppointments) {
      if (skippedApt.tokenNumber < targetTokenNumber) {
        const reloadedApt = reloadedSkippedAppointments.find(r => r._id.toString() === skippedApt._id.toString());
        const newTokenNumber = skippedApt.tokenNumber + 1; // Calculate new token number
        const oldTokenNumber = skippedApt.tokenNumber;
        const oldTime = skippedApt.time || 'N/A';
        const newTime = reloadedApt?.time || 'N/A';
        
        // Emit socket event
        io.to(`patient-${skippedApt.patientId}`).emit('token:reordered', {
          appointmentId: skippedApt._id,
          oldTokenNumber: oldTokenNumber,
          newTokenNumber: newTokenNumber,
          oldTime: oldTime,
          time: newTime, // Include updated appointment time
        });
        
        // Send email and in-app notification if token or time changed
        if (oldTokenNumber !== newTokenNumber || oldTime !== newTime) {
          try {
            const patient = await Patient.findById(skippedApt.patientId).select('email firstName lastName');
            if (patient) {
              const notificationMessage = `Your appointment token number has changed from ${oldTokenNumber} to ${newTokenNumber}. New appointment time: ${newTime}`;
              
              await createNotification({
                userId: skippedApt.patientId,
                userType: 'patient',
                type: 'appointment',
                title: 'Appointment Token & Time Updated',
                message: notificationMessage,
                data: {
                  sessionId: session._id.toString(),
                  appointmentId: skippedApt._id.toString(),
                  oldTokenNumber: oldTokenNumber,
                  newTokenNumber: newTokenNumber,
                  oldTime: oldTime,
                  newTime: newTime,
                  reason: 'Queue position updated due to another patient being skipped',
                },
                priority: 'medium',
                actionUrl: '/patient/appointments',
                icon: 'queue',
                sendEmail: true,
                user: patient,
              }).catch((error) => console.error(`Error creating notification for skipped patient ${skippedApt.patientId}:`, error));
            }
          } catch (error) {
            console.error(`Error sending notification to skipped patient ${skippedApt.patientId}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Patient skipped and moved to last position',
      data: {
        oldTokenNumber: originalTokenNumber,
        newTokenNumber: finalTokenNumber,
        activePatientsShifted: activeAppointmentsToShift.length,
        skippedPatientsShifted: safeSkippedAppointments.filter(apt => apt.tokenNumber < targetTokenNumber).length,
      },
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

  // Can recall skipped, no-show, or called/in-consultation patients (if they didn't come)
  // Allow recall for called/in-consultation patients who didn't show up
  const canRecall = ['skipped', 'no-show'].includes(appointment.queueStatus) ||
                    ['called', 'in-consultation', 'in_progress'].includes(appointment.status);
  
  if (!canRecall) {
    return res.status(400).json({
      success: false,
      message: 'Can only recall skipped, no-show, or called patients who did not attend',
    });
  }

  // Check if patient has been recalled maximum times (2 times)
  const recallCount = appointment.recallCount || 0;
  if (recallCount >= 2) {
    return res.status(400).json({
      success: false,
      message: 'Patient has already been recalled maximum times (2). Cannot recall again.',
      data: {
        recallCount: recallCount,
        maxRecalls: 2,
      },
    });
  }

  // Increment recall count
  appointment.recallCount = recallCount + 1;

  // Change status back to waiting (patient is recalled to queue)
  appointment.queueStatus = 'waiting';
  appointment.status = 'waiting';
  await appointment.save();

  // Recalculate ETAs for all appointments
  let recalledPatientETA = null;
  try {
    if (appointment.sessionId) {
      const etas = await recalculateSessionETAs(appointment.sessionId);
      const io = getIO();

      // Find ETA for recalled patient
      recalledPatientETA = etas.find(eta =>
        eta.appointmentId.toString() === appointment._id.toString()
      );

      // Emit ETA updates to all patients
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

  // Format notification message with token number and ETA information
  let notificationMessage = `You have been recalled to the queue. Your token number is ${appointment.tokenNumber}.`;

  if (recalledPatientETA) {
    // Format estimated time
    let estimatedTimeText = '';
    if (recalledPatientETA.estimatedWaitMinutes === 0) {
      estimatedTimeText = 'now';
    } else if (recalledPatientETA.estimatedWaitMinutes < 60) {
      estimatedTimeText = `in ${recalledPatientETA.estimatedWaitMinutes} minute${recalledPatientETA.estimatedWaitMinutes > 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(recalledPatientETA.estimatedWaitMinutes / 60);
      const minutes = recalledPatientETA.estimatedWaitMinutes % 60;
      estimatedTimeText = `${hours} hour${hours > 1 ? 's' : ''} ${minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`;
    }

    // Format estimated call time
    let callTimeText = '';
    if (recalledPatientETA.estimatedCallTime) {
      const callTime = new Date(recalledPatientETA.estimatedCallTime);
      const hours = callTime.getHours();
      const minutes = callTime.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      callTimeText = `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
    }

    notificationMessage += ` Estimated time: ${estimatedTimeText}${callTimeText ? ` (${callTimeText})` : ''}.`;
  }

  // Get patient data for email notification
  const Patient = require('../../models/Patient');
  const patient = await Patient.findById(appointment.patientId).select('email firstName lastName');

  // Create notification for patient (with email)
  try {
    const { createNotification } = require('../../services/notificationService');
    await createNotification({
      userId: appointment.patientId,
      userType: 'patient',
      type: 'appointment',
      title: 'Appointment Recalled',
      message: notificationMessage,
      data: {
        sessionId: appointment.sessionId?.toString() || null,
        appointmentId: appointment._id.toString(),
        tokenNumber: appointment.tokenNumber,
        estimatedWaitMinutes: recalledPatientETA?.estimatedWaitMinutes || 0,
        estimatedCallTime: recalledPatientETA?.estimatedCallTime || null,
        patientsAhead: recalledPatientETA?.patientsAhead || 0,
        recallCount: appointment.recallCount,
      },
      priority: 'high',
      actionUrl: '/patient/appointments',
      icon: 'queue',
      sendEmail: true,
      user: patient,
    }).catch((error) => console.error('Error creating recall notification:', error));
  } catch (error) {
    console.error('Error creating notifications:', error);
  }

  // Emit real-time events
  try {
    const io = getIO();
    // IMPORTANT: Always include recallCount in the socket event so frontend can update button visibility
    io.to(`doctor-${id}`).emit('queue:updated', {
      appointmentId: appointment._id,
      status: 'waiting',
      queueStatus: 'waiting',
      recallCount: appointment.recallCount, // Include recallCount so frontend can update button visibility
    });
    // Emit recall event - patient should enter consultation room
    io.to(`patient-${appointment.patientId}`).emit('token:recalled', {
      appointmentId: appointment._id,
      tokenNumber: appointment.tokenNumber,
      recallCount: appointment.recallCount,
      estimatedWaitMinutes: recalledPatientETA?.estimatedWaitMinutes || 0,
      estimatedCallTime: recalledPatientETA?.estimatedCallTime || null,
      // This triggers consultation room entry
      enterConsultationRoom: true,
    });
    
    // Also emit token:called event to ensure consultation room is set
    io.to(`patient-${appointment.patientId}`).emit('token:called', {
      appointmentId: appointment._id,
      tokenNumber: appointment.tokenNumber,
      recalled: true,
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Patient recalled to waiting queue',
    data: {
      appointment: appointment,
      recallCount: appointment.recallCount,
      canRecallAgain: appointment.recallCount < 2,
    },
  });
});

// PATCH /api/doctors/queue/:appointmentId/no-show - Mark patient as no-show (cancels appointment)
exports.markNoShow = asyncHandler(async (req, res) => {
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

  // Check if appointment is already completed or cancelled
  if (appointment.status === 'completed' || appointment.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Cannot mark no-show for completed or cancelled appointment',
    });
  }

  // Use the same cancellation logic as individual appointment cancellation
  // Import the appointment controller's cancellation logic
  const Patient = require('../../models/Patient');
  const Doctor = require('../../models/Doctor');
  const Session = require('../../models/Session');
  const { sendAppointmentCancellationEmail, createAppointmentNotification } = require('../../services/notificationService');

  // Mark as cancelled with no-show reason
  appointment.status = 'cancelled';
  appointment.queueStatus = 'no-show';
  appointment.cancelledAt = new Date();
  appointment.cancellationReason = 'Patient did not show up for appointment';
  appointment.cancelledBy = 'doctor';

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
        status: { $in: ['scheduled', 'confirmed', 'waiting', 'called', 'in-consultation', 'in_progress'] },
        paymentStatus: { $ne: 'pending' },
      });
      session.currentToken = Math.max(0, actualBookedCount - 1);
      await session.save();

      // Recalculate ETAs for remaining patients
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

        // Emit session update to doctor
        io.to(`doctor-${id}`).emit('session:updated', {
          session: await Session.findById(session._id),
        });
      } catch (error) {
        console.error('Error recalculating ETAs:', error);
      }

      // Check if this was the last pending patient - if yes, end the session
      const pendingAppointments = await Appointment.countDocuments({
        sessionId: appointment.sessionId,
        status: { $in: ['scheduled', 'confirmed', 'waiting', 'called', 'in-consultation', 'in_progress'] },
      });
      
      // If no pending appointments left, end the session
      if (pendingAppointments === 0 && session.status !== 'completed' && session.status !== 'cancelled') {
        session.status = SESSION_STATUS.COMPLETED;
        session.endedAt = new Date();
        await session.save();

        // Notify doctor - REMOVED: Doctors don't need session completed notifications
        // Only patients receive these notifications
        // try {
        //   const { createNotification } = require('../../services/notificationService');
        //   await createNotification({
        //     userId: id,
        //     userType: 'doctor',
        //     type: 'session',
        //     title: 'Session Completed',
        //     message: 'All patients have been seen. Session has been completed.',
        //     data: {
        //       sessionId: session._id.toString(),
        //       eventType: 'completed',
        //       status: SESSION_STATUS.COMPLETED,
        //     },
        //     priority: 'medium',
        //     actionUrl: '/doctor/patients',
        //     icon: 'session',
        //   }).catch((error) => console.error('Error creating completion notification:', error));
        // } catch (error) {
        //   console.error('Error creating notifications:', error);
        // }
      }
    }
  }

  await appointment.save();

  // Get patient and doctor data for notifications
  const patient = await Patient.findById(appointment.patientId);
  const doctor = await Doctor.findById(id);

  // Emit real-time event to patient
  try {
    const io = getIO();
    io.to(`patient-${appointment.patientId}`).emit('appointment:cancelled', {
      appointmentId: appointment._id,
      reason: appointment.cancellationReason,
      cancelledBy: 'doctor',
      canReschedule: true,
    });
    io.to(`doctor-${id}`).emit('appointment:cancelled', {
      appointmentId: appointment._id,
    });
    io.to(`doctor-${id}`).emit('queue:updated', {
      appointmentId: appointment._id,
      status: 'cancelled',
      queueStatus: 'no-show',
      removed: false, // Don't remove, just update status
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  // Send email notification to patient
  try {
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName specialization');
    
    await sendAppointmentCancellationEmail({
      patient,
      doctor,
      appointment: populatedAppointment,
      cancelledBy: 'doctor',
      reason: 'Patient did not show up for appointment. You can reschedule for another date.',
    }).catch((error) => console.error('Error sending appointment cancellation email:', error));
  } catch (error) {
    console.error('Error sending email notifications:', error);
  }

  // Create in-app notifications
  try {
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'firstName lastName')
      .populate('doctorId', 'firstName lastName specialization profileImage');

    // Get patient data for email notification
    const patient = await Patient.findById(appointment.patientId).select('email firstName lastName');

    // Notify patient about cancellation with reschedule option (with email)
    await createAppointmentNotification({
      userId: appointment.patientId,
      userType: 'patient',
      appointment: populatedAppointment,
      eventType: 'cancelled',
      doctor,
      patient,
      sendEmail: true,
    }).catch((error) => console.error('Error creating patient cancellation notification:', error));

    // Also create a custom notification with reschedule message (with email)
    const { createNotification } = require('../../services/notificationService');
    await createNotification({
      userId: appointment.patientId,
      userType: 'patient',
      type: 'appointment',
      title: 'Appointment Cancelled - No Show',
      message: `Your appointment has been cancelled because you did not show up. You can reschedule for another date.`,
      data: {
        appointmentId: appointment._id.toString(),
        canReschedule: true,
        reason: 'Patient did not show up for appointment',
      },
      priority: 'high',
      actionUrl: '/patient/appointments',
      icon: 'appointment',
      sendEmail: true,
      user: patient,
    }).catch((error) => console.error('Error creating no-show notification:', error));
  } catch (error) {
    console.error('Error creating notifications:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Patient marked as no-show. Appointment has been cancelled. Patient has been notified and can reschedule.',
    data: {
      appointment: await Appointment.findById(appointment._id)
        .populate('patientId', 'firstName lastName phone profileImage')
        .populate('doctorId', 'firstName lastName specialization')
        .populate('sessionId', 'date sessionStartTime sessionEndTime'),
      canReschedule: true,
    },
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
  let consultation = null; // Initialize consultation variable
  
  if (status === 'completed') {
    appointment.status = 'completed';
    
    // Create or update consultation record
    const Consultation = require('../../models/Consultation');
    consultation = await Consultation.findOne({ appointmentId: appointment._id });
    
    if (!consultation) {
      // Create new consultation record if it doesn't exist
      consultation = await Consultation.create({
        appointmentId: appointment._id,
        patientId: appointment.patientId,
        doctorId: id,
        consultationDate: new Date(),
        status: 'completed',
        // Consultation data will be empty initially, can be updated later if needed
      });
      
      // Link consultation to appointment
      appointment.consultationId = consultation._id;
    } else {
      // Update existing consultation status to completed
      consultation.status = 'completed';
      await consultation.save();
    }
  } else if (status === 'no-show') {
    appointment.status = 'cancelled';
  }
  await appointment.save();

  // Handle completion: send notification, remove from queue, update session
  if (status === 'completed') {
    // Remove appointment from session's appointments array
    if (appointment.sessionId) {
      const session = await Session.findById(appointment.sessionId);
      if (session) {
        session.appointments = session.appointments.filter(
          apptId => apptId.toString() !== appointment._id.toString()
        );
        await session.save();
      }
    }

    // Send notification to patient
    try {
      const { createNotification, createAppointmentNotification } = require('../../services/notificationService');
      const Doctor = require('../../models/Doctor');
      const doctor = await Doctor.findById(id);

      // Send completion notification
      // Get patient data for email notification
      const Patient = require('../../models/Patient');
      const patient = await Patient.findById(appointment.patientId).select('email firstName lastName');

      await createNotification({
        userId: appointment.patientId,
        userType: 'patient',
        type: 'appointment',
        title: 'Consultation Completed',
        message: `Your consultation with Dr. ${doctor.firstName} ${doctor.lastName} has been completed.`,
        data: {
          appointmentId: appointment._id.toString(),
          consultationId: consultation?._id?.toString() || null,
          eventType: 'completed',
        },
        priority: 'medium',
        actionUrl: '/patient/appointments',
        icon: 'consultation',
        sendEmail: true,
        user: patient,
      }).catch((error) => console.error('Error creating completion notification:', error));

      // Also create appointment notification (with email)
      await createAppointmentNotification({
        userId: appointment.patientId,
        userType: 'patient',
        appointment,
        eventType: 'completed',
        doctor,
        patient,
        sendEmail: true,
      }).catch((error) => console.error('Error creating appointment completion notification:', error));
    } catch (error) {
      console.error('Error creating notifications:', error);
    }

    // Emit real-time events
    try {
      const io = getIO();
      io.to(`patient-${appointment.patientId}`).emit('consultation:completed', {
        appointmentId: appointment._id,
        consultationId: consultation?._id || null,
      });
      io.to(`doctor-${id}`).emit('consultation:completed', {
        appointmentId: appointment._id,
        consultationId: consultation?._id || null,
      });
      io.to(`doctor-${id}`).emit('queue:updated', {
        appointmentId: appointment._id,
        removed: true,
        consultationCreated: true,
      });
    } catch (error) {
      console.error('Socket.IO error:', error);
    }
  }

  // Update session current token if completed or no-show
  if ((status === 'completed' || status === 'no-show') && appointment.sessionId) {
    const session = await Session.findById(appointment.sessionId);
    if (session) {
      // Update current token
      if (session.currentToken < appointment.tokenNumber) {
        session.currentToken = appointment.tokenNumber;
      }
      
      // Check if this was the last pending patient - if yes, end the session
      const pendingAppointments = await Appointment.countDocuments({
        sessionId: appointment.sessionId,
        status: { $in: ['scheduled', 'confirmed', 'waiting', 'called', 'in-consultation', 'in_progress'] },
      });
      
      // If no pending appointments left, end the session
      if (pendingAppointments === 0 && session.status !== 'completed' && session.status !== 'cancelled') {
        session.status = SESSION_STATUS.COMPLETED;
        session.endedAt = new Date();
        
        // Notify doctor - REMOVED: Doctors don't need session completed notifications
        // Only patients receive these notifications
        // try {
        //   const { createNotification } = require('../../services/notificationService');
        //   await createNotification({
        //     userId: id,
        //     userType: 'doctor',
        //     type: 'session',
        //     title: 'Session Completed',
        //     message: 'All patients have been seen. Session has been completed.',
        //     data: {
        //       sessionId: session._id.toString(),
        //       eventType: 'completed',
        //       status: SESSION_STATUS.COMPLETED,
        //     },
        //     priority: 'medium',
        //     actionUrl: '/doctor/patients',
        //     icon: 'session',
        //   }).catch((error) => console.error('Error creating completion notification:', error));
        // } catch (error) {
        //   console.error('Error creating notifications:', error);
        // }
      }
      
      await session.save();

      // Recalculate and emit ETA updates for all waiting patients (if any remain)
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
      
      // Emit session update to doctor
      io.to(`doctor-${id}`).emit('session:updated', {
        session: await Session.findById(session._id),
      });
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
  const { sessionId, appointmentId } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: 'Session ID is required',
    });
  }

  try {
    const result = await callNextPatient(sessionId, appointmentId);

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

    // Get doctor info for notifications
    const Doctor = require('../../models/Doctor');
    const doctor = await Doctor.findById(id).select('firstName lastName averageConsultationMinutes');

    // Emit to doctor
    io.to(`doctor-${id}`).emit('queue:next:called', {
      appointment: result.appointment,
      session: result.session,
    });

    // Emit to called patient - notify them to enter consultation room
    io.to(`patient-${result.appointment.patientId}`).emit('token:called', {
      appointmentId: result.appointment._id,
      tokenNumber: result.appointment.tokenNumber,
    });

    // Get patient data for email notification
    const Patient = require('../../models/Patient');
    const calledPatient = await Patient.findById(result.appointment.patientId).select('email firstName lastName');

    // Create notification for called patient (with email)
    try {
      const { createAppointmentNotification } = require('../../services/notificationService');
      await createAppointmentNotification({
        userId: result.appointment.patientId,
        userType: 'patient',
        appointment: result.appointment,
        eventType: 'token_called',
        doctor,
        patient: calledPatient,
        sendEmail: true,
      }).catch((error) => console.error('Error creating call notification:', error));
    } catch (error) {
      console.error('Error creating notifications:', error);
    }

    // Find the next patient in queue (after the one just called)
    const nextAppointment = await Appointment.findOne({
      sessionId,
      tokenNumber: { $gt: result.appointment.tokenNumber },
      status: { $in: ['scheduled', 'confirmed', 'waiting'] },
    }).sort({ tokenNumber: 1 });

    // If there's a next patient, send them a notification with their queue number and estimated time
    if (nextAppointment) {
      const nextPatientETA = etas.find(eta => 
        eta.appointmentId.toString() === nextAppointment._id.toString()
      );

      if (nextPatientETA) {
        // Format estimated time
        let estimatedTimeText = '';
        if (nextPatientETA.estimatedWaitMinutes === 0) {
          estimatedTimeText = 'Now';
        } else if (nextPatientETA.estimatedWaitMinutes < 60) {
          estimatedTimeText = `in ${nextPatientETA.estimatedWaitMinutes} ${nextPatientETA.estimatedWaitMinutes === 1 ? 'minute' : 'minutes'}`;
        } else {
          const hours = Math.floor(nextPatientETA.estimatedWaitMinutes / 60);
          const minutes = nextPatientETA.estimatedWaitMinutes % 60;
          const hoursText = hours === 1 ? 'hour' : 'hours';
          const minutesText = minutes > 0 ? `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}` : '';
          estimatedTimeText = `in ${hours} ${hoursText}${minutesText ? ` ${minutesText}` : ''}`;
        }

        // Format estimated call time
        let callTimeText = '';
        if (nextPatientETA.estimatedCallTime) {
          const callTime = new Date(nextPatientETA.estimatedCallTime);
          const hours = callTime.getHours();
          const minutes = callTime.getMinutes();
          const period = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours % 12 || 12;
          callTimeText = `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
        }

        // Get patient data for email notification
        const Patient = require('../../models/Patient');
        const nextPatient = await Patient.findById(nextAppointment.patientId).select('email firstName lastName');

        // Create notification for next patient (with email)
        try {
          const { createNotification } = require('../../services/notificationService');
          await createNotification({
            userId: nextAppointment.patientId,
            userType: 'patient',
            type: 'appointment',
            title: 'Your Number is Coming',
            message: `Your number is ${nextAppointment.tokenNumber}. Estimated time: ${estimatedTimeText}${callTimeText ? ` (${callTimeText})` : ''}`,
            data: {
              appointmentId: nextAppointment._id.toString(),
              tokenNumber: nextAppointment.tokenNumber,
              estimatedWaitMinutes: nextPatientETA.estimatedWaitMinutes,
              estimatedCallTime: nextPatientETA.estimatedCallTime,
              patientsAhead: nextPatientETA.patientsAhead,
              eventType: 'queue_next',
            },
            priority: 'high',
            actionUrl: '/patient/appointments',
            icon: 'appointment',
            sendEmail: true,
            user: nextPatient,
          }).catch((error) => console.error('Error creating next patient notification:', error));

          // Also emit socket event
          io.to(`patient-${nextAppointment.patientId}`).emit('queue:next:notification', {
            appointmentId: nextAppointment._id,
            tokenNumber: nextAppointment.tokenNumber,
            estimatedWaitMinutes: nextPatientETA.estimatedWaitMinutes,
            estimatedCallTime: nextPatientETA.estimatedCallTime,
            patientsAhead: nextPatientETA.patientsAhead,
            message: `Your number is ${nextAppointment.tokenNumber}. Estimated time: ${estimatedTimeText}${callTimeText ? ` (${callTimeText})` : ''}`,
          });
        } catch (error) {
          console.error('Error creating next patient notification:', error);
        }
      }
    }

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
      message: 'Patient called successfully',
      data: {
        appointment: result.appointment,
        session: result.session,
        etas,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to call patient',
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

