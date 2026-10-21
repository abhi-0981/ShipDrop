const db = require("../config/db");
const crypto = require("crypto");

// Immediate migration check to guarantee orders.status supports 'Booked' and order_id supports NULL
db.query(
  "ALTER TABLE orders MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Processing'",
  (err) => {
    if (err) console.warn("Notice ensuring orders.status VARCHAR(50):", err.message);
  }
);
db.query(
  "ALTER TABLE orders MODIFY COLUMN order_id VARCHAR(50) NULL DEFAULT NULL",
  (err) => {
    if (err) console.warn("Notice ensuring orders.order_id NULL:", err.message);
  }
);
db.query(
  "ALTER TABLE orders ADD COLUMN shipping_mode VARCHAR(50) NULL DEFAULT NULL",
  (err) => {
    if (err && err.errno !== 1060 && !err.message.includes("Duplicate")) {
      console.warn("Notice ensuring orders.shipping_mode:", err.message);
    }
  }
);

// ======================================================
// CREATE PICKUP ADDRESS
// ======================================================

const createPickupAddress = (
  user_id,
  pickup_address,
  pickup_pincode,
  pickup_city,
  callback,
) => {
  const query = `
    INSERT INTO pickup_addresses
    (
      user_id,
      pickup_pincode,
      pickup_city,
      pickup_address
    )
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    query,
    [user_id, pickup_pincode, pickup_city || null, pickup_address],
    callback,
  );
};

// ======================================================
// GENERATE UNIQUE ORDER ID
// ======================================================

const generateUniqueOrderId = (callback, attempts = 0) => {
  if (attempts >= 10) {
    return callback(new Error("Unable to generate unique order ID"));
  }

  const orderId = String(crypto.randomInt(100000, 1000000));

  const checkQuery = `
    SELECT id
    FROM orders
    WHERE order_id = ?
    LIMIT 1
  `;

  db.query(checkQuery, [orderId], (err, rows) => {
    if (err) {
      return callback(err);
    }

    if (rows.length > 0) {
      return generateUniqueOrderId(callback, attempts + 1);
    }

    return callback(null, orderId);
  });
};

// ======================================================
// CREATE ORDER
// ======================================================

const createOrder = (orderData, callback) => {
  const isManualCarrier = Boolean(
    orderData.carrier && orderData.carrier !== "Delivery"
  );

  const proceedWithInsert = (publicOrderId) => {
    const query = `
        INSERT INTO orders
        (
          order_id,
          user_id,
          pickup_address_id,
          warehouse_id,
          party_identity_id,

          carrier,
          consignment_no,
          package_type,
          manual_amount_including_gst,
          shipping_mode,

          return_address_id,
          return_name,
          return_phone,
          return_email,
          return_address_line1,
          return_address_line2,
          return_landmark,
          return_pincode,
          return_city,
          return_state,
          return_country,

          consignee_name,
          mobile,
          alternate_mobile,
          email,
          gstin,
          company_name,
          floor_no,
          landmark,
          address_line1,
          address_line2,
          pincode,
          city,
          state,
          country,
          payment_type,
          risk_type,
          fragile_shipment,
          dangerous_good,
          status
        )
        VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?
        )
      `;

    const params = [
        // ==========================================
        // ORDER
        // ==========================================

        publicOrderId,
        orderData.user_id,
        orderData.pickup_address_id,
        orderData.warehouse_id || null,
        orderData.party_identity_id || null,

        // ==========================================
        // MANUAL CARRIER FIELDS
        // ==========================================
        orderData.carrier || "Delivery",
        orderData.consignment_no || null,
        orderData.package_type || null,
        orderData.manual_amount_including_gst !== undefined && orderData.manual_amount_including_gst !== null
          ? Number(orderData.manual_amount_including_gst)
          : null,
        orderData.shipping_mode || (isManualCarrier ? "Surface" : null),

        // ==========================================
        // RETURN ADDRESS
        // ==========================================

        orderData.return_address_id || null,
        orderData.return_name || null,
        orderData.return_phone || null,
        orderData.return_email || null,
        orderData.return_address_line1 || null,
        orderData.return_address_line2 || null,
        orderData.return_landmark || null,
        orderData.return_pincode || null,
        orderData.return_city || null,
        orderData.return_state || null,
        orderData.return_country || "India",

        // ==========================================
        // CONSIGNEE
        // ==========================================

        orderData.consignee_name,
        orderData.mobile,
        orderData.alternate_mobile || null,
        orderData.email || null,
        orderData.gstin || null,
        orderData.company_name || null,
        orderData.floor_no || null,
        orderData.landmark || null,
        orderData.address_line1,
        orderData.address_line2 || null,
        orderData.pincode,
        orderData.city,
        orderData.state,
        orderData.country || "India",

        orderData.payment_type || "Prepaid",
        orderData.risk_type || "Owner Risk",
        orderData.fragile_shipment ? 1 : 0,
        orderData.dangerous_good ? 1 : 0,

        // New order starts in Processing for Delivery, or Booked for manual carriers
        orderData.status || (isManualCarrier ? "Booked" : "Processing"),
      ];

    db.query(query, params, (err, result) => {
      if (err) {
        if (
          err.code === "WARN_DATA_TRUNCATED" ||
          err.errno === 1265 ||
          (err.message && err.message.toLowerCase().includes("status"))
        ) {
          console.warn("orders.status truncated, altering column to VARCHAR(50) and retrying...");
          return db.query(
            "ALTER TABLE orders MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Processing'",
            (alterErr) => {
              if (alterErr) {
                console.error("Failed to alter status column:", alterErr);
                return callback(err);
              }
              // Retry insertion
              db.query(query, params, (retryErr, retryResult) => {
                if (retryErr) return callback(retryErr);
                clearOrderStatusCountsCache(orderData.user_id);
                return callback(null, {
                  id: retryResult.insertId,
                  order_id: publicOrderId,
                  carrier: orderData.carrier || "Delivery",
                  consignment_no: orderData.consignment_no || null,
                  package_type: orderData.package_type || null,
                  manual_amount_including_gst: orderData.manual_amount_including_gst || null,
                  shipping_mode: orderData.shipping_mode || (isManualCarrier ? "Surface" : null),
                  status: orderData.status || (isManualCarrier ? "Booked" : "Processing"),
                  warehouse_id: orderData.warehouse_id || null,
                  return_address_id: orderData.return_address_id || null,
                  message: "Order created successfully",
                });
              });
            }
          );
        }
        return callback(err);
      }

      clearOrderStatusCountsCache(orderData.user_id);
      return callback(null, {
        id: result.insertId,
        order_id: publicOrderId,
        carrier: orderData.carrier || "Delivery",
        consignment_no: orderData.consignment_no || null,
        package_type: orderData.package_type || null,
        manual_amount_including_gst: orderData.manual_amount_including_gst || null,
        shipping_mode: orderData.shipping_mode || (isManualCarrier ? "Surface" : null),
        status: orderData.status || (isManualCarrier ? "Booked" : "Processing"),
        warehouse_id: orderData.warehouse_id || null,
        return_address_id: orderData.return_address_id || null,
        message: "Order created successfully",
      });
    });
  };

  if (isManualCarrier) {
    // For manual carrier orders, order_id must remain NULL. Do not generate a random order ID.
    proceedWithInsert(null);
  } else {
    // Delivery orders use unique 6-digit public order ID
    generateUniqueOrderId((idError, publicOrderId) => {
      if (idError) {
        return callback(idError);
      }
      proceedWithInsert(publicOrderId);
    });
  }
};

// ======================================================
// CREATE PRODUCT
// ======================================================

const createProduct = (productData, callback) => {
  const query = `
    INSERT INTO order_products
    (
      order_id,
      product_name,
      sku,
      price,
      qty,
      tax
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [
      productData.order_id,
      productData.product_name,
      productData.sku || null,
      productData.price || 0,
      productData.qty || 1,
      productData.tax || 0,
    ],
    callback,
  );
};

