const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  createTransferRequest,
  approveTransferRequest,
  rejectTransferRequest,
  getTransferRequests,
} = require("../controllers/transferController");

router.get("/", protect, getTransferRequests);
router.post("/", protect, createTransferRequest);
router.put("/:id/approve", protect, authorize("Admin", "AssetManager", "DepartmentHead"), approveTransferRequest);
router.put("/:id/reject", protect, authorize("Admin", "AssetManager", "DepartmentHead"), rejectTransferRequest);

module.exports = router;
