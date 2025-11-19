const asyncHandler = require('../../middleware/asyncHandler');
const { ensureRole } = require('../../middleware/authMiddleware');
const { ROLES, LAB_LEAD_STATUS, PHARMACY_LEAD_STATUS } = require('../../utils/constants');
const LabLead = require('../../models/LabLead');
const PharmacyLead = require('../../models/PharmacyLead');
const Payment = require('../../models/Payment');
const LabReport = require('../../models/LabReport');

const toObjectId = (id) => {
  if (!id) return null;
  if (typeof id === 'string') {
    return require('mongoose').Types.ObjectId(id);
  }
  return id;
};

/**
 * List all lab orders for patient with filters
 * GET /api/patients/orders/lab
 */
exports.listLabOrders = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const patientId = toObjectId(req.auth.id);
  const { status, from, to, page = 1, limit = 20 } = req.query;

  // Build query
  const query = { patient: patientId };

  // Filter by status
  if (status && status !== 'all' && Object.values(LAB_LEAD_STATUS).includes(status)) {
    query.status = status;
  }

  // Filter by date range
  if (from || to) {
    query.createdAt = {};
    if (from) {
      query.createdAt.$gte = new Date(from);
    }
    if (to) {
      query.createdAt.$lte = new Date(to);
    }
  }

  const pageNum = Math.max(Number.parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [labLeads, total] = await Promise.all([
    LabLead.find(query)
      .populate('doctor', 'firstName lastName phone email specialization')
      .populate('prescription', 'diagnosis investigations issuedAt')
      .populate('acceptedBy', 'labName phone email address')
      .populate('preferredLaboratories', 'labName phone email address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    LabLead.countDocuments(query),
  ]);

  // Get payment status for each lead
  const leadIds = labLeads.map((lead) => lead._id);
  const payments = await Payment.find({
    'metadata.labLeadId': { $in: leadIds.map((id) => id.toString()) },
    user: patientId,
    userModel: 'Patient',
  })
    .select('status amount metadata createdAt')
    .lean();

  const paymentMap = payments.reduce((acc, payment) => {
    const leadId = payment.metadata?.labLeadId;
    if (leadId) {
      acc[leadId] = payment;
    }
    return acc;
  }, {});

  // Format response
  const orders = labLeads.map((lead) => {
    const payment = paymentMap[lead._id.toString()];
    const acceptedLab = lead.acceptedBy || lead.preferredLaboratories?.[0];

    return {
      id: lead._id,
      orderNumber: `LAB-${lead._id.toString().slice(-8).toUpperCase()}`,
      status: lead.status,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      
      // Doctor info
      doctor: lead.doctor
        ? {
            id: lead.doctor._id,
            name: `${lead.doctor.firstName || ''} ${lead.doctor.lastName || ''}`.trim(),
            phone: lead.doctor.phone,
            email: lead.doctor.email,
            specialization: lead.doctor.specialization,
          }
        : null,

      // Prescription info
      prescription: lead.prescription
        ? {
            id: lead.prescription._id,
            diagnosis: lead.prescription.diagnosis,
            issuedAt: lead.prescription.issuedAt,
            testsCount: lead.tests?.length || 0,
          }
        : null,

      // Lab info
      acceptedLab: acceptedLab
        ? {
            id: acceptedLab._id,
            name: acceptedLab.labName,
            phone: acceptedLab.phone,
            email: acceptedLab.email,
            address: acceptedLab.address,
          }
        : null,

      // Tests
      tests: lead.tests?.map((test) => ({
        testName: test.testName,
        description: test.description,
        notes: test.notes,
        priority: test.priority,
        available: test.available,
        price: test.price || 0,
        availabilityNotes: test.availabilityNotes,
      })) || [],

      // Billing summary
      billing: lead.billingSummary
        ? {
            totalAmount: lead.billingSummary.totalAmount || 0,
            homeCollectionCharge: lead.billingSummary.homeCollectionCharge || 0,
            currency: lead.billingSummary.currency || 'INR',
            grandTotal:
              (lead.billingSummary.totalAmount || 0) +
              (lead.billingSummary.homeCollectionCharge || 0),
            notes: lead.billingSummary.notes,
            updatedAt: lead.billingSummary.updatedAt,
          }
        : null,

      // Payment status
      payment: payment
        ? {
            status: payment.status,
            amount: payment.amount,
            paidAt: payment.createdAt,
          }
        : lead.payment?.paid
          ? {
              status: lead.payment.paymentStatus || 'paid',
              amount: lead.billingSummary?.totalAmount || 0,
              paidAt: lead.payment.paidAt,
            }
          : null,

      // Report status
      hasReport: !!lead.reportDetails?.fileUrl,
      reportUploadedAt: lead.reportDetails?.uploadedAt || null,

      // Status history count
      statusHistoryCount: lead.statusHistory?.length || 0,
    };
  });

  res.json({
    success: true,
    orders,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * List all pharmacy orders for patient with filters
 * GET /api/patients/orders/pharmacy
 */
exports.listPharmacyOrders = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const patientId = toObjectId(req.auth.id);
  const { status, from, to, page = 1, limit = 20 } = req.query;

  // Build query
  const query = { patient: patientId };

  // Filter by status
  if (status && status !== 'all' && Object.values(PHARMACY_LEAD_STATUS).includes(status)) {
    query.status = status;
  }

  // Filter by date range
  if (from || to) {
    query.createdAt = {};
    if (from) {
      query.createdAt.$gte = new Date(from);
    }
    if (to) {
      query.createdAt.$lte = new Date(to);
    }
  }

  const pageNum = Math.max(Number.parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [pharmacyLeads, total] = await Promise.all([
    PharmacyLead.find(query)
      .populate('doctor', 'firstName lastName phone email specialization')
      .populate('prescription', 'diagnosis medications issuedAt')
      .populate('acceptedBy', 'pharmacyName phone email address')
      .populate('preferredPharmacies', 'pharmacyName phone email address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    PharmacyLead.countDocuments(query),
  ]);

  // Get payment status for each lead
  const leadIds = pharmacyLeads.map((lead) => lead._id);
  const payments = await Payment.find({
    'metadata.pharmacyLeadId': { $in: leadIds.map((id) => id.toString()) },
    user: patientId,
    userModel: 'Patient',
  })
    .select('status amount metadata createdAt')
    .lean();

  const paymentMap = payments.reduce((acc, payment) => {
    const leadId = payment.metadata?.pharmacyLeadId;
    if (leadId) {
      acc[leadId] = payment;
    }
    return acc;
  }, {});

  // Format response
  const orders = pharmacyLeads.map((lead) => {
    const payment = paymentMap[lead._id.toString()];
    const acceptedPharmacy = lead.acceptedBy || lead.preferredPharmacies?.[0];

    return {
      id: lead._id,
      orderNumber: `PHAR-${lead._id.toString().slice(-8).toUpperCase()}`,
      status: lead.status,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,

      // Doctor info
      doctor: lead.doctor
        ? {
            id: lead.doctor._id,
            name: `${lead.doctor.firstName || ''} ${lead.doctor.lastName || ''}`.trim(),
            phone: lead.doctor.phone,
            email: lead.doctor.email,
            specialization: lead.doctor.specialization,
          }
        : null,

      // Prescription info
      prescription: lead.prescription
        ? {
            id: lead.prescription._id,
            diagnosis: lead.prescription.diagnosis,
            issuedAt: lead.prescription.issuedAt,
            medicinesCount: lead.medicines?.length || 0,
          }
        : null,

      // Pharmacy info
      acceptedPharmacy: acceptedPharmacy
        ? {
            id: acceptedPharmacy._id,
            name: acceptedPharmacy.pharmacyName,
            phone: acceptedPharmacy.phone,
            email: acceptedPharmacy.email,
            address: acceptedPharmacy.address,
          }
        : null,

      // Medicines
      medicines: lead.medicines?.map((medicine) => ({
        name: medicine.name,
        dosage: medicine.dosage,
        quantity: medicine.quantity,
        instructions: medicine.instructions,
        priority: medicine.priority,
        available: medicine.available,
        price: medicine.price || 0,
        availableQuantity: medicine.availableQuantity || 0,
        availabilityNotes: medicine.availabilityNotes,
      })) || [],

      // Billing summary
      billing: lead.billingSummary
        ? {
            totalAmount: lead.billingSummary.totalAmount || 0,
            deliveryCharge: lead.billingSummary.deliveryCharge || 0,
            currency: lead.billingSummary.currency || 'INR',
            grandTotal:
              (lead.billingSummary.totalAmount || 0) +
              (lead.billingSummary.deliveryCharge || 0),
            notes: lead.billingSummary.notes,
            updatedAt: lead.billingSummary.updatedAt,
          }
        : null,

      // Payment status
      payment: payment
        ? {
            status: payment.status,
            amount: payment.amount,
            paidAt: payment.createdAt,
          }
        : lead.payment?.paid
          ? {
              status: lead.payment.paymentStatus || 'paid',
              amount: lead.billingSummary?.totalAmount || 0,
              paidAt: lead.payment.paidAt,
            }
          : null,

      // Status history count
      statusHistoryCount: lead.statusHistory?.length || 0,
    };
  });

  res.json({
    success: true,
    orders,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * Get lab order details with full tracking
 * GET /api/patients/orders/lab/:leadId
 */
exports.getLabOrderDetails = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const patientId = toObjectId(req.auth.id);
  const leadId = toObjectId(req.params.leadId);

  const labLead = await LabLead.findOne({ _id: leadId, patient: patientId })
    .populate('doctor', 'firstName lastName phone email specialization clinicDetails consultationFee')
    .populate('patient', 'firstName lastName phone email address')
    .populate('prescription', 'diagnosis medications investigations advice metadata issuedAt validityInDays')
    .populate('acceptedBy', 'labName phone email address location')
    .populate('preferredLaboratories', 'labName phone email address location')
    .populate('consultation', 'status startedAt completedAt')
    .lean();

  if (!labLead) {
    return res.status(404).json({
      success: false,
      message: 'Lab order not found',
    });
  }

  // Get payment details
  const payment = await Payment.findOne({
    'metadata.labLeadId': leadId.toString(),
    user: patientId,
    userModel: 'Patient',
  })
    .select('status amount currency paymentMethod razorpayOrderId razorpayPaymentId createdAt updatedAt')
    .lean();

  // Get lab report if exists
  const labReport = await LabReport.findOne({ labLead: leadId })
    .select('reportFile reportData status uploadedAt')
    .lean();

  // Format status history
  const statusHistory = (labLead.statusHistory || []).map((entry) => ({
    status: entry.status,
    notes: entry.notes,
    updatedAt: entry.updatedAt,
    updatedByRole: entry.updatedByRole,
    billingSnapshot: entry.billingSnapshot || null,
    reportSnapshot: entry.reportSnapshot || null,
  }));

  // Format response
  const orderDetails = {
    id: labLead._id,
    orderNumber: `LAB-${labLead._id.toString().slice(-8).toUpperCase()}`,
    status: labLead.status,
    createdAt: labLead.createdAt,
    updatedAt: labLead.updatedAt,

    // Doctor info
    doctor: labLead.doctor
      ? {
          id: labLead.doctor._id,
          name: `${labLead.doctor.firstName || ''} ${labLead.doctor.lastName || ''}`.trim(),
          phone: labLead.doctor.phone,
          email: labLead.doctor.email,
          specialization: labLead.doctor.specialization,
          consultationFee: labLead.doctor.consultationFee,
        }
      : null,

    // Patient info
    patient: labLead.patient
      ? {
          id: labLead.patient._id,
          name: `${labLead.patient.firstName || ''} ${labLead.patient.lastName || ''}`.trim(),
          phone: labLead.patient.phone,
          email: labLead.patient.email,
          address: labLead.patient.address,
        }
      : null,

    // Prescription details
    prescription: labLead.prescription
      ? {
          id: labLead.prescription._id,
          diagnosis: labLead.prescription.diagnosis,
          investigations: labLead.prescription.investigations || [],
          medications: labLead.prescription.medications || [],
          advice: labLead.prescription.advice,
          issuedAt: labLead.prescription.issuedAt,
          validityInDays: labLead.prescription.validityInDays,
        }
      : null,

    // Consultation info
    consultation: labLead.consultation
      ? {
          id: labLead.consultation._id,
          status: labLead.consultation.status,
          startedAt: labLead.consultation.startedAt,
          completedAt: labLead.consultation.completedAt,
        }
      : null,

    // Lab info
    acceptedLab: labLead.acceptedBy
      ? {
          id: labLead.acceptedBy._id,
          name: labLead.acceptedBy.labName,
          phone: labLead.acceptedBy.phone,
          email: labLead.acceptedBy.email,
          address: labLead.acceptedBy.address,
          location: labLead.acceptedBy.location,
        }
      : null,

    preferredLaboratories: (labLead.preferredLaboratories || []).map((lab) => ({
      id: lab._id,
      name: lab.labName,
      phone: lab.phone,
      email: lab.email,
      address: lab.address,
      location: lab.location,
    })),

    // Tests with availability and pricing
    tests: (labLead.tests || []).map((test) => ({
      testName: test.testName,
      description: test.description,
      notes: test.notes,
      priority: test.priority,
      available: test.available,
      price: test.price || 0,
      availabilityNotes: test.availabilityNotes,
    })),

    // Billing summary
    billing: labLead.billingSummary
      ? {
          totalAmount: labLead.billingSummary.totalAmount || 0,
          homeCollectionCharge: labLead.billingSummary.homeCollectionCharge || 0,
          currency: labLead.billingSummary.currency || 'INR',
          grandTotal:
            (labLead.billingSummary.totalAmount || 0) +
            (labLead.billingSummary.homeCollectionCharge || 0),
          notes: labLead.billingSummary.notes,
          updatedBy: labLead.billingSummary.updatedBy,
          updatedAt: labLead.billingSummary.updatedAt,
        }
      : null,

    // Payment details
    payment: payment
      ? {
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          paymentMethod: payment.paymentMethod,
          razorpayOrderId: payment.razorpayOrderId,
          razorpayPaymentId: payment.razorpayPaymentId,
          paidAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        }
      : labLead.payment?.paid
        ? {
            status: labLead.payment.paymentStatus || 'paid',
            amount: labLead.billingSummary?.totalAmount || 0,
            paymentId: labLead.payment.paymentId,
            transactionId: labLead.payment.transactionId,
            razorpayOrderId: labLead.payment.razorpayOrderId,
            razorpayPaymentId: labLead.payment.razorpayPaymentId,
            paidAt: labLead.payment.paidAt,
            commissionRate: labLead.payment.commissionRate,
            commissionAmount: labLead.payment.commissionAmount,
            netAmount: labLead.payment.netAmount,
          }
        : null,

    // Report details
    report: labReport
      ? {
          id: labReport._id,
          fileUrl: labReport.reportFile?.fileUrl,
          fileName: labReport.reportFile?.fileName,
          mimeType: labReport.reportFile?.mimeType,
          status: labReport.status,
          uploadedAt: labReport.uploadedAt,
        }
      : labLead.reportDetails
        ? {
            fileUrl: labLead.reportDetails.fileUrl,
            fileName: labLead.reportDetails.fileName,
            mimeType: labLead.reportDetails.mimeType,
            notes: labLead.reportDetails.notes,
            uploadedAt: labLead.reportDetails.uploadedAt,
          }
        : null,

    // Status history (full tracking)
    statusHistory,

    // Remarks
    remarks: labLead.remarks || null,

    // Metadata
    metadata: labLead.metadata || null,
  };

  res.json({
    success: true,
    order: orderDetails,
  });
});

/**
 * Get pharmacy order details with full tracking
 * GET /api/patients/orders/pharmacy/:leadId
 */
exports.getPharmacyOrderDetails = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT]);

  const patientId = toObjectId(req.auth.id);
  const leadId = toObjectId(req.params.leadId);

  const pharmacyLead = await PharmacyLead.findOne({ _id: leadId, patient: patientId })
    .populate('doctor', 'firstName lastName phone email specialization clinicDetails consultationFee')
    .populate('patient', 'firstName lastName phone email address')
    .populate('prescription', 'diagnosis medications investigations advice metadata issuedAt validityInDays')
    .populate('acceptedBy', 'pharmacyName phone email address location')
    .populate('preferredPharmacies', 'pharmacyName phone email address location')
    .populate('consultation', 'status startedAt completedAt')
    .lean();

  if (!pharmacyLead) {
    return res.status(404).json({
      success: false,
      message: 'Pharmacy order not found',
    });
  }

  // Get payment details
  const payment = await Payment.findOne({
    'metadata.pharmacyLeadId': leadId.toString(),
    user: patientId,
    userModel: 'Patient',
  })
    .select('status amount currency paymentMethod razorpayOrderId razorpayPaymentId createdAt updatedAt')
    .lean();

  // Format status history
  const statusHistory = (pharmacyLead.statusHistory || []).map((entry) => ({
    status: entry.status,
    notes: entry.notes,
    updatedAt: entry.updatedAt,
    updatedByRole: entry.updatedByRole,
    billingSnapshot: entry.billingSnapshot || null,
  }));

  // Format response
  const orderDetails = {
    id: pharmacyLead._id,
    orderNumber: `PHAR-${pharmacyLead._id.toString().slice(-8).toUpperCase()}`,
    status: pharmacyLead.status,
    createdAt: pharmacyLead.createdAt,
    updatedAt: pharmacyLead.updatedAt,

    // Doctor info
    doctor: pharmacyLead.doctor
      ? {
          id: pharmacyLead.doctor._id,
          name: `${pharmacyLead.doctor.firstName || ''} ${pharmacyLead.doctor.lastName || ''}`.trim(),
          phone: pharmacyLead.doctor.phone,
          email: pharmacyLead.doctor.email,
          specialization: pharmacyLead.doctor.specialization,
          consultationFee: pharmacyLead.doctor.consultationFee,
        }
      : null,

    // Patient info
    patient: pharmacyLead.patient
      ? {
          id: pharmacyLead.patient._id,
          name: `${pharmacyLead.patient.firstName || ''} ${pharmacyLead.patient.lastName || ''}`.trim(),
          phone: pharmacyLead.patient.phone,
          email: pharmacyLead.patient.email,
          address: pharmacyLead.patient.address,
        }
      : null,

    // Prescription details
    prescription: pharmacyLead.prescription
      ? {
          id: pharmacyLead.prescription._id,
          diagnosis: pharmacyLead.prescription.diagnosis,
          medications: pharmacyLead.prescription.medications || [],
          investigations: pharmacyLead.prescription.investigations || [],
          advice: pharmacyLead.prescription.advice,
          issuedAt: pharmacyLead.prescription.issuedAt,
          validityInDays: pharmacyLead.prescription.validityInDays,
        }
      : null,

    // Consultation info
    consultation: pharmacyLead.consultation
      ? {
          id: pharmacyLead.consultation._id,
          status: pharmacyLead.consultation.status,
          startedAt: pharmacyLead.consultation.startedAt,
          completedAt: pharmacyLead.consultation.completedAt,
        }
      : null,

    // Pharmacy info
    acceptedPharmacy: pharmacyLead.acceptedBy
      ? {
          id: pharmacyLead.acceptedBy._id,
          name: pharmacyLead.acceptedBy.pharmacyName,
          phone: pharmacyLead.acceptedBy.phone,
          email: pharmacyLead.acceptedBy.email,
          address: pharmacyLead.acceptedBy.address,
          location: pharmacyLead.acceptedBy.location,
        }
      : null,

    preferredPharmacies: (pharmacyLead.preferredPharmacies || []).map((pharmacy) => ({
      id: pharmacy._id,
      name: pharmacy.pharmacyName,
      phone: pharmacy.phone,
      email: pharmacy.email,
      address: pharmacy.address,
      location: pharmacy.location,
    })),

    // Medicines with availability and pricing
    medicines: (pharmacyLead.medicines || []).map((medicine) => ({
      name: medicine.name,
      dosage: medicine.dosage,
      quantity: medicine.quantity,
      instructions: medicine.instructions,
      priority: medicine.priority,
      available: medicine.available,
      price: medicine.price || 0,
      availableQuantity: medicine.availableQuantity || 0,
      availabilityNotes: medicine.availabilityNotes,
      totalPrice: (medicine.price || 0) * (medicine.quantity || 1),
    })),

    // Billing summary
    billing: pharmacyLead.billingSummary
      ? {
          totalAmount: pharmacyLead.billingSummary.totalAmount || 0,
          deliveryCharge: pharmacyLead.billingSummary.deliveryCharge || 0,
          currency: pharmacyLead.billingSummary.currency || 'INR',
          grandTotal:
            (pharmacyLead.billingSummary.totalAmount || 0) +
            (pharmacyLead.billingSummary.deliveryCharge || 0),
          notes: pharmacyLead.billingSummary.notes,
          updatedBy: pharmacyLead.billingSummary.updatedBy,
          updatedAt: pharmacyLead.billingSummary.updatedAt,
        }
      : null,

    // Payment details
    payment: payment
      ? {
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          paymentMethod: payment.paymentMethod,
          razorpayOrderId: payment.razorpayOrderId,
          razorpayPaymentId: payment.razorpayPaymentId,
          paidAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        }
      : pharmacyLead.payment?.paid
        ? {
            status: pharmacyLead.payment.paymentStatus || 'paid',
            amount: pharmacyLead.billingSummary?.totalAmount || 0,
            paymentId: pharmacyLead.payment.paymentId,
            transactionId: pharmacyLead.payment.transactionId,
            razorpayOrderId: pharmacyLead.payment.razorpayOrderId,
            razorpayPaymentId: pharmacyLead.payment.razorpayPaymentId,
            paidAt: pharmacyLead.payment.paidAt,
            commissionRate: pharmacyLead.payment.commissionRate,
            commissionAmount: pharmacyLead.payment.commissionAmount,
            netAmount: pharmacyLead.payment.netAmount,
          }
        : null,

    // Status history (full tracking)
    statusHistory,

    // Remarks
    remarks: pharmacyLead.remarks || null,

    // Metadata
    metadata: pharmacyLead.metadata || null,
  };

  res.json({
    success: true,
    order: orderDetails,
  });
});

