const asyncHandler = require('../../middleware/asyncHandler');
const mongoose = require('mongoose');
const Appointment = require('../../models/Appointment');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const ClinicSession = require('../../models/ClinicSession');
const SessionToken = require('../../models/SessionToken');
const { ROLES, TOKEN_STATUS } = require('../../utils/constants');
const { sendAppointmentReminderEmail } = require('../../services/emailService');
const queueService = require('../../services/appointmentQueueService');

const toObjectId = (value) =>
  typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value;

const ensureRole = (role, allowed) => {
  if (!allowed.includes(role)) {
    const error = new Error('You do not have access to this resource');
    error.status = 403;
    throw error;
  }
};

const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDoctorName = (doctor) => {
  if (!doctor) return 'Doctor';
  return `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Doctor';
};

const formatPatientName = (patient) => {
  if (!patient) return 'Patient';
  return `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient';
};

// Accept appointment request
exports.acceptAppointment = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const { appointmentId } = req.params;
  const doctorId = toObjectId(req.auth.id);

  const appointment = await Appointment.findById(appointmentId)
    .populate('patient', 'firstName lastName phone email')
    .populate('doctor', 'firstName lastName')
    .lean();

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found.',
    });
  }

  if (appointment.doctor._id.toString() !== doctorId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to accept this appointment.',
    });
  }

  if (appointment.status !== 'scheduled') {
    return res.status(400).json({
      success: false,
      message: `Cannot accept appointment with status: ${appointment.status}. Only 'scheduled' appointments can be accepted.`,
    });
  }

  const updatedAppointment = await Appointment.findByIdAndUpdate(
    appointmentId,
    {
      $set: {
        status: 'confirmed',
        notes: req.body.notes || appointment.notes,
      },
    },
    { new: true }
  )
    .populate('patient', 'firstName lastName phone email profileImage')
    .populate('doctor', 'firstName lastName specialization')
    .populate('clinic', 'name address')
    .populate('session', 'startTime endTime status')
    .populate('token', 'tokenNumber status')
    .lean();

  // Send notification to patient

  res.json({
    success: true,
    message: 'Appointment accepted successfully.',
    appointment: {
      id: updatedAppointment._id,
      scheduledFor: updatedAppointment.scheduledFor,
      status: updatedAppointment.status,
      type: updatedAppointment.type || null,
      reason: updatedAppointment.reason || null,
      notes: updatedAppointment.notes || null,
      durationMinutes: updatedAppointment.durationMinutes || null,
      patient: updatedAppointment.patient
        ? {
            id: updatedAppointment.patient._id,
            firstName: updatedAppointment.patient.firstName,
            lastName: updatedAppointment.patient.lastName,
            fullName: formatPatientName(updatedAppointment.patient),
            phone: updatedAppointment.patient.phone || null,
            email: updatedAppointment.patient.email || null,
            profileImage: updatedAppointment.patient.profileImage || null,
          }
        : null,
      doctor: updatedAppointment.doctor
        ? {
            id: updatedAppointment.doctor._id,
            firstName: updatedAppointment.doctor.firstName,
            lastName: updatedAppointment.doctor.lastName,
            fullName: formatDoctorName(updatedAppointment.doctor),
            specialization: updatedAppointment.doctor.specialization || null,
          }
        : null,
      clinic: updatedAppointment.clinic
        ? {
            id: updatedAppointment.clinic._id,
            name: updatedAppointment.clinic.name || null,
            address: updatedAppointment.clinic.address || null,
          }
        : null,
      createdAt: updatedAppointment.createdAt,
      updatedAt: updatedAppointment.updatedAt,
    },
  });
});

