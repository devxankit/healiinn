const mongoose = require('mongoose');
const Clinic = require('../models/Clinic');
const ClinicSession = require('../models/ClinicSession');
const SessionToken = require('../models/SessionToken');
const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Payment = require('../models/Payment');
const { redis } = require('../config/redis');
const {
  SESSION_STATUS,
  TOKEN_STATUS,
  CONSULTATION_STATUS,
  ROLES,
  TOKEN_EVENTS,
  COMMISSION_RATE,
  getCommissionRateByRole,
} = require('../utils/constants');
const {
  notifyAppointmentConfirmed,
  notifyTokenCalled,
  notifyTokenRecalled,
  notifyTokenSkipped,
  notifyTokenCompleted,
  notifyTokenNoShow,
} = require('./notificationEvents');
const { createWalletTransaction } = require('./walletService');

const SESSION_ROOM_PREFIX = 'session:';
const redisSessionStateKey = (sessionId) => `${SESSION_ROOM_PREFIX}${sessionId}:state`;

const MAX_RECALLS = Number(process.env.TOKEN_QUEUE_MAX_RECALLS) || 2;

const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const slugify = (value = '') =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const toDate = (value) => {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

const formatDoctorName = (doctor) => {
  if (!doctor) {
    return 'Doctor';
  }
  const { firstName, lastName } = doctor;
  return [firstName, lastName].filter(Boolean).join(' ') || doctor.name || 'Doctor';
};

const formatPatientName = (patient) => {
  if (!patient) {
    return 'Patient';
  }
  const { firstName, lastName } = patient;
  return [firstName, lastName].filter(Boolean).join(' ') || patient.name || 'Patient';
};

const calculateTokenCapacity = ({ startTime, endTime, averageConsultationMinutes, bufferMinutes = 0 }) => {
  if (!startTime || !endTime) {
    return 0;
  }
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMinutes = Math.max(Math.floor(durationMs / 60000) - bufferMinutes, 0);
  if (!averageConsultationMinutes) {
    return 0;
  }
  return Math.max(Math.floor(durationMinutes / averageConsultationMinutes), 0);
};

const ensureClinicOwnership = async ({ doctorId, clinicId }) => {
  const clinic = await Clinic.findOne({ _id: clinicId, doctor: doctorId, isActive: true });
  if (!clinic) {
    throw createError(404, 'Clinic not found for the doctor');
  }
  return clinic;
};

const emitSessionEvent = (io, sessionId, event, payload = {}) => {
  if (!io) {
    return;
  }
  io.to(`${SESSION_ROOM_PREFIX}${sessionId}`).emit(event, payload);
};

const cacheSessionState = async (sessionId, state) => {
  if (!redis || !redis.set) {
    return;
  }

  try {
    await redis.set(redisSessionStateKey(sessionId), JSON.stringify(state), 'EX', 60 * 30);
  } catch (error) {
    console.error('Failed to cache session state', error);
  }
};

const loadCachedSessionState = async (sessionId) => {
  if (!redis || !redis.get) {
    return null;
  }
  try {
    const cached = await redis.get(redisSessionStateKey(sessionId));
    if (!cached) {
      return null;
    }
    return JSON.parse(cached);
  } catch (error) {
    console.error('Failed to load session state from cache', error);
    return null;
  }
};

const calculateActualAverageMinutes = async (sessionId, sessionStartTime) => {
  // Get completed consultations from current session
  const completedConsultations = await Consultation.find({
    session: sessionId,
    status: CONSULTATION_STATUS.COMPLETED,
    startedAt: { $exists: true, $gte: sessionStartTime },
    completedAt: { $exists: true },
  })
    .sort({ completedAt: -1 })
    .limit(5) // Last 5 completed consultations
    .lean();

  // Need at least 2 consultations for reliable average
  if (completedConsultations.length < 2) {
    return null;
  }

  // Calculate actual durations
  const durations = completedConsultations.map(consultation => {
    const durationMs = new Date(consultation.completedAt).getTime() - 
                       new Date(consultation.startedAt).getTime();
    return durationMs / (1000 * 60); // Convert to minutes
  });

  // Calculate average
  const actualAverage = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  
  // Clamp between 5 and 60 minutes for safety
  return Math.max(5, Math.min(60, Math.round(actualAverage * 10) / 10)); // Round to 1 decimal
};

const recalculateSessionState = async ({ sessionId, io }) => {
  const session = await ClinicSession.findById(sessionId);
  if (!session) {
    throw createError(404, 'Session not found');
  }

  const tokens = await SessionToken.find({
    session: sessionId,
  })
    .sort({ tokenNumber: 1 })
    .lean();

  const activeTokens = tokens.filter(
    (token) =>
      ![
        TOKEN_STATUS.COMPLETED,
        TOKEN_STATUS.CANCELLED,
        TOKEN_STATUS.NO_SHOW,
      ].includes(token.status)
  );

  const inProgressToken = activeTokens.find((token) =>
    [TOKEN_STATUS.CALLED, TOKEN_STATUS.RECALLED, TOKEN_STATUS.VISITED].includes(token.status)
  );

  let currentTokenNumber = inProgressToken
    ? inProgressToken.tokenNumber
    : activeTokens.length
    ? activeTokens[0].tokenNumber
    : session.nextTokenNumber;

  if (!Number.isFinite(currentTokenNumber)) {
    currentTokenNumber = null;
  }

  // Doctor must have set averageConsultationMinutes - no default fallback
  if (!session.averageConsultationMinutes) {
    throw createError(400, 'Session averageConsultationMinutes is not set. Doctor must set the average consultation time before calculating ETA.');
  }

  const sessionStartTime = new Date(session.startTime);
  
  // Try to get actual average from completed consultations
  // This adjusts ETA based on real consultation times
  const actualAvgMinutes = await calculateActualAverageMinutes(sessionId, sessionStartTime);
  
  // Use actual average if available (at least 2 consultations completed)
  // Otherwise fallback to doctor-set average
  const avgMinutes = actualAvgMinutes || session.averageConsultationMinutes;
  
  const baseTimestamp = Math.max(Date.now(), sessionStartTime.getTime());

  const bulkTokenUpdates = [];
  const appointmentUpdates = [];
  const queueTokens = [];

  const computeEta = (token) => {
    const currentBase = currentTokenNumber || session.currentTokenNumber || 1;
    const position = Math.max(0, token.tokenNumber - currentBase);
    const priorityOffsetMinutes = (token.priority || 0) * avgMinutes;
    const dynamicBuffer = token.dynamicBufferMinutes || 0;
    const offsetMinutes = Math.max(0, position * avgMinutes - priorityOffsetMinutes + dynamicBuffer);
    return new Date(baseTimestamp + offsetMinutes * 60000);
  };

  activeTokens.forEach((token) => {
    const eta =
      token.status === TOKEN_STATUS.CALLED ||
      token.status === TOKEN_STATUS.RECALLED ||
      token.status === TOKEN_STATUS.VISITED
        ? token.eta || new Date()
        : computeEta(token);

    if (!token.eta || new Date(token.eta).getTime() !== eta.getTime()) {
      bulkTokenUpdates.push({
        updateOne: {
          filter: { _id: token._id },
          update: { $set: { eta } },
        },
      });
      if (token.appointment) {
        appointmentUpdates.push({
          updateOne: {
            filter: { _id: token.appointment },
            update: { $set: { eta } },
          },
        });
      }
      token.eta = eta;
    }

    queueTokens.push({
      tokenId: token._id.toString(),
      tokenNumber: token.tokenNumber,
      status: token.status,
      eta: token.eta ? new Date(token.eta).toISOString() : null,
      patientId: token.patient?.toString(),
      appointmentId: token.appointment?.toString(),
      recallCount: token.recallCount || 0,
    });
  });

  if (bulkTokenUpdates.length) {
    await SessionToken.bulkWrite(bulkTokenUpdates);
  }

  if (appointmentUpdates.length) {
    await Appointment.bulkWrite(appointmentUpdates);
  }

  session.currentTokenNumber = currentTokenNumber;
  session.lastBroadcastAt = new Date();
  await session.save();

  const state = {
    sessionId: session._id.toString(),
    status: session.status,
    currentTokenNumber,
    averageConsultationMinutes: avgMinutes,
    doctorSetAverageMinutes: session.averageConsultationMinutes,
    actualAverageMinutes: actualAvgMinutes || null, // null if not enough data
    isUsingActualAverage: actualAvgMinutes !== null, // true if using actual average
    startTime: session.startTime,
    endTime: session.endTime,
    nextTokenNumber: session.nextTokenNumber,
    tokens: queueTokens,
    updatedAt: new Date().toISOString(),
  };

  await cacheSessionState(session._id, state);
  emitSessionEvent(io, sessionId, 'session:update', state);
  emitSessionEvent(io, sessionId, TOKEN_EVENTS.ETA, {
    sessionId: state.sessionId,
    tokens: state.tokens,
    updatedAt: state.updatedAt,
  });

  return state;
};

const createClinic = async ({ doctorId, payload }) => {
  const clinicPayload = {
    ...payload,
    doctor: doctorId,
  };

  if (clinicPayload.name && !clinicPayload.slug) {
    clinicPayload.slug = slugify(clinicPayload.name);
  }

  return Clinic.create(clinicPayload);
};

const listClinics = ({ doctorId }) =>
  Clinic.find({ doctor: doctorId, isActive: true }).sort({ createdAt: -1 });

const createSession = async ({ doctorId, clinicId, payload }) => {
  const clinic = await ensureClinicOwnership({ doctorId, clinicId });

  const startTime = toDate(payload.startTime);
  const endTime = toDate(payload.endTime);

  if (!startTime || !endTime) {
    throw createError(400, 'Invalid session start or end time');
  }

  if (endTime <= startTime) {
    throw createError(400, 'Session end time must be after start time');
  }

  // Doctor must provide averageConsultationMinutes
  const averageConsultationMinutes = payload.averageConsultationMinutes;
  
  if (!averageConsultationMinutes || Number.isNaN(Number(averageConsultationMinutes))) {
    throw createError(400, 'averageConsultationMinutes is required and must be a valid number');
  }

  const validatedMinutes = Math.max(5, Math.min(60, Math.round(Number(averageConsultationMinutes))));
  
  if (validatedMinutes < 5 || validatedMinutes > 60) {
    throw createError(400, 'averageConsultationMinutes must be between 5 and 60 minutes');
  }

  const maxTokens =
    payload.maxTokens ||
    calculateTokenCapacity({
      startTime,
      endTime,
      averageConsultationMinutes: validatedMinutes,
      bufferMinutes: payload.bufferMinutes || clinic.bufferMinutes || 0,
    });

  const session = await ClinicSession.create({
    doctor: doctorId,
    clinic: clinic._id,
    startTime,
    endTime,
    averageConsultationMinutes: validatedMinutes,
    bufferMinutes: payload.bufferMinutes || clinic.bufferMinutes || 0,
    maxTokens,
    status: SESSION_STATUS.SCHEDULED,
    notes: payload.notes,
    stats: {
      totalTokens: maxTokens,
      issuedTokens: 0,
      completedTokens: 0,
      skippedTokens: 0,
      noShowTokens: 0,
    },
  });

  return session;
};

const updateSessionStatus = async ({ sessionId, doctorId, status }) => {
  const session = await ClinicSession.findOne({ _id: sessionId, doctor: doctorId });

  if (!session) {
    throw createError(404, 'Session not found');
  }

  // If starting session, ensure averageConsultationMinutes is set
  if (status === SESSION_STATUS.LIVE) {
    if (!session.averageConsultationMinutes) {
      throw createError(400, 'averageConsultationMinutes must be set before starting the session. Please update the session average time first.');
    }
  }

  session.status = status;
  if (!session.currentTokenNumber) {
    session.currentTokenNumber = 1;
  }
  await session.save();

  return session;
};

const endSession = async ({ sessionId, doctorId }) =>
  updateSessionStatus({ sessionId, doctorId, status: SESSION_STATUS.COMPLETED });

const cancelSession = async ({ sessionId, doctorId }) => {
  const session = await updateSessionStatus({
    sessionId,
    doctorId,
    status: SESSION_STATUS.CANCELLED,
  });

  await SessionToken.updateMany(
    { session: sessionId, status: { $nin: [TOKEN_STATUS.COMPLETED, TOKEN_STATUS.CANCELLED] } },
    { $set: { status: TOKEN_STATUS.CANCELLED, cancelledAt: new Date() } }
  );

  return session;
};

const ensureConsultationRecord = async ({ token, session, doctorId, patientId, appointmentId }) => {
  let consultation = await Consultation.findOne({ token: token._id });
  if (consultation) {
    return consultation;
  }

  consultation = await Consultation.create({
    session: session._id,
    token: token._id,
    doctor: doctorId,
    patient: patientId,
    appointment: appointmentId,
    status: CONSULTATION_STATUS.IN_PROGRESS,
    startedAt: new Date(),
  });

  return consultation;
};

const validatePayment = async ({ paymentId, patientId, sessionId, doctorId }) => {
  // Payment ID is mandatory
  if (!paymentId) {
    throw createError(400, 'Payment ID is required. Please complete payment before booking appointment.');
  }

  // Find payment record
  const payment = await Payment.findOne({
    paymentId,
    role: ROLES.PATIENT,
    type: 'appointment',
  });

  if (!payment) {
    throw createError(404, 'Payment not found. Please complete payment before booking appointment.');
  }

  // Verify payment status is success
  if (payment.status !== 'success') {
    throw createError(400, `Payment is not successful. Payment status: ${payment.status}. Please complete payment before booking appointment.`);
  }

  // Verify payment belongs to the patient
  if (payment.user.toString() !== patientId.toString()) {
    throw createError(403, 'Payment does not belong to this patient. Please use your own payment.');
  }

  // Verify payment metadata matches session and doctor
  const metadata = payment.metadata || {};
  const paymentSessionId = metadata.sessionId;
  const paymentDoctorId = metadata.doctorId;

  if (paymentSessionId && paymentSessionId.toString() !== sessionId.toString()) {
    throw createError(400, 'Payment is for a different session. Please create payment for this session.');
  }

  if (paymentDoctorId && paymentDoctorId.toString() !== doctorId.toString()) {
    throw createError(400, 'Payment is for a different doctor. Please create payment for this doctor.');
  }

  // Get doctor to verify consultation fee
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw createError(404, 'Doctor not found');
  }

  const consultationFee = doctor.consultationFee || 0;
  const paymentAmount = Number(payment.amount) || 0;

  // Verify payment amount matches consultation fee (allow small tolerance for rounding)
  if (consultationFee > 0 && Math.abs(paymentAmount - consultationFee) > 0.01) {
    throw createError(400, `Payment amount (₹${paymentAmount}) does not match consultation fee (₹${consultationFee}). Please pay the correct amount.`);
  }

  return payment;
};

