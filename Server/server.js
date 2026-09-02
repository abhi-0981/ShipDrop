// ======================================================
// ENVIRONMENT
// ======================================================

require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
});


// ======================================================
// DEPENDENCIES
// ======================================================

const express = require("express");
const cors = require("cors");


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


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(
  cors()
);

app.use(
  express.json({
    limit: "10mb",
  })
);


// ======================================================
// HOME
// ======================================================

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


// OLD ORDERS ROUTE
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
// SERVER
// ======================================================

const PORT =
  process.env.PORT || 5000;


app.listen(
  PORT,
  () => {

    console.log(
      `Server running on port ${PORT}`
    );

    console.log(
      "Database and API services initialized"
    );

  }
);