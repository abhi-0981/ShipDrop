const express = require("express");
const cors = require("cors");
let bcrypt;
try {
  bcrypt = require("bcryptjs");
} catch (e) {
  bcrypt = require("bcrypt");
}
const jwt = require("jsonwebtoken");

require("dotenv").config();

const db = require("./config/db");

// =====================================================
// ROUTES
// =====================================================

const rateCardRoutes = require("./routes/rateCardRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const weightCheckingRoutes = require("./routes/weightCheckingRoutes");  

// =====================================================
// APP
// =====================================================

const app = express();

const PORT = process.env.PORT || 5001;

// =====================================================
// CORS CONFIGURATION
// =====================================================

const explicitAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "https://admin.parceldrop.in",
  "http://admin.parceldrop.in",
  "https://parceldrop.in",
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((s) => s.trim())
    : []),
  ...(process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
    : []),
]
  .filter(Boolean)
  .map((o) => o.replace(/\/+$/, ""));

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // allow non-browser requests
  const normalized = origin.replace(/\/+$/, "");
  if (explicitAllowedOrigins.includes(normalized)) return true;
  try {
    const parsed = new URL(normalized);
    if (
      parsed.hostname.endsWith(".netlify.app") ||
      parsed.hostname.endsWith(".vercel.app") ||
      parsed.hostname.endsWith(".parceldrop.in") ||
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1"
    ) {
      return true;
    }
  } catch (e) {
    // invalid URL format
  }
  return true;
};

const corsOptions = {
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
  ],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(express.json());

// =====================================================
// HEALTH CHECKS
// =====================================================

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "ShipDrop Admin Backend is running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api", (req, res) => {
  res.json({
    status: "ok",
    message: "ShipDrop Admin API is ready",
    timestamp: new Date().toISOString(),
  });
});

// =====================================================
// DATABASE TEST
// =====================================================

app.get("/api/db-test", async (req, res) => {
  try {
    const [result] = await db.query(
      "SELECT 1 AS connected"
    );

    res.json({
      status: "ok",
      message: "Database connected successfully",
      result,
    });
  } catch (error) {
    console.error(
      "Database error:",
      error.message
    );

    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// =====================================================
// ADMIN LOGIN
// =====================================================

app.post("/api/admin/login", async (req, res) => {
  try {
    const {
      username,
      password,
    } = req.body;

    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (!username || !password) {
      return res.status(400).json({
        message:
          "Username and password are required",
      });
    }

    // -----------------------------------------------
    // FIND ADMIN
    // -----------------------------------------------

    const [admins] = await db.query(
      `
        SELECT
          id,
          username,
          password
        FROM admins
        WHERE username = ?
        LIMIT 1
      `,
      [username]
    );

    if (admins.length === 0) {
      return res.status(401).json({
        message:
          "Invalid username or password",
      });
    }

    const admin = admins[0];

    // -----------------------------------------------
    // CHECK PASSWORD
    // -----------------------------------------------

    const passwordMatch =
      await bcrypt.compare(
        password,
        admin.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        message:
          "Invalid username or password",
      });
    }

    // -----------------------------------------------
    // CREATE JWT
    // -----------------------------------------------

    const jwtSecret =
      process.env.JWT_SECRET || "shipdrop_admin_jwt_secret_key_default";

    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        role: "admin",
      },
      jwtSecret,
      {
        expiresIn: "8h",
      }
    );

    // -----------------------------------------------
    // RESPONSE
    // -----------------------------------------------

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
    console.error(
      "Login error:",
      error
    );

    res.status(500).json({
      message: error.message || "Something went wrong",
    });
  }
});

// =====================================================
// RATE CARD ROUTES
// =====================================================

app.use(
  "/api/rate-cards",
  rateCardRoutes
);

// =====================================================
// ADMIN ROUTES
// =====================================================

app.use(
  "/api/admin",
  adminRoutes
);

// =====================================================
// USER ACCOUNT / WALLET ROUTES
// =====================================================

app.use(
  "/api/admin",
  userRoutes
);

// =====================================================
// WEIGHT CHECKING ROUTES
// =====================================================

app.use(
  "/api/admin/weight-checking",
  weightCheckingRoutes
);

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// =====================================================
// ERROR HANDLER
// =====================================================

app.use((error, req, res, next) => {
  console.error(
    "Unhandled server error:",
    error
  );

  res.status(500).json({
    message: "Internal server error",
  });
});

// =====================================================
// START SERVER (Local Development) & EXPORT (Vercel)
// =====================================================

if (require.main === module && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(
      `ShipDrop Admin Backend running on port ${PORT}`
    );
  });
}

module.exports = app;