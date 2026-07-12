const express = require('express');
const router = express.Router();
const { User, ActivityLog } = require('../models');
const { protect, requireRole } = require('../middleware/auth');

// @route   GET api/employees
// @desc    Get all employees/users directory
router.get('/', protect, async (req, res, next) => {
  try {
    const employees = await User.find();
    
    // Remove password hash from list
    const cleaned = employees.map(emp => {
      const { password, ...rest } = emp;
      return rest;
    });

    res.json({ success: true, count: cleaned.length, data: cleaned });
  } catch (err) {
    next(err);
  }
});

// @route   PUT api/employees/:id/promote
// @desc    Promote/demote user role (Admin only)
router.put('/:id/promote', protect, requireRole(['Admin']), async (req, res, next) => {
  const { role, department, status } = req.body;

  try {
    if (role && !['Admin', 'Asset Manager', 'Department Head', 'Employee'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role selection' });
    }

    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const updateData = {};
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (status !== undefined) updateData.status = status;

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    await ActivityLog.create({
      action: 'Employee Role Promoted',
      details: `Updated ${updated.name}'s role to ${updated.role} in department ${updated.department || 'None'}.`,
      performedBy: req.user._id
    });

    res.json({
      success: true,
      data: {
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        department: updated.department,
        status: updated.status
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
