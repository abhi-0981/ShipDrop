const jwt = require("jsonwebtoken");
const sessionModel = require("../models/sessionModel");

/**
 * Helper to extract a cookie from req.headers.cookie without external dependencies
 * @param {import("express").Request} req
 * @param {string} name
 */
const getCookie = (req, name) => {
  if (req.cookies && req.cookies[name]) {
    return req.cookies[name];
  }

  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const match = cookieHeader.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : null;
};

/**
 * Strict Authentication Middleware
 * Validates:
 * 1. JWT signature and structural validity
 * 2. Session ID in user_sessions table
 * 3. Server-side revocation status (Global Logout)
 * 4. Server-side 24-hour exact expiry (Strict Auto-Logout, not extended by activity)
 */
const authMiddleware = async (req, res, next) => {
  try {
    // ----------------------------------------------------
    // 1. EXTRACT TOKEN
    // Priority: HttpOnly Cookie -> Authorization Bearer Header
    // ----------------------------------------------------
    let token = getCookie(req, "token");

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
        token = parts[1].trim();
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        code: "AUTH_REQUIRED",
        message: "Authentication required. Please log in.",
      });
    }

    // ----------------------------------------------------
    // 2. VERIFY JWT SIGNATURE
    // ----------------------------------------------------
    const jwtSecret =
      process.env.JWT_SECRET || "PARCELDROP8384930619PRAHLADSINGH";

    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtErr) {
      if (jwtErr.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          code: "SESSION_EXPIRED",
          message: "Session expired after 24 hours. Please log in again.",
        });
      }

      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN",
        message: "Invalid authentication token. Please log in again.",
      });
    }

    const sessionId = decoded.session_id;
    const userId = Number(decoded.id || decoded.user_id);

    if (!sessionId || !userId) {
      return res.status(401).json({
        success: false,
        code: "INVALID_SESSION",
        message: "Invalid session credentials in token.",
      });
    }

    // ----------------------------------------------------
    // 3. VERIFY SESSION IN DATABASE
    // ----------------------------------------------------
    const session = await sessionModel.findSession(sessionId, userId);

    if (!session) {
      return res.status(401).json({
        success: false,
        code: "SESSION_NOT_FOUND",
        message: "Session not found or has expired. Please log in again.",
      });
    }

    // ----------------------------------------------------
    // 4. CHECK REVOCATION STATUS (GLOBAL LOGOUT)
    // ----------------------------------------------------
    if (session.is_revoked === 1 || session.is_revoked === true) {
      return res.status(401).json({
        success: false,
        code: "SESSION_REVOKED",
        message:
          "Your session has been logged out from another device. Please log in again.",
      });
    }

    // ----------------------------------------------------
    // 5. CHECK SERVER-SIDE 24-HOUR EXPIRY
    // API activity, page refreshes, or restarts DO NOT extend this.
    // ----------------------------------------------------
    const now = new Date();
    const expiresAt = new Date(session.expires_at);

    if (now >= expiresAt) {
      return res.status(401).json({
        success: false,
        code: "SESSION_EXPIRED",
        message: "Session expired after 24 hours. Please log in again.",
      });
    }

    // ----------------------------------------------------
    // 6. ATTACH AUTHENTICATED USER TO REQUEST
    // ----------------------------------------------------
    req.user = {
      id: userId,
      user_id: userId,
      email: decoded.email,
      role: decoded.role || "user",
      session_id: sessionId,
    };
    req.userId = userId;
    req.sessionId = sessionId;

    return next();
  } catch (error) {
    console.error("authMiddleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal authentication error",
    });
  }
};

module.exports = authMiddleware;
