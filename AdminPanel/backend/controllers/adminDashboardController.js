const mysql = require("mysql2/promise");
require("dotenv").config();

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: process.env.DB_PASSWORD,
  database: "shipdrop",
});

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

const getAdminDashboard = async (req, res) => {
  try {
    /* =====================================================
       ORDER COUNTS
    ===================================================== */

    const [countRows] = await db.query(`
      SELECT

        COUNT(*) AS all_orders,

        SUM(
          CASE
            WHEN UPPER(TRIM(status)) = 'PROCESSING'
            THEN 1 ELSE 0
          END
        ) AS processing,

        SUM(
          CASE
            WHEN UPPER(TRIM(status)) = 'MANIFESTED'
            THEN 1 ELSE 0
          END
        ) AS manifested,

        SUM(
          CASE
            WHEN UPPER(TRIM(status)) = 'NOT PICKED'
            THEN 1 ELSE 0
          END
        ) AS not_picked,

        SUM(
          CASE
            WHEN UPPER(TRIM(status)) = 'IN TRANSIT'
            THEN 1 ELSE 0
          END
        ) AS in_transit,

        SUM(
          CASE
            WHEN UPPER(TRIM(status)) = 'OUT FOR DELIVERY'
            THEN 1 ELSE 0
          END
        ) AS out_for_delivery,

        SUM(
          CASE
            WHEN UPPER(TRIM(status)) = 'DELIVERED'
            THEN 1 ELSE 0
          END
        ) AS delivered,

        SUM(
          CASE
            WHEN UPPER(TRIM(status)) = 'RTO IN TRANSIT'
            THEN 1 ELSE 0
          END
        ) AS rto_in_transit,

        SUM(
          CASE
            WHEN UPPER(TRIM(status)) = 'RTO DELIVERED'
            THEN 1 ELSE 0
          END
        ) AS rto_delivered,

        SUM(
          CASE
            WHEN UPPER(TRIM(status)) = 'RETURNED'
            THEN 1 ELSE 0
          END
        ) AS returned,

        SUM(
          CASE
            WHEN UPPER(TRIM(status)) = 'CANCELLED'
            THEN 1 ELSE 0
          END
        ) AS cancelled,

        SUM(
          CASE
            WHEN UPPER(TRIM(status)) = 'PENDING'
            THEN 1 ELSE 0
          END
        ) AS pending

      FROM orders
    `);

    /* =====================================================
       TOTAL USERS
    ===================================================== */

    const [userRows] = await db.query(`
      SELECT COUNT(*) AS total_users
      FROM users
    `);

    /* =====================================================
       TOTAL SHIPPING CHARGES

       Uses latest manifest charge per order.
    ===================================================== */

    const [chargeRows] = await db.query(`
      SELECT
        COALESCE(
          SUM(
            COALESCE(
              (
                SELECT m.shipping_charge
                FROM manifests m
                WHERE
                  m.order_id = o.id
                  AND m.user_id = o.user_id
                ORDER BY m.id DESC
                LIMIT 1
              ),
              0
            )
          ),
          0
        ) AS total_charges
      FROM orders o
    `);

    /* =====================================================
       RECENT ORDERS
    ===================================================== */

    const [orders] = await db.query(`
      SELECT
        o.id,
        o.order_id,
        o.user_id,

        u.full_name AS customer_name,
        u.company_name AS customer_company,
        u.email AS customer_email,

        o.awb,
        o.consignee_name,
        o.email,

        o.payment_type,
        o.status,
        o.created_at,

        (
          SELECT m.shipping_charge
          FROM manifests m
          WHERE
            m.order_id = o.id
            AND m.user_id = o.user_id
          ORDER BY m.id DESC
          LIMIT 1
        ) AS charge

      FROM orders o

      LEFT JOIN users u
        ON u.id = o.user_id

      ORDER BY o.id DESC

      LIMIT 8
    `);

    /* =====================================================
       RECENT TICKETS

       We keep this tolerant because ticket schema can vary.
    ===================================================== */

    let recentTickets = [];

    try {
      const [tickets] = await db.query(`
        SELECT *
        FROM tickets
        ORDER BY id DESC
        LIMIT 5
      `);

      recentTickets = tickets || [];
    } catch (ticketError) {
      console.warn(
        "Recent tickets could not be loaded:",
        ticketError.message
      );

      recentTickets = [];
    }

    /* =====================================================
       COUNTS
    ===================================================== */

    const row = countRows[0] || {};

    const counts = {
      All: Number(row.all_orders || 0),
      Processing: Number(row.processing || 0),
      Manifested: Number(row.manifested || 0),
      "Not Picked": Number(row.not_picked || 0),
      "In Transit": Number(row.in_transit || 0),
      "Out For Delivery": Number(row.out_for_delivery || 0),
      Delivered: Number(row.delivered || 0),
      "RTO In Transit": Number(row.rto_in_transit || 0),
      "RTO Delivered": Number(row.rto_delivered || 0),
      Returned: Number(row.returned || 0),
      Cancelled: Number(row.cancelled || 0),
      Pending: Number(row.pending || 0),
    };

    /* =====================================================
       RESPONSE
    ===================================================== */

    return res.status(200).json({
      success: true,

      counts,

      totalUsers: Number(
        userRows[0]?.total_users || 0
      ),

      totalCharges: Number(
        chargeRows[0]?.total_charges || 0
      ),

      orders,

      recentTickets,
    });
  } catch (error) {
    console.error(
      "Admin dashboard error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to load admin dashboard",
    });
  }
};

module.exports = {
  getAdminDashboard,
};