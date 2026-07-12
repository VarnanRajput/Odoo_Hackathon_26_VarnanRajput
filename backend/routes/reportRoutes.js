const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getAssetUtilization,
  getMaintenanceFrequency,
  getRetirementReports,
  getDepartmentAllocations,
  getBookingHeatmap,
  exportAllAssetsReport,
} = require("../controllers/reportController");

router.get("/utilization", protect, authorize("Admin", "AssetManager"), getAssetUtilization);
router.get("/maintenance", protect, authorize("Admin", "AssetManager"), getMaintenanceFrequency);
router.get("/retirement", protect, authorize("Admin", "AssetManager"), getRetirementReports);
router.get("/departments", protect, authorize("Admin", "AssetManager"), getDepartmentAllocations);
router.get("/bookings-heatmap", protect, authorize("Admin", "AssetManager"), getBookingHeatmap);
router.get("/export", protect, authorize("Admin", "AssetManager"), exportAllAssetsReport);

module.exports = router;
