const asyncHandler = require('../../middleware/asyncHandler');
const { ROLES } = require('../../utils/constants');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const Laboratory = require('../../models/Laboratory');
const Pharmacy = require('../../models/Pharmacy');
const Review = require('../../models/Review');
const { APPROVAL_STATUS } = require('../../utils/constants');

const ensureRole = (role, allowedRoles) => {
  if (!allowedRoles.includes(role)) {
    const error = new Error('Access denied');
    error.status = 403;
    throw error;
  }
};

// Helper function to build doctor summary
const buildDoctorSummary = (doctor) => {
  if (!doctor) return null;
  const data = doctor.toObject ? doctor.toObject() : doctor;
  return {
    id: data._id,
    firstName: data.firstName,
    lastName: data.lastName,
    name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
    specialization: data.specialization,
    qualification: data.qualification || null,
    experienceYears: data.experienceYears || null,
    consultationFee: data.consultationFee || null,
    rating: data.rating || 0,
    profileImage: data.profileImage || null,
    clinicDetails: data.clinicDetails
      ? {
          name: data.clinicDetails.name || null,
          address: data.clinicDetails.address || null,
        }
      : null,
    languages: data.languages || [],
    consultationModes: data.consultationModes || [],
  };
};

// Helper function to build laboratory summary
const buildLaboratorySummary = (lab) => {
  if (!lab) return null;
  const data = lab.toObject ? lab.toObject() : lab;
  return {
    id: data._id,
    labName: data.labName,
    ownerName: data.ownerName || null,
    rating: data.rating || 0,
    profileImage: data.profileImage || null,
    address: data.address || null,
    servicesOffered: data.servicesOffered || [],
    timings: data.timings || [],
    operatingHours: data.operatingHours || null,
    phone: data.phone || null,
    email: data.email || null,
  };
};

// Helper function to build pharmacy summary
const buildPharmacySummary = (pharmacy) => {
  if (!pharmacy) return null;
  const data = pharmacy.toObject ? pharmacy.toObject() : pharmacy;
  return {
    id: data._id,
    pharmacyName: data.pharmacyName,
    ownerName: data.ownerName || null,
    rating: data.rating || 0,
    profileImage: data.profileImage || null,
    address: data.address || null,
    deliveryOptions: data.deliveryOptions || [],
    serviceRadiusKm: data.serviceRadiusKm || 0,
    timings: data.timings || [],
    phone: data.phone || null,
    email: data.email || null,
  };
};

// GET /api/patients/favorites/doctors
exports.getFavoriteDoctors = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const patient = await Patient.findById(req.auth.id).populate({
    path: 'favorites.doctors',
    match: { status: APPROVAL_STATUS.APPROVED, isActive: true },
    select:
      'firstName lastName specialization qualification experienceYears consultationFee rating profileImage clinicDetails languages consultationModes',
  });

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found',
    });
  }

  // Get review stats for each doctor
  const doctorIds = (patient.favorites.doctors || []).map((d) => d._id);
  const reviewStats = await Review.aggregate([
    {
      $match: {
        targetRole: ROLES.DOCTOR,
        target: { $in: doctorIds },
      },
    },
    {
      $group: {
        _id: '$target',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const statsMap = {};
  reviewStats.forEach((stat) => {
    statsMap[stat._id.toString()] = {
      averageRating: Math.round(stat.averageRating * 10) / 10,
      totalReviews: stat.totalReviews,
    };
  });

  const doctors = (patient.favorites.doctors || []).map((doctor) => {
    const doctorData = buildDoctorSummary(doctor);
    const stats = statsMap[doctor._id.toString()] || {
      averageRating: doctor.rating || 0,
      totalReviews: 0,
    };
    return {
      ...doctorData,
      reviewStats: stats,
    };
  });

  res.json({
    success: true,
    count: doctors.length,
    doctors,
  });
});

// POST /api/patients/favorites/doctors/:doctorId
exports.addFavoriteDoctor = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const { doctorId } = req.params;

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found',
    });
  }

  if (doctor.status !== APPROVAL_STATUS.APPROVED || !doctor.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Doctor is not available',
    });
  }

  const patient = await Patient.findById(req.auth.id);
  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found',
    });
  }

  if (!patient.favorites) {
    patient.favorites = {
      doctors: [],
      laboratories: [],
      pharmacies: [],
    };
  }

  if (!patient.favorites.doctors) {
    patient.favorites.doctors = [];
  }

  // Check if already favorited (convert to string for comparison)
  const doctorIds = patient.favorites.doctors.map((id) => id.toString());
  if (doctorIds.includes(doctorId.toString())) {
    return res.status(409).json({
      success: false,
      message: 'Doctor is already in favorites',
    });
  }

  patient.favorites.doctors.push(doctorId);
  await patient.save();

  const populatedDoctor = await Doctor.findById(doctorId).select(
    'firstName lastName specialization qualification experienceYears consultationFee rating profileImage clinicDetails languages consultationModes'
  );

  res.status(201).json({
    success: true,
    message: 'Doctor added to favorites',
    doctor: buildDoctorSummary(populatedDoctor),
  });
});

