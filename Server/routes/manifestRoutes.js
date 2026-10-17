const express = require("express");

const router =
  express.Router();

const manifestController =
  require("../controllers/manifestController");


// ======================================================
// GET ALL MANIFESTS
// ======================================================

router.get(
  "/",
  manifestController.getManifestedOrders
);


// ======================================================
// GET SINGLE MANIFEST
// ======================================================

router.get(
  "/:manifest_id",
  manifestController.getManifestById
);


// ======================================================
// CANCEL MANIFESTED ORDERS
// ======================================================

router.post(
  "/cancel",
  manifestController.cancelManifestedOrders
);


module.exports = router;