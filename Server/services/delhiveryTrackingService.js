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
  process.env.DELHIVERY_API_BASE_URL ||
  "https://track.delhivery.com";

// ======================================================
// TRACKING DB CONCURRENCY
// ======================================================
//
// Instead of waiting for every DB UPDATE one-by-one,
// update a small group together.
//
// This keeps the DB safe while making All Orders faster.
// ======================================================

const TRACKING_DB_BATCH_SIZE = 10;

// ======================================================
// NORMALIZE STATUS
// ======================================================

const normalizeTrackingStatus = (
  shipment
) => {
  const status =
    shipment?.Status || {};

  const rawStatus = String(
    status?.Status || ""
  ).trim();

  const statusType = String(
    status?.StatusType || ""
  )
    .trim()
    .toUpperCase();

  const instructions = String(
    status?.Instructions || ""
  )
    .trim()
    .toLowerCase();

  const rawUpper =
    rawStatus.toUpperCase();

  // ----------------------------------------------
  // DELIVERED
  // ----------------------------------------------

  if (
    rawUpper === "DELIVERED"
  ) {
    return "DELIVERED";
  }

  // ----------------------------------------------
  // CANCELLED
  // ----------------------------------------------

  if (
    rawUpper === "CANCELLED" ||
    rawUpper === "CANCELED"
  ) {
    return "CANCELLED";
  }

  // ----------------------------------------------
  // RTO DELIVERED / RETURNED
  // ----------------------------------------------

  if (
    rawUpper.includes("RETURNED") ||
    rawUpper.includes("RTO DELIVERED") ||
    Boolean(
      shipment?.ReturnedDate
    )
  ) {
    return "RTO DELIVERED";
  }

  // ----------------------------------------------
  // RTO IN TRANSIT
  // ----------------------------------------------

  if (
    statusType === "RT" &&
    rawUpper === "IN TRANSIT"
  ) {
    return "RTO IN TRANSIT";
  }

  if (
    rawUpper.includes("RTO") ||
    rawUpper.includes("RETURN")
  ) {
    return "RTO IN TRANSIT";
  }

  // ----------------------------------------------
  // OUT FOR DELIVERY
  // ----------------------------------------------

  if (
    rawUpper.includes(
      "OUT FOR DELIVERY"
    ) ||
    instructions.includes(
      "out for delivery"
    )
  ) {
    return "OUT FOR DELIVERY";
  }

  // ----------------------------------------------
  // IN TRANSIT
  // ----------------------------------------------

  if (
    rawUpper === "IN TRANSIT" ||
    rawUpper === "INTRANSIT" ||
    rawUpper.includes(
      "IN TRANSIT"
    )
  ) {
    return "IN TRANSIT";
  }

  // ----------------------------------------------
  // NOT PICKED
  // Delhivery: Ready for Pickup
  // ----------------------------------------------

  if (
    rawUpper.includes(
      "READY FOR PICKUP"
    )
  ) {
    return "NOT PICKED";
  }

  // ----------------------------------------------
  // PENDING
  // ----------------------------------------------

  if (
    rawUpper === "PENDING"
  ) {
    return "PENDING";
  }

  // ----------------------------------------------
  // MANIFESTED / READY TO SHIP
  // ----------------------------------------------

  if (
    rawUpper === "MANIFESTED" ||
    rawUpper.includes(
      "READY TO SHIP"
    )
  ) {
    return "MANIFESTED";
  }

  // ----------------------------------------------
  // FALLBACK
  // ----------------------------------------------

  return rawStatus
    ? rawUpper
    : "MANIFESTED";
};

// ======================================================
// DELHIVERY STATUS -> INTERNAL ORDER STATUS
// ======================================================

const orderStatusMap = {
  DELIVERED:
    "Delivered",

  CANCELLED:
    "Cancelled",

  CANCELED:
    "Cancelled",

  "RTO DELIVERED":
    "RTO Delivered",

  "RTO IN TRANSIT":
    "RTO In Transit",

  "OUT FOR DELIVERY":
    "Out for Delivery",

  "IN TRANSIT":
    "In Transit",

  "NOT PICKED":
    "Not Picked",

  PENDING:
    "Pending",

  MANIFESTED:
    "Manifested",
};

// ======================================================
// UPDATE ONE TRACKING RECORD
// ======================================================
//
// This uses the same safe UPDATE structure that was
// already working before the bulk JSON optimization.
//
// The only optimization is that multiple AWB updates
// are executed concurrently in controlled batches.
// ======================================================

