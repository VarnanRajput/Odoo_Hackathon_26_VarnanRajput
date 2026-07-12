const express = require('express');
const router = express.Router();
const { Category, ActivityLog } = require('../models');
const { protect, requireRole } = require('../middleware/auth');

// @route   GET api/categories
// @desc    Get all categories
router.get('/', protect, async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.json({ success: true, count: categories.length, data: categories });
  } catch (err) {
    next(err);
  }
});

// @route   POST api/categories
// @desc    Create an asset category (Admin only)
router.post('/', protect, requireRole(['Admin']), async (req, res, next) => {
  const { name, fields } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const exists = await Category.findOne({ name });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Category name already exists' });
    }

    const category = await Category.create({
      name,
      fields: fields || []
    });

    await ActivityLog.create({
      action: 'Asset Category Created',
      details: `Created category ${name}.`,
      performedBy: req.user._id
    });

    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
});

// @route   PUT api/categories/:id
// @desc    Update category (Admin only)
router.put('/:id', protect, requireRole(['Admin']), async (req, res, next) => {
  const { name, fields } = req.body;

  try {
    let category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: name || category.name,
        fields: fields || category.fields
      },
      { new: true }
    );

    await ActivityLog.create({
      action: 'Asset Category Updated',
      details: `Updated category ${updated.name}.`,
      performedBy: req.user._id
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