// DELETE /api/patients/favorites/doctors/:doctorId
exports.removeFavoriteDoctor = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const { doctorId } = req.params;

  const patient = await Patient.findById(req.auth.id);
  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found',
    });
  }

  if (!patient.favorites || !patient.favorites.doctors) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found in favorites',
    });
  }

  // Find index using string comparison
  const doctorIds = patient.favorites.doctors.map((id) => id.toString());
  const index = doctorIds.indexOf(doctorId.toString());
  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found in favorites',
    });
  }

  patient.favorites.doctors.splice(index, 1);
  await patient.save();

  res.json({
    success: true,
    message: 'Doctor removed from favorites',
  });
});

// GET /api/patients/favorites/labs
exports.getFavoriteLabs = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const patient = await Patient.findById(req.auth.id).populate({
    path: 'favorites.laboratories',
    match: { status: APPROVAL_STATUS.APPROVED, isActive: true },
    select:
      'labName ownerName rating profileImage address servicesOffered timings operatingHours phone email',
  });

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found',
    });
  }

  // Get review stats for each laboratory
  const labIds = (patient.favorites.laboratories || []).map((l) => l._id);
  const reviewStats = await Review.aggregate([
    {
      $match: {
        targetRole: ROLES.LABORATORY,
        target: { $in: labIds },
      },
    },
    {
      $group: {
        _id: '$target',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const statsMap = {};
  reviewStats.forEach((stat) => {
    statsMap[stat._id.toString()] = {
      averageRating: Math.round(stat.averageRating * 10) / 10,
      totalReviews: stat.totalReviews,
    };
  });

  const laboratories = (patient.favorites.laboratories || []).map((lab) => {
    const labData = buildLaboratorySummary(lab);
    const stats = statsMap[lab._id.toString()] || {
      averageRating: lab.rating || 0,
      totalReviews: 0,
    };
    return {
      ...labData,
      reviewStats: stats,
    };
  });

  res.json({
    success: true,
    count: laboratories.length,
    laboratories,
  });
});

// POST /api/patients/favorites/labs/:labId
exports.addFavoriteLab = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const { labId } = req.params;

  const lab = await Laboratory.findById(labId);
  if (!lab) {
    return res.status(404).json({
      success: false,
      message: 'Laboratory not found',
    });
  }

  if (lab.status !== APPROVAL_STATUS.APPROVED || !lab.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Laboratory is not available',
    });
  }

  const patient = await Patient.findById(req.auth.id);
  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found',
    });
  }

  if (!patient.favorites) {
    patient.favorites = {
      doctors: [],
      laboratories: [],
      pharmacies: [],
    };
  }

  if (!patient.favorites.laboratories) {
    patient.favorites.laboratories = [];
  }

  // Check if already favorited (convert to string for comparison)
  const labIds = patient.favorites.laboratories.map((id) => id.toString());
  if (labIds.includes(labId.toString())) {
    return res.status(409).json({
      success: false,
      message: 'Laboratory is already in favorites',
    });
  }

  patient.favorites.laboratories.push(labId);
  await patient.save();

  const populatedLab = await Laboratory.findById(labId).select(
    'labName ownerName rating profileImage address servicesOffered timings operatingHours phone email'
  );

  res.status(201).json({
    success: true,
    message: 'Laboratory added to favorites',
    laboratory: buildLaboratorySummary(populatedLab),
  });
});

