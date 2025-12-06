const asyncHandler = require('../../middleware/asyncHandler');
const Consultation = require('../../models/Consultation');
const Appointment = require('../../models/Appointment');
const Prescription = require('../../models/Prescription');
const { getIO } = require('../../config/socket');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/doctors/consultations
exports.getConsultations = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { status, date } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { doctorId: id };
  if (status) filter.status = status;
  if (date) {
    const dateObj = new Date(date);
    filter.consultationDate = {
      $gte: new Date(dateObj.setHours(0, 0, 0, 0)),
      $lt: new Date(dateObj.setHours(23, 59, 59, 999)),
    };
  }

  const Patient = require('../../models/Patient');
  
  const [consultations, total] = await Promise.all([
    Consultation.find(filter)
      .populate({
        path: 'patientId',
        select: 'firstName lastName phone email profileImage dateOfBirth gender',
      })
      .populate('appointmentId', 'appointmentDate time')
      .sort({ consultationDate: -1 })
      .skip(skip)
      .limit(limit),
    Consultation.countDocuments(filter),
  ]);

  // Fetch patient addresses separately to ensure all nested fields are included
  const patientIds = consultations
    .map(c => c.patientId?._id || c.patientId?.id)
    .filter(Boolean);
  
  const patientsWithAddress = await Patient.find({ _id: { $in: patientIds } })
    .select('_id address');
  
  const addressMap = new Map();
  patientsWithAddress.forEach(patient => {
    if (patient.address) {
      addressMap.set(patient._id.toString(), patient.address);
    }
  });

  // Attach addresses to consultations
  consultations.forEach(consultation => {
    if (consultation.patientId) {
      const patientId = consultation.patientId._id?.toString() || consultation.patientId.id?.toString();
      if (patientId) {
        // Always set address, even if empty, to ensure the field exists
        const address = addressMap.get(patientId) || {};
        consultation.patientId.address = address;
        // Convert to plain object to ensure address is included in JSON response
        if (consultation.patientId.toObject) {
          const patientObj = consultation.patientId.toObject();
          patientObj.address = address;
          consultation.patientId = patientObj;
        }
      }
    }
  });

  return res.status(200).json({
    success: true,
    data: {
      items: consultations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// POST /api/doctors/consultations
exports.createConsultation = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { appointmentId, diagnosis, vitals, medications, investigations, advice, followUpDate } = req.body;

  if (!appointmentId) {
    return res.status(400).json({
      success: false,
      message: 'Appointment ID is required',
    });
  }

  // Verify appointment belongs to doctor
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

  // Check if consultation already exists
  const existingConsultation = await Consultation.findOne({ appointmentId });
  if (existingConsultation) {
    return res.status(400).json({
      success: false,
      message: 'Consultation already exists for this appointment',
    });
  }

  const consultation = await Consultation.create({
    appointmentId,
    patientId: appointment.patientId,
    doctorId: id,
    consultationDate: new Date(),
    status: 'in-progress',
    diagnosis,
    vitals,
    medications,
    investigations,
    advice,
    followUpDate: followUpDate ? new Date(followUpDate) : null,
  });

  // Update appointment status
  appointment.status = 'completed';
  appointment.queueStatus = 'completed';
  await appointment.save();

  // Emit real-time event
  try {
    const io = getIO();
    io.to(`patient-${appointment.patientId}`).emit('consultation:created', {
      consultation: await Consultation.findById(consultation._id)
        .populate('doctorId', 'firstName lastName'),
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  return res.status(201).json({
    success: true,
    message: 'Consultation created successfully',
    data: await Consultation.findById(consultation._id)
      .populate('patientId', 'firstName lastName')
      .populate('appointmentId'),
  });
});

// PATCH /api/doctors/consultations/:id
exports.updateConsultation = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { consultationId } = req.params;
  const updateData = req.body;

  const consultation = await Consultation.findOne({
    _id: consultationId,
    doctorId: id,
  });

  if (!consultation) {
    return res.status(404).json({
      success: false,
      message: 'Consultation not found',
    });
  }

  if (consultation.status === 'completed' || consultation.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update completed or cancelled consultation',
    });
  }

  Object.assign(consultation, updateData);
  await consultation.save();

  // Emit real-time event
  try {
    const io = getIO();
    io.to(`patient-${consultation.patientId}`).emit('consultation:updated', {
      consultation: await Consultation.findById(consultation._id),
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Consultation updated successfully',
    data: consultation,
  });
});

// GET /api/doctors/consultations/:id
exports.getConsultationById = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { consultationId } = req.params;

  const LabReport = require('../../models/LabReport');

  const Patient = require('../../models/Patient');
  
  const consultation = await Consultation.findOne({
    _id: consultationId,
    doctorId: id,
  })
    .populate({
      path: 'patientId',
      select: 'firstName lastName phone email profileImage dateOfBirth gender bloodGroup',
    })
    .populate('appointmentId', 'appointmentDate time reason')
    .populate('prescriptionId');

  if (!consultation) {
    return res.status(404).json({
      success: false,
      message: 'Consultation not found',
    });
  }

  // Fetch patient address separately to ensure all nested fields are included
  if (consultation.patientId) {
    const patientId = consultation.patientId._id || consultation.patientId.id;
    const fullPatient = await Patient.findById(patientId).select('address');
    if (fullPatient) {
      // Always set address, even if empty, to ensure the field exists
      consultation.patientId.address = fullPatient.address || {};
      // Mark the address field as modified so Mongoose includes it in toObject()
      if (consultation.patientId.markModified) {
        consultation.patientId.markModified('address');
      }
    }
  }

  // Get shared lab reports for this patient and doctor
  const sharedReports = await LabReport.find({
    patientId: consultation.patientId,
    'sharedWith.doctorId': id,
  })
    .populate('laboratoryId', 'labName')
    .populate('orderId', 'createdAt')
    .sort({ createdAt: -1 });

  // Convert to plain object and ensure address is included
  const consultationData = consultation.toObject();
  // Ensure patient address is in the response
  if (consultationData.patientId && consultation.patientId.address) {
    consultationData.patientId.address = consultation.patientId.address;
  }
  consultationData.sharedLabReports = sharedReports;

  return res.status(200).json({
    success: true,
    data: consultationData,
  });
});

