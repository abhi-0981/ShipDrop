const express = require("express");

const router = express.Router();

const {
  getWalletBalance,
  createPaymentOrder,
  verifyPayment,
} = require("../controllers/paymentController");


// Get wallet balance
router.get(
  "/wallet",
  getWalletBalance
);


// Create Razorpay payment order
router.post(
  "/create-order",
  createPaymentOrder
);


// Verify Razorpay payment
router.post(
  "/verify",
  verifyPayment
);


module.exports = router;