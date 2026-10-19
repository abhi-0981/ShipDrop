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

    // 3. Persistent Pincode Cache Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS pincode_cache (
        pincode VARCHAR(10) PRIMARY KEY,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        region VARCHAR(100) NULL,
        district VARCHAR(100) NULL,
        country VARCHAR(50) DEFAULT 'india',
        lat DECIMAL(10, 7) NULL,
        lon DECIMAL(10, 7) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_pincode_cache_city (city),
        INDEX idx_pincode_cache_state (state)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Persistent Pincode Distance Cache Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS pincode_distances (
        distance_key VARCHAR(25) PRIMARY KEY,
        pickup_pincode VARCHAR(10) NOT NULL,
        delivery_pincode VARCHAR(10) NOT NULL,
        distance_km DECIMAL(10, 2) NOT NULL,
        source VARCHAR(20) DEFAULT 'OSRM',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pincode_dist_pickup_delivery (pickup_pincode, delivery_pincode)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("AdminPanel: Database tables (sessions, audit, tickets, pincode cache) verified successfully.");
  } catch (error) {
    console.warn("AdminPanel ensureTables notice:", error.message);
  }
}

module.exports = { ensureTables };
