const db = require("../config/db");

const promiseDb = db.promise();

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

    // Find the latest active announcement that this user hasn't read yet
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
    console.error("Get active announcement error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch active announcement",
      error: error.message,
    });
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
