const express = require("express");

const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  register,
  login,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      departmentId: req.user.departmentId,
      status: req.user.status,
    },
  });
});

module.exports = router;