const { Asset, Department, Category, User, Allocation, Maintenance } = require("../models");
const { logActivity } = require("../utils/logAndNotify");
const { Op } = require("sequelize");

exports.createAsset = async (req, res) => {
  try {
    const {
      name,
      serialNumber,
      description,
      purchaseDate,
      purchaseCost,
      location,
      status,
      condition,
      departmentId,
      categoryId,
      photo,
      isBookable,
      customFields,
    } = req.body;

    if (!name || !serialNumber || !departmentId || !categoryId) {
      return res.status(400).json({
        success: false,
        message: "Name, serial number, department, and category are required",
      });
    }

    // Auto-generate Asset Tag (assetCode)
    const lastAsset = await Asset.findOne({
      order: [["id", "DESC"]],
    });
    let nextNum = 1;
    if (lastAsset && lastAsset.assetCode) {
      const match = lastAsset.assetCode.match(/AF-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const assetCode = `AF-${String(nextNum).padStart(4, "0")}`;

    const asset = await Asset.create({
      assetCode,
      name,
      serialNumber,
      description,
      purchaseDate,
      purchaseCost,
      location,
      status: status || "Available",
      condition: condition || "Excellent",
      departmentId,
      categoryId,
      photo,
      isBookable: isBookable || false,
      customFields,
    });

    if (req.user) {
      await logActivity(req.user.id, "CREATE_ASSET", `Registered asset ${name} (${assetCode})`);
    }

    return res.status(201).json({
      success: true,
      data: asset,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getAssets = async (req, res) => {
  try {
    const { search, categoryId, status, departmentId, location, isBookable } = req.query;

    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { assetCode: { [Op.like]: `%${search}%` } },
        { serialNumber: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
      ];
    }

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    if (location) {
      whereClause.location = { [Op.like]: `%${location}%` };
    }

    if (isBookable !== undefined) {
      whereClause.isBookable = isBookable === "true" || isBookable === true;
    }

    const assets = await Asset.findAll({
      where: whereClause,
      include: [
        Department,
        Category,
        {
          model: User,
          as: "AllocatedUser",
          attributes: ["id", "employeeId", "name", "email"],
        },
      ],
      order: [["id", "DESC"]],
    });

    return res.json({
      success: true,
      data: assets,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findByPk(req.params.id, {
      include: [
        Department,
        Category,
        {
          model: User,
          as: "AllocatedUser",
          attributes: ["id", "employeeId", "name", "email"],
        },
        {
          model: Allocation,
          include: [
            {
              model: User,
              as: "Employee",
              attributes: ["id", "name", "email"],
            },
          ],
          order: [["id", "DESC"]],
        },
        {
          model: Maintenance,
          include: [
            {
              model: User,
              as: "Reporter",
              attributes: ["id", "name", "email"],
            },
          ],
          order: [["id", "DESC"]],
        },
      ],
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    return res.json({
      success: true,
      data: asset,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateAsset = async (req, res) => {
  try {
    const asset = await Asset.findByPk(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    await asset.update(req.body);

    if (req.user) {
      await logActivity(req.user.id, "UPDATE_ASSET", `Updated asset ${asset.name} (${asset.assetCode})`);
    }

    return res.json({
      success: true,
      data: asset,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findByPk(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    const assetName = asset.name;
    const assetCode = asset.assetCode;
    await asset.destroy();

    if (req.user) {
      await logActivity(req.user.id, "DELETE_ASSET", `Deleted asset ${assetName} (${assetCode})`);
    }

    return res.json({
      success: true,
      message: "Asset Deleted",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};