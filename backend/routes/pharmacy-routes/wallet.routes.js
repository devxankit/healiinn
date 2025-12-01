const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getWalletBalance,
  getEarnings,
  getTransactions,
  requestWithdrawal,
} = require('../../controllers/pharmacy-controllers/pharmacyWalletController');

router.get('/balance', protect('pharmacy'), getWalletBalance);
router.get('/earnings', protect('pharmacy'), getEarnings);
router.get('/transactions', protect('pharmacy'), getTransactions);
router.post('/withdraw', protect('pharmacy'), requestWithdrawal);

module.exports = router;

