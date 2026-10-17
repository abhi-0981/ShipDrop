const express = require("express");

const router = express.Router();

const {
  calculateZoneController,
} = require("../controllers/zoneController");

router.post(
  "/calculate",
  calculateZoneController
);

module.exports = router;