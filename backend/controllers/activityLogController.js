const { ActivityLog, User } = require("../models");

exports.getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "role"],
        },
      ],
      order: [["id", "DESC"]],
      limit: 100,
    });

    return res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
