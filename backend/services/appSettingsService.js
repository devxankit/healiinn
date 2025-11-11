const AppSetting = require('../models/AppSetting');

const NEARBY_RADIUS_KEY = 'nearbyRadiusKm';

const DEFAULT_NEARBY_RADIUS_KM = Number(process.env.DEFAULT_NEARBY_RADIUS_KM) || 5;

const getSetting = async (key) => {
  return AppSetting.findOne({ key });
};

const setSetting = async (key, value, updatedBy) => {
  return AppSetting.findOneAndUpdate(
    { key },
    {
      value,
      updatedBy,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const getNearbyRadiusKm = async () => {
  const setting = await getSetting(NEARBY_RADIUS_KEY);
  const radius = setting && typeof setting.value === 'number' ? setting.value : DEFAULT_NEARBY_RADIUS_KM;

  if (!Number.isFinite(radius) || radius <= 0) {
    return DEFAULT_NEARBY_RADIUS_KM;
  }

  return radius;
};

const updateNearbyRadiusKm = async ({ radiusKm, updatedBy }) => {
  if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
    const error = new Error('radiusKm must be a positive number.');
    error.status = 400;
    throw error;
  }

  const setting = await setSetting(NEARBY_RADIUS_KEY, radiusKm, updatedBy);
  return setting.value;
};

module.exports = {
  getNearbyRadiusKm,
  updateNearbyRadiusKm,
  DEFAULT_NEARBY_RADIUS_KM,
};


