const express = require('express');
const router = express.Router();
const { Notification } = require('../models');
const { protect } = require('../middleware/auth');

// @route   GET api/notifications
// @desc    Get user notifications
router.get('/', protect, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id });
    const sorted = notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json({ success: true, count: sorted.length, data: sorted });
  } catch (err) {
    next(err);
  }
});

// @route   PUT api/notifications/:id/read
// @desc    Mark a notification as read
router.put('/:id/read', protect, async (req, res, next) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notif.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updated = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// @route   PUT api/notifications/read-all
// @desc    Mark all user notifications as read
router.put('/read-all', protect, async (req, res, next) => {
  try {
    const list = await Notification.find({ recipient: req.user._id, read: false });
    
    for (const item of list) {
      await Notification.findByIdAndUpdate(item._id, { read: true });
    }

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
