const express = require("express");
const router = express.Router();

const {
  getPartyIdentities,
  createPartyIdentity,
  updatePartyIdentity,
  deletePartyIdentity,
} = require("../controllers/partyIdentityController");

const { authenticateUser } = require("../middleware/authMiddleware");

// All party identity routes require authentication and are user-scoped
router.use(authenticateUser);

// GET /api/party-identities
router.get("/", getPartyIdentities);

// POST /api/party-identities
router.post("/", createPartyIdentity);

// PUT /api/party-identities/:id
router.put("/:id", updatePartyIdentity);

// DELETE /api/party-identities/:id
router.delete("/:id", deletePartyIdentity);

module.exports = router;
