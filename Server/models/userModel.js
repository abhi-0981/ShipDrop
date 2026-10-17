const db = require("../config/db");

// ========================================
// CHECK EMAIL / PHONE
// ========================================

const checkUser = (email, phone_no, callback) => {
  const query = `
    SELECT id, email, phone_no
    FROM users
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))
       OR phone_no = ?
    LIMIT 1
  `;

  db.query(query, [email, phone_no], callback);
};

// ========================================
// CREATE USER
// ========================================

const createUser = (userData, callback) => {
  const {
    full_name,
    company_name,
    gst_no,
    email,
    phone_no,
    password,
    role,
  } = userData;

  const query = `
    INSERT INTO users
    (
      full_name,
      company_name,
      gst_no,
      email,
      phone_no,
      password,
      role
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [
      full_name,
      company_name,
      gst_no,
      email,
      phone_no,
      password,
      role,
    ],
    callback,
  );
};

// ========================================
// FIND USER BY EMAIL
// ========================================

const findUserByEmail = (email, callback) => {
  const query = `
    SELECT *
    FROM users
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))
    LIMIT 1
  `;

  db.query(query, [email], callback);
};

// ========================================
// UPDATE USER PROFILE
// ========================================

const updateUserProfile = (user_id, userData, callback) => {
  const {
    full_name,
    email,
    phone_no,
    profile_image,
  } = userData;

  const query = `
    UPDATE users
    SET
      full_name = ?,
      email = ?,
      phone_no = ?,
      profile_image = ?
    WHERE id = ?
  `;

  db.query(
    query,
    [
      full_name,
      email,
      phone_no,
      profile_image,
      user_id,
    ],
    callback,
  );
};

// ========================================
// CHECK EMAIL / PHONE FOR OTHER USERS
// ========================================

const checkDuplicateUser = (
  user_id,
  email,
  phone_no,
  callback,
) => {
  const query = `
    SELECT id, email, phone_no
    FROM users
    WHERE (
      LOWER(TRIM(email)) = LOWER(TRIM(?))
      OR phone_no = ?
    )
    AND id != ?
    LIMIT 1
  `;

  db.query(
    query,
    [
      email,
      phone_no,
      user_id,
    ],
    callback,
  );
};

// ========================================
// FIND USER BY ID
// ========================================

const findUserById = (user_id, callback) => {
  const query = `
    SELECT *
    FROM users
    WHERE id = ?
    LIMIT 1
  `;

  db.query(
    query,
    [user_id],
    callback,
  );
};

module.exports = {
  checkUser,
  createUser,
  findUserByEmail,
  updateUserProfile,
  checkDuplicateUser,
  findUserById,
};