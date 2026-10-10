// ======================================================
// ENVIRONMENT
// ======================================================

require("./config/env");


// ======================================================
// DEPENDENCIES
// ======================================================

const express = require("express");

// ======================================================
// AUTO-CANCEL JOB
// ======================================================

const {
  startAutoCancelJob,
} = require("./jobs/autoCancelManifestedOrders");

const {
  startTrackingJob,
} = require("./jobs/trackActiveOrders");


// ======================================================
// APP
// ======================================================

const app = express();


// ======================================================
// ENV DEBUG
// ======================================================

console.log(
  "Delhivery token loaded:",
  !!process.env.DELHIVERY_API_TOKEN
);

console.log(
  "Delhivery API URL:",
  process.env.DELHIVERY_API_BASE_URL ||
    "https://track.delhivery.com"
);


// ======================================================
// DATABASE
// ======================================================

require("./config/db");


// ======================================================
// ROUTES
// ======================================================

const userRoutes =
  require("./routes/userRoutes");

const orderRoutes =
  require("./routes/orderRoutes");

const paymentRoutes =
  require("./routes/paymentRoutes");

const rateCardRoutes =
  require("./routes/rateCardRoutes");

const zoneRoutes =
  require("./routes/zoneRoutes");

const rateRoutes =
  require("./routes/rateRoutes");

const manifestRoutes =
  require("./routes/manifestRoutes");

const shipmentRoutes =
  require("./routes/shipmentRoutes");

const warehouseRoutes =
  require("./routes/warehouseRoutes");

const returnAddressRoutes =
  require("./routes/returnAddressRoutes");

const labelSettingsRoutes =
  require("./routes/labelSettingsRoutes");

const ticketRoutes =
  require("./routes/ticketRoutes");

const serviceabilityRoutes =
  require("./routes/serviceabilityRoutes");

const publicTrackingRoutes =
  require("./routes/publicTrackingRoutes");


// ======================================================
// MIDDLEWARE
// ======================================================

const cors = require("cors");

const rawOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const explicitAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "https://parceldrop.netlify.app",
  "https://parceldrop.in",
  "https://www.parceldrop.in",
  "https://admin.parceldrop.in",
  ...rawOrigins,
  ...(process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
    : []),
]
  .filter(Boolean)
  .map((o) => o.replace(/\/+$/, ""));

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Allow non-browser requests
  if (process.env.NODE_ENV !== "production") return true;

  const normalized = origin.replace(/\/+$/, "");
  if (
    explicitAllowedOrigins.includes(normalized) ||
    explicitAllowedOrigins.includes("*")
  ) {
    return true;
  }

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

  return false;
};

console.log("Allowed CORS origins:", explicitAllowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      console.log("CORS blocked origin:", origin);

      return callback(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
    ],
  })
);

app.use(
  express.json({
    limit: "10mb",
  })
);

// ======================================================
// SECURITY HEADERS
// ======================================================

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});


// ======================================================
// HOME
// ======================================================

app.get("/api/db-test", async (req, res) => {
  try {
    const db = require("./config/db");

    const [rows] = await db.query("SELECT 1 AS test");

    return res.json({
      success: true,
      message: "Aiven DB connected successfully",
      data: rows,
    });

  } catch (error) {

    console.error("DB TEST ERROR:", {
      code: error.code,
      errno: error.errno,
      message: error.message,
      address: error.address,
      port: error.port,
    });

    return res.status(500).json({
      success: false,
      code: error.code,
      message: error.message,
    });
  }
});

app.get(
  "/",
  (req, res) => {

    return res.status(200).send(
      "ShipDrop server is running"
    );

  }
);


// ======================================================
// API ROUTES
// ======================================================

// USER
app.use(
  "/api/users",
  userRoutes
);


// ORDERS
app.use(
  "/api/orders",
  orderRoutes
);


// PAYMENTS
app.use(
  "/api/payments",
  paymentRoutes
);


// RATE CARD
app.use(
  "/api/rate-card",
  rateCardRoutes
);


// ZONE
app.use(
  "/api/zone",
  zoneRoutes
);


// RATE CALCULATION
app.use(
  "/api/rate",
  rateRoutes
);


// MANIFESTS
app.use(
  "/api/manifests",
  manifestRoutes
);


// SHIPMENTS
app.use(
  "/api/shipments",
  shipmentRoutes
);


// WAREHOUSES
app.use(
  "/api/warehouses",
  warehouseRoutes
);


// RETURN ADDRESSES
app.use(
  "/api/return-addresses",
  returnAddressRoutes
);


// LABEL SETTINGS
app.use(
  "/api/label-settings",
  labelSettingsRoutes
);


// TICKETS
app.use(
  "/api/tickets",
  ticketRoutes
);

// SERVICEABILITY

app.use(
  "/api/serviceability",
  serviceabilityRoutes
);

// PUBLIC TRACKING
app.use(
  "/api/public/tracking",
  publicTrackingRoutes
);


// ======================================================
// OLD ORDERS ROUTE
// ======================================================

app.use(
  "/orders",
  orderRoutes
);


// ======================================================
// 404
// ======================================================

app.use(
  (req, res) => {

    return res.status(404).json({

      success: false,

      message:
        "API route not found",

      path:
        req.originalUrl,

    });

  }
);


// ======================================================
// CRON TRIGGER ENDPOINTS (FOR VERCEL / EXTERNAL CRON)
// ======================================================

const verifyCronSecret = (req, res, next) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return next();
  const authHeader = req.headers.authorization;
  const provided =
    req.query.secret ||
    (authHeader ? authHeader.replace(/^Bearer\s+/i, "") : null);
  if (provided !== secret) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized cron trigger",
    });
  }
  next();
};

app.get("/api/cron/track-orders", verifyCronSecret, async (req, res, next) => {
  try {
    const { runTrackingJob } = require("./jobs/trackActiveOrders");
    await runTrackingJob();
    return res.status(200).json({
      success: true,
      message: "Tracking job executed successfully",
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/cron/auto-cancel", verifyCronSecret, async (req, res, next) => {
  try {
    const { runAutoCancel } = require("./jobs/autoCancelManifestedOrders");
    await runAutoCancel();
    return res.status(200).json({
      success: true,
      message: "Auto-cancel job executed successfully",
    });
  } catch (error) {
    next(error);
  }
});

// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.log(
      "Global server error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Internal server error",
    });
  }
);


// ======================================================
// SERVER & EXPORT
// ======================================================

const PORT = process.env.PORT || 5000;

// Only start the standalone HTTP listener & cron schedulers
// when run directly (e.g. node server.js locally), not in Vercel Serverless
if (require.main === module && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("Database and API services initialized");

    // Start background schedulers in standalone mode
    startAutoCancelJob();
    startTrackingJob();
  });
}

module.exports = app;
