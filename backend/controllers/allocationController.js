const { Allocation, Asset, User, Department } = require("../models");
const { logActivity, notifyUser, notifyRoles } = require("../utils/logAndNotify");
const { Op } = require("sequelize");

exports.allocateAsset = async (req, res) => {
  try {
    const {
      assetId,
      employeeId,
      departmentId,
      allocatedBy,
      allocationDate,
      expectedReturnDate,
      remarks,
    } = req.body;

    const asset = await Asset.findByPk(assetId);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    if (asset.status === "Allocated") {
      let holderName = "another entity";
      if (asset.allocatedTo) {
        const u = await User.findByPk(asset.allocatedTo);
        if (u) holderName = u.name;
      } else if (asset.allocatedToDepartmentId) {
        const d = await Department.findByPk(asset.allocatedToDepartmentId);
        if (d) holderName = `Department: ${d.name}`;
      }

      return res.status(400).json({
        success: false,
        message: `Asset already allocated. Currently held by ${holderName}.`,
        currentlyHeldBy: holderName,
        assetId: asset.id,
        holderId: asset.allocatedTo,
        holderDepartmentId: asset.allocatedToDepartmentId,
      });
    }

    // Double allocation check ended. Let's allocate.
    const allocation = await Allocation.create({
      assetId,
      employeeId: employeeId || null,
      departmentId: departmentId || null,
      allocatedBy: allocatedBy || (req.user ? req.user.id : 1),
      allocationDate: allocationDate || new Date().toISOString().split("T")[0],
      expectedReturnDate: expectedReturnDate || null,
      remarks,
      status: "Allocated",
    });

    await asset.update({
      status: "Allocated",
      allocatedTo: employeeId || null,
      allocatedToDepartmentId: departmentId || null,
    });

    const actorId = req.user ? req.user.id : 1;
    await logActivity(
      actorId,
      "ALLOCATE_ASSET",
      `Allocated asset ${asset.name} (${asset.assetCode}) to ${
        employeeId ? "Employee ID " + employeeId : "Department ID " + departmentId
      }`
    );

    if (employeeId) {
      await notifyUser(
        employeeId,
        `Asset ${asset.name} has been allocated to you. Expected return date: ${expectedReturnDate || "None"}.`,
        "Asset Assigned"
      );
    }

    return res.status(201).json({
      success: true,
      data: allocation,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.returnAsset = async (req, res) => {
  try {
    const allocation = await Allocation.findByPk(req.params.id);
    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: "Allocation record not found",
      });
    }

    const { remarks, condition } = req.body;

    allocation.status = "Returned";
    allocation.actualReturnDate = new Date().toISOString().split("T")[0];
    if (remarks) {
      allocation.remarks = (allocation.remarks ? allocation.remarks + "\n" : "") + "Return notes: " + remarks;
    }
    await allocation.save();

    const asset = await Asset.findByPk(allocation.assetId);
    if (asset) {
      asset.status = "Available";
      asset.allocatedTo = null;
      asset.allocatedToDepartmentId = null;
      if (condition) {
        asset.condition = condition;
      }
      await asset.save();
    }

    const actorId = req.user ? req.user.id : 1;
    await logActivity(
      actorId,
      "RETURN_ASSET",
      `Returned asset ${asset ? asset.name : "ID " + allocation.assetId} with condition ${condition || "Excellent"}`
    );

    if (allocation.employeeId) {
      await notifyUser(
        allocation.employeeId,
        `Asset ${asset ? asset.name : "ID " + allocation.assetId} return has been processed.`,
        "Asset Returned"
      );
    }

    return res.json({
      success: true,
      message: "Asset Returned successfully",
      data: allocation,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getAllocations = async (req, res) => {
  try {
    const allocations = await Allocation.findAll({
      include: [
        Asset,
        {
          model: User,
          as: "Employee",
          attributes: ["id", "name", "email"],
        },
        {
          model: Department,
          as: "Department",
          attributes: ["id", "name", "code"],
        },
      ],
      order: [["id", "DESC"]],
    });

    return res.json({
      success: true,
      data: allocations,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getOverdueAllocations = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const allocations = await Allocation.findAll({
      where: {
        status: "Allocated",
        expectedReturnDate: {
          [Op.lt]: today,
        },
      },
      include: [
        Asset,
        {
          model: User,
          as: "Employee",
          attributes: ["id", "name", "email"],
        },
        {
          model: Department,
          as: "Department",
          attributes: ["id", "name", "code"],
        },
      ],
    });

    return res.json({
      success: true,
      data: allocations,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.createTransferRequest = async (req, res) => {
  try {
    const { assetId, targetUserId, notes } = req.body;
    const asset = await Asset.findByPk(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: "Asset not found" });
    }

    const activeAlloc = await Allocation.findOne({ where: { assetId, status: "Allocated" } });
    if (!activeAlloc) {
      return res.status(400).json({ success: false, message: "Asset has no active allocations to transfer" });
    }

    await notifyRoles(["Admin", "AssetManager"], `${req.user ? req.user.name : "An employee"} is requesting transfer of asset ${asset.name} (${asset.assetCode}) currently held by another user.`, "Transfer Requested");

    const actorId = req.user ? req.user.id : 1;
    await logActivity(actorId, "Transfer Requested", `Transfer of asset ${asset.name} requested for employee ID: ${targetUserId}.`);

    return res.json({
      success: true,
      message: "Transfer request submitted successfully. Awaiting Manager approval."
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.approveDirectTransfer = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const originalAlloc = await Allocation.findByPk(req.params.id);
    if (!originalAlloc) {
      return res.status(404).json({ success: false, message: "Allocation not found" });
    }

    const todayStr = new Date().toISOString().split("T")[0];
    
    originalAlloc.status = "Returned";
    originalAlloc.actualReturnDate = todayStr;
    originalAlloc.remarks = (originalAlloc.remarks ? originalAlloc.remarks + "\n" : "") + `Transferred directly to user ${targetUserId}`;
    await originalAlloc.save();

    const newAlloc = await Allocation.create({
      assetId: originalAlloc.assetId,
      employeeId: targetUserId,
      allocatedBy: req.user ? req.user.id : 1,
      allocationDate: todayStr,
      status: "Allocated",
      remarks: "Acquired via Direct Manager Transfer Approval",
    });

    const asset = await Asset.findByPk(originalAlloc.assetId);
    if (asset) {
      asset.allocatedTo = targetUserId;
      asset.allocatedToDepartmentId = null;
      asset.status = "Allocated";
      await asset.save();
    }

    await notifyUser(targetUserId, `Asset ${asset ? asset.name : "item"} transfer approved. It is now allocated to you.`, "Transfer Approved");

    const actorId = req.user ? req.user.id : 1;
    await logActivity(actorId, "Transfer Approved", `Approved asset transfer from allocation ${originalAlloc.id} to new user ${targetUserId}.`);

    return res.json({ success: true, data: newAlloc });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