// ======================================================
// CREATE PACKAGE
// ======================================================

const createPackage = (packageData, callback) => {
  const length = Number(packageData.length) || 0;
  const width = Number(packageData.width) || 0;
  const height = Number(packageData.height) || 0;
  const weight = Number(packageData.weight) || 0;
  const packageCount = Number(packageData.package_count) || 1;

  const volumetricWeight = Number(
    ((length * width * height) / 5000).toFixed(2)
  );

  const query = `
    INSERT INTO order_packages
    (
      order_id,
      length,
      width,
      height,
      weight,
      package_count,
      volumetric_weight
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [
      packageData.order_id,
      length,
      width,
      height,
      weight,
      packageCount,
      volumetricWeight,
    ],
    callback
  );
};

// ======================================================
// RUN QUERY
// ======================================================

const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

// ======================================================
// GET PROCESSING ORDERS
// ======================================================

const getProcessingOrders = (user_id, callback) => {
  const query = `
    SELECT
      o.id,
      o.order_id,
      o.user_id,
      o.party_identity_id,
      pi.name AS party_name,
      pi.reference_name AS party_reference_name,

      o.pickup_address_id,
      o.warehouse_id,

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

      o.awb,

      o.consignee_name,
      o.mobile,
      o.alternate_mobile,
      o.email,

      o.gstin,
      o.company_name,

      o.floor_no,
      o.landmark,

      o.address_line1,
      o.address_line2,

      o.pincode,
      o.city,
      o.state,
      o.country,

      o.payment_type,
      o.risk_type,
      o.fragile_shipment,
o.dangerous_good,

      o.status,
      o.created_at,

      pa.pickup_address,
      pa.pickup_pincode,
      pa.pickup_city,

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
      w.delhivery_registered,
      w.status AS warehouse_status,

      op.product_name,
      op.sku,
      op.price,
      op.qty,
      op.tax,

      pkg.length,
      pkg.width,
      pkg.height,
      pkg.weight,
      pkg.package_count,
      pkg.volumetric_weight

    FROM orders o

    LEFT JOIN pickup_addresses pa
      ON pa.id = o.pickup_address_id

    LEFT JOIN warehouses w
      ON w.id = o.warehouse_id
      AND w.user_id = o.user_id

    LEFT JOIN party_identities pi
      ON pi.id = o.party_identity_id
      AND pi.user_id = o.user_id

    LEFT JOIN order_products op
      ON op.order_id = o.id

    LEFT JOIN order_packages pkg
      ON pkg.order_id = o.id

    WHERE
      o.user_id = ?
      AND UPPER(o.status) = 'PROCESSING'

    ORDER BY o.id DESC
  `;

  db.query(query, [user_id], callback);
};

// ======================================================
// GET ALL ORDERS
// ======================================================

const getAllOrders = (user_id, page = 1, limit = 50, search = "", status = "", callback) => {
  if (typeof status === "function") {
    callback = status;
    status = "";
  }

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
  const offset = (safePage - 1) * safeLimit;
  const searchTerm = String(search || "").trim();
  const searchValue = `%${searchTerm}%`;

  let statusCondition = "AND UPPER(TRIM(COALESCE(o.status, ''))) <> 'PROCESSING'";
  const statusParams = [];
  const countStatusParams = [];

  const normalizedStatus = String(status || "").trim().toUpperCase().replace(/[-_]/g, " ");

  if (normalizedStatus && normalizedStatus !== "ALL") {
    if (normalizedStatus === "PENDING") {
      statusCondition = "AND UPPER(TRIM(COALESCE(o.status, ''))) NOT IN ('PROCESSING', 'CANCELLED', 'CANCELED') AND (UPPER(TRIM(COALESCE(o.status, ''))) = 'PENDING' OR UPPER(TRIM(COALESCE(o.tracking_status, ''))) = 'PENDING')";
    } else if (normalizedStatus === "IN TRANSIT") {
      statusCondition = "AND UPPER(TRIM(COALESCE(o.status, ''))) NOT IN ('PROCESSING', 'CANCELLED', 'CANCELED') AND (UPPER(TRIM(COALESCE(o.status, ''))) IN ('IN TRANSIT', 'IN_TRANSIT') OR UPPER(TRIM(COALESCE(o.tracking_status, ''))) IN ('IN TRANSIT', 'IN_TRANSIT'))";
    } else if (normalizedStatus === "DELIVERED") {
      statusCondition = "AND UPPER(TRIM(COALESCE(o.status, ''))) NOT IN ('PROCESSING', 'CANCELLED', 'CANCELED') AND (UPPER(TRIM(COALESCE(o.status, ''))) = 'DELIVERED' OR UPPER(TRIM(COALESCE(o.tracking_status, ''))) = 'DELIVERED')";
    } else if (normalizedStatus === "MANIFESTED") {
      statusCondition = "AND UPPER(TRIM(COALESCE(o.status, ''))) NOT IN ('PROCESSING', 'CANCELLED', 'CANCELED') AND UPPER(TRIM(COALESCE(o.status, ''))) IN ('MANIFESTED', 'NOT PICKED')";
    } else if (normalizedStatus === "NOT PICKED") {
      statusCondition = "AND UPPER(TRIM(COALESCE(o.status, ''))) NOT IN ('PROCESSING', 'CANCELLED', 'CANCELED') AND (UPPER(TRIM(COALESCE(o.status, ''))) = 'NOT PICKED' OR UPPER(TRIM(COALESCE(o.tracking_status, ''))) = 'NOT PICKED')";
    } else if (normalizedStatus === "OUT FOR DELIVERY" || normalizedStatus === "OFD") {
      statusCondition = "AND UPPER(TRIM(COALESCE(o.status, ''))) NOT IN ('PROCESSING', 'CANCELLED', 'CANCELED') AND (UPPER(TRIM(COALESCE(o.status, ''))) IN ('OUT FOR DELIVERY', 'OUT_FOR_DELIVERY', 'OFD') OR UPPER(TRIM(COALESCE(o.tracking_status, ''))) IN ('OUT FOR DELIVERY', 'OUT_FOR_DELIVERY', 'OFD'))";
    } else if (normalizedStatus === "CANCELLED" || normalizedStatus === "CANCELED") {
      statusCondition = "AND (UPPER(TRIM(COALESCE(o.status, ''))) IN ('CANCELLED', 'CANCELED') OR UPPER(TRIM(COALESCE(o.tracking_status, ''))) IN ('CANCELLED', 'CANCELED'))";
    } else if (normalizedStatus === "RETURNED") {
      statusCondition = "AND UPPER(TRIM(COALESCE(o.status, ''))) NOT IN ('PROCESSING', 'CANCELLED', 'CANCELED') AND (UPPER(TRIM(COALESCE(o.status, ''))) = 'RETURNED' OR UPPER(TRIM(COALESCE(o.tracking_status, ''))) = 'RETURNED')";
    } else if (normalizedStatus === "RTO IN TRANSIT") {
      statusCondition = "AND UPPER(TRIM(COALESCE(o.status, ''))) NOT IN ('PROCESSING', 'CANCELLED', 'CANCELED') AND (UPPER(TRIM(COALESCE(o.status, ''))) IN ('RTO IN TRANSIT', 'RTO_IN_TRANSIT') OR UPPER(TRIM(COALESCE(o.tracking_status, ''))) IN ('RTO IN TRANSIT', 'RTO_IN_TRANSIT'))";
    } else if (normalizedStatus === "RTO DELIVERED") {
      statusCondition = "AND UPPER(TRIM(COALESCE(o.status, ''))) NOT IN ('PROCESSING', 'CANCELLED', 'CANCELED') AND (UPPER(TRIM(COALESCE(o.status, ''))) IN ('RTO DELIVERED', 'RTO_DELIVERED') OR UPPER(TRIM(COALESCE(o.tracking_status, ''))) IN ('RTO DELIVERED', 'RTO_DELIVERED'))";
    } else {
      statusCondition = "AND UPPER(TRIM(COALESCE(o.status, ''))) NOT IN ('PROCESSING', 'CANCELLED', 'CANCELED') AND (UPPER(TRIM(COALESCE(o.status, ''))) = ? OR UPPER(TRIM(COALESCE(o.tracking_status, ''))) = ?)";
      statusParams.push(normalizedStatus, normalizedStatus);
      countStatusParams.push(normalizedStatus, normalizedStatus);
    }
  }

  const query = `
    SELECT
      o.id,
      o.order_id,
      o.user_id,
      o.carrier,
      o.consignment_no,
      o.package_type,
      o.manual_amount_including_gst,
      o.shipping_mode,
      o.party_identity_id,
      pi.name AS party_name,
      pi.reference_name AS party_reference_name,

      o.pickup_address_id,
      o.warehouse_id,

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

      o.awb,
      CASE
        WHEN UPPER(TRIM(COALESCE(o.status, ''))) IN ('CANCELLED', 'CANCELED') THEN 'CANCELLED'
        ELSE o.tracking_status
      END AS tracking_status,
      o.tracking_data,
      o.tracking_updated_at,

      (
        SELECT m_pickup.pickup_request_id
        FROM manifests m_pickup
        WHERE m_pickup.order_id = o.id
          AND m_pickup.user_id = o.user_id
        ORDER BY m_pickup.id DESC
        LIMIT 1
      ) AS pickup_id,

      o.consignee_name,
      o.mobile,
      o.alternate_mobile,
      o.email,

      o.gstin,
      o.company_name,

      o.floor_no,
      o.landmark,

      o.address_line1,
      o.address_line2,

      o.pincode,
      o.city,
      o.state,
      o.country,

      o.payment_type,
      o.risk_type,
      o.fragile_shipment,
      o.dangerous_good,

      o.status,
      o.created_at,

      (
        SELECT m_charge.shipping_charge
        FROM manifests m_charge
        WHERE m_charge.order_id = o.id
          AND m_charge.user_id = o.user_id
        ORDER BY m_charge.id DESC
        LIMIT 1
      ) AS shipping_charge,

      (
        SELECT m.service_type
        FROM manifests m
        WHERE
          m.order_id = o.id
          AND m.user_id = o.user_id
          AND UPPER(COALESCE(m.status, '')) = 'CONFIRMED'
        ORDER BY m.id DESC
        LIMIT 1
      ) AS manifest_service_type,

      pa.pickup_address,
      pa.pickup_pincode,
      pa.pickup_city,

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
      w.delhivery_registered,
      w.status AS warehouse_status,

      (SELECT op.product_name FROM order_products op WHERE op.order_id = o.id ORDER BY op.id ASC LIMIT 1) AS product_name,
      (SELECT op.sku FROM order_products op WHERE op.order_id = o.id ORDER BY op.id ASC LIMIT 1) AS sku,
      (SELECT op.price FROM order_products op WHERE op.order_id = o.id ORDER BY op.id ASC LIMIT 1) AS price,
      (SELECT op.qty FROM order_products op WHERE op.order_id = o.id ORDER BY op.id ASC LIMIT 1) AS qty,
      (SELECT op.tax FROM order_products op WHERE op.order_id = o.id ORDER BY op.id ASC LIMIT 1) AS tax,

      (SELECT pkg.length FROM order_packages pkg WHERE pkg.order_id = o.id ORDER BY pkg.id ASC LIMIT 1) AS length,
      (SELECT pkg.width FROM order_packages pkg WHERE pkg.order_id = o.id ORDER BY pkg.id ASC LIMIT 1) AS width,
      (SELECT pkg.height FROM order_packages pkg WHERE pkg.order_id = o.id ORDER BY pkg.id ASC LIMIT 1) AS height,
      (SELECT pkg.weight FROM order_packages pkg WHERE pkg.order_id = o.id ORDER BY pkg.id ASC LIMIT 1) AS weight,
      (SELECT pkg.package_count FROM order_packages pkg WHERE pkg.order_id = o.id ORDER BY pkg.id ASC LIMIT 1) AS package_count,
      (SELECT pkg.volumetric_weight FROM order_packages pkg WHERE pkg.order_id = o.id ORDER BY pkg.id ASC LIMIT 1) AS volumetric_weight

    FROM orders o

    LEFT JOIN pickup_addresses pa
      ON pa.id = o.pickup_address_id

    LEFT JOIN warehouses w
      ON w.id = o.warehouse_id
      AND w.user_id = o.user_id

    LEFT JOIN party_identities pi
      ON pi.id = o.party_identity_id
      AND pi.user_id = o.user_id

    WHERE
      o.user_id = ?
      AND (o.carrier IS NULL OR o.carrier = 'Delivery')
      ${statusCondition}
      AND (
        ? = ''
        OR CAST(o.order_id AS CHAR) LIKE ?
        OR UPPER(TRIM(COALESCE(o.awb, ''))) LIKE UPPER(?)
        OR UPPER(TRIM(COALESCE(o.consignee_name, ''))) LIKE UPPER(?)
        OR TRIM(COALESCE(o.mobile, '')) LIKE ?
        OR UPPER(TRIM(COALESCE(pi.name, ''))) LIKE UPPER(?)
        OR UPPER(TRIM(COALESCE(pi.reference_name, ''))) LIKE UPPER(?)
      )

    ORDER BY o.id DESC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(o.id) AS total
    FROM orders o
    LEFT JOIN party_identities pi
      ON pi.id = o.party_identity_id
      AND pi.user_id = o.user_id
    WHERE
      o.user_id = ?
      AND (o.carrier IS NULL OR o.carrier = 'Delivery')
      ${statusCondition}
      AND (
        ? = ''
        OR CAST(o.order_id AS CHAR) LIKE ?
        OR UPPER(TRIM(COALESCE(o.awb, ''))) LIKE UPPER(?)
        OR UPPER(TRIM(COALESCE(o.consignee_name, ''))) LIKE UPPER(?)
        OR TRIM(COALESCE(o.mobile, '')) LIKE ?
        OR UPPER(TRIM(COALESCE(pi.name, ''))) LIKE UPPER(?)
        OR UPPER(TRIM(COALESCE(pi.reference_name, ''))) LIKE UPPER(?)
      )
  `;

  const queryParams = [
    user_id,
    ...statusParams,
    searchTerm,
    searchValue,
    searchValue,
    searchValue,
    searchValue,
    searchValue,
    searchValue,
    safeLimit,
    offset,
  ];

  const countParams = [
    user_id,
    ...countStatusParams,
    searchTerm,
    searchValue,
    searchValue,
    searchValue,
    searchValue,
    searchValue,
    searchValue,
  ];

  Promise.all([
    db.promise().query(query, queryParams),
    db.promise().query(countQuery, countParams),
  ])
    .then(([orderRowsResult, countRowsResult]) => {
      const rows = orderRowsResult[0] || [];
      const totalOrders = Number(countRowsResult[0]?.[0]?.total) || 0;
      return callback(null, rows, totalOrders);
    })
    .catch((error) => {
      return callback(error);
    });
};


// ======================================================
// GET ORDER BY ID
// ======================================================

const getOrderById = (orderId, userId) => {
  return new Promise((resolve, reject) => {
    const query = `
        SELECT
          o.id,
          o.order_id,
          o.user_id,
          o.carrier,
          o.consignment_no,
          o.package_type,
          o.manual_amount_including_gst,
          o.shipping_mode,
          o.party_identity_id,
          pi.name AS party_name,
          pi.reference_name AS party_reference_name,

          o.pickup_address_id,
          o.warehouse_id,

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

          o.awb,
          CASE
            WHEN UPPER(TRIM(COALESCE(o.status, ''))) IN ('CANCELLED', 'CANCELED') THEN 'CANCELLED'
            ELSE o.tracking_status
          END AS tracking_status,
          o.tracking_data,
          o.tracking_updated_at,

          o.consignee_name,
          o.mobile,
          o.alternate_mobile,
          o.email,

          o.gstin,
          o.company_name,

          o.floor_no,
          o.landmark,

          o.address_line1,
          o.address_line2,

          o.pincode,
          o.city,
          o.state,
          o.country,

        o.payment_type,
o.risk_type,
o.fragile_shipment,
o.dangerous_good,

o.status,
          o.created_at,

          -- ==================================================
          -- ACTUAL SERVICE USED DURING MANIFEST
          -- ==================================================
          (
            SELECT
              m.service_type
            FROM manifests m
            WHERE
              m.order_id = o.id
              AND m.user_id = o.user_id
              AND UPPER(
                COALESCE(m.status, '')
              ) = 'CONFIRMED'
            ORDER BY m.id DESC
            LIMIT 1
          ) AS manifest_service_type,

          pa.pickup_address,
          pa.pickup_pincode,
          pa.pickup_city,

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
          w.delhivery_registered,
          w.status AS warehouse_status,

          op.product_name,
          op.sku,
          op.price,
          op.qty,
          op.tax,

          pkg.length,
          pkg.width,
          pkg.height,
          pkg.weight,
          pkg.package_count,
          pkg.volumetric_weight

        FROM orders o

        LEFT JOIN pickup_addresses pa
          ON pa.id = o.pickup_address_id

        LEFT JOIN warehouses w
          ON w.id = o.warehouse_id
          AND w.user_id = o.user_id

        LEFT JOIN party_identities pi
          ON pi.id = o.party_identity_id
          AND pi.user_id = o.user_id

        LEFT JOIN order_products op
          ON op.order_id = o.id

        LEFT JOIN order_packages pkg
          ON pkg.order_id = o.id

        WHERE
          o.id = ?
          AND o.user_id = ?

        LIMIT 1
      `;

    db.query(query, [orderId, userId], (error, rows) => {
      if (error) {
        return reject(error);
      }

      if (rows.length === 0) {
        return reject(new Error("Order not found"));
      }

      const firstRow = rows[0];

      const order = {
        id: firstRow.id,

        order_id: firstRow.order_id,

        user_id: firstRow.user_id,

        carrier: firstRow.carrier || "Delivery",

        consignment_no: firstRow.consignment_no || null,

        package_type: firstRow.package_type || null,

        manual_amount_including_gst: firstRow.manual_amount_including_gst || null,

        shipping_mode: firstRow.shipping_mode || null,

        pickup_address_id: firstRow.pickup_address_id,

        warehouse_id: firstRow.warehouse_id,

        party_identity_id: firstRow.party_identity_id || null,

        party_name: firstRow.party_name || null,

        party_reference_name: firstRow.party_reference_name || null,

        return_address_id: firstRow.return_address_id,

        return_name: firstRow.return_name,

        return_phone: firstRow.return_phone,

        return_email: firstRow.return_email,

        return_address_line1: firstRow.return_address_line1,

        return_address_line2: firstRow.return_address_line2,

        return_landmark: firstRow.return_landmark,

        return_pincode: firstRow.return_pincode,

        return_city: firstRow.return_city,

        return_state: firstRow.return_state,

        return_country: firstRow.return_country,

        awb: firstRow.awb,

        consignee_name: firstRow.consignee_name,

        mobile: firstRow.mobile,

        alternate_mobile: firstRow.alternate_mobile,

        email: firstRow.email,

        gstin: firstRow.gstin,

        company_name: firstRow.company_name,

        floor_no: firstRow.floor_no,

        landmark: firstRow.landmark,

        address_line1: firstRow.address_line1,

        address_line2: firstRow.address_line2,

        pincode: firstRow.pincode,

        city: firstRow.city,

        state: firstRow.state,

        country: firstRow.country,

        payment_type: firstRow.payment_type,

risk_type: firstRow.risk_type,

fragile_shipment: firstRow.fragile_shipment,

dangerous_good: firstRow.dangerous_good,

status: firstRow.status,

        created_at: firstRow.created_at,

        // ==================================================
        // SERVICE TYPE
        // ==================================================
        manifest_service_type: firstRow.manifest_service_type,

        pickup: {
          id: firstRow.pickup_address_id,

          address: firstRow.pickup_address,

          pincode: firstRow.pickup_pincode,

          city: firstRow.pickup_city,
        },

        warehouse: firstRow.warehouse_id
          ? {
              id: firstRow.warehouse_id_joined,

              warehouse_name: firstRow.warehouse_name,

              contact_name: firstRow.warehouse_contact_name,

              phone: firstRow.warehouse_phone,

              email: firstRow.warehouse_email,

              gstin: firstRow.warehouse_gstin,

              address_line1: firstRow.warehouse_address_line1,

              address_line2: firstRow.warehouse_address_line2,

              floor_no: firstRow.warehouse_floor_no,

              landmark: firstRow.warehouse_landmark,

              pincode: firstRow.warehouse_pincode,

              city: firstRow.warehouse_city,

              state: firstRow.warehouse_state,

              country: firstRow.warehouse_country,

              delhivery_registered: firstRow.delhivery_registered,

              status: firstRow.warehouse_status,
            }
          : null,

        products: [],
        packages: [],
      };

      const productKeys = new Set();

      const packageKeys = new Set();

      rows.forEach((row) => {
        if (
          row.product_name &&
          !productKeys.has(`${row.product_name}-${row.sku}`)
        ) {
          productKeys.add(`${row.product_name}-${row.sku}`);

          order.products.push({
            product_name: row.product_name,

            sku: row.sku,

            price: row.price,

            qty: row.qty,

            tax: row.tax,
          });
        }

        if (row.weight !== null && row.weight !== undefined) {
          const packageKey = [
            row.length,
            row.width,
            row.height,
            row.weight,
            row.package_count,
          ].join("-");

          if (!packageKeys.has(packageKey)) {
            packageKeys.add(packageKey);

            order.packages.push({
  length: row.length,
  width: row.width,
  height: row.height,
  weight: row.weight,
  package_count: row.package_count,
  volumetric_weight:
    row.volumetric_weight ??
    Number(
      (
        ((Number(row.length) || 0) *
          (Number(row.width) || 0) *
          (Number(row.height) || 0)) /
        5000
      ).toFixed(2)
    ),
});
          }
        }
      });

      return resolve(order);
    });
  });
};

// ======================================================
// UPDATE ORDER
// ======================================================

const updateOrder = (
  orderId,
  userId,
  orderData,
  pickupData,
  products,
  packages,
) => {
  return new Promise(async (resolve, reject) => {
    let connection;

    try {
      connection = await db.promise().getConnection();

      await connection.beginTransaction();

      const txQuery = (sql, params = []) => {
        return connection.query(sql, params).then(([rows]) => rows);
      };

      const orderRows = await txQuery(
        `
              SELECT
                id,
                order_id,
                pickup_address_id,
                warehouse_id
              FROM orders
              WHERE
                id = ?
                AND user_id = ?
                AND UPPER(status) = 'PROCESSING'
              LIMIT 1
            `,
        [orderId, userId],
      );

      if (orderRows.length === 0) {
        throw new Error("Processing order not found");
      }

      const pickupAddressId = orderRows[0].pickup_address_id;

      const existingWarehouseId = orderRows[0].warehouse_id;

      const requestedWarehouseId = Number(
        orderData?.warehouse_id || existingWarehouseId || 0,
      );

      if (!requestedWarehouseId) {
        throw new Error("Pickup warehouse is required");
      }

      const warehouseRows = await txQuery(
        `
              SELECT
                id,
                warehouse_name,
                delhivery_registered,
                status
              FROM warehouses
              WHERE
                id = ?
                AND user_id = ?
              LIMIT 1
            `,
        [requestedWarehouseId, userId],
      );

      if (warehouseRows.length === 0) {
        throw new Error("Selected pickup warehouse not found");
      }

      if (String(warehouseRows[0].status || "").toUpperCase() !== "ACTIVE") {
        throw new Error("Selected pickup warehouse is inactive");
      }

      if (Number(warehouseRows[0].delhivery_registered) !== 1) {
        throw new Error(
          "Selected pickup warehouse is not registered with Delhivery",
        );
      }

      await txQuery(
        `
            UPDATE orders
            SET
              warehouse_id = ?,
              party_identity_id = ?
            WHERE
              id = ?
              AND user_id = ?
              AND UPPER(status) = 'PROCESSING'
          `,
        [requestedWarehouseId, orderData.party_identity_id || null, orderId, userId],
      );

      await txQuery(
        `
            UPDATE pickup_addresses
            SET
              pickup_address = ?,
              pickup_pincode = ?,
              pickup_city = ?
            WHERE
              id = ?
              AND user_id = ?
          `,
        [
          pickupData?.pickup_address || "",

          pickupData?.pickup_pincode || "",

          pickupData?.pickup_city || null,

          pickupAddressId,
          userId,
        ],
      );

      await txQuery(
        `
            UPDATE orders
            SET
              consignee_name = ?,
              mobile = ?,
              alternate_mobile = ?,
              email = ?,

              gstin = ?,
              company_name = ?,
              floor_no = ?,
              landmark = ?,

              address_line1 = ?,
              address_line2 = ?,

              pincode = ?,
              city = ?,
              state = ?,
              country = ?,

             payment_type = ?,
risk_type = ?,
fragile_shipment = ?,
dangerous_good = ?

            WHERE
              id = ?
              AND user_id = ?
              AND UPPER(status) = 'PROCESSING'
          `,
        [
          orderData?.consignee_name || "",

          orderData?.mobile || "",

          orderData?.alternate_mobile || null,

          orderData?.email || null,

          orderData?.gstin || null,

          orderData?.company_name || null,

          orderData?.floor_no || null,

          orderData?.landmark || null,

          orderData?.address_line1 || "",

          orderData?.address_line2 || null,

          orderData?.pincode || "",

          orderData?.city || "",

          orderData?.state || "",

          orderData?.country || "India",

          orderData?.payment_type || "Prepaid",

orderData?.risk_type || "Owner Risk",

orderData?.fragile_shipment ? 1 : 0,

orderData?.dangerous_good ? 1 : 0,

orderId,
userId,
        ],
      );

      await txQuery(
        `
            DELETE FROM order_products
            WHERE order_id = ?
          `,
        [orderId],
      );

      if (Array.isArray(products)) {
        for (const product of products) {
          await txQuery(
            `
                INSERT INTO order_products
                (
                  order_id,
                  product_name,
                  sku,
                  price,
                  qty,
                  tax
                )
                VALUES (?, ?, ?, ?, ?, ?)
              `,
            [
              orderId,

              product?.product_name || "",

              product?.sku || null,

              Number(product?.price) || 0,

              Number(product?.qty) || 1,

              Number(product?.tax) || 0,
            ],
          );
        }
      }

      await txQuery(
        `
            DELETE FROM order_packages
            WHERE order_id = ?
          `,
        [orderId],
      );

  
if (Array.isArray(packages)) {
  for (const pkg of packages) {
    const length = Number(pkg?.length) || 0;
    const width = Number(pkg?.width) || 0;
    const height = Number(pkg?.height) || 0;
    const weight = Number(pkg?.weight) || 0;
    const packageCount = Number(pkg?.package_count) || 1;

    const volumetricWeight = Number(
      ((length * width * height) / 5000).toFixed(2)
    );

    await txQuery(
      `
        INSERT INTO order_packages
        (
          order_id,
          length,
          width,
          height,
          weight,
          package_count,
          volumetric_weight
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        orderId,
        length,
        width,
        height,
        weight,
        packageCount,
        volumetricWeight,
      ]
    );
  }
}


      await connection.commit();

      resolve({
        success: true,
        message: "Order updated successfully",
        order_id: orderId,
        warehouse_id: requestedWarehouseId,
      });
    } catch (error) {
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.log("Rollback error:", rollbackError);
        }
      }

      reject(error);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });
};

