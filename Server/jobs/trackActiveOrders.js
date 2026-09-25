const cron = require("node-cron");
const db = require("../config/db");
const {
  getTrackingForWaybills,
} = require("../services/delhiveryTrackingService");

let isRunning = false;

const runTrackingJob = async () => {
  if (isRunning) {
    return;
  }

  isRunning = true;

  try {
    

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
      return;
    }


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

      
    }

 
  } catch (error) {
  } finally {
    isRunning = false;
  }
};

const startTrackingJob = () => {


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