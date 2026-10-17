const authMiddleware = require("../middleware/authMiddleware");
const express = require("express");
router.use(authMiddleware);

const router =
  express.Router();

const {
  calculateRate,
  calculateRateOptions,
} = require("../controllers/rateController");


// ========================================
// SINGLE RATE
// ========================================

router.post(
  "/calculate",
  calculateRate
);


// ========================================
// ROAD + AIR
// ========================================

router.post(
  "/calculate-options",
  calculateRateOptions
);


module.exports = router;