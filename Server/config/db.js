// ======================================================
// DATABASE CONFIGURATION
// ======================================================

const mysql = require("mysql2/promise");

require("dotenv").config();


// ======================================================
// MYSQL POOL
// ======================================================

const db = mysql.createPool({

  // Aiven MySQL host
  host: process.env.DB_HOST,

  // IMPORTANT:
  // MySQL port, NOT Vercel PORT
  port: Number(process.env.DB_PORT || 25515),

  // Aiven username
  user: process.env.DB_USER,

  // Aiven password
  password: process.env.DB_PASSWORD,

  // Actual Aiven database name
  database: process.env.DB_NAME,

  // Aiven requires SSL
  ssl: {
    rejectUnauthorized: false,
  },

  // Pool settings
  waitForConnections: true,

  connectionLimit: 5,

  queueLimit: 0,

  // Keep MySQL connection alive
  enableKeepAlive: true,

  keepAliveInitialDelay: 0,
});


// ======================================================
// TEST DATABASE CONNECTION
// ======================================================

async function testConnection() {

  let connection;

  try {

    connection = await db.getConnection();

    console.log(
      "✅ Aiven MySQL connected successfully"
    );

    console.log(
      "📦 Database:",
      process.env.DB_NAME
    );

    console.log(
      "🌐 Host:",
      process.env.DB_HOST
    );

    console.log(
      "🔌 Port:",
      process.env.DB_PORT
    );

  } catch (error) {

    console.error(
      "❌ Database connection failed:",
      {
        code: error.code,
        errno: error.errno,
        message: error.message,
        address: error.address,
        port: error.port,
      }
    );

  } finally {

    if (connection) {
      connection.release();
    }

  }
}


// Run connection test
testConnection();


// ======================================================
// EXPORT
// ======================================================

module.exports = db;