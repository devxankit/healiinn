const asyncHandler = require('../../middleware/asyncHandler');
const mongoose = require('mongoose');
const Consultation = require('../../models/Consultation');
const Prescription = require('../../models/Prescription');
const Appointment = require('../../models/Appointment');
const Patient = require('../../models/Patient');
const { ROLES } = require('../../utils/constants');
const { getPaginationParams, getPaginationMeta } = require('../../utils/pagination');

const toObjectId = (value) =>
  typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value;

const mapPatientSummary = (patient) => {
  if (!patient) return null;
  
  return {
    id: patient._id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    fullName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
    gender: patient.gender || null,
    dateOfBirth: patient.dateOfBirth || null,
    phone: patient.phone || null,
    email: patient.email || null,
    bloodGroup: patient.bloodGroup || null,
    profileImage: patient.profileImage || null,
    address: patient.address || null,
    emergencyContact: patient.emergencyContact || null,
    medicalHistory: patient.medicalHistory || [],
    allergies: patient.allergies || [],
  };
};

exports.listPatients = asyncHandler(async (req, res) => {
  const doctorId = toObjectId(req.auth.id);
  const {
    search,
    gender,
    bloodGroup,
    hasAllergies,
    hasMedicalHistory,
    lastVisitFrom,
    lastVisitTo,
    sortBy = 'name',
    sortOrder = 'asc',
    page,
    limit: limitParam,
  } = req.query;

  const { page: pageNum, limit, skip } = getPaginationParams(req.query);

  // Get distinct patient IDs from consultations
  const consultationPatients = await Consultation.distinct('patient', {
    doctor: doctorId,
  });

  if (consultationPatients.length === 0) {
    return res.json({
      success: true,
      pagination: {
        total: 0,
        page: pageNum,
        limit,
        pages: 0,
      },
      filters: {
        search: search || null,
        gender: gender || null,
        bloodGroup: bloodGroup || null,
        hasAllergies: hasAllergies || null,
        hasMedicalHistory: hasMedicalHistory || null,
        lastVisitFrom: lastVisitFrom || null,
        lastVisitTo: lastVisitTo || null,
        sortBy,
        sortOrder,
      },
      patients: [],
    });
  }

  // Build search criteria
  const searchCriteria = {
    _id: { $in: consultationPatients },
  };

  // Search filter
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    searchCriteria.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ];
  }

  // Gender filter
  if (gender) {
    searchCriteria.gender = gender.toLowerCase();
  }

  // Blood group filter
  if (bloodGroup) {
    searchCriteria.bloodGroup = bloodGroup.toUpperCase();
  }

  // Allergies filter
  if (hasAllergies === 'true') {
    searchCriteria.allergies = { $exists: true, $ne: [], $not: { $size: 0 } };
  } else if (hasAllergies === 'false') {
    searchCriteria.$or = [
      { allergies: { $exists: false } },
      { allergies: { $eq: [] } },
      { allergies: { $size: 0 } },
    ];
  }

  // Medical history filter
  if (hasMedicalHistory === 'true') {
    searchCriteria.medicalHistory = { $exists: true, $ne: [], $not: { $size: 0 } };
  } else if (hasMedicalHistory === 'false') {
    searchCriteria.$or = [
      ...(searchCriteria.$or || []),
      { medicalHistory: { $exists: false } },
      { medicalHistory: { $eq: [] } },
      { medicalHistory: { $size: 0 } },
    ];
  }

  // Build sort criteria
  let sortCriteria = {};
  switch (sortBy.toLowerCase()) {
    case 'name':
      sortCriteria = { firstName: sortOrder === 'desc' ? -1 : 1, lastName: sortOrder === 'desc' ? -1 : 1 };
      break;
    case 'lastvisit':
      // Will sort after fetching based on lastVisit
      sortCriteria = { firstName: 1, lastName: 1 };
      break;
    case 'consultations':
      // Will sort after fetching based on consultation count
      sortCriteria = { firstName: 1, lastName: 1 };
      break;
    case 'created':
      sortCriteria = { createdAt: sortOrder === 'desc' ? -1 : 1 };
      break;
    default:
      sortCriteria = { firstName: 1, lastName: 1 };
  }

  const [patients, total] = await Promise.all([
    Patient.find(searchCriteria)
      .select('firstName lastName gender dateOfBirth phone email bloodGroup profileImage address emergencyContact medicalHistory allergies createdAt')
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)
      .lean(),
    Patient.countDocuments(searchCriteria),
  ]);

  // Get statistics for each patient
  const patientIds = patients.map((p) => p._id);

  const [consultationCounts, prescriptionCounts, lastConsultationDates, appointmentCounts] = await Promise.all([
    Consultation.aggregate([
      { $match: { doctor: doctorId, patient: { $in: patientIds } } },
      { $group: { _id: '$patient', count: { $sum: 1 } } },
    ]),
    Prescription.aggregate([
      { $match: { doctor: doctorId, patient: { $in: patientIds } } },
      { $group: { _id: '$patient', count: { $sum: 1 } } },
    ]),
    Consultation.find({ doctor: doctorId, patient: { $in: patientIds } })
      .sort({ createdAt: -1 })
      .select('patient createdAt')
      .lean(),
    Appointment.aggregate([
      {
        $match: {
          doctor: doctorId,
          patient: { $in: patientIds },
          status: { $in: ['scheduled', 'confirmed'] },
        },
      },
      { $group: { _id: '$patient', count: { $sum: 1 } } },
    ]),
  ]);

  const consultationMap = consultationCounts.reduce((acc, item) => {
    acc[item._id.toString()] = item.count;
    return acc;
  }, {});

  const prescriptionMap = prescriptionCounts.reduce((acc, item) => {
    acc[item._id.toString()] = item.count;
    return acc;
  }, {});

  const appointmentMap = appointmentCounts.reduce((acc, item) => {
    acc[item._id.toString()] = item.count;
    return acc;
  }, {});

  const lastVisitMap = {};
  lastConsultationDates.forEach((item) => {
    const patientId = item.patient.toString();
    if (!lastVisitMap[patientId] || new Date(item.createdAt) > new Date(lastVisitMap[patientId])) {
      lastVisitMap[patientId] = item.createdAt;
    }
  });

  let patientsWithStats = patients.map((patient) => ({
    ...mapPatientSummary(patient),
    statistics: {
      totalConsultations: consultationMap[patient._id.toString()] || 0,
      totalPrescriptions: prescriptionMap[patient._id.toString()] || 0,
      upcomingAppointments: appointmentMap[patient._id.toString()] || 0,
      lastVisit: lastVisitMap[patient._id.toString()] || null,
    },
  }));

  // Apply last visit date filter
  if (lastVisitFrom || lastVisitTo) {
    patientsWithStats = patientsWithStats.filter((patient) => {
      if (!patient.statistics.lastVisit) return false;
      const lastVisit = new Date(patient.statistics.lastVisit);
      if (lastVisitFrom && lastVisit < new Date(lastVisitFrom)) return false;
      if (lastVisitTo && lastVisit > new Date(lastVisitTo)) return false;
      return true;
    });
  }

  // Sort by lastVisit or consultations if needed
  if (sortBy === 'lastvisit') {
    patientsWithStats.sort((a, b) => {
      const aDate = a.statistics.lastVisit ? new Date(a.statistics.lastVisit) : new Date(0);
      const bDate = b.statistics.lastVisit ? new Date(b.statistics.lastVisit) : new Date(0);
      return sortOrder === 'desc' ? bDate - aDate : aDate - bDate;
    });
  } else if (sortBy === 'consultations') {
    patientsWithStats.sort((a, b) => {
      return sortOrder === 'desc'
        ? b.statistics.totalConsultations - a.statistics.totalConsultations
        : a.statistics.totalConsultations - b.statistics.totalConsultations;
    });
  }

  res.json({
    success: true,
    pagination: getPaginationMeta(total, pageNum, limit),
    filters: {
      search: search || null,
      gender: gender || null,
      bloodGroup: bloodGroup || null,
      hasAllergies: hasAllergies || null,
      hasMedicalHistory: hasMedicalHistory || null,
      lastVisitFrom: lastVisitFrom || null,
      lastVisitTo: lastVisitTo || null,
      sortBy,
      sortOrder,
    },
    patients: patientsWithStats,
  });
});

