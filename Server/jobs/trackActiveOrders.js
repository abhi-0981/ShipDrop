const cron = require("node-cron");
const db = require("../config/db");
const {
  getTrackingForWaybills,
} = require("../services/delhiveryTrackingService");

let isRunning = false;

const runTrackingJob = async () => {
  if (isRunning) {
    console.log("⏳ TRACKING JOB ALREADY RUNNING - SKIPPING");
    return;
  }

  isRunning = true;

  try {
    console.log("========================================");
    console.log("🚚 TRACKING JOB STARTED");
    console.log("========================================");

    const [orders] = await db.promise().query(`
      SELECT
        id,
        awb,
        status,
        tracking_status
      FROM orders
      WHERE awb IS NOT NULL
        AND TRIM(awb) <> ''
        AND UPPER(TRIM(COALESCE(status, ''))) NOT IN (
          'CANCELLED',
          'DELIVERED'
        )
        AND UPPER(TRIM(COALESCE(tracking_status, ''))) NOT IN (
          'DELIVERED',
          'CANCELLED',
          'RTO DELIVERED'
        )
      ORDER BY id ASC
    `);

    if (!orders || orders.length === 0) {
      console.log("ℹ️ No active orders found for tracking.");
      return;
    }

    const waybills = [
      ...new Set(
        orders
          .map((order) => String(order.awb || "").trim())
          .filter(Boolean)
      ),
    ];

    if (waybills.length === 0) {
      console.log("ℹ️ No valid AWBs found.");
      return;
    }

    console.log(`📦 Active AWBs found: ${waybills.length}`);

    const trackingMap = await getTrackingForWaybills(waybills);

    let updatedCount = 0;
    let unavailableCount = 0;

    for (const awb of waybills) {
      const tracking = trackingMap?.[awb];

      if (!tracking) {
        unavailableCount++;
        continue;
      }

      if (tracking.tracking_available === false) {
        unavailableCount++;
        continue;
      }

      updatedCount++;

      console.log(
        `✅ TRACKING CHECKED | AWB: ${awb} | STATUS: ${
          tracking.tracking_status || "UNKNOWN"
        }`
      );
    }

    console.log("========================================");
    console.log("🚚 TRACKING JOB FINISHED");
    console.log(`📦 AWBs checked: ${waybills.length}`);
    console.log(`✅ Tracking received: ${updatedCount}`);
    console.log(`⚠️ Tracking unavailable: ${unavailableCount}`);
    console.log("========================================");
  } catch (error) {
    console.error("❌ TRACKING JOB ERROR:", error?.message || error);
  } finally {
    isRunning = false;
  }
};

const startTrackingJob = () => {
  console.log("🚀 Tracking polling job initialized.");
  console.log("⏱️ Tracking interval: Every 15 minutes");

  cron.schedule(
    "*/15 * * * *",
    () => {
      runTrackingJob();
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  // Run once immediately when server starts
  runTrackingJob();
};

module.exports = {
  startTrackingJob,
  runTrackingJob,
};