const express = require("express");
const {
  getNotificationsController,
  markReadController,
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", getNotificationsController);
router.post("/mark-read", markReadController);

module.exports = router;
