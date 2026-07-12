const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

router.get("/", protect, getCategories);
router.post("/", protect, authorize("Admin"), createCategory);
router.put("/:id", protect, authorize("Admin"), updateCategory);
router.delete("/:id", protect, authorize("Admin"), deleteCategory);

module.exports = router;