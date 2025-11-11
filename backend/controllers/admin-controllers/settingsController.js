const asyncHandler = require('../../middleware/asyncHandler');
const { ROLES } = require('../../utils/constants');
const { getNearbyRadiusKm, updateNearbyRadiusKm, DEFAULT_NEARBY_RADIUS_KM } = require('../../services/appSettingsService');

exports.getNearbyRadius = asyncHandler(async (req, res) => {
  const radiusKm = await getNearbyRadiusKm();

  res.json({
    success: true,
    data: {
      radiusKm,
      defaultRadiusKm: DEFAULT_NEARBY_RADIUS_KM,
    },
  });
});

exports.updateNearbyRadius = asyncHandler(async (req, res) => {
  if (req.auth.role !== ROLES.ADMIN) {
    const error = new Error('Only admins can update settings.');
    error.status = 403;
    throw error;
  }

  const { radiusKm } = req.body;

  if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
    const error = new Error('radiusKm must be a positive number.');
    error.status = 400;
    throw error;
  }

  const value = await updateNearbyRadiusKm({
    radiusKm,
    updatedBy: req.auth.id,
  });

  res.json({
    success: true,
    message: 'Nearby radius updated successfully.',
    data: {
      radiusKm: value,
      defaultRadiusKm: DEFAULT_NEARBY_RADIUS_KM,
    },
  });
});


