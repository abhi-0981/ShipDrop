const db = require("../config/db");

const promiseDb = db.promise();

// Helper to ensure notifications table & message_count column exist safely
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
        message_count INT DEFAULT 1,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notifications_user_read (user_id, is_read),
        INDEX idx_notifications_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure message_count column exists
    const [colRows] = await promiseDb.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'message_count'`
    );
    if (!colRows || colRows.length === 0) {
      await promiseDb.query(`ALTER TABLE notifications ADD COLUMN message_count INT DEFAULT 1`);
    }

    // Modernize any legacy notification messages to clean, professional English
    await promiseDb.query(`
      UPDATE notifications 
      SET message = 'Shipment marked as NDR / Undelivered. Delivery attempt was unsuccessful.'
      WHERE type = 'NDR_ALERT' AND (message LIKE '%ho gaya%' OR message LIKE '%unsuccessful raha%')
    `);
    await promiseDb.query(`
      UPDATE notifications 
      SET message = 'Your wallet balance is low. Please recharge your wallet to avoid fulfillment disruptions.'
      WHERE type = 'WALLET' AND (message LIKE '%bacha hai%' OR message LIKE '%recharge karein%')
    `);
  } catch (err) {
    console.warn("ensureNotificationTable notice:", err.message);
  }
};

/**
 * Auto-sync & aggregate ticket replies:
 * 1. Consolidates multiple unread notifications for the same ticket into 1 notification card with message_count.
 * 2. Syncs any missing admin replies from ticket_messages.
 */
const syncMissedTicketReplies = async (userId) => {
  try {
    // A. Consolidate any duplicate unread notifications for the same ticket
    const [dupes] = await promiseDb.query(
      `
      SELECT reference_id, COUNT(*) AS cnt, MAX(id) AS max_id 
      FROM notifications 
      WHERE user_id = ? AND type = 'TICKET_REPLY' AND is_read = 0 
      GROUP BY reference_id 
      HAVING cnt > 1
      `,
      [userId]
    );

    if (dupes && dupes.length > 0) {
      for (const d of dupes) {
        // Keep the latest notification and set its count
        await promiseDb.query(
          `UPDATE notifications SET message_count = ? WHERE id = ?`,
          [d.cnt, d.max_id]
        );
        // Delete older duplicate unread notifications for this ticket
        await promiseDb.query(
          `DELETE FROM notifications WHERE user_id = ? AND type = 'TICKET_REPLY' AND reference_id = ? AND is_read = 0 AND id < ?`,
          [userId, d.reference_id, d.max_id]
        );
      }
    }

    // B. Check if there are any unread admin messages from ticket_messages not recorded yet
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
          INSERT INTO notifications (user_id, type, title, message, reference_id, reference_url, message_count, is_read, created_at)
          VALUES (?, 'TICKET_REPLY', ?, ?, ?, ?, 1, 0, ?)
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
 * Auto-sync NDR / Pending Alerts:
 * Informs the merchant when a shipment has gone into NDR / Pending status.
 * (Simple informational alert without re-attempt button, navigates to /pending)
 */
const syncNdrAlerts = async (userId) => {
  try {
    const [orders] = await promiseDb.query(
      `
      SELECT id, order_id, awb, status, tracking_status, created_at
      FROM orders
      WHERE user_id = ?
        AND (
          UPPER(TRIM(COALESCE(status, ''))) IN ('PENDING', 'NDR', 'UNDELIVERED')
          OR UPPER(TRIM(COALESCE(tracking_status, ''))) IN ('PENDING', 'NDR', 'UNDELIVERED')
        )
        AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
      ORDER BY id DESC
      LIMIT 10
      `,
      [userId]
    );

    if (orders && orders.length > 0) {
      for (const o of orders) {
        const refId = `NDR_${o.id}`;
        const [existing] = await promiseDb.query(
          `SELECT 1 FROM notifications WHERE user_id = ? AND type = 'NDR_ALERT' AND reference_id = ? LIMIT 1`,
          [userId, refId]
        );

        if (!existing || existing.length === 0) {
          const parcelLabel = o.awb ? `AWB: ${o.awb}` : `Order #${o.order_id}`;
          await promiseDb.query(
            `
            INSERT INTO notifications (user_id, type, title, message, reference_id, reference_url, message_count, is_read, created_at)
            VALUES (?, 'NDR_ALERT', ?, ?, ?, '/pending', 1, 0, NOW())
            `,
            [
              userId,
              `NDR / Pending: Order #${o.order_id}`,
              `Shipment (${parcelLabel}) marked as NDR / Undelivered. Delivery attempt was unsuccessful.`,
              refId,
            ]
          );
        }
      }
    }
  } catch (err) {
    console.warn("syncNdrAlerts notice:", err.message);
  }
};

