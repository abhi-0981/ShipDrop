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
  ];

  try {
    const promiseDb = db.promise();

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

    // Ensure users table has last_logout_at column for multi-device session handling
    try {
      const [userCol] = await promiseDb.query(`
        SELECT COLUMN_NAME
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'users'
          AND column_name = 'last_logout_at'
        LIMIT 1
      `);
      if (!userCol || userCol.length === 0) {
        console.log("[DB OPTIMIZE] Adding last_logout_at column to users table...");
        await promiseDb.query(`
          ALTER TABLE users
          ADD COLUMN last_logout_at DATETIME NULL DEFAULT NULL
        `);
        console.log("[DB OPTIMIZE] Column last_logout_at added successfully to users table.");
      }
    } catch (userColErr) {
      console.warn("[DB OPTIMIZE] last_logout_at column check skipped/notice:", userColErr.message);
    }
  } catch (error) {
    console.warn("[DB OPTIMIZE] Index optimization check skipped:", error.message);
  }
}

module.exports = { ensureIndexes };
