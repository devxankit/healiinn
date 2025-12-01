const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  createSupportTicket,
  getSupportTickets,
} = require('../../controllers/pharmacy-controllers/pharmacySupportController');

router.post('/', protect('pharmacy'), createSupportTicket);
router.get('/', protect('pharmacy'), getSupportTickets);

module.exports = router;

