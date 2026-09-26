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
} = require("../controllers/orderController");

const {
  importOrders,
} = require("../controllers/importOrderController");

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