const {
  calculateShippingRate,
  calculateShippingOptions,
} = require("../services/rateService");


// ======================================================
// SUPPORTED SERVICES
// ======================================================

const SUPPORTED_SERVICES = new Set([
  "ROAD",
  "AIR",
  "SHADOWFAX_ROAD",
]);


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
// VALIDATE PINCODE
// ======================================================

const isValidPincode = (
  value
) => {

  return /^\d{6}$/.test(
    String(value).trim()
  );

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
// VALIDATE PRODUCT VALUE
// ======================================================

const normalizeProductValue = (
  value
) => {

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {

    return 0;

  }


  const numericValue =
    Number(value);


  if (
    !Number.isFinite(
      numericValue
    ) ||
    numericValue < 0
  ) {

    return null;

  }


  return numericValue;

};


// ======================================================
// VALIDATE COMMON INPUT
// ======================================================

const validateRateInput = (
  req,
  res
) => {

  const {
    user_id,
    pickup_pincode,
    delivery_pincode,
    weight,
    payment_type,
    product_value,
  } = req.body;


  // ----------------------------------------------------
  // USER ID
  // ----------------------------------------------------

  if (!user_id) {

    res.status(400).json({

      success: false,

      message:
        "User ID is required",

    });

    return null;

  }


  // ----------------------------------------------------
  // PICKUP
  // ----------------------------------------------------

  if (
    !pickup_pincode ||
    !isValidPincode(
      pickup_pincode
    )
  ) {

    res.status(400).json({

      success: false,

      message:
        "Valid 6-digit pickup pincode is required",

    });

    return null;

  }


  // ----------------------------------------------------
  // DELIVERY
  // ----------------------------------------------------

  if (
    !delivery_pincode ||
    !isValidPincode(
      delivery_pincode
    )
  ) {

    res.status(400).json({

      success: false,

      message:
        "Valid 6-digit delivery pincode is required",

    });

    return null;

  }


  // ----------------------------------------------------
  // WEIGHT
  // ----------------------------------------------------

  if (
    weight === undefined ||
    weight === null ||
    weight === "" ||
    Number.isNaN(
      Number(weight)
    ) ||
    Number(weight) <= 0
  ) {

    res.status(400).json({

      success: false,

      message:
        "Valid weight is required",

    });

    return null;

  }


  // ----------------------------------------------------
  // PAYMENT TYPE
  // ----------------------------------------------------

  const normalizedPayment =
    normalizePaymentType(
      payment_type
    );


  // ----------------------------------------------------
  // PRODUCT VALUE
  // ----------------------------------------------------

  const normalizedProductValue =
    normalizeProductValue(
      product_value
    );


  if (
    normalizedProductValue === null
  ) {

    res.status(400).json({

      success: false,

      message:
        "Valid product value is required",

    });

    return null;

  }


  // ----------------------------------------------------
  // RETURN
  // ----------------------------------------------------

  return {

    user_id:
      Number(user_id),

    pickup_pincode:
      String(
        pickup_pincode
      ).trim(),

    delivery_pincode:
      String(
        delivery_pincode
      ).trim(),

    weight:
      Number(weight),

    payment_type:
      normalizedPayment,

    product_value:
      normalizedProductValue,

  };

};


// ======================================================
// CALCULATE SINGLE RATE
// ======================================================

const calculateRate = async (
  req,
  res
) => {

  try {

    const input =
      validateRateInput(
        req,
        res
      );


    if (!input) {

      return;

    }


    // --------------------------------------------------
    // SERVICE
    // --------------------------------------------------

    const serviceType =
      normalizeServiceType(
        req.body.service_type
      );


    if (
      !SUPPORTED_SERVICES.has(
        serviceType
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid service type",

      });

    }


    // --------------------------------------------------
    // CALCULATE
    // --------------------------------------------------

    const result =
      await calculateShippingRate(

        input.user_id,

        input.pickup_pincode,

        input.delivery_pincode,

        input.weight,

        serviceType,

        input.payment_type,

        input.product_value

      );


    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return res.status(200).json({

      success: true,


      service_type:
        result.service_type,


      pricing_type:
        result.pricing_type,


      zone:
        result.zone,


      distance_km:
        result.distance_km,


      weight:
        result.weight,


      weight_from:
        result.weight_from,


      weight_to:
        result.weight_to,


      base_rate:
        result.base_rate,


      fsc_percentage:
        result.fsc_percentage,


      fsc_amount:
        result.fsc_amount,


      additional_charge:
        result.additional_charge,


      additional_charge_amount:
        result.additional_charge_amount,


      minimum_cod_charge:
        result.minimum_cod_charge,


      cod_charge_percentage:
        result.cod_charge_percentage,


      cod_percentage_amount:
        result.cod_percentage_amount,


      cod_charge_amount:
        result.cod_charge_amount,


      to_pay_charge:
        result.to_pay_charge,


      payment_type:
        result.payment_type,


      product_value:
        result.product_value,


      cod_threshold:
        result.cod_threshold,


      subtotal_before_gst:
        result.subtotal_before_gst,


      commission_percent:
        result.commission_percent,


      commission_amount:
        result.commission_amount,


      gst_percent:
        result.gst_percent,


      gst_amount:
        result.gst_amount,


      shipping_charge:
        result.shipping_charge,


      final_rate:
        result.final_rate,


      rate_card_id:
        result.rate_card_id,


      service_id:
        result.service_id,


      use_shipping_charge_api:
        result.use_shipping_charge_api,


      pickup:
        result.pickup,


      delivery:
        result.delivery,

    });

  } catch (error) {

    console.log(
      "Rate calculation error:",
      error.message
    );


    return res.status(500).json({

      success: false,

      message:
        error.message ||
        "Unable to calculate shipping rate",

    });

  }

};


// ======================================================
// CALCULATE ALL OPTIONS
// ======================================================

const calculateRateOptions =
  async (
    req,
    res
  ) => {

    try {

      const input =
        validateRateInput(
          req,
          res
        );


      if (!input) {

        return;

      }


      // ------------------------------------------------
      // CALCULATE ROAD + AIR
      // ------------------------------------------------

      const result =
        await calculateShippingOptions(

          input.user_id,

          input.pickup_pincode,

          input.delivery_pincode,

          input.weight,

          input.payment_type,

          input.product_value

        );


      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------

      return res.status(200).json({

        success: true,


        road:
          result.road || null,


        air:
          result.air || null,


        shadowfax:
          result.shadowfax || null,


        zone:
          result.zone,

      });

    } catch (error) {

      console.log(
        "Rate options calculation error:",
        error.message
      );


      return res.status(500).json({

        success: false,

        message:
          error.message ||
          "Unable to calculate shipping options",

      });

    }

  };


// ======================================================
// EXPORT
// ======================================================

module.exports = {

  calculateRate,

  calculateRateOptions,

};