const { Maintenance, Asset, User } = require("../models");
const { logActivity, notifyUser, notifyRoles } = require("../utils/logAndNotify");

exports.createMaintenance = async (req, res) => {
  try {
    const { assetId, reportedBy, issue, priority } = req.body;

    if (!assetId || !issue) {
      return res.status(400).json({
        success: false,
        message: "Asset ID and Issue description are required",
      });
    }

    const asset = await Asset.findByPk(assetId);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    const reporterId = reportedBy || (req.user ? req.user.id : 1);

    const maintenance = await Maintenance.create({
      assetId,
      reportedBy: reporterId,
      issue,
      priority: priority || "Medium",
      status: "Pending", // Set initial status to Pending
    });

    // Do NOT update asset status here! It only updates on approval.

    await logActivity(
      reporterId,
      "MAINTENANCE_REQUEST",
      `Raised maintenance request for asset ${asset.name} (${asset.assetCode})`
    );

    // Notify Asset Managers
    await notifyRoles(["Admin", "AssetManager"], `New maintenance request raised for ${asset.name} (${asset.assetCode})`, "Maintenance Requested");

    return res.status(201).json({
      success: true,
      data: maintenance,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.findAll({
      include: [
        Asset,
        {
          model: User,
          as: "Reporter",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["id", "DESC"]],
    });

    return res.json({
      success: true,
      data: maintenance,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.findByPk(req.params.id);
    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: "Maintenance record not found",
      });
    }

    const { status, assignedTo, priority, issue } = req.body;

    const prevStatus = maintenance.status;

    // Apply updates
    if (status !== undefined) maintenance.status = status;
    if (assignedTo !== undefined) maintenance.assignedTo = assignedTo;
    if (priority !== undefined) maintenance.priority = priority;
    if (issue !== undefined) maintenance.issue = issue;

    await maintenance.save();

    const asset = await Asset.findByPk(maintenance.assetId);

    // Dynamic Asset Status Updates based on workflow:
    // 1. "Asset status auto-updates to Under Maintenance on approval"
    if (status === "Approved" && prevStatus === "Pending") {
      if (asset) {
        asset.status = "Under Maintenance";
        await asset.save();
      }
      await notifyUser(
        maintenance.reportedBy,
        `Your maintenance request for ${asset ? asset.name : "Asset"} has been approved.`,
        "Maintenance Approved"
      );
    }

    // 2. "Reject request"
    if (status === "Rejected" && prevStatus === "Pending") {
      await notifyUser(
        maintenance.reportedBy,
        `Your maintenance request for ${asset ? asset.name : "Asset"} has been rejected.`,
        "Maintenance Rejected"
      );
    }

    // 3. Technician assigned transition
    if (assignedTo && prevStatus === "Approved") {
      maintenance.status = "Technician Assigned";
      await maintenance.save();
      await notifyUser(
        assignedTo,
        `You have been assigned to maintenance request for asset ${asset ? asset.name : "Asset"}.`,
        "Maintenance Assigned"
      );
    }

    // 4. "Asset status auto-updates to Available on resolution"
    if (status === "Resolved" && prevStatus !== "Resolved") {
      if (asset) {
        asset.status = "Available";
        await asset.save();
      }
      await notifyUser(
        maintenance.reportedBy,
        `Your maintenance request for ${asset ? asset.name : "Asset"} has been resolved.`,
        "Maintenance Resolved"
      );
    }

    const actorId = req.user ? req.user.id : 1;
    await logActivity(
      actorId,
      "MAINTENANCE_UPDATE",
      `Updated maintenance request ID ${maintenance.id} status to ${maintenance.status}`
    );

    return res.json({
      success: true,
      data: maintenance,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};