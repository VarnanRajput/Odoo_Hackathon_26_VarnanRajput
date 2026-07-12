const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createBooking,
  getBookings,
  cancelBooking,
  rescheduleBooking,
} = require("../controllers/bookingController");

router.get("/", protect, getBookings);
router.post("/", protect, createBooking);
router.put("/cancel/:id", protect, cancelBooking);
router.put("/reschedule/:id", protect, rescheduleBooking);

module.exports = router;
