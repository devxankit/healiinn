const asyncHandler = require('../../middleware/asyncHandler');
const { ROLES, LAB_LEAD_STATUS } = require('../../utils/constants');
const labWorkflowService = require('../../services/labWorkflowService');

const ensureRole = (role, allowed) => {
  if (!allowed.includes(role)) {
    const error = new Error('You do not have access to this resource');
    error.status = 403;
    throw error;
  }
};

const sanitizeLabLead = (lead) => {
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
      billingSnapshot: entry.billingSnapshot
        ? {
            totalAmount: entry.billingSnapshot.totalAmount ?? null,
            homeCollectionCharge: entry.billingSnapshot.homeCollectionCharge ?? null,
            currency: entry.billingSnapshot.currency || 'INR',
          }
        : null,
      reportSnapshot: entry.reportSnapshot
        ? {
            fileUrl: entry.reportSnapshot.fileUrl || null,
            fileName: entry.reportSnapshot.fileName || null,
            mimeType: entry.reportSnapshot.mimeType || null,
          }
        : null,
    })),
    billingSummary: lead.billingSummary
      ? {
          totalAmount: lead.billingSummary.totalAmount ?? null,
          homeCollectionCharge: lead.billingSummary.homeCollectionCharge ?? null,
          currency: lead.billingSummary.currency || 'INR',
          notes: lead.billingSummary.notes || null,
          updatedAt: lead.billingSummary.updatedAt || null,
        }
      : null,
    reportDetails: lead.reportDetails
      ? {
          fileUrl: lead.reportDetails.fileUrl || null,
          fileName: lead.reportDetails.fileName || null,
          mimeType: lead.reportDetails.mimeType || null,
          notes: lead.reportDetails.notes || null,
          uploadedAt: lead.reportDetails.uploadedAt || null,
        }
      : null,
  };
};

exports.listLeads = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.LABORATORY]);

  const statusFilter = req.query.status;

  if (
    statusFilter &&
    statusFilter !== 'all' &&
    !Object.values(LAB_LEAD_STATUS).includes(statusFilter)
  ) {
    const error = new Error('Invalid status filter specified.');
    error.status = 400;
    throw error;
  }

  const leads = await labWorkflowService.listLeadsForLab({
    laboratoryId: req.auth.id,
    status: statusFilter,
  });

  res.json({
    success: true,
    leads: leads.map(sanitizeLabLead),
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

  if (billing.homeCollectionCharge !== undefined) {
    const value = Number(billing.homeCollectionCharge);
    if (Number.isNaN(value) || value < 0) {
      const error = new Error('homeCollectionCharge must be a non-negative number');
      error.status = 400;
      throw error;
    }
    parsed.homeCollectionCharge = value;
  }

  if (billing.currency) {
    parsed.currency = String(billing.currency).trim().toUpperCase();
  }

  if (billing.notes) {
    parsed.notes = String(billing.notes).trim();
  }

  return parsed;
};

const parseReportPayload = (report) => {
  if (!report) {
    return undefined;
  }

  const payload = {};

  if (report.fileUrl) {
    payload.fileUrl = String(report.fileUrl).trim();
  }

  if (report.fileName) {
    payload.fileName = String(report.fileName).trim();
  }

  if (report.mimeType) {
    payload.mimeType = String(report.mimeType).trim();
  }

  if (report.notes) {
    payload.notes = String(report.notes).trim();
  }

  if (!payload.fileUrl) {
    const error = new Error('report.fileUrl is required when providing report details');
    error.status = 400;
    throw error;
  }

  return payload;
};

exports.updateStatus = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.LABORATORY]);

  const { leadId } = req.params;
  const { status, notes, billing, report, tests } = req.body;

  if (!status) {
    const error = new Error('status is required');
    error.status = 400;
    throw error;
  }

  const billingPayload = parseBillingPayload(billing);
  const reportPayload = parseReportPayload(report);

  const updatedLead = await labWorkflowService.updateLeadStatus({
    leadId,
    laboratoryId: req.auth.id,
    status,
    notes,
    billing: billingPayload,
    report: reportPayload,
    tests, // Tests with availability and prices
    actorId: req.auth.id,
    actorRole: req.auth.role,
  });

  res.json({
    success: true,
    lead: sanitizeLabLead(updatedLead),
  });
});
