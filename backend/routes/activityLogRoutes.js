const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const { getActivityLogs } = require("../controllers/activityLogController");

router.get("/", protect, authorize("Admin"), getActivityLogs);

module.exports = router;
