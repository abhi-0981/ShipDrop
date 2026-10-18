const express = require("express");

const {
  getReturnAddresses,
  getReturnAddress,
  getDefaultReturnAddress,
  createReturnAddress,
  updateReturnAddress,
  deleteReturnAddress,
  setDefaultReturnAddress,
} = require("../controllers/returnAddressController");

const { authenticateUser } = require("../middleware/authMiddleware");

const router = express.Router();

// All return address routes are account-owned and require authentication
router.use(authenticateUser);

// ======================================================
// RETURN ADDRESSES
// ======================================================

// GET ALL
// /api/return-addresses?user_id=123
router.get(
  "/",
  getReturnAddresses
);

// GET DEFAULT
// /api/return-addresses/default?user_id=123
router.get(
  "/default",
  getDefaultReturnAddress
);

// GET SINGLE
// /api/return-addresses/5?user_id=123
router.get(
  "/:id",
  getReturnAddress
);

// CREATE
// POST /api/return-addresses
router.post(
  "/",
  createReturnAddress
);

// UPDATE
// PATCH /api/return-addresses/5
router.patch(
  "/:id",
  updateReturnAddress
);

// DELETE
// DELETE /api/return-addresses/5
router.delete(
  "/:id",
  deleteReturnAddress
);

// SET DEFAULT
// PATCH /api/return-addresses/5/default
router.patch(
  "/:id/default",
  setDefaultReturnAddress
);

module.exports = router;