const issueToken = async ({
  sessionId,
  patientId,
  notes,
  reason,
  createdByRole,
  priority = 0,
  priorityReason,
  dynamicBufferMinutes = 0,
  paymentId,
  metadata,
  io,
}) => {
  const dbSession = await mongoose.startSession();

  let result;
  let validatedPayment = null;

  await dbSession.withTransaction(async () => {
    const session = await ClinicSession.findById(sessionId).session(dbSession);

    if (!session) {
      throw createError(404, 'Session not found');
    }

    if ([SESSION_STATUS.CANCELLED, SESSION_STATUS.COMPLETED].includes(session.status)) {
      throw createError(400, 'Session is not available for new tokens');
    }

    // Ensure averageConsultationMinutes is set before issuing tokens
    if (!session.averageConsultationMinutes) {
      throw createError(400, 'Session averageConsultationMinutes must be set before issuing tokens. Please update the session average time first.');
    }

    if (
      session.maxTokens &&
      session.stats &&
      session.stats.issuedTokens >= session.maxTokens
    ) {
      throw createError(400, 'Session is fully booked');
    }

    const existingToken = await SessionToken.findOne({
      session: sessionId,
      patient: patientId,
    }).session(dbSession);

    if (existingToken) {
      throw createError(400, 'Patient already has a token for this session');
    }

    // Validate payment - MANDATORY before token issue
    validatedPayment = await validatePayment({
      paymentId,
      patientId,
      sessionId: session._id.toString(),
      doctorId: session.doctor.toString(),
    });

    const tokenNumber = session.nextTokenNumber;

    const token = await SessionToken.create(
      [
        {
          session: session._id,
          doctor: session.doctor,
          clinic: session.clinic,
          patient: patientId,
          tokenNumber,
          status: TOKEN_STATUS.WAITING,
           priority,
           priorityReason,
           dynamicBufferMinutes,
           paymentId,
           metadata,
          notes,
          history: [
            {
              status: TOKEN_STATUS.WAITING,
              notes,
              actor: patientId,
              actorRole: createdByRole || ROLES.PATIENT,
            },
          ],
        },
      ],
      { session: dbSession }
    );

    // Calculate billing details from validated payment
    // Use doctor commission rate for appointments
    const grossAmount = Number(validatedPayment.amount) || 0;
    const commissionRate = validatedPayment.metadata?.commissionRate || getCommissionRateByRole(ROLES.DOCTOR);
    const commissionAmount = Number((grossAmount * commissionRate).toFixed(2));
    const netAmount = Number((grossAmount - commissionAmount).toFixed(2));

    const appointment = await Appointment.create(
      [
        {
          patient: patientId,
          patientId,
          doctor: session.doctor,
          doctorId: session.doctor,
          clinic: session.clinic,
          clinicId: session.clinic,
          session: session._id,
          sessionId: session._id,
          token: token[0]._id,
          tokenId: token[0]._id,
          tokenNumber,
          priority,
          scheduledFor: session.startTime,
          date: session.startTime,
          durationMinutes: session.averageConsultationMinutes,
          type: 'in_person',
          consultationType: 'in_person',
          status: 'scheduled',
          eta: session.startTime,
          reason,
          notes,
          billing: {
            amount: grossAmount,
            currency: validatedPayment.currency || 'INR',
            paid: true,
            paymentStatus: 'paid',
            paymentId: validatedPayment.paymentId,
            transactionId: validatedPayment.paymentId,
            razorpayPaymentId: validatedPayment.paymentId,
            razorpayOrderId: validatedPayment.orderId,
            paidAt: new Date(),
            commissionRate,
            commissionAmount,
            netAmount,
          },
        },
      ],
      { session: dbSession }
    );

    await SessionToken.updateOne(
      { _id: token[0]._id },
      { $set: { appointment: appointment[0]._id } }
    ).session(dbSession);

    session.nextTokenNumber += 1;
    session.stats = session.stats || {};
    session.stats.issuedTokens = (session.stats.issuedTokens || 0) + 1;
    if (!session.currentTokenNumber) {
      session.currentTokenNumber = tokenNumber;
    }
    session.markModified('stats');
    await session.save({ session: dbSession });

    result = { session, token: token[0], appointment: appointment[0], validatedPayment };
  });

  await dbSession.endSession();

  const session = await ClinicSession.findById(result.session._id)
    .populate('doctor', 'firstName lastName')
    .lean();

  // Create wallet transaction after successful token issue
  // This is outside transaction to avoid blocking if wallet service has issues
  try {
    if (result.validatedPayment && result.appointment) {
      await createWalletTransaction({
        providerId: session.doctor._id || session.doctor,
        providerRole: ROLES.DOCTOR,
        patientId,
        bookingId: result.appointment._id,
        bookingModel: 'Appointment',
        bookingType: 'appointment',
        paymentId: result.validatedPayment._id,
        grossAmount: Number(result.validatedPayment.amount) || 0,
        commissionRate: result.validatedPayment.metadata?.commissionRate || getCommissionRateByRole(ROLES.DOCTOR),
        currency: result.validatedPayment.currency || 'INR',
        description: `Appointment payment ${result.appointment._id.toString()}`,
      });
    }
  } catch (walletError) {
    // Log error but don't fail the token issue
    console.error('Failed to create wallet transaction after token issue:', walletError);
  }

  const patient = await Patient.findById(patientId).lean();

  await recalculateSessionState({ sessionId, io });

  emitSessionEvent(io, sessionId, TOKEN_EVENTS.ISSUED, {
    tokenId: result.token._id.toString(),
    tokenNumber: result.token.tokenNumber,
    patientId: patientId.toString(),
    priority,
  });

  await notifyAppointmentConfirmed({
    patientId,
    doctorId: session.doctor._id || session.doctor,
    doctorName: formatDoctorName(session.doctor),
    patientName: formatPatientName(patient),
    appointmentDate: result.appointment.eta || session.startTime,
    appointmentId: result.appointment._id,
  });

  return {
    token: await SessionToken.findById(result.token._id).lean(),
    appointment: await Appointment.findById(result.appointment._id).lean(),
  };
};

