const db = require("../config/db");

/**
 * EXCHANGE SINGLE-USE TICKET
 * Validates the single-use ticket in impersonation_tickets,
 * marks it used = 1, and returns the authentication token and user data.
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

    const promiseDb = db.promise();

    const [rows] = await promiseDb.query(
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
    await promiseDb.query(
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
    console.error("Server exchange ticket error:", error);
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
const endImpersonationSession = async (req, res) => {
  try {
    const sessionId = req.user?.session_id;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "No active session ID found to terminate.",
      });
    }

    const promiseDb = db.promise();

    // Revoke only this specific session
    await promiseDb.query(
      "UPDATE user_sessions SET revoked_at = NOW() WHERE session_id = ?",
      [sessionId]
    );

    // Mark audit log as ENDED
    await promiseDb.query(
      `
      UPDATE admin_impersonation_logs
      SET status = 'ENDED', ended_at = NOW()
      WHERE session_id = ? AND status = 'ACTIVE'
      `,
      [sessionId]
    );

    return res.status(200).json({
      success: true,
      message: "Impersonation session terminated successfully.",
    });
  } catch (error) {
    console.error("Server end impersonation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to end impersonation session.",
    });
  }
};

module.exports = {
  exchangeTicket,
  endImpersonationSession,
};
