const db = require("../config/db");

// ======================================================
// GET ALL WAREHOUSES FOR USER
// ======================================================

const getWarehousesByUser = (userId, callback) => {
  const query = `
    SELECT
      id,
      user_id,
      warehouse_name,
      contact_name,
      phone,
      email,
      gstin,
      address_line1,
      address_line2,
      floor_no,
      landmark,
      pincode,
      city,
      state,
      country,
      return_address,
      return_city,
      return_pincode,
      return_state,
      return_country,
      delhivery_registered,
      status,
      created_at,
      updated_at
    FROM warehouses
    WHERE user_id = ?
    ORDER BY id DESC
  `;

  db.query(
    query,
    [userId],
    callback
  );
};


// ======================================================
// GET SINGLE WAREHOUSE
// ======================================================

const getWarehouseById = (
  warehouseId,
  userId,
  callback
) => {
  const query = `
    SELECT
      id,
      user_id,
      warehouse_name,
      contact_name,
      phone,
      email,
      gstin,
      address_line1,
      address_line2,
      floor_no,
      landmark,
      pincode,
      city,
      state,
      country,
      return_address,
      return_city,
      return_pincode,
      return_state,
      return_country,
      delhivery_registered,
      status,
      created_at,
      updated_at
    FROM warehouses
    WHERE id = ?
      AND user_id = ?
    LIMIT 1
  `;

  db.query(
    query,
    [
      warehouseId,
      userId
    ],
    callback
  );
};


// ======================================================
// CREATE WAREHOUSE
// ======================================================

const createWarehouse = (
  warehouseData,
  callback
) => {
  const query = `
    INSERT INTO warehouses
    (
      user_id,

      warehouse_name,
      contact_name,
      phone,
      email,

      gstin,

      address_line1,
      address_line2,

      floor_no,
      landmark,

      pincode,
      city,
      state,
      country,

      return_address,
      return_city,
      return_pincode,
      return_state,
      return_country,

      delhivery_registered,
      status
    )
    VALUES
    (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?
    )
  `;

  db.query(
    query,
    [
      warehouseData.user_id,

      warehouseData.warehouse_name,
      warehouseData.contact_name,
      warehouseData.phone,
      warehouseData.email || null,

      warehouseData.gstin || null,

      warehouseData.address_line1,
      warehouseData.address_line2 || null,

      warehouseData.floor_no || null,
      warehouseData.landmark || null,

      warehouseData.pincode,
      warehouseData.city,
      warehouseData.state,
      warehouseData.country || "India",

      warehouseData.return_address || null,
      warehouseData.return_city || null,
      warehouseData.return_pincode || null,
      warehouseData.return_state || null,
      warehouseData.return_country || "India",

      warehouseData.delhivery_registered ? 1 : 0,
      warehouseData.status || "ACTIVE"
    ],
    callback
  );
};


// ======================================================
// UPDATE WAREHOUSE
// ======================================================

const updateWarehouse = (
  warehouseId,
  userId,
  warehouseData,
  callback
) => {
  const query = `
    UPDATE warehouses
    SET

      warehouse_name = ?,
      contact_name = ?,
      phone = ?,
      email = ?,

      gstin = ?,

      address_line1 = ?,
      address_line2 = ?,

      floor_no = ?,
      landmark = ?,

      pincode = ?,
      city = ?,
      state = ?,
      country = ?,

      return_address = ?,
      return_city = ?,
      return_pincode = ?,
      return_state = ?,
      return_country = ?,

      delhivery_registered = ?,
      status = ?

    WHERE id = ?
      AND user_id = ?
  `;

  db.query(
    query,
    [
      warehouseData.warehouse_name,
      warehouseData.contact_name,
      warehouseData.phone,
      warehouseData.email || null,

      warehouseData.gstin || null,

      warehouseData.address_line1,
      warehouseData.address_line2 || null,

      warehouseData.floor_no || null,
      warehouseData.landmark || null,

      warehouseData.pincode,
      warehouseData.city,
      warehouseData.state,
      warehouseData.country || "India",

      warehouseData.return_address || null,
      warehouseData.return_city || null,
      warehouseData.return_pincode || null,
      warehouseData.return_state || null,
      warehouseData.return_country || "India",

      warehouseData.delhivery_registered ? 1 : 0,
      warehouseData.status || "ACTIVE",

      warehouseId,
      userId
    ],
    callback
  );
};


// ======================================================
// UPDATE DELHIVERY REGISTRATION STATUS
// ======================================================

const updateDelhiveryStatus = (
  warehouseId,
  userId,
  registered,
  callback
) => {
  const query = `
    UPDATE warehouses
    SET
      delhivery_registered = ?
    WHERE id = ?
      AND user_id = ?
  `;

  db.query(
    query,
    [
      registered ? 1 : 0,
      warehouseId,
      userId
    ],
    callback
  );
};


// ======================================================
// DELETE WAREHOUSE
// ======================================================

const deleteWarehouse = (
  warehouseId,
  userId,
  callback
) => {
  const query = `
    DELETE FROM warehouses
    WHERE id = ?
      AND user_id = ?
  `;

  db.query(
    query,
    [
      warehouseId,
      userId
    ],
    callback
  );
};


// ======================================================
// EXPORT
// ======================================================

module.exports = {

  getWarehousesByUser,

  getWarehouseById,

  createWarehouse,

  updateWarehouse,

  updateDelhiveryStatus,

  deleteWarehouse

};