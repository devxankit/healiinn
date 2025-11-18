const asyncHandler = require('../../middleware/asyncHandler');
const { ROLES, PHARMACY_LEAD_STATUS } = require('../../utils/constants');
const pharmacyWorkflowService = require('../../services/pharmacyWorkflowService');

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

exports.listLeads = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PHARMACY]);

  const statusFilter = req.query.status;

  if (
    statusFilter &&
    statusFilter !== 'all' &&
    !Object.values(PHARMACY_LEAD_STATUS).includes(statusFilter)
  ) {
    const error = new Error('Invalid status filter specified.');
    error.status = 400;
    throw error;
  }

  const leads = await pharmacyWorkflowService.listLeadsForPharmacy({
    pharmacyId: req.auth.id,
    status: statusFilter,
  });

  res.json({
    success: true,
    leads: leads.map(sanitizePharmacyLead),
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

  res.json({
    success: true,
    lead: sanitizePharmacyLead(updatedLead),
  });
});

