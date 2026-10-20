const db = require("../config/db");

// ============================================================
// QUERY HELPER (PROMISE-BASED)
// ============================================================

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, result) => {
      if (error) {
        return reject(error);
      }
      return resolve(result);
    });
  });
};

// ============================================================
// GET ALL PARTY IDENTITIES FOR A USER
// ============================================================

const getPartyIdentitiesByUser = async (userId) => {
  const sql = `
    SELECT
      pi.id,
      pi.user_id,
      pi.name,
      pi.created_at,
      pi.updated_at,
      COUNT(o.id) AS linked_orders_count
    FROM party_identities pi
    LEFT JOIN orders o
      ON o.party_identity_id = pi.id
      AND o.user_id = pi.user_id
    WHERE pi.user_id = ?
    GROUP BY pi.id, pi.user_id, pi.name, pi.created_at, pi.updated_at
    ORDER BY pi.name ASC
  `;

  const rows = await query(sql, [userId]);
  return rows;
};

// ============================================================
// GET SINGLE PARTY IDENTITY BY ID & USER
// ============================================================

const getPartyIdentityById = async (id, userId) => {
  const sql = `
    SELECT
      pi.id,
      pi.user_id,
      pi.name,
      pi.created_at,
      pi.updated_at,
      COUNT(o.id) AS linked_orders_count
    FROM party_identities pi
    LEFT JOIN orders o
      ON o.party_identity_id = pi.id
      AND o.user_id = pi.user_id
    WHERE pi.id = ?
      AND pi.user_id = ?
    GROUP BY pi.id, pi.user_id, pi.name, pi.created_at, pi.updated_at
    LIMIT 1
  `;

  const rows = await query(sql, [id, userId]);
  return rows.length > 0 ? rows[0] : null;
};

// ============================================================
// CHECK DUPLICATE PARTY IDENTITY NAME FOR A USER
// ============================================================

const checkDuplicatePartyIdentity = async (name, userId, excludeId = null) => {
  const cleanName = String(name || "").trim().toLowerCase();

  let sql = `
    SELECT id, name
    FROM party_identities
    WHERE user_id = ?
      AND LOWER(TRIM(name)) = LOWER(?)
  `;
  const params = [userId, cleanName];

  if (excludeId) {
    sql += ` AND id <> ?`;
    params.push(excludeId);
  }

  sql += ` LIMIT 1`;

  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
};

// ============================================================
// CREATE PARTY IDENTITY
// ============================================================

const createPartyIdentity = async ({ userId, name }) => {
  const cleanName = String(name || "").trim();

  const sql = `
    INSERT INTO party_identities (user_id, name)
    VALUES (?, ?)
  `;

  const result = await query(sql, [userId, cleanName]);
  return {
    id: result.insertId,
    user_id: userId,
    name: cleanName,
  };
};

// ============================================================
// UPDATE PARTY IDENTITY
// ============================================================

const updatePartyIdentity = async (id, userId, { name }) => {
  const cleanName = String(name || "").trim();

  const sql = `
    UPDATE party_identities
    SET name = ?
    WHERE id = ?
      AND user_id = ?
  `;

  const result = await query(sql, [cleanName, id, userId]);
  return result.affectedRows > 0;
};

// ============================================================
// DELETE PARTY IDENTITY (SAFELY UNLINKS ORDERS)
// ============================================================

const deletePartyIdentity = async (id, userId) => {
  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    // 1. Safely unassign linked orders without deleting the orders
    await connection.query(
      `
      UPDATE orders
      SET party_identity_id = NULL
      WHERE party_identity_id = ?
        AND user_id = ?
      `,
      [id, userId]
    );

    // 2. Delete the party identity record
    const [result] = await connection.query(
      `
      DELETE FROM party_identities
      WHERE id = ?
        AND user_id = ?
      `,
      [id, userId]
    );

    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  getPartyIdentitiesByUser,
  getPartyIdentityById,
  checkDuplicatePartyIdentity,
  createPartyIdentity,
  updatePartyIdentity,
  deletePartyIdentity,
};
