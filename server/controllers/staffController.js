const mongoose = require('mongoose');
const User = require('../models/User');
const Lead = require('../models/Lead');

const ROLES = ['admin', 'staff'];
const publicUser = (u) => ({ id: u._id, _id: u._id, name: u.name, email: u.email, role: u.role, status: u.status, phone: u.phone });

const findStaff = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(404).json({ success: false, message: 'Staff member not found' });
    return null;
  }
  const staff = await User.findById(req.params.id);
  if (!staff) res.status(404).json({ success: false, message: 'Staff member not found' });
  return staff;
};

const otherActiveAdmins = (id) => User.countDocuments({ _id: { $ne: id }, role: 'admin', status: 'active' });

// @route GET /api/staff
exports.getStaffList = async (req, res) => {
  try {
    const [staffMembers, counts] = await Promise.all([
      User.find({}).select('-password').sort('name'),
      Lead.aggregate([
        { $match: { assignedTo: { $ne: null } } },
        {
          $group: {
            _id: '$assignedTo',
            assigned: { $sum: 1 },
            converted: { $sum: { $cond: [{ $eq: ['$status', 'Converted'] }, 1, 0] } },
          },
        },
      ]),
    ]);
    const byId = Object.fromEntries(counts.map((c) => [String(c._id), c]));

    res.json({
      success: true,
      staff: staffMembers.map((m) => ({
        ...m.toObject(),
        assignedLeadsCount: byId[String(m._id)]?.assigned || 0,
        convertedLeadsCount: byId[String(m._id)]?.converted || 0,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching staff members' });
  }
};

// @route POST /api/staff  (admin)
exports.addStaffMember = async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';
    const phone = (req.body.phone || '').trim();
    const role = ROLES.includes(req.body.role) ? req.body.role : 'staff';

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const user = await User.create({ name, email, password, phone, role, status: 'active' });
    res.status(201).json({ success: true, message: 'Staff member added successfully', staff: publicUser(user) });
  } catch (error) {
    console.error('Error adding staff member:', error);
    res.status(500).json({ success: false, message: 'Failed to add staff member' });
  }
};

// @route PATCH /api/staff/:id/status  (admin)
exports.toggleStaffStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }
    const staff = await findStaff(req, res);
    if (!staff) return;

    if (status === 'disabled') {
      if (String(staff._id) === String(req.user._id)) {
        return res.status(400).json({ success: false, message: 'You cannot disable your own account' });
      }
      if (staff.role === 'admin' && (await otherActiveAdmins(staff._id)) === 0) {
        return res.status(400).json({ success: false, message: 'Cannot disable the last active administrator' });
      }
    }

    staff.status = status;
    await staff.save();
    res.json({ success: true, message: `Account set to ${status}`, staff: publicUser(staff) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating staff status' });
  }
};

// @route PUT /api/staff/:id  (admin)
exports.updateStaffMember = async (req, res) => {
  try {
    const { name, phone, role, password } = req.body;
    const staff = await findStaff(req, res);
    if (!staff) return;

    if (role && ROLES.includes(role) && role !== staff.role) {
      if (staff.role === 'admin' && role === 'staff' && (await otherActiveAdmins(staff._id)) === 0) {
        return res.status(400).json({ success: false, message: 'Cannot remove admin role from the last active administrator' });
      }
      staff.role = role;
    }
    if (name && name.trim()) staff.name = name.trim();
    if (phone !== undefined) staff.phone = String(phone).trim();
    if (password) {
      if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
      staff.password = password;
    }

    await staff.save();
    res.json({ success: true, message: 'Staff details updated', staff: publicUser(staff) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating staff details' });
  }
};
