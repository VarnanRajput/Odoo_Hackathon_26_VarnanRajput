const express = require('express');
const router = express.Router();
const { Maintenance, Asset, ActivityLog, Notification, User } = require('../models');
const { protect, requireRole } = require('../middleware/auth');

// @route   GET api/maintenance
// @desc    Get all maintenance requests
router.get('/', protect, async (req, res, next) => {
  const { assetId } = req.query;

  try {
    const query = {};
    if (assetId) query.asset = assetId;

    const list = await Maintenance.find(query);
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    next(err);
  }
});

// @route   POST api/maintenance
// @desc    Raise a new maintenance request
router.post('/', protect, async (req, res, next) => {
  const { assetId, issueDescription, priority, photo } = req.body;

  try {
    if (!assetId || !issueDescription) {
      return res.status(400).json({ success: false, message: 'Please provide asset ID and issue description' });
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    const request = await Maintenance.create({
      asset: assetId,
      reportedBy: req.user._id,
      issueDescription,
      priority: priority || 'Medium',
      photo: photo || '',
      status: 'Pending'
    });

    // Notify Asset Managers
    const managers = await User.find({ role: { $in: ['Admin', 'Asset Manager'] } });
    for (const mgr of managers) {
      await Notification.create({
        recipient: mgr._id,
        title: 'Maintenance Request Raised',
        message: `${req.user.name} reported an issue with ${asset.name} (${asset.assetTag}): "${issueDescription.substring(0, 30)}..."`,
        type: 'Maintenance Raised'
      });
    }

    await ActivityLog.create({
      action: 'Maintenance Requested',
      details: `Raised maintenance ticket for ${asset.name} (${asset.assetTag}). Priority: ${priority}.`,
      performedBy: req.user._id
    });

    res.status(201).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
});

// @route   PUT api/maintenance/:id/status
// @desc    Update maintenance request workflow status (Asset Managers & Admins only)
router.put('/:id/status', protect, requireRole(['Admin', 'Asset Manager']), async (req, res, next) => {
  const { status, technician, notes } = req.body;

  try {
    if (!['Approved', 'Rejected', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid workflow status step' });
    }

    let request = await Maintenance.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Maintenance ticket not found' });
    }

    const updateData = { status };
    if (technician !== undefined) updateData.technician = technician;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await Maintenance.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    const asset = await Asset.findById(request.asset);

    // Auto-update Asset Status:
    // 1. On Approval: Flip asset to "Under Maintenance"
    if (status === 'Approved' || status === 'In Progress') {
      await Asset.findByIdAndUpdate(request.asset, { status: 'Under Maintenance' });
    }
    // 2. On Resolution: Flip asset back to "Available"
    if (status === 'Resolved') {
      await Asset.findByIdAndUpdate(request.asset, { status: 'Available' });
    }

    // Notify Reporter
    await Notification.create({
      recipient: request.reportedBy,
      title: `Maintenance Request ${status}`,
      message: `Your maintenance ticket for ${asset ? asset.name : 'item'} has been marked as ${status}.`,
      type: `Maintenance ${status}`
    });

    await ActivityLog.create({
      action: `Maintenance Ticket ${status}`,
      details: `Updated ticket ${request._id} status to ${status}. Notes: ${notes || 'None'}.`,
      performedBy: req.user._id
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
