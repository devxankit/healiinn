const asyncHandler = require('../../middleware/asyncHandler');
const mongoose = require('mongoose');
const { ROLES, PHARMACY_LEAD_STATUS } = require('../../utils/constants');
const { getPaginationParams, getPaginationMeta } = require('../../utils/pagination');
const { getCache, setCache, generateCacheKey, deleteCacheByPattern } = require('../../utils/cache');
const PharmacyLead = require('../../models/PharmacyLead');
const Patient = require('../../models/Patient');

const toObjectId = (value) =>
  typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value;

const ensureRole = (role, allowed) => {
  if (!allowed.includes(role)) {
    const error = new Error('You do not have access to this resource');
    error.status = 403;
    throw error;
  }
};

// List Patients (pharmacy ke orders wale)
exports.listPatients = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PHARMACY]);

  const pharmacyId = toObjectId(req.auth.id);
  const { page, limit, skip } = getPaginationParams(req.query);
  const { search, from, to } = req.query;

  // Get distinct patients from orders
  const orderQuery = {
    $or: [
      { acceptedBy: pharmacyId },
      { preferredPharmacies: pharmacyId },
    ],
    status: { $nin: [PHARMACY_LEAD_STATUS.CANCELLED] },
  };

  // Date range filter
  if (from || to) {
    orderQuery.createdAt = {};
    if (from) {
      orderQuery.createdAt.$gte = new Date(from);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      orderQuery.createdAt.$lte = toDate;
    }
  }

  // Get distinct patient IDs
  const patientIds = await PharmacyLead.distinct('patient', orderQuery);

  if (patientIds.length === 0) {
    return res.json({
      success: true,
      pagination: getPaginationMeta(0, page, limit),
      patients: [],
    });
  }

  // Build patient search query
  const patientQuery = { _id: { $in: patientIds } };

  if (search && search.trim().length >= 2) {
    const searchRegex = { $regex: search.trim(), $options: 'i' };
    patientQuery.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { phone: searchRegex },
      { email: searchRegex },
    ];
  }

  // Get total count
  const total = await Patient.countDocuments(patientQuery);

  // Get patients with order statistics (optimized query)
  const patients = await Patient.find(patientQuery)
    .select('firstName lastName phone email gender dateOfBirth address profileImage _id')
    .sort({ firstName: 1, lastName: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Get order statistics for each patient
  const patientsWithStats = await Promise.all(
    patients.map(async (patient) => {
      // Optimized query with explicit field selection and index usage
      const patientOrders = await PharmacyLead.find({
        patient: patient._id,
        $or: [
          { acceptedBy: pharmacyId },
          { preferredPharmacies: pharmacyId },
        ],
        status: { $nin: [PHARMACY_LEAD_STATUS.CANCELLED] },
      })
        .select('status createdAt billingSummary.totalAmount')
        .sort({ createdAt: -1 })
        .lean();

      const totalOrders = patientOrders.length;
      const completedOrders = patientOrders.filter(
        (o) => o.status === PHARMACY_LEAD_STATUS.COMPLETED
      ).length;
      const totalSpent = patientOrders.reduce((sum, order) => {
        return sum + (order.billingSummary?.totalAmount || 0);
      }, 0);
      const lastOrderDate = patientOrders.length > 0
        ? patientOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt
        : null;

      return {
        id: patient._id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        phone: patient.phone,
        email: patient.email,
        gender: patient.gender || null,
        dateOfBirth: patient.dateOfBirth || null,
        address: patient.address || null,
        profileImage: patient.profileImage || null,
        statistics: {
          totalOrders,
          completedOrders,
          totalSpent,
          lastOrderDate,
        },
      };
    })
  );

  res.json({
    success: true,
    pagination: getPaginationMeta(total, page, limit),
    patients: patientsWithStats,
  });
});

// Get Patient Details
exports.getPatientDetails = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PHARMACY]);

  const { patientId } = req.params;
  const pharmacyId = toObjectId(req.auth.id);

  // Verify patient has orders with this pharmacy
  const hasOrders = await PharmacyLead.findOne({
    patient: patientId,
    $or: [
      { acceptedBy: pharmacyId },
      { preferredPharmacies: pharmacyId },
    ],
  });

  if (!hasOrders) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found or no orders found for this pharmacy.',
    });
  }

  // Get patient details with caching
  const patientCacheKey = generateCacheKey('pharmacy:patient', {
    pharmacyId: pharmacyId.toString(),
    patientId: patientId.toString(),
  });

  let patient = await getCache(patientCacheKey);
  if (!patient) {
    patient = await Patient.findById(patientId)
      .select('firstName lastName phone email gender dateOfBirth address profileImage _id')
      .lean();

    if (patient) {
      // Cache for 5 minutes
      await setCache(patientCacheKey, patient, 300);
    }
  }

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found.',
    });
  }

  // Get order statistics (optimized query with index)
  const orders = await PharmacyLead.find({
    patient: patientId,
    $or: [
      { acceptedBy: pharmacyId },
      { preferredPharmacies: pharmacyId },
    ],
  })
    .select('status createdAt updatedAt billingSummary.totalAmount billingSummary.deliveryCharge medicines remarks')
    .sort({ createdAt: -1 })
    .lean();

  const totalOrders = orders.length;
  const completedOrders = orders.filter(
    (o) => o.status === PHARMACY_LEAD_STATUS.COMPLETED
  ).length;
  const totalSpent = orders.reduce((sum, order) => {
    return sum + (order.billingSummary?.totalAmount || 0);
  }, 0);
  const lastOrderDate = orders.length > 0 ? orders[0].createdAt : null;

  res.json({
    success: true,
    patient: {
      id: patient._id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      phone: patient.phone,
      email: patient.email,
      gender: patient.gender || null,
      dateOfBirth: patient.dateOfBirth || null,
      address: patient.address || null,
      profileImage: patient.profileImage || null,
      statistics: {
        totalOrders,
        completedOrders,
        totalSpent,
        lastOrderDate,
      },
    },
  });
});

