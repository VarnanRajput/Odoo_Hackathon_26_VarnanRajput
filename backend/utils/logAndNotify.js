const { Notification, ActivityLog, User } = require("../models");

/**
 * Creates an activity log entry.
 */
const logActivity = async (userId, action, details) => {
  try {
    await ActivityLog.create({
      userId,
      action,
      details,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};

/**
 * Creates a notification.
 */
const notifyUser = async (userId, message, type) => {
  try {
    await Notification.create({
      userId,
      message,
      type,
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
};

/**
 * Creates notifications for all users with specific roles (e.g., Admins or AssetManagers).
 */
const notifyRoles = async (roles, message, type) => {
  try {
    const users = await User.findAll({
      where: {
        role: roles,
        status: "Active",
      },
    });

    for (const user of users) {
      await notifyUser(user.id, message, type);
    }
  } catch (error) {
    console.error("Failed to notify roles:", error);
  }
};

module.exports = {
  logActivity,
  notifyUser,
  notifyRoles,
};
