const db = require("../config/db");

// ============================================================
// QUERY HELPER
// ============================================================

const query = (
  sql,
  params = []
) => {
  return new Promise(
    (resolve, reject) => {
      db.query(
        sql,
        params,
        (error, result) => {
          if (error) {
            return reject(error);
          }

          return resolve(result);
        }
      );
    }
  );
};


// ============================================================
// GET ALL RETURN ADDRESSES
// ============================================================

const getReturnAddresses = async (
  userId
) => {
  const rows = await query(
    `
      SELECT
        id,
        user_id,
        name,
        phone,
        email,
        address_line1,
        address_line2,
        landmark,
        pincode,
        city,
        state,
        country,
        is_default,
        status,
        created_at,
        updated_at
      FROM return_addresses
      WHERE
        user_id = ?
        AND status = 'ACTIVE'
      ORDER BY
        is_default DESC,
        id DESC
    `,
    [userId]
  );

  return rows;
};


// ============================================================
// GET SINGLE RETURN ADDRESS
// ============================================================

const getReturnAddressById = async (
  id,
  userId
) => {
  const rows = await query(
    `
      SELECT
        id,
        user_id,
        name,
        phone,
        email,
        address_line1,
        address_line2,
        landmark,
        pincode,
        city,
        state,
        country,
        is_default,
        status,
        created_at,
        updated_at
      FROM return_addresses
      WHERE
        id = ?
        AND user_id = ?
      LIMIT 1
    `,
    [
      id,
      userId,
    ]
  );

  return rows.length > 0
    ? rows[0]
    : null;
};


// ============================================================
// GET DEFAULT RETURN ADDRESS
// ============================================================

const getDefaultReturnAddress = async (
  userId
) => {
  const rows = await query(
    `
      SELECT
        id,
        user_id,
        name,
        phone,
        email,
        address_line1,
        address_line2,
        landmark,
        pincode,
        city,
        state,
        country,
        is_default,
        status,
        created_at,
        updated_at
      FROM return_addresses
      WHERE
        user_id = ?
        AND status = 'ACTIVE'
        AND is_default = 1
      ORDER BY id DESC
      LIMIT 1
    `,
    [userId]
  );

  return rows.length > 0
    ? rows[0]
    : null;
};


// ============================================================
// CREATE RETURN ADDRESS
// ============================================================

const createReturnAddress = async (
  data
) => {
  const {
    user_id,
    name,
    phone,
    email,
    address_line1,
    address_line2,
    landmark,
    pincode,
    city,
    state,
    country = "India",
    is_default = false,
  } = data;

  // ----------------------------------------------------------
  // CHECK WHETHER USER ALREADY HAS AN ACTIVE RETURN ADDRESS
  // ----------------------------------------------------------

  const existingRows = await query(
    `
      SELECT
        id
      FROM return_addresses
      WHERE
        user_id = ?
        AND status = 'ACTIVE'
      LIMIT 1
    `,
    [user_id]
  );

  /*
   * First return address of a user must automatically
   * become the default return address.
   */
  const shouldBeDefault =
    existingRows.length === 0 ||
    Boolean(is_default);


  // ----------------------------------------------------------
  // IF NEW ADDRESS IS DEFAULT
  // CLEAR EXISTING DEFAULT
  // ----------------------------------------------------------

  if (shouldBeDefault) {
    await query(
      `
        UPDATE return_addresses
        SET
          is_default = 0,
          updated_at = CURRENT_TIMESTAMP
        WHERE
          user_id = ?
          AND is_default = 1
      `,
      [user_id]
    );
  }


  // ----------------------------------------------------------
  // INSERT
  // ----------------------------------------------------------

  const result = await query(
    `
      INSERT INTO return_addresses
      (
        user_id,
        name,
        phone,
        email,
        address_line1,
        address_line2,
        landmark,
        pincode,
        city,
        state,
        country,
        is_default,
        status
      )
      VALUES
      (
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        'ACTIVE'
      )
    `,
    [
      user_id,
      name,
      phone,
      email || null,
      address_line1,
      address_line2 || null,
      landmark || null,
      pincode,
      city,
      state,
      country || "India",
      shouldBeDefault ? 1 : 0,
    ]
  );


  // ----------------------------------------------------------
  // RETURN CREATED ADDRESS
  // ----------------------------------------------------------

  return await getReturnAddressById(
    result.insertId,
    user_id
  );
};


// ============================================================
// UPDATE RETURN ADDRESS
// ============================================================

