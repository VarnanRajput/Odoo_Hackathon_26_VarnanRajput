const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getUsers, updateUser } = require("../controllers/userController");

router.get("/", protect, getUsers);
router.put("/:id", protect, updateUser);

module.exports = router;