const { calculateZone } =
  require("./zoneService");

const db =
  require("../config/db");


// ======================================================
// CONSTANTS
// ======================================================

const SUPPORTED_SERVICES =
  new Set([
    "ROAD",
    "AIR",
  ]);

const GST_PERCENT = 18;

// COD percentage sirf ₹2000 ke upar ke amount par
const COD_THRESHOLD = 2000;


// ======================================================
// NORMALIZE SERVICE TYPE
// ======================================================

const normalizeServiceType = (
  serviceType
) => {

  return String(
    serviceType || "ROAD"
  )
    .trim()
    .toUpperCase();

};


// ======================================================
// NORMALIZE PAYMENT TYPE
// ======================================================

const normalizePaymentType = (
  paymentType
) => {

  const value =
    String(
      paymentType || "Pre-paid"
    )
      .trim()
      .toLowerCase()
      .replace(
        /[\s_-]+/g,
        ""
      );


  if (
    value === "cod" ||
    value === "cashondelivery"
  ) {

    return "COD";

  }


  if (
    value === "topay" ||
    value === "cashpay"
  ) {

    return "TO_PAY";

  }


  return "PREPAID";

};


// ======================================================
// QUERY HELPER
// ======================================================

const query = (
  sql,
  params = []
) => {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      db.query(
        sql,
        params,
        (
          err,
          result
        ) => {

          if (err) {

            return reject(
              err
            );

          }


          resolve(
            result
          );

        }
      );

    }
  );

};


// ======================================================
// ROUND MONEY
// ======================================================

const roundMoney = (
  value
) => {

  return Math.round(
    (
      Number(value) +
      Number.EPSILON
    ) * 100
  ) / 100;

};


// ======================================================
// GET USER RATE CARD
// ======================================================

