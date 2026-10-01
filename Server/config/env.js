// ======================================================
// ENVIRONMENT LOADER (Server)
// Automatically loads environment configuration based on NODE_ENV
// Priority:
// 1. .env.[mode].local (e.g. .env.development.local)
// 2. .env.[mode]       (e.g. .env.development or .env.production)
// 3. .env.local        (local overrides across all modes)
// 4. .env              (default configuration)
// ======================================================

const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

const nodeEnv = process.env.NODE_ENV || "development";
const rootDir = path.resolve(__dirname, "..");

const envFiles = [
  `.env.${nodeEnv}.local`,
  `.env.${nodeEnv}`,
  ".env.local",
  ".env",
];

for (const file of envFiles) {
  const fullPath = path.join(rootDir, file);
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath });
  }
}

const isProduction = nodeEnv === "production" || !!process.env.VERCEL;
const isDevelopment = !isProduction;

module.exports = {
  NODE_ENV: nodeEnv,
  isProduction,
  isDevelopment,
};