// ======================================================
// DELETE PROCESSING ORDERS
// ======================================================

const deleteProcessingOrders = (userId, orderIds) => {
  return new Promise(async (resolve, reject) => {
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return reject(new Error("No orders selected"));
    }

    try {
      const placeholders = orderIds.map(() => "?").join(",");

      const result = await runQuery(
        `
              DELETE FROM orders
              WHERE
                user_id = ?
                AND id IN (
                  ${placeholders}
                )
                AND UPPER(status) = 'PROCESSING'
            `,
        [userId, ...orderIds],
      );

      clearOrderStatusCountsCache(userId);

      return resolve({
        success: true,
        deleted: result.affectedRows,
      });
    } catch (error) {
      return reject(error);
    }
  });
};

// ======================================================
// SEARCH PREVIOUS CUSTOMERS
// ======================================================

const searchPreviousCustomers = (userId, search) => {
  return new Promise((resolve, reject) => {
    try {
      const term = String(search || "").trim();

      if (!userId || term.length < 2) {
        return resolve([]);
      }

      const query = `
        SELECT
          o.consignee_name,
          o.mobile,
          o.alternate_mobile,
          o.email,
          o.gstin,
          o.company_name,
          o.floor_no,
          o.landmark,
          o.address_line1,
          o.address_line2,
          o.pincode,
          o.city,
          o.state,
          o.country
        FROM orders o
        WHERE
          o.user_id = ?
          AND TRIM(COALESCE(o.consignee_name, '')) <> ''
          AND o.consignee_name LIKE ?
        ORDER BY o.id DESC
        LIMIT 30
      `;

      db.query(query, [Number(userId), `%${term}%`], (error, rows) => {
        if (error) {
          console.error("PREVIOUS CUSTOMER SEARCH DB ERROR:", error);

          return reject(error);
        }

        const seen = new Set();
        const customers = [];

        for (const row of rows || []) {
          const name = String(row.consignee_name || "")
            .trim()
            .toLowerCase();

          const mobile = String(row.mobile || "").trim();

          const key = `${name}|${mobile}`;

          if (seen.has(key)) {
            continue;
          }

          seen.add(key);

          customers.push(row);

          if (customers.length >= 10) {
            break;
          }
        }

        return resolve(customers);
      });
    } catch (error) {
      console.error("PREVIOUS CUSTOMER SEARCH ERROR:", error);

      reject(error);
    }
  });
};

