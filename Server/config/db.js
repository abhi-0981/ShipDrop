// ======================================================
// PRODUCTION MYSQL CONNECTION
// Vercel Backend → Aiven MySQL
// ======================================================

require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
});
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


const isRemote =
  process.env.DB_HOST &&
  process.env.DB_HOST !== "localhost" &&
  process.env.DB_HOST !== "127.0.0.1";

const dbConfig = {
  host: process.env.DB_HOST,

  port: Number(process.env.DB_PORT || (isRemote ? 25515 : 3306)),

  user: process.env.DB_USER,

  password: process.env.DB_PASSWORD,

  database: process.env.DB_NAME,
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

Object.assign(dbConfig, {
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 5),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 15000,
  charset: "utf8mb4",
});


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