// Reject appointment request
exports.rejectAppointment = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const { appointmentId } = req.params;
  const { reason } = req.body;
  const doctorId = toObjectId(req.auth.id);

  const appointment = await Appointment.findById(appointmentId)
    .populate('patient', 'firstName lastName phone email')
    .populate('doctor', 'firstName lastName')
    .lean();

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found.',
    });
  }

  if (appointment.doctor._id.toString() !== doctorId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to reject this appointment.',
    });
  }

  if (['completed', 'cancelled', 'no_show'].includes(appointment.status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot reject appointment with status: ${appointment.status}.`,
    });
  }

  const rejectionReason = reason || 'Appointment rejected by doctor';

  const updatedAppointment = await Appointment.findByIdAndUpdate(
    appointmentId,
    {
      $set: {
        status: 'cancelled',
        notes: rejectionReason,
      },
    },
    { new: true }
  )
    .populate('patient', 'firstName lastName phone email')
    .populate('doctor', 'firstName lastName')
    .lean();

  // Cancel associated token if exists
  if (appointment.token) {
    try {
      await queueService.cancelToken({
        tokenId: appointment.token,
        actorId: doctorId,
        actorRole: ROLES.DOCTOR,
        reason: rejectionReason,
        io: req.app.get('io'),
      });
    } catch (tokenError) {
      console.error('Failed to cancel associated token:', tokenError);
    }
  }

  // Send notification to patient
  res.json({
    success: true,
    message: 'Appointment rejected successfully.',
    appointment: {
      id: updatedAppointment._id,
      status: updatedAppointment.status,
      notes: updatedAppointment.notes,
      scheduledFor: updatedAppointment.scheduledFor,
      updatedAt: updatedAppointment.updatedAt,
    },
  });
});

// Reschedule appointment (doctor-initiated)
exports.rescheduleAppointment = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const { appointmentId } = req.params;
  const { scheduledFor, sessionId, reason, durationMinutes } = req.body;
  const doctorId = toObjectId(req.auth.id);

  if (!scheduledFor && !sessionId) {
    return res.status(400).json({
      success: false,
      message: 'Either scheduledFor (date/time) or sessionId is required.',
    });
  }

  const appointment = await Appointment.findById(appointmentId)
    .populate('patient', 'firstName lastName phone email')
    .populate('doctor', 'firstName lastName')
    .populate('token')
    .lean();

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found.',
    });
  }

  if (appointment.doctor._id.toString() !== doctorId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to reschedule this appointment.',
    });
  }

  if (['completed', 'cancelled', 'no_show'].includes(appointment.status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot reschedule appointment with status: ${appointment.status}.`,
    });
  }

  let newScheduledFor = scheduledFor ? new Date(scheduledFor) : null;
  let newSessionId = sessionId ? toObjectId(sessionId) : null;

  // If sessionId is provided, get the session and use its startTime
  if (newSessionId) {
    const session = await ClinicSession.findById(newSessionId)
      .populate('doctor', 'firstName lastName')
      .lean();

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found.',
      });
    }

    if (session.doctor._id.toString() !== doctorId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule to a different doctor\'s session.',
      });
    }

    if (new Date(session.startTime) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule to a past session.',
      });
    }

    newScheduledFor = new Date(session.startTime);
  }

  if (!newScheduledFor || newScheduledFor < new Date()) {
    return res.status(400).json({
      success: false,
      message: 'Cannot reschedule to a past date/time.',
    });
  }

  const rescheduleReason = reason || 'Appointment rescheduled by doctor';

  // Update appointment
  const updateData = {
    scheduledFor: newScheduledFor,
    date: newScheduledFor,
    time: newScheduledFor.toTimeString().slice(0, 5),
    notes: rescheduleReason,
    rescheduledFrom: appointmentId,
  };

  if (newSessionId) {
    updateData.session = newSessionId;
    updateData.sessionId = newSessionId;
  }

  if (durationMinutes) {
    updateData.durationMinutes = Number(durationMinutes);
  }

  const updatedAppointment = await Appointment.findByIdAndUpdate(appointmentId, { $set: updateData }, { new: true })
    .populate('patient', 'firstName lastName phone email profileImage')
    .populate('doctor', 'firstName lastName specialization')
    .populate('clinic', 'name address')
    .populate('session', 'startTime endTime status')
    .populate('token', 'tokenNumber status')
    .lean();

  // If session changed, update token
  if (newSessionId && appointment.token) {
    try {
      // Cancel old token
      await queueService.cancelToken({
        tokenId: appointment.token._id,
        actorId: doctorId,
        actorRole: ROLES.DOCTOR,
        reason: 'Appointment rescheduled to different session',
        io: req.app.get('io'),
      });

      // Issue new token for new session
      const newToken = await queueService.issueToken({
        sessionId: newSessionId,
        patientId: appointment.patient._id,
        notes: rescheduleReason,
        reason: appointment.reason || 'Follow-up',
        createdByRole: ROLES.DOCTOR,
        priority: 0,
        paymentId: appointment.billing?.paymentId,
        metadata: { appointmentId: appointment._id },
        io: req.app.get('io'),
      });

      // Update appointment with new token
      await Appointment.findByIdAndUpdate(appointmentId, {
        $set: {
          token: newToken.token._id,
          tokenId: newToken.token._id,
          tokenNumber: newToken.token.tokenNumber,
        },
      });
    } catch (tokenError) {
      console.error('Failed to update token for rescheduled appointment:', tokenError);
    }
  }

  res.json({
    success: true,
    message: 'Appointment rescheduled successfully.',
    appointment: {
      id: updatedAppointment._id,
      scheduledFor: updatedAppointment.scheduledFor,
      status: updatedAppointment.status,
      type: updatedAppointment.type || null,
      reason: updatedAppointment.reason || null,
      notes: updatedAppointment.notes || null,
      durationMinutes: updatedAppointment.durationMinutes || null,
      patient: updatedAppointment.patient
        ? {
            id: updatedAppointment.patient._id,
            firstName: updatedAppointment.patient.firstName,
            lastName: updatedAppointment.patient.lastName,
            fullName: formatPatientName(updatedAppointment.patient),
            phone: updatedAppointment.patient.phone || null,
            email: updatedAppointment.patient.email || null,
            profileImage: updatedAppointment.patient.profileImage || null,
          }
        : null,
      doctor: updatedAppointment.doctor
        ? {
            id: updatedAppointment.doctor._id,
            firstName: updatedAppointment.doctor.firstName,
            lastName: updatedAppointment.doctor.lastName,
            fullName: formatDoctorName(updatedAppointment.doctor),
            specialization: updatedAppointment.doctor.specialization || null,
          }
        : null,
      clinic: updatedAppointment.clinic
        ? {
            id: updatedAppointment.clinic._id,
            name: updatedAppointment.clinic.name || null,
            address: updatedAppointment.clinic.address || null,
          }
        : null,
      createdAt: updatedAppointment.createdAt,
      updatedAt: updatedAppointment.updatedAt,
    },
  });
});

