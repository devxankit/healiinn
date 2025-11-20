const asyncHandler = require('../../middleware/asyncHandler');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { ROLES, PHARMACY_LEAD_STATUS } = require('../../utils/constants');
const pharmacyWorkflowService = require('../../services/pharmacyWorkflowService');
const { getPaginationParams, getPaginationMeta } = require('../../utils/pagination');
const { getCache, setCache, generateCacheKey, deleteCacheByPattern } = require('../../utils/cache');
const PharmacyLead = require('../../models/PharmacyLead');

const toObjectId = (value) =>
  typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value;

const ensureRole = (role, allowed) => {
  if (!allowed.includes(role)) {
    const error = new Error('You do not have access to this resource');
    error.status = 403;
    throw error;
  }
};

const sanitizePharmacyLead = (lead) => {
  if (!lead) {
    return lead;
  }

  const leadId =
    lead.leadId || (lead._id && typeof lead._id.toString === 'function'
      ? lead._id.toString()
      : lead._id);

  return {
    leadId,
    ...lead,
    statusHistory: (lead.statusHistory || []).map((entry) => ({
      status: entry.status,
      notes: entry.notes || null,
      updatedAt: entry.updatedAt,
      updatedByRole: entry.updatedByRole || null,
    })),
    billingSummary: lead.billingSummary
      ? {
          totalAmount: lead.billingSummary.totalAmount ?? null,
          deliveryCharge: lead.billingSummary.deliveryCharge ?? null,
          currency: lead.billingSummary.currency || 'INR',
          notes: lead.billingSummary.notes || null,
          updatedAt: lead.billingSummary.updatedAt || null,
        }
      : null,
  };
};

// List Orders with Pagination and Filters
exports.listLeads = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PHARMACY]);

  const pharmacyId = toObjectId(req.auth.id);
  const { page, limit, skip } = getPaginationParams(req.query);
  const { status, from, to, patientName, patientPhone, orderId } = req.query;

  // Build query
  const query = {
    $or: [
      { acceptedBy: pharmacyId },
      { preferredPharmacies: pharmacyId },
    ],
  };

  // Status filter
  if (status && status !== 'all') {
    if (!Object.values(PHARMACY_LEAD_STATUS).includes(status)) {
      const error = new Error('Invalid status filter specified.');
      error.status = 400;
      throw error;
    }
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

  // Order ID filter
  if (orderId) {
    try {
      query._id = toObjectId(orderId);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format.',
      });
    }
  }

  // Patient name/phone search - will be handled after populate
  let patientSearchQuery = null;
  if (patientName || patientPhone) {
    patientSearchQuery = {};
    if (patientName) {
      patientSearchQuery.$or = [
        { 'patient.firstName': { $regex: patientName, $options: 'i' } },
        { 'patient.lastName': { $regex: patientName, $options: 'i' } },
      ];
    }
    if (patientPhone) {
      if (!patientSearchQuery.$or) {
        patientSearchQuery.$or = [];
      }
      patientSearchQuery.$or.push({ 'patient.phone': { $regex: patientPhone, $options: 'i' } });
    }
  }

  // Get total count
  const total = await PharmacyLead.countDocuments(query);

  // Fetch leads with pagination
  let leads = await PharmacyLead.find(query)
    .populate('doctor', 'firstName lastName phone email clinicDetails specialization')
    .populate('patient', 'firstName lastName phone email address')
    .populate('prescription', 'diagnosis medications investigations advice metadata issuedAt')
    .populate('preferredPharmacies', 'pharmacyName phone email address')
    .select('status createdAt updatedAt billingSummary medicines patient doctor prescription preferredPharmacies acceptedBy remarks statusHistory payment')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Apply patient search filter if needed
  if (patientSearchQuery) {
    leads = leads.filter((lead) => {
      if (!lead.patient) return false;
      if (patientName) {
        const firstNameMatch = lead.patient.firstName?.toLowerCase().includes(patientName.toLowerCase());
        const lastNameMatch = lead.patient.lastName?.toLowerCase().includes(patientName.toLowerCase());
        if (!firstNameMatch && !lastNameMatch) return false;
      }
      if (patientPhone) {
        if (!lead.patient.phone?.includes(patientPhone)) return false;
      }
      return true;
    });
  }

  res.json({
    success: true,
    pagination: getPaginationMeta(total, page, limit),
    leads: leads.map(sanitizePharmacyLead),
  });
});

