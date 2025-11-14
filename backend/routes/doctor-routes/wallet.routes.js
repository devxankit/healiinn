const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/doctor-controllers/walletController');

const router = express.Router();

router.get('/summary', protect(ROLES.DOCTOR), controller.getWalletSummary);
router.get('/transactions', protect(ROLES.DOCTOR), controller.listTransactions);
router.get('/withdrawals', protect(ROLES.DOCTOR), controller.listWithdrawals);
router.post('/withdrawals', protect(ROLES.DOCTOR), controller.requestWithdrawal);

module.exports = router;


