const asyncHandler = require('../../middleware/asyncHandler');
const Doctor = require('../../models/Doctor');
const Specialty = require('../../models/Specialty');
const Review = require('../../models/Review');
const Session = require('../../models/Session');
const { APPROVAL_STATUS } = require('../../utils/constants');
const { checkSlotAvailability, getAvailabilityForDate } = require('../../services/sessionService');
const { calculateQueueETAs } = require('../../services/etaService');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const buildSearchFilter = (search, fields = []) => {
  if (!search || !search.trim() || !fields.length) return {};
  const regex = new RegExp(search.trim(), 'i');
  return { $or: fields.map((field) => ({ [field]: regex })) };
};

// GET /api/patients/doctors
exports.getDoctors = asyncHandler(async (req, res) => {
  const { search, specialty, city, state, rating } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { status: APPROVAL_STATUS.APPROVED, isActive: true };

  if (specialty && specialty !== 'undefined' && specialty.trim()) {
    filter.specialization = new RegExp(specialty.trim(), 'i');
  }
  if (city) filter['clinicDetails.address.city'] = new RegExp(city.trim(), 'i');
  if (state) filter['clinicDetails.address.state'] = new RegExp(state.trim(), 'i');
  if (rating) filter.rating = { $gte: parseFloat(rating) };

  // Only build search filter if search is provided and not "undefined"
  const searchFilter = (search && search !== 'undefined' && search.trim()) 
    ? buildSearchFilter(search, [
        'firstName',
        'lastName',
        'specialization',
        'clinicDetails.name',
      ])
    : {};

  const finalFilter = Object.keys(searchFilter).length
    ? { $and: [filter, searchFilter] }
    : filter;

  const [doctors, total] = await Promise.all([
    Doctor.find(finalFilter)
      .select('firstName lastName specialization profileImage consultationFee rating clinicDetails bio experienceYears reviewCount')
      .sort({ rating: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Doctor.countDocuments(finalFilter),
  ]);
  
  console.log(`📋 Fetched ${doctors.length} doctors for patient`, {
    specialty: specialty || 'all',
    search: search || 'none',
    total,
  });

  return res.status(200).json({
    success: true,
    data: {
      items: doctors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/patients/doctors/:id
exports.getDoctorById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const doctor = await Doctor.findById(id).select('-password -otp -otpExpires');

  if (!doctor || doctor.status !== APPROVAL_STATUS.APPROVED) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found',
    });
  }

  // Get reviews
  const reviews = await Review.find({ doctorId: id, status: 'approved' })
    .populate('patientId', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(10);

  // Calculate review stats
  const reviewStats = await Review.aggregate([
    { $match: { doctorId: doctor._id, status: 'approved' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating',
        },
      },
    },
  ]);

  // Get today's session for ETA calculation
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const todaySession = await Session.findOne({
    doctorId: id,
    date: { $gte: today, $lt: todayEnd },
    status: { $in: ['scheduled', 'live', 'paused'] },
  });

  let currentToken = 0;
  let isServing = false;
  let eta = null;

  if (todaySession) {
    currentToken = todaySession.currentToken || 0;
    isServing = todaySession.status === 'live' && !todaySession.isPaused;
    
    // Calculate ETA for next patient (if any)
    if (todaySession.currentToken < todaySession.maxTokens) {
      const etas = await calculateQueueETAs(todaySession._id);
      const nextPatient = etas.find(e => e.patientsAhead === 0);
      if (nextPatient) {
        eta = `${nextPatient.estimatedWaitMinutes} min`;
      }
    }
  }

  return res.status(200).json({
    success: true,
    data: {
      doctor,
      reviews,
      reviewStats: reviewStats[0] || { averageRating: 0, totalReviews: 0 },
      queueInfo: {
        currentToken,
        isServing,
        eta,
      },
    },
  });
});

// GET /api/patients/specialties
exports.getSpecialties = asyncHandler(async (req, res) => {
  const specialties = await Specialty.find({ isActive: true })
    .select('name description icon doctorCount')
    .sort({ name: 1 });

  return res.status(200).json({
    success: true,
    data: specialties,
  });
});

// GET /api/patients/specialties/:id/doctors
exports.getSpecialtyDoctors = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page, limit, skip } = buildPagination(req);

  const specialty = await Specialty.findById(id);
  if (!specialty) {
    return res.status(404).json({
      success: false,
      message: 'Specialty not found',
    });
  }

  const [doctors, total] = await Promise.all([
    Doctor.find({
      specialization: new RegExp(specialty.name, 'i'),
      status: APPROVAL_STATUS.APPROVED,
      isActive: true,
    })
      .select('firstName lastName specialization profileImage consultationFee rating')
      .sort({ rating: -1 })
      .skip(skip)
      .limit(limit),
    Doctor.countDocuments({
      specialization: new RegExp(specialty.name, 'i'),
      status: APPROVAL_STATUS.APPROVED,
      isActive: true,
    }),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: doctors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/patients/locations
exports.getLocations = asyncHandler(async (req, res) => {
  // Get unique cities and states from doctors, pharmacies, and laboratories
  const [doctorLocations, pharmacyLocations, labLocations] = await Promise.all([
    Doctor.distinct('clinicDetails.address.city', {
      status: APPROVAL_STATUS.APPROVED,
      isActive: true,
      'clinicDetails.address.city': { $exists: true, $ne: '' },
    }),
    require('../../models/Pharmacy').distinct('address.city', {
      status: APPROVAL_STATUS.APPROVED,
      isActive: true,
      'address.city': { $exists: true, $ne: '' },
    }),
    require('../../models/Laboratory').distinct('address.city', {
      status: APPROVAL_STATUS.APPROVED,
      isActive: true,
      'address.city': { $exists: true, $ne: '' },
    }),
  ]);

  const cities = [...new Set([...doctorLocations, ...pharmacyLocations, ...labLocations])].sort();

  const [doctorStates, pharmacyStates, labStates] = await Promise.all([
    Doctor.distinct('clinicDetails.address.state', {
      status: APPROVAL_STATUS.APPROVED,
      isActive: true,
      'clinicDetails.address.state': { $exists: true, $ne: '' },
    }),
    require('../../models/Pharmacy').distinct('address.state', {
      status: APPROVAL_STATUS.APPROVED,
      isActive: true,
      'address.state': { $exists: true, $ne: '' },
    }),
    require('../../models/Laboratory').distinct('address.state', {
      status: APPROVAL_STATUS.APPROVED,
      isActive: true,
      'address.state': { $exists: true, $ne: '' },
    }),
  ]);

  const states = [...new Set([...doctorStates, ...pharmacyStates, ...labStates])].sort();

  return res.status(200).json({
    success: true,
    data: {
      cities,
      states,
    },
  });
});

// GET /api/patients/doctors/:id/slots - Check slot availability for a date
exports.checkDoctorSlotAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'Date is required (format: YYYY-MM-DD)',
    });
  }

  const doctor = await Doctor.findById(id);
  if (!doctor || doctor.status !== APPROVAL_STATUS.APPROVED) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found',
    });
  }

  const appointmentDate = new Date(date);
  if (isNaN(appointmentDate.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format',
    });
  }

  const slotCheck = await checkSlotAvailability(id, appointmentDate);

  return res.status(200).json({
    success: true,
    data: slotCheck,
  });
});

