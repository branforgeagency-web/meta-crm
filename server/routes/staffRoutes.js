const express = require('express');
const router = express.Router();
const {
  getStaffList,
  addStaffMember,
  toggleStaffStatus,
  updateStaffMember,
} = require('../controllers/staffController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.get('/', getStaffList);
router.post('/', adminOnly, addStaffMember);
router.put('/:id', adminOnly, updateStaffMember);
router.patch('/:id/status', adminOnly, toggleStaffStatus);

module.exports = router;
