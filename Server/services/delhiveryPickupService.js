const db = require("../config/db");
const axios = require("axios");

// ======================================================
// CONFIG
// ======================================================

const DELHIVERY_API_TOKEN =
  process.env.DELHIVERY_API_TOKEN;

const DELHIVERY_API_BASE_URL =
  process.env.DELHIVERY_API_BASE_URL ||
  "https://track.delhivery.com";

const DELHIVERY_PICKUP_TIME = 
  process.env.DELHIVERY_PICKUP_TIME ||
  "11:00:00";

const DELHIVERY_TIMEZONE =
  process.env.DELHIVERY_TIMEZONE ||
  "Asia/Kolkata";


// ======================================================
// DB QUERY HELPER
// ======================================================

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};


// ======================================================
// CURRENT DATE
// ======================================================

const getCurrentDate = () => {
  const formatter = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: DELHIVERY_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  );

  return formatter.format(new Date());
};


// ======================================================
// VALIDATE TIME
// ======================================================

const normalizePickupTime = (time) => {
  const value = String(
    time || DELHIVERY_PICKUP_TIME
  ).trim();

  if (!/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    throw new Error(
      "Invalid Delhivery pickup time. Expected HH:MM:SS"
    );
  }

  return value;
};


// ======================================================
// CREATE PICKUP REQUEST IN DELHIVERY
// ======================================================

