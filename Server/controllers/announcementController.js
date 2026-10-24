const db = require("../config/db");

const promiseDb = db.promise();
let isServerSchemaEnsured = false;

const ensureServerSchema = async () => {
  try {
    await promiseDb.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'INFO',
        target_type VARCHAR(20) DEFAULT 'ALL',
        target_user_ids TEXT DEFAULT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_announcements_active (is_active),
        INDEX idx_announcements_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await promiseDb.query(`
      CREATE TABLE IF NOT EXISTS announcement_reads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        announcement_id INT NOT NULL,
        user_id INT NOT NULL,
        read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_announcement (user_id, announcement_id),
        INDEX idx_announcement_reads_user (user_id),
        INDEX idx_announcement_reads_announcement (announcement_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await promiseDb.query(`
      CREATE TABLE IF NOT EXISTS announcement_recipients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        announcement_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_announcement_user (announcement_id, user_id),
        INDEX idx_recipients_user (user_id),
        INDEX idx_recipients_announcement (announcement_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    try {
      const [colTargetType] = await promiseDb.query(
        `SHOW COLUMNS FROM announcements LIKE 'target_type'`
      );
      if (!colTargetType || colTargetType.length === 0) {
        await promiseDb.query(
          `ALTER TABLE announcements ADD COLUMN target_type VARCHAR(20) DEFAULT 'ALL'`
        );
      }
    } catch (e) {}

    try {
      const [colTargetUserIds] = await promiseDb.query(
        `SHOW COLUMNS FROM announcements LIKE 'target_user_ids'`
      );
      if (!colTargetUserIds || colTargetUserIds.length === 0) {
        await promiseDb.query(
          `ALTER TABLE announcements ADD COLUMN target_user_ids TEXT DEFAULT NULL`
        );
      }
    } catch (e) {}

    isServerSchemaEnsured = true;
  } catch (err) {
    console.warn("Auto-ensure Server announcements schema notice:", err.message);
  }
};

// =========================================================
// GET ACTIVE UNREAD ANNOUNCEMENT FOR USER
// =========================================================
const getActiveAnnouncementController = async (req, res) => {
  try {
    const userId = Number(req.query.user_id || req.user?.id);

    if (!userId || userId <= 0) {
      // If no user ID provided (e.g. before login), don't show popup
      return res.status(200).json({
        success: true,
        has_announcement: false,
        announcement: null,
      });
    }

    if (!isServerSchemaEnsured) {
      await ensureServerSchema();
    }

    // Find latest active announcement that this user hasn't read yet
    // targeted to ALL users OR specifically to this user
    const [rows] = await promiseDb.query(
      `
      SELECT 
        a.id,
        a.title,
        a.description,
        a.type,
        a.created_at
      FROM announcements a
      WHERE a.is_active = 1
        AND (
          a.target_type = 'ALL' 
          OR a.target_type IS NULL
          OR EXISTS (
            SELECT 1 FROM announcement_recipients ar2 
            WHERE ar2.announcement_id = a.id AND ar2.user_id = ?
          )
        )
        AND a.id NOT IN (
          SELECT announcement_id 
          FROM announcement_reads 
          WHERE user_id = ?
        )
      ORDER BY a.created_at DESC
      LIMIT 1
      `,
      [userId, userId]
    );

    if (!rows || rows.length === 0) {
      return res.status(200).json({
        success: true,
        has_announcement: false,
        announcement: null,
      });
    }

    return res.status(200).json({
      success: true,
      has_announcement: true,
      announcement: rows[0],
    });
  } catch (error) {
    console.error("Get active announcement primary error:", error.message);

    // Auto-heal & fallback query
    try {
      await ensureServerSchema();
      const userId = Number(req.query.user_id || req.user?.id);
      if (!userId || userId <= 0) {
        return res.status(200).json({ success: true, has_announcement: false, announcement: null });
      }

      const [fallbackRows] = await promiseDb.query(
        `
        SELECT a.id, a.title, a.description, a.type, a.created_at
        FROM announcements a
        WHERE a.is_active = 1
          AND a.id NOT IN (
            SELECT announcement_id 
            FROM announcement_reads 
            WHERE user_id = ?
          )
        ORDER BY a.created_at DESC
        LIMIT 1
        `,
        [userId]
      );

      return res.status(200).json({
        success: true,
        has_announcement: Boolean(fallbackRows && fallbackRows.length > 0),
        announcement: fallbackRows && fallbackRows.length > 0 ? fallbackRows[0] : null,
      });
    } catch (fallbackError) {
      console.error("Get active announcement fallback error:", fallbackError.message);
      return res.status(200).json({
        success: true,
        has_announcement: false,
        announcement: null,
      });
    }
  }
};

// =========================================================
// DISMISS / MARK ANNOUNCEMENT AS READ
// =========================================================
const dismissAnnouncementController = async (req, res) => {
  try {
    const userId = Number(req.body.user_id || req.user?.id);
    const announcementId = Number(req.body.announcement_id);

    if (!userId || userId <= 0 || !announcementId || announcementId <= 0) {
      return res.status(400).json({
        success: false,
        message: "user_id and announcement_id are required",
      });
    }

    if (!isServerSchemaEnsured) {
      await ensureServerSchema();
    }

    await promiseDb.query(
      `
      INSERT INTO announcement_reads (user_id, announcement_id, read_at)
      VALUES (?, ?, NOW())
      ON DUPLICATE KEY UPDATE read_at = NOW()
      `,
      [userId, announcementId]
    );

    return res.status(200).json({
      success: true,
      message: "Announcement dismissed successfully",
    });
  } catch (error) {
    console.error("Dismiss announcement error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to dismiss announcement",
      error: error.message,
    });
  }
};

module.exports = {
  getActiveAnnouncementController,
  dismissAnnouncementController,
};
