const express = require("express");

const {
  getSettings,
  updateSettings,
  deleteLogo,
} = require("../controllers/labelSettingsController");

const { authenticateUser } = require("../middleware/authMiddleware");

const router = express.Router();

// All label settings routes are account-owned and require authentication
router.use(authenticateUser);

router.get("/", getSettings);

router.put("/", updateSettings);

router.delete("/logo", deleteLogo);

module.exports = router;