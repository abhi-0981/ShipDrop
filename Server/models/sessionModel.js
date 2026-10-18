const db = require("../config/db");

const sessionModel = {
  /**
   * Auto-healing schema helper: Ensures user_sessions table and columns exist in MySQL
   */
  ensureTable: async () => {
    try {
      const promiseDb = db.promise();

      await promiseDb.query(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          session_id VARCHAR(128) NOT NULL DEFAULT '',
          user_id INT NOT NULL DEFAULT 0,
          ip_address VARCHAR(45) NULL DEFAULT NULL,
          user_agent TEXT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          is_revoked TINYINT(1) NOT NULL DEFAULT 0,
          revoked_at TIMESTAMP NULL DEFAULT NULL,
          INDEX idx_user_sessions_user_id (user_id),
          INDEX idx_user_sessions_session_id (session_id),
          INDEX idx_user_sessions_user_revoked (user_id, is_revoked),
          INDEX idx_user_sessions_expires_at (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Use SHOW COLUMNS to inspect without schema name dependencies
      const [cols] = await promiseDb.query("SHOW COLUMNS FROM user_sessions");
      const colNames = (cols || []).map((c) => c.Field.toLowerCase());

      if (!colNames.includes("session_id")) {
        await promiseDb.query(
          "ALTER TABLE user_sessions ADD COLUMN session_id VARCHAR(128) NOT NULL DEFAULT ''"
        );
      }
      if (!colNames.includes("user_id")) {
        await promiseDb.query(
          "ALTER TABLE user_sessions ADD COLUMN user_id INT NOT NULL DEFAULT 0"
        );
      }
      if (!colNames.includes("expires_at")) {
        await promiseDb.query(
          "ALTER TABLE user_sessions ADD COLUMN expires_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
        );
      }
      if (!colNames.includes("is_revoked")) {
        await promiseDb.query(
          "ALTER TABLE user_sessions ADD COLUMN is_revoked TINYINT(1) NOT NULL DEFAULT 0"
        );
      }
      if (!colNames.includes("revoked_at")) {
        await promiseDb.query(
          "ALTER TABLE user_sessions ADD COLUMN revoked_at TIMESTAMP NULL DEFAULT NULL"
        );
      }
      if (!colNames.includes("ip_address")) {
        await promiseDb.query(
          "ALTER TABLE user_sessions ADD COLUMN ip_address VARCHAR(45) NULL DEFAULT NULL"
        );
      }
      if (!colNames.includes("user_agent")) {
        await promiseDb.query(
          "ALTER TABLE user_sessions ADD COLUMN user_agent TEXT NULL"
        );
      }
    } catch (err) {
      console.warn("[sessionModel] ensureTable notice:", err.message);
    }
  },

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

    try {
      const [result] = await db.promise().query(query, [
        sessionId,
        userId,
        ipAddress || null,
        userAgent || null,
        expiresAt,
      ]);
      return result;
    } catch (err) {
      // Auto-heal on missing table or column error
      if (
        err.code === "ER_NO_SUCH_TABLE" ||
        err.code === "ER_BAD_FIELD_ERROR" ||
        err.errno === 1146 ||
        err.errno === 1054
      ) {
        console.warn("[sessionModel] Auto-healing user_sessions schema on createSession...");
        await sessionModel.ensureTable();
        const [retryResult] = await db.promise().query(query, [
          sessionId,
          userId,
          ipAddress || null,
          userAgent || null,
          expiresAt,
        ]);
        return retryResult;
      }
      throw err;
    }
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

    try {
      const [rows] = await db.promise().query(query, [sessionId, userId]);
      return rows[0] || null;
    } catch (err) {
      // Auto-heal on missing table or column error
      if (
        err.code === "ER_NO_SUCH_TABLE" ||
        err.code === "ER_BAD_FIELD_ERROR" ||
        err.errno === 1146 ||
        err.errno === 1054
      ) {
        console.warn("[sessionModel] Auto-healing user_sessions schema on findSession...");
        await sessionModel.ensureTable();
        const [retryRows] = await db.promise().query(query, [sessionId, userId]);
        return retryRows[0] || null;
      }
      throw err;
    }
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

    try {
      const [result] = await db.promise().query(query, [userId]);
      return result;
    } catch (err) {
      if (
        err.code === "ER_NO_SUCH_TABLE" ||
        err.code === "ER_BAD_FIELD_ERROR" ||
        err.errno === 1146 ||
        err.errno === 1054
      ) {
        await sessionModel.ensureTable();
        const [retryResult] = await db.promise().query(query, [userId]);
        return retryResult;
      }
      throw err;
    }
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

    try {
      const [result] = await db.promise().query(query, params);
      return result;
    } catch (err) {
      if (
        err.code === "ER_NO_SUCH_TABLE" ||
        err.code === "ER_BAD_FIELD_ERROR" ||
        err.errno === 1146 ||
        err.errno === 1054
      ) {
        await sessionModel.ensureTable();
        const [retryResult] = await db.promise().query(query, params);
        return retryResult;
      }
      throw err;
    }
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

    try {
      const [rows] = await db.promise().query(query, [userId]);
      return rows[0]?.active_count || 0;
    } catch (err) {
      if (
        err.code === "ER_NO_SUCH_TABLE" ||
        err.code === "ER_BAD_FIELD_ERROR" ||
        err.errno === 1146 ||
        err.errno === 1054
      ) {
        await sessionModel.ensureTable();
        const [retryRows] = await db.promise().query(query, [userId]);
        return retryRows[0]?.active_count || 0;
      }
      return 0;
    }
  },
};

module.exports = sessionModel;
