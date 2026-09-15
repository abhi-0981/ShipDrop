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

    const {
      order_value,
      cod_amount,
      buyer_mobile,
      shipper_mobiles,
      shipper_address,
      product_name,
      services_tnc,
      order_id,
      order_weight,
      label_size,
      custom_logo,
    } = req.body;

    const settings = await saveLabelSettings(userId, {
      order_value: order_value !== undefined ? order_value : 1,
      cod_amount: cod_amount !== undefined ? cod_amount : 1,
      buyer_mobile:
        buyer_mobile !== undefined ? buyer_mobile : 1,
      shipper_mobiles:
        shipper_mobiles !== undefined ? shipper_mobiles : 1,
      shipper_address:
        shipper_address !== undefined ? shipper_address : 1,
      product_name:
        product_name !== undefined ? product_name : 1,
      services_tnc:
        services_tnc !== undefined ? services_tnc : 1,
      order_id: order_id !== undefined ? order_id : 1,
      order_weight:
        order_weight !== undefined ? order_weight : 1,
      label_size: label_size || "4x6",
      custom_logo:
        custom_logo !== undefined ? custom_logo : null,
    });

    return res.status(200).json({
      success: true,
      message: "Label settings saved successfully",
      settings,
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