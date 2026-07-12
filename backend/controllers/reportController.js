const { Asset, Category, Department, Allocation, Booking, Maintenance, sequelize } = require("../models");
const { Op } = require("sequelize");

exports.getAssetUtilization = async (req, res) => {
  try {
    // 1. Most allocated assets (count of allocations)
    const mostAllocated = await Allocation.findAll({
      attributes: [
        "assetId",
        [sequelize.fn("COUNT", sequelize.col("assetId")), "allocationCount"],
      ],
      group: ["assetId"],
      include: [
        {
          model: Asset,
          attributes: ["id", "assetCode", "name", "status"],
        },
      ],
      order: [[sequelize.literal("allocationCount"), "DESC"]],
      limit: 10,
    });

    // 2. Idle assets (Available and no current allocations)
    const idleAssets = await Asset.findAll({
      where: {
        status: "Available",
      },
      include: [
        {
          model: Category,
          attributes: ["id", "name"],
        },
      ],
      limit: 10,
    });

    return res.json({
      success: true,
      data: {
        mostAllocated,
        idleAssets,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getMaintenanceFrequency = async (req, res) => {
  try {
    const allMaintenance = await Maintenance.findAll({
      include: [
        {
          model: Asset,
          include: [Category],
        },
      ],
    });

    const assetMap = {};
    const categoryMap = {};

    allMaintenance.forEach((m) => {
      if (m.Asset) {
        const assetId = m.Asset.id;
        if (!assetMap[assetId]) {
          assetMap[assetId] = {
            assetId,
            assetCode: m.Asset.assetCode,
            name: m.Asset.name,
            maintenanceCount: 0,
          };
        }
        assetMap[assetId].maintenanceCount++;

        if (m.Asset.Category) {
          const catId = m.Asset.categoryId;
          const catName = m.Asset.Category.name;
          if (!categoryMap[catId]) {
            categoryMap[catId] = {
              categoryId: catId,
              categoryName: catName,
              maintenanceCount: 0,
            };
          }
          categoryMap[catId].maintenanceCount++;
        }
      }
    });

    const byAsset = Object.values(assetMap)
      .sort((a, b) => b.maintenanceCount - a.maintenanceCount)
      .slice(0, 10);

    const byCategory = Object.values(categoryMap)
      .sort((a, b) => b.maintenanceCount - a.maintenanceCount);

    return res.json({
      success: true,
      data: {
        byAsset,
        byCategory,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getRetirementReports = async (req, res) => {
  try {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    const threeYearsAgoStr = threeYearsAgo.toISOString().split("T")[0];

    // Nearing retirement: condition is Poor/Damaged OR older than 3 years
    const assets = await Asset.findAll({
      where: {
        [Op.or]: [
          { condition: ["Poor", "Damaged"] },
          { purchaseDate: { [Op.lte]: threeYearsAgoStr } },
        ],
      },
      include: [Category, Department],
    });

    return res.json({
      success: true,
      data: assets,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getDepartmentAllocations = async (req, res) => {
  try {
    const summary = await Asset.findAll({
      attributes: [
        "departmentId",
        [sequelize.fn("COUNT", sequelize.col("departmentId")), "assetCount"],
      ],
      group: ["departmentId"],
      include: [
        {
          model: Department,
          attributes: ["id", "name", "code"],
        },
      ],
    });

    return res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getBookingHeatmap = async (req, res) => {
  try {
    // Retrieve all bookings and group them by day of week & hour to return slot distribution
    const bookings = await Booking.findAll({
      where: {
        status: { [Op.ne]: "Cancelled" },
      },
      attributes: ["startTime"],
    });

    const heatmap = {
      days: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }, // Sun-Sat counts
      hours: {}, // 0-23 counts
    };

    // Initialize hour counts
    for (let i = 0; i < 24; i++) {
      heatmap.hours[i] = 0;
    }

    bookings.forEach((booking) => {
      const date = new Date(booking.startTime);
      const day = date.getDay();
      const hour = date.getHours();

      heatmap.days[day] = (heatmap.days[day] || 0) + 1;
      heatmap.hours[hour] = (heatmap.hours[hour] || 0) + 1;
    });

    return res.json({
      success: true,
      data: heatmap,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.exportAllAssetsReport = async (req, res) => {
  try {
    const assets = await Asset.findAll({
      include: [
        Category,
        Department,
      ],
    });

    // Generate CSV contents
    let csv = "Asset Tag,Asset Name,Category,Serial Number,Purchase Date,Purchase Cost,Location,Status,Condition,Is Shared/Bookable\n";
    assets.forEach((asset) => {
      csv += `"${asset.assetCode}","${asset.name}","${asset.Category ? asset.Category.name : "N/A"}","${asset.serialNumber}","${asset.purchaseDate || "N/A"}","${asset.purchaseCost || 0.0}","${asset.location || "N/A"}","${asset.status}","${asset.condition}","${asset.isBookable ? "Yes" : "No"}"\n`;
    });

    res.header("Content-Type", "text/csv");
    res.attachment("assetflow_assets_report.csv");
    return res.send(csv);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