// GET /api/doctors/all-consultations
exports.getAllConsultations = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { page, limit, skip } = buildPagination(req);

  const Patient = require('../../models/Patient');
  
  const [consultations, total] = await Promise.all([
    Consultation.find({ doctorId: id })
      .populate({
        path: 'patientId',
        select: 'firstName lastName phone email profileImage dateOfBirth gender',
      })
      .populate('appointmentId', 'appointmentDate time')
      .sort({ consultationDate: -1 })
      .skip(skip)
      .limit(limit),
    Consultation.countDocuments({ doctorId: id }),
  ]);

  // Fetch patient addresses separately to ensure all nested fields are included
  const patientIds = consultations
    .map(c => c.patientId?._id || c.patientId?.id)
    .filter(Boolean);
  
  const patientsWithAddress = await Patient.find({ _id: { $in: patientIds } })
    .select('_id address');
  
  const addressMap = new Map();
  patientsWithAddress.forEach(patient => {
    if (patient.address) {
      addressMap.set(patient._id.toString(), patient.address);
    }
  });

  // Attach addresses to consultations
  consultations.forEach(consultation => {
    if (consultation.patientId) {
      const patientId = consultation.patientId._id?.toString() || consultation.patientId.id?.toString();
      if (patientId) {
        // Always set address, even if empty, to ensure the field exists
        const address = addressMap.get(patientId) || {};
        consultation.patientId.address = address;
        // Convert to plain object to ensure address is included in JSON response
        if (consultation.patientId.toObject) {
          const patientObj = consultation.patientId.toObject();
          patientObj.address = address;
          consultation.patientId = patientObj;
        }
      }
    }
  });

  return res.status(200).json({
    success: true,
    data: {
      items: consultations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

