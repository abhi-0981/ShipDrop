const db = require("./db");

/**
 * Automatically and idempotently ensures all required tables for
 * secure impersonation sessions and audit logs exist in MySQL.
 */
async function ensureTables() {
  try {
    // 0. Ensure user_sessions table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        session_id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        expires_at DATETIME NOT NULL,
        revoked_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_sessions_user_id (user_id),
        INDEX idx_user_sessions_expiry (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 1. Audit log table
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_impersonation_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT NOT NULL,
        admin_username VARCHAR(100) NOT NULL,
        target_user_id INT NOT NULL,
        target_user_name VARCHAR(255) NULL,
        target_user_email VARCHAR(255) NULL,
        session_id VARCHAR(64) NOT NULL,
        reason VARCHAR(255) DEFAULT 'Customer Support / Troubleshooting',
        status ENUM('ACTIVE', 'ENDED', 'EXPIRED') DEFAULT 'ACTIVE',
        ip_address VARCHAR(45) NULL,
        user_agent TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL,
        ended_at TIMESTAMP NULL,
        INDEX idx_impersonation_session (session_id),
        INDEX idx_impersonation_target (target_user_id),
        INDEX idx_impersonation_admin (admin_id),
        INDEX idx_impersonation_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Single-use exchange tickets table
    await db.query(`
      CREATE TABLE IF NOT EXISTS impersonation_tickets (
        ticket_id VARCHAR(64) PRIMARY KEY,
        admin_id INT NOT NULL,
        admin_username VARCHAR(100) NOT NULL,
        target_user_id INT NOT NULL,
        session_id VARCHAR(64) NOT NULL,
        user_token TEXT NOT NULL,
        user_data TEXT NOT NULL,
        admin_return_url VARCHAR(255) NOT NULL,
        used TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        INDEX idx_ticket_expiry (expires_at, used)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Ensure announcements table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'INFO',
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_announcements_active (is_active),
        INDEX idx_announcements_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Ensure announcement_reads table exists
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

    // Ensure target_type & target_user_ids exist on announcements table
    try {
      await db.query(`
        ALTER TABLE announcements 
        ADD COLUMN target_type VARCHAR(20) DEFAULT 'ALL' AFTER type
      `);
    } catch (colErr) {
      // Column may already exist
    }
    try {
      await db.query(`
        ALTER TABLE announcements 
        ADD COLUMN target_user_ids LONGTEXT NULL AFTER target_type
      `);
    } catch (colErr) {
      // Column may already exist
    }

    console.log("AdminPanel: Impersonation audit, tickets, and announcements tables verified successfully.");
  } catch (error) {
    console.warn("AdminPanel ensureTables notice:", error.message);
  }
}

module.exports = { ensureTables };
