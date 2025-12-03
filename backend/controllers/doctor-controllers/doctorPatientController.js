const asyncHandler = require('../../middleware/asyncHandler');
const Appointment = require('../../models/Appointment');
const Patient = require('../../models/Patient');
const Consultation = require('../../models/Consultation');
const Prescription = require('../../models/Prescription');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/doctors/patients (Patient queue)
exports.getPatientQueue = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { date } = req.query;

  const sessionDate = date ? new Date(date) : new Date();
  sessionDate.setHours(0, 0, 0, 0);
  const sessionEndDate = new Date(sessionDate);
  sessionEndDate.setHours(23, 59, 59, 999);

  const Session = require('../../models/Session');
  const session = await Session.findOne({
    doctorId: id,
    date: { $gte: sessionDate, $lt: sessionEndDate },
    status: { $in: ['scheduled', 'active'] },
  });

  if (!session) {
    return res.status(200).json({
      success: true,
      data: {
        session: null,
        appointments: [],
        currentToken: 0,
      },
    });
  }

  const appointments = await Appointment.find({
    sessionId: session._id,
    status: { $in: ['scheduled', 'confirmed'] },
  })
    .populate('patientId', 'firstName lastName phone profileImage')
    .sort({ tokenNumber: 1 });

  return res.status(200).json({
    success: true,
    data: {
      session: {
        _id: session._id,
        date: session.date,
        sessionStartTime: session.sessionStartTime,
        sessionEndTime: session.sessionEndTime,
        currentToken: session.currentToken,
        maxTokens: session.maxTokens,
      },
      appointments,
      currentToken: session.currentToken,
    },
  });
});

// GET /api/doctors/patients/:id
exports.getPatientById = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { patientId } = req.params;

  // Verify patient has appointments with this doctor
  const appointment = await Appointment.findOne({
    doctorId: id,
    patientId,
  });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found or no appointments with this doctor',
    });
  }

  const patient = await Patient.findById(patientId).select('-password');

  return res.status(200).json({
    success: true,
    data: patient,
  });
});

// GET /api/doctors/patients/:id/history
exports.getPatientHistory = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { patientId } = req.params;

  // Verify patient has appointments with this doctor
  const appointment = await Appointment.findOne({
    doctorId: id,
    patientId,
  });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found or no appointments with this doctor',
    });
  }

  const LabReport = require('../../models/LabReport');

  const [appointments, consultations, prescriptions, sharedReports] = await Promise.all([
    Appointment.find({ doctorId: id, patientId })
      .sort({ appointmentDate: -1 })
      .limit(10),
    Consultation.find({ doctorId: id, patientId })
      .sort({ consultationDate: -1 })
      .limit(10),
    Prescription.find({ doctorId: id, patientId })
      .sort({ createdAt: -1 })
      .limit(10),
    LabReport.find({
      patientId,
      'sharedWith.doctorId': id,
    })
      .populate('laboratoryId', 'labName')
      .populate('orderId', 'createdAt')
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      appointments,
      consultations,
      prescriptions,
      sharedLabReports: sharedReports,
    },
  });
});

// GET /api/doctors/all-patients
exports.getAllPatients = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { search } = req.query;
  const { page, limit, skip } = buildPagination(req);

  // Get distinct patient IDs from appointments
  const patientIds = await Appointment.distinct('patientId', { doctorId: id });

  const filter = { _id: { $in: patientIds } };
  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { phone: regex },
    ];
  }

  const [patients, total] = await Promise.all([
    Patient.find(filter)
      .select('firstName lastName email phone profileImage dateOfBirth gender')
      .sort({ firstName: 1, lastName: 1 })
      .skip(skip)
      .limit(limit),
    Patient.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