// Cancel appointment (doctor-initiated)
exports.cancelAppointment = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const { appointmentId } = req.params;
  const { reason } = req.body;
  const doctorId = toObjectId(req.auth.id);

  const appointment = await Appointment.findById(appointmentId)
    .populate('patient', 'firstName lastName phone email')
    .populate('doctor', 'firstName lastName')
    .populate('token')
    .lean();

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found.',
    });
  }

  if (appointment.doctor._id.toString() !== doctorId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to cancel this appointment.',
    });
  }

  if (['completed', 'cancelled'].includes(appointment.status)) {
    return res.status(400).json({
      success: false,
      message: `Appointment is already ${appointment.status}.`,
    });
  }

  const cancellationReason = reason || 'Appointment cancelled by doctor';

  const updatedAppointment = await Appointment.findByIdAndUpdate(
    appointmentId,
    {
      $set: {
        status: 'cancelled',
        notes: cancellationReason,
      },
    },
    { new: true }
  )
    .populate('patient', 'firstName lastName phone email')
    .populate('doctor', 'firstName lastName')
    .lean();

  // Cancel associated token if exists
  if (appointment.token) {
    try {
      await queueService.cancelToken({
        tokenId: appointment.token._id,
        actorId: doctorId,
        actorRole: ROLES.DOCTOR,
        reason: cancellationReason,
        io: req.app.get('io'),
      });
    } catch (tokenError) {
      console.error('Failed to cancel associated token:', tokenError);
    }
  }

  res.json({
    success: true,
    message: 'Appointment cancelled successfully.',
    appointment: {
      id: updatedAppointment._id,
      status: updatedAppointment.status,
      notes: updatedAppointment.notes,
      scheduledFor: updatedAppointment.scheduledFor,
      updatedAt: updatedAppointment.updatedAt,
    },
  });
});