exports.getPatientDetails = asyncHandler(async (req, res) => {
  const doctorId = toObjectId(req.auth.id);
  const { patientId } = req.params;

  // Verify doctor has consulted this patient
  const hasRelationship = await Consultation.exists({
    doctor: doctorId,
    patient: patientId,
  });

  if (!hasRelationship) {
    return res.status(403).json({
      success: false,
      message: 'You have no consultations with this patient.',
    });
  }

  const patient = await Patient.findById(patientId)
    .select('firstName lastName gender dateOfBirth phone email bloodGroup profileImage address emergencyContact medicalHistory allergies createdAt updatedAt')
    .lean();

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found.',
    });
  }

  // Get consultation and prescription counts
  const [consultationCount, prescriptionCount, lastConsultation] = await Promise.all([
    Consultation.countDocuments({ doctor: doctorId, patient: patientId }),
    Prescription.countDocuments({ doctor: doctorId, patient: patientId }),
    Consultation.findOne({ doctor: doctorId, patient: patientId })
      .sort({ createdAt: -1 })
      .select('createdAt status')
      .lean(),
  ]);

  res.json({
    success: true,
    patient: {
      ...mapPatientSummary(patient),
      statistics: {
        totalConsultations: consultationCount,
        totalPrescriptions: prescriptionCount,
        lastVisit: lastConsultation?.createdAt || null,
        lastVisitStatus: lastConsultation?.status || null,
      },
    },
  });
});

