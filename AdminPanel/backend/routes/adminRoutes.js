const express = require("express");

const {
  getUsers,
  getUserById,
  assignRateCard,
} = require("../controllers/userController");

const {
  getAdminOrders,
} = require("../controllers/orderAdminController");

const {
  getAdminDashboard,
} = require("../controllers/adminDashboardController");

const {
  getTicketsController,
  getTicketController,
  updateTicketStatusController,
  replyToTicketController,
} = require("../controllers/ticketAdminController");

const {
  getAdminCODRemittances,
  markCODRemittanceSuccessful,
} = require("../controllers/codRemittanceAdminController");

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

router.get(
  "/dashboard",
  getAdminDashboard
);

/* ORDERS */
router.get("/orders", getAdminOrders);

/* COD REMITTANCE */

router.get(
  "/cod-remittances",
  getAdminCODRemittances
);

router.patch(
  "/cod-remittances/:id/successful",
  markCODRemittanceSuccessful
);

module.exports = router;