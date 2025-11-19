const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/doctor-controllers/transactionController');

const router = express.Router();

router.get('/transactions', protect(ROLES.DOCTOR), controller.listTransactions);
router.get('/transactions/:transactionId', protect(ROLES.DOCTOR), controller.getTransaction);

module.exports = router;

