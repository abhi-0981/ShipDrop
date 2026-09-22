// ======================================================
// PRODUCTION MYSQL CONNECTION
// Vercel Backend → Aiven MySQL
// ======================================================

const mysql = require("mysql2");


// ======================================================
// REQUIRED ENVIRONMENT VARIABLES
// ======================================================
//
// DB_HOST
// DB_PORT
// DB_USER
// DB_PASSWORD
// DB_NAME
//
// Example:
//
// DB_HOST=parceldropservice-parceldrop.a.aivencloud.com
// DB_PORT=25515
// DB_USER=avnadmin
// DB_PASSWORD=********
// DB_NAME=defaultdb
//
// ======================================================


// ======================================================
// VALIDATE ENVIRONMENT
// ======================================================

const requiredEnv = [
  "DB_HOST",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
];

const missingEnv = requiredEnv.filter(
  (key) => !process.env[key]
);

if (missingEnv.length > 0) {
  throw new Error(
    `Missing required database environment variables: ${missingEnv.join(", ")}`
  );
}


// ======================================================
// DATABASE CONFIGURATION
// ======================================================

const dbConfig = {
  host: process.env.DB_HOST,

  // Aiven MySQL port
  port: Number(process.env.PORT || 25515),

  user: process.env.DB_USER,

  password: process.env.DB_PASSWORD,

  database: process.env.DB_NAME,

  // ====================================================
  // AIVEN SSL
  // ====================================================

  ssl: {
    rejectUnauthorized: false,
  },

  // ====================================================
  // CONNECTION POOL
  // ====================================================

  waitForConnections: true,

  // Keep this conservative on Vercel/serverless
  connectionLimit: Number(
    process.env.DB_CONNECTION_LIMIT || 5
  ),

  queueLimit: 0,

  // ====================================================
  // CONNECTION KEEP ALIVE
  // ====================================================

  enableKeepAlive: true,

  keepAliveInitialDelay: 0,

  // ====================================================
  // TIMEOUTS
  // ====================================================

  connectTimeout: 15000,

  // ====================================================
  // CHARSET
  // ====================================================

  charset: "utf8mb4",
};


// ======================================================
// CREATE POOL
// ======================================================

const db = mysql.createPool(dbConfig);


// ======================================================
// OPTIONAL DATABASE HEALTH CHECK
// ======================================================
//
// Do NOT connect to the database automatically when this
// file is imported.
//
// The actual connection happens when a query is executed.
//
// This is better for Vercel serverless functions.
// ======================================================


// ======================================================
// EXPORT
// ======================================================

module.exports = db;