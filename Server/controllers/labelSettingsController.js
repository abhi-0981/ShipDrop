
const {
  getLabelSettings,
  saveLabelSettings,
  removeCustomLogo,
} = require("../models/labelSettingsModel");

const getUserId = (req) => {
  return (
    req.user?.id ||
    req.user?.user_id ||
    req.body?.user_id ||
    req.query?.user_id
  );
};

/**
 * Read a camelCase or snake_case field from the request.
 */
const getRequestValue = (body, camelKey, snakeKey, fallback) => {
  if (body[camelKey] !== undefined) {
    return body[camelKey];
  }

  if (body[snakeKey] !== undefined) {
    return body[snakeKey];
  }

  return fallback;
};

/**
 * GET /api/label-settings
 */
const getSettings = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const settings = await getLabelSettings(userId);

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Get label settings error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to get label settings",
    });
  }
};

/**
 * PUT /api/label-settings
 */
const updateSettings = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const body = req.body || {};

    // Load existing settings so omitted fields are preserved.
    const current = await getLabelSettings(userId);

    const settings = {
      order_value: getRequestValue(
        body,
        "orderValue",
        "order_value",
        current.order_value
      ),

      cod_amount: getRequestValue(
        body,
        "codAmount",
        "cod_amount",
        current.cod_amount
      ),

      buyer_mobile: getRequestValue(
        body,
        "buyerMobile",
        "buyer_mobile",
        current.buyer_mobile
      ),

      shipper_mobiles: getRequestValue(
        body,
        "shipperMobiles",
        "shipper_mobiles",
        current.shipper_mobiles
      ),

      shipper_address: getRequestValue(
        body,
        "shipperAddress",
        "shipper_address",
        current.shipper_address
      ),

      product_name: getRequestValue(
        body,
        "productName",
        "product_name",
        current.product_name
      ),

      services_tnc: getRequestValue(
        body,
        "servicesTnc",
        "services_tnc",
        current.services_tnc
      ),

      order_id: getRequestValue(
        body,
        "orderId",
        "order_id",
        current.order_id
      ),

      order_weight: getRequestValue(
        body,
        "orderWeight",
        "order_weight",
        current.order_weight
      ),

      label_size: getRequestValue(
        body,
        "labelSize",
        "label_size",
        current.label_size || "4x6"
      ),

      right_logo_mode: getRequestValue(
        body,
        "rightLogoMode",
        "right_logo_mode",
        current.right_logo_mode || "delhivery"
      ),

      from_name: getRequestValue(
        body,
        "fromName",
        "from_name",
        current.from_name
      ),

      from_address: getRequestValue(
        body,
        "fromAddress",
        "from_address",
        current.from_address
      ),

      from_mobile: getRequestValue(
        body,
        "fromMobile",
        "from_mobile",
        current.from_mobile
      ),

      product_details: getRequestValue(
        body,
        "productDetails",
        "product_details",
        current.product_details
      ),

      return_address: getRequestValue(
        body,
        "returnAddress",
        "return_address",
        current.return_address
      ),

      contact_line: getRequestValue(
        body,
        "contactLine",
        "contact_line",
        current.contact_line
      ),

      custom_logo: getRequestValue(
        body,
        "customLogo",
        "custom_logo",
        current.custom_logo
      ),
    };

    const savedSettings = await saveLabelSettings(
      userId,
      settings
    );

    return res.status(200).json({
      success: true,
      message: "Label settings saved successfully",
      settings: savedSettings,
    });
  } catch (error) {
    console.error("Update label settings error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to save label settings",
    });
  }
};

/**
 * DELETE /api/label-settings/logo
 */
const deleteLogo = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const settings = await removeCustomLogo(userId);

    return res.status(200).json({
      success: true,
      message: "Custom logo removed successfully",
      settings,
    });
  } catch (error) {
    console.error("Delete label logo error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to remove custom logo",
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  deleteLogo,
};