// Get Order Details (Single Lead)
exports.getOrderDetails = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PHARMACY]);

  const { orderId } = req.params;
  const pharmacyId = toObjectId(req.auth.id);

  // Try cache first
  const cacheKey = generateCacheKey('pharmacy:order', {
    pharmacyId: pharmacyId.toString(),
    orderId,
  });

  let lead = await getCache(cacheKey);
  if (!lead) {
    lead = await PharmacyLead.findOne({
      _id: orderId,
      $or: [
        { acceptedBy: pharmacyId },
        { preferredPharmacies: pharmacyId },
      ],
    })
      .populate('doctor', 'firstName lastName phone email clinicDetails specialization consultationFee _id')
      .populate('patient', 'firstName lastName phone email address gender dateOfBirth _id')
      .populate('prescription', 'diagnosis medications investigations advice metadata issuedAt _id')
      .populate('preferredPharmacies', 'pharmacyName phone email address _id')
      .populate('consultation', 'status startedAt endedAt _id')
      .select('status createdAt updatedAt billingSummary medicines patient doctor prescription preferredPharmacies acceptedBy remarks statusHistory payment consultation _id')
      .lean();

    if (lead) {
      // Cache for 2 minutes (120 seconds)
      await setCache(cacheKey, lead, 120);
    }
  }

  if (!lead) {
    return res.status(404).json({
      success: false,
      message: 'Order not found or you do not have access to this order.',
    });
  }

  res.json({
    success: true,
    order: sanitizePharmacyLead(lead),
  });
});

// Search Orders
exports.searchOrders = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PHARMACY]);

  const pharmacyId = toObjectId(req.auth.id);
  const { page, limit, skip } = getPaginationParams(req.query, 20, 50);
  const { q, status, from, to } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Search query must be at least 2 characters long.',
    });
  }

  const searchTerm = q.trim();

  // Build base query
  const query = {
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

  // Get all matching leads first (we'll filter by search term after populate)
  let leads = await PharmacyLead.find(query)
    .populate('doctor', 'firstName lastName phone email')
    .populate('patient', 'firstName lastName phone email')
    .populate('prescription', 'diagnosis medications')
    .select('status createdAt updatedAt billingSummary medicines patient doctor prescription remarks')
    .sort({ createdAt: -1 })
    .lean();

  // Filter by search term
  const searchLower = searchTerm.toLowerCase();
  leads = leads.filter((lead) => {
    // Search in order ID
    if (lead._id.toString().toLowerCase().includes(searchLower)) {
      return true;
    }

    // Search in patient name/phone
    if (lead.patient) {
      const patientName = `${lead.patient.firstName || ''} ${lead.patient.lastName || ''}`.toLowerCase();
      if (patientName.includes(searchLower) || lead.patient.phone?.includes(searchTerm)) {
        return true;
      }
    }

    // Search in doctor name
    if (lead.doctor) {
      const doctorName = `${lead.doctor.firstName || ''} ${lead.doctor.lastName || ''}`.toLowerCase();
      if (doctorName.includes(searchLower)) {
        return true;
      }
    }

    // Search in medicine names
    if (lead.medicines && Array.isArray(lead.medicines)) {
      const medicineMatch = lead.medicines.some((med) =>
        med.name?.toLowerCase().includes(searchLower)
      );
      if (medicineMatch) {
        return true;
      }
    }

    // Search in remarks
    if (lead.remarks?.toLowerCase().includes(searchLower)) {
      return true;
    }

    return false;
  });

  const total = leads.length;
  const paginatedLeads = leads.slice(skip, skip + limit);

  res.json({
    success: true,
    pagination: getPaginationMeta(total, page, limit),
    leads: paginatedLeads.map(sanitizePharmacyLead),
  });
});

