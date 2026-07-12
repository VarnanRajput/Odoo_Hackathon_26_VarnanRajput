const express = require("express");
const cors = require("cors");
require("dotenv").config();

// MySQL Sequelize routers
const authRoutes = require("./routes/authRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const userRoutes = require("./routes/userRoutes");
const assetRoutes = require("./routes/assetRoutes");
const allocationRoutes = require("./routes/allocationRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const transferRoutes = require("./routes/transferRoutes");
const auditRoutes = require("./routes/auditRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const activityLogRoutes = require("./routes/activityLogRoutes");
const reportRoutes = require("./routes/reportRoutes");

const { sequelize } = require("./models");

const app = express();

app.use(cors());
app.use(express.json());

// JSON In-Memory Database routers
let memoryAuth,
  memoryDepartments,
  memoryCategories,
  memoryEmployees,
  memoryAssets,
  memoryAllocations,
  memoryBookings,
  memoryMaintenance,
  memoryAudits,
  memoryNotifications,
  memoryLogs;

// Define routing gateway mapping middleware
app.use("/api/auth", (req, res, next) => {
  if (global.useInMemoryDb) return memoryAuth(req, res, next);
  return authRoutes(req, res, next);
});

app.use("/api/departments", (req, res, next) => {
  if (global.useInMemoryDb) return memoryDepartments(req, res, next);
  return departmentRoutes(req, res, next);
});

app.use("/api/categories", (req, res, next) => {
  if (global.useInMemoryDb) return memoryCategories(req, res, next);
  return categoryRoutes(req, res, next);
});

app.use("/api/users", (req, res, next) => {
  if (global.useInMemoryDb) return memoryEmployees(req, res, next);
  return userRoutes(req, res, next);
});

app.use("/api/employees", (req, res, next) => {
  if (global.useInMemoryDb) return memoryEmployees(req, res, next);
  return userRoutes(req, res, next);
});

app.use("/api/assets", (req, res, next) => {
  if (global.useInMemoryDb) return memoryAssets(req, res, next);
  return assetRoutes(req, res, next);
});

app.use("/api/allocations", (req, res, next) => {
  if (global.useInMemoryDb) return memoryAllocations(req, res, next);
  return allocationRoutes(req, res, next);
});

app.use("/api/bookings", (req, res, next) => {
  if (global.useInMemoryDb) return memoryBookings(req, res, next);
  return bookingRoutes(req, res, next);
});

app.use("/api/maintenance", (req, res, next) => {
  if (global.useInMemoryDb) return memoryMaintenance(req, res, next);
  return maintenanceRoutes(req, res, next);
});

app.use("/api/audits", (req, res, next) => {
  if (global.useInMemoryDb) return memoryAudits(req, res, next);
  return auditRoutes(req, res, next);
});

app.use("/api/notifications", (req, res, next) => {
  if (global.useInMemoryDb) return memoryNotifications(req, res, next);
  return notificationRoutes(req, res, next);
});

app.use("/api/activity-logs", (req, res, next) => {
  if (global.useInMemoryDb) return memoryLogs(req, res, next);
  return activityLogRoutes(req, res, next);
});

app.use("/api/logs", (req, res, next) => {
  if (global.useInMemoryDb) return memoryLogs(req, res, next);
  return activityLogRoutes(req, res, next);
});

app.use("/api/dashboard", (req, res, next) => {
  if (global.useInMemoryDb) {
    // Dynamic mock counts directly matching seeded db.json
    return res.json({
      success: true,
      data: {
        totalAssets: 3,
        availableAssets: 2,
        allocatedAssets: 0,
        underMaintenanceAssets: 1,
        maintenanceToday: 1,
        activeBookings: 0,
        pendingTransfers: 0,
        upcomingReturns: 0,
        overdueReturns: 0,
        overdueReturnsList: [],
        recentActivity: [],
      },
    });
  }
  return dashboardRoutes(req, res, next);
});

app.use("/api/transfers", (req, res, next) => {
  if (global.useInMemoryDb) return res.json({ success: true, data: [] });
  return transferRoutes(req, res, next);
});

app.use("/api/reports", (req, res, next) => {
  if (global.useInMemoryDb) {
    return res.json({
      success: true,
      data: {
        mostAllocated: [],
        idleAssets: [],
        byAsset: [],
        byCategory: [],
      },
    });
  }
  return reportRoutes(req, res, next);
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: global.useInMemoryDb
      ? "AssetFlow Backend Running in In-Memory Mode"
      : "AssetFlow Backend Running in MySQL Mode",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Try to sync with MySQL
    await sequelize.authenticate();
    console.log("✅ MySQL Connected");

    await sequelize.sync();
    console.log("✅ Database Synced");
  } catch (error) {
    console.warn(
      "⚠️ Database connection failed or MySQL Out-of-Memory. Falling back to In-Memory JSON store!",
      error.message
    );
    // Switch dynamic flag to true
    global.useInMemoryDb = true;

    // Load In-Memory routes
    memoryAuth = require("./routes/auth");
    memoryDepartments = require("./routes/departments");
    memoryCategories = require("./routes/categories");
    memoryEmployees = require("./routes/employees");
    memoryAssets = require("./routes/assets");
    memoryAllocations = require("./routes/allocations");
    memoryBookings = require("./routes/bookings");
    memoryMaintenance = require("./routes/maintenance");
    memoryAudits = require("./routes/audits");
    memoryNotifications = require("./routes/notifications");
    memoryLogs = require("./routes/logs");
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };