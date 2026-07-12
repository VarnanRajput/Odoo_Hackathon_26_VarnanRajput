const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  allocateAsset,
  returnAsset,
  getAllocations,
  getOverdueAllocations,
  createTransferRequest,
  approveDirectTransfer,
} = require("../controllers/allocationController");

router.get("/", protect, getAllocations);
router.get("/overdue", protect, authorize("Admin", "AssetManager"), getOverdueAllocations);
router.post("/", protect, authorize("Admin", "AssetManager"), allocateAsset);
router.put("/return/:id", protect, authorize("Admin", "AssetManager"), returnAsset);
router.put("/:id/return", protect, authorize("Admin", "AssetManager"), returnAsset);
router.post("/transfer-request", protect, createTransferRequest);
router.post("/:id/approve-transfer", protect, authorize("Admin", "AssetManager", "DepartmentHead"), approveDirectTransfer);

module.exports = router;