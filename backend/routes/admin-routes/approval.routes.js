const express = require('express');
const {
  listRequests,
  approveRequest,
  rejectRequest,
} = require('../../controllers/admin-controllers/approvalController');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');

const router = express.Router();

router.use(protect(ROLES.ADMIN));

router.get('/', listRequests);
router.patch('/:role/:id/approve', approveRequest);
router.patch('/:role/:id/reject', rejectRequest);

module.exports = router;


