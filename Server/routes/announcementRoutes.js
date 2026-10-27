const express = require("express");
const router = express.Router();

const {
  getActiveAnnouncementController,
  dismissAnnouncementController,
} = require("../controllers/announcementController");

router.get("/active", getActiveAnnouncementController);
router.post("/dismiss", dismissAnnouncementController);

module.exports = router;
