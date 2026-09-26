const express = require("express");

const {
  checkPincodeServiceability,
} = require("../controllers/serviceabilityController");

const router = express.Router();

// Check Delhivery B2C pincode serviceability
router.get(
  "/pincode/:pincode",
  checkPincodeServiceability
);

module.exports = router;