const express = require("express");
const router = express.Router();

const {
  getBusinessSummary,
  getUsersList,
} = require("../controllers/analyticsController");
const { verifyAdmin } = require("../middleware/authMiddleware");

// Both endpoints are protected by administrator credentials
router.get("/summary", verifyAdmin, getBusinessSummary);
router.get("/users", verifyAdmin, getUsersList);

module.exports = router;
