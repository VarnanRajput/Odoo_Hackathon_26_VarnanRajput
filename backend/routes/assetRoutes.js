const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
} = require("../controllers/assetController");

router.get("/", protect, getAssets);
router.get("/:id", protect, getAssetById);

// Admin or AssetManager can manage assets
router.post("/", protect, authorize("Admin", "AssetManager"), createAsset);
router.put("/:id", protect, authorize("Admin", "AssetManager"), updateAsset);
router.delete("/:id", protect, authorize("Admin", "AssetManager"), deleteAsset);

module.exports = router;