// ======================================================
// SEARCH ORDER FOR TRACKING
// ======================================================

const searchOrderForTracking = (userId, search) => {
  return new Promise((resolve, reject) => {
    const term = String(search || "").trim();

    if (!userId || !term) {
      return resolve(null);
    }

    const query = `
      SELECT
        id,
        order_id,
        user_id,
        awb,
        status,
        tracking_status,
        tracking_data,
        tracking_updated_at,
        created_at
      FROM orders
      WHERE user_id = ?
        AND (
          CAST(order_id AS CHAR) = ?
          OR UPPER(TRIM(COALESCE(awb, ''))) = UPPER(?)
        )
      LIMIT 1
    `;

    db.query(query, [Number(userId), term, term], (error, rows) => {
      if (error) {
        return reject(error);
      }

      return resolve(rows?.[0] || null);
    });
  });
};

// ======================================================
// GET ORDER STATUS COUNTS (Optimized Parallel Query & Micro-Cache)
// ======================================================

const statusCountsCache = new Map();
const STATUS_COUNTS_CACHE_TTL = 3000;

const clearOrderStatusCountsCache = (userId) => {
  if (userId) {
    statusCountsCache.delete(Number(userId));
  } else {
    statusCountsCache.clear();
  }
};

const getOrderStatusCounts = async (userId) => {
  const numericUserId = Number(userId);
  if (!numericUserId) {
    throw new Error("Valid user ID is required");
  }

  const cached = statusCountsCache.get(numericUserId);
  if (cached && Date.now() - cached.timestamp < STATUS_COUNTS_CACHE_TTL) {
    return cached.data;
  }

  const ordersQuery = `
    SELECT
      SUM(CASE WHEN UPPER(TRIM(COALESCE(o.status, ''))) = 'PROCESSING' THEN 1 ELSE 0 END) AS processing_count,
      SUM(CASE WHEN UPPER(TRIM(COALESCE(o.status, ''))) <> 'PROCESSING' THEN 1 ELSE 0 END) AS all_count,
      SUM(CASE WHEN UPPER(TRIM(COALESCE(o.status, ''))) IN ('CANCELLED', 'CANCELED') OR UPPER(TRIM(COALESCE(o.tracking_status, ''))) IN ('CANCELLED', 'CANCELED') THEN 1 ELSE 0 END) AS cancelled_count,
      SUM(CASE WHEN UPPER(TRIM(COALESCE(o.status, ''))) <> 'PROCESSING' AND UPPER(TRIM(COALESCE(o.status, ''))) NOT IN ('CANCELLED', 'CANCELED') AND (UPPER(TRIM(COALESCE(o.tracking_status, ''))) = 'NOT PICKED' OR UPPER(TRIM(COALESCE(o.status, ''))) = 'NOT PICKED') THEN 1 ELSE 0 END) AS not_picked_count,
      SUM(CASE WHEN UPPER(TRIM(COALESCE(o.status, ''))) <> 'PROCESSING' AND UPPER(TRIM(COALESCE(o.status, ''))) NOT IN ('CANCELLED', 'CANCELED') AND (UPPER(TRIM(COALESCE(o.tracking_status, ''))) IN ('IN TRANSIT', 'IN_TRANSIT') OR UPPER(TRIM(COALESCE(o.status, ''))) IN ('IN TRANSIT', 'IN_TRANSIT')) THEN 1 ELSE 0 END) AS in_transit_count,
      SUM(CASE WHEN UPPER(TRIM(COALESCE(o.status, ''))) <> 'PROCESSING' AND UPPER(TRIM(COALESCE(o.status, ''))) NOT IN ('CANCELLED', 'CANCELED') AND (UPPER(TRIM(COALESCE(o.tracking_status, ''))) IN ('OUT FOR DELIVERY', 'OUT_FOR_DELIVERY', 'OFD') OR UPPER(TRIM(COALESCE(o.status, ''))) IN ('OUT FOR DELIVERY', 'OUT_FOR_DELIVERY', 'OFD')) THEN 1 ELSE 0 END) AS out_for_delivery_count,
      SUM(CASE WHEN UPPER(TRIM(COALESCE(o.status, ''))) <> 'PROCESSING' AND UPPER(TRIM(COALESCE(o.status, ''))) NOT IN ('CANCELLED', 'CANCELED') AND (UPPER(TRIM(COALESCE(o.tracking_status, ''))) = 'DELIVERED' OR UPPER(TRIM(COALESCE(o.status, ''))) = 'DELIVERED') THEN 1 ELSE 0 END) AS delivered_count,
      SUM(CASE WHEN UPPER(TRIM(COALESCE(o.status, ''))) <> 'PROCESSING' AND UPPER(TRIM(COALESCE(o.status, ''))) NOT IN ('CANCELLED', 'CANCELED') AND (UPPER(TRIM(COALESCE(o.tracking_status, ''))) IN ('RTO IN TRANSIT', 'RTO_IN_TRANSIT') OR UPPER(TRIM(COALESCE(o.status, ''))) IN ('RTO IN TRANSIT', 'RTO_IN_TRANSIT')) THEN 1 ELSE 0 END) AS rto_in_transit_count,
      SUM(CASE WHEN UPPER(TRIM(COALESCE(o.status, ''))) <> 'PROCESSING' AND UPPER(TRIM(COALESCE(o.status, ''))) NOT IN ('CANCELLED', 'CANCELED') AND (UPPER(TRIM(COALESCE(o.tracking_status, ''))) IN ('RTO DELIVERED', 'RTO_DELIVERED') OR UPPER(TRIM(COALESCE(o.status, ''))) IN ('RTO DELIVERED', 'RTO_DELIVERED')) THEN 1 ELSE 0 END) AS rto_delivered_count,
      SUM(CASE WHEN UPPER(TRIM(COALESCE(o.status, ''))) <> 'PROCESSING' AND UPPER(TRIM(COALESCE(o.status, ''))) NOT IN ('CANCELLED', 'CANCELED') AND (UPPER(TRIM(COALESCE(o.tracking_status, ''))) = 'RETURNED' OR UPPER(TRIM(COALESCE(o.status, ''))) = 'RETURNED') THEN 1 ELSE 0 END) AS returned_count,
      SUM(CASE WHEN UPPER(TRIM(COALESCE(o.status, ''))) <> 'PROCESSING' AND UPPER(TRIM(COALESCE(o.status, ''))) NOT IN ('CANCELLED', 'CANCELED') AND (UPPER(TRIM(COALESCE(o.tracking_status, ''))) = 'PENDING' OR UPPER(TRIM(COALESCE(o.status, ''))) = 'PENDING') THEN 1 ELSE 0 END) AS pending_count
    FROM orders o
    WHERE o.user_id = ?
  `;

  const manifestsQuery = `
    SELECT COUNT(DISTINCT m.order_id) AS manifested_count
    FROM manifests m
    INNER JOIN orders o
      ON o.id = m.order_id
     AND o.user_id = m.user_id
    WHERE m.user_id = ?
      AND UPPER(TRIM(COALESCE(m.status, ''))) = 'CONFIRMED'
      AND UPPER(TRIM(COALESCE(o.status, ''))) IN ('MANIFESTED', 'NOT PICKED')
  `;

  const [orderRowsResult, manifestRowsResult] = await Promise.all([
    db.promise().query(ordersQuery, [numericUserId]),
    db.promise().query(manifestsQuery, [numericUserId]),
  ]);

  let offlineCount = 0;
  try {
    const [offlineResult] = await db
      .promise()
      .query(
        "SELECT COUNT(*) AS offline_count FROM offline_orders WHERE user_id = ?",
        [numericUserId]
      );
    offlineCount = Number(offlineResult[0]?.offline_count || 0);
  } catch (err) {
    offlineCount = 0;
  }

  const row = orderRowsResult[0]?.[0] || {};
  const manifestedRow = manifestRowsResult[0]?.[0] || {};

  const result = {
    ALL: Number(row.all_count || 0),
    PROCESSING: Number(row.processing_count || 0),
    MANIFESTED: Number(manifestedRow.manifested_count || 0),
    "NOT PICKED": Number(row.not_picked_count || 0),
    "IN TRANSIT": Number(row.in_transit_count || 0),
    "OUT FOR DELIVERY": Number(row.out_for_delivery_count || 0),
    DELIVERED: Number(row.delivered_count || 0),
    "RTO IN TRANSIT": Number(row.rto_in_transit_count || 0),
    "RTO DELIVERED": Number(row.rto_delivered_count || 0),
    RETURNED: Number(row.returned_count || 0),
    CANCELLED: Number(row.cancelled_count || 0),
    PENDING: Number(row.pending_count || 0),
    OFFLINE: offlineCount,
    OFFLINE_ORDERS: offlineCount,
  };

  statusCountsCache.set(numericUserId, {
    timestamp: Date.now(),
    data: result,
  });

  return result;
};

