const express = require('express');
const router = express.Router();
const Hospital = require('../../models/Hospital');
const asyncHandler = require('../../middleware/asyncHandler');

// GET /api/hospitals (Public route)
router.get('/', asyncHandler(async (req, res) => {
  const hospitals = await Hospital.find({ isActive: true })
    .select('name address image rating reviewCount')
    .sort({ rating: -1, name: 1 });

  return res.status(200).json({
    success: true,
    data: hospitals,
  });
}));

// GET /api/hospitals/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const hospital = await Hospital.findById(id).populate('doctors', 'firstName lastName specialization');

  if (!hospital || !hospital.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Hospital not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: hospital,
  });
}));

module.exports = router;