const updateReturnAddress = async (
  id,
  userId,
  data
) => {
  const existing =
    await getReturnAddressById(
      id,
      userId
    );

  if (!existing) {
    throw new Error(
      "Return address not found"
    );
  }


  const {
    name,
    phone,
    email,
    address_line1,
    address_line2,
    landmark,
    pincode,
    city,
    state,
    country = "India",
    is_default = false,
  } = data;


  // ----------------------------------------------------------
  // IF SETTING THIS ADDRESS AS DEFAULT
  // CLEAR OTHER DEFAULTS FIRST
  // ----------------------------------------------------------

  if (Boolean(is_default)) {
    await query(
      `
        UPDATE return_addresses
        SET
          is_default = 0,
          updated_at = CURRENT_TIMESTAMP
        WHERE
          user_id = ?
          AND id <> ?
          AND is_default = 1
      `,
      [
        userId,
        id,
      ]
    );
  }


  // ----------------------------------------------------------
  // UPDATE
  // ----------------------------------------------------------

  await query(
    `
      UPDATE return_addresses
      SET
        name = ?,
        phone = ?,
        email = ?,
        address_line1 = ?,
        address_line2 = ?,
        landmark = ?,
        pincode = ?,
        city = ?,
        state = ?,
        country = ?,
        is_default = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE
        id = ?
        AND user_id = ?
    `,
    [
      name,
      phone,
      email || null,
      address_line1,
      address_line2 || null,
      landmark || null,
      pincode,
      city,
      state,
      country || "India",
      Boolean(is_default) ? 1 : 0,
      id,
      userId,
    ]
  );


  // ----------------------------------------------------------
  // SAFETY:
  // IF USER REMOVED DEFAULT FROM THE ONLY DEFAULT ADDRESS,
  // PROMOTE THE LATEST ACTIVE ADDRESS.
  // ----------------------------------------------------------

  const defaultRows = await query(
    `
      SELECT
        id
      FROM return_addresses
      WHERE
        user_id = ?
        AND status = 'ACTIVE'
        AND is_default = 1
      LIMIT 1
    `,
    [userId]
  );


  if (defaultRows.length === 0) {
    await query(
      `
        UPDATE return_addresses
        SET
          is_default = 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE
          id = (
            SELECT id
            FROM (
              SELECT id
              FROM return_addresses
              WHERE
                user_id = ?
                AND status = 'ACTIVE'
              ORDER BY id DESC
              LIMIT 1
            ) AS latest_address
          )
      `,
      [userId]
    );
  }


  // ----------------------------------------------------------
  // RETURN UPDATED ADDRESS
  // ----------------------------------------------------------

  return await getReturnAddressById(
    id,
    userId
  );
};


// ============================================================
// DELETE RETURN ADDRESS
// ============================================================

const deleteReturnAddress = async (
  id,
  userId
) => {
  const existing =
    await getReturnAddressById(
      id,
      userId
    );

  if (!existing) {
    throw new Error(
      "Return address not found"
    );
  }


  const wasDefault =
    Number(existing.is_default) === 1;


  // ----------------------------------------------------------
  // SOFT DELETE
  // ----------------------------------------------------------

  await query(
    `
      UPDATE return_addresses
      SET
        status = 'INACTIVE',
        is_default = 0,
        updated_at = CURRENT_TIMESTAMP
      WHERE
        id = ?
        AND user_id = ?
    `,
    [
      id,
      userId,
    ]
  );


  // ----------------------------------------------------------
  // IF DEFAULT ADDRESS WAS DELETED,
  // PROMOTE LATEST ACTIVE ADDRESS
  // ----------------------------------------------------------

  if (wasDefault) {
    const latestActive =
      await query(
        `
          SELECT
            id
          FROM return_addresses
          WHERE
            user_id = ?
            AND status = 'ACTIVE'
          ORDER BY id DESC
          LIMIT 1
        `,
        [userId]
      );


    if (latestActive.length > 0) {
      await query(
        `
          UPDATE return_addresses
          SET
            is_default = 1,
            updated_at = CURRENT_TIMESTAMP
          WHERE
            id = ?
            AND user_id = ?
        `,
        [
          latestActive[0].id,
          userId,
        ]
      );
    }
  }


  return true;
};


// ============================================================
// SET DEFAULT RETURN ADDRESS
// ============================================================

const setDefaultReturnAddress = async (
  id,
  userId
) => {
  const existing =
    await getReturnAddressById(
      id,
      userId
    );


  if (!existing) {
    throw new Error(
      "Return address not found"
    );
  }


  if (
    String(existing.status).toUpperCase() !==
    "ACTIVE"
  ) {
    throw new Error(
      "Inactive return address cannot be set as default"
    );
  }


  // ----------------------------------------------------------
  // REMOVE CURRENT DEFAULT
  // ----------------------------------------------------------

  await query(
    `
      UPDATE return_addresses
      SET
        is_default = 0,
        updated_at = CURRENT_TIMESTAMP
      WHERE
        user_id = ?
        AND is_default = 1
    `,
    [userId]
  );


  // ----------------------------------------------------------
  // SET NEW DEFAULT
  // ----------------------------------------------------------

  await query(
    `
      UPDATE return_addresses
      SET
        is_default = 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE
        id = ?
        AND user_id = ?
        AND status = 'ACTIVE'
    `,
    [
      id,
      userId,
    ]
  );


  // ----------------------------------------------------------
  // RETURN UPDATED ADDRESS
  // ----------------------------------------------------------

  return await getReturnAddressById(
    id,
    userId
  );
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  getReturnAddresses,
  getReturnAddressById,
  getDefaultReturnAddress,
  createReturnAddress,
  updateReturnAddress,
  deleteReturnAddress,
  setDefaultReturnAddress,
};