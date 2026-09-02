const mysql = require("mysql2");

require("dotenv").config();

// ======================================================
// MYSQL CONNECTION POOL
// ======================================================

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// ======================================================
// DATABASE CONNECTION TEST
// ======================================================

db.getConnection((err, connection) => {
  if (err) {
    console.error(
      "❌ Database connection failed:",
      err.message
    );
    return;
  }

  console.log("✅ Database connected");

  connection.release();
});

// ======================================================
// EXPORT POOL DIRECTLY
// ======================================================

module.exports = db;