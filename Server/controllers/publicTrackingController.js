const db = require("../config/db");
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
    // DESTINATION & ORIGIN RESOLUTION
    // --------------------------------------------------
    // Attempt to enrich destination from local orders DB
    // (city, state, pincode), with graceful fallback to
    // Delhivery tracking payload.

    let dbOrder = null;
    try {
      const [rows] = await db.promise().query(
        "SELECT city, state, pincode FROM orders WHERE awb = ? LIMIT 1",
        [awb]
      );
      if (Array.isArray(rows) && rows.length > 0) {
        dbOrder = rows[0];
      }
    } catch (dbErr) {
      console.warn("Public tracking DB lookup warning:", dbErr?.message);
    }

    let destination = null;
    if (dbOrder?.city) {
      const parts = [dbOrder.city.trim()];
      if (dbOrder.state && dbOrder.state.trim()) {
        parts.push(dbOrder.state.trim());
      }
      destination = parts.join(", ");
      if (dbOrder.pincode) {
        destination += ` (${dbOrder.pincode})`;
      }
    } else if (tracking.tracking_consignee?.city) {
      const c = tracking.tracking_consignee;
      const parts = [c.city.trim()];
      if (c.state && c.state.trim()) {
        parts.push(c.state.trim());
      }
      destination = parts.join(", ");
      if (c.pincode) {
        destination += ` (${c.pincode})`;
      }
    } else if (tracking.tracking_destination) {
      destination = tracking.tracking_destination;
    }

    const origin = tracking.tracking_origin || null;

    // --------------------------------------------------
    // SAFE PUBLIC RESPONSE
    // --------------------------------------------------
    // Never expose sensitive internal DB/user/order data.

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

        destination,

        origin,

        city:
          dbOrder?.city ||
          tracking.tracking_consignee?.city ||
          null,

        state:
          dbOrder?.state ||
          tracking.tracking_consignee?.state ||
          null,

        pincode:
          dbOrder?.pincode ||
          tracking.tracking_consignee?.pincode ||
          null,

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