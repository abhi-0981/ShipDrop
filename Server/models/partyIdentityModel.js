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
// GET ALL PARTY IDENTITIES FOR A USER (ACTIVE ONLY)
// ============================================================

const getPartyIdentitiesByUser = async (userId) => {
  const sql = `
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
      COUNT(o.id) AS linked_orders_count
    FROM party_identities pi
    LEFT JOIN orders o
      ON o.party_identity_id = pi.id
      AND o.user_id = pi.user_id
    WHERE pi.user_id = ?
      AND (pi.is_deleted = 0 OR pi.is_deleted IS NULL)
    GROUP BY pi.id, pi.user_id, pi.name, pi.reference_name, pi.company_name, pi.gst_no, pi.phone_no, pi.address, pi.created_at, pi.updated_at
    ORDER BY pi.name ASC
  `;

  const rows = await query(sql, [userId]);
  return rows;
};

// ============================================================
// GET SINGLE PARTY IDENTITY BY ID & USER (ACTIVE ONLY)
// ============================================================

const getPartyIdentityById = async (id, userId) => {
  const sql = `
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
      COUNT(o.id) AS linked_orders_count
    FROM party_identities pi
    LEFT JOIN orders o
      ON o.party_identity_id = pi.id
      AND o.user_id = pi.user_id
    WHERE pi.id = ?
      AND pi.user_id = ?
      AND (pi.is_deleted = 0 OR pi.is_deleted IS NULL)
    GROUP BY pi.id, pi.user_id, pi.name, pi.reference_name, pi.company_name, pi.gst_no, pi.phone_no, pi.address, pi.created_at, pi.updated_at
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
      AND (is_deleted = 0 OR is_deleted IS NULL)
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
// CREATE PARTY IDENTITY (RESTORING IF PREVIOUSLY SOFT-DELETED)
// ============================================================

const createPartyIdentity = async ({
  userId,
  name,
  referenceName = null,
  companyName = null,
  gstNo = null,
  phoneNo = null,
  address = null,
}) => {
  const cleanName = String(name || "").trim();
  const cleanRef = referenceName ? String(referenceName).trim() : null;
  const cleanCompany = companyName ? String(companyName).trim() : null;
  const cleanGst = gstNo ? String(gstNo).trim().toUpperCase() : null;
  const cleanPhone = phoneNo ? String(phoneNo).trim() : null;
  const cleanAddress = address ? String(address).trim() : null;

  // Check if a soft-deleted party with this name exists for this user
  const checkDeletedSql = `
    SELECT id FROM party_identities
    WHERE user_id = ? AND LOWER(TRIM(name)) = LOWER(?) AND is_deleted = 1
    LIMIT 1
  `;
  const deletedRows = await query(checkDeletedSql, [userId, cleanName]);

  if (deletedRows && deletedRows.length > 0) {
    const existingId = deletedRows[0].id;
    const restoreSql = `
      UPDATE party_identities
      SET
        name = ?,
        reference_name = ?,
        company_name = ?,
        gst_no = ?,
        phone_no = ?,
        address = ?,
        is_deleted = 0,
        deleted_at = NULL,
        updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `;
    await query(restoreSql, [
      cleanName,
      cleanRef,
      cleanCompany,
      cleanGst,
      cleanPhone,
      cleanAddress,
      existingId,
      userId,
    ]);

    return {
      id: existingId,
      user_id: userId,
      name: cleanName,
      reference_name: cleanRef,
      company_name: cleanCompany,
      gst_no: cleanGst,
      phone_no: cleanPhone,
      address: cleanAddress,
    };
  }

  const sql = `
    INSERT INTO party_identities (
      user_id,
      name,
      reference_name,
      company_name,
      gst_no,
      phone_no,
      address,
      is_deleted,
      deleted_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL)
  `;

  const result = await query(sql, [
    userId,
    cleanName,
    cleanRef,
    cleanCompany,
    cleanGst,
    cleanPhone,
    cleanAddress,
  ]);

  return {
    id: result.insertId,
    user_id: userId,
    name: cleanName,
    reference_name: cleanRef,
    company_name: cleanCompany,
    gst_no: cleanGst,
    phone_no: cleanPhone,
    address: cleanAddress,
  };
};

// ============================================================
// UPDATE PARTY IDENTITY
// ============================================================

const updatePartyIdentity = async (
  id,
  userId,
  {
    name,
    referenceName = null,
    companyName = null,
    gstNo = null,
    phoneNo = null,
    address = null,
  }
) => {
  const cleanName = String(name || "").trim();
  const cleanRef = referenceName ? String(referenceName).trim() : null;
  const cleanCompany = companyName ? String(companyName).trim() : null;
  const cleanGst = gstNo ? String(gstNo).trim().toUpperCase() : null;
  const cleanPhone = phoneNo ? String(phoneNo).trim() : null;
  const cleanAddress = address ? String(address).trim() : null;

  const sql = `
    UPDATE party_identities
    SET
      name = ?,
      reference_name = ?,
      company_name = ?,
      gst_no = ?,
      phone_no = ?,
      address = ?
    WHERE id = ?
      AND user_id = ?
      AND (is_deleted = 0 OR is_deleted IS NULL)
  `;

  const result = await query(sql, [
    cleanName,
    cleanRef,
    cleanCompany,
    cleanGst,
    cleanPhone,
    cleanAddress,
    id,
    userId,
  ]);

  return result.affectedRows > 0;
};

// ============================================================
// SOFT DELETE PARTY IDENTITY (PRESERVED FOR ADMIN AUDITING)
// ============================================================

const deletePartyIdentity = async (id, userId) => {
  const sql = `
    UPDATE party_identities
    SET
      is_deleted = 1,
      deleted_at = NOW()
    WHERE id = ?
      AND user_id = ?
  `;

  const result = await query(sql, [id, userId]);
  return result.affectedRows > 0;
};

module.exports = {
  getPartyIdentitiesByUser,
  getPartyIdentityById,
  checkDuplicatePartyIdentity,
  createPartyIdentity,
  updatePartyIdentity,
  deletePartyIdentity,
};