// ======================================================
// GET UNIFIED DASHBOARD SUMMARY (FAST SINGLE ROUND-TRIP)
// ======================================================

const getDashboardSummary = async (userId) => {
  const numericUserId = Number(userId);
  if (!numericUserId || !Number.isInteger(numericUserId) || numericUserId <= 0) {
    throw new Error("Valid user ID is required");
  }

  const promiseDb = db.promise();

  const [walletResult, countsResult, ordersResult] = await Promise.all([
    promiseDb.query(
      `SELECT balance FROM wallets WHERE user_id = ? LIMIT 1`,
      [numericUserId]
    ),
    getOrderStatusCounts(numericUserId),
    promiseDb.query(
      `SELECT
         o.id,
         o.order_id,
         o.user_id,
         o.awb,
         o.consignee_name,
         o.payment_type,
         o.status,
         CASE
           WHEN UPPER(TRIM(COALESCE(o.status, ''))) IN ('CANCELLED', 'CANCELED') THEN 'CANCELLED'
           ELSE o.tracking_status
         END AS tracking_status,
         o.created_at
       FROM orders o
       WHERE o.user_id = ?
       ORDER BY o.id DESC
       LIMIT 6`,
      [numericUserId]
    ),
  ]);

  const walletRows = walletResult[0] || [];
  const balance = Number(walletRows[0]?.balance || 0);
  const statusCounts = countsResult || {};
  const orders = ordersResult[0] || [];

  return {
    walletBalance: balance,
    statusCounts,
    orders,
  };
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  createPickupAddress,
  createOrder,
  createProduct,
  createPackage,
  getProcessingOrders,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteProcessingOrders,
  searchPreviousCustomers,
  searchOrderForTracking,
  getOrderStatusCounts,
  clearOrderStatusCountsCache,
  getDashboardSummary,
};


