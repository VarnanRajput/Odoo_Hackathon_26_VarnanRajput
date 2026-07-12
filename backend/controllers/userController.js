const { User, Department } = require("../models");
const { logActivity } = require("../utils/logAndNotify");

exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: {
        exclude: ["password"],
      },
      include: {
        model: Department,
        attributes: ["id", "name", "code"],
      },
    });

    return res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isSelf = req.user && req.user.id === user.id;
    const isAdmin = req.user && req.user.role === "Admin";

    // Only Admin can change roles, department, or status
    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to update this user",
      });
    }

    const { name, email, phone, role, status, departmentId, designation } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (designation !== undefined) updateData.designation = designation;

    if (isAdmin) {
      if (role !== undefined) updateData.role = role;
      if (status !== undefined) updateData.status = status;
      if (departmentId !== undefined) updateData.departmentId = departmentId || null;
    } else {
      // Non-admin tried to update privileged fields
      if (role !== undefined || status !== undefined || departmentId !== undefined) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Only Admin can update role, status, or department",
        });
      }
    }

    await user.update(updateData);

    if (req.user) {
      await logActivity(req.user.id, "UPDATE_USER", `Updated user details for ${user.email}`);
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        departmentId: user.departmentId,
        designation: user.designation,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};