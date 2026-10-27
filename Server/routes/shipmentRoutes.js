const express = require("express");

const router = express.Router();

const {
  confirmShipmentController,
  bulkConfirmShipmentController,
} = require(
  "../controllers/shipmentController"
);

const { authenticateUser } = require("../middleware/authMiddleware");

// All shipment routes are account-owned and require authentication
router.use(authenticateUser);


// ========================================
// SINGLE SHIPMENT
// ========================================

router.post(
  "/confirm",
  confirmShipmentController
);


// ========================================
// BULK SHIPMENT
// ========================================

router.post(
  "/bulk-confirm",
  bulkConfirmShipmentController
);


module.exports = router;