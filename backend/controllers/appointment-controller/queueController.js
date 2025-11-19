const asyncHandler = require('../../middleware/asyncHandler');
const { ROLES, SESSION_STATUS, TOKEN_STATUS } = require('../../utils/constants');
const queueService = require('../../services/appointmentQueueService');
const mongoose = require('mongoose');
const Appointment = require('../../models/Appointment');
const ClinicSession = require('../../models/ClinicSession');
const SessionToken = require('../../models/SessionToken');
const { getPaginationParams, getPaginationMeta } = require('../../utils/pagination');

const ensureRole = (role, allowed) => {
  if (!allowed.includes(role)) {
    const error = new Error('You do not have access to this resource');
    error.status = 403;
    throw error;
  }
};

exports.createClinic = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const clinic = await queueService.createClinic({
    doctorId: req.auth.id,
    payload: req.body,
  });

  res.status(201).json({
    success: true,
    clinic,
  });
});

exports.listClinics = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const clinics = await queueService.listClinics({ doctorId: req.auth.id });

  res.json({
    success: true,
    clinics,
  });
});

exports.createSession = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const session = await queueService.createSession({
    doctorId: req.auth.id,
    clinicId: req.body.clinicId,
    payload: req.body,
  });

  res.status(201).json({
    success: true,
    session,
  });
});

exports.startSession = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const session = await queueService.updateSessionStatus({
    sessionId: req.params.sessionId,
    doctorId: req.auth.id,
    status: SESSION_STATUS.LIVE,
  });

  const state = await queueService.getSessionState({
    sessionId: session._id,
    io: req.app.get('io'),
  });

  res.json({
    success: true,
    session,
    state,
  });
});

exports.endSession = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const session = await queueService.endSession({
    sessionId: req.params.sessionId,
    doctorId: req.auth.id,
  });

  res.json({
    success: true,
    session,
  });
});

exports.cancelSession = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const session = await queueService.cancelSession({
    sessionId: req.params.sessionId,
    doctorId: req.auth.id,
  });

  res.json({
    success: true,
    session,
  });
});

exports.getSessionDetails = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR, ROLES.ADMIN]);

  const details = await queueService.getSessionDetails({
    sessionId: req.params.sessionId,
  });

  res.json({
    success: true,
    ...details,
  });
});

exports.getSessionState = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR, ROLES.PATIENT, ROLES.ADMIN]);

  const state = await queueService.getSessionState({
    sessionId: req.params.sessionId,
    io: req.app.get('io'),
  });

  res.json({
    success: true,
    state,
  });
});

exports.listDoctorSessions = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const sessions = await queueService.listDoctorSessions({
    doctorId: req.auth.id,
    status: req.query.status,
  });

  res.json({
    success: true,
    sessions,
  });
});

exports.listPatientTokens = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const tokens = await queueService.listPatientTokens({
    patientId: req.auth.id,
  });

  res.json({
    success: true,
    tokens,
  });
});

exports.issueToken = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT, ROLES.ADMIN]);

  const patientId = req.auth.role === ROLES.PATIENT ? req.auth.id : req.body.patientId;

  if (!patientId) {
    const error = new Error('patientId is required');
    error.status = 400;
    throw error;
  }

  const result = await queueService.issueToken({
    sessionId: req.params.sessionId,
    patientId,
    notes: req.body.notes,
    reason: req.body.reason,
    createdByRole: req.auth.role,
    priority: Number(req.body.priority) || 0,
    priorityReason: req.body.priorityReason,
    dynamicBufferMinutes: Number(req.body.dynamicBufferMinutes) || 0,
    paymentId: req.body.paymentId,
    metadata: req.body.metadata,
    io: req.app.get('io'),
  });

  res.status(201).json({
    success: true,
    ...result,
  });
});

exports.checkinToken = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const result = await queueService.checkinToken({
    tokenId: req.params.tokenId,
    patientId: req.auth.id,
    io: req.app.get('io'),
  });

  res.json({
    success: true,
    ...result,
  });
});

