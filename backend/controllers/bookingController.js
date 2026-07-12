const { Booking, Asset, User } = require("../models");
const { Op } = require("sequelize");
const { logActivity, notifyUser } = require("../utils/logAndNotify");

// Helper to refresh booking statuses based on current time
const refreshBookingStatuses = async () => {
  try {
    const now = new Date();
    // 1. Mark past bookings as Completed
    await Booking.update(
      { status: "Completed" },
      {
        where: {
          status: ["Upcoming", "Ongoing"],
          endTime: { [Op.lt]: now },
        },
      }
    );
    // 2. Mark current active bookings as Ongoing
    await Booking.update(
      { status: "Ongoing" },
      {
        where: {
          status: "Upcoming",
          startTime: { [Op.lte]: now },
          endTime: { [Op.gt]: now },
        },
      }
    );
  } catch (error) {
    console.error("Failed to refresh booking statuses:", error);
  }
};

exports.createBooking = async (req, res) => {
  try {
    const { assetId, employeeId, startTime, endTime, purpose } = req.body;

    if (!assetId || !employeeId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Asset ID, Employee ID, Start Time, and End Time are required",
      });
    }

    const asset = await Asset.findByPk(assetId);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    // Check if the asset is shared/bookable
    if (!asset.isBookable) {
      return res.status(400).json({
        success: false,
        message: "This asset is not marked as a shared/bookable resource.",
      });
    }

    // Refresh booking statuses before checking for overlap
    await refreshBookingStatuses();

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "Start time must be before end time",
      });
    }

    // Check for overlap
    const overlap = await Booking.findOne({
      where: {
        assetId,
        status: { [Op.ne]: "Cancelled" },
        startTime: { [Op.lt]: end },
        endTime: { [Op.gt]: start },
      },
    });

    if (overlap) {
      return res.status(400).json({
        success: false,
        message: "Overlap validation: The resource is already booked during this time slot.",
      });
    }

    const now = new Date();
    let initialStatus = "Upcoming";
    if (start <= now && end > now) {
      initialStatus = "Ongoing";
    }

    const booking = await Booking.create({
      assetId,
      employeeId,
      startTime: start,
      endTime: end,
      purpose,
      status: initialStatus,
    });

    const actorId = req.user ? req.user.id : employeeId;
    await logActivity(
      actorId,
      "BOOK_RESOURCE",
      `Booked resource ${asset.name} (${asset.assetCode}) from ${startTime} to ${endTime}`
    );

    await notifyUser(
      employeeId,
      `Your booking for ${asset.name} (${asset.assetCode}) has been confirmed for ${startTime} to ${endTime}.`,
      "Booking Confirmed"
    );

    return res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getBookings = async (req, res) => {
  try {
    await refreshBookingStatuses();

    const bookings = await Booking.findAll({
      include: [
        Asset,
        {
          model: User,
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["startTime", "ASC"]],
    });

    return res.json({
      success: true,
      data: bookings,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status === "Cancelled" || booking.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: `Booking is already ${booking.status}`,
      });
    }

    booking.status = "Cancelled";
    await booking.save();

    const asset = await Asset.findByPk(booking.assetId);

    const actorId = req.user ? req.user.id : booking.employeeId;
    await logActivity(
      actorId,
      "CANCEL_BOOKING",
      `Cancelled booking for asset ${asset ? asset.name : "ID " + booking.assetId}`
    );

    await notifyUser(
      booking.employeeId,
      `Your booking for ${asset ? asset.name : "Asset ID " + booking.assetId} has been cancelled.`,
      "Booking Cancelled"
    );

    return res.json({
      success: true,
      message: "Booking Cancelled",
      data: booking,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.rescheduleBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status === "Cancelled" || booking.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule a ${booking.status} booking`,
      });
    }

    const { startTime, endTime } = req.body;
    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "New start time and end time are required",
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "Start time must be before end time",
      });
    }

    // Check for overlap, excluding this current booking ID
    const overlap = await Booking.findOne({
      where: {
        assetId: booking.assetId,
        id: { [Op.ne]: booking.id },
        status: { [Op.ne]: "Cancelled" },
        startTime: { [Op.lt]: end },
        endTime: { [Op.gt]: start },
      },
    });

    if (overlap) {
      return res.status(400).json({
        success: false,
        message: "Overlap validation: The resource is already booked during the new time slot.",
      });
    }

    const now = new Date();
    let updatedStatus = "Upcoming";
    if (start <= now && end > now) {
      updatedStatus = "Ongoing";
    }

    booking.startTime = start;
    booking.endTime = end;
    booking.status = updatedStatus;
    await booking.save();

    const asset = await Asset.findByPk(booking.assetId);

    const actorId = req.user ? req.user.id : booking.employeeId;
    await logActivity(
      actorId,
      "RESCHEDULE_BOOKING",
      `Rescheduled booking for ${asset ? asset.name : "ID " + booking.assetId} to ${startTime} - ${endTime}`
    );

    await notifyUser(
      booking.employeeId,
      `Your booking for ${asset ? asset.name : "Asset ID " + booking.assetId} has been rescheduled to ${startTime} - ${endTime}.`,
      "Booking Rescheduled"
    );

    return res.json({
      success: true,
      message: "Booking rescheduled successfully",
      data: booking,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};