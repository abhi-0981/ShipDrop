const express = require("express");
const {
  startImpersonation,
  exchangeTicket,
  endImpersonation,
  getImpersonationLogs,
} = require("../controllers/impersonateController");
const { verifyAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// 1. Start impersonation (Admin only)
router.post("/start", verifyAdmin, startImpersonation);

// 2. Exchange ticket for token (Public single-use endpoint for redirect handoff)
router.post("/exchange", exchangeTicket);

// 3. End impersonation session
router.post("/end", endImpersonation);

// 4. Audit logs (Admin only)
router.get("/logs", verifyAdmin, getImpersonationLogs);

module.exports = router;
