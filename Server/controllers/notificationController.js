const db = require("../config/db");

const promiseDb = db.promise();

// Helper to ensure notifications table exists safely
const ensureNotificationTable = async () => {
  try {
    await promiseDb.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'TICKET_REPLY',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        reference_id VARCHAR(100) NULL,
        reference_url VARCHAR(255) NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notifications_user_read (user_id, is_read),
        INDEX idx_notifications_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch (err) {
    console.warn("ensureNotificationTable notice:", err.message);
  }
};

/**
 * Auto-sync missed admin replies from ticket_messages into notifications table
 * This guarantees zero missed notifications even if sent directly in DB or before table creation.
 */
const syncMissedTicketReplies = async (userId) => {
  try {
    const [missed] = await promiseDb.query(
      `
      SELECT 
        tm.id AS message_id, 
        tm.ticket_id, 
        tm.message, 
        tm.created_at, 
        t.ticket_number
      FROM ticket_messages tm
      JOIN tickets t ON tm.ticket_id = t.id
      WHERE t.user_id = ? 
        AND tm.sender_type = 'ADMIN'
        AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.user_id = ? 
            AND n.type = 'TICKET_REPLY' 
            AND n.reference_id = CAST(t.id AS CHAR)
            AND n.created_at >= tm.created_at - INTERVAL 3 SECOND
        )
      ORDER BY tm.id DESC
      LIMIT 10
      `,
      [userId, userId]
    );

    if (missed && missed.length > 0) {
      for (const item of missed) {
        const snippet = String(item.message || "").trim().slice(0, 160);
        await promiseDb.query(
          `
          INSERT INTO notifications (user_id, type, title, message, reference_id, reference_url, is_read, created_at)
          VALUES (?, 'TICKET_REPLY', ?, ?, ?, ?, 0, ?)
          `,
          [
            userId,
            `Support replied to Ticket #${item.ticket_number}`,
            snippet,
            String(item.ticket_id),
            `/tickets?ticket_id=${item.ticket_id}`,
            item.created_at,
          ]
        );
      }
    }
  } catch (err) {
    console.warn("syncMissedTicketReplies warning:", err.message);
  }
};

/**
 * GET /api/notifications
 * Fetch unread count & recent notifications list
 */
const getNotificationsController = async (req, res) => {
  try {
    await ensureNotificationTable();

    const userId = Number(req.user?.id || req.query.user_id);
    if (!userId || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required",
      });
    }

    // Auto-sync any un-notified admin replies
    await syncMissedTicketReplies(userId);

    // 1. Get Unread Count (indexed query - lightning fast)
    const [countRows] = await promiseDb.query(
      `SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    const unreadCount = Number(countRows[0]?.unread_count || 0);

    // 2. Get Top 20 Recent Notifications
    const [notifications] = await promiseDb.query(
      `
      SELECT 
        id, 
        user_id, 
        type, 
        title, 
        message, 
        reference_id, 
        reference_url, 
        is_read, 
        created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 20
      `,
      [userId]
    );

    return res.status(200).json({
      success: true,
      unread_count: unreadCount,
      notifications: Array.isArray(notifications) ? notifications : [],
    });
  } catch (error) {
    console.error("getNotificationsController error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load notifications",
      unread_count: 0,
      notifications: [],
    });
  }
};

/**
 * POST /api/notifications/mark-read
 * Mark a single notification or all notifications as read
 */
const markReadController = async (req, res) => {
  try {
    await ensureNotificationTable();

    const userId = Number(req.user?.id || req.body?.user_id || req.query.user_id);
    const notificationId = req.body?.notification_id ? Number(req.body.notification_id) : null;
    const markAll = Boolean(req.body?.mark_all);

    if (!userId || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required",
      });
    }

    if (markAll) {
      await promiseDb.query(
        `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`,
        [userId]
      );
    } else if (notificationId && notificationId > 0) {
      await promiseDb.query(
        `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
        [notificationId, userId]
      );
    }

    // Return updated unread count
    const [countRows] = await promiseDb.query(
      `SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: "Notification updated",
      unread_count: Number(countRows[0]?.unread_count || 0),
    });
  } catch (error) {
    console.error("markReadController error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update notification",
    });
  }
};

module.exports = {
  getNotificationsController,
  markReadController,
};
