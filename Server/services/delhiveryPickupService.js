const axios = require("axios");

const DELHIVERY_API_TOKEN =
  process.env.DELHIVERY_API_TOKEN;

const DELHIVERY_API_BASE_URL =
  process.env.DELHIVERY_API_BASE_URL ||
  "https://track.delhivery.com";

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


  // =====================================================
  // DELHIVERY PICKUP API URL
  // =====================================================

  const url =
    `${DELHIVERY_API_BASE_URL}` +
    "/fm/request/new/";


  // =====================================================
  // REQUEST PAYLOAD
  // =====================================================

  const payload = {

    pickup_time,

    pickup_date,

    pickup_location,

    expected_package_count:
      Number(expected_package_count),

  };


  // =====================================================
  // PICKUP REQUEST LOG
  // =====================================================

  console.error(
    "================================================"
  );

  console.error(
    "🚚 DELHIVERY PICKUP REQUEST"
  );

  console.error(
    "URL:",
    url
  );

  console.error(
    "Pickup Time:",
    pickup_time
  );

  console.error(
    "Pickup Date:",
    pickup_date
  );

  console.error(
    "Pickup Location:",
    pickup_location
  );

  console.error(
    "Expected Package Count:",
    Number(
      expected_package_count
    )
  );

  console.error(
    "Payload:",
    JSON.stringify(
      payload,
      null,
      2
    )
  );

  console.error(
    "================================================"
  );


  // =====================================================
  // CALL DELHIVERY
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

          timeout:
            30000,
        }
      );


    // ===================================================
    // SUCCESS RESPONSE
    // ===================================================

    console.error(
      "================================================"
    );

    console.error(
      "✅ DELHIVERY PICKUP API RESPONSE"
    );

    console.error(
      "HTTP STATUS:",
      response.status
    );

    console.error(
      "RESPONSE:",
      JSON.stringify(
        response.data,
        null,
        2
      )
    );

    console.error(
      "================================================"
    );


    const data =
      response.data;


    // ===================================================
    // EMPTY RESPONSE CHECK
    // ===================================================

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
        data.pickup_id ||
        ""
      ).trim();


    if (!pickupId) {

      console.error(
        "⚠️ DELHIVERY RESPONSE DID NOT CONTAIN pickup_id"
      );

      console.error(
        "FULL RESPONSE:",
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
    // SUCCESS
    // ===================================================

    console.error(
      "================================================"
    );

    console.error(
      "✅ DELHIVERY PICKUP ID GENERATED"
    );

    console.error(
      "Pickup ID:",
      pickupId
    );

    console.error(
      "================================================"
    );


    return {

      success:
        true,

      pickup_id:
        pickupId,

      response:
        data,

    };

  } catch (error) {


    // ===================================================
    // DETAILED ERROR
    // ===================================================

    console.error(
      "================================================"
    );

    console.error(
      "❌ DELHIVERY PICKUP API ERROR"
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


    // Axios error details

    if (
      error.response
    ) {

      console.error(
        "RESPONSE HEADERS:",
        JSON.stringify(
          error.response.headers ||
          {},
          null,
          2
        )
      );

    }


    console.error(
      "================================================"
    );


    // =================================================
    // RETURN ACTUAL DELHIVERY ERROR
    // =================================================

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


    // =================================================
    // NORMAL ERROR
    // =================================================

    throw new Error(
      error.message ||
      "Unable to create Delhivery Pickup Request"
    );

  }

};


module.exports = {

  createDelhiveryPickupRequest,

};