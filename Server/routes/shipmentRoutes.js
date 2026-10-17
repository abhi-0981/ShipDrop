const express = require("express");

const router = express.Router();

const {
  confirmShipmentController,
  bulkConfirmShipmentController,
} = require(
  "../controllers/shipmentController"
);


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