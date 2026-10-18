const express = require("express");

const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  registerUser,
  loginUser,
  logoutUser,
  verifySession,
  getUserProfile,
  updateUserProfile,
} = require("../controllers/userController");

// ========================================
// PUBLIC ROUTES
// ========================================

// REGISTER
router.post("/register", registerUser);

// LOGIN
router.post("/login", loginUser);

// ========================================
// PROTECTED ROUTES (SESSION & AUTH REQUIRED)
// ========================================

// VERIFY SESSION
router.get("/verify-session", authMiddleware, verifySession);

// LOGOUT (GLOBAL LOGOUT)
router.post("/logout", authMiddleware, logoutUser);

// GET PROFILE
router.get("/profile/:user_id", authMiddleware, getUserProfile);

// UPDATE PROFILE
router.put("/profile/update", authMiddleware, updateUserProfile);

module.exports = router;