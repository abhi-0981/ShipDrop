const axios = require("axios");
const db = require("../config/db");

// ======================================================
// DELHIVERY CONFIG
// ======================================================

const DELHIVERY_API_TOKEN =
  process.env.DELHIVERY_API_TOKEN ||
  process.env.DELHIVERY_AUTH_TOKEN ||
  process.env.DELHIVERY_TOKEN;

const DELHIVERY_API_BASE_URL =
  process.env.DELHIVERY_API_BASE_URL || "https://track.delhivery.com";

// ======================================================
// NORMALIZE STATUS
// ======================================================

const normalizeTrackingStatus = (shipment) => {
  const status = shipment?.Status || {};

  const rawStatus = String(status?.Status || "").trim();

  const statusType = String(status?.StatusType || "")
    .trim()
    .toUpperCase();

  const instructions = String(status?.Instructions || "")
    .trim()
    .toLowerCase();

  const rawUpper = rawStatus.toUpperCase();

  // ----------------------------------------------
  // DELIVERED
  // ----------------------------------------------

  if (rawUpper === "DELIVERED") {
    return "DELIVERED";
  }

  // ----------------------------------------------
  // CANCELLED
  // ----------------------------------------------

  if (rawUpper === "CANCELLED" || rawUpper === "CANCELED") {
    return "CANCELLED";
  }

  // ----------------------------------------------
  // RTO DELIVERED / RETURNED
  // ----------------------------------------------

  if (
    rawUpper.includes("RETURNED") ||
    rawUpper.includes("RTO DELIVERED") ||
    Boolean(shipment?.ReturnedDate)
  ) {
    return "RTO DELIVERED";
  }

  // ----------------------------------------------
  // RTO IN TRANSIT
  // ----------------------------------------------

  if (statusType === "RT" && rawUpper === "IN TRANSIT") {
    return "RTO IN TRANSIT";
  }

  if (rawUpper.includes("RTO") || rawUpper.includes("RETURN")) {
    return "RTO IN TRANSIT";
  }

  // ----------------------------------------------
  // OUT FOR DELIVERY
  // ----------------------------------------------

  if (
    rawUpper.includes("OUT FOR DELIVERY") ||
    instructions.includes("out for delivery")
  ) {
    return "OUT FOR DELIVERY";
  }

  // ----------------------------------------------
  // IN TRANSIT
  // ----------------------------------------------

  if (
    rawUpper === "IN TRANSIT" ||
    rawUpper === "INTRANSIT" ||
    rawUpper.includes("IN TRANSIT")
  ) {
    return "IN TRANSIT";
  }

  // ----------------------------------------------
  // NOT PICKED
  // Delhivery: Ready for Pickup
  // ----------------------------------------------

  if (rawUpper.includes("READY FOR PICKUP")) {
    return "NOT PICKED";
  }

  // ----------------------------------------------
  // PENDING
  // ----------------------------------------------

  if (rawUpper === "PENDING") {
    return "PENDING";
  }

  // ----------------------------------------------
  // MANIFESTED / READY TO SHIP
  // ----------------------------------------------

  if (rawUpper === "MANIFESTED" || rawUpper.includes("READY TO SHIP")) {
    return "MANIFESTED";
  }

  // ----------------------------------------------
  // FALLBACK
  // ----------------------------------------------

  return rawStatus ? rawUpper : "MANIFESTED";
};

// ======================================================
// GET TRACKING DATA
// ======================================================

