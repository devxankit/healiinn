const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/laboratory-controllers/walletController');

const router = express.Router();

router.get('/summary', protect(ROLES.LABORATORY), controller.getWalletSummary);
router.get('/transactions', protect(ROLES.LABORATORY), controller.listTransactions);
router.get('/withdrawals', protect(ROLES.LABORATORY), controller.listWithdrawals);
router.post('/withdrawals', protect(ROLES.LABORATORY), controller.requestWithdrawal);

module.exports = router;

