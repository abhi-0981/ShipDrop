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
const { ensureIndexes } = require("./config/ensureIndexes");
const { ensureTables } = require("./config/ensureTables");

ensureIndexes().catch((err) => console.warn("ensureIndexes notice:", err.message));
ensureTables().catch((err) => console.warn("ensureTables notice:", err.message));


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

const partyIdentityRoutes =
  require("./routes/partyIdentityRoutes");

const offlineOrderRoutes =
  require("./routes/offlineOrderRoutes");

const notificationRoutes =
  require("./routes/notificationRoutes");

const announcementRoutes =
  require("./routes/announcementRoutes");

const reportRoutes =
  require("./routes/reportRoutes");

const analyticsRoutes =
  require("./routes/analyticsRoutes");


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

const { securityHeaders } = require("./middleware/securityHeaders");
const { generalApiLimiter } = require("./middleware/rateLimitMiddleware");

app.use(securityHeaders);

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

// Apply rate limiter to /api routes
app.use("/api", generalApiLimiter);

// ======================================================
// ZERO-DEPENDENCY GZIP COMPRESSION (70-85% Payload Reduction)
// ======================================================

const zlib = require("zlib");

app.use((req, res, next) => {
  const acceptEncoding = req.headers["accept-encoding"] || "";
  if (!acceptEncoding.includes("gzip")) {
    return next();
  }

  const originalSend = res.send;
  res.send = function (body) {
    if (
      res.headersSent ||
      res.getHeader("Content-Encoding") ||
      res.statusCode === 304 ||
      !body ||
      (typeof body !== "string" && !Buffer.isBuffer(body))
    ) {
      return originalSend.call(this, body);
    }

    const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body);
    if (buffer.length < 1024) {
      return originalSend.call(this, body);
    }

    try {
      const compressed = zlib.gzipSync(buffer, { level: 6 });
      res.setHeader("Content-Encoding", "gzip");
      res.removeHeader("Content-Length");
      res.setHeader("Content-Length", compressed.length);
      res.setHeader("Vary", "Accept-Encoding");
      return originalSend.call(this, compressed);
    } catch {
      return originalSend.call(this, body);
    }
  };

  next();
});


// ======================================================
// HOME
// ======================================================

app.get("/api/db-test", async (req, res) => {
  // Hide internal database diagnostics in production unless requested with admin secret
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.CRON_SECRET || req.query.secret !== process.env.CRON_SECRET)
  ) {
    return res.status(404).json({
      success: false,
      message: "Route not found",
    });
  }

  try {
    const db = require("./config/db");

    const [rows] = await db.query("SELECT 1 AS test");

    return res.json({
      success: true,
      message: "DB connection verified",
      data: rows,
    });

  } catch (error) {

    console.error("DB TEST ERROR:", {
      code: error.code,
      errno: error.errno,
      message: error.message,
    });

    return res.status(500).json({
      success: false,
      message: "Database connection failed",
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

// NOTIFICATIONS
app.use(
  "/api/notifications",
  notificationRoutes
);

// ANNOUNCEMENTS / BROADCAST POPUPS
app.use(
  "/api/announcements",
  announcementRoutes
);
app.use(
  "/announcements",
  announcementRoutes
);

// USER REPORTS
app.use(
  "/api/reports",
  reportRoutes
);
app.use(
  "/reports",
  reportRoutes
);

// SELLER ANALYTICS
app.use(
  "/api/analytics",
  analyticsRoutes
);
app.use(
  "/analytics",
  analyticsRoutes
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

// PARTY IDENTITIES
app.use(
  "/api/party-identities",
  partyIdentityRoutes
);

app.use(
  "/party-identities",
  partyIdentityRoutes
);

// OFFLINE ORDERS
app.use(
  "/api/offline-orders",
  offlineOrderRoutes
);

app.use(
  "/offline-orders",
  offlineOrderRoutes
);


// ======================================================
// OLD ORDERS ROUTE
// ======================================================

app.use(
  "/orders",
  orderRoutes
);


// ======================================================
// CRON TRIGGER ENDPOINTS (FOR VERCEL / EXTERNAL CRON)
// ======================================================

const verifyCronAuth = (req, res, next) => {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
      console.warn("[SECURITY NOTICE] CRON_SECRET is not configured in production environment variables.");
    }
    return next();
  }

  const authHeader = req.headers.authorization || "";
  const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
  const provided = bearer || req.query.secret || req.headers["x-cron-secret"];

  if (provided !== cronSecret) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or missing cron secret token",
    });
  }

  return next();
};

app.get("/api/cron/track-orders", verifyCronAuth, async (req, res, next) => {
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

app.get("/api/cron/auto-cancel", verifyCronAuth, async (req, res, next) => {
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
// 404 & GLOBAL ERROR HANDLER MIDDLEWARE
// ======================================================

const {
  errorHandler,
  notFoundHandler,
} = require("./middleware/errorHandler");

app.use(notFoundHandler);
app.use(errorHandler);


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

// ======================================================
// PROCESS CRASH GUARDS
// ======================================================

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Promise Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception thrown:", error);
});

module.exports = app;
