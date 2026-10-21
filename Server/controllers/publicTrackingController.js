const {
  getTrackingForWaybills,
} = require("../services/delhiveryTrackingService");

// ======================================================
// PUBLIC DELHIVERY TRACKING
// ======================================================

const publicTrackingController = async (req, res) => {
  try {
    const awb = String(
      req.params?.awb || ""
    ).trim();

    // --------------------------------------------------
    // VALIDATE AWB
    // --------------------------------------------------

    if (!awb) {
      return res.status(400).json({
        success: false,
        message: "AWB number is required",
      });
    }

    // --------------------------------------------------
    // AWB FORMAT
    // --------------------------------------------------
    // Delhivery AWBs are normally numeric.
    // Keep validation reasonable without assuming
    // a fixed length.

    if (!/^\d+$/.test(awb)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid AWB number",
      });
    }

    // --------------------------------------------------
    // DELHIVERY TRACKING
    // --------------------------------------------------

    const trackingMap =
      await getTrackingForWaybills([awb]);

    const tracking =
      trackingMap?.[awb];

    // --------------------------------------------------
    // SHIPMENT NOT FOUND
    // --------------------------------------------------

    if (
      !tracking ||
      tracking.tracking_available === false
    ) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    // --------------------------------------------------
    // SAFE PUBLIC RESPONSE
    // --------------------------------------------------
    // Never expose internal DB/user/order data.

    return res.status(200).json({
      success: true,

      tracking: {
        awb:
          tracking.tracking_awb || awb,

        status:
          tracking.tracking_status || null,

        raw_status:
          tracking.tracking_raw_status || null,

        status_code:
          tracking.tracking_status_code || null,

        status_type:
          tracking.tracking_status_type || null,

        status_datetime:
          tracking.tracking_status_datetime || null,

        location:
          tracking.tracking_location || null,

        instructions:
          tracking.tracking_instructions || null,

        scans:
          Array.isArray(
            tracking.tracking_scans
          )
            ? tracking.tracking_scans
            : [],

        expected_delivery:
          tracking.tracking_expected_delivery ||
          null,

        pickup_date:
          tracking.tracking_pickup_date ||
          null,

        delivery_date:
          tracking.tracking_delivery_date ||
          null,

        rto_started_date:
          tracking.tracking_rto_started_date ||
          null,

        returned_date:
          tracking.tracking_returned_date ||
          null,
      },
    });
  } catch (error) {
    console.error(
      "Public tracking error:",
      error?.response?.data ||
        error?.message ||
        error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch shipment tracking",
    });
  }
};

module.exports = {
  publicTrackingController,
};