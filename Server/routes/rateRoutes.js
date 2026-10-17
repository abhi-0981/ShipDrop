const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

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