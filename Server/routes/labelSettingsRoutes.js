const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  getSettings,
  updateSettings,
  deleteLogo,
} = require("../controllers/labelSettingsController");

const router = express.Router();
router.use(authMiddleware);

router.get("/", getSettings);

router.put("/", updateSettings);

router.delete("/logo", deleteLogo);

module.exports = router;