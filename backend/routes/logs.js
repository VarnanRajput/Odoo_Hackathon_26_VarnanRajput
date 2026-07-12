const express = require('express');
const router = express.Router();
const { ActivityLog } = require('../models');
const { protect, requireRole } = require('../middleware/auth');

// @route   GET api/logs
// @desc    Get system activity logs (Admins & Asset Managers only)
router.get('/', protect, requireRole(['Admin', 'Asset Manager']), async (req, res, next) => {
  try {
    const logs = await ActivityLog.find();
    // Sort logs descending (newest first)
    const sorted = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json({ success: true, count: sorted.length, data: sorted });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