// Mark appointment as completed
exports.completeAppointment = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const { appointmentId } = req.params;
  const doctorId = toObjectId(req.auth.id);

  const appointment = await Appointment.findById(appointmentId)
    .populate('patient', 'firstName lastName phone email')
    .populate('doctor', 'firstName lastName')
    .populate('token')
    .lean();

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found.',
    });
  }

  if (appointment.doctor._id.toString() !== doctorId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to complete this appointment.',
    });
  }

  if (appointment.status === 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Appointment is already completed.',
    });
  }

  if (appointment.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Cannot complete a cancelled appointment.',
    });
  }

  const updatedAppointment = await Appointment.findByIdAndUpdate(
    appointmentId,
    {
      $set: {
        status: 'completed',
        notes: req.body.notes || appointment.notes,
      },
    },
    { new: true }
  )
    .populate('patient', 'firstName lastName phone email profileImage')
    .populate('doctor', 'firstName lastName specialization')
    .populate('clinic', 'name address')
    .populate('session', 'startTime endTime status')
    .populate('token', 'tokenNumber status')
    .lean();

  // Complete associated token if exists
  if (appointment.token) {
    try {
      await queueService.updateTokenStatus({
        tokenId: appointment.token._id,
        doctorId,
        status: TOKEN_STATUS.COMPLETED,
        notes: 'Appointment completed',
        io: req.app.get('io'),
      });
    } catch (tokenError) {
      console.error('Failed to complete associated token:', tokenError);
    }
  }

  res.json({
    success: true,
    message: 'Appointment marked as completed successfully.',
    appointment: {
      id: updatedAppointment._id,
      scheduledFor: updatedAppointment.scheduledFor,
      status: updatedAppointment.status,
      type: updatedAppointment.type || null,
      reason: updatedAppointment.reason || null,
      notes: updatedAppointment.notes || null,
      durationMinutes: updatedAppointment.durationMinutes || null,
      patient: updatedAppointment.patient
        ? {
            id: updatedAppointment.patient._id,
            firstName: updatedAppointment.patient.firstName,
            lastName: updatedAppointment.patient.lastName,
            fullName: formatPatientName(updatedAppointment.patient),
            phone: updatedAppointment.patient.phone || null,
            email: updatedAppointment.patient.email || null,
            profileImage: updatedAppointment.patient.profileImage || null,
          }
        : null,
      doctor: updatedAppointment.doctor
        ? {
            id: updatedAppointment.doctor._id,
            firstName: updatedAppointment.doctor.firstName,
            lastName: updatedAppointment.doctor.lastName,
            fullName: formatDoctorName(updatedAppointment.doctor),
            specialization: updatedAppointment.doctor.specialization || null,
          }
        : null,
      clinic: updatedAppointment.clinic
        ? {
            id: updatedAppointment.clinic._id,
            name: updatedAppointment.clinic.name || null,
            address: updatedAppointment.clinic.address || null,
          }
        : null,
      createdAt: updatedAppointment.createdAt,
      updatedAt: updatedAppointment.updatedAt,
    },
  });
});

// Add/Update appointment notes
exports.updateAppointmentNotes = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const { appointmentId } = req.params;
  const { notes } = req.body;
  const doctorId = toObjectId(req.auth.id);

  if (!notes || !notes.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Notes are required.',
    });
  }

  const appointment = await Appointment.findById(appointmentId)
    .populate('patient', 'firstName lastName phone email')
    .populate('doctor', 'firstName lastName')
    .lean();

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found.',
    });
  }

  if (appointment.doctor._id.toString() !== doctorId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to update notes for this appointment.',
    });
  }

  const updatedAppointment = await Appointment.findByIdAndUpdate(
    appointmentId,
    {
      $set: {
        notes: notes.trim(),
      },
    },
    { new: true }
  )
    .populate('patient', 'firstName lastName phone email profileImage')
    .populate('doctor', 'firstName lastName specialization')
    .populate('clinic', 'name address')
    .lean();

  res.json({
    success: true,
    message: 'Appointment notes updated successfully.',
    appointment: {
      id: updatedAppointment._id,
      scheduledFor: updatedAppointment.scheduledFor,
      status: updatedAppointment.status,
      notes: updatedAppointment.notes,
      patient: updatedAppointment.patient
        ? {
            id: updatedAppointment.patient._id,
            firstName: updatedAppointment.patient.firstName,
            lastName: updatedAppointment.patient.lastName,
            fullName: formatPatientName(updatedAppointment.patient),
          }
        : null,
      updatedAt: updatedAppointment.updatedAt,
    },
  });
});

