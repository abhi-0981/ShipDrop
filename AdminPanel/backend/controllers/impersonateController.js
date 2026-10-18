const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { ensureTables } = require("../config/ensureTables");

/**
 * Get the secret used for signing user tokens.
 * Matches Server/config/db & env (PARCELDROP8384930619PRAHLADSINGH in production/dev).
 */
const getUserJwtSecret = () => {
  return (
    process.env.USER_JWT_SECRET ||
    process.env.JWT_SECRET_USER ||
    "PARCELDROP8384930619PRAHLADSINGH"
  );
};

/**
 * Determine the user-facing client URL based on the request origin or environment.
 */
const getUserAppUrl = (req) => {
  if (process.env.USER_APP_URL) {
    return process.env.USER_APP_URL.replace(/\/+$/, "");
  }

  const origin = req.headers.origin || req.headers.referer || "";
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
    return "http://localhost:5173";
  }

  return "https://parceldrop.in";
};

/**
 * START IMPERSONATION
 * Verified Admin requests to login as a specific user for support/troubleshooting.
 */
const startImpersonation = async (req, res) => {
  try {
    // Defensively ensure all required session and audit tables exist
    await ensureTables().catch(() => {});

    const admin = req.admin;
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Administrator privileges required.",
      });
    }

    const { target_user_id, reason } = req.body;
    const userId = Number(target_user_id);

    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid target user ID is required.",
      });
    }

    // 1. Fetch user from database to ensure genuine account
    const [users] = await db.query(
      `
      SELECT id, full_name, company_name, gst_no, email, phone_no, role, profile_image, created_at
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Target user account not found in database.",
      });
    }

    const targetUser = users[0];

    // Prevent impersonating administrative accounts
    if (String(targetUser.role || "").toLowerCase() === "admin") {
      return res.status(403).json({
        success: false,
        message: "Security violation: Impersonating administrator accounts is prohibited.",
      });
    }

    const safeUser = {
      id: targetUser.id,
      user_id: targetUser.id,
      full_name: targetUser.full_name,
      company_name: targetUser.company_name,
      gst_no: targetUser.gst_no,
      email: targetUser.email,
      phone_no: targetUser.phone_no,
      role: targetUser.role || "user",
      profile_image: targetUser.profile_image || null,
      created_at: targetUser.created_at,
    };

    // 2. Create a temporary 2-hour session in user_sessions
    const sessionId = crypto.randomUUID();
    await db.query(
      `
      INSERT INTO user_sessions (session_id, user_id, expires_at, revoked_at, created_at)
      VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 2 HOUR), NULL, NOW())
      `,
      [sessionId, String(targetUser.id)]
    );

    // 3. Record in audit logs
    const clientIp =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      null;
    const userAgent = req.headers["user-agent"] || null;
    const sessionReason =
      (reason && String(reason).trim()) ||
      "Customer Support / Troubleshooting";

    const [logResult] = await db.query(
      `
      INSERT INTO admin_impersonation_logs
        (admin_id, admin_username, target_user_id, target_user_name, target_user_email, session_id, reason, status, ip_address, user_agent, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR))
      `,
      [
        admin.id,
        admin.username,
        targetUser.id,
        targetUser.full_name || "Merchant",
        targetUser.email,
        sessionId,
        sessionReason,
        clientIp,
        userAgent,
      ]
    );

    const logId = logResult.insertId;

    // 4. Generate user JWT token with explicit impersonation metadata
    const userJwtSecret = getUserJwtSecret();
    const userToken = jwt.sign(
      {
        id: targetUser.id,
        user_id: targetUser.id,
        session_id: sessionId,
        email: targetUser.email,
        role: targetUser.role || "user",
        is_impersonated: true,
        impersonated_by: {
          admin_id: admin.id,
          admin_username: admin.username,
        },
        impersonation_log_id: logId,
      },
      userJwtSecret,
      { expiresIn: "2h" }
    );

    // 5. Generate single-use exchange ticket (expires in 60 seconds)
    const ticketId = crypto.randomUUID();
    const adminOrigin =
      req.headers.origin || req.headers.referer || "http://localhost:5174";
    const adminReturnUrl =
      req.body.admin_return_url || `${adminOrigin.replace(/\/+$/, "")}/users`;

    await db.query(
      `
      INSERT INTO impersonation_tickets
        (ticket_id, admin_id, admin_username, target_user_id, session_id, user_token, user_data, admin_return_url, used, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), DATE_ADD(NOW(), INTERVAL 60 SECOND))
      `,
      [
        ticketId,
        admin.id,
        admin.username,
        targetUser.id,
        sessionId,
        userToken,
        JSON.stringify(safeUser),
        adminReturnUrl,
      ]
    const userAppUrl =
      (req.body.user_app_url &&
        String(req.body.user_app_url).trim().replace(/\/+$/, "")) ||
      getUserAppUrl(req);
    const redirectUrl = `${userAppUrl}/auth/impersonate?ticket=${ticketId}`;

    return res.status(200).json({
      success: true,
      message: "Impersonation session initialized successfully.",
      redirect_url: redirectUrl,
      ticket: ticketId,
      target_user: {
        id: targetUser.id,
        full_name: targetUser.full_name,
        email: targetUser.email,
      },
    });
  } catch (error) {
    console.error("Start impersonation error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to initiate impersonation session.",
    });
  }
};

/**
 * EXCHANGE SINGLE-USE TICKET
 * Called by the frontend /auth/impersonate landing page.
 * Validates the ticket, marks it used, and returns the authentication token.
 */
const exchangeTicket = async (req, res) => {
  try {
    const { ticket } = req.body;

    if (!ticket || typeof ticket !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid exchange ticket is required.",
      });
    }

    const [rows] = await db.query(
      `
      SELECT ticket_id, admin_id, admin_username, target_user_id, session_id, user_token, user_data, admin_return_url, expires_at
      FROM impersonation_tickets
      WHERE ticket_id = ? AND used = 0 AND expires_at > NOW()
      LIMIT 1
      `,
      [ticket]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        code: "INVALID_OR_EXPIRED_TICKET",
        message: "The impersonation link is invalid, already used, or expired.",
      });
    }

    const record = rows[0];

    // Mark as used immediately to guarantee single-use security
    await db.query(
      "UPDATE impersonation_tickets SET used = 1 WHERE ticket_id = ?",
      [ticket]
    );

    let parsedUser = {};
    try {
      parsedUser = JSON.parse(record.user_data);
    } catch {
      parsedUser = { id: record.target_user_id };
    }

    return res.status(200).json({
      success: true,
      token: record.user_token,
      user: parsedUser,
      impersonation: {
        active: true,
        admin_id: record.admin_id,
        admin_username: record.admin_username,
        target_user_id: record.target_user_id,
        session_id: record.session_id,
        admin_return_url: record.admin_return_url,
        expires_at: record.expires_at,
      },
    });
  } catch (error) {
    console.error("Exchange ticket error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to exchange impersonation ticket.",
    });
  }
};

/**
 * END IMPERSONATION SESSION
 * Revokes the specific impersonation session in user_sessions and marks the audit log as ENDED.
 */
const endImpersonation = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    let sessionId = null;

    if (authHeader && typeof authHeader === "string") {
      const parts = authHeader.trim().split(" ");
      if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
        try {
          const userJwtSecret = getUserJwtSecret();
          const decoded = jwt.verify(parts[1], userJwtSecret, {
            ignoreExpiration: true,
          });
          sessionId = decoded.session_id;
        } catch {
          // Token decoding failure
        }
      }
    }

    if (!sessionId && req.body.session_id) {
      sessionId = String(req.body.session_id);
    }

    if (sessionId) {
      // Revoke only this specific session
      await db.query(
        "UPDATE user_sessions SET revoked_at = NOW() WHERE session_id = ?",
        [sessionId]
      );

      // Mark audit log as ENDED
      await db.query(
        `
        UPDATE admin_impersonation_logs
        SET status = 'ENDED', ended_at = NOW()
        WHERE session_id = ? AND status = 'ACTIVE'
        `,
        [sessionId]
      );
    }

    return res.status(200).json({
      success: true,
      message: "Impersonation session terminated successfully.",
    });
  } catch (error) {
    console.error("End impersonation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to end impersonation session.",
    });
  }
};

/**
 * GET IMPERSONATION AUDIT LOGS
 * Allows administrators to review all impersonation sessions.
 */
const getImpersonationLogs = async (req, res) => {
  try {
    const [logs] = await db.query(`
      SELECT
        id,
        admin_id,
        admin_username,
        target_user_id,
        target_user_name,
        target_user_email,
        session_id,
        reason,
        status,
        ip_address,
        created_at,
        expires_at,
        ended_at
      FROM admin_impersonation_logs
      ORDER BY id DESC
      LIMIT 100
    `);

    return res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error("Get impersonation logs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve impersonation audit logs.",
    });
  }
};

module.exports = {
  startImpersonation,
  exchangeTicket,
  endImpersonation,
  getImpersonationLogs,
};
