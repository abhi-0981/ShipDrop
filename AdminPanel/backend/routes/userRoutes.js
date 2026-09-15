const express = require("express");

const {
  getUsers,
  getUserById,
  assignRateCard,
  getUserWallet,
  addUserWalletTransaction,
} = require("../controllers/userController");

const {
  getTicketsController,
  getTicketController,
  updateTicketStatusController,
  replyToTicketController,
} = require("../controllers/ticketAdminController");


const router = express.Router();


// =========================================================
// USERS
// =========================================================

router.get(
  "/users",
  getUsers
);


router.get(
  "/users/:id",
  getUserById
);


router.patch(
  "/users/:id/rate-card",
  assignRateCard
);


// =========================================================
// USER WALLET
// =========================================================

// Get wallet balance + transaction history
router.get(
  "/users/:id/wallet",
  getUserWallet
);


// Add money to user's wallet from Admin
router.post(
  "/users/:id/wallet",
  addUserWalletTransaction
);


// =========================================================
// TICKETS
// =========================================================

router.get(
  "/tickets",
  getTicketsController
);


router.get(
  "/tickets/:id",
  getTicketController
);


router.patch(
  "/tickets/:id/status",
  updateTicketStatusController
);


router.post(
  "/tickets/:id/reply",
  replyToTicketController
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;