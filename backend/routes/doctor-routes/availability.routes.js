const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/doctor-controllers/availabilityController');

const router = express.Router();

// Get availability
router.get('/', protect(ROLES.DOCTOR), controller.getAvailability);

// Update availability
router.put('/', protect(ROLES.DOCTOR), controller.updateAvailability);

// Check conflicts
router.get('/conflicts', protect(ROLES.DOCTOR), controller.checkAvailabilityConflicts);

// Validate a slot before adding
router.post('/validate', protect(ROLES.DOCTOR), controller.validateAvailabilitySlot);

// Add availability slot
router.post('/slots', protect(ROLES.DOCTOR), controller.addAvailabilitySlot);

// Remove availability slot
router.delete('/slots/:slotId', protect(ROLES.DOCTOR), controller.removeAvailabilitySlot);

// Bulk update availability
router.put('/bulk', protect(ROLES.DOCTOR), controller.bulkUpdateAvailability);

// Block dates (holidays, leaves)
router.post('/block-dates', protect(ROLES.DOCTOR), controller.blockDate);
router.get('/block-dates', protect(ROLES.DOCTOR), controller.getBlockedDates);
router.delete('/block-dates/:blockId', protect(ROLES.DOCTOR), controller.unblockDate);

// Break times
router.post('/break-times', protect(ROLES.DOCTOR), controller.addBreakTime);
router.get('/break-times', protect(ROLES.DOCTOR), controller.getBreakTimes);
router.delete('/break-times/:breakId', protect(ROLES.DOCTOR), controller.removeBreakTime);

// Temporary availability
router.post('/temporary', protect(ROLES.DOCTOR), controller.addTemporaryAvailability);
router.get('/temporary', protect(ROLES.DOCTOR), controller.getTemporaryAvailability);
router.delete('/temporary/:tempId', protect(ROLES.DOCTOR), controller.removeTemporaryAvailability);

module.exports = router;

