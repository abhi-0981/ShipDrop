const jwt = require("jsonwebtoken");
const db = require("../config/db");

/**
 * Admin Authentication Middleware
 * Validates the Bearer token in request headers, verifies JWT signature,
 * and ensures the requester has an active administrator role.
 */
const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || typeof authHeader !== "string") {
      return res.status(401).json({
        success: false,
        code: "ADMIN_TOKEN_MISSING",
        message: "Authentication token is missing. Please log in as an administrator.",
      });
    }

    const parts = authHeader.trim().split(" ");
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN_FORMAT",
        message: "Invalid authorization format. Bearer token required.",
      });
    }

    const token = parts[1];
    const jwtSecret =
      process.env.JWT_SECRET || "shipdrop_admin_jwt_secret_key_default";

    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtErr) {
      if (jwtErr.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          code: "ADMIN_SESSION_EXPIRED",
          message: "Admin session has expired. Please log in again.",
        });
      }
      return res.status(401).json({
        success: false,
        code: "INVALID_ADMIN_TOKEN",
        message: "Invalid authentication credentials.",
      });
    }

    if (!decoded.id || decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "Access denied. Administrator privileges required.",
      });
    }

    // Verify admin still exists in database
    const [admins] = await db.query(
      "SELECT id, username FROM admins WHERE id = ? LIMIT 1",
      [decoded.id]
    );

    if (admins.length === 0) {
      return res.status(401).json({
        success: false,
        code: "ADMIN_NOT_FOUND",
        message: "Administrator account no longer exists.",
      });
    }

    req.admin = {
      id: admins[0].id,
      username: admins[0].username,
      role: "admin",
    };

    return next();
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during admin authentication.",
    });
  }
};

module.exports = {
  verifyAdmin,
  authenticateAdmin: verifyAdmin,
};
