const { TransferRequest, Asset, User, Department, Allocation } = require("../models");
const { logActivity, notifyUser, notifyRoles } = require("../utils/logAndNotify");

exports.createTransferRequest = async (req, res) => {
  try {
    const { assetId, toEmployeeId, toDepartmentId, remarks } = req.body;

    const asset = await Asset.findByPk(assetId);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    // Get current owner
    const fromEmployeeId = asset.allocatedTo || null;
    const fromDepartmentId = asset.allocatedToDepartmentId || null;

    if (!fromEmployeeId && !fromDepartmentId) {
      return res.status(400).json({
        success: false,
        message: "Asset is not currently allocated, no transfer needed. You can allocate it directly.",
      });
    }

    const requestedById = req.user ? req.user.id : 1;

    const transferRequest = await TransferRequest.create({
      assetId,
      fromEmployeeId,
      fromDepartmentId,
      toEmployeeId: toEmployeeId || null,
      toDepartmentId: toDepartmentId || null,
      requestedById,
      status: "Pending",
      remarks,
    });

    await logActivity(
      requestedById,
      "TRANSFER_REQUEST_CREATE",
      `Requested transfer of asset ${asset.name} (${asset.assetCode})`
    );

    // Notify Asset Managers and Dept Head of target department
    await notifyRoles(["Admin", "AssetManager"], `New Transfer Request for asset ${asset.name} (${asset.assetCode}).`, "Transfer Requested");

    return res.status(201).json({
      success: true,
      data: transferRequest,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.approveTransferRequest = async (req, res) => {
  try {
    const transfer = await TransferRequest.findByPk(req.params.id);
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: "Transfer request not found",
      });
    }

    if (transfer.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Transfer request is already ${transfer.status}`,
      });
    }

    const asset = await Asset.findByPk(transfer.assetId);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset associated with this transfer was not found",
      });
    }

    const actionedById = req.user ? req.user.id : 1;

    // Approve the request
    transfer.status = "Approved";
    transfer.actionedById = actionedById;
    await transfer.save();

    // 1. Terminate old allocation
    const todayStr = new Date().toISOString().split("T")[0];
    const oldAllocation = await Allocation.findOne({
      where: {
        assetId: asset.id,
        status: "Allocated",
      },
    });

    if (oldAllocation) {
      oldAllocation.status = "Returned";
      oldAllocation.actualReturnDate = todayStr;
      oldAllocation.remarks = (oldAllocation.remarks ? oldAllocation.remarks + "\n" : "") + "Transferred via approval.";
      await oldAllocation.save();
    }

    // 2. Create new allocation
    const newAllocation = await Allocation.create({
      assetId: asset.id,
      employeeId: transfer.toEmployeeId,
      departmentId: transfer.toDepartmentId,
      allocatedBy: actionedById,
      allocationDate: todayStr,
      status: "Allocated",
      remarks: `Transferred from Request ID: ${transfer.id}`,
    });

    // 3. Update asset ownership
    await asset.update({
      allocatedTo: transfer.toEmployeeId,
      allocatedToDepartmentId: transfer.toDepartmentId,
      status: "Allocated",
    });

    await logActivity(
      actionedById,
      "TRANSFER_REQUEST_APPROVE",
      `Approved transfer of asset ${asset.name} (${asset.assetCode})`
    );

    // Notify users
    if (transfer.fromEmployeeId) {
      await notifyUser(transfer.fromEmployeeId, `Your asset ${asset.name} has been transferred.`, "Transfer Approved");
    }
    if (transfer.toEmployeeId) {
      await notifyUser(transfer.toEmployeeId, `Asset ${asset.name} has been transferred to you.`, "Transfer Approved");
    }
    await notifyUser(transfer.requestedById, `Your transfer request for ${asset.name} has been approved.`, "Transfer Approved");

    return res.json({
      success: true,
      message: "Transfer request approved and asset successfully re-allocated.",
      data: transfer,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.rejectTransferRequest = async (req, res) => {
  try {
    const transfer = await TransferRequest.findByPk(req.params.id);
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: "Transfer request not found",
      });
    }

    if (transfer.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Transfer request is already ${transfer.status}`,
      });
    }

    const { remarks } = req.body;
    const actionedById = req.user ? req.user.id : 1;

    transfer.status = "Rejected";
    transfer.actionedById = actionedById;
    if (remarks) {
      transfer.remarks = (transfer.remarks ? transfer.remarks + "\n" : "") + "Rejection comments: " + remarks;
    }
    await transfer.save();

    await logActivity(
      actionedById,
      "TRANSFER_REQUEST_REJECT",
      `Rejected transfer request for asset ID ${transfer.assetId}`
    );

    await notifyUser(transfer.requestedById, `Your transfer request was rejected. Notes: ${remarks || "None"}`, "Transfer Rejected");

    return res.json({
      success: true,
      message: "Transfer request rejected.",
      data: transfer,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getTransferRequests = async (req, res) => {
  try {
    const transfers = await TransferRequest.findAll({
      include: [
        Asset,
        {
          model: User,
          as: "Requester",
          attributes: ["id", "name", "email"],
        },
        {
          model: User,
          as: "FromEmployee",
          attributes: ["id", "name", "email"],
        },
        {
          model: User,
          as: "ToEmployee",
          attributes: ["id", "name", "email"],
        },
        {
          model: Department,
          as: "FromDepartment",
          attributes: ["id", "name", "code"],
        },
        {
          model: Department,
          as: "ToDepartment",
          attributes: ["id", "name", "code"],
        },
      ],
      order: [["id", "DESC"]],
    });

    return res.json({
      success: true,
      data: transfers,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
