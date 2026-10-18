const express = require("express");

const router =
  express.Router();

const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
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