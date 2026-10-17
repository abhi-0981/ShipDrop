const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();
router.use(authMiddleware);
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