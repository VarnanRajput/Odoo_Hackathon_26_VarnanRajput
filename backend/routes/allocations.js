const express = require('express');
const router = express.Router();
const { Asset, Allocation, User, ActivityLog, Notification } = require('../models');
const { protect, requireRole } = require('../middleware/auth');

// @route   GET api/allocations
// @desc    Get all allocations
router.get('/', protect, async (req, res, next) => {
  try {
    const allocations = await Allocation.find();
    res.json({ success: true, count: allocations.length, data: allocations });
  } catch (err) {
    next(err);
  }
});

// @route   POST api/allocations
// @desc    Create asset allocation (with Conflict Rule validation)
router.post('/', protect, requireRole(['Admin', 'Asset Manager']), async (req, res, next) => {
  const { assetId, assignedTo, assignedDepartment, expectedReturnDate, checkOutNotes } = req.body;

  try {
    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Conflict rule: You can't allocate an asset that is already taken
    if (asset.status !== 'Available') {
      // Find the active allocation
      const activeAlloc = await Allocation.findOne({ asset: assetId, status: 'Active' });
      let heldByName = 'Another user';
      let heldByUserId = '';

      if (activeAlloc && activeAlloc.assignedTo) {
        const holder = await User.findById(activeAlloc.assignedTo);
        if (holder) {
          heldByName = holder.name;
          heldByUserId = holder._id;
        }
      } else if (activeAlloc && activeAlloc.assignedDepartment) {
        heldByName = `Department: ${activeAlloc.assignedDepartment}`;
      }

      return res.status(409).json({
        success: false,
        conflict: true,
        message: `Asset is currently held by ${heldByName}`,
        currentlyHeldBy: {
          name: heldByName,
          userId: heldByUserId,
          allocationId: activeAlloc ? activeAlloc._id : null
        }
      });
    }

    // Proceed to allocate
    const allocation = await Allocation.create({
      asset: assetId,
      assignedTo: assignedTo || null,
      assignedDepartment: assignedDepartment || null,
      allocatedBy: req.user._id,
      expectedReturnDate: expectedReturnDate || null,
      checkOutNotes: checkOutNotes || '',
      status: 'Active'
    });

    // Update asset status
    await Asset.findByIdAndUpdate(assetId, { status: 'Allocated' });

    // Send notification
    if (assignedTo) {
      await Notification.create({
        recipient: assignedTo,
        title: 'New Asset Allocated',
        message: `Asset ${asset.name} (${asset.assetTag}) has been allocated to you. Expected return: ${expectedReturnDate || 'N/A'}.`,
        type: 'Asset Assigned'
      });
    }

    await ActivityLog.create({
      action: 'Asset Allocated',
      details: `Allocated asset ${asset.name} (${asset.assetTag}) to user/department.`,
      performedBy: req.user._id
    });

    res.status(201).json({ success: true, data: allocation });
  } catch (err) {
    next(err);
  }
});

// @route   PUT api/allocations/:id/return
// @desc    Return allocated asset
router.put('/:id/return', protect, requireRole(['Admin', 'Asset Manager']), async (req, res, next) => {
  const { checkInNotes, condition } = req.body;

  try {
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) {
      return res.status(404).json({ success: false, message: 'Allocation not found' });
    }

    if (allocation.status === 'Returned') {
      return res.status(400).json({ success: false, message: 'Asset has already been returned' });
    }

    // Update Allocation
    const updatedAlloc = await Allocation.findByIdAndUpdate(
      req.params.id,
      {
        actualReturnDate: new Date(),
        status: 'Returned',
        checkInNotes: checkInNotes || ''
      },
      { new: true }
    );

    // Revert Asset to Available
    const assetUpdate = { status: 'Available' };
    if (condition) assetUpdate.condition = condition;
    const asset = await Asset.findByIdAndUpdate(allocation.asset, assetUpdate);

    // Create Notification for the user
    if (allocation.assignedTo) {
      await Notification.create({
        recipient: allocation.assignedTo,
        title: 'Asset Returned Successfully',
        message: `Asset ${asset ? asset.name : 'item'} return confirmed by manager.`,
        type: 'Return Confirmed'
      });
    }

    await ActivityLog.create({
      action: 'Asset Returned',
      details: `Asset return confirmed for allocation ID: ${allocation._id}. Condition: ${condition || 'N/A'}.`,
      performedBy: req.user._id
    });

    res.json({ success: true, data: updatedAlloc });
  } catch (err) {
    next(err);
  }
});

// @route   POST api/allocations/transfer-request
// @desc    Initiate a transfer request for an allocated asset
router.post('/transfer-request', protect, async (req, res, next) => {
  const { assetId, targetUserId, notes } = req.body;

  try {
    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Get current active allocation
    const activeAlloc = await Allocation.findOne({ asset: assetId, status: 'Active' });
    if (!activeAlloc) {
      return res.status(400).json({ success: false, message: 'Asset has no active allocations to transfer' });
    }

    // Log a transfer request notification to Asset Managers
    const managers = await User.find({ role: { $in: ['Admin', 'Asset Manager'] } });
    
    // Create notifications for managers
    for (const mgr of managers) {
      await Notification.create({
        recipient: mgr._id,
        title: 'Transfer Request Submitted',
        message: `${req.user.name} is requesting transfer of asset ${asset.name} (${asset.assetTag}) currently held by another user.`,
        type: 'Transfer Requested'
      });
    }

    // Store in global activity log
    await ActivityLog.create({
      action: 'Transfer Requested',
      details: `Transfer of asset ${asset.name} requested by ${req.user.name} for employee ID: ${targetUserId}.`,
      performedBy: req.user._id
    });

    // Mock response representing accepted transfer record
    res.json({
      success: true,
      message: 'Transfer request submitted successfully. Awaiting Manager approval.'
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST api/allocations/:id/approve-transfer
// @desc    Approve transfer request and execute re-allocation
router.post('/:id/approve-transfer', protect, requireRole(['Admin', 'Asset Manager']), async (req, res, next) => {
  const { targetUserId } = req.body;

  try {
    const originalAlloc = await Allocation.findById(req.params.id);
    if (!originalAlloc) {
      return res.status(404).json({ success: false, message: 'Allocation not found' });
    }

    // Complete original allocation
    await Allocation.findByIdAndUpdate(req.params.id, {
      actualReturnDate: new Date(),
      status: 'Returned',
      checkInNotes: `Transferred directly to user ${targetUserId}`
    });

    // Create new allocation
    const newAlloc = await Allocation.create({
      asset: originalAlloc.asset,
      assignedTo: targetUserId,
      allocatedBy: req.user._id,
      status: 'Active',
      checkOutNotes: 'Acquired via Direct Manager Transfer Approval'
    });

    const asset = await Asset.findById(originalAlloc.asset);

    // Notify new holder
    await Notification.create({
      recipient: targetUserId,
      title: 'Transfer Approved',
      message: `Asset ${asset ? asset.name : 'item'} transfer approved. It is now allocated to you.`,
      type: 'Transfer Approved'
    });

    await ActivityLog.create({
      action: 'Transfer Approved',
      details: `Approved asset transfer from allocation ${originalAlloc._id} to new user ${targetUserId}.`,
      performedBy: req.user._id
    });

    res.json({ success: true, data: newAlloc });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
