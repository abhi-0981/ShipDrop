const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

// ========================================
// PASSWORD VALIDATION
// ========================================

const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }

  if (!/[!@#$%^&*(),.?":{}|<>_\-\\[\]/;'`~+=]/.test(password)) {
    return "Password must contain at least one special character";
  }

  return null;
};

// ========================================
// REGISTER
// ========================================

const registerUser = async (req, res) => {
  try {
    const {
      full_name,
      company_name,
      gst_no,
      email,
      phone_no,
      password
    } = req.body;

    const passwordError = validatePassword(password);

    if (passwordError) {
      return res.status(400).json({
        message: passwordError
      });
    }

    const normalizedEmail =
      String(email || "").trim().toLowerCase();

    const normalizedPhone =
      String(phone_no || "").replace(/\D/g, "");

    const normalizedFullName =
      String(full_name || "").trim();

    const normalizedCompany =
      String(company_name || "").trim();

    const normalizedGst =
      String(gst_no || "").trim().toUpperCase();

    userModel.checkUser(
      normalizedEmail,
      normalizedPhone,
      async (err, result) => {
        if (err) {
          return res.status(500).json({
            message: err.message
          });
        }

        if (result.length > 0) {
          const existingUser = result[0];

          if (
            String(existingUser.email || "").toLowerCase() ===
            normalizedEmail
          ) {
            return res.status(400).json({
              message: "Email already exists"
            });
          }

          if (
            String(existingUser.phone_no || "") ===
            normalizedPhone
          ) {
            return res.status(400).json({
              message: "Phone number already exists"
            });
          }
        }

        try {
          // ======================================
          // HASH PASSWORD
          // ======================================

          const hashedPassword = await bcrypt.hash(
            password,
            12
          );

          const userData = {
            full_name: normalizedFullName,
            company_name: normalizedCompany,
            gst_no: normalizedGst,
            email: normalizedEmail,
            phone_no: normalizedPhone,
            password: hashedPassword,
            role: "user"
          };

          userModel.createUser(
            userData,
            (err, result) => {
              if (err) {
                return res.status(500).json({
                  message: err.message
                });
              }

              return res.status(201).json({
                message: "User registered successfully"
              });
            }
          );
        } catch (hashError) {
          console.error(
            "Password hashing error:",
            hashError
          );

          return res.status(500).json({
            message: "Registration failed"
          });
        }
      }
    );

  } catch (error) {
    console.error(
      "Register error:",
      error
    );

    return res.status(500).json({
      message: "Registration failed"
    });
  }
};

// ========================================
// LOGIN
// ========================================

const loginUser = async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    const normalizedEmail =
      String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    userModel.findUserByEmail(
      normalizedEmail,
      async (err, result) => {
        if (err) {
          return res.status(500).json({
            message: err.message
          });
        }

        if (result.length === 0) {
          return res.status(401).json({
            message: "Email or password is incorrect"
          });
        }

        const user = result[0];

        try {
          const storedPassword =
            String(user.password || "");

          let passwordMatched = false;

          // ======================================
          // CHECK WHETHER PASSWORD IS BCRYPT
          // ======================================

          const isBcryptHash =
            storedPassword.startsWith("$2a$") ||
            storedPassword.startsWith("$2b$") ||
            storedPassword.startsWith("$2y$");

          // ======================================
          // NEW USER / BCRYPT PASSWORD
          // ======================================

          if (isBcryptHash) {
            passwordMatched =
              await bcrypt.compare(
                password,
                storedPassword
              );
          }

          // ======================================
          // OLD USER / PLAIN PASSWORD
          // ======================================

          else {
            passwordMatched =
              storedPassword === password;
          }

          if (!passwordMatched) {
            return res.status(401).json({
              message: "Email or password is incorrect"
            });
          }

          // ======================================
          // MIGRATE OLD PASSWORD TO BCRYPT
          // ======================================

          if (!isBcryptHash) {
            const newHash =
              await bcrypt.hash(
                password,
                12
              );

            userModel.updateUserPassword(
              user.id,
              newHash,
              (updateErr) => {
                if (updateErr) {
                  console.error(
                    "Password migration error:",
                    updateErr
                  );

                  // Login can still continue.
                }

                createLoginResponse(
                  res,
                  user
                );
              }
            );

            return;
          }

          // ======================================
          // NORMAL BCRYPT LOGIN
          // ======================================

          createLoginResponse(
            res,
            user
          );

        } catch (passwordError) {
          console.error(
            "Password verification error:",
            passwordError
          );

          return res.status(500).json({
            message: "Login failed"
          });
        }
      }
    );

  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      message: "Login failed"
    });
  }
};

// ========================================
// LOGIN RESPONSE
// ========================================

const createLoginResponse = (
  res,
  user
) => {
  const safeUser = {
    id: user.id,
    full_name: user.full_name,
    company_name: user.company_name,
    gst_no: user.gst_no,
    email: user.email,
    phone_no: user.phone_no,
    role: user.role,
    profile_image:
      user.profile_image || null,
    created_at: user.created_at
  };

  const token = jwt.sign(
    {
      user_id: user.id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );

  return res.status(200).json({
    message: "Login successful",
    role: user.role,
    token,
    user: safeUser
  });
};

// ========================================
// GET USER PROFILE
// ========================================

const getUserProfile = (
  req,
  res
) => {
  const {
    user_id
  } = req.params;

  if (!user_id) {
    return res.status(400).json({
      message: "User ID is required"
    });
  }

  userModel.findUserById(
    user_id,
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: err.message
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      return res.status(200).json({
        user: result[0]
      });
    }
  );
};

// ========================================
// UPDATE USER PROFILE
// ========================================

const updateUserProfile = (
  req,
  res
) => {
  const {
    user_id,
    full_name,
    email,
    phone_no,
    profile_image
  } = req.body;

  if (!user_id) {
    return res.status(400).json({
      message: "User ID is required"
    });
  }

  if (
    !full_name ||
    !full_name.trim()
  ) {
    return res.status(400).json({
      message: "Name is required"
    });
  }

  if (
    !email ||
    !email.trim()
  ) {
    return res.status(400).json({
      message: "Email is required"
    });
  }

  if (
    !phone_no ||
    !phone_no.trim()
  ) {
    return res.status(400).json({
      message: "Mobile number is required"
    });
  }

  userModel.checkDuplicateUser(
    user_id,
    email,
    phone_no,
    (err, result) => {

      if (err) {
        return res.status(500).json({
          message: err.message
        });
      }

      if (result.length > 0) {
        const existingUser =
          result[0];

        if (
          existingUser.email === email
        ) {
          return res.status(400).json({
            message: "Email already exists"
          });
        }

        if (
          existingUser.phone_no === phone_no
        ) {
          return res.status(400).json({
            message: "Phone number already exists"
          });
        }
      }

      userModel.updateUserProfile(
        user_id,
        {
          full_name:
            full_name.trim(),

          email:
            email.trim(),

          phone_no:
            phone_no.trim(),

          profile_image:
            profile_image || null
        },
        (err, result) => {

          if (err) {
            return res.status(500).json({
              message: err.message
            });
          }

          userModel.findUserById(
            user_id,
            (err, userResult) => {

              if (err) {
                return res.status(500).json({
                  message: err.message
                });
              }

              if (
                userResult.length === 0
              ) {
                return res.status(404).json({
                  message: "User not found"
                });
              }

              return res.status(200).json({
                message:
                  "Profile updated successfully",

                user:
                  userResult[0]
              });
            }
          );
        }
      );
    }
  );
};

// ========================================
// EXPORT
// ========================================

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
};