const updateTokenStatus = async ({ tokenId, doctorId, status, notes, io }) => {
  if (!Object.values(TOKEN_STATUS).includes(status)) {
    throw createError(400, 'Invalid token status');
  }

  const token = await SessionToken.findById(tokenId).populate('session');

  if (!token) {
    throw createError(404, 'Token not found');
  }

  if (token.session.doctor.toString() !== doctorId.toString()) {
    throw createError(403, 'Token does not belong to the doctor');
  }

  const session = await ClinicSession.findById(token.session._id);
  const doctor = await Doctor.findById(session.doctor);
  const doctorName = formatDoctorName(doctor);
  const now = new Date();

  session.stats = session.stats || {};
  const notifications = [];

  const updateAppointmentStatus = (appointmentStatus) => {
    if (!token.appointment || !appointmentStatus) {
      return Promise.resolve();
    }
    return Appointment.updateOne(
      { _id: token.appointment },
      { $set: { status: appointmentStatus } }
    );
  };

  const historyEntry = {
    status,
    notes,
    actor: doctorId,
    actorRole: ROLES.DOCTOR,
    timestamp: now,
  };

  switch (status) {
    case TOKEN_STATUS.CALLED:
      if (![TOKEN_STATUS.WAITING, TOKEN_STATUS.RECALLED, TOKEN_STATUS.SKIPPED].includes(token.status)) {
        throw createError(400, 'Token cannot be called in current state');
      }
      token.status = TOKEN_STATUS.CALLED;
      token.calledAt = now;
      session.currentTokenNumber = token.tokenNumber;
      await updateAppointmentStatus('confirmed');
      notifications.push('called');
      break;
    case TOKEN_STATUS.VISITED:
      if (![TOKEN_STATUS.CALLED, TOKEN_STATUS.RECALLED].includes(token.status)) {
        throw createError(400, 'Token cannot be marked visited yet');
      }
      token.status = TOKEN_STATUS.VISITED;
      token.visitedAt = now;
      session.currentTokenNumber = token.tokenNumber;
      await ensureConsultationRecord({
        token,
        session,
        doctorId,
        patientId: token.patient,
        appointmentId: token.appointment,
      });
      await updateAppointmentStatus('confirmed');
      break;
    case TOKEN_STATUS.COMPLETED:
      if (![TOKEN_STATUS.VISITED, TOKEN_STATUS.CALLED, TOKEN_STATUS.RECALLED].includes(token.status)) {
        throw createError(400, 'Token must be visited or called before marking completed');
      }
      token.status = TOKEN_STATUS.COMPLETED;
      token.completedAt = now;
      session.stats.completedTokens = (session.stats.completedTokens || 0) + 1;
      session.markModified('stats');
      await updateAppointmentStatus('completed');
      await Consultation.updateOne(
        { token: token._id },
        {
          $set: {
            status: CONSULTATION_STATUS.COMPLETED,
            completedAt: now,
          },
        }
      );
      notifications.push('completed');
      
      // Immediately recalculate ETA after completion
      // This ensures next tokens get updated ETA based on actual consultation time
      try {
        await recalculateSessionState({ sessionId: session._id, io });
      } catch (error) {
        console.error('Failed to recalculate ETA after token completion:', error);
        // Continue even if recalculation fails
      }
      break;
    case TOKEN_STATUS.SKIPPED:
      token.status = TOKEN_STATUS.SKIPPED;
      token.skippedAt = now;
      session.stats.skippedTokens = (session.stats.skippedTokens || 0) + 1;
      session.markModified('stats');
      notifications.push('skipped');
      break;
    case TOKEN_STATUS.RECALLED:
      if (token.recallCount >= MAX_RECALLS) {
        throw createError(400, 'Maximum recalls reached for this token');
      }
      token.status = TOKEN_STATUS.RECALLED;
      token.recallCount += 1;
      token.recalledAt = now;
      session.currentTokenNumber = token.tokenNumber;
      await updateAppointmentStatus('confirmed');
      notifications.push('recalled');
      break;
    case TOKEN_STATUS.NO_SHOW:
      token.status = TOKEN_STATUS.NO_SHOW;
      token.noShowAt = now;
      session.stats.noShowTokens = (session.stats.noShowTokens || 0) + 1;
      session.markModified('stats');
      await updateAppointmentStatus('no_show');
      notifications.push('no_show');
      break;
    case TOKEN_STATUS.CANCELLED:
      token.status = TOKEN_STATUS.CANCELLED;
      token.cancelledAt = now;
      await updateAppointmentStatus('cancelled');
      break;
    default:
      break;
  }

  token.notes = notes || token.notes;
  token.history.push(historyEntry);
  await token.save();
  await session.save();

  const state = await recalculateSessionState({ sessionId: session._id, io });

  const eventPayload = {
    tokenId: token._id.toString(),
    status: token.status,
    tokenNumber: token.tokenNumber,
    sessionId: session._id.toString(),
    eta: token.eta,
    priority: token.priority,
  };

  emitSessionEvent(io, session._id, 'token:update', eventPayload);

  switch (status) {
    case TOKEN_STATUS.CALLED:
      emitSessionEvent(io, session._id, TOKEN_EVENTS.CALLED, eventPayload);
      break;
    case TOKEN_STATUS.VISITED:
      emitSessionEvent(io, session._id, TOKEN_EVENTS.VISITED, eventPayload);
      break;
    case TOKEN_STATUS.RECALLED:
      emitSessionEvent(io, session._id, TOKEN_EVENTS.RECALLED, eventPayload);
      break;
    case TOKEN_STATUS.SKIPPED:
      emitSessionEvent(io, session._id, TOKEN_EVENTS.SKIPPED, eventPayload);
      break;
    case TOKEN_STATUS.COMPLETED:
      emitSessionEvent(io, session._id, TOKEN_EVENTS.COMPLETED, eventPayload);
      break;
    default:
      break;
  }

  const freshToken = await SessionToken.findById(token._id).lean();

  // Fire queued notifications with updated token data
  // eslint-disable-next-line no-restricted-syntax
  for (const notificationType of notifications) {
    // eslint-disable-next-line no-await-in-loop
    switch (notificationType) {
      case 'called':
        await notifyTokenCalled({
          patientId: freshToken.patient,
          doctorId: session.doctor,
          doctorName,
          tokenNumber: freshToken.tokenNumber,
          sessionId: session._id,
          eta: freshToken.eta,
        });
        break;
      case 'completed':
        await notifyTokenCompleted({
          patientId: freshToken.patient,
          doctorId: session.doctor,
          doctorName,
          tokenNumber: freshToken.tokenNumber,
          sessionId: session._id,
        });
        break;
      case 'skipped':
        await notifyTokenSkipped({
          doctorId: session.doctor,
          patientId: freshToken.patient,
          tokenNumber: freshToken.tokenNumber,
          sessionId: session._id,
        });
        break;
      case 'recalled':
        await notifyTokenRecalled({
          patientId: freshToken.patient,
          doctorId: session.doctor,
          doctorName,
          tokenNumber: freshToken.tokenNumber,
          sessionId: session._id,
          eta: freshToken.eta,
        });
        break;
      case 'no_show':
        await notifyTokenNoShow({
          doctorId: session.doctor,
          patientId: freshToken.patient,
          tokenNumber: freshToken.tokenNumber,
          sessionId: session._id,
        });
        break;
      default:
        break;
    }
  }

  return {
    token: freshToken,
    session: state,
  };
};

