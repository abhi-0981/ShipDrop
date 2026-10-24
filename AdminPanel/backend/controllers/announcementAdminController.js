const db = require("../config/db");

// =========================================================
// GET ALL ANNOUNCEMENTS (with read count)
// =========================================================
const getAnnouncementsController = async (req, res) => {
  try {
    const [rows] = await db.query(`
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
      announcements: rows || [],
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
// CREATE NEW ANNOUNCEMENT (Broadcast to all users)
// =========================================================
const createAnnouncementController = async (req, res) => {
  try {
    const { title, description, type = "INFO", is_active = 1 } = req.body;

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

    const [result] = await db.query(
      `
      INSERT INTO announcements (title, description, type, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
      `,
      [cleanTitle, cleanDesc, cleanType, activeFlag]
    );

    const [newRow] = await db.query(
      `SELECT * FROM announcements WHERE id = ? LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: "Announcement broadcasted successfully to all users",
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
