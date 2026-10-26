const db = require("../config/db");

// ========================================================
// GET ALL PARTY IDENTITIES - ADMIN
// ========================================================
const getAdminParties = async (req, res) => {
  try {
    const { user_id, search, gst_filter } = req.query || {};

    let query = `
      SELECT
        pi.id,
        pi.user_id,
        pi.name,
        pi.reference_name,
        pi.company_name,
        pi.gst_no,
        pi.phone_no,
        pi.address,
        pi.created_at,
        pi.updated_at,
        u.full_name AS user_name,
        u.company_name AS user_company,
        u.email AS user_email,
        u.phone_no AS user_phone,
        COUNT(DISTINCT o.id) AS linked_orders_count
      FROM party_identities pi
      LEFT JOIN users u ON u.id = pi.user_id
      LEFT JOIN orders o ON o.party_identity_id = pi.id
      WHERE 1=1
    `;
    const params = [];

    if (user_id && user_id !== "ALL") {
      query += ` AND pi.user_id = ?`;
      params.push(Number(user_id));
    }

    if (gst_filter && gst_filter !== "ALL") {
      if (gst_filter === "WITH_GST") {
        query += ` AND pi.gst_no IS NOT NULL AND TRIM(pi.gst_no) != ''`;
      } else if (gst_filter === "WITHOUT_GST") {
        query += ` AND (pi.gst_no IS NULL OR TRIM(pi.gst_no) = '')`;
      }
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      query += ` AND (
        pi.name LIKE ? OR
        pi.reference_name LIKE ? OR
        pi.company_name LIKE ? OR
        pi.gst_no LIKE ? OR
        pi.phone_no LIKE ? OR
        pi.address LIKE ? OR
        u.full_name LIKE ? OR
        u.company_name LIKE ? OR
        u.email LIKE ? OR
        u.phone_no LIKE ?
      )`;
      params.push(q, q, q, q, q, q, q, q, q, q);
    }

    query += `
      GROUP BY pi.id, pi.user_id, pi.name, pi.reference_name, pi.company_name, pi.gst_no, pi.phone_no, pi.address, pi.created_at, pi.updated_at, u.full_name, u.company_name, u.email, u.phone_no
      ORDER BY pi.id DESC
    `;

    const [parties] = await db.query(query, params);

    // Compute stats
    let stats = {
      total_parties: 0,
      total_users: 0,
      gst_registered: 0,
      non_gst: 0,
    };

    try {
      const [statsResult] = await db.query(`
        SELECT
          COUNT(*) AS total_parties,
          COUNT(DISTINCT user_id) AS total_users,
          SUM(CASE WHEN gst_no IS NOT NULL AND TRIM(gst_no) != '' THEN 1 ELSE 0 END) AS gst_registered,
          SUM(CASE WHEN gst_no IS NULL OR TRIM(gst_no) = '' THEN 1 ELSE 0 END) AS non_gst
        FROM party_identities
      `);
      if (statsResult && statsResult[0]) {
        stats = {
          total_parties: Number(statsResult[0].total_parties || 0),
          total_users: Number(statsResult[0].total_users || 0),
          gst_registered: Number(statsResult[0].gst_registered || 0),
          non_gst: Number(statsResult[0].non_gst || 0),
        };
      }
    } catch (err) {
      console.warn("Party stats query warning:", err.message);
    }

    return res.status(200).json({
      success: true,
      parties: parties || [],
      stats,
    });
  } catch (error) {
    console.error("Get admin parties error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch party identities",
    });
  }
};

module.exports = {
  getAdminParties,
};
