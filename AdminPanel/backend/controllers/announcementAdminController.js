const db = require("../config/db");

let isSchemaEnsured = false;

// Auto-heal / Ensure tables & columns exist even if server wasn't restarted
const ensureSchema = async () => {
  try {
    await db.query(`
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

    await db.query(`
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

    await db.query(`
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
      const [colTargetType] = await db.query(
        `SHOW COLUMNS FROM announcements LIKE 'target_type'`
      );
      if (!colTargetType || colTargetType.length === 0) {
        await db.query(
          `ALTER TABLE announcements ADD COLUMN target_type VARCHAR(20) DEFAULT 'ALL'`
        );
      }
    } catch (e) {
      // ignore
    }

    try {
      const [colTargetUserIds] = await db.query(
        `SHOW COLUMNS FROM announcements LIKE 'target_user_ids'`
      );
      if (!colTargetUserIds || colTargetUserIds.length === 0) {
        await db.query(
          `ALTER TABLE announcements ADD COLUMN target_user_ids TEXT DEFAULT NULL`
        );
      }
    } catch (e) {
      // ignore
    }

    isSchemaEnsured = true;
  } catch (err) {
    console.warn("Auto-ensure announcements schema notice:", err.message);
  }
};

// =========================================================
// GET ALL ANNOUNCEMENTS (with read count & target info)
// =========================================================
const getAnnouncementsController = async (req, res) => {
  try {
    if (!isSchemaEnsured) {
      await ensureSchema();
    }

    const [rows] = await db.query(`
      SELECT 
        a.id,
        a.title,
        a.description,
        a.type,
        COALESCE(a.target_type, 'ALL') AS target_type,
        a.target_user_ids,
        a.is_active,
        a.created_at,
        a.updated_at,
        COUNT(DISTINCT ar.id) AS read_count,
        COUNT(DISTINCT rec.user_id) AS recipient_count
      FROM announcements a
      LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id
      LEFT JOIN announcement_recipients rec ON a.id = rec.announcement_id
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `);

    return res.status(200).json({
      success: true,
      announcements: rows || [],
    });
  } catch (error) {
    console.error("Admin get announcements primary error:", error.message);

    // Auto-heal retry on error
    try {
      await ensureSchema();

      const [fallbackRows] = await db.query(`
        SELECT 
          a.id,
          a.title,
          a.description,
          a.type,
          a.is_active,
          a.created_at,
          a.updated_at,
          COUNT(ar.id) AS read_count
        FROM announcements a
        LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id
        GROUP BY a.id
        ORDER BY a.created_at DESC
      `);

      return res.status(200).json({
        success: true,
        announcements: fallbackRows || [],
      });
    } catch (fallbackError) {
      console.error("Admin get announcements fallback error:", fallbackError.message);
      return res.status(500).json({
        success: false,
        message: fallbackError.message || "Failed to fetch announcements",
      });
    }
  }
};

// =========================================================
// CREATE NEW ANNOUNCEMENT (Broadcast to all or specific users)
// =========================================================
const createAnnouncementController = async (req, res) => {
  try {
    if (!isSchemaEnsured) {
      await ensureSchema();
    }

    const {
      title,
      description,
      type = "INFO",
      is_active = 1,
      target_type = "ALL",
      target_user_ids = [],
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (!description || !String(description).trim()) {
      return res.status(400).json({
        success: false,
        message: "Description is required",
      });
    }

    const cleanTitle = String(title).trim();
    const cleanDesc = String(description).trim();
    const cleanType = ["INFO", "ALERT", "WARNING", "UPDATE"].includes(
      String(type).toUpperCase()
    )
      ? String(type).toUpperCase()
      : "INFO";
    const activeFlag = is_active ? 1 : 0;

    const isSpecific = String(target_type).toUpperCase() === "SPECIFIC";
    let targetUserIdsList = [];

    if (isSpecific) {
      if (!Array.isArray(target_user_ids) || target_user_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please select at least one user for specific notice delivery",
        });
      }

      targetUserIdsList = [
        ...new Set(
          target_user_ids
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id) && id > 0)
        ),
      ];

      if (targetUserIdsList.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid user selection. Please select valid registered users.",
        });
      }
    }

    const cleanTargetType = isSpecific ? "SPECIFIC" : "ALL";
    const targetUserIdsJson = isSpecific ? JSON.stringify(targetUserIdsList) : null;

    const [result] = await db.query(
      `
      INSERT INTO announcements (title, description, type, target_type, target_user_ids, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [cleanTitle, cleanDesc, cleanType, cleanTargetType, targetUserIdsJson, activeFlag]
    );

    const announcementId = result.insertId;

    // If specific users, insert into announcement_recipients
    if (isSpecific && targetUserIdsList.length > 0) {
      const recipientValues = targetUserIdsList.map((uid) => [announcementId, uid]);
      await db.query(
        `
        INSERT IGNORE INTO announcement_recipients (announcement_id, user_id)
        VALUES ?
        `,
        [recipientValues]
      );
    }

    const [newRow] = await db.query(
      `SELECT * FROM announcements WHERE id = ? LIMIT 1`,
      [announcementId]
    );

    return res.status(201).json({
      success: true,
      message: isSpecific
        ? `Announcement sent to ${targetUserIdsList.length} selected user(s) successfully`
        : "Announcement broadcasted successfully to all users",
      announcement: newRow[0],
    });
  } catch (error) {
    console.error("Admin create announcement error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create announcement",
    });
  }
};

// =========================================================
// TOGGLE ACTIVE STATUS
// =========================================================
const toggleAnnouncementStatusController = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const [rows] = await db.query(
      `SELECT id, is_active FROM announcements WHERE id = ? LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    const newStatus = rows[0].is_active ? 0 : 1;

    await db.query(
      `UPDATE announcements SET is_active = ?, updated_at = NOW() WHERE id = ?`,
      [newStatus, id]
    );

    return res.status(200).json({
      success: true,
      message: newStatus ? "Announcement activated" : "Announcement deactivated",
      is_active: newStatus,
    });
  } catch (error) {
    console.error("Admin toggle announcement status error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update status",
      error: error.message,
    });
  }
};

// =========================================================
// DELETE ANNOUNCEMENT
// =========================================================
const deleteAnnouncementController = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    // Delete recipients and reads first (safely ignoring errors if table doesn't exist)
    try {
      await db.query(`DELETE FROM announcement_reads WHERE announcement_id = ?`, [id]);
    } catch (e) {}

    try {
      await db.query(`DELETE FROM announcement_recipients WHERE announcement_id = ?`, [id]);
    } catch (e) {}

    // Delete announcement
    await db.query(`DELETE FROM announcements WHERE id = ?`, [id]);

    return res.status(200).json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    console.error("Admin delete announcement error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete announcement",
      error: error.message,
    });
  }
};

module.exports = {
  getAnnouncementsController,
  createAnnouncementController,
  toggleAnnouncementStatusController,
  deleteAnnouncementController,
};
