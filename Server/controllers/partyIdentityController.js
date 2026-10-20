const {
  getPartyIdentitiesByUser,
  getPartyIdentityById,
  checkDuplicatePartyIdentity,
  createPartyIdentity,
  updatePartyIdentity,
  deletePartyIdentity,
} = require("../models/partyIdentityModel");

// ======================================================
// GET ALL PARTY IDENTITIES FOR AUTHENTICATED USER
// ======================================================

const getPartyIdentitiesController = async (req, res) => {
  try {
    const userId = Number(req.user?.id || req.user?.user_id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User session missing",
      });
    }

    const partyIdentities = await getPartyIdentitiesByUser(userId);

    return res.status(200).json({
      success: true,
      partyIdentities: partyIdentities || [],
    });
  } catch (error) {
    console.error("Get party identities error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch party identities",
    });
  }
};

// ======================================================
// CREATE PARTY IDENTITY
// ======================================================

const createPartyIdentityController = async (req, res) => {
  try {
    const userId = Number(req.user?.id || req.user?.user_id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User session missing",
      });
    }

    const rawName = String(req.body?.name || "").trim();

    if (!rawName) {
      return res.status(400).json({
        success: false,
        message: "Party identity name is required",
      });
    }

    if (rawName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Party identity name must not exceed 100 characters",
      });
    }

    // Check for duplicate name for this specific user
    const existing = await checkDuplicatePartyIdentity(rawName, userId);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Party identity "${rawName}" already exists`,
      });
    }

    const created = await createPartyIdentity({
      userId,
      name: rawName,
    });

    return res.status(201).json({
      success: true,
      message: "Party identity created successfully",
      partyIdentity: created,
    });
  } catch (error) {
    console.error("Create party identity error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create party identity",
    });
  }
};

// ======================================================
// UPDATE PARTY IDENTITY (RENAME / EDIT)
// ======================================================

const updatePartyIdentityController = async (req, res) => {
  try {
    const userId = Number(req.user?.id || req.user?.user_id);
    const id = Number(req.params?.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User session missing",
      });
    }

    if (!id || !Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid Party Identity ID is required",
      });
    }

    // Verify ownership
    const current = await getPartyIdentityById(id, userId);
    if (!current) {
      return res.status(404).json({
        success: false,
        message: "Party identity not found or does not belong to your account",
      });
    }

    const rawName = String(req.body?.name || "").trim();

    if (!rawName) {
      return res.status(400).json({
        success: false,
        message: "Party identity name is required",
      });
    }

    if (rawName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Party identity name must not exceed 100 characters",
      });
    }

    // Check duplicate name excluding this ID
    const duplicate = await checkDuplicatePartyIdentity(rawName, userId, id);
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `Another party identity named "${rawName}" already exists`,
      });
    }

    await updatePartyIdentity(id, userId, { name: rawName });

    return res.status(200).json({
      success: true,
      message: "Party identity updated successfully",
      partyIdentity: {
        id,
        user_id: userId,
        name: rawName,
      },
    });
  } catch (error) {
    console.error("Update party identity error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update party identity",
    });
  }
};

// ======================================================
// DELETE PARTY IDENTITY (SAFELY UNLINKS ORDERS)
// ======================================================

const deletePartyIdentityController = async (req, res) => {
  try {
    const userId = Number(req.user?.id || req.user?.user_id);
    const id = Number(req.params?.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User session missing",
      });
    }

    if (!id || !Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid Party Identity ID is required",
      });
    }

    // Verify ownership
    const current = await getPartyIdentityById(id, userId);
    if (!current) {
      return res.status(404).json({
        success: false,
        message: "Party identity not found or does not belong to your account",
      });
    }

    await deletePartyIdentity(id, userId);

    return res.status(200).json({
      success: true,
      message: "Party identity deleted successfully. Any linked orders were safely unassigned.",
    });
  } catch (error) {
    console.error("Delete party identity error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete party identity",
    });
  }
};

module.exports = {
  getPartyIdentities: getPartyIdentitiesController,
  createPartyIdentity: createPartyIdentityController,
  updatePartyIdentity: updatePartyIdentityController,
  deletePartyIdentity: deletePartyIdentityController,
};
