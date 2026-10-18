const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../config/db");
const userModel = require("../models/userModel");

// ========================================
// PASSWORD VALIDATION
// ========================================

const isStrongPassword = (password) => {
  if (typeof password !== "string") {
    return false;
  }

  if (password.length < 8) {
    return false;
  }

  if (!/[A-Z]/.test(password)) {
    return false;
  }

  if (!/[a-z]/.test(password)) {
    return false;
  }

  if (!/[0-9]/.test(password)) {
    return false;
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return false;
  }

  return true;
};

// ========================================
// EMAIL VALIDATION
// ========================================

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// ========================================
// REGISTER
// ========================================

const registerUser = async (req, res) => {
  try {
    let {
      full_name,
      company_name,
      gst_no,
      email,
      phone_no,
      password,
      confirm_password,
    } = req.body;

    // ------------------------------------
    // BASIC CLEANUP
    // ------------------------------------

    full_name = String(full_name || "").trim();
    company_name = String(company_name || "").trim();
    gst_no = String(gst_no || "").trim().toUpperCase();
    email = String(email || "").trim().toLowerCase();
    phone_no = String(phone_no || "")
      .replace(/\D/g, "");

    // ------------------------------------
    // REQUIRED FIELDS
    // ------------------------------------

    if (!full_name) {
      return res.status(400).json({
        message: "Full name is required",
      });
    }

    if (!company_name) {
      return res.status(400).json({
        message: "Company name is required",
      });
    }

    if (!email) {
      return res.status(400).json({
        message: "Email address is required",
      });
    }

    if (!phone_no) {
      return res.status(400).json({
        message: "Mobile number is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "Password is required",
      });
    }

    // ------------------------------------
    // EMAIL VALIDATION
    // ------------------------------------

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    // ------------------------------------
    // PHONE VALIDATION
    // ------------------------------------

    if (!/^[6-9]\d{9}$/.test(phone_no)) {
      return res.status(400).json({
        message: "Please enter a valid 10-digit mobile number",
      });
    }

    // ------------------------------------
    // PASSWORD VALIDATION
    // ------------------------------------

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password must contain 8+ characters, uppercase, lowercase, number and special character",
      });
    }

    // ------------------------------------
    // CONFIRM PASSWORD
    // ------------------------------------

    if (confirm_password !== password) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    // ------------------------------------
    // CHECK DUPLICATE EMAIL / PHONE
    // ------------------------------------

    userModel.checkUser(
      email,
      phone_no,
      async (err, result) => {
        if (err) {
          console.error("Register duplicate check error:", err);

          return res.status(500).json({
            message: "Unable to create account. Please try again.",
          });
        }

        if (result.length > 0) {
          const existingUser = result[0];

          const existingEmail =
            String(existingUser.email || "")
              .trim()
              .toLowerCase();

          const existingPhone =
            String(existingUser.phone_no || "")
              .replace(/\D/g, "");

          if (existingEmail === email) {
            return res.status(409).json({
              message: "Email already registered",
            });
          }

          if (existingPhone === phone_no) {
            return res.status(409).json({
              message: "Mobile number already registered",
            });
          }

          return res.status(409).json({
            message: "Email or mobile number already registered",
          });
        }

        // --------------------------------
        // HASH PASSWORD
        // --------------------------------

        let hashedPassword;

        try {
          hashedPassword = await bcrypt.hash(
            password,
            12,
          );
        } catch (hashError) {
          console.error(
            "Password hashing error:",
            hashError,
          );

          return res.status(500).json({
            message:
              "Unable to create account. Please try again.",
          });
        }

        // --------------------------------
        // CREATE USER
        // --------------------------------

        const userData = {
          full_name,
          company_name,
          gst_no: gst_no || null,
          email,
          phone_no,
          password: hashedPassword,
          role: "user",
        };

        userModel.createUser(
          userData,
          (createError, createResult) => {
            if (createError) {
              console.error(
                "Create user error:",
                createError,
              );

              // MySQL duplicate safety net
              if (createError.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                  message:
                    "Email or mobile number already registered",
                });
              }

              return res.status(500).json({
                message:
                  "Unable to create account. Please try again.",
              });
            }

            return res.status(201).json({
              message:
                "Account created successfully",
            });
          },
        );
      },
    );
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      message:
        "Unable to create account. Please try again.",
    });
  }
};

