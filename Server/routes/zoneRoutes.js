const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

const {
  calculateZoneController,
} = require("../controllers/zoneController");

router.post(
  "/calculate",
  calculateZoneController
);

module.exports = router;