const express = require("express");
const multer = require("multer");

const router = express.Router();

const {
  createOrder,
  getProcessingOrders,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrders,
  searchPreviousCustomers,
  searchTracking,
  getOrderStatusCounts,
  getDashboardSummary,
} = require("../controllers/orderController");

const {
  importOrders,
} = require("../controllers/importOrderController");

const { authenticateUser } = require("../middleware/authMiddleware");

// All order routes are account-owned and require authentication
router.use(authenticateUser);

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// ======================================================
// CREATE ORDER
// ======================================================

router.post(
  "/create",
  createOrder
);

// ======================================================
// IMPORT ORDERS
// ======================================================

router.post(
  "/import",
  upload.single("file"),
  importOrders
);

// ======================================================
// PREVIOUS CUSTOMERS SEARCH
// IMPORTANT:
// Ye /:id se PEHLE hona chahiye.
// ======================================================

router.get(
  "/customers/search",
  searchPreviousCustomers
);

// ======================================================
// PROCESSING ORDERS
// ======================================================

router.get(
  "/processing",
  getProcessingOrders
);

// ======================================================
// ALL ORDERS
// ======================================================

router.get(
  "/all",
  getAllOrders
  
);

// ======================================================
// TRACKING SEARCH
// IMPORTANT:
// Ye /:id se PEHLE hona chahiye.
// ======================================================

router.get(
  "/tracking-search",
  searchTracking
);

// ======================================================
// STATUS COUNTS
// IMPORTANT:
// Ye /:id se PEHLE hona chahiye.
// ======================================================

router.get(
  "/status-counts",
  getOrderStatusCounts
);

// ======================================================
// DASHBOARD SUMMARY (FAST UNIFIED ENDPOINT)
// IMPORTANT:
// Ye /:id se PEHLE hona chahiye.
// ======================================================

router.get(
  "/dashboard-summary",
  getDashboardSummary
);

// ======================================================
// GET SINGLE ORDER
// ======================================================

router.get(
  "/:id",
  getOrderById
);

// ======================================================
// UPDATE ORDER
// ======================================================

router.put(
  "/:id",
  updateOrder
);

// ======================================================
// DELETE PROCESSING ORDERS
// ======================================================

router.post(
  "/delete",
  deleteOrders
);

// ======================================================
// EXPORT
// ======================================================

module.exports = router;