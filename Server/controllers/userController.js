const userModel = require("../models/userModel");


// ========================================
// REGISTER
// ========================================

const registerUser = async (
  req,
  res
) => {
  try {
    const {
      full_name,
      company_name,
      gst_no,
      email,
      phone_no,
      password
    } = req.body;

    userModel.checkUser(
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
              message:
                "Email already exists"
            });
          }

          if (
            existingUser.phone_no ===
            phone_no
          ) {
            return res.status(400).json({
              message:
                "Phone number already exists"
            });
          }
        }

        const userData = {
          full_name,
          company_name,
          gst_no,
          email,
          phone_no,
          password,
          role: "user"
        };

        userModel.createUser(
          userData,
          (err, result) => {
            if (err) {
              return res.status(500).json({
                message:
                  err.message
              });
            }

            return res.status(201).json({
              message:
                "User registered successfully"
            });
          }
        );
      }
    );

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};


// ========================================
// LOGIN
// ========================================

const loginUser = (
  req,
  res
) => {
  const {
    email,
    password
  } = req.body;

  userModel.findUserByEmail(
    email,
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: err.message
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          message:
            "User not found"
        });
      }

      const user =
        result[0];

      if (
        user.password !== password
      ) {
        return res.status(401).json({
          message:
            "Invalid password"
        });
      }

      return res.status(200).json({
        message:
          "Login successful",

        role:
          user.role,

        user:
          user
      });
    }
  );
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
      message:
        "User ID is required"
    });
  }

  userModel.findUserById(
    user_id,
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message:
            err.message
        });
      }

      if (
        result.length === 0
      ) {
        return res.status(404).json({
          message:
            "User not found"
        });
      }

      return res.status(200).json({
        user:
          result[0]
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
      message:
        "User ID is required"
    });
  }

  if (
    !full_name ||
    !full_name.trim()
  ) {
    return res.status(400).json({
      message:
        "Name is required"
    });
  }

  if (
    !email ||
    !email.trim()
  ) {
    return res.status(400).json({
      message:
        "Email is required"
    });
  }

  if (
    !phone_no ||
    !phone_no.trim()
  ) {
    return res.status(400).json({
      message:
        "Mobile number is required"
    });
  }


  // ======================================
  // CHECK DUPLICATE EMAIL / PHONE
  // ======================================

  userModel.checkDuplicateUser(
    user_id,
    email,
    phone_no,
    (err, result) => {

      if (err) {
        return res.status(500).json({
          message:
            err.message
        });
      }

      if (
        result.length > 0
      ) {
        const existingUser =
          result[0];

        if (
          existingUser.email ===
          email
        ) {
          return res.status(400).json({
            message:
              "Email already exists"
          });
        }

        if (
          existingUser.phone_no ===
          phone_no
        ) {
          return res.status(400).json({
            message:
              "Phone number already exists"
          });
        }
      }


      // ==================================
      // UPDATE DATABASE
      // ==================================

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
              message:
                err.message
            });
          }

          // ==================================
          // RETURN UPDATED USER
          // ==================================

          userModel.findUserById(
            user_id,
            (err, userResult) => {

              if (err) {
                return res.status(500).json({
                  message:
                    err.message
                });
              }

              if (
                userResult.length ===
                0
              ) {
                return res.status(404).json({
                  message:
                    "User not found"
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


module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
};