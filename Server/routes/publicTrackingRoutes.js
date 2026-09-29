const express = require("express");

const router = express.Router();

const {
  publicTrackingController,
} = require("../controllers/publicTrackingController");

// ======================================================
// PUBLIC DELHIVERY TRACKING
// ======================================================

router.get(
  "/:awb",
  publicTrackingController
);

module.exports = router;