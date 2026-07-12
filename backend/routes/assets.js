const express = require('express');
const router = express.Router();
const { Asset, Allocation, Maintenance, ActivityLog } = require('../models');
const { protect, requireRole } = require('../middleware/auth');

// @route   GET api/assets
// @desc    Get all assets (with optional search/filtering)
router.get('/', protect, async (req, res, next) => {
  const { search, category, status, location, shared, department } = req.query;

  try {
    let query = {};

    if (search) {
      // Basic regex or query mapping
      query.$or = [
        { name: search },
        { assetTag: search },
        { serialNumber: search },
        { location: search }
      ];
    }

    if (category) query.category = category;
    if (status) query.status = status;
    if (location) query.location = location;
    if (shared !== undefined) query.shared = shared === 'true';

    let assets = await Asset.find(query);

    // Filter by department if specified
    if (department) {
      // Find active allocations in department, map asset IDs
      const activeAllocations = await Allocation.find({
        assignedDepartment: department,
        status: 'Active'
      });
      const assetIds = activeAllocations.map(alloc => alloc.asset);
      assets = assets.filter(asset => assetIds.includes(asset._id));
    }

    res.json({ success: true, count: assets.length, data: assets });
  } catch (err) {
    next(err);
  }
});

// @route   GET api/assets/:id
// @desc    Get detailed asset with allocation and maintenance history
router.get('/:id', protect, async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Get allocations history
    const allocations = await Allocation.find({ asset: asset._id });
    
    // Get maintenance history
    const maintenance = await Maintenance.find({ asset: asset._id });

    res.json({
      success: true,
      data: asset,
      history: {
        allocations: allocations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        maintenance: maintenance.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      }
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST api/assets
// @desc    Register a new asset (Admin & Asset Manager only)
router.post('/', protect, requireRole(['Admin', 'Asset Manager']), async (req, res, next) => {
  const { name, category, serialNumber, acquisitionDate, acquisitionCost, condition, location, photo, shared } = req.body;

  try {
    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Name and Category are required' });
    }

    // Generate unique Asset Tag: e.g., AF-0001
    const totalAssets = await Asset.countDocuments();
    const assetTag = `AF-${String(totalAssets + 1).padStart(4, '0')}`;

    const newAsset = await Asset.create({
      name,
      category,
      assetTag,
      serialNumber: serialNumber || '',
      acquisitionDate: acquisitionDate || new Date(),
      acquisitionCost: Number(acquisitionCost) || 0,
      condition: condition || 'Good',
      location: location || '',
      photo: photo || '',
      shared: shared === true || shared === 'true',
      status: 'Available'
    });

    await ActivityLog.create({
      action: 'Asset Registered',
      details: `Registered asset ${name} with tag ${assetTag}.`,
      performedBy: req.user._id
    });

    res.status(201).json({ success: true, data: newAsset });
  } catch (err) {
    next(err);
  }
});

// @route   PUT api/assets/:id
// @desc    Update asset details (Admin & Asset Manager only)
router.put('/:id', protect, requireRole(['Admin', 'Asset Manager']), async (req, res, next) => {
  try {
    let asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    const updated = await Asset.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );

    await ActivityLog.create({
      action: 'Asset Updated',
      details: `Updated asset details for ${updated.name} (${updated.assetTag}).`,
      performedBy: req.user._id
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
