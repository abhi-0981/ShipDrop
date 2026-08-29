const db = require("../config/db");

const checkUser = (email, phone_no, callback) => {
  const query =
    "SELECT * FROM users WHERE email = ? OR phone_no = ?";

  db.query(
    query,
    [email, phone_no],
    callback
  );
};

const createUser = (userData, callback) => {
  const {
    full_name,
    company_name,
    gst_no,
    email,
    phone_no,
    password,
    role
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
      role
    ],
    callback
  );
};

const findUserByEmail = (
  email,
  callback
) => {
  const query =
    "SELECT * FROM users WHERE email = ?";

  db.query(
    query,
    [email],
    callback
  );
};


// ========================================
// UPDATE USER PROFILE
// ========================================

const updateUserProfile = (
  user_id,
  userData,
  callback
) => {
  const {
    full_name,
    email,
    phone_no,
    profile_image
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
      user_id
    ],
    callback
  );
};


// ========================================
// CHECK EMAIL / PHONE FOR OTHER USERS
// ========================================

const checkDuplicateUser = (
  user_id,
  email,
  phone_no,
  callback
) => {
  const query = `
    SELECT id, email, phone_no
    FROM users
    WHERE (email = ? OR phone_no = ?)
    AND id != ?
  `;

  db.query(
    query,
    [
      email,
      phone_no,
      user_id
    ],
    callback
  );
};


// ========================================
// FIND USER BY ID
// ========================================

const findUserById = (
  user_id,
  callback
) => {
  const query =
    "SELECT * FROM users WHERE id = ?";

  db.query(
    query,
    [user_id],
    callback
  );
};


module.exports = {
  checkUser,
  createUser,
  findUserByEmail,
  updateUserProfile,
  checkDuplicateUser,
  findUserById
};