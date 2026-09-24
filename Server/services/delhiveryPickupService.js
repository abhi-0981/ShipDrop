const axios = require("axios");

const DELHIVERY_API_TOKEN =
  process.env.DELHIVERY_API_TOKEN;

const DELHIVERY_API_BASE_URL =
  process.env.DELHIVERY_API_BASE_URL ||
  "https://track.delhivery.com";

/**
 * Create Pickup Request on Delhivery
 */
const createDelhiveryPickupRequest = async ({
  pickup_time,
  pickup_date,
  pickup_location,
  expected_package_count,
}) => {

  // =====================================================
  // VALIDATION
  // =====================================================

  if (!DELHIVERY_API_TOKEN) {
    throw new Error(
      "Delhivery API token is not configured"
    );
  }

  if (!pickup_time) {
    throw new Error(
      "Pickup time is required"
    );
  }

  if (!pickup_date) {
    throw new Error(
      "Pickup date is required"
    );
  }

  if (!pickup_location) {
    throw new Error(
      "Pickup location is required"
    );
  }

  const packageCount =
    Number(expected_package_count);

  if (
    !Number.isInteger(packageCount) ||
    packageCount <= 0
  ) {
    throw new Error(
      "Expected package count must be greater than 0"
    );
  }

  // =====================================================
  // DELHIVERY URL
  // =====================================================

  const url =
    `${DELHIVERY_API_BASE_URL}/fm/request/new/`;

  // =====================================================
  // REQUEST PAYLOAD
  // =====================================================

  const payload = {
    pickup_time,
    pickup_date,
    pickup_location,
    expected_package_count:
      packageCount,
  };

  // =====================================================
  // REQUEST LOG
  // =====================================================

  console.log("");

  console.log(
    "================================================"
  );

  console.log(
    "🚚 DELHIVERY PICKUP REQUEST"
  );

  console.log(
    "================================================"
  );

  console.log(
    "URL:",
    url
  );

  console.log(
    "Pickup Time:",
    pickup_time
  );

  console.log(
    "Pickup Date:",
    pickup_date
  );

  console.log(
    "Pickup Location:",
    pickup_location
  );

  console.log(
    "Expected Package Count:",
    packageCount
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
    "================================================"
  );

  // =====================================================
  // CALL DELHIVERY API
  // =====================================================

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

    // ===================================================
    // DELHIVERY RESPONSE LOG
    // ===================================================

    console.log("");

    console.log(
      "================================================"
    );

    console.log(
      "✅ DELHIVERY PICKUP API RESPONSE"
    );

    console.log(
      "================================================"
    );

    console.log(
      "HTTP STATUS:",
      response.status
    );

    console.log(
      "RESPONSE:",
      JSON.stringify(
        response.data,
        null,
        2
      )
    );

    console.log(
      "================================================"
    );

    // ===================================================
    // RESPONSE DATA
    // ===================================================

    const data =
      response.data;

    if (!data) {
      throw new Error(
        "Empty response received from Delhivery Pickup API"
      );
    }

    // ===================================================
    // PICKUP ID
    // ===================================================

    const pickupId =
      String(
        data.pickup_id ?? ""
      ).trim();

    if (!pickupId) {

      console.error(
        "⚠️ pickup_id NOT FOUND"
      );

      console.error(
        "FULL DELHIVERY RESPONSE:",
        JSON.stringify(
          data,
          null,
          2
        )
      );

      throw new Error(
        "Delhivery Pickup API succeeded but pickup_id was not returned"
      );
    }

    // ===================================================
    // ACTUAL DELHIVERY VALUES
    // ===================================================

    const actualPickupDate =
      data.pickup_date ||
      pickup_date;

    const actualPickupTime =
      data.pickup_time ||
      pickup_time;

    const actualPickupLocation =
      data.pickup_location_name ||
      pickup_location;

    const actualPackageCount =
      Number(
        data.expected_package_count ??
        packageCount
      );

    // ===================================================
    // SUCCESS LOG
    // ===================================================

    console.log("");

    console.log(
      "================================================"
    );

    console.log(
      "✅ DELHIVERY PICKUP CREATED"
    );

    console.log(
      "================================================"
    );

    console.log(
      "Pickup ID:",
      pickupId
    );

    console.log(
      "Pickup Location:",
      actualPickupLocation
    );

    console.log(
      "Pickup Date:",
      actualPickupDate
    );

    console.log(
      "Pickup Time:",
      actualPickupTime
    );

    console.log(
      "Expected Packages:",
      actualPackageCount
    );

    console.log(
      "================================================"
    );

    // ===================================================
    // RETURN DATA
    // ===================================================

    return {
      success: true,

      pickup_id:
        pickupId,

      pickup_date:
        actualPickupDate,

      pickup_time:
        actualPickupTime,

      pickup_location_name:
        actualPickupLocation,

      expected_package_count:
        actualPackageCount,

      client_name:
        data.client_name ||
        null,

      incoming_center_name:
        data.incoming_center_name ||
        null,

      response:
        data,
    };

  } catch (error) {

    // ===================================================
    // ERROR LOG
    // ===================================================

    console.error("");

    console.error(
      "================================================"
    );

    console.error(
      "❌ DELHIVERY PICKUP API ERROR"
    );

    console.error(
      "================================================"
    );

    console.error(
      "URL:",
      url
    );

    console.error(
      "HTTP STATUS:",
      error.response?.status ||
      "NO STATUS"
    );

    console.error(
      "ERROR MESSAGE:",
      error.message
    );

    console.error(
      "DELHIVERY RESPONSE:",
      JSON.stringify(
        error.response?.data ||
        null,
        null,
        2
      )
    );

    console.error(
      "REQUEST PAYLOAD:",
      JSON.stringify(
        payload,
        null,
        2
      )
    );

    console.error(
      "================================================"
    );

    // ===================================================
    // DELHIVERY API ERROR
    // ===================================================

    if (
      error.response?.data
    ) {

      const apiData =
        error.response.data;

      if (
        typeof apiData ===
        "string"
      ) {

        throw new Error(
          apiData
        );
      }

      throw new Error(
        JSON.stringify(
          apiData
        )
      );
    }

    // ===================================================
    // NORMAL ERROR
    // ===================================================

    throw new Error(
      error.message ||
      "Unable to create Delhivery Pickup Request"
    );
  }
};

// =======================================================
// EXPORT
// =======================================================

module.exports = {
  createDelhiveryPickupRequest,
};