// ========================================
// LOGIN
// ========================================

const loginUser = (req, res) => {
  try {
    let {
      email,
      password,
    } = req.body;

    email = String(email || "")
      .trim()
      .toLowerCase();

    password = String(password || "");

    // ------------------------------------
    // BASIC VALIDATION
    // ------------------------------------

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    // ------------------------------------
    // FIND USER
    // ------------------------------------

    userModel.findUserByEmail(
      email,
      async (err, result) => {
        if (err) {
          console.error("Login database error:", err);

          return res.status(500).json({
            message:
              "Unable to login. Please try again.",
          });
        }

        // Generic response for security
        if (result.length === 0) {
          return res.status(401).json({
            message:
              "Email or password is incorrect",
          });
        }

        const user = result[0];

        // ----------------------------------
        // COMPARE BCRYPT PASSWORD
        // ----------------------------------

        let passwordMatched = false;

        try {
          passwordMatched = await bcrypt.compare(
            password,
            user.password,
          );
        } catch (compareError) {
          console.error(
            "Password comparison error:",
            compareError,
          );

          return res.status(500).json({
            message:
              "Unable to login. Please try again.",
          });
        }

        if (!passwordMatched) {
          return res.status(401).json({
            message:
              "Email or password is incorrect",
          });
        }

        // ----------------------------------
        // NEVER SEND PASSWORD
        // ----------------------------------

        const safeUser = {
          id: user.id,
          full_name: user.full_name,
          company_name: user.company_name,
          gst_no: user.gst_no,
          email: user.email,
          phone_no: user.phone_no,
          role: user.role,
          profile_image: user.profile_image || null,
          created_at: user.created_at,
        };

        // ----------------------------------
        // CREATE 24-HOUR DATABASE SESSION
        // ----------------------------------
        const sessionId = crypto.randomUUID();
        const jwtSecret = process.env.JWT_SECRET || "default_jwt_secret_shipdrop";

        const promiseDb = db.promise();
        try {
          await promiseDb.query(
            `
            INSERT INTO user_sessions (session_id, user_id, expires_at, revoked_at, created_at)
            VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), NULL, NOW())
            `,
            [sessionId, String(user.id)]
          );
        } catch (sessionErr) {
          console.error("Failed to insert session row:", sessionErr);
          return res.status(500).json({
            message: "Unable to establish secure login session. Please try again.",
          });
        }

        // Sign authentication token with session_id and user_id
        const token = jwt.sign(
          {
            id: user.id,
            user_id: user.id,
            session_id: sessionId,
            email: user.email,
            role: user.role,
          },
          jwtSecret,
          { expiresIn: "24h" }
        );

        return res.status(200).json({
          message: "Login successful",
          role: user.role,
          token,
          user: safeUser,
        });
      },
    );
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message:
        "Unable to login. Please try again.",
    });
  }
};

// ========================================
// GET CURRENT SESSION USER
// ========================================

const getSessionUser = (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "No active authenticated session found.",
      });
    }

    const safeUser = {
      id: req.user.id,
      full_name: req.user.full_name,
      company_name: req.user.company_name,
      gst_no: req.user.gst_no,
      email: req.user.email,
      phone_no: req.user.phone_no,
      role: req.user.role,
      profile_image: req.user.profile_image || null,
      created_at: req.user.created_at,
    };

    return res.status(200).json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    console.error("Get session user error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve session user.",
    });
  }
};

// ========================================
// LOGOUT USER (GLOBAL LOGOUT - ALL DEVICES)
// ========================================

const logoutUser = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request. No active session found to logout.",
      });
    }

    const promiseDb = db.promise();

    // Revoke all active sessions belonging to this user
    await promiseDb.query(
      `
      UPDATE user_sessions
      SET revoked_at = NOW()
      WHERE user_id = ? AND revoked_at IS NULL
      `,
      [String(userId)]
    );

    return res.status(200).json({
      success: true,
      message: "Logged out successfully from all devices.",
    });
  } catch (error) {
    console.error("Global logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to complete server-side logout. Please try again.",
    });
  }
};