const updateTrackingInDatabase = async (
  awb,
  trackingData
) => {
  const normalizedAwb =
    String(awb || "").trim();

  if (
    !normalizedAwb ||
    !trackingData ||
    trackingData.tracking_available === false
  ) {
    return;
  }

  const trackingStatus =
    trackingData?.tracking_status ||
    null;

  const newOrderStatus =
    trackingStatus &&
    orderStatusMap[trackingStatus]
      ? orderStatusMap[trackingStatus]
      : null;

  // ----------------------------------------------
  // Convert tracking object to valid JSON text
  // ----------------------------------------------

  const trackingJson =
    JSON.stringify(
      trackingData
    );

  if (
    typeof trackingJson !== "string"
  ) {
    throw new Error(
      "Unable to convert tracking data to JSON"
    );
  }

  // ----------------------------------------------
  // Update database
  // ----------------------------------------------

  await db.promise().query(
    `
      UPDATE orders
      SET

        tracking_status = ?,

        tracking_data = ?,

        tracking_updated_at = NOW(),

        status = CASE

          WHEN UPPER(
            TRIM(
              COALESCE(
                status,
                ''
              )
            )
          ) IN (
            'CANCELLED',
            'CANCELED'
          )
            THEN status

          WHEN ? IS NOT NULL
            THEN ?

          ELSE status

        END

      WHERE awb = ?
    `,
    [
      trackingStatus,

      trackingJson,

      newOrderStatus,
      newOrderStatus,

      normalizedAwb,
    ]
  );
};

// ======================================================
// SAVE ALL TRACKING TO DATABASE
// ======================================================
//
// Controlled concurrency:
//
// 33 AWBs
// ↓
// 10 updates
// 10 updates
// 10 updates
// 3 updates
//
// Instead of:
//
// 1 → wait
// 2 → wait
// 3 → wait
// ...
// 33 → wait
//
// ======================================================

const saveTrackingToDatabase = async (
  trackingMap
) => {
  const entries =
    Object.entries(
      trackingMap || {}
    ).filter(
      ([awb, tracking]) =>
        String(awb || "").trim() &&
        tracking?.tracking_available !== false
    );

  if (
    entries.length === 0
  ) {
    return;
  }

  for (
    let i = 0;
    i < entries.length;
    i += TRACKING_DB_BATCH_SIZE
  ) {
    const batch =
      entries.slice(
        i,
        i + TRACKING_DB_BATCH_SIZE
      );

    await Promise.allSettled(
      batch.map(
        async ([awb, trackingData]) => {
          try {
            await updateTrackingInDatabase(
              awb,
              trackingData
            );
          } catch (error) {
            console.error(
              `Tracking DB update failed for AWB ${awb}:`,
              error?.message ||
                error
            );
          }
        }
      )
    );
  }
};

// ======================================================
// GET TRACKING DATA
// ======================================================

