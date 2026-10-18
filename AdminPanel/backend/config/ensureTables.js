const db = require("./db");

/**
 * Automatically and idempotently ensures all required tables for
 * secure impersonation sessions and audit logs exist in MySQL.
 */
async function ensureTables() {
  try {
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

    console.log("AdminPanel: Impersonation audit and ticket tables verified successfully.");
  } catch (error) {
    console.warn("AdminPanel ensureTables notice:", error.message);
  }
}

module.exports = { ensureTables };
