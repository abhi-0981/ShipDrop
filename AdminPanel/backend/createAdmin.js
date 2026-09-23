const db = require("./config/db");
const bcrypt = require("bcrypt");

async function seedAdmin() {
  const username =
    process.argv[2] || process.env.ADMIN_DEFAULT_USER || "admin";
  const rawPassword =
    process.argv[3] || process.env.ADMIN_DEFAULT_PASS || "admin123";

  console.log(`Setting up admin user '${username}'...`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const [existing] = await db.query(
    `SELECT id, username FROM admins WHERE username = ? LIMIT 1`,
    [username]
  );

  if (existing.length > 0) {
    await db.query(
      `UPDATE admins SET password = ?, updated_at = NOW() WHERE username = ?`,
      [hashedPassword, username]
    );
    console.log(`Admin user '${username}' password successfully updated!`);
  } else {
    await db.query(
      `INSERT INTO admins (username, password) VALUES (?, ?)`,
      [username, hashedPassword]
    );
    console.log(`Admin user '${username}' successfully created!`);
  }

  console.log(`Credentials -> Username: '${username}', Password: '${rawPassword}'`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Error creating/updating admin:", err.message);
  process.exit(1);
});