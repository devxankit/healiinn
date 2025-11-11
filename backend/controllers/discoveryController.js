const Doctor = require('../models/Doctor');
const Laboratory = require('../models/Laboratory');
const Pharmacy = require('../models/Pharmacy');
const asyncHandler = require('../middleware/asyncHandler');
const { APPROVAL_STATUS } = require('../utils/constants');
const { getNearbyRadiusKm } = require('../services/appSettingsService');

const parseCoordinates = (req) => {
  const lat = Number(req.query.lat ?? req.query.latitude);
  const lng = Number(req.query.lng ?? req.query.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    const error = new Error('lat and lng query parameters are required and must be numeric.');
    error.status = 400;
    throw error;
  }

  return { lat, lng };
};

const resolveRadiusKm = async (req) => {
  if (req.query.radiusKm !== undefined) {
    const radius = Number(req.query.radiusKm);
    if (!Number.isFinite(radius) || radius <= 0) {
      const error = new Error('radiusKm must be a positive number.');
      error.status = 400;
      throw error;
    }
    return radius;
  }
  return getNearbyRadiusKm();
};

const nearbyAggregation = async ({
  model,
  nearField,
  lat,
  lng,
  radiusKm,
  projection = {},
  conditions = {},
  limit = 50,
}) => {
  const pipeline = [
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        key: nearField,
        maxDistance: radiusKm * 1000,
        distanceField: 'distanceInMeters',
        spherical: true,
        query: conditions,
      },
    },
    {
      $project: {
        distanceKm: {
          $round: [{ $divide: ['$distanceInMeters', 1000] }, 2],
        },
        ...projection,
      },
    },
    { $limit: limit },
  ];

  return model.aggregate(pipeline);
};

exports.nearbyDoctors = asyncHandler(async (req, res) => {
  const { lat, lng } = parseCoordinates(req);
  const radiusKm = await resolveRadiusKm(req);

  const doctors = await nearbyAggregation({
    model: Doctor,
    nearField: 'clinicDetails.location',
    lat,
    lng,
    radiusKm,
    projection: {
      firstName: 1,
      lastName: 1,
      specialization: 1,
      experienceYears: 1,
      consultationFee: 1,
      rating: 1,
      'clinicDetails.address': 1,
      'clinicDetails.location': 1,
    },
    conditions: {
      status: APPROVAL_STATUS.APPROVED,
      'clinicDetails.location': { $exists: true },
    },
  });

  res.json({
    success: true,
    data: {
      radiusKm,
      count: doctors.length,
      items: doctors,
    },
  });
});

exports.nearbyLaboratories = asyncHandler(async (req, res) => {
  const { lat, lng } = parseCoordinates(req);
  const radiusKm = await resolveRadiusKm(req);

  const laboratories = await nearbyAggregation({
    model: Laboratory,
    nearField: 'address.location',
    lat,
    lng,
    radiusKm,
    projection: {
      labName: 1,
      ownerName: 1,
      servicesOffered: 1,
      timings: 1,
      profileImage: 1,
      address: 1,
      rating: 1,
    },
    conditions: {
      status: APPROVAL_STATUS.APPROVED,
      'address.location': { $exists: true },
    },
  });

  res.json({
    success: true,
    data: {
      radiusKm,
      count: laboratories.length,
      items: laboratories,
    },
  });
});

exports.nearbyPharmacies = asyncHandler(async (req, res) => {
  const { lat, lng } = parseCoordinates(req);
  const radiusKm = await resolveRadiusKm(req);

  const pharmacies = await nearbyAggregation({
    model: Pharmacy,
    nearField: 'address.location',
    lat,
    lng,
    radiusKm,
    projection: {
      pharmacyName: 1,
      ownerName: 1,
      deliveryOptions: 1,
      serviceRadiusKm: 1,
      timings: 1,
      profileImage: 1,
      address: 1,
      rating: 1,
    },
    conditions: {
      status: APPROVAL_STATUS.APPROVED,
      'address.location': { $exists: true },
    },
  });

  res.json({
    success: true,
    data: {
      radiusKm,
      count: pharmacies.length,
      items: pharmacies,
    },
  });
});


