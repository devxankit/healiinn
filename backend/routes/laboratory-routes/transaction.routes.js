const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/laboratory-controllers/transactionController');

const router = express.Router();

router.get('/transactions', protect(ROLES.LABORATORY), controller.listTransactions);
router.get('/transactions/:transactionId', protect(ROLES.LABORATORY), controller.getTransaction);

module.exports = router;

