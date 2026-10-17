const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createTicketController,
  getTicketsController,
  getTicketController,
  replyToTicketController,
  closeTicketController,
} = require("../controllers/ticketController");

const router = express.Router();
router.use(authMiddleware);

// ======================================================
// CREATE
// ======================================================

router.post(
  "/create",
  createTicketController
);

// ======================================================
// GET USER TICKETS
// ======================================================

router.get(
  "/",
  getTicketsController
);

// ======================================================
// GET SINGLE TICKET
// ======================================================

router.get(
  "/:id",
  getTicketController
);

// ======================================================
// REPLY
// ======================================================

router.post(
  "/:id/reply",
  replyToTicketController
);

// ======================================================
// CLOSE
// ======================================================

router.post(
  "/:id/close",
  closeTicketController
);

module.exports = router;