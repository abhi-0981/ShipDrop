const express = require("express");

const {
  getUsers,
  getUserById,
  assignRateCard,
} = require("../controllers/userController");

const {
  getTicketsController,
  getTicketController,
  updateTicketStatusController,
  replyToTicketController,
} = require("../controllers/ticketAdminController");

const router = express.Router();

/* =========================================================
   USERS
========================================================= */

router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/rate-card", assignRateCard);

/* =========================================================
   TICKETS
========================================================= */

router.get("/tickets", getTicketsController);
router.get("/tickets/:id", getTicketController);

router.patch(
  "/tickets/:id/status",
  updateTicketStatusController
);

router.post(
  "/tickets/:id/reply",
  replyToTicketController
);

module.exports = router;