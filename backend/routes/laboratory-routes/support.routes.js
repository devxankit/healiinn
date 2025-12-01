const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  createSupportTicket,
  getSupportTickets,
} = require('../../controllers/laboratory-controllers/laboratorySupportController');

router.post('/', protect('laboratory'), createSupportTicket);
router.get('/', protect('laboratory'), getSupportTickets);

module.exports = router;

