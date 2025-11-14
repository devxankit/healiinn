const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const controller = require('../../controllers/admin-controllers/adminActivationController');

const router = express.Router();

router.patch('/:role/:userId/activation', protect(ROLES.ADMIN), controller.updateActivation);

module.exports = router;


