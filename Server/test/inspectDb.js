require("../config/env");
const db = require("../config/db");

async function inspect() {
  try {
    const promiseDb = db.promise();
    console.log("Connected to DB:", process.env.DB_NAME, "at", process.env.DB_HOST);

    // List all tables
    const [tables] = await promiseDb.query("SHOW TABLES");
    console.log("Tables in database:", tables);

    // Check user_sessions table
    const [cols] = await promiseDb.query("DESCRIBE user_sessions");
    console.log("Columns in user_sessions:", cols);

    // Check users table columns
    const [userCols] = await promiseDb.query("DESCRIBE users");
    console.log("Columns in users:", userCols.map(c => c.Field));

  } catch (err) {
    console.error("Inspection error:", err.message);
  } finally {
    process.exit(0);
  }
}

inspect();
