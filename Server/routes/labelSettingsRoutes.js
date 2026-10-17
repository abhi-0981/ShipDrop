const express = require("express");

const {
  getSettings,
  updateSettings,
  deleteLogo,
} = require("../controllers/labelSettingsController");

const router = express.Router();

router.get("/", getSettings);

router.put("/", updateSettings);

router.delete("/logo", deleteLogo);

module.exports = router;