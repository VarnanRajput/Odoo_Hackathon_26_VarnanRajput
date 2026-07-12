const { AuditCycle, AuditItem, Asset, User, Department } = require("../models");
const { logActivity, notifyUser, notifyRoles } = require("../utils/logAndNotify");
const { Op } = require("sequelize");

exports.createAuditCycle = async (req, res) => {
  try {
    const { name, scopeType, scopeValue, startDate, endDate, auditorIds } = req.body;

    if (!name || !scopeType || !scopeValue || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Name, scopeType, scopeValue, startDate, and endDate are required",
      });
    }

    const cycle = await AuditCycle.create({
      name,
      scopeType,
      scopeValue,
      startDate,
      endDate,
      auditorIds: auditorIds || [],
      status: "Draft",
    });

    // Automatically retrieve matching assets and create AuditItems
    const assetQuery = {};
    if (scopeType === "Department") {
      assetQuery.departmentId = scopeValue;
    } else if (scopeType === "Location") {
      assetQuery.location = { [Op.like]: `%${scopeValue}%` };
    }

    const assets = await Asset.findAll({ where: assetQuery });

    const auditItems = assets.map((asset) => ({
      auditCycleId: cycle.id,
      assetId: asset.id,
      status: "Pending",
    }));

    if (auditItems.length > 0) {
      await AuditItem.bulkCreate(auditItems);
    }

    const actorId = req.user ? req.user.id : 1;
    await logActivity(
      actorId,
      "AUDIT_CYCLE_CREATE",
      `Created audit cycle ${name} with scope ${scopeType}:${scopeValue}. Found ${assets.length} assets.`
    );

    // Notify assigned auditors
    if (auditorIds && auditorIds.length > 0) {
      for (const auditorId of auditorIds) {
        await notifyUser(
          auditorId,
          `You have been assigned as an auditor for cycle ${name}.`,
          "Audit Assigned"
        );
      }
    }

    return res.status(201).json({
      success: true,
      data: cycle,
      itemCount: assets.length,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getAuditCycles = async (req, res) => {
  try {
    const cycles = await AuditCycle.findAll({
      order: [["id", "DESC"]],
    });

    return res.json({
      success: true,
      data: cycles,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getAuditCycleById = async (req, res) => {
  try {
    const cycle = await AuditCycle.findByPk(req.params.id, {
      include: [
        {
          model: AuditItem,
          include: [
            {
              model: Asset,
              attributes: ["id", "assetCode", "name", "serialNumber", "location", "status", "condition"],
            },
            {
              model: User,
              as: "Auditor",
              attributes: ["id", "name", "email"],
            },
          ],
        },
      ],
    });

    if (!cycle) {
      return res.status(404).json({
        success: false,
        message: "Audit Cycle not found",
      });
    }

    // Generate discrepancy report dynamically for flagged items
    const flaggedItems = cycle.AuditItems ? cycle.AuditItems.filter(item => item.status === "Missing" || item.status === "Damaged") : [];

    return res.json({
      success: true,
      data: cycle,
      discrepancyReport: {
        totalFlagged: flaggedItems.length,
        items: flaggedItems,
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

exports.updateAuditItem = async (req, res) => {
  try {
    const item = await AuditItem.findByPk(req.params.itemId, {
      include: [AuditCycle],
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Audit Item not found",
      });
    }

    if (item.AuditCycle.status === "Closed") {
      return res.status(400).json({
        success: false,
        message: "Audit Cycle is closed and locked. Updates are not allowed.",
      });
    }

    const { status, remarks } = req.body;
    if (!status || !["Verified", "Missing", "Damaged"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status (Verified, Missing, Damaged) is required",
      });
    }

    const auditorId = req.user ? req.user.id : null;

    item.status = status;
    item.remarks = remarks || item.remarks;
    item.auditorId = auditorId;
    item.checkedAt = new Date();

    await item.save();

    if (status === "Missing" || status === "Damaged") {
      await notifyRoles(
        ["Admin", "AssetManager"],
        `Discrepancy flagged: Asset ID ${item.assetId} marked as ${status} in cycle ${item.AuditCycle.name}.`,
        "Audit Discrepancy Flagged"
      );
    }

    return res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.closeAuditCycle = async (req, res) => {
  try {
    const cycle = await AuditCycle.findByPk(req.params.id);
    if (!cycle) {
      return res.status(404).json({
        success: false,
        message: "Audit Cycle not found",
      });
    }

    if (cycle.status === "Closed") {
      return res.status(400).json({
        success: false,
        message: "Audit Cycle is already closed",
      });
    }

    cycle.status = "Closed";
    await cycle.save();

    // Lock and apply changes to Assets
    const items = await AuditItem.findAll({
      where: {
        auditCycleId: cycle.id,
      },
    });

    let updatedCount = 0;
    for (const item of items) {
      const asset = await Asset.findByPk(item.assetId);
      if (asset) {
        let changed = false;
        if (item.status === "Missing") {
          asset.status = "Lost";
          changed = true;
        } else if (item.status === "Damaged") {
          asset.condition = "Damaged";
          changed = true;
        }
        if (changed) {
          await asset.save();
          updatedCount++;
        }
      }
    }

    const actorId = req.user ? req.user.id : 1;
    await logActivity(
      actorId,
      "AUDIT_CYCLE_CLOSE",
      `Closed audit cycle ${cycle.name}. Updates applied to ${updatedCount} assets.`
    );

    return res.json({
      success: true,
      message: `Audit Cycle ${cycle.name} closed. Affected asset statuses updated successfully.`,
      updatedAssetsCount: updatedCount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
