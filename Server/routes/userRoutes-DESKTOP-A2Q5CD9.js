const express = require("express");

const router = express.Router();

const {
  registerUser,
  loginUser,
  getSessionUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
} = require("../controllers/userController");

const {
  exchangeTicket,
  endImpersonationSession,
} = require("../controllers/impersonationController");

const { authenticateUser } = require("../middleware/authMiddleware");
const { authRateLimiter } = require("../middleware/rateLimitMiddleware");

// ========================================
// PUBLIC ROUTES: REGISTER & LOGIN
// ========================================

router.post("/register", authRateLimiter, registerUser);

router.post("/login", authRateLimiter, loginUser);

// ========================================
// IMPERSONATION ROUTES
// ========================================

// Public exchange of single-use ticket for user session token
router.post("/impersonate/exchange", exchangeTicket);

// End impersonation session
router.post("/impersonate/end", authenticateUser, endImpersonationSession);

// ========================================
// PROTECTED SESSION MANAGEMENT ROUTES
// ========================================

// Validates current session token against database and returns safe user data
router.get("/session", authenticateUser, getSessionUser);

// Global logout: revokes all active sessions for this account across all devices
router.post("/logout", authenticateUser, logoutUser);

// ========================================
// PROTECTED USER PROFILE ROUTES
// ========================================

router.get("/profile/:user_id", authenticateUser, getUserProfile);

router.put("/profile/update", authenticateUser, updateUserProfile);

module.exports = router;