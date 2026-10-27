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
  updateCODRemittanceDescription,
  markCODRemittanceSuccessful,
  bulkMarkCODRemittancesSuccessful,
} = require("../controllers/codRemittanceAdminController");

const {
  getAdminPickupAddresses,
} = require("../controllers/pickupAdminController");

const {
  getAdminParties,
} = require("../controllers/partyAdminController");

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

/* =========================================================
   COD REMITTANCE
========================================================= */

router.get(
  "/cod-remittances",
  getAdminCODRemittances
);

router.patch(
  "/cod-remittances/:id/description",
  updateCODRemittanceDescription
);

router.patch(
  "/cod-remittances/:id/successful",
  markCODRemittanceSuccessful
);

router.patch(
  "/cod-remittances/bulk-successful",
  bulkMarkCODRemittancesSuccessful
);

/* =========================================================
   PICKUP ADDRESSES (ALL MERCHANTS)
========================================================= */

router.get("/pickup-addresses", getAdminPickupAddresses);

/* =========================================================
   PARTY IDENTITIES (ALL MERCHANTS)
========================================================= */

router.get("/party-identities", getAdminParties);
router.get("/parties", getAdminParties);

module.exports = router;
