const asyncHandler = require('../../middleware/asyncHandler');
const { getModelForRole, ROLES } = require('../../utils/getModelForRole');

const SUPPORTED_ROLES = [
  ROLES.PATIENT,
  ROLES.DOCTOR,
  ROLES.LABORATORY,
  ROLES.PHARMACY,
];

const sanitizeEntity = (entity) => {
  if (!entity) {
    return entity;
  }

  const plain = entity.toObject ? entity.toObject() : entity;
  delete plain.password;
  return plain;
};

exports.updateActivation = asyncHandler(async (req, res) => {
  const { role, userId } = req.params;
  const { isActive } = req.body;

  if (!SUPPORTED_ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'role must be one of patient, doctor, laboratory, pharmacy.',
    });
  }

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'isActive must be a boolean value.',
    });
  }

  const Model = getModelForRole(role);

  const entity = await Model.findById(userId);

  if (!entity) {
    return res
      .status(404)
      .json({ success: false, message: `${role} not found.` });
  }

  if (!Object.prototype.hasOwnProperty.call(entity, 'isActive')) {
    return res.status(400).json({
      success: false,
      message: `isActive flag is not supported for role ${role}.`,
    });
  }

  entity.isActive = isActive;
  await entity.save();

  res.json({
    success: true,
    message: `Successfully ${isActive ? 'activated' : 'deactivated'} ${role}.`,
    data: sanitizeEntity(entity),
  });
});


