const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  createMaintenance,
  getMaintenance,
  updateMaintenance,
} = require("../controllers/maintenanceController");

router.get("/", protect, getMaintenance);
router.post("/", protect, createMaintenance);

// Admin and AssetManager can update/approve maintenance requests
router.put("/:id", protect, authorize("Admin", "AssetManager"), updateMaintenance);

module.exports = router;