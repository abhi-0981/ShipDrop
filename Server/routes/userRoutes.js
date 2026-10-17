
const express = require("express");

const router = express.Router();

const {
  registerUser,
  loginUser,
  logoutUser,
  validateSession,
  getUserProfile,
  updateUserProfile,
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");

// REGISTER — public
router.post("/register", registerUser);

// LOGIN — public
router.post("/login", loginUser);
router.get("/session", authMiddleware, validateSession);

// LOGOUT — authenticated; revokes sessions across all devices
router.post("/logout", authMiddleware, logoutUser);

// PROFILE — authenticated
router.get("/profile/:user_id", authMiddleware, (req, res, next) => {
  if (String(req.params.user_id) !== String(req.user.id)) {
    return res.status(403).json({
      message: "You cannot access another user's profile.",
    });
  }

  next();
}, getUserProfile);

// UPDATE PROFILE — authenticated
router.put("/profile/update", authMiddleware, (req, res, next) => {
  if (String(req.body.user_id) !== String(req.user.id)) {
    return res.status(403).json({
      message: "You cannot update another user's profile.",
    });
  }

  next();
}, updateUserProfile);

module.exports = router;
