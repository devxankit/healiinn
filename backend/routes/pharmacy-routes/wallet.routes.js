const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/pharmacy-controllers/walletController');

const router = express.Router();

router.get('/summary', protect(ROLES.PHARMACY), controller.getWalletSummary);
router.get('/transactions', protect(ROLES.PHARMACY), controller.listTransactions);
router.get('/withdrawals', protect(ROLES.PHARMACY), controller.listWithdrawals);
router.post('/withdrawals', protect(ROLES.PHARMACY), controller.requestWithdrawal);

module.exports = router;

