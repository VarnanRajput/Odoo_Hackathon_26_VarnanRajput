const { Notification } = require("../models");
const { Op } = require("sequelize");

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Retrieve notifications for the user, plus general broadcast ones (userId is null)
    const notifications = await Notification.findAll({
      where: {
        [Op.or]: [
          { userId },
          { userId: null },
        ],
      },
      order: [["id", "DESC"]],
      limit: 50,
    });

    return res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (req.user && notification.userId && notification.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Not your notification",
      });
    }

    notification.isRead = true;
    await notification.save();

    return res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
