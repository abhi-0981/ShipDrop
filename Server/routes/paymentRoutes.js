const express = require("express");

const router = express.Router();

const {
  getWalletBalance,
  createPaymentOrder,
  verifyPayment,
  getWalletHistory,
} = require("../controllers/paymentController");


// ========================================
// GET WALLET BALANCE
// ========================================

router.get(
  "/wallet",
  getWalletBalance
);


// ========================================
// GET WALLET HISTORY
// ========================================

router.get(
  "/wallet/history",
  getWalletHistory
);


// ========================================
// CREATE RAZORPAY PAYMENT ORDER
// ========================================

router.post(
  "/create-order",
  createPaymentOrder
);


// ========================================
// VERIFY RAZORPAY PAYMENT
// ========================================

router.post(
  "/verify",
  verifyPayment
);


module.exports = router;