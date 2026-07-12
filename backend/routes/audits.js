const express = require('express');
const router = express.Router();
const { Audit, Asset, ActivityLog, Notification, User } = require('../models');
const { protect, requireRole } = require('../middleware/auth');

// @route   GET api/audits
// @desc    Get all audit cycles
router.get('/', protect, async (req, res, next) => {
  try {
    const audits = await Audit.find();
    res.json({ success: true, count: audits.length, data: audits });
  } catch (err) {
    next(err);
  }
});

// @route   GET api/audits/:id
// @desc    Get a single audit cycle details
router.get('/:id', protect, async (req, res, next) => {
  try {
    const audit = await Audit.findById(req.params.id);
    if (!audit) {
      return res.status(404).json({ success: false, message: 'Audit cycle not found' });
    }
    res.json({ success: true, data: audit });
  } catch (err) {
    next(err);
  }
});

// @route   POST api/audits
// @desc    Create a new audit cycle (Admin only)
router.post('/', protect, requireRole(['Admin']), async (req, res, next) => {
  const { title, scopeDepartment, scopeLocation, startDate, endDate, auditors } = req.body;

  try {
    if (!title || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Title, start date and end date are required' });
    }

    // Find all assets matching department/location scope
    let assetQuery = {};
    if (scopeLocation) assetQuery.location = scopeLocation;
    
    let matchingAssets = await Asset.find(assetQuery);

    // If department scope, filter out assets not allocated to that department
    // In our simplified structure we can filter them
    if (scopeDepartment) {
      // In production we would join with allocations, for this we match assets
      // (For this mock/simple logic, we'll include all assets matching location)
    }

    // Populate items array
    const items = matchingAssets.map(asset => ({
      asset: asset._id,
      auditor: auditors && auditors.length > 0 ? auditors[0] : null,
      verificationStatus: 'Pending',
      notes: '',
      verifiedAt: null
    }));

    const audit = await Audit.create({
      title,
      scopeDepartment: scopeDepartment || null,
      scopeLocation: scopeLocation || '',
      startDate,
      endDate,
      auditors: auditors || [],
      status: 'Active',
      items
    });

    // Notify auditors
    if (auditors && auditors.length > 0) {
      for (const audId of auditors) {
        await Notification.create({
          recipient: audId,
          title: 'Assigned to Audit Cycle',
          message: `You have been assigned as an auditor for the cycle "${title}".`,
          type: 'Audit Assigned'
        });
      }
    }

    await ActivityLog.create({
      action: 'Audit Cycle Created',
      details: `Created audit cycle "${title}" with ${items.length} items.`,
      performedBy: req.user._id
    });

    res.status(201).json({ success: true, data: audit });
  } catch (err) {
    next(err);
  }
});

// @route   PUT api/audits/:id/verify/:assetId
// @desc    Auditor updates physical verification of an asset
router.put('/:id/verify/:assetId', protect, async (req, res, next) => {
  const { verificationStatus, notes } = req.body;

  try {
    if (!['Verified', 'Missing', 'Damaged'].includes(verificationStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid verification status' });
    }

    const audit = await Audit.findById(req.params.id);
    if (!audit) {
      return res.status(404).json({ success: false, message: 'Audit cycle not found' });
    }

    if (audit.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'This audit cycle is not currently active' });
    }

    // Find the item inside cycle
    const itemIndex = audit.items.findIndex(item => item.asset.toString() === req.params.assetId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Asset is not part of this audit scope' });
    }

    // Update item
    audit.items[itemIndex].verificationStatus = verificationStatus;
    audit.items[itemIndex].notes = notes || '';
    audit.items[itemIndex].verifiedAt = new Date().toISOString();
    audit.items[itemIndex].auditor = req.user._id;

    const updated = await Audit.findByIdAndUpdate(req.params.id, { items: audit.items }, { new: true });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// @route   PUT api/audits/:id/close
// @desc    Close Audit Cycle and process discrepancies (Admin only)
router.put('/:id/close', protect, requireRole(['Admin']), async (req, res, next) => {
  try {
    const audit = await Audit.findById(req.params.id);
    if (!audit) {
      return res.status(404).json({ success: false, message: 'Audit cycle not found' });
    }

    if (audit.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'Audit cycle is already completed/closed' });
    }

    // Process discrepancies and update assets
    let missingCount = 0;
    let damagedCount = 0;

    for (const item of audit.items) {
      if (item.verificationStatus === 'Missing') {
        missingCount++;
        // Update asset to Lost
        await Asset.findByIdAndUpdate(item.asset, { status: 'Lost' });
      } else if (item.verificationStatus === 'Damaged') {
        damagedCount++;
        // Update condition
        await Asset.findByIdAndUpdate(item.asset, { condition: 'Damaged' });
      }
    }

    const updated = await Audit.findByIdAndUpdate(req.params.id, { status: 'Completed' }, { new: true });

    // Generate discrepancy log details
    const reportText = `Audit Cycle "${audit.title}" closed. Discrepancy details - Missing: ${missingCount}, Damaged: ${damagedCount}.`;

    await ActivityLog.create({
      action: 'Audit Cycle Closed',
      details: reportText,
      performedBy: req.user._id
    });

    // Notify Asset Managers
    const managers = await User.find({ role: { $in: ['Admin', 'Asset Manager'] } });
    for (const mgr of managers) {
      await Notification.create({
        recipient: mgr._id,
        title: 'Audit Discrepancy Report',
        message: reportText,
        type: 'Audit Discrepancy'
      });
    }

    res.json({ success: true, data: updated, discrepancyReport: { missing: missingCount, damaged: damagedCount } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
