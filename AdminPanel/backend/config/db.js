// ======================================================
// DATABASE CONFIGURATION (AdminPanel)
// Supports Local MySQL & Cloud/Aiven MySQL on Vercel
// ======================================================

const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});
const mysql = require("mysql2/promise");

const isRemote =
  process.env.DB_HOST &&
  process.env.DB_HOST !== "localhost" &&
  process.env.DB_HOST !== "127.0.0.1";

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || (isRemote ? 25515 : 3306)),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "shipdrop",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 5),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 15000,
  charset: "utf8mb4",
};

// Enable SSL for remote cloud databases (e.g. Aiven) unless explicitly disabled
if (
  process.env.DB_SSL === "true" ||
  (isRemote && process.env.DB_SSL !== "false")
) {
  dbConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const db = mysql.createPool(dbConfig);

module.exports = db;