const parseBillingPayload = (billing) => {
  if (!billing) {
    return undefined;
  }

  const parsed = {};

  if (billing.totalAmount !== undefined) {
    const value = Number(billing.totalAmount);
    if (Number.isNaN(value) || value < 0) {
      const error = new Error('totalAmount must be a non-negative number');
      error.status = 400;
      throw error;
    }
    parsed.totalAmount = value;
  }

  if (billing.deliveryCharge !== undefined) {
    const value = Number(billing.deliveryCharge);
    if (Number.isNaN(value) || value < 0) {
      const error = new Error('deliveryCharge must be a non-negative number');
      error.status = 400;
      throw error;
    }
    parsed.deliveryCharge = value;
  }

  if (billing.currency) {
    parsed.currency = String(billing.currency).trim().toUpperCase();
  }

  if (billing.notes) {
    parsed.notes = String(billing.notes).trim();
  }

  return parsed;
};

exports.updateStatus = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PHARMACY]);

  const { leadId } = req.params;
  const { status, notes, billing, medicines } = req.body;

  if (!status) {
    const error = new Error('status is required');
    error.status = 400;
    throw error;
  }

  const billingPayload = parseBillingPayload(billing);

  const updatedLead = await pharmacyWorkflowService.updateLeadStatus({
    leadId,
    pharmacyId: req.auth.id,
    status,
    notes,
    billing: billingPayload,
    medicines, // Medicines with availability and prices
    actorId: req.auth.id,
    actorRole: req.auth.role,
  });

  // Invalidate cache for this order and dashboard
  await deleteCacheByPattern(`pharmacy:order:*:${leadId}`);
  await deleteCacheByPattern(`pharmacy:dashboard:*`);
  await deleteCacheByPattern(`pharmacy:wallet:*`);

  res.json({
    success: true,
    lead: sanitizePharmacyLead(updatedLead),
  });
});

