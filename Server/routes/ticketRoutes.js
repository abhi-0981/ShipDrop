const express = require("express");

const {
  createTicketController,
  getTicketsController,
  getTicketController,
  replyToTicketController,
  closeTicketController,
} = require("../controllers/ticketController");

const router = express.Router();

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