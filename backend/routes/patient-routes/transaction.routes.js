const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/patient-controllers/transactionController');

const router = express.Router();

router.get('/transactions', protect(ROLES.PATIENT), controller.listTransactions);
router.get('/transactions/:transactionId', protect(ROLES.PATIENT), controller.getTransaction);

module.exports = router;

