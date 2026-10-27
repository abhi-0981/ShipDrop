const express = require("express");

const router = express.Router();

const {
  publicTrackingController,
} = require("../controllers/publicTrackingController");
const { publicTrackingLimiter } = require("../middleware/rateLimitMiddleware");

// ======================================================
// PUBLIC DELHIVERY TRACKING
// ======================================================

router.get(
  "/:awb",
  publicTrackingLimiter,
  publicTrackingController
);

module.exports = router;