const express = require("express");
const router = express.Router();

const {
  getShipmentStatusReportController,
  getWeightDiscrepancyReportController,
} = require("../controllers/reportController");

const { authenticateUser } = require("../middleware/authMiddleware");

// Protected Reports Endpoints
router.get("/shipment-status", authenticateUser, getShipmentStatusReportController);
router.get("/weight-discrepancy", authenticateUser, getWeightDiscrepancyReportController);

module.exports = router;
