const db = require("../config/db");

// =========================================================
// GET ALL ANNOUNCEMENTS (with read count & target details)
// =========================================================
const getAnnouncementsController = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        a.id,
        a.title,
        a.description,
        a.type,
        a.target_type,
        a.target_user_ids,
        a.is_active,
        a.created_at,
        a.updated_at,
        COUNT(ar.id) AS read_count
      FROM announcements a
      LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `);

    // Parse target_user_ids if JSON string
    const parsedRows = (rows || []).map((row) => {
      let userIds = [];
      if (row.target_type === "SPECIFIC" && row.target_user_ids) {
        try {
          userIds = typeof row.target_user_ids === "string"
            ? JSON.parse(row.target_user_ids)
            : row.target_user_ids;
        } catch {
          userIds = [];
        }
      }
      return {
        ...row,
        target_type: row.target_type || "ALL",
        target_user_ids: userIds,
      };
    });

    return res.status(200).json({
      success: true,
      announcements: parsedRows,
    });
  } catch (error) {
    console.error("Admin get announcements error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch announcements",
      error: error.message,
    });
  }
};

// =========================================================
// CREATE NEW ANNOUNCEMENT (Broadcast to All or Specific Users)
// =========================================================
const createAnnouncementController = async (req, res) => {
  try {
    const {
      title,
      description,
      type = "INFO",
      target_type = "ALL",
      target_user_ids = [],
      is_active = 1,
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

    let cleanTargetType = target_type === "SPECIFIC" ? "SPECIFIC" : "ALL";
    let cleanTargetUserIds = null;

    if (cleanTargetType === "SPECIFIC") {
      const ids = Array.isArray(target_user_ids)
        ? target_user_ids.map(Number).filter((id) => Number.isInteger(id) && id > 0)
        : [];

      if (ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please select at least one user when choosing Specific Users",
        });
      }
      cleanTargetUserIds = JSON.stringify(ids);
    }

    const [result] = await db.query(
      `
      INSERT INTO announcements (title, description, type, target_type, target_user_ids, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [cleanTitle, cleanDesc, cleanType, cleanTargetType, cleanTargetUserIds, activeFlag]
    );

    const [newRow] = await db.query(
      `SELECT * FROM announcements WHERE id = ? LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message:
        cleanTargetType === "SPECIFIC"
          ? "Notice sent successfully to selected users"
          : "Announcement broadcasted successfully to all users",
      announcement: newRow[0],
    });
  } catch (error) {
    console.error("Admin create announcement error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create announcement",
      error: error.message,
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

    // Delete reads first
    await db.query(`DELETE FROM announcement_reads WHERE announcement_id = ?`, [id]);
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
