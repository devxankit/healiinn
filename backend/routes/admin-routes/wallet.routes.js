const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/admin-controllers/walletController');

const router = express.Router();

router.get('/overview', protect(ROLES.ADMIN), controller.getOverview);
router.get('/doctors', protect(ROLES.ADMIN), controller.listDoctorSummaries);
router.get(
  '/subscriptions/overview',
  protect(ROLES.ADMIN),
  controller.getSubscriptionEarnings
);
router.get(
  '/subscriptions/transactions',
  protect(ROLES.ADMIN),
  controller.listSubscriptionTransactions
);
router.get('/withdrawals', protect(ROLES.ADMIN), controller.listWithdrawals);
router.patch(
  '/withdrawals/:withdrawalId',
  protect(ROLES.ADMIN),
  controller.updateWithdrawalStatus
);

module.exports = router;