/**
 * Auto-sync Wallet Alerts:
 * 1. Low wallet balance alert (if balance < ₹200)
 * 2. Recent successful recharge credit alert
 */
const syncWalletAlerts = async (userId) => {
  try {
    // 1. Check current balance
    const [wallets] = await promiseDb.query(
      `SELECT balance FROM wallets WHERE user_id = ? LIMIT 1`,
      [userId]
    );

    if (wallets && wallets.length > 0) {
      const balance = Number(wallets[0].balance || 0);
      if (balance < 200) {
        const [existingLow] = await promiseDb.query(
          `SELECT 1 FROM notifications WHERE user_id = ? AND type = 'WALLET' AND reference_id = 'LOW_WALLET_BALANCE' AND is_read = 0 LIMIT 1`,
          [userId]
        );

        if (!existingLow || existingLow.length === 0) {
          await promiseDb.query(
            `
            INSERT INTO notifications (user_id, type, title, message, reference_id, reference_url, message_count, is_read, created_at)
            VALUES (?, 'WALLET', ?, ?, 'LOW_WALLET_BALANCE', '/wallet', 1, 0, NOW())
            `,
            [
              userId,
              "Low Wallet Balance Alert",
              `Your wallet balance is ₹${balance.toFixed(2)}. Please recharge your wallet to avoid fulfillment disruptions.`,
            ]
          );
        }
      } else {
        // If balance is now healthy (>= ₹200), auto-resolve/dismiss any unread low balance alert
        await promiseDb.query(
          `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND type = 'WALLET' AND reference_id = 'LOW_WALLET_BALANCE' AND is_read = 0`,
          [userId]
        );
      }
    }

    // 2. Check recent successful recharge transactions (type is 'RECHARGE' or 'CREDIT')
    const [txRows] = await promiseDb.query(
      `
      SELECT id, amount, created_at
      FROM wallet_transactions
      WHERE user_id = ?
        AND UPPER(TRIM(type)) IN ('RECHARGE', 'CREDIT')
        AND UPPER(TRIM(COALESCE(status, ''))) IN ('SUCCESS', 'COMPLETED')
        AND created_at >= DATE_SUB(NOW(), INTERVAL 5 DAY)
      ORDER BY id DESC
      LIMIT 5
      `,
      [userId]
    );

    if (txRows && txRows.length > 0) {
      for (const tx of txRows) {
        const refId = `WALLET_TX_${tx.id}`;
        const [existingTx] = await promiseDb.query(
          `SELECT 1 FROM notifications WHERE user_id = ? AND type = 'WALLET' AND reference_id = ? LIMIT 1`,
          [userId, refId]
        );

        if (!existingTx || existingTx.length === 0) {
          await promiseDb.query(
            `
            INSERT INTO notifications (user_id, type, title, message, reference_id, reference_url, message_count, is_read, created_at)
            VALUES (?, 'WALLET', ?, ?, ?, '/wallet', 1, 0, ?)
            `,
            [
              userId,
              `Wallet Credited: ₹${Number(tx.amount).toFixed(2)}`,
              `₹${Number(tx.amount).toFixed(2)} has been successfully credited to your wallet.`,
              refId,
              tx.created_at || new Date(),
            ]
          );
        }
      }
    }
  } catch (err) {
    console.warn("syncWalletAlerts notice:", err.message);
  }
};

/**
 * Auto-sync COD Remittance Payout Alerts:
 * Alerts the merchant when COD collected funds have been processed to their bank.
 */