const getTrackingForWaybills = async (
  waybills
) => {
  if (
    !Array.isArray(waybills) ||
    waybills.length === 0
  ) {
    return {};
  }

  if (
    !DELHIVERY_API_TOKEN
  ) {
    console.error(
      "Delhivery API token is not configured"
    );

    return {};
  }

  // ==================================================
  // CLEAN AWBS
  // ==================================================

  const cleanWaybills = [
    ...new Set(
      waybills
        .map(
          (awb) =>
            String(
              awb || ""
            ).trim()
        )
        .filter(Boolean)
    ),
  ];

  if (
    cleanWaybills.length === 0
  ) {
    return {};
  }

  const trackingMap = {};

  // ==================================================
  // MAX 50 AWBS PER DELHIVERY REQUEST
  // ==================================================

  for (
    let i = 0;
    i < cleanWaybills.length;
    i += 50
  ) {
    const batch =
      cleanWaybills.slice(
        i,
        i + 50
      );

    const waybillParam =
      batch.join(",");

    const url =
      `${DELHIVERY_API_BASE_URL}` +
      `/api/v1/packages/json/`;

    try {
      // ----------------------------------------------
      // TRACKING API TIMER
      // ----------------------------------------------

      const trackingStart =
        Date.now();

      const response =
        await axios.get(
          url,
          {
            params: {
              waybill:
                waybillParam,
            },

            headers: {
              Authorization:
                `Token ${DELHIVERY_API_TOKEN}`,

              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            timeout: 30000,
          }
        );

      console.log(
        `DELHIVERY TRACKING TIME: ${
          Date.now() -
          trackingStart
        } ms | AWBs: ${batch.length}`
      );

      const data =
        response?.data || {};

      const shipmentData =
        Array.isArray(
          data?.ShipmentData
        )
          ? data.ShipmentData
          : [];

      // ==================================================
      // PROCESS SHIPMENTS
      // ==================================================

      for (
        const item of shipmentData
      ) {
        const shipment =
          item?.Shipment;

        if (!shipment) {
          continue;
        }

        const awb =
          String(
            shipment?.AWB ||
              shipment?.Waybill ||
              ""
          ).trim();

        if (!awb) {
          continue;
        }

        const status =
          shipment?.Status || {};

        const scans =
          Array.isArray(
            shipment?.Scans
          )
            ? shipment.Scans
            : [];

        // ----------------------------------------------
        // BUILD TRACKING OBJECT
        // ----------------------------------------------

        trackingMap[awb] = {
          tracking_status:
            normalizeTrackingStatus(
              shipment
            ),

          tracking_raw_status:
            String(
              status?.Status ||
                ""
            ).trim(),

          tracking_status_code:
            status?.StatusCode ||
            null,

          tracking_status_type:
            status?.StatusType ||
            null,

          tracking_status_datetime:
            status?.StatusDateTime ||
            null,

          tracking_location:
            status?.StatusLocation ||
            null,

          tracking_instructions:
            status?.Instructions ||
            null,

          tracking_scans:
            scans,

          tracking_expected_delivery:
            shipment
              ?.ExpectedDeliveryDate ||
            null,

          tracking_pickup_date:
            shipment
              ?.PickedupDate ||
            null,

          tracking_delivery_date:
            shipment
              ?.DeliveryDate ||
            null,

          tracking_rto_started_date:
            shipment
              ?.RTOStartedDate ||
            null,

          tracking_returned_date:
            shipment
              ?.ReturnedDate ||
            null,

          tracking_awb:
            awb,

          tracking_available:
            true,
        };
      }
    } catch (error) {
      // ----------------------------------------------
      // ONE BATCH FAILURE SHOULD NOT BREAK ALL ORDERS
      // ----------------------------------------------

      console.error(
        "Delhivery tracking batch error:",
        error?.response?.data ||
          error?.message ||
          error
      );

      for (
        const awb of batch
      ) {
        trackingMap[awb] = {
          tracking_available:
            false,

          tracking_error:
            error?.response?.data ||
            error?.message ||
            "Unable to fetch tracking status",
        };
      }
    }
  }

  // ======================================================
  // SAVE TRACKING TO DATABASE
  // ======================================================
  //
  // Delhivery API has already completed here.
  // DB updates happen in controlled parallel batches.
  // ======================================================

  await saveTrackingToDatabase(
    trackingMap
  );

  return trackingMap;
};

// ======================================================
// ATTACH TRACKING TO ORDERS
// ======================================================

const attachTrackingToOrders =
  async (orders) => {
    if (
      !Array.isArray(orders) ||
      orders.length === 0
    ) {
      return [];
    }

    // ----------------------------------------------
    // COLLECT AWBS
    // ----------------------------------------------

    const waybills =
      orders
        .map(
          (order) =>
            order?.awb ||
            order?.waybill ||
            null
        )
        .filter(Boolean);

    if (
      waybills.length === 0
    ) {
      return orders.map(
        (order) => ({
          ...order,

          tracking_available:
            false,
        })
      );
    }

    // ----------------------------------------------
    // GET TRACKING
    // ----------------------------------------------

    const trackingMap =
      await getTrackingForWaybills(
        waybills
      );

    // ----------------------------------------------
    // MERGE TRACKING INTO ORDERS
    // ----------------------------------------------

    return orders.map(
      (order) => {
        const awb =
          String(
            order?.awb ||
              order?.waybill ||
              ""
          ).trim();

        const tracking =
          trackingMap[awb];

        if (!tracking) {
          return {
            ...order,

            tracking_available:
              false,
          };
        }

        const dbStatus =
          String(
            order?.status ||
              order?.order_status ||
              ""
          )
            .trim()
            .toUpperCase();

        // ==================================================
        // CANCELLED ORDER PROTECTION
        // ==================================================
        //
        // If ParcelDrop order is already cancelled,
        // keep it cancelled in UI even if Delhivery
        // reports another tracking state.
        // ==================================================

        if (
          dbStatus ===
            "CANCELLED" ||
          dbStatus ===
            "CANCELED"
        ) {
          return {
            ...order,

            tracking_status:
              "CANCELLED",

            tracking_available:
              tracking.tracking_available,

            tracking_raw_status:
              tracking.tracking_raw_status,

            tracking_status_code:
              tracking.tracking_status_code,

            tracking_status_type:
              tracking.tracking_status_type,

            tracking_status_datetime:
              tracking.tracking_status_datetime,

            tracking_location:
              tracking.tracking_location,

            tracking_instructions:
              tracking.tracking_instructions,

            tracking_scans:
              tracking.tracking_scans,

            tracking_expected_delivery:
              tracking.tracking_expected_delivery,

            tracking_pickup_date:
              tracking.tracking_pickup_date,

            tracking_delivery_date:
              tracking.tracking_delivery_date,

            tracking_rto_started_date:
              tracking.tracking_rto_started_date,

            tracking_returned_date:
              tracking.tracking_returned_date,

            tracking_awb:
              tracking.tracking_awb,
          };
        }

        // ----------------------------------------------
        // NORMAL ORDER
        // ----------------------------------------------

        return {
          ...order,
          ...tracking,
        };
      }
    );
  };

// ======================================================
// EXPORT
// ======================================================

module.exports = {
  getTrackingForWaybills,
  attachTrackingToOrders,
  normalizeTrackingStatus,
};