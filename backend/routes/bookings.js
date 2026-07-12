const express = require('express');
const router = express.Router();
const { Booking, Asset, ActivityLog, Notification } = require('../models');
const { protect } = require('../middleware/auth');

// @route   GET api/bookings
// @desc    Get bookings (filter by resource or user)
router.get('/', protect, async (req, res, next) => {
  const { resourceId, bookedBy } = req.query;

  try {
    const query = {};
    if (resourceId) query.resource = resourceId;
    if (bookedBy) query.bookedBy = bookedBy;

    const bookings = await Booking.find(query);
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    next(err);
  }
});

// @route   POST api/bookings
// @desc    Book a shared resource (with overlap validation)
router.post('/', protect, async (req, res, next) => {
  const { resourceId, startTime, endTime, purpose } = req.body;

  try {
    if (!resourceId || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Please specify resource, start time, and end time' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    const asset = await Asset.findById(resourceId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    if (!asset.shared) {
      return res.status(400).json({ success: false, message: 'This asset is not flagged as a shared/bookable resource' });
    }

    // Overlap validation: check for overlapping bookings that are active
    const activeBookings = await Booking.find({
      resource: resourceId,
      status: { $in: ['Upcoming', 'Ongoing'] }
    });

    const overlap = activeBookings.some(booking => {
      const bStart = new Date(booking.startTime);
      const bEnd = new Date(booking.endTime);
      // Overlap formula: (start < bEnd) && (end > bStart)
      return start < bEnd && end > bStart;
    });

    if (overlap) {
      return res.status(409).json({
        success: false,
        message: 'Time slot conflict: The resource is already booked during these hours. Please choose another time.'
      });
    }

    // Create booking
    const booking = await Booking.create({
      resource: resourceId,
      bookedBy: req.user._id,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      status: 'Upcoming',
      purpose: purpose || ''
    });

    // Notify user
    await Notification.create({
      recipient: req.user._id,
      title: 'Booking Confirmed',
      message: `Your booking for ${asset.name} has been confirmed. Time: ${start.toLocaleString()} - ${end.toLocaleString()}.`,
      type: 'Booking Confirmed'
    });

    await ActivityLog.create({
      action: 'Resource Booked',
      details: `Booked shared resource ${asset.name} (${asset.assetTag}) for slot: ${start.toLocaleString()} - ${end.toLocaleString()}.`,
      performedBy: req.user._id
    });

    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
});

// @route   PUT api/bookings/:id/cancel
// @desc    Cancel a booking
router.put('/:id/cancel', protect, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Ensure only the person who booked or a manager/admin can cancel
    if (
      booking.bookedBy !== req.user._id.toString() &&
      !['Admin', 'Asset Manager'].includes(req.user.role)
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'Cancelled' },
      { new: true }
    );

    const asset = await Asset.findById(booking.resource);

    // Notify
    await Notification.create({
      recipient: booking.bookedBy,
      title: 'Booking Cancelled',
      message: `Booking for ${asset ? asset.name : 'shared resource'} has been cancelled.`,
      type: 'Booking Cancelled'
    });

    await ActivityLog.create({
      action: 'Resource Booking Cancelled',
      details: `Cancelled booking for asset ID: ${booking.resource}.`,
      performedBy: req.user._id
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