// ========================================
// GET USER PROFILE
// ========================================

const getUserProfile = (req, res) => {
  const paramUserId = req.params.user_id;
  const authUserId = req.user?.id;

  const userId = authUserId || paramUserId;

  if (!userId) {
    return res.status(400).json({
      message: "User ID is required",
    });
  }

  // Prevent accessing another user's profile
  if (
    authUserId &&
    paramUserId &&
    String(authUserId) !== String(paramUserId) &&
    req.user?.role !== "admin"
  ) {
    return res.status(403).json({
      message: "Access denied. You cannot view another user's profile.",
    });
  }

  userModel.findUserById(
    userId,
    (err, result) => {
      if (err) {
        console.error(
          "Get profile error:",
          err,
        );

        return res.status(500).json({
          message:
            "Unable to load profile",
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const user = result[0];

      delete user.password;

      return res.status(200).json({
        user,
      });
    },
  );
};

// ========================================
// UPDATE USER PROFILE
// ========================================

const updateUserProfile = (req, res) => {
  let {
    user_id,
    full_name,
    email,
    phone_no,
    profile_image,
  } = req.body;

  // Enforce authenticated user ID if logged in
  const effectiveUserId = req.user?.id
    ? Number(req.user.id)
    : Number(user_id);

  if (!effectiveUserId) {
    return res.status(400).json({
      message: "User ID is required",
    });
  }

  user_id = effectiveUserId;

  full_name = String(full_name || "").trim();
  email = String(email || "")
    .trim()
    .toLowerCase();

  phone_no = String(phone_no || "")
    .replace(/\D/g, "");

  if (!full_name) {
    return res.status(400).json({
      message: "Name is required",
    });
  }

  if (!email) {
    return res.status(400).json({
      message: "Email is required",
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      message: "Please enter a valid email address",
    });
  }

  if (!phone_no) {
    return res.status(400).json({
      message: "Mobile number is required",
    });
  }

  if (!/^[6-9]\d{9}$/.test(phone_no)) {
    return res.status(400).json({
      message:
        "Please enter a valid 10-digit mobile number",
    });
  }

  // --------------------------------------
  // CHECK DUPLICATES
  // --------------------------------------

  userModel.checkDuplicateUser(
    user_id,
    email,
    phone_no,
    (err, result) => {
      if (err) {
        console.error(
          "Profile duplicate check error:",
          err,
        );

        return res.status(500).json({
          message:
            "Unable to update profile",
        });
      }

      if (result.length > 0) {
        const existingUser = result[0];

        const existingEmail =
          String(existingUser.email || "")
            .trim()
            .toLowerCase();

        const existingPhone =
          String(existingUser.phone_no || "")
            .replace(/\D/g, "");

        if (existingEmail === email) {
          return res.status(409).json({
            message: "Email already registered",
          });
        }

        if (existingPhone === phone_no) {
          return res.status(409).json({
            message:
              "Mobile number already registered",
          });
        }

        return res.status(409).json({
          message:
            "Email or mobile number already registered",
        });
      }

      // ------------------------------------
      // UPDATE
      // ------------------------------------

      userModel.updateUserProfile(
        user_id,
        {
          full_name,
          email,
          phone_no,
          profile_image:
            profile_image || null,
        },
        (updateError) => {
          if (updateError) {
            console.error(
              "Profile update error:",
              updateError,
            );

            return res.status(500).json({
              message:
                "Unable to update profile",
            });
          }

          // ------------------------------
          // RETURN UPDATED USER
          // ------------------------------

          userModel.findUserById(
            user_id,
            (findError, userResult) => {
              if (findError) {
                console.error(
                  "Updated user fetch error:",
                  findError,
                );

                return res.status(500).json({
                  message:
                    "Profile updated, but user data could not be loaded",
                });
              }

              if (userResult.length === 0) {
                return res.status(404).json({
                  message: "User not found",
                });
              }

              const user =
                userResult[0];

              delete user.password;

              return res.status(200).json({
                message:
                  "Profile updated successfully",
                user,
              });
            },
          );
        },
      );
    },
  );
};

module.exports = {
  registerUser,
  loginUser,
  getSessionUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
};