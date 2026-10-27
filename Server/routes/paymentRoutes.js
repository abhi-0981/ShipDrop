const express = require("express");

const router = express.Router();

const {
  getWalletBalance,
  createPaymentOrder,
  verifyPayment,
  getWalletHistory,
  getCODRemittanceHistory,
} = require("../controllers/paymentController");

const { authenticateUser } = require("../middleware/authMiddleware");

// All payment and wallet routes are account-owned and require authentication
router.use(authenticateUser);


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
// GET COD REMITTANCE HISTORY
// ========================================

router.get(
  "/cod-remittance",
  getCODRemittanceHistory
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