// Get appointment by ID (for doctor)
exports.getAppointment = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const { appointmentId } = req.params;
  const doctorId = toObjectId(req.auth.id);

  const appointment = await Appointment.findById(appointmentId)
    .populate('patient', 'firstName lastName gender dateOfBirth phone email bloodGroup profileImage address medicalHistory allergies')
    .populate('doctor', 'firstName lastName specialization consultationFee')
    .populate('clinic', 'name address')
    .populate('session', 'startTime endTime status')
    .populate('token', 'tokenNumber status visitedAt completedAt eta')
    .lean();

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found.',
    });
  }

  if (appointment.doctor._id.toString() !== doctorId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to view this appointment.',
    });
  }

  res.json({
    success: true,
    appointment: {
      id: appointment._id,
      scheduledFor: appointment.scheduledFor,
      status: appointment.status,
      type: appointment.type || null,
      reason: appointment.reason || null,
      notes: appointment.notes || null,
      durationMinutes: appointment.durationMinutes || null,
      tokenNumber: appointment.tokenNumber || appointment.token?.tokenNumber || null,
      eta: appointment.eta || appointment.token?.eta || null,
      patient: appointment.patient
        ? {
            id: appointment.patient._id,
            firstName: appointment.patient.firstName,
            lastName: appointment.patient.lastName,
            fullName: formatPatientName(appointment.patient),
            gender: appointment.patient.gender || null,
            dateOfBirth: appointment.patient.dateOfBirth || null,
            phone: appointment.patient.phone || null,
            email: appointment.patient.email || null,
            bloodGroup: appointment.patient.bloodGroup || null,
            profileImage: appointment.patient.profileImage || null,
            address: appointment.patient.address || null,
            medicalHistory: appointment.patient.medicalHistory || [],
            allergies: appointment.patient.allergies || [],
          }
        : null,
      doctor: appointment.doctor
        ? {
            id: appointment.doctor._id,
            firstName: appointment.doctor.firstName,
            lastName: appointment.doctor.lastName,
            fullName: formatDoctorName(appointment.doctor),
            specialization: appointment.doctor.specialization || null,
            consultationFee: appointment.doctor.consultationFee || null,
          }
        : null,
      clinic: appointment.clinic
        ? {
            id: appointment.clinic._id,
            name: appointment.clinic.name || null,
            address: appointment.clinic.address || null,
          }
        : null,
      session: appointment.session
        ? {
            id: appointment.session._id,
            startTime: appointment.session.startTime,
            endTime: appointment.session.endTime,
            status: appointment.session.status,
          }
        : null,
      token: appointment.token
        ? {
            id: appointment.token._id,
            tokenNumber: appointment.token.tokenNumber,
            status: appointment.token.status,
            visitedAt: appointment.token.visitedAt || null,
            completedAt: appointment.token.completedAt || null,
            eta: appointment.token.eta || null,
          }
        : null,
      billing: appointment.billing
        ? {
            amount: appointment.billing.amount || 0,
            currency: appointment.billing.currency || 'INR',
            paid: appointment.billing.paid || false,
            paymentStatus: appointment.billing.paymentStatus || 'unpaid',
            commissionAmount: appointment.billing.commissionAmount || 0,
            netAmount: appointment.billing.netAmount || 0,
          }
        : null,
      vitals: appointment.vitals || null,
      attachments: appointment.attachments || [],
      followUpAt: appointment.followUpAt || null,
      rescheduledFrom: appointment.rescheduledFrom || null,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    },
  });
});

// Send appointment reminder
exports.sendAppointmentReminder = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.DOCTOR]);

  const { appointmentId } = req.params;
  const { hoursBefore = 24 } = req.body;
  const doctorId = toObjectId(req.auth.id);

  const appointment = await Appointment.findById(appointmentId)
    .populate('patient', 'firstName lastName phone email')
    .populate('doctor', 'firstName lastName')
    .lean();

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found.',
    });
  }

  if (appointment.doctor._id.toString() !== doctorId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to send reminder for this appointment.',
    });
  }

  if (['completed', 'cancelled', 'no_show'].includes(appointment.status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot send reminder for appointment with status: ${appointment.status}.`,
    });
  }

  const appointmentDate = new Date(appointment.scheduledFor);
  const now = new Date();

  if (appointmentDate < now) {
    return res.status(400).json({
      success: false,
      message: 'Cannot send reminder for past appointments.',
    });
  }

  const doctorName = formatDoctorName(appointment.doctor);
  const patientName = formatPatientName(appointment.patient);
  
  // Send email reminder to patient if email is available
  if (appointment.patient.email) {
    try {
      await sendAppointmentReminderEmail({
        patientEmail: appointment.patient.email,
        patientName,
        doctorName,
        appointmentDate: appointment.scheduledFor,
        hoursBefore: Number(hoursBefore) || 24,
      });
    } catch (emailError) {
      console.error('Failed to send appointment reminder email:', emailError);
      // Don't fail the request if email fails, just log it
    }
  }

  res.json({
      success: true,
      message: 'Appointment reminder sent successfully.',
      appointment: {
        id: appointment._id,
        scheduledFor: appointment.scheduledFor,
        status: appointment.status,
        patient: {
          id: appointment.patient._id,
          name: patientName,
          email: appointment.patient.email || null,
        },
        doctor: {
          id: appointment.doctor._id,
          name: doctorName,
        },
      },
    });
});

