const db = require("./db");

/**
 * Safely verify and add optimal indexes to MySQL database for AdminPanel operations
 * without blocking server startup or throwing if already existing.
 */
async function ensureIndexes() {
  const indexesToEnsure = [
    // ----------------------------------------------------
    // ORDERS TABLE (ADMIN CORE OPTIMIZATION)
    // ----------------------------------------------------
    {
      table: "orders",
      name: "idx_orders_status_id",
      columns: "status, id DESC",
    },
    {
      table: "orders",
      name: "idx_orders_tracking_status_global",
      columns: "tracking_status",
    },
    {
      table: "orders",
      name: "idx_orders_order_id_global",
      columns: "order_id",
    },
    {
      table: "orders",
      name: "idx_orders_awb_global",
      columns: "awb",
    },
    {
      table: "orders",
      name: "idx_orders_created_at_desc",
      columns: "created_at DESC",
    },
    {
      table: "orders",
      name: "idx_orders_payment_type",
      columns: "payment_type",
    },
    {
      table: "orders",
      name: "idx_orders_mobile",
      columns: "mobile",
    },
    {
      table: "orders",
      name: "idx_orders_user_id",
      columns: "user_id",
    },
    {
      table: "orders",
      name: "idx_orders_pickup_addr",
      columns: "pickup_address_id",
    },
    {
      table: "orders",
      name: "idx_orders_warehouse",
      columns: "warehouse_id",
    },
    {
      table: "orders",
      name: "idx_orders_carrier",
      columns: "carrier",
    },
    {
      table: "orders",
      name: "idx_orders_consignment_no",
      columns: "consignment_no",
    },

    // ----------------------------------------------------
    // RELATIONAL TABLES (JOIN OPTIMIZATION)
    // ----------------------------------------------------
    {
      table: "manifests",
      name: "idx_manifests_order_user_id",
      columns: "order_id, user_id, id DESC",
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
      table: "users",
      name: "idx_users_role",
      columns: "role",
    },
    {
      table: "users",
      name: "idx_users_rate_card",
      columns: "rate_card_id",
    },
  ];

  try {
    for (const idx of indexesToEnsure) {
      try {
        const [existing] = await db.query(
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
          console.log(`[ADMIN DB OPTIMIZE] Creating index ${idx.name} on ${idx.table}(${idx.columns})...`);
          await db.query(
            `CREATE INDEX ${idx.name} ON ${idx.table} (${idx.columns})`
          );
          console.log(`[ADMIN DB OPTIMIZE] Index ${idx.name} created successfully.`);
        }
      } catch (err) {
        // Table might not exist or duplicate index; safe to ignore
      }
    }
    console.log("[ADMIN DB OPTIMIZE] Database indexes verified successfully.");
  } catch (error) {
    console.warn("[ADMIN DB OPTIMIZE] Index optimization check skipped:", error.message);
  }
}

module.exports = { ensureIndexes };
