const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/admin-controllers/transactionController');

const router = express.Router();

// Payment routes (payments made by users)
router.get('/payments', protect(ROLES.ADMIN), controller.listPayments);
router.get('/payments/:paymentId', protect(ROLES.ADMIN), controller.getPayment);

// Wallet transaction routes (provider earnings)
router.get('/wallet-transactions', protect(ROLES.ADMIN), controller.listWalletTransactions);
router.get('/wallet-transactions/:transactionId', protect(ROLES.ADMIN), controller.getWalletTransaction);

// Commission transaction routes (admin earnings)
router.get('/commission-transactions', protect(ROLES.ADMIN), controller.listCommissionTransactions);
router.get('/commission-transactions/:transactionId', protect(ROLES.ADMIN), controller.getCommissionTransaction);

// Summary/Statistics
router.get('/summary', protect(ROLES.ADMIN), controller.getTransactionSummary);

module.exports = router;

