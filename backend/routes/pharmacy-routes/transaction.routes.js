const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/pharmacy-controllers/transactionController');

const router = express.Router();

router.get('/transactions', protect(ROLES.PHARMACY), controller.listTransactions);
router.get('/transactions/:transactionId', protect(ROLES.PHARMACY), controller.getTransaction);

module.exports = router;

