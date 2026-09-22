const mysql = require("mysql2/promise");
require("dotenv").config();

/* =========================================================
   DATABASE
========================================================= */

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: process.env.DB_PASSWORD,
  database: "shipdrop",
});

/* =========================================================
   GET ALL ORDERS - ADMIN
========================================================= */

const getAdminOrders = async (req, res) => {
  try {
    /* =====================================================
       GET ORDERS
    ===================================================== */

    const [orders] = await db.query(`
      SELECT
        o.id,
        o.order_id,
        o.user_id,

        /* =================================================
           CUSTOMER
        ================================================= */

        u.full_name AS customer_name,
        u.company_name AS customer_company,
        u.email AS customer_email,
        u.phone_no AS customer_phone,

        /* =================================================
           ORDER
        ================================================= */

        o.pickup_address_id,
        o.warehouse_id,
        o.awb,

        o.consignee_name,
        o.mobile,
        o.alternate_mobile,
        o.email,

        o.address_line1,
        o.address_line2,
        o.landmark,
        o.pincode,
        o.city,
        o.state,
        o.country,

        /* =================================================
           RTO / RETURN ADDRESS
        ================================================= */

        o.return_address_id,
        o.return_name,
        o.return_phone,
        o.return_email,
        o.return_address_line1,
        o.return_address_line2,
        o.return_landmark,
        o.return_pincode,
        o.return_city,
        o.return_state,
        o.return_country,

        o.payment_type,
        o.risk_type,
        o.status,
        o.created_at,

        /* =================================================
           SHIPPING CHARGE

           LATEST MANIFEST CHARGE
        ================================================= */

        (
          SELECT
            m.shipping_charge
          FROM manifests m
          WHERE
            m.order_id = o.id
            AND m.user_id = o.user_id
          ORDER BY m.id DESC
          LIMIT 1
        ) AS charge,

        /* =================================================
           PICKUP
        ================================================= */

        pa.pickup_address,
        pa.pickup_pincode,
        pa.pickup_city,

        /* =================================================
           WAREHOUSE
        ================================================= */

        w.id AS warehouse_id_joined,
        w.warehouse_name,
        w.contact_name AS warehouse_contact_name,
        w.phone AS warehouse_phone,
        w.email AS warehouse_email,
        w.gstin AS warehouse_gstin,
        w.address_line1 AS warehouse_address_line1,
        w.address_line2 AS warehouse_address_line2,
        w.floor_no AS warehouse_floor_no,
        w.landmark AS warehouse_landmark,
        w.pincode AS warehouse_pincode,
        w.city AS warehouse_city,
        w.state AS warehouse_state,
        w.country AS warehouse_country,

        /* =================================================
           PRODUCT
        ================================================= */

        op.product_name,
        op.sku,
        op.price,
        op.qty,
        op.tax,

        /* =================================================
           PACKAGE
        ================================================= */

        pkg.length,
        pkg.width,
        pkg.height,
        pkg.weight,
        pkg.package_count

      FROM orders o

      /* =================================================
         USER
      ================================================= */

      LEFT JOIN users u
        ON u.id = o.user_id

      /* =================================================
         PICKUP ADDRESS
      ================================================= */

      LEFT JOIN pickup_addresses pa
        ON pa.id = o.pickup_address_id

      /* =================================================
         WAREHOUSE
      ================================================= */

      LEFT JOIN warehouses w
        ON w.id = o.warehouse_id
        AND w.user_id = o.user_id

      /* =================================================
         PRODUCTS
      ================================================= */

      LEFT JOIN order_products op
        ON op.order_id = o.id

      /* =================================================
         PACKAGE
      ================================================= */

      LEFT JOIN order_packages pkg
        ON pkg.order_id = o.id

      /* =================================================
         ORDER
      ================================================= */

      ORDER BY o.id DESC
    `);

    /* =====================================================
       STATUS COUNTS
    ===================================================== */

    const [countRows] = await db.query(`
      SELECT

        /* =================================================
           ALL
        ================================================= */

        COUNT(*) AS all_orders,

        /* =================================================
           PROCESSING
        ================================================= */

        SUM(
          CASE
            WHEN UPPER(TRIM(status)) = 'PROCESSING'
            THEN 1
            ELSE 0
          END
        ) AS processing,

        /* =================================================
           MANIFESTED
        ================================================= */

        SUM(
          CASE
            WHEN UPPER(TRIM(status)) = 'MANIFESTED'
            THEN 1
            ELSE 0
          END
        ) AS manifested,

        /* =================================================
           NOT PICKED
        ================================================= */

        SUM(
          CASE
            WHEN UPPER(TRIM(status)) = 'NOT PICKED'
            THEN 1
            ELSE 0
          END
        ) AS not_picked,

        /* =================================================
           IN TRANSIT
        ================================================= */

        SUM(
          CASE
            WHEN UPPER(TRIM(status)) = 'IN TRANSIT'
            THEN 1
            ELSE 0
          END
        ) AS in_transit,

        /* =================================================
           OUT FOR DELIVERY
        ================================================= */

        SUM(
          CASE
            WHEN UPPER(TRIM(status)) = 'OUT FOR DELIVERY'
            THEN 1
            ELSE 0
          END
        ) AS out_for_delivery,

        /* =================================================
           DELIVERED
        ================================================= */

        SUM(
          CASE
            WHEN UPPER(TRIM(status)) = 'DELIVERED'
            THEN 1
            ELSE 0
          END
        ) AS delivered,

        /* =================================================
           RTO IN TRANSIT
        ================================================= */

        SUM(
          CASE
            WHEN UPPER(TRIM(status)) = 'RTO IN TRANSIT'
            THEN 1
            ELSE 0
          END
        ) AS rto_in_transit,

        /* =================================================
           RTO DELIVERED
        ================================================= */

        SUM(
          CASE
            WHEN UPPER(TRIM(status)) = 'RTO DELIVERED'
            THEN 1
            ELSE 0
          END
        ) AS rto_delivered,

        /* =================================================
           RETURNED
        ================================================= */

        SUM(
          CASE
            WHEN UPPER(TRIM(status)) = 'RETURNED'
            THEN 1
            ELSE 0
          END
        ) AS returned,

        /* =================================================
           CANCELLED
        ================================================= */

        SUM(
          CASE
            WHEN UPPER(TRIM(status)) = 'CANCELLED'
            THEN 1
            ELSE 0
          END
        ) AS cancelled,

        /* =================================================
           PENDING
        ================================================= */

        SUM(
          CASE
            WHEN UPPER(TRIM(status)) = 'PENDING'
            THEN 1
            ELSE 0
          END
        ) AS pending

      FROM orders
    `);

    /* =====================================================
       FORMAT COUNTS
    ===================================================== */

    const counts = {
      All: Number(
        countRows[0]?.all_orders || 0
      ),

      Processing: Number(
        countRows[0]?.processing || 0
      ),

      Manifested: Number(
        countRows[0]?.manifested || 0
      ),

      "Not Picked": Number(
        countRows[0]?.not_picked || 0
      ),

      "In Transit": Number(
        countRows[0]?.in_transit || 0
      ),

      "Out For Delivery": Number(
        countRows[0]?.out_for_delivery || 0
      ),

      Delivered: Number(
        countRows[0]?.delivered || 0
      ),

      "RTO In Transit": Number(
        countRows[0]?.rto_in_transit || 0
      ),

      "RTO Delivered": Number(
        countRows[0]?.rto_delivered || 0
      ),

      Returned: Number(
        countRows[0]?.returned || 0
      ),

      Cancelled: Number(
        countRows[0]?.cancelled || 0
      ),

      Pending: Number(
        countRows[0]?.pending || 0
      ),
    };

    /* =====================================================
       RESPONSE
    ===================================================== */

    return res.status(200).json({
      success: true,
      orders,
      counts,
    });

  } catch (error) {
    console.error(
      "Get admin orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch orders",
    });
  }
};

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  getAdminOrders,
};