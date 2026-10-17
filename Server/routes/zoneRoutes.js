const express = require("express");
router.use(authMiddleware);
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

const {
  calculateZoneController,
} = require("../controllers/zoneController");

router.post(
  "/calculate",
  calculateZoneController
);

module.exports = router;