const getSessionDetails = async ({ sessionId }) => {
  const session = await ClinicSession.findById(sessionId)
    .populate('clinic')
    .lean();

  if (!session) {
    throw createError(404, 'Session not found');
  }

  const tokens = await SessionToken.find({ session: sessionId })
    .sort({ tokenNumber: 1 })
    .lean();

  return {
    session,
    tokens,
  };
};

const getSessionState = async ({ sessionId, io }) => {
  const cached = await loadCachedSessionState(sessionId);
  if (cached) {
    return cached;
  }
  return recalculateSessionState({ sessionId, io });
};

const listDoctorSessions = async ({ doctorId, status }) => {
  const query = { doctor: doctorId };
  if (status) {
    query.status = status;
  }
  return ClinicSession.find(query).sort({ startTime: -1 });
};

const listPatientTokens = async ({ patientId }) =>
  SessionToken.find({ patient: patientId })
    .populate('session')
    .sort({ createdAt: -1 });

const getTokenDetails = async ({ tokenId, actorId, role }) => {
  const token = await SessionToken.findById(tokenId)
    .populate('session')
    .populate('clinic')
    .populate('doctor', 'firstName lastName consultationFee')
    .lean();

  if (!token) {
    throw createError(404, 'Token not found');
  }

  if (role === ROLES.PATIENT && token.patient.toString() !== actorId.toString()) {
    throw createError(403, 'Token not accessible');
  }

  if (role === ROLES.DOCTOR && token.doctor.toString() !== actorId.toString()) {
    throw createError(403, 'Token not accessible');
  }

  return token;
};

