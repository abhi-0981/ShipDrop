const db = require("../config/db");

// ========================================================
// GET ALL PICKUP ADDRESSES (WAREHOUSES) - ADMIN
// ========================================================
const getAdminPickupAddresses = async (req, res) => {
  try {
    const { user_id, search, state, status } = req.query || {};

    let query = `
      SELECT
        w.id,
        w.user_id,
        w.warehouse_name,
        w.contact_name,
        w.phone,
        w.email,
        w.gstin,
        w.address_line1,
        w.address_line2,
        w.floor_no,
        w.landmark,
        w.pincode,
        w.city,
        w.state,
        w.country,
        w.return_address,
        w.return_city,
        w.return_pincode,
        w.return_state,
        w.return_country,
        w.delhivery_registered,
        w.status,
        w.is_deleted,
        w.deleted_at,
        w.created_at,
        w.updated_at,
        u.full_name AS user_name,
        u.company_name AS user_company,
        u.email AS user_email,
        u.phone_no AS user_phone
      FROM warehouses w
      LEFT JOIN users u ON u.id = w.user_id
      WHERE 1=1
    `;
    const params = [];

    if (user_id && user_id !== "ALL") {
      query += ` AND w.user_id = ?`;
      params.push(Number(user_id));
    }

    if (state && state !== "ALL") {
      query += ` AND LOWER(TRIM(w.state)) = LOWER(TRIM(?))`;
      params.push(state);
    }

    if (status && status !== "ALL") {
      if (status === "DELETED") {
        query += ` AND w.is_deleted = 1`;
      } else if (status === "ACTIVE_ONLY") {
        query += ` AND (w.is_deleted = 0 OR w.is_deleted IS NULL)`;
      } else if (status === "REGISTERED") {
        query += ` AND (w.delhivery_registered = 1 OR LOWER(w.status) = 'active') AND (w.is_deleted = 0 OR w.is_deleted IS NULL)`;
      } else if (status === "UNREGISTERED") {
        query += ` AND (w.delhivery_registered = 0 OR w.delhivery_registered IS NULL) AND (w.is_deleted = 0 OR w.is_deleted IS NULL)`;
      }
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      query += ` AND (
        w.warehouse_name LIKE ? OR
        w.contact_name LIKE ? OR
        w.phone LIKE ? OR
        w.email LIKE ? OR
        w.address_line1 LIKE ? OR
        w.address_line2 LIKE ? OR
        w.pincode LIKE ? OR
        w.city LIKE ? OR
        w.state LIKE ? OR
        w.gstin LIKE ? OR
        u.full_name LIKE ? OR
        u.company_name LIKE ? OR
        u.email LIKE ? OR
        u.phone_no LIKE ?
      )`;
      params.push(q, q, q, q, q, q, q, q, q, q, q, q, q, q);
    }

    query += ` ORDER BY w.id DESC`;

    const [addresses] = await db.query(query, params);

    // Compute stats
    let stats = {
      total_addresses: 0,
      total_users: 0,
      registered_count: 0,
      deleted_count: 0,
      active_count: 0,
      total_states: 0,
    };

    try {
      const [statsResult] = await db.query(`
        SELECT
          COUNT(*) AS total_addresses,
          COUNT(DISTINCT user_id) AS total_users,
          SUM(CASE WHEN is_deleted = 1 THEN 1 ELSE 0 END) AS deleted_count,
          SUM(CASE WHEN is_deleted = 0 OR is_deleted IS NULL THEN 1 ELSE 0 END) AS active_count,
          SUM(CASE WHEN (delhivery_registered = 1 OR LOWER(status) = 'active') AND (is_deleted = 0 OR is_deleted IS NULL) THEN 1 ELSE 0 END) AS registered_count,
          COUNT(DISTINCT state) AS total_states
        FROM warehouses
      `);
      if (statsResult && statsResult[0]) {
        stats = {
          total_addresses: Number(statsResult[0].total_addresses || 0),
          total_users: Number(statsResult[0].total_users || 0),
          registered_count: Number(statsResult[0].registered_count || 0),
          deleted_count: Number(statsResult[0].deleted_count || 0),
          active_count: Number(statsResult[0].active_count || 0),
          total_states: Number(statsResult[0].total_states || 0),
        };
      }
    } catch (sErr) {
      console.warn("Pickup stats query warning:", sErr.message);
    }

    // Get list of distinct states for filter
    let states = [];
    try {
      const [statesResult] = await db.query(`
        SELECT DISTINCT state 
        FROM warehouses 
        WHERE state IS NOT NULL AND TRIM(state) != '' 
        ORDER BY state ASC
      `);
      states = (statesResult || []).map((s) => s.state).filter(Boolean);
    } catch (stErr) {
      console.warn("Pickup states query warning:", stErr.message);
    }

    return res.status(200).json({
      success: true,
      addresses: addresses || [],
      stats,
      states,
    });
  } catch (error) {
    console.error("Get admin pickup addresses error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch pickup addresses",
    });
  }
};

module.exports = {
  getAdminPickupAddresses,
};
