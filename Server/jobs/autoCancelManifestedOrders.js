const cron = require("node-cron");
const db = require("../config/db");

const {
  getTrackingForWaybills,
} = require("../services/delhiveryTrackingService");

const {
  cancelManifestedOrders,
} = require("../models/manifestModel");

let isRunning = false;

const runAutoCancel = async () => {
  if (isRunning) {
    console.log("⚠️ Auto-cancel job already running");
    return;
  }

  isRunning = true;

  try {
    console.log("==========================================");
    console.log("🤖 AUTO-CANCEL JOB STARTED");
    console.log("==========================================");

    const [candidates] = await db.promise().query(`
      SELECT
        m.id AS manifest_id,
        m.order_id,
        m.user_id,
        m.created_at AS manifest_created_at,
        o.awb,
        o.order_id AS display_order_id
      FROM manifests m
      INNER JOIN orders o
        ON o.id = m.order_id
       AND o.user_id = m.user_id
      WHERE UPPER(TRIM(COALESCE(m.status, ''))) = 'CONFIRMED'
        AND UPPER(TRIM(COALESCE(o.status, ''))) = 'MANIFESTED'
        AND m.created_at <= DATE_SUB(NOW(), INTERVAL 6 DAY)
        AND o.awb IS NOT NULL
        AND TRIM(o.awb) <> ''
      ORDER BY m.created_at ASC
    `);

    if (!candidates.length) {
      console.log("✅ No eligible orders for auto-cancellation");
      return;
    }

    console.log(
      `📦 Found ${candidates.length} order(s) older than 6 days`
    );

    const waybills = candidates.map((order) => order.awb);

    const trackingMap = await getTrackingForWaybills(waybills);

    for (const order of candidates) {
      const awb = String(order.awb || "").trim();

      const tracking = trackingMap[awb];

      if (!tracking || tracking.tracking_available !== true) {
        console.log(
          `⚠️ Tracking unavailable | Order: ${order.display_order_id} | AWB: ${awb}`
        );
        continue;
      }

      const trackingStatus = String(
        tracking.tracking_status || ""
      )
        .trim()
        .toUpperCase();

      console.log(
        `📦 Order: ${order.display_order_id} | AWB: ${awb} | Delhivery Status: ${trackingStatus}`
      );

      /*
       * AUTO-CANCEL ONLY WHEN CURRENT DELHIVERY STATUS IS:
       * MANIFESTED or NOT PICKED
       *
       * If shipment has moved to IN TRANSIT,
       * OUT FOR DELIVERY, DELIVERED, RTO, etc.
       * we do NOT cancel it.
       */
      if (
        trackingStatus !== "MANIFESTED" &&
        trackingStatus !== "NOT PICKED"
      ) {
        console.log(
          `⏭️ Skipping order ${order.display_order_id} because current status is ${trackingStatus}`
        );
        continue;
      }

      try {
        console.log(
          `🚨 AUTO-CANCELLING Order: ${order.display_order_id} | AWB: ${awb}`
        );

        /*
         * This uses the SAME cancellation flow already used
         * by manual manifest cancellation:
         *
         * 1. Delhivery cancellation API
         * 2. Only after successful cancellation:
         *    wallet refund
         * 3. Manifest -> Cancelled
         * 4. Order -> Cancelled
         */
        await cancelManifestedOrders(order.user_id, [order.order_id]);

        console.log(
          `✅ AUTO-CANCEL SUCCESS | Order: ${order.display_order_id} | AWB: ${awb}`
        );
      } catch (error) {
        /*
         * If Delhivery cancellation fails,
         * existing cancellation flow will not refund
         * or mark the order cancelled.
         */
        console.error(
          `❌ AUTO-CANCEL FAILED | Order: ${order.display_order_id} | AWB: ${awb}`
        );

        console.error(
          error?.response?.data ||
            error?.message ||
            error
        );
      }
    }

    console.log("==========================================");
    console.log("🤖 AUTO-CANCEL JOB FINISHED");
    console.log("==========================================");
  } catch (error) {
    console.error(
      "❌ AUTO-CANCEL JOB ERROR:",
      error?.message || error
    );
  } finally {
    isRunning = false;
  }
};

const startAutoCancelJob = () => {
  /*
   * Runs every hour.
   *
   * 6 days complete hone ke baad,
   * next hourly run eligible order ko pick karega.
   */
  cron.schedule(
    "0 * * * *",
    runAutoCancel,
    {
      timezone: "Asia/Kolkata",
    }
  );

  console.log("⏰ Auto-cancel scheduler started");

  /*
   * Server start hote hi ek baar check bhi karega.
   */
  runAutoCancel();
};

module.exports = {
  startAutoCancelJob,
  runAutoCancel,
};