const checkinToken = async ({ tokenId, patientId, io }) => {
  const token = await SessionToken.findById(tokenId);

  if (!token) {
    throw createError(404, 'Token not found');
  }

  if (patientId && token.patient.toString() !== patientId.toString()) {
    throw createError(403, 'Token does not belong to the patient');
  }

  token.checkinAt = new Date();
  await token.save();

  const state = await recalculateSessionState({ sessionId: token.session, io });

  emitSessionEvent(io, token.session, 'token:checkin', {
    tokenId: token._id.toString(),
    sessionId: token.session.toString(),
    checkinAt: token.checkinAt,
  });

  return {
    token: await SessionToken.findById(tokenId).lean(),
    session: state,
  };
};

const cancelToken = async ({ tokenId, actorId, actorRole, reason, io }) => {
  const token = await SessionToken.findById(tokenId);

  if (!token) {
    throw createError(404, 'Token not found');
  }

  if (
    actorRole === ROLES.PATIENT &&
    token.patient.toString() !== actorId.toString()
  ) {
    throw createError(403, 'Token does not belong to the patient');
  }

  token.status = TOKEN_STATUS.CANCELLED;
  token.cancelledAt = new Date();
  token.history.push({
    status: TOKEN_STATUS.CANCELLED,
    notes: reason,
    actor: actorId,
    actorRole,
    timestamp: new Date(),
  });

  await token.save();

  await Appointment.updateOne(
    { _id: token.appointment },
    {
      $set: {
        status: 'cancelled',
        notes: reason,
      },
    }
  );

  const state = await recalculateSessionState({ sessionId: token.session, io });

  emitSessionEvent(io, token.session, 'token:cancelled', {
    tokenId: token._id.toString(),
    sessionId: token.session.toString(),
  });

  return {
    token: await SessionToken.findById(tokenId).lean(),
    session: state,
  };
};

