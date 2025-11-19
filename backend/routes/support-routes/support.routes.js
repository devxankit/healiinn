const express = require('express');
const supportController = require('../../controllers/support-controller/supportController');
const { protect, authorize } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');

const router = express.Router();

// All authenticated users can create support tickets
router.post('/tickets', protect(), supportController.createSupportTicket);

// All authenticated users can get their own tickets
router.get('/tickets/my', protect(), supportController.getMySupportTickets);

// All authenticated users can get their ticket details
router.get('/tickets/:ticketId', protect(), supportController.getSupportTicketDetails);

// Admin only routes
router.get('/tickets', protect(ROLES.ADMIN), authorize(ROLES.ADMIN), supportController.listSupportTickets);
router.patch('/tickets/:ticketId/status', protect(ROLES.ADMIN), authorize(ROLES.ADMIN), supportController.updateSupportTicketStatus);
router.post('/tickets/:ticketId/response', protect(ROLES.ADMIN), authorize(ROLES.ADMIN), supportController.addAdminResponse);

module.exports = router;

