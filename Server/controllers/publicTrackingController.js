const {
  trackShipmentUniversal,
} = require("../services/multiCarrierTrackingService");

// ======================================================
// UNIVERSAL MULTI-CARRIER PUBLIC TRACKING
// Supports: Delhivery (All India), Shree Tirupati,
// Shree Maruti, and Offline Consignments
// ======================================================

const publicTrackingController = async (req, res) => {
  try {
    const awb = String(req.params?.awb || "").trim();

    // --------------------------------------------------
    // VALIDATE AWB / CONSIGNMENT NUMBER
    // --------------------------------------------------

    if (!awb) {
      return res.status(400).json({
        success: false,
        message: "AWB / Consignment number is required",
      });
    }

    // Accepts alphanumeric consignment / AWB numbers (letters, numbers, hyphens)
    if (!/^[A-Za-z0-9\-_]{3,50}$/.test(awb)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid AWB or Consignment number",
      });
    }

    // --------------------------------------------------
    // UNIVERSAL MULTI-CARRIER TRACKING LOOKUP
    // --------------------------------------------------

    const preferredCarrier = req.query?.carrier || null;
    const tracking = await trackShipmentUniversal(awb, preferredCarrier);

    // --------------------------------------------------
    // SHIPMENT NOT FOUND
    // --------------------------------------------------

    if (!tracking || tracking.tracking_available === false) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found. Please verify the AWB or Consignment number.",
      });
    }

    // --------------------------------------------------
    // SAFE PUBLIC RESPONSE
    // --------------------------------------------------
    // Never expose internal database IDs or credentials.

    return res.status(200).json({
      success: true,
      tracking: {
        awb: tracking.tracking_awb || awb,
        carrier: tracking.carrier || "Delhivery",
        tracking_url: tracking.tracking_url || null,
        status: tracking.tracking_status || null,
        raw_status: tracking.tracking_raw_status || null,
        status_code: tracking.tracking_status_code || null,
        status_type: tracking.tracking_status_type || null,
        status_datetime: tracking.tracking_status_datetime || null,
        location: tracking.tracking_location || null,
        instructions: tracking.tracking_instructions || null,
        scans: Array.isArray(tracking.tracking_scans)
          ? tracking.tracking_scans
          : [],
        expected_delivery: tracking.tracking_expected_delivery || null,
        pickup_date: tracking.tracking_pickup_date || null,
        delivery_date: tracking.tracking_delivery_date || null,
        rto_started_date: tracking.tracking_rto_started_date || null,
        returned_date: tracking.tracking_returned_date || null,
      },
    });
  } catch (error) {
    console.error(
      "Public tracking error:",
      error?.response?.data || error?.message || error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch shipment tracking at this moment",
    });
  }
};

module.exports = {
  publicTrackingController,
};