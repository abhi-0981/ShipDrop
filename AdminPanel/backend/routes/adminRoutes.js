const express = require("express");

const {
  getUsers,
  getUserById,
  assignRateCard,
} = require("../controllers/userController");


const router =
  express.Router();


// =====================================================
// GET ALL USERS
// =====================================================

router.get(
  "/users",
  getUsers
);


// =====================================================
// GET SINGLE USER
// =====================================================

router.get(
  "/users/:id",
  getUserById
);


// =====================================================
// ASSIGN / REMOVE RATE CARD
// =====================================================

router.patch(
  "/users/:id/rate-card",
  assignRateCard
);


module.exports = router;