exports.cancelToken = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT, ROLES.ADMIN]);

  const result = await queueService.cancelToken({
    tokenId: req.params.tokenId,
    actorId: req.auth.id,
    actorRole: req.auth.role,
    reason: req.body.reason,
    io: req.app.get('io'),
  });

  res.json({
    success: true,
    ...result,
  });
});

exports.pauseSession = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const session = await queueService.pauseSession({
    sessionId: req.params.sessionId,
    doctorId: req.auth.id,
    reason: req.body.reason,
    resumeAt: req.body.resumeAt,
    io: req.app.get('io'),
  });

  res.json({
    success: true,
    session,
  });
});

exports.resumeSession = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const session = await queueService.resumeSession({
    sessionId: req.params.sessionId,
    doctorId: req.auth.id,
    io: req.app.get('io'),
  });

  res.json({
    success: true,
    session,
  });
});

exports.updateTokenStatus = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const result = await queueService.updateTokenStatus({
    tokenId: req.params.tokenId,
    doctorId: req.auth.id,
    status: req.body.status,
    notes: req.body.notes,
    io: req.app.get('io'),
  });

  res.json({
    success: true,
    ...result,
  });
});

exports.getTokenDetails = asyncHandler(async (req, res) => {
  const token = await queueService.getTokenDetails({
    tokenId: req.params.tokenId,
    actorId: req.auth.id,
    role: req.auth.role,
  });

  res.json({
    success: true,
    token,
  });
});

exports.updateSessionAverageTime = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const { averageConsultationMinutes } = req.body;

  if (averageConsultationMinutes === undefined) {
    const error = new Error('averageConsultationMinutes is required');
    error.status = 400;
    throw error;
  }

  const session = await queueService.updateSessionAverageTime({
    sessionId: req.params.sessionId,
    doctorId: req.auth.id,
    averageConsultationMinutes,
    io: req.app.get('io'),
  });

  const state = await queueService.getSessionState({
    sessionId: session._id,
    io: req.app.get('io'),
  });

  res.json({
    success: true,
    session,
    state,
    message: 'Average consultation time updated and ETA recalculated',
  });
});

const toObjectId = (value) =>
  typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value;

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

const startOfMonth = (date) => {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
};

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const startOfYear = (date) => {
  const d = new Date(date);
  d.setMonth(0, 1);
  return d;
};

const addYears = (date, years) => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
};