// DELETE /api/patients/favorites/labs/:labId
exports.removeFavoriteLab = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const { labId } = req.params;

  const patient = await Patient.findById(req.auth.id);
  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found',
    });
  }

  if (!patient.favorites || !patient.favorites.laboratories) {
    return res.status(404).json({
      success: false,
      message: 'Laboratory not found in favorites',
    });
  }

  // Find index using string comparison
  const labIds = patient.favorites.laboratories.map((id) => id.toString());
  const index = labIds.indexOf(labId.toString());
  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Laboratory not found in favorites',
    });
  }

  patient.favorites.laboratories.splice(index, 1);
  await patient.save();

  res.json({
    success: true,
    message: 'Laboratory removed from favorites',
  });
});

// GET /api/patients/favorites/pharmacies
exports.getFavoritePharmacies = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const patient = await Patient.findById(req.auth.id).populate({
    path: 'favorites.pharmacies',
    match: { status: APPROVAL_STATUS.APPROVED, isActive: true },
    select:
      'pharmacyName ownerName rating profileImage address deliveryOptions serviceRadiusKm timings phone email',
  });

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found',
    });
  }

  // Get review stats for each pharmacy
  const pharmacyIds = (patient.favorites.pharmacies || []).map((p) => p._id);
  const reviewStats = await Review.aggregate([
    {
      $match: {
        targetRole: ROLES.PHARMACY,
        target: { $in: pharmacyIds },
      },
    },
    {
      $group: {
        _id: '$target',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const statsMap = {};
  reviewStats.forEach((stat) => {
    statsMap[stat._id.toString()] = {
      averageRating: Math.round(stat.averageRating * 10) / 10,
      totalReviews: stat.totalReviews,
    };
  });

  const pharmacies = (patient.favorites.pharmacies || []).map((pharmacy) => {
    const pharmacyData = buildPharmacySummary(pharmacy);
    const stats = statsMap[pharmacy._id.toString()] || {
      averageRating: pharmacy.rating || 0,
      totalReviews: 0,
    };
    return {
      ...pharmacyData,
      reviewStats: stats,
    };
  });

  res.json({
    success: true,
    count: pharmacies.length,
    pharmacies,
  });
});

// POST /api/patients/favorites/pharmacies/:pharmacyId
exports.addFavoritePharmacy = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const { pharmacyId } = req.params;

  const pharmacy = await Pharmacy.findById(pharmacyId);
  if (!pharmacy) {
    return res.status(404).json({
      success: false,
      message: 'Pharmacy not found',
    });
  }

  if (pharmacy.status !== APPROVAL_STATUS.APPROVED || !pharmacy.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Pharmacy is not available',
    });
  }

  const patient = await Patient.findById(req.auth.id);
  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found',
    });
  }

  if (!patient.favorites) {
    patient.favorites = {
      doctors: [],
      laboratories: [],
      pharmacies: [],
    };
  }

  if (!patient.favorites.pharmacies) {
    patient.favorites.pharmacies = [];
  }

  // Check if already favorited (convert to string for comparison)
  const pharmacyIds = patient.favorites.pharmacies.map((id) => id.toString());
  if (pharmacyIds.includes(pharmacyId.toString())) {
    return res.status(409).json({
      success: false,
      message: 'Pharmacy is already in favorites',
    });
  }

  patient.favorites.pharmacies.push(pharmacyId);
  await patient.save();

  const populatedPharmacy = await Pharmacy.findById(pharmacyId).select(
    'pharmacyName ownerName rating profileImage address deliveryOptions serviceRadiusKm timings phone email'
  );

  res.status(201).json({
    success: true,
    message: 'Pharmacy added to favorites',
    pharmacy: buildPharmacySummary(populatedPharmacy),
  });
});

// DELETE /api/patients/favorites/pharmacies/:pharmacyId
exports.removeFavoritePharmacy = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const { pharmacyId } = req.params;

  const patient = await Patient.findById(req.auth.id);
  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found',
    });
  }

  if (!patient.favorites || !patient.favorites.pharmacies) {
    return res.status(404).json({
      success: false,
      message: 'Pharmacy not found in favorites',
    });
  }

  // Find index using string comparison
  const pharmacyIds = patient.favorites.pharmacies.map((id) => id.toString());
  const index = pharmacyIds.indexOf(pharmacyId.toString());
  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Pharmacy not found in favorites',
    });
  }

  patient.favorites.pharmacies.splice(index, 1);
  await patient.save();

  res.json({
    success: true,
    message: 'Pharmacy removed from favorites',
  });
});

