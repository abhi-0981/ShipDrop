const express = require("express");

const router =
  express.Router();

const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  logoutUser,
  verifyUserSession,
} = require("../controllers/userController");


// ========================================
// REGISTER
// ========================================

router.post(
  "/register",
  registerUser
);


// ========================================
// LOGIN
// ========================================

router.post(
  "/login",
  loginUser
);


// ========================================
// LOGOUT (Explicit remote invalidation)
// ========================================

router.post(
  "/logout",
  logoutUser
);


// ========================================
// VERIFY SESSION (Remote check on fresh tab/open)
// ========================================

router.post(
  "/verify-session",
  verifyUserSession
);


// ========================================
// GET PROFILE
// ========================================

router.get(
  "/profile/:user_id",
  getUserProfile
);


// ========================================
// UPDATE PROFILE
// ========================================

router.put(
  "/profile/update",
  updateUserProfile
);


module.exports = router;