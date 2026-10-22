const express = require("express");
const router = express.Router();

const {
  createOfflineOrderController,
  getOfflineOrdersController,
  updateOfflineOrderController,
  deleteOfflineOrderController,
} = require("../controllers/offlineOrderController");

const { authenticateUser } = require("../middleware/authMiddleware");

// All offline order routes require authentication and are user-scoped
router.use(authenticateUser);

// GET /api/offline-orders
router.get("/", getOfflineOrdersController);

// POST /api/offline-orders
router.post("/", createOfflineOrderController);
router.post("/create", createOfflineOrderController);

// PUT /api/offline-orders/:id
router.put("/:id", updateOfflineOrderController);
router.put("/update/:id", updateOfflineOrderController);

// DELETE /api/offline-orders/:id
router.delete("/:id", deleteOfflineOrderController);

module.exports = router;
