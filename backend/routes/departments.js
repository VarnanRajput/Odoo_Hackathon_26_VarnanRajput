const express = require('express');
const router = express.Router();
const { Department, User, ActivityLog } = require('../models');
const { protect, requireRole } = require('../middleware/auth');

// @route   GET api/departments
// @desc    Get all departments
router.get('/', protect, async (req, res, next) => {
  try {
    const departments = await Department.find();
    res.json({ success: true, count: departments.length, data: departments });
  } catch (err) {
    next(err);
  }
});

// @route   POST api/departments
// @desc    Create a department (Admin only)
router.post('/', protect, requireRole(['Admin']), async (req, res, next) => {
  const { name, manager, parentDepartment, status } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ success: false, message: 'Department name is required' });
    }

    const exists = await Department.findOne({ name });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Department name already exists' });
    }

    const dept = await Department.create({
      name,
      manager: manager || null,
      parentDepartment: parentDepartment || null,
      status: status || 'Active'
    });

    await ActivityLog.create({
      action: 'Department Created',
      details: `Created department ${name}.`,
      performedBy: req.user._id
    });

    res.status(201).json({ success: true, data: dept });
  } catch (err) {
    next(err);
  }
});

// @route   PUT api/departments/:id
// @desc    Update a department (Admin only)
router.put('/:id', protect, requireRole(['Admin']), async (req, res, next) => {
  const { name, manager, parentDepartment, status } = req.body;

  try {
    let dept = await Department.findById(req.params.id);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Check name uniqueness if changed
    if (name && name !== dept.name) {
      const exists = await Department.findOne({ name });
      if (exists) {
        return res.status(400).json({ success: false, message: 'Department name already exists' });
      }
    }

    // Update fields
    const updated = await Department.findByIdAndUpdate(
      req.params.id,
      {
        name: name || dept.name,
        manager: manager !== undefined ? manager : dept.manager,
        parentDepartment: parentDepartment !== undefined ? parentDepartment : dept.parentDepartment,
        status: status || dept.status
      },
      { new: true }
    );

    // If manager was assigned, update the manager's department field
    if (manager) {
      await User.findByIdAndUpdate(manager, { department: updated._id });
    }

    await ActivityLog.create({
      action: 'Department Updated',
      details: `Updated department ${updated.name}.`,
      performedBy: req.user._id
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
