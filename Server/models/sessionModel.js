const db = require("../config/db");

const sessionModel = {
  /**
   * Create a new session record in user_sessions table
   * @param {Object} sessionData
   * @param {string} sessionData.sessionId
   * @param {number} sessionData.userId
   * @param {string} [sessionData.ipAddress]
   * @param {string} [sessionData.userAgent]
   * @param {Date} sessionData.expiresAt
   */
  createSession: async ({
    sessionId,
    userId,
    ipAddress,
    userAgent,
    expiresAt,
  }) => {
    const query = `
      INSERT INTO user_sessions (
        session_id,
        user_id,
        ip_address,
        user_agent,
        created_at,
        expires_at,
        is_revoked
      )
      VALUES (?, ?, ?, ?, NOW(), ?, 0)
    `;

    const [result] = await db.promise().query(query, [
      sessionId,
      userId,
      ipAddress || null,
      userAgent || null,
      expiresAt,
    ]);

    return result;
  },

  /**
   * Find an active or existing session by sessionId and userId
   * @param {string} sessionId
   * @param {number} userId
   */
  findSession: async (sessionId, userId) => {
    const query = `
      SELECT
        id,
        session_id,
        user_id,
        ip_address,
        user_agent,
        created_at,
        expires_at,
        is_revoked,
        revoked_at
      FROM user_sessions
      WHERE session_id = ? AND user_id = ?
      LIMIT 1
    `;

    const [rows] = await db.promise().query(query, [sessionId, userId]);
    return rows[0] || null;
  },

  /**
   * Revoke ALL active sessions for a user (Global Logout)
   * @param {number} userId
   */
  revokeAllUserSessions: async (userId) => {
    const query = `
      UPDATE user_sessions
      SET
        is_revoked = 1,
        revoked_at = NOW()
      WHERE user_id = ?
        AND is_revoked = 0
    `;

    const [result] = await db.promise().query(query, [userId]);
    return result;
  },

  /**
   * Revoke a specific single session by sessionId
   * @param {string} sessionId
   * @param {number} [userId]
   */
  revokeSession: async (sessionId, userId) => {
    let query = `
      UPDATE user_sessions
      SET
        is_revoked = 1,
        revoked_at = NOW()
      WHERE session_id = ?
        AND is_revoked = 0
    `;
    const params = [sessionId];

    if (userId) {
      query += " AND user_id = ?";
      params.push(userId);
    }

    const [result] = await db.promise().query(query, params);
    return result;
  },

  /**
   * Count active (non-revoked, unexpired) sessions for a user
   * @param {number} userId
   */
  getActiveSessionsCount: async (userId) => {
    const query = `
      SELECT COUNT(*) AS active_count
      FROM user_sessions
      WHERE user_id = ?
        AND is_revoked = 0
        AND expires_at > NOW()
    `;

    const [rows] = await db.promise().query(query, [userId]);
    return rows[0]?.active_count || 0;
  },
};

module.exports = sessionModel;
