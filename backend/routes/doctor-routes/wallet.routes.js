const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getWalletBalance,
  getEarnings,
  getTransactions,
  requestWithdrawal,
} = require('../../controllers/doctor-controllers/doctorWalletController');

router.get('/balance', protect('doctor'), getWalletBalance);
router.get('/earnings', protect('doctor'), getEarnings);
router.get('/transactions', protect('doctor'), getTransactions);
router.post('/withdraw', protect('doctor'), requestWithdrawal);

module.exports = router;

