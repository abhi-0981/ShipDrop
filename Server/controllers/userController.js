const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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

        return res.status(200).json({
          message: "Login successful",
          role: user.role,
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
// GET USER PROFILE
// ========================================

const getUserProfile = (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({
      message: "User ID is required",
    });
  }

  userModel.findUserById(
    user_id,
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

  user_id = Number(user_id);

  full_name = String(full_name || "").trim();
  email = String(email || "")
    .trim()
    .toLowerCase();

  phone_no = String(phone_no || "")
    .replace(/\D/g, "");

  if (!user_id) {
    return res.status(400).json({
      message: "User ID is required",
    });
  }

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
  getUserProfile,
  updateUserProfile,
};