const express = require("express");
const router = express.Router();

const { verifyAdmin } = require("../middleware/authMiddleware");
const {
  getAnnouncementsController,
  createAnnouncementController,
  toggleAnnouncementStatusController,
  deleteAnnouncementController,
} = require("../controllers/announcementAdminController");

// All announcement endpoints require admin authentication
router.use(verifyAdmin);

router.get("/", getAnnouncementsController);
router.post("/", createAnnouncementController);
router.patch("/:id/status", toggleAnnouncementStatusController);
router.delete("/:id", deleteAnnouncementController);

module.exports = router;
