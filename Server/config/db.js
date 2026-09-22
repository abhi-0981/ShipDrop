const mysql = require("mysql2");

require("dotenv").config();
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.PORT || 25515),

  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl: {
    rejectUnauthorized: false,
  },

  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,

  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

async function testConnection() {
  try {
    const connection = await db.getConnection();

    console.log("✅ Aiven MySQL connected successfully");

    connection.release();
  } catch (error) {
    console.error("❌ Database connection failed:", {
      code: error.code,
      errno: error.errno,
      message: error.message,
      address: error.address,
      port: error.port,
    });
  }
}

testConnection();

module.exports = db;