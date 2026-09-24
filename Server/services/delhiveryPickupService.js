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
  if (!DELHIVERY_API_TOKEN) {
    throw new Error(
      "Delhivery API token is not configured"
    );
  }

  if (!pickup_time) {
    throw new Error("Pickup time is required");
  }

  if (!pickup_date) {
    throw new Error("Pickup date is required");
  }

  if (!pickup_location) {
    throw new Error("Pickup location is required");
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
    "/fm/request/new/";

  const payload = {
    pickup_time,
    pickup_date,
    pickup_location,
    expected_package_count:
      Number(expected_package_count),
  };

  console.log(
    "========== DELHIVERY PICKUP REQUEST =========="
  );

  console.log("URL:", url);

  console.log(
    "Payload:",
    JSON.stringify(
      payload,
      null,
      2
    )
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

    console.log(
      "========== DELHIVERY PICKUP RESPONSE =========="
    );

    console.log(
      JSON.stringify(
        response.data,
        null,
        2
      )
    );

    console.log(
      "================================================"
    );

    const data =
      response.data;

    if (!data) {
      throw new Error(
        "Empty response received from Delhivery Pickup API"
      );
    }

    const pickupId =
      String(
        data.pickup_id ||
        ""
      ).trim();

    if (!pickupId) {
      throw new Error(
        "Delhivery Pickup API succeeded but pickup_id was not returned"
      );
    }

    return {
      success: true,

      pickup_id:
        pickupId,

      response:
        data,
    };

  } catch (error) {

    console.log(
      "========== DELHIVERY PICKUP API ERROR =========="
    );

    console.log(
      "Status:",
      error.response?.status
    );

    console.log(
      "Response:",
      error.response?.data
    );

    console.log(
      "Message:",
      error.message
    );

    console.log(
      "================================================="
    );

    if (
      error.response?.data
    ) {

      const apiData =
        error.response.data;

      throw new Error(
        apiData.message ||
        apiData.error ||
        apiData.rmk ||
        "Delhivery Pickup Request failed"
      );
    }

    throw new Error(
      error.message ||
      "Unable to create Delhivery Pickup Request"
    );
  }
};

module.exports = {
  createDelhiveryPickupRequest,
};  