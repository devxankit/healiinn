const asyncHandler = require('../../middleware/asyncHandler');
const { ROLES } = require('../../utils/constants');
const pharmacyWorkflowService = require('../../services/pharmacyWorkflowService');

const ensureRole = (role, allowed) => {
  if (!allowed.includes(role)) {
    const error = new Error('You do not have access to this resource');
    error.status = 403;
    throw error;
  }
};

exports.listLeads = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PHARMACY]);

  const leads = await pharmacyWorkflowService.listLeadsForPharmacy({
    pharmacyId: req.auth.id,
  });

  res.json({
    success: true,
    leads,
  });
});

exports.createQuote = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PHARMACY]);

  const quote = await pharmacyWorkflowService.createQuote({
    leadId: req.params.leadId,
    pharmacyId: req.auth.id,
    medicines: req.body.medicines,
    totalAmount: req.body.totalAmount,
    currency: req.body.currency,
    expiresAt: req.body.expiresAt,
    remarks: req.body.remarks,
  });

  res.status(201).json({
    success: true,
    quote,
  });
});

exports.acceptQuote = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PATIENT, ROLES.ADMIN]);

  const result = await pharmacyWorkflowService.acceptQuote({
    quoteId: req.params.quoteId,
    actorRole: req.auth.role,
    actorId: req.auth.id,
    deliveryType: req.body.deliveryType,
    scheduledAt: req.body.scheduledAt,
  });

  res.json({
    success: true,
    ...result,
  });
});

exports.listOrders = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.PHARMACY]);

  const orders = await pharmacyWorkflowService.listOrdersForPharmacy({
    pharmacyId: req.auth.id,
  });

  res.json({
    success: true,
    orders,
  });
});

