const express = require("express");

const router = express.Router();

const {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
} = require("../controllers/warehouseController");


// ======================================================
// CREATE WAREHOUSE
// ======================================================

router.post(
  "/create",
  createWarehouse
);


// ======================================================
// GET ALL USER WAREHOUSES
// ======================================================

router.get(
  "/",
  getWarehouses
);


// ======================================================
// GET SINGLE WAREHOUSE
// ======================================================

router.get(
  "/:id",
  getWarehouseById
);


// ======================================================
// UPDATE WAREHOUSE
// ======================================================

router.put(
  "/:id",
  updateWarehouse
);


// ======================================================
// DELETE WAREHOUSE
// ======================================================

router.delete(
  "/:id",
  deleteWarehouse
);


module.exports = router;