const syncCodRemittanceAlerts = async (userId) => {
  try {
    const [tableCheck] = await promiseDb.query(`SHOW TABLES LIKE 'cod_remittances'`);
    if (!tableCheck || tableCheck.length === 0) return;

    const [remittances] = await promiseDb.query(
      `
      SELECT id, cod_amount, status, transferred_on, description, created_at
      FROM cod_remittances
      WHERE user_id = ?
        AND UPPER(TRIM(COALESCE(status, ''))) IN ('PAID', 'TRANSFERRED', 'COMPLETED')
        AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
      ORDER BY id DESC
      LIMIT 5
      `,
      [userId]
    );

    if (remittances && remittances.length > 0) {
      for (const r of remittances) {
        const refId = `REMITTANCE_${r.id}`;
        const [existing] = await promiseDb.query(
          `SELECT 1 FROM notifications WHERE user_id = ? AND type = 'COD_REMITTANCE' AND reference_id = ? LIMIT 1`,
          [userId, refId]
        );

        if (!existing || existing.length === 0) {
          const amt = Number(r.cod_amount || 0).toFixed(2);
          await promiseDb.query(
            `
            INSERT INTO notifications (user_id, type, title, message, reference_id, reference_url, message_count, is_read, created_at)
            VALUES (?, 'COD_REMITTANCE', ?, ?, ?, '/cod-remittance', 1, 0, ?)
            `,
            [
              userId,
              `COD Remittance Processed: ₹${amt}`,
              `₹${amt} has been successfully transferred to your registered bank account.${r.description ? ` (${r.description})` : ""}`,
              refId,
              r.transferred_on || r.created_at || new Date(),
            ]
          );
        }
      }
    }
  } catch (err) {
    console.warn("syncCodRemittanceAlerts notice:", err.message);
  }
};

/**
 * Auto-sync Weight Discrepancy Alerts:
 * Informs the merchant when a carrier has claimed extra weight or when a dispute is resolved.
 */
const syncWeightDiscrepancyAlerts = async (userId) => {
  try {
    const [tableCheck] = await promiseDb.query(`SHOW TABLES LIKE 'weight_checkings'`);
    if (!tableCheck || tableCheck.length === 0) return;

    const [discrepancies] = await promiseDb.query(
      `
      SELECT id, awb, order_id, weight_difference, extra_charge, status, created_at, settled_at
      FROM weight_checkings
      WHERE user_id = ?
        AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
      ORDER BY id DESC
      LIMIT 5
      `,
      [userId]
    );

    if (discrepancies && discrepancies.length > 0) {
      for (const d of discrepancies) {
        const isSettled = String(d.status || "").toLowerCase() === "settled";
        const isWaived = String(d.status || "").toLowerCase() === "waived";
        const refId = isSettled || isWaived ? `WEIGHT_RESOLVED_${d.id}` : `WEIGHT_FLAG_${d.id}`;

        const [existing] = await promiseDb.query(
          `SELECT 1 FROM notifications WHERE user_id = ? AND type = 'WEIGHT_DISCREPANCY' AND reference_id = ? LIMIT 1`,
          [userId, refId]
        );

        if (!existing || existing.length === 0) {
          let title = `Weight Discrepancy: AWB ${d.awb}`;
          let msg = `Courier flagged +${Number(d.weight_difference || 0).toFixed(2)} kg excess weight on AWB ${d.awb} (Extra Debit: ₹${Number(d.extra_charge || 0).toFixed(2)}).`;

          if (isSettled) {
            title = `Dispute Resolved: AWB ${d.awb}`;
            msg = `Weight discrepancy dispute for AWB ${d.awb} has been resolved in your favor.`;
          } else if (isWaived) {
            title = `Charge Waived: AWB ${d.awb}`;
            msg = `Excess weight charges for AWB ${d.awb} have been waived and adjusted.`;
          }

          await promiseDb.query(
            `
            INSERT INTO notifications (user_id, type, title, message, reference_id, reference_url, message_count, is_read, created_at)
            VALUES (?, 'WEIGHT_DISCREPANCY', ?, ?, ?, '/reports/weight-discrepancy', 1, 0, ?)
            `,
            [
              userId,
              title,
              msg,
              refId,
              isSettled || isWaived ? (d.settled_at || new Date()) : (d.created_at || new Date()),
            ]
          );
        }
      }
    }
  } catch (err) {
    console.warn("syncWeightDiscrepancyAlerts notice:", err.message);
  }
};

/**
 * GET /api/notifications
 * Fetch UNREAD notifications (Box clears once read)
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

    // Auto-sync notifications across all core modules
    await Promise.allSettled([
      syncMissedTicketReplies(userId),
      syncNdrAlerts(userId),
      syncWalletAlerts(userId),
      syncCodRemittanceAlerts(userId),
      syncWeightDiscrepancyAlerts(userId),
    ]);

    // Fetch ONLY UNREAD notifications so the box clears once read
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
        COALESCE(message_count, 1) AS message_count,
        is_read, 
        created_at
      FROM notifications
      WHERE user_id = ? AND is_read = 0
      ORDER BY id DESC
      LIMIT 30
      `,
      [userId]
    );

    const list = Array.isArray(notifications) ? notifications : [];

    return res.status(200).json({
      success: true,
      unread_count: list.length,
      notifications: list,
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

    // Return updated unread count (should be 0 if markAll or decremented)
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
