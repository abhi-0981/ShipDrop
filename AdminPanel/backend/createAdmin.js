const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = 5001;

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: process.env.DB_PASSWORD,
  database: "shipdrop",
});

// Test
app.get("/", (req, res) => {
  res.json({
    message: "ShipDrop Admin Backend is running",
  });
});

// Database test
app.get("/api/db-test", async (req, res) => {
  try {
    const [result] = await db.query("SELECT 1 AS connected");

    res.json({
      message: "Database connected successfully",
      result,
    });
  } catch (error) {
    console.error("Database error:", error.message);

    res.status(500).json({
      message: "Database connection failed",
    });
  }
});

// Admin Login
app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    const [admins] = await db.query(
      "SELECT id, username, password FROM admins WHERE username = ? LIMIT 1",
      [username]
    );

    if (admins.length === 0) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    const admin = admins[0];

    const passwordMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        role: "admin",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    res.json({
      message: "Login successful",
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      message: "Something went wrong",
    });
  }
});

app.listen(PORT, () => {
  console.log(`ShipDrop Admin Backend running on port ${PORT}`);
});