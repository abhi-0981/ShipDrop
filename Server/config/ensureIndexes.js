const db = require("./db");

/**
 * Safely verify and add optimal indexes to Aiven MySQL database
 * without blocking server startup or throwing if already existing.
 */
async function ensureIndexes() {
  const indexesToEnsure = [
    {
      table: "orders",
      name: "idx_orders_user_status_id",
      columns: "user_id, status, id",
    },
    {
      table: "orders",
      name: "idx_orders_user_tracking_status",
      columns: "user_id, tracking_status",
    },
    {
      table: "orders",
      name: "idx_orders_user_awb",
      columns: "user_id, awb",
    },
    {
      table: "manifests",
      name: "idx_manifests_user_status_order",
      columns: "user_id, status, order_id",
    },
    {
      table: "order_products",
      name: "idx_order_products_order_id",
      columns: "order_id",
    },
    {
      table: "order_packages",
      name: "idx_order_packages_order_id",
      columns: "order_id",
    },
    {
      table: "wallets",
      name: "idx_wallets_user_id",
      columns: "user_id",
    },
    {
      table: "user_sessions",
      name: "idx_user_sessions_user_id",
      columns: "user_id",
    },
    {
      table: "user_sessions",
      name: "idx_user_sessions_session_id",
      columns: "session_id",
    },
    {
      table: "user_sessions",
      name: "idx_user_sessions_user_revoked",
      columns: "user_id, is_revoked",
    },
    {
      table: "user_sessions",
      name: "idx_user_sessions_expires_at",
      columns: "expires_at",
    },
  ];

  try {
    const promiseDb = db.promise();

    // 1. Ensure user_sessions table exists
    try {
      await promiseDb.query(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          session_id VARCHAR(128) NOT NULL DEFAULT '',
          user_id INT NOT NULL DEFAULT 0,
          ip_address VARCHAR(45) NULL DEFAULT NULL,
          user_agent TEXT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          is_revoked TINYINT(1) NOT NULL DEFAULT 0,
          revoked_at TIMESTAMP NULL DEFAULT NULL,
          INDEX idx_user_sessions_user_id (user_id),
          INDEX idx_user_sessions_session_id (session_id),
          INDEX idx_user_sessions_user_revoked (user_id, is_revoked),
          INDEX idx_user_sessions_expires_at (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Verify columns in user_sessions if table pre-existed with different columns
      const [cols] = await promiseDb.query("SHOW COLUMNS FROM user_sessions");
      const existingCols = (cols || []).map((c) => c.Field.toLowerCase());

      if (!existingCols.includes("session_id")) {
        await promiseDb.query("ALTER TABLE user_sessions ADD COLUMN session_id VARCHAR(128) NOT NULL DEFAULT ''");
      }
      if (!existingCols.includes("user_id")) {
        await promiseDb.query("ALTER TABLE user_sessions ADD COLUMN user_id INT NOT NULL DEFAULT 0");
      }
      if (!existingCols.includes("expires_at")) {
        await promiseDb.query("ALTER TABLE user_sessions ADD COLUMN expires_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
      }
      if (!existingCols.includes("is_revoked")) {
        await promiseDb.query("ALTER TABLE user_sessions ADD COLUMN is_revoked TINYINT(1) NOT NULL DEFAULT 0");
      }
      if (!existingCols.includes("revoked_at")) {
        await promiseDb.query("ALTER TABLE user_sessions ADD COLUMN revoked_at TIMESTAMP NULL DEFAULT NULL");
      }
      if (!existingCols.includes("ip_address")) {
        await promiseDb.query("ALTER TABLE user_sessions ADD COLUMN ip_address VARCHAR(45) NULL DEFAULT NULL");
      }
      if (!existingCols.includes("user_agent")) {
        await promiseDb.query("ALTER TABLE user_sessions ADD COLUMN user_agent TEXT NULL");
      }
    } catch (tblErr) {
      console.warn("[DB OPTIMIZE] user_sessions table check notice:", tblErr.message);
    }

    for (const idx of indexesToEnsure) {
      try {
        const [existing] = await promiseDb.query(
          `
          SELECT 1
          FROM information_schema.statistics
          WHERE table_schema = DATABASE()
            AND table_name = ?
            AND index_name = ?
          LIMIT 1
        `,
          [idx.table, idx.name]
        );

        if (!existing || existing.length === 0) {
          console.log(`[DB OPTIMIZE] Creating index ${idx.name} on ${idx.table}(${idx.columns})...`);
          await promiseDb.query(
            `CREATE INDEX ${idx.name} ON ${idx.table} (${idx.columns})`
          );
          console.log(`[DB OPTIMIZE] Index ${idx.name} created successfully.`);
        }
      } catch (err) {
        // Log but do not block execution (e.g. table might not exist or duplicate key)
      }
    }

    // Synchronize cancelled orders: ensure tracking_status = 'CANCELLED' in MySQL
    try {
      const [syncResult] = await promiseDb.query(`
        UPDATE orders
        SET tracking_status = 'CANCELLED'
        WHERE UPPER(TRIM(COALESCE(status, ''))) IN ('CANCELLED', 'CANCELED')
          AND (tracking_status IS NULL OR UPPER(TRIM(tracking_status)) <> 'CANCELLED')
      `);
      if (syncResult && syncResult.affectedRows > 0) {
        console.log(`[DB OPTIMIZE] Synchronized ${syncResult.affectedRows} cancelled orders tracking_status to CANCELLED.`);
      }
    } catch (syncErr) {
      console.warn("[DB OPTIMIZE] Cancelled status sync skipped:", syncErr.message);
    }
  } catch (error) {
    console.warn("[DB OPTIMIZE] Index optimization check skipped:", error.message);
  }
}

module.exports = { ensureIndexes };
