const {
  calculateZone,
} = require("../services/zoneService");

const calculateZoneController = async (
  req,
  res
) => {
  try {
    const {
      pickup_pincode,
      delivery_pincode,
    } = req.body;

    if (
      !pickup_pincode ||
      !/^\d{6}$/.test(
        String(pickup_pincode)
      )
    ) {
      return res.status(400).json({
        message:
          "Valid 6-digit pickup pincode is required",
      });
    }

    if (
      !delivery_pincode ||
      !/^\d{6}$/.test(
        String(delivery_pincode)
      )
    ) {
      return res.status(400).json({
        message:
          "Valid 6-digit delivery pincode is required",
      });
    }

    const result =
      await calculateZone(
        pickup_pincode,
        delivery_pincode
      );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.log(
      "Zone calculation error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to calculate zone",
    });
  }
};

module.exports = {
  calculateZoneController,
};