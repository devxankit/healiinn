const asyncHandler = require('../../middleware/asyncHandler');
const { ROLES } = require('../../utils/constants');
const labWorkflowService = require('../../services/labWorkflowService');

const ensureRole = (role, allowed) => {
  if (!allowed.includes(role)) {
    const error = new Error('You do not have access to this resource');
    error.status = 403;
    throw error;
  }
};

exports.listLeads = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.LABORATORY]);

  const leads = await labWorkflowService.listLeadsForLab({
    laboratoryId: req.auth.id,
  });

  res.json({
    success: true,
    leads,
  });
});

exports.createQuote = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.LABORATORY]);

  const quote = await labWorkflowService.createQuote({
    leadId: req.params.leadId,
    laboratoryId: req.auth.id,
    tests: req.body.tests,
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

  const result = await labWorkflowService.acceptQuote({
    quoteId: req.params.quoteId,
    actorRole: req.auth.role,
    actorId: req.auth.id,
  });

  res.json({
    success: true,
    ...result,
  });
});

exports.listOrders = asyncHandler(async (req, res) => {
  ensureRole(req.auth.role, [ROLES.LABORATORY]);

  const orders = await labWorkflowService.listOrdersForLab({
    laboratoryId: req.auth.id,
  });

  res.json({
    success: true,
    orders,
  });
});