const pauseSession = async ({ sessionId, doctorId, reason, resumeAt, io }) => {
  const session = await ClinicSession.findOne({ _id: sessionId, doctor: doctorId });

  if (!session) {
    throw createError(404, 'Session not found');
  }

  session.paused = true;
  session.pausedAt = new Date();
  session.pauseReason = reason;
  session.resumeAt = resumeAt ? new Date(resumeAt) : undefined;

  await session.save();

  emitSessionEvent(io, sessionId, 'session:paused', {
    sessionId: sessionId.toString(),
    reason,
    resumeAt: session.resumeAt,
  });

  return session;
};

const resumeSession = async ({ sessionId, doctorId, io }) => {
  const session = await ClinicSession.findOne({ _id: sessionId, doctor: doctorId });

  if (!session) {
    throw createError(404, 'Session not found');
  }

  session.paused = false;
  session.resumeAt = undefined;
  session.pauseReason = undefined;
  session.pausedAt = undefined;

  await session.save();

  emitSessionEvent(io, sessionId, 'session:resumed', {
    sessionId: sessionId.toString(),
  });

  await recalculateSessionState({ sessionId, io });

  return session;
};

const updateSessionAverageTime = async ({ sessionId, doctorId, averageConsultationMinutes, io }) => {
  const session = await ClinicSession.findOne({ _id: sessionId, doctor: doctorId });

  if (!session) {
    throw createError(404, 'Session not found');
  }

  if (averageConsultationMinutes === undefined || averageConsultationMinutes === null) {
    throw createError(400, 'averageConsultationMinutes is required');
  }

  // Validate: minimum 5 minutes, maximum 60 minutes
  const validatedMinutes = Math.max(5, Math.min(60, Math.round(Number(averageConsultationMinutes))));
  
  if (Number.isNaN(validatedMinutes)) {
    throw createError(400, 'Invalid average consultation minutes value. Must be a number between 5 and 60.');
  }

  session.averageConsultationMinutes = validatedMinutes;
  await session.save();

  // If session is live or has tokens, immediately recalculate ETA
  if (session.status === SESSION_STATUS.LIVE || session.stats?.issuedTokens > 0) {
    try {
      await recalculateSessionState({ sessionId, io });
    } catch (error) {
      // If recalculation fails, still save the average time
      console.error('Failed to recalculate session state after average time update:', error);
    }
  }

  emitSessionEvent(io, sessionId, 'session:average-time-updated', {
    sessionId: sessionId.toString(),
    averageConsultationMinutes: validatedMinutes,
  });

  return session;
};

module.exports = {
  createClinic,
  listClinics,
  createSession,
  updateSessionStatus,
  endSession,
  cancelSession,
  issueToken,
  updateTokenStatus,
  recalculateSessionState,
  getSessionDetails,
  getSessionState,
  listDoctorSessions,
  listPatientTokens,
  getTokenDetails,
  checkinToken,
  cancelToken,
  pauseSession,
  resumeSession,
  updateSessionAverageTime,
};

