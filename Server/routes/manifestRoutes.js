const express = require("express");

const router =
  express.Router();

const manifestController =
  require("../controllers/manifestController");

const { authenticateUser } = require("../middleware/authMiddleware");

// All manifest routes are account-owned and require authentication
router.use(authenticateUser);


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