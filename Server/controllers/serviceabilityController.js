const axios = require("axios");

const DELHIVERY_API_TOKEN =
  process.env.DELHIVERY_API_TOKEN;

const DELHIVERY_API_BASE_URL =
  process.env.DELHIVERY_API_BASE_URL ||
  "https://track.delhivery.com";

// ======================================================
// CHECK B2C PINCODE SERVICEABILITY
// ======================================================

const checkPincodeServiceability = async (req, res) => {
  try {
    const { pincode } = req.params;

    // ------------------------------------------
    // Validate pincode
    // ------------------------------------------

    const normalizedPincode =
      String(pincode || "").trim();

    if (!/^\d{6}$/.test(normalizedPincode)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6-digit pincode",
      });
    }

    // ------------------------------------------
    // Check Delhivery token
    // ------------------------------------------

    if (!DELHIVERY_API_TOKEN) {
      return res.status(500).json({
        success: false,
        message:
          "Delhivery API token is not configured",
      });
    }

    // ------------------------------------------
    // Delhivery B2C Pincode API
    // ------------------------------------------

    const url =
      `${DELHIVERY_API_BASE_URL}` +
      `/c/api/pin-codes/json/` +
      `?filter_codes=${normalizedPincode}`;

    console.log(
      "=============================================="
    );

    console.log(
      "📍 DELHIVERY PINCODE SERVICEABILITY"
    );

    console.log(
      "Pincode:",
      normalizedPincode
    );

    console.log(
      "URL:",
      url
    );

    console.log(
      "=============================================="
    );

    const response = await axios.get(url, {
      headers: {
        Authorization:
          `Token ${DELHIVERY_API_TOKEN}`,

        Accept:
          "application/json",
      },

      timeout: 30000,
    });

    const data = response.data;

    console.log(
      "Delhivery Pincode Response:",
      JSON.stringify(data, null, 2)
    );

    // ------------------------------------------
    // Empty response = Not serviceable
    // ------------------------------------------

    if (
      !Array.isArray(data?.delivery_codes) ||
      data.delivery_codes.length === 0
    ) {
      return res.json({
        success: true,

        serviceable: false,

        pincode:
          normalizedPincode,

        status:
          "NOT_SERVICEABLE",

        message:
          "Delivery is not available at this pincode",

        data: [],
      });
    }

    // ------------------------------------------
    // Get first serviceability result
    // ------------------------------------------

    const pincodeData =
      data.delivery_codes[0]?.postal_code ||
      data.delivery_codes[0];

    const remarks =
      String(
        pincodeData?.remarks || ""
      ).trim();

    // ------------------------------------------
    // Embargo = temporarily not serviceable
    // ------------------------------------------

    if (
      remarks.toLowerCase() ===
      "embargo"
    ) {
      return res.json({
        success: true,

        serviceable: false,

        pincode:
          normalizedPincode,

        status:
          "EMBARGO",

        message:
          "Delivery is temporarily unavailable at this pincode",

        data:
          data.delivery_codes,
      });
    }

    // ------------------------------------------
    // Serviceable
    // ------------------------------------------

    return res.json({
      success: true,

      serviceable: true,

      pincode:
        normalizedPincode,

      status:
        "SERVICEABLE",

      message:
        "Delivery is available at this pincode",

      data:
        data.delivery_codes,
    });

  } catch (error) {

    console.log(
      "❌ Pincode serviceability error:",
      error.response?.data ||
        error.message
    );

    return res.status(
      error.response?.status || 500
    ).json({
      success: false,

      message:
        error.response?.data?.message ||
        "Unable to check pincode serviceability",
    });
  }
};

module.exports = {
  checkPincodeServiceability,
};