const mapDoctorSummary = (doctor) =>
  doctor
    ? {
        id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        fullName: `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim(),
        specialty: doctor.specialty || null,
        qualification: doctor.qualification || null,
        profileImage: doctor.profileImage || null,
      }
    : null;

const mapClinicSummary = (clinic) =>
  clinic
    ? {
        id: clinic._id,
        name: clinic.name,
        address: clinic.address || null,
      }
    : null;

// Patient Appointments List with History
exports.listPatientAppointments = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const { status, from, to } = req.query;
  const { page, limit, skip } = getPaginationParams(req.query);

  const patientId = toObjectId(req.auth.id);

  const criteria = { patient: patientId };

  // Status filter
  if (status) {
    const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'];
    if (validStatuses.includes(status)) {
      criteria.status = status;
    }
  }

  // Date range filter
  if (from || to) {
    criteria.scheduledFor = {};
    if (from) {
      criteria.scheduledFor.$gte = new Date(from);
    }
    if (to) {
      criteria.scheduledFor.$lte = new Date(to);
    }
  }

  const [appointments, total, totalCounts] = await Promise.all([
    Appointment.find(criteria)
      .select('scheduledFor status reason type notes vitals attachments billing followUpAt rescheduledFrom createdAt patient doctor clinic session token tokenNumber eta priority')
      .populate('doctor', 'firstName lastName specialty qualification profileImage')
      .populate('clinic', 'name address')
      .populate('session', 'startTime endTime status')
      .populate('token', 'tokenNumber status visitedAt completedAt eta')
      .sort({ scheduledFor: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Appointment.countDocuments(criteria),
    // Total counts by status
    Promise.all([
      Appointment.countDocuments({ patient: patientId, status: 'scheduled' }),
      Appointment.countDocuments({ patient: patientId, status: 'confirmed' }),
      Appointment.countDocuments({ patient: patientId, status: 'completed' }),
      Appointment.countDocuments({ patient: patientId, status: 'cancelled' }),
      Appointment.countDocuments({ patient: patientId, status: 'no_show' }),
    ]),
  ]);

  const formatted = appointments.map((item) => ({
    id: item._id,
    scheduledFor: item.scheduledFor,
    status: item.status,
    type: item.type || null,
    reason: item.reason || null,
    notes: item.notes || null,
    durationMinutes: item.durationMinutes || null,
    tokenNumber: item.tokenNumber || item.token?.tokenNumber || null,
    eta: item.eta || item.token?.eta || null,
    doctor: mapDoctorSummary(item.doctor),
    clinic: mapClinicSummary(item.clinic),
    session: item.session
      ? {
          id: item.session._id,
          startTime: item.session.startTime,
          endTime: item.session.endTime,
          status: item.session.status,
        }
      : null,
    token: item.token
      ? {
          id: item.token._id,
          tokenNumber: item.token.tokenNumber,
          status: item.token.status,
          visitedAt: item.token.visitedAt || null,
          completedAt: item.token.completedAt || null,
          eta: item.token.eta || null,
        }
      : null,
    billing: item.billing
      ? {
          amount: item.billing.amount || 0,
          currency: item.billing.currency || 'INR',
          paid: item.billing.paid || false,
          paymentStatus: item.billing.paymentStatus || 'unpaid',
        }
      : null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));

  res.json({
    success: true,
    pagination: getPaginationMeta(total, page, limit),
    summary: {
      total: total,
      scheduled: totalCounts[0],
      confirmed: totalCounts[1],
      completed: totalCounts[2],
      cancelled: totalCounts[3],
      noShow: totalCounts[4],
    },
    appointments: formatted,
  });
});

// Doctor Appointments List with Date and Status Filters
exports.listDoctorAppointments = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const { status, period, from, to } = req.query;
  const { page, limit, skip } = getPaginationParams(req.query);

  const doctorId = toObjectId(req.auth.id);
  const now = new Date();

  const criteria = { doctor: doctorId };

  // Status filter
  if (status) {
    const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'];
    if (validStatuses.includes(status)) {
      criteria.status = status;
    }
  }

  // Period filter (daily, monthly, yearly)
  if (period) {
    if (period === 'daily') {
      const dayStart = startOfDay(now);
      const dayEnd = addDays(dayStart, 1);
      criteria.scheduledFor = { $gte: dayStart, $lt: dayEnd };
    } else if (period === 'monthly') {
      const monthStart = startOfMonth(now);
      const monthEnd = addMonths(monthStart, 1);
      criteria.scheduledFor = { $gte: monthStart, $lt: monthEnd };
    } else if (period === 'yearly') {
      const yearStart = startOfYear(now);
      const yearEnd = addYears(yearStart, 1);
      criteria.scheduledFor = { $gte: yearStart, $lt: yearEnd };
    }
  }

  // Custom date range filter (overrides period if both are provided)
  if (from || to) {
    criteria.scheduledFor = {};
    if (from) {
      criteria.scheduledFor.$gte = new Date(from);
    }
    if (to) {
      criteria.scheduledFor.$lte = new Date(to);
    }
  }

  const dayStart = startOfDay(now);
  const dayEnd = addDays(dayStart, 1);
  const monthStart = startOfMonth(now);
  const monthEnd = addMonths(monthStart, 1);
  const yearStart = startOfYear(now);
  const yearEnd = addYears(yearStart, 1);

  const [appointments, total, countsByPeriod, countsByStatus] = await Promise.all([
    Appointment.find(criteria)
      .select('scheduledFor status reason type notes vitals attachments billing followUpAt rescheduledFrom createdAt patient doctor clinic session token tokenNumber eta priority')
      .populate('patient', 'firstName lastName gender phone email profileImage')
      .populate('clinic', 'name address')
      .populate('session', 'startTime endTime status')
      .populate('token', 'tokenNumber status visitedAt completedAt eta')
      .sort({ scheduledFor: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Appointment.countDocuments(criteria),
    // Counts by period
    Promise.all([
      Appointment.countDocuments({
        doctor: doctorId,
        scheduledFor: { $gte: dayStart, $lt: dayEnd },
        status: { $nin: ['cancelled', 'no_show'] },
      }),
      Appointment.countDocuments({
        doctor: doctorId,
        scheduledFor: { $gte: monthStart, $lt: monthEnd },
        status: { $nin: ['cancelled', 'no_show'] },
      }),
      Appointment.countDocuments({
        doctor: doctorId,
        scheduledFor: { $gte: yearStart, $lt: yearEnd },
        status: { $nin: ['cancelled', 'no_show'] },
      }),
    ]),
    // Counts by status
    Promise.all([
      Appointment.countDocuments({ doctor: doctorId, status: 'scheduled' }),
      Appointment.countDocuments({ doctor: doctorId, status: 'confirmed' }),
      Appointment.countDocuments({ doctor: doctorId, status: 'completed' }),
      Appointment.countDocuments({ doctor: doctorId, status: 'cancelled' }),
      Appointment.countDocuments({ doctor: doctorId, status: 'no_show' }),
    ]),
  ]);

  const formatted = appointments.map((item) => ({
    id: item._id,
    scheduledFor: item.scheduledFor,
    status: item.status,
    type: item.type || null,
    reason: item.reason || null,
    notes: item.notes || null,
    durationMinutes: item.durationMinutes || null,
    tokenNumber: item.tokenNumber || item.token?.tokenNumber || null,
    eta: item.eta || item.token?.eta || null,
    patient: item.patient
      ? {
          id: item.patient._id,
          firstName: item.patient.firstName,
          lastName: item.patient.lastName,
          fullName: `${item.patient.firstName || ''} ${item.patient.lastName || ''}`.trim(),
          gender: item.patient.gender || null,
          phone: item.patient.phone || null,
          email: item.patient.email || null,
          profileImage: item.patient.profileImage || null,
        }
      : null,
    clinic: mapClinicSummary(item.clinic),
    session: item.session
      ? {
          id: item.session._id,
          startTime: item.session.startTime,
          endTime: item.session.endTime,
          status: item.session.status,
        }
      : null,
    token: item.token
      ? {
          id: item.token._id,
          tokenNumber: item.token.tokenNumber,
          status: item.token.status,
          visitedAt: item.token.visitedAt || null,
          completedAt: item.token.completedAt || null,
          eta: item.token.eta || null,
        }
      : null,
    billing: item.billing
      ? {
          amount: item.billing.amount || 0,
          currency: item.billing.currency || 'INR',
          paid: item.billing.paid || false,
          paymentStatus: item.billing.paymentStatus || 'unpaid',
          commissionAmount: item.billing.commissionAmount || 0,
          netAmount: item.billing.netAmount || 0,
        }
      : null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));

  res.json({
    success: true,
    pagination: getPaginationMeta(total, page, limit),
    summary: {
      byPeriod: {
        daily: countsByPeriod[0],
        monthly: countsByPeriod[1],
        yearly: countsByPeriod[2],
      },
      byStatus: {
        scheduled: countsByStatus[0],
        confirmed: countsByStatus[1],
        completed: countsByStatus[2],
        cancelled: countsByStatus[3],
        noShow: countsByStatus[4],
      },
      total: total,
    },
    appointments: formatted,
  });
});

// GET /api/patients/appointments/today
exports.getTodayAppointments = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const patientId = toObjectId(req.auth.id);
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = addDays(dayStart, 1);

  const criteria = {
    patient: patientId,
    scheduledFor: { $gte: dayStart, $lt: dayEnd },
    status: { $nin: ['cancelled', 'no_show'] },
  };

  const appointments = await Appointment.find(criteria)
    .populate('doctor', 'firstName lastName specialty qualification profileImage')
    .populate('clinic', 'name address')
    .populate('session', 'startTime endTime status')
    .populate('token', 'tokenNumber status visitedAt completedAt eta')
    .sort({ scheduledFor: 1 })
    .lean();

  const formatted = appointments.map((item) => ({
    id: item._id,
    scheduledFor: item.scheduledFor,
    status: item.status,
    type: item.type || null,
    reason: item.reason || null,
    notes: item.notes || null,
    durationMinutes: item.durationMinutes || null,
    tokenNumber: item.tokenNumber || item.token?.tokenNumber || null,
    eta: item.eta || item.token?.eta || null,
    doctor: mapDoctorSummary(item.doctor),
    clinic: mapClinicSummary(item.clinic),
    session: item.session
      ? {
          id: item.session._id,
          startTime: item.session.startTime,
          endTime: item.session.endTime,
          status: item.session.status,
        }
      : null,
    token: item.token
      ? {
          id: item.token._id,
          tokenNumber: item.token.tokenNumber,
          status: item.token.status,
          visitedAt: item.token.visitedAt || null,
          completedAt: item.token.completedAt || null,
          eta: item.token.eta || null,
        }
      : null,
    billing: item.billing
      ? {
          amount: item.billing.amount || 0,
          currency: item.billing.currency || 'INR',
          paid: item.billing.paid || false,
          paymentStatus: item.billing.paymentStatus || 'unpaid',
        }
      : null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));

  res.json({
    success: true,
    count: formatted.length,
    appointments: formatted,
  });
});

// GET /api/patients/appointments/upcoming
exports.getUpcomingAppointments = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const patientId = toObjectId(req.auth.id);
  const now = new Date();
  const dayStart = startOfDay(now);
  const daysEnd = addDays(dayStart, 7); // Next 7 days

  const criteria = {
    patient: patientId,
    scheduledFor: { $gte: now, $lt: daysEnd },
    status: { $nin: ['cancelled', 'no_show', 'completed'] },
  };

  const appointments = await Appointment.find(criteria)
    .populate('doctor', 'firstName lastName specialty qualification profileImage')
    .populate('clinic', 'name address')
    .populate('session', 'startTime endTime status')
    .populate('token', 'tokenNumber status visitedAt completedAt eta')
    .sort({ scheduledFor: 1 })
    .lean();

  const formatted = appointments.map((item) => ({
    id: item._id,
    scheduledFor: item.scheduledFor,
    status: item.status,
    type: item.type || null,
    reason: item.reason || null,
    notes: item.notes || null,
    durationMinutes: item.durationMinutes || null,
    tokenNumber: item.tokenNumber || item.token?.tokenNumber || null,
    eta: item.eta || item.token?.eta || null,
    doctor: mapDoctorSummary(item.doctor),
    clinic: mapClinicSummary(item.clinic),
    session: item.session
      ? {
          id: item.session._id,
          startTime: item.session.startTime,
          endTime: item.session.endTime,
          status: item.session.status,
        }
      : null,
    token: item.token
      ? {
          id: item.token._id,
          tokenNumber: item.token.tokenNumber,
          status: item.token.status,
          visitedAt: item.token.visitedAt || null,
          completedAt: item.token.completedAt || null,
          eta: item.token.eta || null,
        }
      : null,
    billing: item.billing
      ? {
          amount: item.billing.amount || 0,
          currency: item.billing.currency || 'INR',
          paid: item.billing.paid || false,
          paymentStatus: item.billing.paymentStatus || 'unpaid',
        }
      : null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));

  res.json({
    success: true,
    count: formatted.length,
    appointments: formatted,
  });
});

// GET /api/appointments/:appointmentId/available-slots
exports.getAvailableSlots = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const { appointmentId } = req.params;
  const patientId = toObjectId(req.auth.id);

  // Find the appointment and verify ownership
  const appointment = await Appointment.findById(appointmentId)
    .populate('doctor', 'firstName lastName')
    .lean();

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  if (appointment.patient.toString() !== patientId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Appointment does not belong to this patient',
    });
  }

  // Check if appointment can be rescheduled
  if (['completed', 'cancelled'].includes(appointment.status)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot reschedule a completed or cancelled appointment',
    });
  }

  const now = new Date();
  const doctorId = appointment.doctor;

  // Find available sessions for the same doctor
  // Sessions that are scheduled/live and have available slots
  const availableSessions = await ClinicSession.find({
    doctor: doctorId,
    startTime: { $gte: now }, // Future sessions only
    status: { $in: [SESSION_STATUS.SCHEDULED, SESSION_STATUS.LIVE] },
  })
    .populate('clinic', 'name address')
    .sort({ startTime: 1 })
    .lean();

  // Calculate available slots for each session
  const slots = await Promise.all(
    availableSessions.map(async (session) => {
      // Count issued tokens (excluding cancelled and no_show)
      const issuedTokens = await SessionToken.countDocuments({
        session: session._id,
        status: { $nin: [TOKEN_STATUS.CANCELLED, TOKEN_STATUS.NO_SHOW] },
      });

      const availableSlots = (session.maxTokens || 0) - issuedTokens;
      const hasCapacity = availableSlots > 0;

      return {
        sessionId: session._id,
        clinic: session.clinic
          ? {
              id: session.clinic._id,
              name: session.clinic.name,
              address: session.clinic.address || null,
            }
          : null,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status,
        maxTokens: session.maxTokens || 0,
        issuedTokens,
        availableSlots,
        hasCapacity,
        averageConsultationMinutes: session.averageConsultationMinutes || null,
      };
    })
  );

  // Filter to only show sessions with available capacity
  const availableSlotsOnly = slots.filter((slot) => slot.hasCapacity);

  res.json({
    success: true,
    count: availableSlotsOnly.length,
    slots: availableSlotsOnly,
    currentAppointment: {
      id: appointment._id,
      scheduledFor: appointment.scheduledFor,
      status: appointment.status,
      doctor: appointment.doctor,
    },
  });
});

// PATCH /api/appointments/:appointmentId/reschedule
exports.rescheduleAppointment = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const { appointmentId } = req.params;
  const { sessionId, reason } = req.body;
  const patientId = toObjectId(req.auth.id);

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: 'sessionId is required',
    });
  }

  // Find the appointment and verify ownership
  const appointment = await Appointment.findById(appointmentId)
    .populate('doctor', 'firstName lastName')
    .populate('token')
    .lean();

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  if (appointment.patient.toString() !== patientId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Appointment does not belong to this patient',
    });
  }

  // Check if appointment can be rescheduled
  if (['completed', 'cancelled'].includes(appointment.status)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot reschedule a completed or cancelled appointment',
    });
  }

  // Find and verify the new session
  const newSession = await ClinicSession.findById(sessionId)
    .populate('clinic', 'name address')
    .populate('doctor', 'firstName lastName')
    .lean();

  if (!newSession) {
    return res.status(404).json({
      success: false,
      message: 'Session not found',
    });
  }

  // Verify same doctor
  if (newSession.doctor._id.toString() !== appointment.doctor._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Cannot reschedule to a different doctor',
    });
  }

  // Check if session is available
  if (![SESSION_STATUS.SCHEDULED, SESSION_STATUS.LIVE].includes(newSession.status)) {
    return res.status(400).json({
      success: false,
      message: 'Selected session is not available for booking',
    });
  }

  // Check if session is in the future
  if (newSession.startTime < new Date()) {
    return res.status(400).json({
      success: false,
      message: 'Cannot reschedule to a past session',
    });
  }

  // Check capacity
  const issuedTokens = await SessionToken.countDocuments({
    session: newSession._id,
    status: { $nin: [TOKEN_STATUS.CANCELLED, TOKEN_STATUS.NO_SHOW] },
  });

  if (issuedTokens >= (newSession.maxTokens || 0)) {
    return res.status(400).json({
      success: false,
      message: 'Selected session is fully booked',
    });
  }

  // Cancel old token if exists
  if (appointment.token) {
    await queueService.cancelToken({
      tokenId: appointment.token._id,
      actorId: patientId,
      actorRole: ROLES.PATIENT,
      reason: reason || 'Rescheduled to another session',
      io: req.app.get('io'),
    });
  }

  // Cancel old appointment
  await Appointment.updateOne(
    { _id: appointmentId },
    {
      $set: {
        status: 'cancelled',
        notes: reason || 'Rescheduled to another session',
      },
    }
  );

  // Issue new token in the new session
  const result = await queueService.issueToken({
    sessionId: newSession._id,
    patientId,
    notes: reason || 'Rescheduled appointment',
    reason: reason || 'Rescheduled appointment',
    createdByRole: ROLES.PATIENT,
    priority: 0,
    io: req.app.get('io'),
  });

  // Link new appointment to old one
  await Appointment.updateOne(
    { _id: result.appointment._id },
    {
      $set: {
        rescheduledFrom: appointmentId,
        notes: reason || 'Rescheduled appointment',
      },
    }
  );

  // Get updated appointment
  const updatedAppointment = await Appointment.findById(result.appointment._id)
    .populate('doctor', 'firstName lastName specialty qualification profileImage')
    .populate('clinic', 'name address')
    .populate('session', 'startTime endTime status')
    .populate('token', 'tokenNumber status visitedAt completedAt eta')
    .lean();

  const formatted = {
    id: updatedAppointment._id,
    scheduledFor: updatedAppointment.scheduledFor,
    status: updatedAppointment.status,
    type: updatedAppointment.type || null,
    reason: updatedAppointment.reason || null,
    notes: updatedAppointment.notes || null,
    durationMinutes: updatedAppointment.durationMinutes || null,
    tokenNumber: updatedAppointment.tokenNumber || updatedAppointment.token?.tokenNumber || null,
    eta: updatedAppointment.eta || updatedAppointment.token?.eta || null,
    doctor: mapDoctorSummary(updatedAppointment.doctor),
    clinic: mapClinicSummary(updatedAppointment.clinic),
    session: updatedAppointment.session
      ? {
          id: updatedAppointment.session._id,
          startTime: updatedAppointment.session.startTime,
          endTime: updatedAppointment.session.endTime,
          status: updatedAppointment.session.status,
        }
      : null,
    token: updatedAppointment.token
      ? {
          id: updatedAppointment.token._id,
          tokenNumber: updatedAppointment.token.tokenNumber,
          status: updatedAppointment.token.status,
          visitedAt: updatedAppointment.token.visitedAt || null,
          completedAt: updatedAppointment.token.completedAt || null,
          eta: updatedAppointment.token.eta || null,
        }
      : null,
    billing: updatedAppointment.billing
      ? {
          amount: updatedAppointment.billing.amount || 0,
          currency: updatedAppointment.billing.currency || 'INR',
          paid: updatedAppointment.billing.paid || false,
          paymentStatus: updatedAppointment.billing.paymentStatus || 'unpaid',
        }
      : null,
    rescheduledFrom: appointmentId,
    createdAt: updatedAppointment.createdAt,
    updatedAt: updatedAppointment.updatedAt,
  };

  res.json({
    success: true,
    message: 'Appointment rescheduled successfully',
    appointment: formatted,
  });
});
