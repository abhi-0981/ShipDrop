const express = require("express");

const router = express.Router();

const {
  createOrder,
  getProcessingOrders,
  updateOrder,
  deleteOrders
} = require("../controllers/orderController");

router.post(
  "/create",
  createOrder
);

router.get(
  "/processing",
  getProcessingOrders
);

router.put(
  "/:id",
  updateOrder
);

router.post("/delete", deleteOrders);

module.exports = router;