const getTrackingForWaybills = async (waybills) => {
  if (!Array.isArray(waybills) || waybills.length === 0) {
    return {};
  }

  if (!DELHIVERY_API_TOKEN) {
    console.error("Delhivery API token is not configured");

    return {};
  }

  // ----------------------------------------------
  // CLEAN AWBS
  // ----------------------------------------------

  const cleanWaybills = [
    ...new Set(waybills.map((awb) => String(awb || "").trim()).filter(Boolean)),
  ];

  if (cleanWaybills.length === 0) {
    return {};
  }

  const trackingMap = {};

  // ==================================================
  // DELHIVERY ALLOWS MAX 50 AWBS PER REQUEST
  // ==================================================

  for (let i = 0; i < cleanWaybills.length; i += 50) {
    const batch = cleanWaybills.slice(i, i + 50);

    const waybillParam = batch.join(",");

    const url = `${DELHIVERY_API_BASE_URL}` + `/api/v1/packages/json/`;

    try {
      const response = await axios.get(url, {
        params: {
          waybill: waybillParam,
        },

        headers: {
          Authorization: `Token ${DELHIVERY_API_TOKEN}`,

          "Content-Type": "application/json",

          Accept: "application/json",
        },

        timeout: 30000,
      });

      const data = response?.data || {};

      const shipmentData = Array.isArray(data?.ShipmentData)
        ? data.ShipmentData
        : [];

      // ==================================================
      // PROCESS SHIPMENTS
      // ==================================================

      for (const item of shipmentData) {
        const shipment = item?.Shipment;

        if (!shipment) {
          continue;
        }

        const awb = String(shipment?.AWB || shipment?.Waybill || "").trim();

        if (!awb) {
          continue;
        }

        const status = shipment?.Status || {};

        const scans = Array.isArray(shipment?.Scans) ? shipment.Scans : [];

        trackingMap[awb] = {
          tracking_status: normalizeTrackingStatus(shipment),

          tracking_raw_status: String(status?.Status || "").trim(),

          tracking_status_code: status?.StatusCode || null,

          tracking_status_type: status?.StatusType || null,

          tracking_status_datetime: status?.StatusDateTime || null,

          tracking_location: status?.StatusLocation || null,

          tracking_instructions: status?.Instructions || null,

          tracking_scans: scans,

          tracking_expected_delivery: shipment?.ExpectedDeliveryDate || null,

          tracking_pickup_date: shipment?.PickedupDate || null,

          tracking_delivery_date: shipment?.DeliveryDate || null,

          tracking_rto_started_date: shipment?.RTOStartedDate || null,

          tracking_returned_date: shipment?.ReturnedDate || null,

          tracking_awb: awb,

          tracking_available: true,
        };
      }
    } catch (error) {
      // ----------------------------------------------
      // ONE BATCH FAIL SHOULD NOT BREAK ALL ORDERS
      // ----------------------------------------------

      console.error(
        "Delhivery tracking batch error:",
        error?.response?.data || error?.message || error,
      );

      for (const awb of batch) {
        trackingMap[awb] = {
          tracking_available: false,

          tracking_error:
            error?.response?.data ||
            error?.message ||
            "Unable to fetch tracking status",
        };
      }
    }
  }

  // ======================================================
  // DELHIVERY STATUS -> SHIPDROP STATUS
  // ======================================================

  const orderStatusMap = {
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
    CANCELED: "Cancelled",
    "RTO DELIVERED": "RTO Delivered",
    "RTO IN TRANSIT": "RTO In Transit",
    "OUT FOR DELIVERY": "Out for Delivery",
    "IN TRANSIT": "In Transit",
    "NOT PICKED": "Not Picked",
    PENDING: "Pending",
    MANIFESTED: "Manifested",
  };

  // ======================================================
  // ONLY SUCCESSFUL TRACKING RESPONSES
  // ARE WRITTEN TO DATABASE
  // ======================================================

  const trackingEntries = Object.entries(trackingMap).filter(
    ([awb, tracking]) =>
      String(awb || "").trim() && tracking?.tracking_available !== false,
  );

  if (trackingEntries.length === 0) {
    return trackingMap;
  }

  // ======================================================
  // BUILD ONE BULK UPDATE QUERY
  // ======================================================

  const trackingStatusCase = [];
  const trackingDataCase = [];
  const statusCase = [];

  const params = [];

  for (const [awb, tracking] of trackingEntries) {
    const normalizedAwb = String(awb).trim();

    const trackingStatus = tracking?.tracking_status || null;

    const newOrderStatus =
      trackingStatus && orderStatusMap[trackingStatus]
        ? orderStatusMap[trackingStatus]
        : null;

    // ----------------------------------------------
    // tracking_status
    // ----------------------------------------------

    trackingStatusCase.push("WHEN awb = ? THEN ?");

    params.push(normalizedAwb, trackingStatus);

    // ----------------------------------------------
    // tracking_data
    // ----------------------------------------------

    trackingDataCase.push("WHEN awb = ? THEN ?");

    params.push(normalizedAwb, JSON.stringify(tracking));

    // ----------------------------------------------
    // internal order status
    // ----------------------------------------------

    if (newOrderStatus !== null) {
      statusCase.push("WHEN awb = ? THEN ?");

      params.push(normalizedAwb, newOrderStatus);
    }
  }

  // ----------------------------------------------
  // WHERE AWBs
  // ----------------------------------------------

  const whereAwbs = trackingEntries.map(() => "?").join(", ");

  for (const [awb] of trackingEntries) {
    params.push(String(awb).trim());
  }

  // ======================================================
  // ONE DB UPDATE
  // ======================================================

  let connection;

  try {
    connection = await db.promise().getConnection();

    await connection.beginTransaction();

    await connection.query(
      `
        UPDATE orders
        SET

          tracking_status = CASE
            ${trackingStatusCase.join("\n            ")}
            ELSE tracking_status
          END,

          tracking_data = CASE
            ${trackingDataCase.join("\n            ")}
            ELSE tracking_data
          END,

          tracking_updated_at = NOW(),

          status = CASE

            -- Existing cancelled orders
            -- must remain cancelled.
            WHEN UPPER(
              TRIM(
                COALESCE(status, '')
              )
            ) IN (
              'CANCELLED',
              'CANCELED'
            )
              THEN status

            ${statusCase.length ? statusCase.join("\n            ") : ""}

            ELSE status
          END

        WHERE awb IN (
          ${whereAwbs}
        )
      `,
      params,
    );

    await connection.commit();
  } catch (dbError) {
    try {
      if (connection) {
        await connection.rollback();
      }
    } catch (rollbackError) {
      console.error(
        "Tracking DB rollback error:",
        rollbackError?.message || rollbackError,
      );
    }

    // Tracking API result should still be returned
    // even if local DB update fails.
    console.error(
      "Bulk tracking DB update error:",
      dbError?.message || dbError,
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }

  return trackingMap;
};

// ======================================================
// ATTACH TRACKING TO ORDERS
// ======================================================

const attachTrackingToOrders = async (orders) => {
  if (!Array.isArray(orders) || orders.length === 0) {
    return [];
  }

  const waybills = orders
    .map((order) => order?.awb || order?.waybill || null)
    .filter(Boolean);

  if (waybills.length === 0) {
    return orders.map((order) => ({
      ...order,

      tracking_available: false,
    }));
  }

  const trackingMap = await getTrackingForWaybills(waybills);

  return orders.map((order) => {
    const awb = String(order?.awb || order?.waybill || "").trim();

    const tracking = trackingMap[awb];

    if (!tracking) {
      return {
        ...order,

        tracking_available: false,
      };
    }

    const dbStatus = String(order?.status || order?.order_status || "")
      .trim()
      .toUpperCase();

    // --------------------------------------------------
    // IF SHIPDROP ORDER IS ALREADY CANCELLED
    // KEEP TRACKING RESPONSE BUT SHOW CANCELLED
    // --------------------------------------------------

    if (dbStatus === "CANCELLED" || dbStatus === "CANCELED") {
      return {
        ...order,

        tracking_status: "CANCELLED",

        tracking_available: tracking.tracking_available,

        tracking_raw_status: tracking.tracking_raw_status,

        tracking_status_code: tracking.tracking_status_code,

        tracking_status_type: tracking.tracking_status_type,

        tracking_status_datetime: tracking.tracking_status_datetime,

        tracking_location: tracking.tracking_location,

        tracking_instructions: tracking.tracking_instructions,

        tracking_scans: tracking.tracking_scans,

        tracking_expected_delivery: tracking.tracking_expected_delivery,

        tracking_pickup_date: tracking.tracking_pickup_date,

        tracking_delivery_date: tracking.tracking_delivery_date,

        tracking_rto_started_date: tracking.tracking_rto_started_date,

        tracking_returned_date: tracking.tracking_returned_date,

        tracking_awb: tracking.tracking_awb,
      };
    }

    return {
      ...order,
      ...tracking,
    };
  });
};

// ======================================================
// EXPORT
// ======================================================

module.exports = {
  getTrackingForWaybills,
  attachTrackingToOrders,
  normalizeTrackingStatus,
};
