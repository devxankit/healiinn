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