const createDelhiveryPickup = async ({
  pickup_date,
  pickup_time,
  pickup_location,
  expected_package_count,
}) => {

  if (!DELHIVERY_API_TOKEN) {
    throw new Error(
      "Delhivery API token is not configured"
    );
  }

  if (!pickup_location) {
    throw new Error(
      "Delhivery pickup location is required"
    );
  }

  if (
    !Number.isInteger(
      Number(expected_package_count)
    ) ||
    Number(expected_package_count) <= 0
  ) {
    throw new Error(
      "Expected package count must be greater than 0"
    );
  }

  const url =
    `${DELHIVERY_API_BASE_URL}` +
    `/fm/request/new/`;

  const payload = {
    pickup_time:
      normalizePickupTime(pickup_time),

    pickup_date,

    pickup_location:
      String(pickup_location).trim(),

    expected_package_count:
      Number(expected_package_count),
  };

  console.log(
    "========== DELHIVERY PICKUP REQUEST =========="
  );

  console.log(
    "URL:",
    url
  );

  console.log(
    "Payload:",
    JSON.stringify(
      payload,
      null,
      2
    )
  );

  console.log(
    "==============================================="
  );

  try {

    const response =
      await axios.post(
        url,
        payload,
        {
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

    const data =
      response.data;

    console.log(
      "========== DELHIVERY PICKUP RESPONSE =========="
    );

    console.log(
      JSON.stringify(
        data,
        null,
        2
      )
    );

    console.log(
      "==============================================="
    );

    if (!data) {
      throw new Error(
        "Empty response received from Delhivery pickup API"
      );
    }

    const pickupId =
      String(
        data.pickup_id || ""
      ).trim();

    if (!pickupId) {
      throw new Error(
        "Delhivery pickup request succeeded but pickup_id was not returned"
      );
    }

    return {
      pickup_id:
        pickupId,

      client_name:
        data.client_name || null,

      pickup_location_name:
        data.pickup_location_name || null,

      incoming_center_name:
        data.incoming_center_name || null,

      pickup_time:
        data.pickup_time ||
        payload.pickup_time,

      pickup_date:
        data.pickup_date ||
        payload.pickup_date,

      expected_package_count:
        Number(
          data.expected_package_count ??
          payload.expected_package_count
        ),

      raw_response:
        data,
    };

  } catch (error) {

    console.log(
      "Delhivery pickup API error:",
      error.response?.data ||
      error.message
    );

    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Unable to create Delhivery pickup request"
    );
  }
};


// ======================================================
// GET EXISTING PICKUP FOR WAREHOUSE + DATE
// ======================================================

const getExistingPickupRequest = async ({
  warehouse_id,
  pickup_date,
}) => {

  const rows =
    await query(
      `
        SELECT
          id,
          user_id,
          warehouse_id,
          pickup_id,
          pickup_date,
          pickup_time,
          expected_package_count,
          pickup_location_name,
          incoming_center_name,
          client_name,
          status,
          raw_response
        FROM pickup_requests
        WHERE warehouse_id = ?
          AND pickup_date = ?
          AND status = 'CREATED'
        ORDER BY id DESC
        LIMIT 1
      `,
      [
        warehouse_id,
        pickup_date,
      ]
    );

  return rows[0] || null;
};


// ======================================================
// CREATE / GET PICKUP REQUEST
// ======================================================

const getOrCreatePickupRequest = async ({
  user_id,
  warehouse_id,
  package_count,
  pickup_time,
}) => {

  // ----------------------------------------------------
  // WAREHOUSE
  // ----------------------------------------------------

  const warehouses =
    await query(
      `
        SELECT
          id,
          user_id,
          warehouse_name,
          delhivery_registered,
          status
        FROM warehouses
        WHERE id = ?
          AND user_id = ?
        LIMIT 1
      `,
      [
        warehouse_id,
        user_id,
      ]
    );

  if (warehouses.length === 0) {
    throw new Error(
      "Pickup warehouse not found"
    );
  }

  const warehouse =
    warehouses[0];

  if (
    String(
      warehouse.status || ""
    ).toUpperCase() !== "ACTIVE"
  ) {
    throw new Error(
      "Pickup warehouse is inactive"
    );
  }

  if (
    Number(
      warehouse.delhivery_registered
    ) !== 1
  ) {
    throw new Error(
      "Pickup warehouse is not registered with Delhivery"
    );
  }

  if (
    !warehouse.warehouse_name ||
    !String(
      warehouse.warehouse_name
    ).trim()
  ) {
    throw new Error(
      "Warehouse name is required for Delhivery pickup"
    );
  }


  // ----------------------------------------------------
  // DATE
  // ----------------------------------------------------

  const pickupDate =
    getCurrentDate();

  const pickupTime =
    normalizePickupTime(
      pickup_time
    );

  const packageCount =
    Number(package_count);


  if (
    !Number.isInteger(
      packageCount
    ) ||
    packageCount <= 0
  ) {
    throw new Error(
      "Invalid package count for pickup"
    );
  }


  // ----------------------------------------------------
  // CHECK EXISTING PICKUP
  // ----------------------------------------------------

  const existing =
    await getExistingPickupRequest({
      warehouse_id,
      pickup_date:
        pickupDate,
    });


  if (existing) {

    console.log(
      "Existing Delhivery pickup found:",
      existing.pickup_id
    );

    return {
      success: true,

      created: false,

      reused: true,

      pickup_request_id:
        existing.id,

      pickup_id:
        existing.pickup_id,

      pickup_date:
        existing.pickup_date,

      pickup_time:
        existing.pickup_time,

      expected_package_count:
        existing.expected_package_count,

      pickup_location_name:
        existing.pickup_location_name,

      incoming_center_name:
        existing.incoming_center_name,

      client_name:
        existing.client_name,

      status:
        existing.status,
    };
  }


  // ----------------------------------------------------
  // CREATE NEW PICKUP
  // ----------------------------------------------------

  const pickup =
    await createDelhiveryPickup({
      pickup_date:
        pickupDate,

      pickup_time:
        pickupTime,

      pickup_location:
        warehouse.warehouse_name,

      expected_package_count:
        packageCount,
    });


  // ----------------------------------------------------
  // SAVE PICKUP
  // ----------------------------------------------------

  const result =
    await query(
      `
        INSERT INTO pickup_requests
        (
          user_id,
          warehouse_id,
          pickup_id,
          pickup_date,
          pickup_time,
          expected_package_count,
          pickup_location_name,
          incoming_center_name,
          client_name,
          status,
          raw_response
        )
        VALUES
        (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          'CREATED',
          ?
        )
      `,
      [
        user_id,

        warehouse_id,

        pickup.pickup_id,

        pickup.pickup_date,

        pickup.pickup_time,

        pickup.expected_package_count,

        pickup.pickup_location_name,

        pickup.incoming_center_name,

        pickup.client_name,

        JSON.stringify(
          pickup.raw_response
        ),
      ]
    );


  console.log(
    "New pickup request saved:",
    pickup.pickup_id
  );


  return {
    success: true,

    created: true,

    reused: false,

    pickup_request_id:
      result.insertId,

    pickup_id:
      pickup.pickup_id,

    pickup_date:
      pickup.pickup_date,

    pickup_time:
      pickup.pickup_time,

    expected_package_count:
      pickup.expected_package_count,

    pickup_location_name:
      pickup.pickup_location_name,

    incoming_center_name:
      pickup.incoming_center_name,

    client_name:
      pickup.client_name,

    status:
      "CREATED",
  };
};


// ======================================================
// LINK ORDER TO PICKUP REQUEST
// ======================================================

const linkOrderToPickup = async ({
  order_id,
  pickup_request_id,
}) => {

  const result =
    await query(
      `
        UPDATE orders
        SET pickup_request_id = ?
        WHERE id = ?
      `,
      [
        pickup_request_id,
        order_id,
      ]
    );

  if (
    result.affectedRows !== 1
  ) {
    throw new Error(
      `Unable to link pickup request to Order #${order_id}`
    );
  }

  return true;
};


// ======================================================
// LINK MULTIPLE ORDERS TO PICKUP
// ======================================================

const linkOrdersToPickup = async ({
  order_ids,
  pickup_request_id,
}) => {

  if (
    !Array.isArray(order_ids) ||
    order_ids.length === 0
  ) {
    return;
  }

  const placeholders =
    order_ids
      .map(() => "?")
      .join(",");

  await query(
    `
      UPDATE orders
      SET pickup_request_id = ?
      WHERE id IN (${placeholders})
    `,
    [
      pickup_request_id,
      ...order_ids,
    ]
  );
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  createDelhiveryPickup,
  getExistingPickupRequest,
  getOrCreatePickupRequest,
  linkOrderToPickup,
  linkOrdersToPickup,
};