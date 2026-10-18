const express = require("express");

const router = express.Router();

const {
  registerUser,
  loginUser,
  getSessionUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  updateThemePreference,
} = require("../controllers/userController");

const { authenticateUser } = require("../middleware/authMiddleware");

// ========================================
// PUBLIC ROUTES: REGISTER & LOGIN
// ========================================

router.post("/register", registerUser);

router.post("/login", loginUser);

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

// ========================================
// PROTECTED THEME PREFERENCE ROUTE
// ========================================

router.put("/theme", authenticateUser, updateThemePreference);

module.exports = router;