exports.getPatientStatistics = asyncHandler(async (req, res) => {
  const doctorId = toObjectId(req.auth.id);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalPatients,
    totalConsultations,
    totalPrescriptions,
    totalAppointments,
    patientsThisMonth,
    patientsThisYear,
    consultationsThisMonth,
    consultationsThisYear,
    newPatientsThisMonth,
    newPatientsThisYear,
    patientsByGender,
    patientsByBloodGroup,
    patientsWithAllergies,
    patientsWithMedicalHistory,
    upcomingAppointmentsCount,
    recentPatients,
  ] = await Promise.all([
    Consultation.distinct('patient', { doctor: doctorId }).then((ids) => ids.length),
    Consultation.countDocuments({ doctor: doctorId }),
    Prescription.countDocuments({ doctor: doctorId }),
    Appointment.countDocuments({ doctor: doctorId }),
    Consultation.distinct('patient', {
      doctor: doctorId,
      createdAt: { $gte: startOfMonth },
    }).then((ids) => ids.length),
    Consultation.distinct('patient', {
      doctor: doctorId,
      createdAt: { $gte: startOfYear },
    }).then((ids) => ids.length),
    Consultation.countDocuments({
      doctor: doctorId,
      createdAt: { $gte: startOfMonth },
    }),
    Consultation.countDocuments({
      doctor: doctorId,
      createdAt: { $gte: startOfYear },
    }),
    // New patients (first consultation this month)
    Consultation.aggregate([
      { $match: { doctor: doctorId, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: '$patient', firstConsultation: { $min: '$createdAt' } } },
      { $match: { firstConsultation: { $gte: startOfMonth } } },
      { $count: 'count' },
    ]).then((result) => (result[0] ? result[0].count : 0)),
    Consultation.aggregate([
      { $match: { doctor: doctorId, createdAt: { $gte: startOfYear } } },
      { $group: { _id: '$patient', firstConsultation: { $min: '$createdAt' } } },
      { $match: { firstConsultation: { $gte: startOfYear } } },
      { $count: 'count' },
    ]).then((result) => (result[0] ? result[0].count : 0)),
    // Patients by gender
    Consultation.distinct('patient', { doctor: doctorId }).then(async (patientIds) => {
      const patients = await Patient.find({ _id: { $in: patientIds } })
        .select('gender')
        .lean();
      const genderMap = {};
      patients.forEach((p) => {
        const gender = p.gender || 'unknown';
        genderMap[gender] = (genderMap[gender] || 0) + 1;
      });
      return genderMap;
    }),
    // Patients by blood group
    Consultation.distinct('patient', { doctor: doctorId }).then(async (patientIds) => {
      const patients = await Patient.find({ _id: { $in: patientIds } })
        .select('bloodGroup')
        .lean();
      const bloodGroupMap = {};
      patients.forEach((p) => {
        const bg = p.bloodGroup || 'UNKNOWN';
        bloodGroupMap[bg] = (bloodGroupMap[bg] || 0) + 1;
      });
      return bloodGroupMap;
    }),
    // Patients with allergies
    Consultation.distinct('patient', { doctor: doctorId }).then(async (patientIds) => {
      const count = await Patient.countDocuments({
        _id: { $in: patientIds },
        allergies: { $exists: true, $ne: [], $not: { $size: 0 } },
      });
      return count;
    }),
    // Patients with medical history
    Consultation.distinct('patient', { doctor: doctorId }).then(async (patientIds) => {
      const count = await Patient.countDocuments({
        _id: { $in: patientIds },
        medicalHistory: { $exists: true, $ne: [], $not: { $size: 0 } },
      });
      return count;
    }),
    // Upcoming appointments
    Appointment.countDocuments({
      doctor: doctorId,
      scheduledFor: { $gte: now },
      status: { $in: ['scheduled', 'confirmed'] },
    }),
    // Recent patients (last 30 days)
    Consultation.distinct('patient', {
      doctor: doctorId,
      createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
    }).then((ids) => ids.length),
  ]);

  // Calculate average consultations per patient
  const avgConsultationsPerPatient = totalPatients > 0 ? (totalConsultations / totalPatients).toFixed(2) : 0;

  res.json({
    success: true,
    statistics: {
      overview: {
        totalPatients,
        totalConsultations,
        totalPrescriptions,
        totalAppointments,
        avgConsultationsPerPatient: Number.parseFloat(avgConsultationsPerPatient),
      },
      thisMonth: {
        patients: patientsThisMonth,
        consultations: consultationsThisMonth,
        newPatients: newPatientsThisMonth,
      },
      thisYear: {
        patients: patientsThisYear,
        consultations: consultationsThisYear,
        newPatients: newPatientsThisYear,
      },
      demographics: {
        byGender: patientsByGender,
        byBloodGroup: patientsByBloodGroup,
        withAllergies: patientsWithAllergies,
        withMedicalHistory: patientsWithMedicalHistory,
      },
      upcoming: {
        appointments: upcomingAppointmentsCount,
      },
      recent: {
        patientsLast30Days: recentPatients,
      },
    },
  });
});

exports.searchPatients = asyncHandler(async (req, res) => {
  const doctorId = toObjectId(req.auth.id);
  const { query, limit: limitParam } = req.query;

  if (!query || query.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Search query must be at least 2 characters long.',
    });
  }

  const { limit } = getPaginationParams({ limit: limitParam }, 10, 50);
  const searchRegex = new RegExp(query.trim(), 'i');

  // Get distinct patient IDs from consultations
  const consultationPatients = await Consultation.distinct('patient', {
    doctor: doctorId,
  });

  if (consultationPatients.length === 0) {
    return res.json({
      success: true,
      patients: [],
    });
  }

  const patients = await Patient.find({
    _id: { $in: consultationPatients },
    $or: [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ],
  })
    .select('firstName lastName gender phone email bloodGroup profileImage')
    .limit(limit)
    .lean();

  const formattedPatients = patients.map((patient) => ({
    id: patient._id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    fullName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
    gender: patient.gender || null,
    phone: patient.phone || null,
    email: patient.email || null,
    bloodGroup: patient.bloodGroup || null,
    profileImage: patient.profileImage || null,
  }));

  res.json({
    success: true,
    query: query.trim(),
    count: formattedPatients.length,
    patients: formattedPatients,
  });
});

