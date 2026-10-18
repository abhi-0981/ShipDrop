const jwt = require("jsonwebtoken");
const db = require("../config/db");

/**
 * Authentication Middleware
 * Validates Bearer token, checks 24h expiration, and verifies active session
 * in user_sessions table (enforcing global multi-device logout).
 */
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || typeof authHeader !== "string") {
      return res.status(401).json({
        success: false,
        code: "TOKEN_MISSING",
        message: "Authentication token is missing. Please log in.",
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
    const jwtSecret = process.env.JWT_SECRET || "default_jwt_secret_shipdrop";

    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtErr) {
      if (jwtErr.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          code: "SESSION_EXPIRED",
          message: "Your session has expired. Please log in again.",
        });
      }
      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN",
        message: "Invalid or corrupted authentication token. Please log in again.",
      });
    }

    const userId = decoded.id || decoded.user_id;
    const sessionId = decoded.session_id;

    if (!userId || !sessionId) {
      return res.status(401).json({
        success: false,
        code: "INVALID_SESSION_CLAIMS",
        message: "Invalid session credentials. Please log in again.",
      });
    }

    const promiseDb = db.promise();

    // Check user_sessions table: must exist, not be revoked, and not expired
    const [sessions] = await promiseDb.query(
      `
      SELECT session_id, user_id, expires_at, revoked_at,
             (expires_at > NOW()) AS is_not_expired
      FROM user_sessions
      WHERE session_id = ? AND user_id = ?
      LIMIT 1
      `,
      [sessionId, String(userId)]
    );

    if (!sessions || sessions.length === 0) {
      return res.status(401).json({
        success: false,
        code: "SESSION_NOT_FOUND",
        message: "Session does not exist. Please log in again.",
      });
    }

    const session = sessions[0];

    // If revoked_at is set, session was revoked (e.g. global logout from another device)
    if (session.revoked_at !== null) {
      return res.status(401).json({
        success: false,
        code: "SESSION_REVOKED",
        message: "Session has been revoked due to logout. Please log in again.",
      });
    }

    // Check 24-hour expiration against database time
    if (!session.is_not_expired) {
      return res.status(401).json({
        success: false,
        code: "SESSION_EXPIRED",
        message: "Session has expired after 24 hours. Please log in again.",
      });
    }

    // Verify user exists in database
    const [userRows] = await promiseDb.query(
      `
      SELECT id, full_name, company_name, gst_no, email, phone_no, role, profile_image, theme_preference, created_at
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [userId]
    );

    if (!userRows || userRows.length === 0) {
      return res.status(401).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "User account associated with this session no longer exists.",
      });
    }

    const user = userRows[0];

    // Set req.user safely from verified token/session, never from request body
    req.user = {
      id: user.id,
      user_id: user.id,
      full_name: user.full_name,
      company_name: user.company_name,
      gst_no: user.gst_no,
      email: user.email,
      phone_no: user.phone_no,
      role: user.role,
      profile_image: user.profile_image || null,
      theme_preference: user.theme_preference || "forest-mint",
      created_at: user.created_at,
      session_id: sessionId,
    };

    return next();
  } catch (error) {
    console.error("Auth middleware database/server error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication verification.",
    });
  }
};

module.exports = {
  authenticateUser,
  authMiddleware: authenticateUser,
  verifyAuth: authenticateUser,
};
