const express = require("express");

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