// Search Patients
exports.searchPatients = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PHARMACY]);

  const pharmacyId = toObjectId(req.auth.id);
  const { page, limit, skip } = getPaginationParams(req.query, 20, 50);
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Search query must be at least 2 characters long.',
    });
  }

  const searchTerm = q.trim();
  const searchRegex = { $regex: searchTerm, $options: 'i' };

  // Get distinct patient IDs from orders
  const patientIds = await PharmacyLead.distinct('patient', {
    $or: [
      { acceptedBy: pharmacyId },
      { preferredPharmacies: pharmacyId },
    ],
    status: { $nin: [PHARMACY_LEAD_STATUS.CANCELLED] },
  });

  if (patientIds.length === 0) {
    return res.json({
      success: true,
      pagination: getPaginationMeta(0, page, limit),
      patients: [],
    });
  }

  // Search patients
  const patientQuery = {
    _id: { $in: patientIds },
    $or: [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { phone: searchRegex },
      { email: searchRegex },
    ],
  };

  const total = await Patient.countDocuments(patientQuery);

  const patients = await Patient.find(patientQuery)
    .select('firstName lastName phone email gender profileImage _id')
    .sort({ firstName: 1, lastName: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  res.json({
    success: true,
    pagination: getPaginationMeta(total, page, limit),
    patients: patients.map((p) => ({
      id: p._id,
      firstName: p.firstName,
      lastName: p.lastName,
      phone: p.phone,
      email: p.email,
      gender: p.gender || null,
      profileImage: p.profileImage || null,
    })),
  });
});

// Get Patient Order History
exports.getPatientOrderHistory = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PHARMACY]);

  const { patientId } = req.params;
  const pharmacyId = toObjectId(req.auth.id);
  const { page, limit, skip } = getPaginationParams(req.query);
  const { status, from, to } = req.query;

  // Verify patient has orders with this pharmacy
  const hasOrders = await PharmacyLead.findOne({
    patient: patientId,
    $or: [
      { acceptedBy: pharmacyId },
      { preferredPharmacies: pharmacyId },
    ],
  });

  if (!hasOrders) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found or no orders found for this pharmacy.',
    });
  }

  // Build query
  const query = {
    patient: patientId,
    $or: [
      { acceptedBy: pharmacyId },
      { preferredPharmacies: pharmacyId },
    ],
  };

  // Status filter
  if (status && status !== 'all' && Object.values(PHARMACY_LEAD_STATUS).includes(status)) {
    query.status = status;
  }

  // Date range filter
  if (from || to) {
    query.createdAt = {};
    if (from) {
      query.createdAt.$gte = new Date(from);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      query.createdAt.$lte = toDate;
    }
  }

  // Get total count
  const total = await PharmacyLead.countDocuments(query);

  // Get orders (optimized with explicit field selection)
  const orders = await PharmacyLead.find(query)
    .populate('doctor', 'firstName lastName specialization _id')
    .populate('prescription', 'diagnosis medications issuedAt _id')
    .select('status createdAt updatedAt billingSummary.totalAmount billingSummary.deliveryCharge medicines remarks statusHistory payment doctor prescription _id')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  res.json({
    success: true,
    pagination: getPaginationMeta(total, page, limit),
    orders: orders.map((order) => ({
      id: order._id,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      billingSummary: order.billingSummary || null,
      medicines: order.medicines || [],
      remarks: order.remarks || null,
      doctor: order.doctor
        ? {
            id: order.doctor._id,
            firstName: order.doctor.firstName,
            lastName: order.doctor.lastName,
            specialization: order.doctor.specialization || null,
          }
        : null,
      prescription: order.prescription
        ? {
            id: order.prescription._id,
            diagnosis: order.prescription.diagnosis || null,
            issuedAt: order.prescription.issuedAt || null,
          }
        : null,
    })),
  });
});

