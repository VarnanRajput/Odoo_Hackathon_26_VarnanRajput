const { Asset, Department, User, Maintenance, Booking, TransferRequest, Allocation, ActivityLog } = require("../models");
const { Op } = require("sequelize");

exports.getDashboard = async (req, res) => {
  try {
    const totalAssets = await Asset.count();

    const availableAssets = await Asset.count({
      where: { status: "Available" },
    });

    const allocatedAssets = await Asset.count({
      where: { status: "Allocated" },
    });

    const underMaintenanceAssets = await Asset.count({
      where: { status: "Under Maintenance" },
    });

    const maintenanceToday = await Maintenance.count({
      where: {
        status: {
          [Op.in]: ["Pending", "Approved", "Technician Assigned", "In Progress"],
        },
      },
    });

    const activeBookings = await Booking.count({
      where: { status: "Ongoing" },
    });

    const pendingTransfers = await TransferRequest.count({
      where: { status: "Pending" },
    });

    const todayStr = new Date().toISOString().split("T")[0];

    const upcomingReturns = await Allocation.count({
      where: {
        status: "Allocated",
        expectedReturnDate: {
          [Op.gte]: todayStr,
        },
      },
    });

    const overdueReturns = await Allocation.count({
      where: {
        status: "Allocated",
        expectedReturnDate: {
          [Op.lt]: todayStr,
        },
      },
    });

    const overdueReturnsList = await Allocation.findAll({
      where: {
        status: "Allocated",
        expectedReturnDate: {
          [Op.lt]: todayStr,
        },
      },
      include: [
        Asset,
        {
          model: User,
          as: "Employee",
          attributes: ["id", "name", "email"],
        },
      ],
      limit: 10,
    });

    const recentActivity = await ActivityLog.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "name", "role"],
        },
      ],
      order: [["id", "DESC"]],
      limit: 10,
    });

    return res.json({
      success: true,
      data: {
        totalAssets,
        availableAssets,
        allocatedAssets,
        underMaintenanceAssets,
        maintenanceToday,
        activeBookings,
        pendingTransfers,
        upcomingReturns,
        overdueReturns,
        overdueReturnsList,
        recentActivity,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};