const express = require("express");

const router = express.Router();


// ======================================================
// CONTROLLERS
// ======================================================

const {
  createOrder,
  getProcessingOrders,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrders,
} = require("../controllers/orderController");


// ======================================================
// CREATE ORDER
// ======================================================

router.post(
  "/create",
  createOrder
);


// ======================================================
// GET PROCESSING ORDERS
// ======================================================

router.get(
  "/processing",
  getProcessingOrders
);


// ======================================================
// GET ALL ORDERS
// IMPORTANT: MUST COME BEFORE /:id
// ======================================================

router.get(
  "/all",
  getAllOrders
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
// DELETE ORDERS
// ======================================================

router.post(
  "/delete",
  deleteOrders
);


// ======================================================
// EXPORT
// ======================================================

module.exports = router;