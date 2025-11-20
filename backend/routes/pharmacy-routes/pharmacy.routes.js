const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/pharmacy-controllers/pharmacyWorkflowController');

const router = express.Router();

// List orders with filters and pagination
router.get(
  '/leads',
  protect(ROLES.PHARMACY),
  controller.listLeads
);

// Get single order details
router.get(
  '/orders/:orderId',
  protect(ROLES.PHARMACY),
  controller.getOrderDetails
);

// Search orders
router.get(
  '/orders/search',
  protect(ROLES.PHARMACY),
  controller.searchOrders
);

// Export orders
router.get(
  '/orders/export',
  protect(ROLES.PHARMACY),
  controller.exportOrders
);

// Update order status
router.patch(
  '/leads/:leadId/status',
  protect(ROLES.PHARMACY),
  controller.updateStatus
);

module.exports = router;

