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
    let [sessions] = await promiseDb.query(
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
      if (decoded.is_impersonated) {
        // Cross-database support: automatically ensure session exists in Server DB
        try {
          await promiseDb.query(
            `
            INSERT INTO user_sessions (session_id, user_id, expires_at, revoked_at, created_at)
            VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 2 HOUR), NULL, NOW())
            ON DUPLICATE KEY UPDATE expires_at = DATE_ADD(NOW(), INTERVAL 2 HOUR)
            `,
            [sessionId, String(userId)]
          );
          sessions = [{
            session_id: sessionId,
            user_id: String(userId),
            expires_at: new Date(Date.now() + 2 * 3600 * 1000),
            revoked_at: null,
            is_not_expired: 1,
          }];
        } catch (insertErr) {
          console.warn("Could not auto-insert impersonated session in server db:", insertErr.message);
        }
      } else {
        return res.status(401).json({
          success: false,
          code: "SESSION_NOT_FOUND",
          message: "Session does not exist. Please log in again.",
        });
      }
    }

    if (sessions && sessions.length > 0) {
      const session = sessions[0];

      // If revoked_at is set, session was revoked (e.g. global logout from another device)
      if (session.revoked_at !== null) {
        return res.status(401).json({
          success: false,
          code: "SESSION_REVOKED",
          message: "Session has been revoked due to logout. Please log in again.",
        });
      }

      // Check expiration against database time
      if (!session.is_not_expired && !decoded.is_impersonated) {
        return res.status(401).json({
          success: false,
          code: "SESSION_EXPIRED",
          message: "Session has expired after 24 hours. Please log in again.",
        });
      }
    }

    // Verify user exists in database
    let [userRows] = await promiseDb.query(
      `
      SELECT id, full_name, company_name, gst_no, email, phone_no, role, profile_image, created_at
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [userId]
    );

    if ((!userRows || userRows.length === 0) && decoded.email) {
      try {
        const [byEmail] = await promiseDb.query(
          `
          SELECT id, full_name, company_name, gst_no, email, phone_no, role, profile_image, created_at
          FROM users
          WHERE email = ?
          LIMIT 1
          `,
          [decoded.email]
        );
        if (byEmail && byEmail.length > 0) {
          userRows = byEmail;
        }
      } catch (e) {}
    }

    if (!userRows || userRows.length === 0) {
      if (decoded.is_impersonated) {
        // Fallback for impersonation session when user record ID is out of sync across dev DBs
        userRows = [{
          id: userId,
          full_name: decoded.full_name || decoded.target_user_name || "Merchant",
          email: decoded.email || "",
          company_name: decoded.company_name || "",
          gst_no: decoded.gst_no || "",
          phone_no: decoded.phone_no || "",
          role: decoded.role || "user",
          profile_image: null,
          created_at: new Date().toISOString(),
        }];
      } else {
        return res.status(401).json({
          success: false,
          code: "USER_NOT_FOUND",
          message: "User account associated with this session no longer exists.",
        });
      }
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
      created_at: user.created_at,
      session_id: sessionId,
      is_impersonated: Boolean(decoded.is_impersonated),
      impersonated_by: decoded.impersonated_by || null,
      impersonation_log_id: decoded.impersonation_log_id || null,
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
