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
