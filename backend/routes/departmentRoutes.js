const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");

router.get("/", protect, getDepartments);
router.post("/", protect, authorize("Admin"), createDepartment);
router.put("/:id", protect, authorize("Admin"), updateDepartment);
router.delete("/:id", protect, authorize("Admin"), deleteDepartment);

module.exports = router;