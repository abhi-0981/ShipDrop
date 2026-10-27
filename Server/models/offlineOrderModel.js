const db = require("../config/db");

// ======================================================
// CREATE OFFLINE ORDER
// ======================================================
const createOfflineOrder = (orderData, callback) => {
  const query = `
    INSERT INTO offline_orders (
      user_id,
      party_identity_id,
      carrier,
      consignment_no,
      consignee_name,
      mobile,
      address,
      pincode,
      city,
      state,
      package_type,
      amount,
      shipping_mode,
      product_name,
      shipping_charge,
      payment_mode,
      length,
      width,
      height,
      weight,
      remark,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    Number(orderData.user_id),
    orderData.party_identity_id ? Number(orderData.party_identity_id) : null,
    String(orderData.carrier || "").trim(),
    String(orderData.consignment_no || "").trim(),
    String(orderData.consignee_name || "").trim(),
    String(orderData.mobile || "").trim(),
    orderData.address ? String(orderData.address).trim() : null,
    String(orderData.pincode || "").trim(),
    String(orderData.city || "").trim(),
    String(orderData.state || "").trim(),
    String(orderData.package_type || "Box").trim(),
    Number(orderData.amount) || 0,
    String(orderData.shipping_mode || "Surface").trim(),
    orderData.product_name ? String(orderData.product_name).trim() : null,
    Number(orderData.shipping_charge) || 0,
    String(orderData.payment_mode || "Prepaid").trim(),
    Number(orderData.length) || 0,
    Number(orderData.width) || 0,
    Number(orderData.height) || 0,
    Number(orderData.weight) || 0,
    orderData.remark ? String(orderData.remark).trim() : null,
    "Booked",
  ];

  db.query(query, values, (error, result) => {
    if (error) {
      return callback(error, null);
    }
    return callback(null, { id: result.insertId, ...orderData, status: "Booked" });
  });
};

// ======================================================
// GET ALL OFFLINE ORDERS
// ======================================================
const getOfflineOrders = (userId, options = {}, callback) => {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options.limit) || 50));
  const offset = (page - 1) * limit;

  const search = String(options.search || "").trim();
  const partyId = options.party_identity_id ? Number(options.party_identity_id) : null;
  const carrier = String(options.carrier || "").trim();
  const paymentMode = String(options.payment_mode || "").trim();

  let whereClause = "WHERE oo.user_id = ?";
  const queryParams = [Number(userId)];
  const countParams = [Number(userId)];

  if (search) {
    whereClause += ` AND (
      oo.consignment_no LIKE ?
      OR oo.consignee_name LIKE ?
      OR oo.mobile LIKE ?
      OR oo.product_name LIKE ?
      OR oo.carrier LIKE ?
      OR pi.name LIKE ?
      OR pi.reference_name LIKE ?
      OR oo.city LIKE ?
    )`;
    const wildcard = `%${search}%`;
    for (let i = 0; i < 8; i++) {
      queryParams.push(wildcard);
      countParams.push(wildcard);
    }
  }

  if (partyId) {
    whereClause += " AND oo.party_identity_id = ?";
    queryParams.push(partyId);
    countParams.push(partyId);
  }

  if (carrier && carrier !== "ALL") {
    whereClause += " AND UPPER(oo.carrier) = UPPER(?)";
    queryParams.push(carrier);
    countParams.push(carrier);
  }

  if (paymentMode && paymentMode !== "ALL") {
    whereClause += " AND UPPER(oo.payment_mode) = UPPER(?)";
    queryParams.push(paymentMode);
    countParams.push(paymentMode);
  }

  const query = `
    SELECT
      oo.*,
      pi.name AS party_name,
      pi.reference_name AS party_reference_name,
      pi.company_name AS party_company_name
    FROM offline_orders oo
    LEFT JOIN party_identities pi
      ON pi.id = oo.party_identity_id
      AND pi.user_id = oo.user_id
    ${whereClause}
    ORDER BY oo.id DESC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(oo.id) AS total
    FROM offline_orders oo
    LEFT JOIN party_identities pi
      ON pi.id = oo.party_identity_id
      AND pi.user_id = oo.user_id
    ${whereClause}
  `;

  queryParams.push(limit, offset);

  db.query(countQuery, countParams, (countErr, countResult) => {
    if (countErr) {
      return callback(countErr, null);
    }

    const total = countResult?.[0]?.total || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    db.query(query, queryParams, (err, rows) => {
      if (err) {
        return callback(err, null);
      }
      return callback(null, {
        orders: rows || [],
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      });
    });
  });
};

// ======================================================
// DELETE OFFLINE ORDER
// ======================================================
const deleteOfflineOrder = (id, userId, callback) => {
  const query = `DELETE FROM offline_orders WHERE id = ? AND user_id = ?`;
  db.query(query, [Number(id), Number(userId)], (err, result) => {
    if (err) return callback(err, null);
    return callback(null, result.affectedRows > 0);
  });
};

// ======================================================
// UPDATE OFFLINE ORDER
// ======================================================
const updateOfflineOrder = (id, userId, orderData, callback) => {
  const query = `
    UPDATE offline_orders SET
      party_identity_id = ?,
      carrier = ?,
      consignment_no = ?,
      consignee_name = ?,
      mobile = ?,
      address = ?,
      pincode = ?,
      city = ?,
      state = ?,
      package_type = ?,
      amount = ?,
      shipping_mode = ?,
      product_name = ?,
      shipping_charge = ?,
      payment_mode = ?,
      length = ?,
      width = ?,
      height = ?,
      weight = ?,
      remark = ?
    WHERE id = ? AND user_id = ?
  `;

  const values = [
    orderData.party_identity_id ? Number(orderData.party_identity_id) : null,
    String(orderData.carrier || "").trim(),
    String(orderData.consignment_no || "").trim(),
    String(orderData.consignee_name || "").trim(),
    String(orderData.mobile || "").trim(),
    orderData.address ? String(orderData.address).trim() : null,
    String(orderData.pincode || "").trim(),
    String(orderData.city || "").trim(),
    String(orderData.state || "").trim(),
    String(orderData.package_type || "Box").trim(),
    Number(orderData.amount) || 0,
    String(orderData.shipping_mode || "Surface").trim(),
    orderData.product_name ? String(orderData.product_name).trim() : null,
    Number(orderData.shipping_charge) || 0,
    String(orderData.payment_mode || "Prepaid").trim(),
    Number(orderData.length) || 0,
    Number(orderData.width) || 0,
    Number(orderData.height) || 0,
    Number(orderData.weight) || 0,
    orderData.remark !== undefined ? (orderData.remark ? String(orderData.remark).trim() : null) : null,
    Number(id),
    Number(userId),
  ];

  db.query(query, values, (error, result) => {
    if (error) {
      return callback(error, null);
    }
    if (result.affectedRows === 0) {
      return callback(null, null);
    }
    return callback(null, { id: Number(id), ...orderData, status: "Booked" });
  });
};

module.exports = {
  createOfflineOrder,
  getOfflineOrders,
  updateOfflineOrder,
  deleteOfflineOrder,
};
