const asyncHandler = require('../../middleware/asyncHandler');
const mongoose = require('mongoose');
const { ROLES, LAB_LEAD_STATUS } = require('../../utils/constants');
const { getPaginationParams, getPaginationMeta } = require('../../utils/pagination');
const { getCache, setCache, generateCacheKey } = require('../../utils/cache');
const LabLead = require('../../models/LabLead');
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

// List Patients (laboratory ke leads wale)
exports.listPatients = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.LABORATORY]);

  const laboratoryId = toObjectId(req.auth.id);
  const { page, limit, skip } = getPaginationParams(req.query);
  const { search, from, to } = req.query;

  // Get distinct patients from leads
  const leadQuery = {
    acceptedBy: laboratoryId,
    status: { $nin: [LAB_LEAD_STATUS.CANCELLED] },
  };

  // Date range filter
  if (from || to) {
    leadQuery.createdAt = {};
    if (from) {
      leadQuery.createdAt.$gte = new Date(from);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      leadQuery.createdAt.$lte = toDate;
    }
  }

  // Get distinct patient IDs
  const patientIds = await LabLead.distinct('patient', leadQuery);

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

  // Get patients with lead statistics (optimized query)
  const patients = await Patient.find(patientQuery)
    .select('firstName lastName phone email gender dateOfBirth address profileImage _id')
    .sort({ firstName: 1, lastName: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Get lead statistics for each patient
  const patientsWithStats = await Promise.all(
    patients.map(async (patient) => {
      // Optimized query with explicit field selection and index usage
      const patientLeads = await LabLead.find({
        patient: patient._id,
        acceptedBy: laboratoryId,
        status: { $nin: [LAB_LEAD_STATUS.CANCELLED] },
      })
        .select('status createdAt billingSummary.totalAmount')
        .sort({ createdAt: -1 })
        .lean();

      const totalLeads = patientLeads.length;
      const completedLeads = patientLeads.filter(
        (l) => l.status === LAB_LEAD_STATUS.COMPLETED
      ).length;
      const totalSpent = patientLeads.reduce((sum, lead) => {
        return sum + (lead.billingSummary?.totalAmount || 0);
      }, 0);
      const lastLeadDate = patientLeads.length > 0
        ? patientLeads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt
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
          totalLeads,
          completedLeads,
          totalSpent,
          lastLeadDate,
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
  ensureRole(req.auth.role, [ROLES.LABORATORY]);

  const { patientId } = req.params;
  const laboratoryId = toObjectId(req.auth.id);

  // Verify patient has leads with this laboratory
  const hasLeads = await LabLead.findOne({
    patient: patientId,
    acceptedBy: laboratoryId,
  });

  if (!hasLeads) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found or no leads found for this laboratory.',
    });
  }

  // Get patient details with caching
  const patientCacheKey = generateCacheKey('laboratory:patient', {
    laboratoryId: laboratoryId.toString(),
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

  // Get lead statistics (optimized query with index)
  const leads = await LabLead.find({
    patient: patientId,
    acceptedBy: laboratoryId,
  })
    .select('status createdAt updatedAt billingSummary.totalAmount billingSummary.homeCollectionCharge tests remarks reportDetails')
    .sort({ createdAt: -1 })
    .lean();

  const totalLeads = leads.length;
  const completedLeads = leads.filter(
    (l) => l.status === LAB_LEAD_STATUS.COMPLETED
  ).length;
  const totalSpent = leads.reduce((sum, lead) => {
    return sum + (lead.billingSummary?.totalAmount || 0);
  }, 0);
  const lastLeadDate = leads.length > 0 ? leads[0].createdAt : null;

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
        totalLeads,
        completedLeads,
        totalSpent,
        lastLeadDate,
      },
    },
  });
});

// Search Patients
exports.searchPatients = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.LABORATORY]);

  const laboratoryId = toObjectId(req.auth.id);
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

  // Get distinct patient IDs from leads
  const patientIds = await LabLead.distinct('patient', {
    acceptedBy: laboratoryId,
    status: { $nin: [LAB_LEAD_STATUS.CANCELLED] },
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

// Get Patient Test History
exports.getPatientTestHistory = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.LABORATORY]);

  const { patientId } = req.params;
  const laboratoryId = toObjectId(req.auth.id);
  const { page, limit, skip } = getPaginationParams(req.query);
  const { status, from, to } = req.query;

  // Verify patient has leads with this laboratory
  const hasLeads = await LabLead.findOne({
    patient: patientId,
    acceptedBy: laboratoryId,
  });

  if (!hasLeads) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found or no leads found for this laboratory.',
    });
  }

  // Build query
  const query = {
    patient: patientId,
    acceptedBy: laboratoryId,
  };

  // Status filter
  if (status && status !== 'all' && Object.values(LAB_LEAD_STATUS).includes(status)) {
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
  const total = await LabLead.countDocuments(query);

  // Get leads (optimized with explicit field selection)
  const leads = await LabLead.find(query)
    .populate('doctor', 'firstName lastName specialization _id')
    .populate('prescription', 'diagnosis investigations issuedAt _id')
    .select('status createdAt updatedAt billingSummary.totalAmount billingSummary.homeCollectionCharge tests remarks reportDetails statusHistory payment doctor prescription _id')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  res.json({
    success: true,
    pagination: getPaginationMeta(total, page, limit),
    leads: leads.map((lead) => ({
      id: lead._id,
      status: lead.status,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      billingSummary: lead.billingSummary || null,
      tests: lead.tests || [],
      remarks: lead.remarks || null,
      reportDetails: lead.reportDetails || null,
      doctor: lead.doctor
        ? {
            id: lead.doctor._id,
            firstName: lead.doctor.firstName,
            lastName: lead.doctor.lastName,
            specialization: lead.doctor.specialization || null,
          }
        : null,
      prescription: lead.prescription
        ? {
            id: lead.prescription._id,
            diagnosis: lead.prescription.diagnosis || null,
            issuedAt: lead.prescription.issuedAt || null,
          }
        : null,
    })),
  });
});

