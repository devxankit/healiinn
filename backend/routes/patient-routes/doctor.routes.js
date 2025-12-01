const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getDoctors,
  getDoctorById,
  getHospitals,
  getHospitalById,
  getHospitalDoctors,
  getSpecialties,
  getSpecialtyDoctors,
  getLocations,
  checkDoctorSlotAvailability,
} = require('../../controllers/patient-controllers/patientDoctorController');

// Public routes (no auth required for discovery)
router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.get('/:id/slots', checkDoctorSlotAvailability);

// Hospital routes
router.get('/hospitals', getHospitals);
router.get('/hospitals/:id', getHospitalById);
router.get('/hospitals/:id/doctors', getHospitalDoctors);

// Specialty routes
router.get('/specialties', getSpecialties);
router.get('/specialties/:id/doctors', getSpecialtyDoctors);

// Location routes
router.get('/locations', getLocations);

module.exports = router;