const getUserRateCard = async (
  userId
) => {

  if (!userId) {

    throw new Error(
      "User ID is required"
    );

  }


  const result =
    await query(
      `
        SELECT
          id,
          rate_card_id
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [
        userId,
      ]
    );


  if (
    !result ||
    result.length === 0
  ) {

    throw new Error(
      "User not found"
    );

  }


  const user =
    result[0];


  if (
    !user.rate_card_id
  ) {

    throw new Error(
      "No rate card assigned to this user"
    );

  }


  return user;

};


// ======================================================
// GET ADMIN RATE CARD SERVICE
// ======================================================

const getAdminRateCardService =
  async (
    rateCardId,
    serviceType
  ) => {

    const result =
      await query(
        `
          SELECT

            id,
            rate_card_id,
            service_type,

            use_shipping_charge_api,
            commission_percent,

            fsc_percentage,
            minimum_cod_charge,
            cod_charge_percentage,
            to_pay_charge,

            additional_charge

          FROM admin_rate_card_services

          WHERE
            rate_card_id = ?
            AND UPPER(service_type) = ?

          LIMIT 1
        `,
        [
          rateCardId,
          serviceType,
        ]
      );


    if (
      !result ||
      result.length === 0
    ) {

      throw new Error(
        `${serviceType} service is not configured for this rate card`
      );

    }


    return result[0];

  };


// ======================================================
// GET ADMIN RATE
// ======================================================

const getAdminRate = async (
  serviceId,
  weight
) => {

  const result =
    await query(
      `
        SELECT

          id,
          service_id,

          weight_from,
          weight_to,

          zone_a_rate,
          zone_b_rate,
          zone_c_rate,
          zone_d_rate,
          zone_e_rate,
          zone_f_rate

        FROM admin_rate_card_rates

        WHERE
          service_id = ?

          AND ? >= weight_from

          AND ? <= weight_to

        ORDER BY
          weight_from ASC

        LIMIT 1
      `,
      [
        serviceId,
        weight,
        weight,
      ]
    );


  if (
    !result ||
    result.length === 0
  ) {

    throw new Error(
      `No rate found for ${weight} kg`
    );

  }


  return result[0];

};


// ======================================================
// GET LAST ADMIN RATE
// Used when weight is above last normal slab
// ======================================================

const getLastAdminRate = async (
  serviceId
) => {

  const result =
    await query(
      `
        SELECT

          id,
          service_id,

          weight_from,
          weight_to,

          zone_a_rate,
          zone_b_rate,
          zone_c_rate,
          zone_d_rate,
          zone_e_rate,
          zone_f_rate

        FROM admin_rate_card_rates

        WHERE service_id = ?

        ORDER BY
          weight_to DESC,
          weight_from DESC

        LIMIT 1
      `,
      [
        serviceId,
      ]
    );


  if (
    !result ||
    result.length === 0
  ) {

    throw new Error(
      "No rate slabs configured for this service"
    );

  }


  return result[0];

};


// ======================================================
// GET ADDITION RULE
// ======================================================

const getAdminAddition =
  async (
    serviceId,
    weight
  ) => {

    const result =
      await query(
        `
          SELECT

            id,
            service_id,

            from_kg,
            step_kg,

            zone_a_rate,
            zone_b_rate,
            zone_c_rate,
            zone_d_rate,
            zone_e_rate,
            zone_f_rate

          FROM admin_rate_card_additions

          WHERE
            service_id = ?

            AND from_kg <= ?

          ORDER BY
            from_kg DESC,
            id DESC

          LIMIT 1
        `,
        [
          serviceId,
          weight,
        ]
      );


    if (
      !result ||
      result.length === 0
    ) {

      return null;

    }


    return result[0];

  };


// ======================================================
// CALCULATE ADDITION STEPS
// ======================================================
//
// Example:
//
// From = 10 kg
// Step = 0.5 kg
//
// 10.0       = 0 step
// 10.1-10.5  = 1 step
// 10.6-11.0  = 2 steps
// 11.1-11.5  = 3 steps
//
// ======================================================

const calculateAdditionSteps = (
  weight,
  fromKg,
  stepKg
) => {

  const numericWeight =
    Number(weight);

  const numericFrom =
    Number(fromKg);

  const numericStep =
    Number(stepKg);


  if (
    !Number.isFinite(
      numericWeight
    ) ||
    !Number.isFinite(
      numericFrom
    ) ||
    !Number.isFinite(
      numericStep
    ) ||
    numericStep <= 0
  ) {

    return 0;

  }


  if (
    numericWeight <=
    numericFrom
  ) {

    return 0;

  }


  // Small epsilon avoids floating-point
  // problems such as 10.5 becoming 10.499999

  const difference =
    numericWeight -
    numericFrom;


  const steps =
    Math.ceil(
      (
        difference -
        0.000000001
      ) /
      numericStep
    );


  return Math.max(
    0,
    steps
  );

};


// ======================================================
// CALCULATE ADDITION AMOUNT
// ======================================================

const calculateAdditionAmount =
  async (
    serviceId,
    weight,
    zone
  ) => {

    const addition =
      await getAdminAddition(
        serviceId,
        weight
      );


    if (!addition) {

      return {

        addition_rule_id:
          null,

        addition_from_kg:
          null,

        addition_step_kg:
          null,

        addition_steps:
          0,

        addition_per_step:
          0,

        addition_amount:
          0,

      };

    }


    const steps =
      calculateAdditionSteps(
        weight,
        addition.from_kg,
        addition.step_kg
      );


    if (
      steps <= 0
    ) {

      return {

        addition_rule_id:
          addition.id,

        addition_from_kg:
          Number(
            addition.from_kg
          ),

        addition_step_kg:
          Number(
            addition.step_kg
          ),

        addition_steps:
          0,

        addition_per_step:
          0,

        addition_amount:
          0,

      };

    }


    const perStep =
      getZoneRate(
        addition,
        zone
      );


    const additionAmount =
      roundMoney(
        steps *
        perStep
      );


    return {

      addition_rule_id:
        addition.id,

      addition_from_kg:
        Number(
          addition.from_kg
        ),

      addition_step_kg:
        Number(
          addition.step_kg
        ),

      addition_steps:
        steps,

      addition_per_step:
        perStep,

      addition_amount:
        additionAmount,

    };

  };


// ======================================================
// GET ZONE RATE
// ======================================================

const getZoneRate = (
  rateData,
  zone
) => {

  const normalizedZone =
    String(
      zone || ""
    )
      .trim()
      .toLowerCase();


  const field =
    `zone_${normalizedZone}_rate`;


  const value =
    Number(
      rateData[field]
    );


  if (
    !Number.isFinite(
      value
    ) ||
    value < 0
  ) {

    throw new Error(
      `Rate not found for Zone ${zone}`
    );

  }


  return roundMoney(
    value
  );

};


// ======================================================
// OWN RATE CARD PRICING
// ======================================================
//
// Base Rate
// + Weight Addition
// + FSC
// + Fixed Additional Charge
// + COD / To Pay
// = Subtotal
//
// Subtotal
// + GST
// = Final Customer Rate
//
// ======================================================

const calculateOwnPricing = ({
  baseRate,
  rateCardService,
  paymentType = "Pre-paid",
  productValue = 0,

  additionAmount = 0,
  additionSteps = 0,
  additionPerStep = 0,
  additionRuleId = null,
  additionFromKg = null,
  additionStepKg = null,

}) => {

  const rate =
    roundMoney(
      baseRate
    );


  const normalizedPayment =
    normalizePaymentType(
      paymentType
    );


  // ====================================================
  // PRODUCT VALUE
  // ====================================================

  const numericProductValue =
    Number(
      productValue
    );


  const safeProductValue =
    Number.isFinite(
      numericProductValue
    ) &&
    numericProductValue > 0
      ? numericProductValue
      : 0;


  // ====================================================
  // FSC %
  // ====================================================

  const fscPercentage =
    Math.max(
      0,
      Number(
        rateCardService.fsc_percentage
      ) || 0
    );


  // ====================================================
  // FIXED ADDITIONAL CHARGE ₹
  // ====================================================

  const additionalCharge =
    Math.max(
      0,
      Number(
        rateCardService.additional_charge
      ) || 0
    );


  // ====================================================
  // MINIMUM COD ₹
  // ====================================================

  const minimumCodCharge =
    Math.max(
      0,
      Number(
        rateCardService.minimum_cod_charge
      ) || 0
    );


  // ====================================================
  // COD %
  // ====================================================

  const codChargePercentage =
    Math.max(
      0,
      Number(
        rateCardService.cod_charge_percentage
      ) || 0
    );


  // ====================================================
  // TO PAY ₹
  // ====================================================

  const toPayCharge =
    Math.max(
      0,
      Number(
        rateCardService.to_pay_charge
      ) || 0
    );


  // ====================================================
  // WEIGHT ADDITION
  // ====================================================

  const safeAdditionAmount =
    Math.max(
      0,
      Number(
        additionAmount
      ) || 0
    );


  // ====================================================
  // FSC AMOUNT
  // FSC is calculated on base rate + addition
  // ====================================================

  const chargeableRate =
    roundMoney(
      rate +
      safeAdditionAmount
    );


  const fscAmount =
    roundMoney(
      chargeableRate *
      fscPercentage /
      100
    );


  // ====================================================
  // FIXED ADDITIONAL CHARGE AMOUNT
  // ====================================================

  const additionalChargeAmount =
    roundMoney(
      additionalCharge
    );


  // ====================================================
  // COD CHARGE
  // ====================================================

  let codChargeAmount =
    0;

  let codPercentageAmount =
    0;


  if (
    normalizedPayment ===
    "COD"
  ) {

    // -----------------------------------------------
    // Amount above ₹2000
    // -----------------------------------------------

    const amountAboveThreshold =
      Math.max(
        0,
        safeProductValue -
        COD_THRESHOLD
      );


    // -----------------------------------------------
    // COD percentage
    // -----------------------------------------------

    codPercentageAmount =
      roundMoney(
        amountAboveThreshold *
        codChargePercentage /
        100
      );


    // -----------------------------------------------
    // Minimum + percentage
    // -----------------------------------------------

    codChargeAmount =
      roundMoney(
        minimumCodCharge +
        codPercentageAmount
      );

  }


  // ====================================================
  // TO PAY CHARGE
  // ====================================================

  let finalToPayCharge =
    0;


  if (
    normalizedPayment ===
    "TO_PAY"
  ) {

    finalToPayCharge =
      roundMoney(
        toPayCharge
      );

  }


  // ====================================================
  // SUBTOTAL BEFORE GST
  // ====================================================

  const subtotalBeforeGst =
    roundMoney(

      chargeableRate +

      fscAmount +

      additionalChargeAmount +

      codChargeAmount +

      finalToPayCharge

    );


  // ====================================================
  // GST
  // ====================================================

  const gstAmount =
    roundMoney(
      subtotalBeforeGst *
      GST_PERCENT /
      100
    );


  // ====================================================
  // FINAL RATE
  // ====================================================

  const finalRate =
    roundMoney(
      subtotalBeforeGst +
      gstAmount
    );


  // ====================================================
  // RETURN
  // ====================================================

  return {

    pricing_type:
      "OWN_RATE_CARD",


    // Base normal slab rate

    base_rate:
      rate,


    // Weight addition

    addition_rule_id:
      additionRuleId,

    addition_from_kg:
      additionFromKg,

    addition_step_kg:
      additionStepKg,

    addition_steps:
      additionSteps,

    addition_per_step:
      additionPerStep,

    addition_amount:
      safeAdditionAmount,


    // FSC

    fsc_percentage:
      fscPercentage,

    fsc_amount:
      fscAmount,


    // Fixed Additional ₹

    fixed_additional_charge:
      additionalCharge,

    additional_charge:
      additionalCharge,

    additional_charge_amount:
      additionalChargeAmount,


    // COD

    minimum_cod_charge:
      minimumCodCharge,

    cod_charge_percentage:
      codChargePercentage,

    cod_percentage_amount:
      codPercentageAmount,

    cod_charge_amount:
      codChargeAmount,


    // To Pay

    to_pay_charge:
      finalToPayCharge,


    // Order

    payment_type:
      normalizedPayment,

    product_value:
      safeProductValue,

    cod_threshold:
      COD_THRESHOLD,


    // Subtotal

    subtotal_before_gst:
      subtotalBeforeGst,


    // Commission

    commission_percent:
      0,

    commission_amount:
      0,


    // GST

    gst_percent:
      GST_PERCENT,

    gst_amount:
      gstAmount,


    // Final

    final_rate:
      finalRate,

    shipping_charge:
      finalRate,

  };

};


// ======================================================
// DELHIVERY API RATE
// ======================================================

const calculateDelhiveryRate =
  async ({
    pickupPincode,
    deliveryPincode,
    weight,
    serviceType,
    paymentType = "Pre-paid",
  }) => {

    const token =
      process.env.DELHIVERY_API_TOKEN ||
      process.env.DELHIVERY_AUTH_TOKEN ||
      process.env.DELHIVERY_TOKEN;


    if (!token) {

      throw new Error(
        "Delhivery API token is not configured"
      );

    }


    // ====================================================
    // MODE
    // ====================================================

    let mode =
      "S";


    if (
      serviceType ===
      "AIR"
    ) {

      mode =
        "E";

    }


    // ====================================================
    // KG -> GRAMS
    // ====================================================

    const weightInGrams =
      Math.ceil(
        Number(weight) *
        1000
      );


    if (
      !Number.isFinite(
        weightInGrams
      ) ||
      weightInGrams <= 0
    ) {

      throw new Error(
        "Invalid shipment weight"
      );

    }


    // ====================================================
    // API BASE URL
    // ====================================================

    const baseUrl =
      process.env.DELHIVERY_API_BASE_URL ||
      "https://track.delhivery.com";


    const url =
      new URL(
        "/api/kinko/v1/invoice/charges/.json",
        baseUrl
      );


    // ====================================================
    // PARAMETERS
    // ====================================================

    url.searchParams.set(
      "md",
      mode
    );


    url.searchParams.set(
      "cgm",
      String(
        weightInGrams
      )
    );


    url.searchParams.set(
      "o_pin",
      String(
        pickupPincode
      )
    );


    url.searchParams.set(
      "d_pin",
      String(
        deliveryPincode
      )
    );


    url.searchParams.set(
      "ss",
      "Delivered"
    );


    url.searchParams.set(
      "pt",
      paymentType
    );


    // ====================================================
    // REQUEST
    // ====================================================

    let response;


    try {

      response =
        await fetch(
          url.toString(),
          {
            method:
              "GET",

            headers: {

              Authorization:
                `Token ${token}`,

              Accept:
                "application/json",

            },

          }
        );

    } catch (error) {

      throw new Error(
        `Delhivery API connection failed: ${error.message}`
      );

    }


    // ====================================================
    // JSON
    // ====================================================

    let data;


    try {

      data =
        await response.json();

    } catch (error) {

      throw new Error(
        `Invalid response from Delhivery API (${response.status})`
      );

    }


    // ====================================================
    // HTTP ERROR
    // ====================================================

    if (
      !response.ok
    ) {

      const apiMessage =
        data?.error ||
        data?.message ||
        data?.detail ||
        `HTTP ${response.status}`;


      throw new Error(
        `Delhivery API error: ${apiMessage}`
      );

    }


    // ====================================================
    // DEBUG
    // ====================================================

    console.log(
      "Delhivery API response:",
      JSON.stringify(data)
    );


    // ====================================================
    // TOTAL AMOUNT
    // ====================================================

    let apiAmount =
      Number(
        data?.total_amount
      );


    // ====================================================
    // ARRAY FALLBACK
    // ====================================================

    if (
      !Number.isFinite(
        apiAmount
      )
    ) {

      if (
        Array.isArray(data) &&
        data.length > 0
      ) {

        apiAmount =
          Number(
            data[0]?.total_amount
          );

      }

    }


    // ====================================================
    // NESTED FALLBACK
    // ====================================================

    if (
      !Number.isFinite(
        apiAmount
      )
    ) {

      apiAmount =
        Number(
          data?.data?.total_amount
        );

    }


    // ====================================================
    // VALIDATE
    // ====================================================

    if (
      !Number.isFinite(
        apiAmount
      ) ||
      apiAmount < 0
    ) {

      throw new Error(
        "Delhivery API did not return a valid total shipping charge"
      );

    }


    return {

      api_base_rate:
        roundMoney(
          apiAmount
        ),

      mode,

      weight_grams:
        weightInGrams,

      response:
        data,

    };

  };


// ======================================================
// API PRICING
// ======================================================
//
// API rate already includes GST.
//
// API mode:
// API Rate + Commission
//
// ======================================================

const calculateApiPricing = ({
  apiRate,
  commissionPercent,
}) => {

  const baseRate =
    roundMoney(
      apiRate
    );


  const commissionRate =
    Number(
      commissionPercent || 0
    );


  const commissionAmount =
    roundMoney(
      baseRate *
      commissionRate /
      100
    );


  const finalRate =
    roundMoney(
      baseRate +
      commissionAmount
    );


  return {

    pricing_type:
      "SHIPPING_API",


    base_rate:
      baseRate,


    commission_percent:
      commissionRate,


    commission_amount:
      commissionAmount,


    gst_percent:
      0,


    gst_amount:
      0,


    final_rate:
      finalRate,


    shipping_charge:
      finalRate,

  };

};


// ======================================================
// BUILD SHIPPING RESULT
// ======================================================

const buildShippingResult = ({
  serviceType,
  zoneResult,
  finalZone,
  numericWeight,
  rateCardService,
  rateData,
  pricing,
}) => {

  return {

    success:
      true,


    service_type:
      serviceType,


    pricing_type:
      pricing.pricing_type,


    zone:
      finalZone,


    distance_km:
      Number(
        zoneResult.distance_km
      ) || 0,


    weight:
      numericWeight,


    weight_from:
      Number(
        rateData.weight_from
      ),


    weight_to:
      Number(
        rateData.weight_to
      ),


    base_rate:
      pricing.base_rate,


    // Addition

    addition_rule_id:
      pricing.addition_rule_id ||
      null,

    addition_from_kg:
      pricing.addition_from_kg ??
      null,

    addition_step_kg:
      pricing.addition_step_kg ??
      null,

    addition_steps:
      pricing.addition_steps ||
      0,

    addition_per_step:
      pricing.addition_per_step ||
      0,

    addition_amount:
      pricing.addition_amount ||
      0,


    fsc_percentage:
      pricing.fsc_percentage ||
      0,


    fsc_amount:
      pricing.fsc_amount ||
      0,


    additional_charge:
      pricing.additional_charge ||
      0,


    additional_charge_amount:
      pricing.additional_charge_amount ||
      0,


    minimum_cod_charge:
      pricing.minimum_cod_charge ||
      0,


    cod_charge_percentage:
      pricing.cod_charge_percentage ||
      0,


    cod_percentage_amount:
      pricing.cod_percentage_amount ||
      0,


    cod_charge_amount:
      pricing.cod_charge_amount ||
      0,


    to_pay_charge:
      pricing.to_pay_charge ||
      0,


    payment_type:
      pricing.payment_type ||
      null,


    product_value:
      pricing.product_value ||
      0,


    cod_threshold:
      pricing.cod_threshold ||
      0,


    subtotal_before_gst:
      pricing.subtotal_before_gst ||
      0,


    commission_percent:
      pricing.commission_percent ||
      0,


    commission_amount:
      pricing.commission_amount ||
      0,


    gst_percent:
      pricing.gst_percent ||
      0,


    gst_amount:
      pricing.gst_amount ||
      0,


    shipping_charge:
      pricing.shipping_charge,


    final_rate:
      pricing.final_rate,


    rate_card_id:
      rateCardService.rate_card_id,


    service_id:
      rateCardService.id,


    use_shipping_charge_api:
      Number(
        rateCardService.use_shipping_charge_api
      ) === 1,


    pickup:
      zoneResult.pickup,


    delivery:
      zoneResult.delivery,

  };

};


// ======================================================
// CALCULATE SINGLE SHIPPING RATE
// ======================================================

const calculateShippingRate =
  async (
    userId,
    pickup_pincode,
    delivery_pincode,
    weight,
    serviceType = "ROAD",
    paymentType = "Pre-paid",
    productValue = 0
  ) => {

    // ====================================================
    // USER
    // ====================================================

    if (!userId) {

      throw new Error(
        "User ID is required"
      );

    }


    // ====================================================
    // PINCODES
    // ====================================================

    if (
      !/^\d{6}$/.test(
        String(
          pickup_pincode || ""
        ).trim()
      )
    ) {

      throw new Error(
        "Valid 6-digit pickup pincode is required"
      );

    }


    if (
      !/^\d{6}$/.test(
        String(
          delivery_pincode || ""
        ).trim()
      )
    ) {

      throw new Error(
        "Valid 6-digit delivery pincode is required"
      );

    }


    // ====================================================
    // WEIGHT
    // ====================================================

    const numericWeight =
      Number(
        weight
      );


    if (
      !Number.isFinite(
        numericWeight
      ) ||
      numericWeight <= 0
    ) {

      throw new Error(
        "Valid weight is required"
      );

    }


    // ====================================================
    // SERVICE
    // ====================================================

    const normalizedService =
      normalizeServiceType(
        serviceType
      );


    if (
      !SUPPORTED_SERVICES.has(
        normalizedService
      )
    ) {

      throw new Error(
        "Invalid shipping service"
      );

    }


    // ====================================================
    // USER RATE CARD
    // ====================================================

    const user =
      await getUserRateCard(
        userId
      );


    // ====================================================
    // ADMIN SERVICE
    // ====================================================

    const rateCardService =
      await getAdminRateCardService(
        user.rate_card_id,
        normalizedService
      );


    // ====================================================
    // ZONE
    // ====================================================

    const zoneResult =
      await calculateZone(
        pickup_pincode,
        delivery_pincode
      );


    let finalZone =
      zoneResult.zone;


    // ====================================================
    // SAME CITY = ZONE A
    // ====================================================

    const pickupCity =
      String(
        zoneResult.pickup?.city ||
        ""
      )
        .trim()
        .toLowerCase();


    const deliveryCity =
      String(
        zoneResult.delivery?.city ||
        ""
      )
        .trim()
        .toLowerCase();


    if (
      pickupCity &&
      deliveryCity &&
      pickupCity ===
        deliveryCity
    ) {

      finalZone =
        "A";

    }


    // ====================================================
    // API OR OWN
    // ====================================================

    const useApi =
      Number(
        rateCardService
          .use_shipping_charge_api
      ) === 1;


    let pricing;

    let rateData =
      null;


    if (
      useApi
    ) {

      // ==================================================
      // API MODE
      // ==================================================

      const apiResult =
        await calculateDelhiveryRate({

          pickupPincode:
            pickup_pincode,

          deliveryPincode:
            delivery_pincode,

          weight:
            numericWeight,

          serviceType:
            normalizedService,

          paymentType:
            paymentType,

        });


      pricing =
        calculateApiPricing({

          apiRate:
            apiResult.api_base_rate,

          commissionPercent:
            Number(
              rateCardService
                .commission_percent
            ) || 0,

        });


      rateData = {

        weight_from:
          numericWeight,

        weight_to:
          numericWeight,

      };


    } else {

      // ==================================================
      // OWN RATE CARD
      // ==================================================

      let normalRate;


      // -----------------------------------------------
      // FIRST TRY NORMAL WEIGHT SLAB
      // -----------------------------------------------

      try {

        normalRate =
          await getAdminRate(
            rateCardService.id,
            numericWeight
          );

      } catch (error) {

        // ---------------------------------------------
        // WEIGHT IS ABOVE NORMAL SLABS
        // Use last slab as base rate
        // ---------------------------------------------

        normalRate =
          await getLastAdminRate(
            rateCardService.id
          );

      }


      rateData =
        normalRate;


      // -----------------------------------------------
      // BASE ZONE RATE
      // -----------------------------------------------

      const baseRate =
        getZoneRate(
          normalRate,
          finalZone
        );


      // -----------------------------------------------
      // ADDITION CALCULATION
      // -----------------------------------------------

      const addition =
        await calculateAdditionAmount(
          rateCardService.id,
          numericWeight,
          finalZone
        );


      // -----------------------------------------------
      // OWN PRICING
      // -----------------------------------------------

      pricing =
        calculateOwnPricing({

          baseRate,

          rateCardService,

          paymentType,

          productValue,

          additionAmount:
            addition.addition_amount,

          additionSteps:
            addition.addition_steps,

          additionPerStep:
            addition.addition_per_step,

          additionRuleId:
            addition.addition_rule_id,

          additionFromKg:
            addition.addition_from_kg,

          additionStepKg:
            addition.addition_step_kg,

        });

    }


    // ====================================================
    // RESULT
    // ====================================================

    return buildShippingResult({

      serviceType:
        normalizedService,

      zoneResult,

      finalZone,

      numericWeight,

      rateCardService,

      rateData,

      pricing,

    });

  };


// ======================================================
// CALCULATE ALL SHIPPING OPTIONS
// ======================================================

const calculateShippingOptions =
  async (
    userId,
    pickup_pincode,
    delivery_pincode,
    weight,
    paymentType = "Pre-paid",
    productValue = 0
  ) => {

    if (!userId) {

      throw new Error(
        "User ID is required"
      );

    }


    const numericWeight =
      Number(
        weight
      );


    if (
      !Number.isFinite(
        numericWeight
      ) ||
      numericWeight <= 0
    ) {

      throw new Error(
        "Valid weight is required"
      );

    }


    // ====================================================
    // ROAD
    // ====================================================

    let road =
      null;


    try {

      road =
        await calculateShippingRate(

          userId,

          pickup_pincode,

          delivery_pincode,

          numericWeight,

          "ROAD",

          paymentType,

          productValue

        );

    } catch (error) {

      console.log(
        "ROAD rate unavailable:",
        error.message
      );

    }


    // ====================================================
    // AIR
    // ====================================================

    let air =
      null;


    try {

      air =
        await calculateShippingRate(

          userId,

          pickup_pincode,

          delivery_pincode,

          numericWeight,

          "AIR",

          paymentType,

          productValue

        );

    } catch (error) {

      console.log(
        "AIR rate unavailable:",
        error.message
      );

    }


    // ====================================================
    // RESULT
    // ====================================================

    return {

      road,

      air,

    };

  };


// ======================================================
// EXPORT
// ======================================================

module.exports = {

  calculateShippingRate,

  calculateShippingOptions,

};