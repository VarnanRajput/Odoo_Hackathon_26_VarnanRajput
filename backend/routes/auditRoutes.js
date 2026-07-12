const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  createAuditCycle,
  getAuditCycles,
  getAuditCycleById,
  updateAuditItem,
  closeAuditCycle,
} = require("../controllers/auditController");

router.get("/cycles", protect, authorize("Admin", "AssetManager"), getAuditCycles);
router.get("/cycles/:id", protect, authorize("Admin", "AssetManager"), getAuditCycleById);
router.post("/cycles", protect, authorize("Admin"), createAuditCycle);
router.put("/cycles/:id/close", protect, authorize("Admin"), closeAuditCycle);
router.put("/items/:itemId", protect, updateAuditItem);

module.exports = router;
