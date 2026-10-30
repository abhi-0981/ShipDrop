const db = require("../config/db");

/* =========================================================
   GET ALL ORDERS - ADMIN
========================================================= */

const getAdminOrders = async (req, res) => {
  try {
    /* =====================================================
       PAGINATION & FILTER PARAMS
    ===================================================== */
    const {
      page,
      limit,
      status,
      search,
      courier,
      payment,
    } = req.query;

    const whereClauses = [];
    const queryParams = [];

    // Filter by status if provided
    if (status && status !== "All") {
      if (status === "NDR & Pending") {
        whereClauses.push(`(
          UPPER(TRIM(COALESCE(o.status, ''))) = 'PENDING'
          OR UPPER(TRIM(COALESCE(o.tracking_status, ''))) = 'PENDING'
          OR UPPER(TRIM(COALESCE(o.tracking_status, ''))) = 'NDR'
        )`);
      } else if (status === "Lost") {
        whereClauses.push(`(
          UPPER(TRIM(COALESCE(o.status, ''))) = 'LOST'
          OR UPPER(TRIM(COALESCE(o.tracking_status, ''))) = 'LOST'
        )`);
      } else {
        whereClauses.push(`UPPER(TRIM(COALESCE(o.status, ''))) = ?`);
        queryParams.push(String(status).trim().toUpperCase());
      }
    }

    // Filter by search query if provided
    if (search && String(search).trim() !== "") {
      const term = `%${String(search).trim()}%`;
      whereClauses.push(`(
        o.order_id LIKE ? OR
        o.awb LIKE ? OR
        o.consignee_name LIKE ? OR
        o.mobile LIKE ? OR
        u.full_name LIKE ? OR
        u.company_name LIKE ? OR
        CAST(o.user_id AS CHAR) LIKE ?
      )`);
      queryParams.push(term, term, term, term, term, term, term);
    }

    // Filter by courier/carrier if provided
    if (courier && courier !== "All") {
      whereClauses.push(`o.carrier = ?`);
      queryParams.push(courier);
    }

    // Filter by payment type if provided
    if (payment && payment !== "All") {
      whereClauses.push(`o.payment_type = ?`);
      queryParams.push(payment);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Count matching rows when pagination is requested
    let totalFiltered = null;
    let pageNum = 1;
    let limitNum = 50;

    const isPaginated = limit && limit !== "all";
    if (isPaginated) {
      pageNum = Math.max(1, parseInt(page, 10) || 1);
      limitNum = Math.max(1, Math.min(500, parseInt(limit, 10) || 50));
      const [countResult] = await db.query(
        `SELECT COUNT(*) AS total FROM orders o LEFT JOIN users u ON u.id = o.user_id ${whereSql}`,
        queryParams
      );
      totalFiltered = Number(countResult[0]?.total || 0);
    }

    /* =====================================================
       GET ORDERS (OPTIMIZED: NO CARTESIAN DUPLICATES)
    ===================================================== */
    const paginationSql = isPaginated ? `LIMIT ? OFFSET ?` : "";
    const finalParams = isPaginated
      ? [...queryParams, limitNum, (pageNum - 1) * limitNum]
      : queryParams;

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
        o.tracking_status,
        o.created_at,

        /* =================================================
           SHIPPING CHARGE (LATEST MANIFEST CHARGE)
        ================================================= */
        (
          SELECT m.shipping_charge
          FROM manifests m
          WHERE m.order_id = o.id
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
           PRODUCT (DEDUPLICATED PRIMARY PRODUCT)
        ================================================= */
        op.product_name,
        op.sku,
        op.price,
        op.qty,
        op.tax,

        /* =================================================
           PACKAGE (DEDUPLICATED PRIMARY PACKAGE)
        ================================================= */
        pkg.length,
        pkg.width,
        pkg.height,
        pkg.weight,
        pkg.package_count

      FROM orders o

      /* USER */
      LEFT JOIN users u
        ON u.id = o.user_id

      /* PICKUP ADDRESS */
      LEFT JOIN pickup_addresses pa
        ON pa.id = o.pickup_address_id

      /* WAREHOUSE */
      LEFT JOIN warehouses w
        ON w.id = o.warehouse_id
        AND w.user_id = o.user_id

      /* PRIMARY PRODUCT (JOIN VIA MIN ID TO ELIMINATE ROW MULTIPLICATION) */
      LEFT JOIN (
        SELECT op1.order_id, op1.product_name, op1.sku, op1.price, op1.qty, op1.tax
        FROM order_products op1
        INNER JOIN (
          SELECT order_id, MIN(id) AS min_id
          FROM order_products
          GROUP BY order_id
        ) op2 ON op1.id = op2.min_id
      ) op ON op.order_id = o.id

      /* PRIMARY PACKAGE (JOIN VIA MIN ID TO ELIMINATE ROW MULTIPLICATION) */
      LEFT JOIN (
        SELECT pkg1.order_id, pkg1.length, pkg1.width, pkg1.height, pkg1.weight, pkg1.package_count
        FROM order_packages pkg1
        INNER JOIN (
          SELECT order_id, MIN(id) AS min_id
          FROM order_packages
          GROUP BY order_id
        ) pkg2 ON pkg1.id = pkg2.min_id
      ) pkg ON pkg.order_id = o.id

      ${whereSql}

      ORDER BY o.id DESC
      ${paginationSql}
    `, finalParams);

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
           LOST
        ================================================= */

        SUM(
          CASE
            WHEN UPPER(TRIM(status)) = 'LOST'
              OR UPPER(TRIM(COALESCE(tracking_status, ''))) = 'LOST'
            THEN 1
            ELSE 0
          END
        ) AS lost,

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

      Lost: Number(
        countRows[0]?.lost || 0
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
      ...(totalFiltered !== null
        ? {
            pagination: {
              total: totalFiltered,
              page: pageNum,
              limit: limitNum,
              totalPages: Math.max(1, Math.ceil(totalFiltered / limitNum)),
            },
          }
        : {}),
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