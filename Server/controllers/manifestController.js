const manifestModel = require("../models/manifestModel");

// ======================================================
// HELPERS
// ======================================================

const getUserId = (req) => {
  return (
    req.user?.id ||
    req.user?.user_id ||
    req.user?.userId ||
    req.body?.user_id ||
    req.query?.user_id ||
    null
  );
};

const sendError = (res, status, message) => {
  return res.status(status).json({
    success: false,
    message,
  });
};

const normalizeId = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isNaN(number) ? value : number;
};

// ======================================================
// GET ALL MANIFESTED ORDERS
// GET /api/manifests
// ======================================================

const getManifestedOrders = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return sendError(
        res,
        400,
        "User ID is required"
      );
    }

    const manifests =
      await manifestModel.getManifestedOrders(
        userId
      );

    const list = Array.isArray(manifests)
      ? manifests
      : [];

    return res.status(200).json({
      success: true,
      total: list.length,
      manifests: list,
    });

  } catch (error) {
    console.error(
      "❌ GET MANIFESTED ORDERS ERROR:",
      error
    );

    return sendError(
      res,
      500,
      error?.message ||
        "Unable to fetch manifested orders"
    );
  }
};

// ======================================================
// GET SINGLE MANIFEST
// GET /api/manifests/:id
// ======================================================

const getManifestById = async (req, res) => {
  try {
    const userId = getUserId(req);

    const manifestId = normalizeId(
      req.params?.manifest_id ||
      req.params?.id
    );

    if (!userId) {
      return sendError(
        res,
        400,
        "User ID is required"
      );
    }

    if (!manifestId) {
      return sendError(
        res,
        400,
        "Manifest ID is required"
      );
    }

    const manifest =
      await manifestModel.getManifestById(
        userId,
        manifestId
      );

    if (!manifest) {
      return sendError(
        res,
        404,
        "Manifest not found"
      );
    }

    return res.status(200).json({
      success: true,
      manifest,
    });

  } catch (error) {
    console.error(
      "❌ GET MANIFEST BY ID ERROR:",
      error
    );

    if (
      error?.message ===
      "Manifest not found"
    ) {
      return sendError(
        res,
        404,
        "Manifest not found"
      );
    }

    return sendError(
      res,
      500,
      error?.message ||
        "Unable to fetch manifest"
    );
  }
};

// ======================================================
// CANCEL MANIFESTED ORDERS
// POST /api/manifests/cancel
// ======================================================

const cancelManifestedOrders = async (
  req,
  res
) => {
  try {
    const userId = getUserId(req);

    const rawOrderIds =
      req.body?.order_ids;

    if (!userId) {
      return sendError(
        res,
        400,
        "User ID is required"
      );
    }

    if (!Array.isArray(rawOrderIds)) {
      return sendError(
        res,
        400,
        "order_ids must be an array"
      );
    }

    if (rawOrderIds.length === 0) {
      return sendError(
        res,
        400,
        "At least one order must be selected"
      );
    }

    // Remove empty values
    const orderIds = rawOrderIds
      .map(normalizeId)
      .filter(
        (id) =>
          id !== null &&
          id !== undefined &&
          id !== ""
      );

    if (orderIds.length === 0) {
      return sendError(
        res,
        400,
        "At least one valid order ID is required"
      );
    }

    // Remove duplicate IDs
    const uniqueOrderIds = [
      ...new Set(orderIds),
    ];

    console.log(
      "=========================================="
    );

    console.log(
      "🚫 CANCEL MANIFESTED ORDERS"
    );

    console.log(
      "USER ID:",
      userId
    );

    console.log(
      "ORDER IDS:",
      uniqueOrderIds
    );

    console.log(
      "=========================================="
    );

    const result =
      await manifestModel.cancelManifestedOrders(
        userId,
        uniqueOrderIds
      );

    return res.status(200).json({
      success:
        result?.success !== false,

      message:
        result?.message ||
        "Selected shipments cancelled",

      ...(result || {}),
    });

  } catch (error) {
    console.error(
      "❌ CANCEL MANIFESTED ORDERS ERROR:",
      error
    );

    if (
      error?.message ===
      "Manifest not found"
    ) {
      return sendError(
        res,
        404,
        "Manifest not found"
      );
    }

    return sendError(
      res,
      500,
      error?.message ||
        "Unable to cancel manifested orders"
    );
  }
};

// ======================================================
// EXPORT
// ======================================================

module.exports = {
  getManifestedOrders,
  getManifestById,
  cancelManifestedOrders,
};