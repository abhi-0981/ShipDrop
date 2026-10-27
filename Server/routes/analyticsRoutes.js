const express = require("express");
const router = express.Router();

const {
  getSellerAnalyticsOverview,
  exportGstTaxReport,
} = require("../controllers/analyticsController");

const { authenticateUser } = require("../middleware/authMiddleware");

// Protected seller analytics routes
router.get("/overview", authenticateUser, getSellerAnalyticsOverview);
router.get("/gst-report", authenticateUser, exportGstTaxReport);

module.exports = router;