// Export Orders
exports.exportOrders = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PHARMACY]);

  const pharmacyId = toObjectId(req.auth.id);
  const { format = 'excel', status, from, to } = req.query;

  if (!['pdf', 'excel', 'csv'].includes(format.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: 'Format must be pdf, excel, or csv.',
    });
  }

  // Build query
  const query = {
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

  // Fetch all orders
  const orders = await PharmacyLead.find(query)
    .populate('doctor', 'firstName lastName phone email specialization')
    .populate('patient', 'firstName lastName phone email address')
    .populate('prescription', 'diagnosis medications issuedAt')
    .select('status createdAt updatedAt billingSummary medicines patient doctor prescription remarks statusHistory payment')
    .sort({ createdAt: -1 })
    .lean();

  // Get pharmacy info
  const Pharmacy = require('../../models/Pharmacy');
  const pharmacy = await Pharmacy.findById(pharmacyId).select('pharmacyName ownerName').lean();

  if (format.toLowerCase() === 'pdf') {
    const doc = new PDFDocument({ margin: 50 });
    const fileName = `pharmacy-orders-${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), 'backend', 'uploads', 'reports', fileName);
    const uploadsDir = path.dirname(filePath);

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('Pharmacy Orders Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Pharmacy: ${pharmacy.pharmacyName}`, { align: 'center' });
    if (pharmacy.ownerName) {
      doc.text(`Owner: ${pharmacy.ownerName}`, { align: 'center' });
    }
    if (from || to) {
      doc.text(`Period: ${from ? new Date(from).toLocaleDateString() : 'All'} - ${to ? new Date(to).toLocaleDateString() : 'All'}`, { align: 'center' });
    }
    doc.text(`Total Orders: ${orders.length}`, { align: 'center' });
    doc.moveDown();

    // Orders list
    orders.forEach((order, index) => {
      if (index > 0 && index % 3 === 0) {
        doc.addPage();
      }

      doc.fontSize(14).text(`Order #${index + 1}: ${order._id}`, { underline: true });
      doc.fontSize(10);
      doc.text(`Status: ${order.status.toUpperCase()}`);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);
      
      if (order.patient) {
        doc.text(`Patient: ${order.patient.firstName} ${order.patient.lastName || ''}`);
        doc.text(`Phone: ${order.patient.phone || 'N/A'}`);
      }
      
      if (order.doctor) {
        doc.text(`Doctor: ${order.doctor.firstName} ${order.doctor.lastName || ''}`);
      }

      if (order.billingSummary) {
        doc.text(`Total Amount: ₹${order.billingSummary.totalAmount || 0}`);
        doc.text(`Delivery Charge: ₹${order.billingSummary.deliveryCharge || 0}`);
      }

      if (order.medicines && order.medicines.length > 0) {
        doc.text(`Medicines: ${order.medicines.length} items`);
      }

      if (order.remarks) {
        doc.text(`Remarks: ${order.remarks}`);
      }

      doc.moveDown(0.5);
    });

    doc.end();

    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.sendFile(filePath);
  } else if (format.toLowerCase() === 'excel') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders');

    // Header row
    worksheet.columns = [
      { header: 'Order ID', key: 'orderId', width: 25 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Patient Name', key: 'patientName', width: 20 },
      { header: 'Patient Phone', key: 'patientPhone', width: 15 },
      { header: 'Doctor Name', key: 'doctorName', width: 20 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
      { header: 'Delivery Charge', key: 'deliveryCharge', width: 15 },
      { header: 'Medicines Count', key: 'medicinesCount', width: 15 },
      { header: 'Remarks', key: 'remarks', width: 30 },
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add data rows
    orders.forEach((order) => {
      worksheet.addRow({
        orderId: order._id.toString(),
        date: new Date(order.createdAt).toLocaleString(),
        status: order.status.toUpperCase(),
        patientName: order.patient ? `${order.patient.firstName} ${order.patient.lastName || ''}`.trim() : 'N/A',
        patientPhone: order.patient?.phone || 'N/A',
        doctorName: order.doctor ? `${order.doctor.firstName} ${order.doctor.lastName || ''}`.trim() : 'N/A',
        totalAmount: order.billingSummary?.totalAmount || 0,
        deliveryCharge: order.billingSummary?.deliveryCharge || 0,
        medicinesCount: order.medicines?.length || 0,
        remarks: order.remarks || '',
      });
    });

    const fileName = `pharmacy-orders-${Date.now()}.xlsx`;
    const filePath = path.join(process.cwd(), 'backend', 'uploads', 'reports', fileName);
    const uploadsDir = path.dirname(filePath);

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    await workbook.xlsx.writeFile(filePath);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.sendFile(filePath);
  } else {
    // CSV format
    const csvRows = [];
    
    // Header
    csvRows.push('Order ID,Date,Status,Patient Name,Patient Phone,Doctor Name,Total Amount,Delivery Charge,Medicines Count,Remarks');

    // Data rows
    orders.forEach((order) => {
      const row = [
        order._id.toString(),
        new Date(order.createdAt).toLocaleString(),
        order.status.toUpperCase(),
        order.patient ? `"${order.patient.firstName} ${order.patient.lastName || ''}"`.trim() : 'N/A',
        order.patient?.phone || 'N/A',
        order.doctor ? `"${order.doctor.firstName} ${order.doctor.lastName || ''}"`.trim() : 'N/A',
        order.billingSummary?.totalAmount || 0,
        order.billingSummary?.deliveryCharge || 0,
        order.medicines?.length || 0,
        order.remarks ? `"${order.remarks.replace(/"/g, '""')}"` : '',
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="pharmacy-orders-${Date.now()}.csv"`);
    return res.send(csvContent);
  }
});

