
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Session expired. Please login again.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Authentication token missing.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.sessionId || !decoded.id) {
      return res.status(401).json({
        message: "Invalid session. Please login again.",
      });
    }

    const [sessions] = await db.promise().query(
      `SELECT session_id, user_id, expires_at, revoked_at
       FROM user_sessions
       WHERE session_id = ? AND user_id = ?
       LIMIT 1`,
      [decoded.sessionId, String(decoded.id)]
    );

    if (sessions.length === 0) {
      return res.status(401).json({
        message: "Session not found. Please login again.",
      });
    }

    const session = sessions[0];

    if (
      session.revoked_at ||
      new Date(session.expires_at).getTime() <= Date.now()
    ) {
      return res.status(401).json({
        message: "Session expired. Please login again.",
      });
    }

    req.user = {
      id: session.user_id,
      sessionId: session.session_id,
    };

    next();
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      return res.status(401).json({
        message: "Invalid or expired session. Please login again.",
      });
    }

    console.error("Authentication error:", error);

    return res.status(500).json({
      message: "Authentication failed.",
    });
  }
};

module.exports = authMiddleware;
