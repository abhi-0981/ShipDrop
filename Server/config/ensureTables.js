const db = require("./db");

/**
 * Automatically and idempotently ensures all required tables for
 * secure impersonation sessions and audit logs exist in MySQL.
 */
async function ensureTables() {
  try {
    const promiseDb = db.promise();

    // 0. Ensure user_sessions table exists
    await promiseDb.query(`
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
    await promiseDb.query(`
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
    await promiseDb.query(`
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

    // 3. Party identities table
    await promiseDb.query(`
      CREATE TABLE IF NOT EXISTS party_identities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(150) NOT NULL,
        reference_name VARCHAR(150) NULL,
        company_name VARCHAR(255) NULL,
        gst_no VARCHAR(50) NULL,
        phone_no VARCHAR(25) NULL,
        address TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_party_name (user_id, name),
        INDEX idx_party_identities_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure columns exist if table was previously created with only (id, user_id, name)
    const partyColumns = [
      { name: "reference_name", type: "VARCHAR(150) NULL AFTER name" },
      { name: "company_name", type: "VARCHAR(255) NULL AFTER reference_name" },
      { name: "gst_no", type: "VARCHAR(50) NULL AFTER company_name" },
      { name: "phone_no", type: "VARCHAR(25) NULL AFTER gst_no" },
      { name: "address", type: "TEXT NULL AFTER phone_no" },
    ];

    for (const col of partyColumns) {
      try {
        const [existing] = await promiseDb.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'party_identities' AND COLUMN_NAME = ?`,
          [col.name]
        );
        if (!existing || existing.length === 0) {
          await promiseDb.query(
            `ALTER TABLE party_identities ADD COLUMN ${col.name} ${col.type}`
          );
          console.log(`Added column ${col.name} to party_identities.`);
        }
      } catch (colErr) {
        console.warn(`Column check/add notice for ${col.name}:`, colErr.message);
      }
    }

    // 4. Manual carrier order support on orders table
    // Ensure order_id is nullable for manual carrier orders
    try {
      await promiseDb.query(
        "ALTER TABLE orders MODIFY COLUMN order_id VARCHAR(50) NULL DEFAULT NULL"
      );
    } catch (orderIdErr) {
      console.warn("Notice modifying orders.order_id to NULL:", orderIdErr.message);
    }

    // Ensure status is VARCHAR(50) so 'Booked' and other dynamic statuses are accepted without truncation
    try {
      await promiseDb.query(
        "ALTER TABLE orders MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Processing'"
      );
      console.log("Modified orders.status to VARCHAR(50) successfully.");
    } catch (statusErr) {
      console.warn("Notice modifying orders.status to VARCHAR(50):", statusErr.message);
    }

    const orderCarrierColumns = [
      { name: "carrier", type: "VARCHAR(50) NOT NULL DEFAULT 'Delivery'" },
      { name: "consignment_no", type: "VARCHAR(100) NULL DEFAULT NULL" },
      { name: "package_type", type: "VARCHAR(50) NULL DEFAULT NULL" },
      { name: "manual_amount_including_gst", type: "DECIMAL(10, 2) NULL DEFAULT NULL" },
      { name: "shipping_mode", type: "VARCHAR(50) NULL DEFAULT NULL" },
    ];

    for (const col of orderCarrierColumns) {
      try {
        const [existing] = await promiseDb.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = ?`,
          [col.name]
        );
        if (!existing || existing.length === 0) {
          await promiseDb.query(
            `ALTER TABLE orders ADD COLUMN ${col.name} ${col.type}`
          );
          console.log(`Added column ${col.name} to orders.`);
        }
      } catch (colErr) {
        console.warn(`Column check/add notice for orders.${col.name}:`, colErr.message);
      }
    }

    // 4. Ensure offline_orders table exists
    await promiseDb.query(`
      CREATE TABLE IF NOT EXISTS offline_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        party_identity_id INT NULL,
        carrier VARCHAR(100) NOT NULL,
        consignment_no VARCHAR(100) NOT NULL,
        consignee_name VARCHAR(255) NOT NULL,
        mobile VARCHAR(20) NOT NULL,
        address TEXT NULL,
        pincode VARCHAR(10) NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        package_type VARCHAR(100) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        shipping_mode VARCHAR(50) NOT NULL DEFAULT 'Surface',
        product_name VARCHAR(255) NULL,
        shipping_charge DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        payment_mode VARCHAR(50) NOT NULL DEFAULT 'Prepaid',
        length DECIMAL(10, 2) NULL DEFAULT 0,
        width DECIMAL(10, 2) NULL DEFAULT 0,
        height DECIMAL(10, 2) NULL DEFAULT 0,
        weight DECIMAL(10, 2) NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'Booked',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_offline_user_id (user_id),
        INDEX idx_offline_consignment (consignment_no),
        INDEX idx_offline_status (status),
        INDEX idx_offline_party (party_identity_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("Core tables, offline_orders table and indexes verified successfully.");
  } catch (error) {
    console.warn("ensureTables notice:", error.message);
  }
}

module.exports = { ensureTables };
