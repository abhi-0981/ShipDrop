const { calculateZone } = require("./zoneService");
const db = require("../config/db");

// ======================================================
// CONSTANTS
// ======================================================

const SUPPORTED_SERVICES = new Set(["ROAD", "AIR"]);
const GST_PERCENT = 18;

// COD percentage sirf ₹2000 ke upar ke amount par
const COD_THRESHOLD = 2000;

// ======================================================
// NORMALIZE SERVICE TYPE
// ======================================================

const normalizeServiceType = (serviceType) => {
  return String(serviceType || "ROAD")
    .trim()
    .toUpperCase();
};

// ======================================================
// NORMALIZE PAYMENT TYPE
// ======================================================

const normalizePaymentType = (paymentType) => {
  const value = String(paymentType || "PREPAID")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  if (value === "cod" || value === "cashondelivery") {
    return "COD";
  }

  if (value === "topay" || value === "cashpay") {
    return "TO_PAY";
  }

  return "PREPAID";
};

// ======================================================
// QUERY HELPER (Using mysql2/promise)
// ======================================================

const query = async (sql, params = []) => {
  const [result] = await db.query(sql, params);
  return result;
};

// ======================================================
// ROUND MONEY
// ======================================================

const roundMoney = (value) => {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
};

// ======================================================
// GET USER RATE CARD
// ======================================================

const getUserRateCard = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const result = await query(
    `
        SELECT
          id,
          rate_card_id
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
    [userId]
  );

  if (!result || result.length === 0) {
    throw new Error("User not found");
  }

  const user = result[0];

  if (!user.rate_card_id) {
    throw new Error("No rate card assigned to this user");
  }

  return user;
};

// ======================================================
// GET ADMIN RATE CARD SERVICE
// ======================================================

const getAdminRateCardService = async (rateCardId, serviceType) => {
  const result = await query(
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
    [rateCardId, serviceType]
  );

  if (!result || result.length === 0) {
    throw new Error(
      `${serviceType} service is not configured for this rate card`
    );
  }

  return result[0];
};

// ======================================================
// GET ADMIN RATE
// ======================================================

const getAdminRate = async (serviceId, weight) => {
  const result = await query(
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
    [serviceId, weight, weight]
  );

  if (!result || result.length === 0) {
    throw new Error(`No rate found for ${weight} kg`);
  }

  return result[0];
};

// ======================================================
// GET LAST ADMIN RATE
// ======================================================

const getLastAdminRate = async (serviceId) => {
  const result = await query(
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
    [serviceId]
  );

  if (!result || result.length === 0) {
    throw new Error("No rate slabs configured for this service");
  }

  return result[0];
};

// ======================================================
// GET ADDITION RULE
// ======================================================

const getAdminAddition = async (serviceId, weight) => {
  const result = await query(
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
    [serviceId, weight]
  );

  if (!result || result.length === 0) {
    return null;
  }

  return result[0];
};

// ======================================================
// CALCULATE ADDITION STEPS
// ======================================================

const calculateAdditionSteps = (weight, fromKg, stepKg) => {
  const numericWeight = Number(weight);
  const numericFrom = Number(fromKg);
  const numericStep = Number(stepKg);

  if (
    !Number.isFinite(numericWeight) ||
    !Number.isFinite(numericFrom) ||
    !Number.isFinite(numericStep) ||
    numericStep <= 0
  ) {
    return 0;
  }

  if (numericWeight <= numericFrom) {
    return 0;
  }

  const difference = numericWeight - numericFrom;
  const steps = Math.ceil((difference - 0.000000001) / numericStep);
  return Math.max(0, steps);
};

// ======================================================
// CALCULATE ADDITION AMOUNT
// ======================================================

const calculateAdditionAmount = async (serviceId, weight, zone) => {
  const addition = await getAdminAddition(serviceId, weight);

  if (!addition) {
    return {
      addition_rule_id: null,
      addition_from_kg: null,
      addition_step_kg: null,
      addition_steps: 0,
      addition_per_step: 0,
      addition_amount: 0,
    };
  }

  const steps = calculateAdditionSteps(
    weight,
    addition.from_kg,
    addition.step_kg
  );

  if (steps <= 0) {
    return {
      addition_rule_id: addition.id,
      addition_from_kg: Number(addition.from_kg),
      addition_step_kg: Number(addition.step_kg),
      addition_steps: 0,
      addition_per_step: 0,
      addition_amount: 0,
    };
  }

  const perStep = getZoneRate(addition, zone);
  const additionAmount = roundMoney(steps * perStep);

  return {
    addition_rule_id: addition.id,
    addition_from_kg: Number(addition.from_kg),
    addition_step_kg: Number(addition.step_kg),
    addition_steps: steps,
    addition_per_step: perStep,
    addition_amount: additionAmount,
  };
};

// ======================================================
// GET ZONE RATE
// ======================================================

const getZoneRate = (rateData, zone) => {
  const normalizedZone = String(zone || "")
    .trim()
    .toLowerCase();

  const field = `zone_${normalizedZone}_rate`;
  const value = Number(rateData[field]);

  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Rate not found for Zone ${zone}`);
  }

  return roundMoney(value);
};

// ======================================================
// OWN RATE CARD PRICING
// ======================================================

const calculateOwnPricing = ({
  baseRate,
  rateCardService,
  paymentType = "PREPAID",
  productValue = 0,
  additionAmount = 0,
  additionSteps = 0,
  additionPerStep = 0,
  additionRuleId = null,
  additionFromKg = null,
  additionStepKg = null,
}) => {
  const rate = roundMoney(baseRate);
  const normalizedPayment = normalizePaymentType(paymentType);

  const numericProductValue = Number(productValue);
  const safeProductValue =
    Number.isFinite(numericProductValue) && numericProductValue > 0
      ? numericProductValue
      : 0;

  const fscPercentage = Math.max(
    0,
    Number(rateCardService.fsc_percentage) || 0
  );

  const additionalCharge = Math.max(
    0,
    Number(rateCardService.additional_charge) || 0
  );

  const minimumCodCharge = Math.max(
    0,
    Number(rateCardService.minimum_cod_charge) || 0
  );

  const codChargePercentage = Math.max(
    0,
    Number(rateCardService.cod_charge_percentage) || 0
  );

  const toPayCharge = Math.max(0, Number(rateCardService.to_pay_charge) || 0);
  const safeAdditionAmount = Math.max(0, Number(additionAmount) || 0);

  const chargeableRate = roundMoney(rate + safeAdditionAmount);
  const fscAmount = roundMoney((chargeableRate * fscPercentage) / 100);
  const additionalChargeAmount = roundMoney(additionalCharge);

  let codChargeAmount = 0;
  let codPercentageAmount = 0;

  if (normalizedPayment === "COD") {
    const amountAboveThreshold = Math.max(0, safeProductValue - COD_THRESHOLD);
    codPercentageAmount = roundMoney(
      (amountAboveThreshold * codChargePercentage) / 100
    );
    codChargeAmount = roundMoney(minimumCodCharge + codPercentageAmount);
  }

  let finalToPayCharge = 0;
  if (normalizedPayment === "TO_PAY") {
    finalToPayCharge = roundMoney(toPayCharge);
  }

  const subtotalBeforeGst = roundMoney(
    chargeableRate +
    fscAmount +
    additionalChargeAmount +
    codChargeAmount +
    finalToPayCharge
  );

  const gstAmount = roundMoney((subtotalBeforeGst * GST_PERCENT) / 100);
  const finalRate = roundMoney(subtotalBeforeGst + gstAmount);

  return {
    pricing_type: "OWN_RATE_CARD",
    base_rate: rate,
    addition_rule_id: additionRuleId,
    addition_from_kg: additionFromKg,
    addition_step_kg: additionStepKg,
    addition_steps: additionSteps,
    addition_per_step: additionPerStep,
    addition_amount: safeAdditionAmount,
    fsc_percentage: fscPercentage,
    fsc_amount: fscAmount,
    fixed_additional_charge: additionalCharge,
    additional_charge: additionalCharge,
    additional_charge_amount: additionalChargeAmount,
    minimum_cod_charge: minimumCodCharge,
    cod_charge_percentage: codChargePercentage,
    cod_percentage_amount: codPercentageAmount,
    cod_charge_amount: codChargeAmount,
    to_pay_charge: finalToPayCharge,
    payment_type: normalizedPayment,
    product_value: safeProductValue,
    cod_threshold: COD_THRESHOLD,
    subtotal_before_gst: subtotalBeforeGst,
    commission_percent: 0,
    commission_amount: 0,
    gst_percent: GST_PERCENT,
    gst_amount: gstAmount,
    final_rate: finalRate,
    shipping_charge: finalRate,
  };
};

// ======================================================
// DELHIVERY API RATE
// ======================================================

const calculateDelhiveryRate = async ({
  pickupPincode,
  deliveryPincode,
  weight,
  serviceType,
  paymentType = "PREPAID",
}) => {
  const rawToken =
    process.env.DELHIVERY_API_TOKEN ||
    process.env.DELHIVERY_AUTH_TOKEN ||
    process.env.DELHIVERY_TOKEN;

  const token = rawToken ? String(rawToken).trim().replace(/^["']|["']$/g, "") : null;

  if (!token) {
    throw new Error("Delhivery API token is not configured");
  }

  let mode = "S";
  if (serviceType === "AIR") {
    mode = "E";
  }

  const weightInGrams = Math.ceil(Number(weight) * 1000);
  if (!Number.isFinite(weightInGrams) || weightInGrams <= 0) {
    throw new Error("Invalid shipment weight");
  }

  const rawBaseUrl =
    process.env.DELHIVERY_API_BASE_URL || "https://track.delhivery.com";
  const baseUrl = String(rawBaseUrl).trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "");
  const url = new URL("/api/kinko/v1/invoice/charges/.json", baseUrl);

  url.searchParams.set("md", mode);
  url.searchParams.set("cgm", String(weightInGrams));
  url.searchParams.set("o_pin", String(pickupPincode));
  url.searchParams.set("d_pin", String(deliveryPincode));
  url.searchParams.set("ss", "Delivered");
  url.searchParams.set("pt", paymentType);

  let response;
  try {
    response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Token ${token}`,
        Accept: "application/json",
      },
    });
  } catch (error) {
    throw new Error(`Delhivery API connection failed: ${error.message}`);
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error(`Invalid response from Delhivery API (${response.status})`);
  }

  if (!response.ok) {
    const apiMessage =
      data?.error || data?.message || data?.detail || `HTTP ${response.status}`;
    throw new Error(`Delhivery API error: ${apiMessage}`);
  }

  let apiAmount = Number(data?.total_amount);
  if (!Number.isFinite(apiAmount)) {
    if (Array.isArray(data) && data.length > 0) {
      apiAmount = Number(data[0]?.total_amount);
    }
  }

  if (!Number.isFinite(apiAmount)) {
    apiAmount = Number(data?.data?.total_amount);
  }

  if (!Number.isFinite(apiAmount) || apiAmount <= 0) {
    const errorMsg =
      data?.error ||
      data?.message ||
      (Array.isArray(data) && data[0]?.remarks ? data[0]?.remarks.join(", ") : null) ||
      (Array.isArray(data) && data[0]?.status && data[0]?.status !== "SUCCESS" && data[0]?.status !== "Delivered" ? `Delhivery status: ${data[0]?.status}` : null) ||
      "Delhivery API did not return a valid total shipping charge";
    throw new Error(errorMsg);
  }

  return {
    api_base_rate: roundMoney(apiAmount),
    mode,
    weight_grams: weightInGrams,
    response: data,
  };
};

// ======================================================
// API PRICING
// ======================================================

const calculateApiPricing = ({ apiRate, commissionPercent }) => {
  const baseRate = roundMoney(apiRate);
  const commissionRate = Number(commissionPercent || 0);
  const commissionAmount = roundMoney((baseRate * commissionRate) / 100);
  const finalRate = roundMoney(baseRate + commissionAmount);

  return {
    pricing_type: "SHIPPING_API",
    base_rate: baseRate,
    commission_percent: commissionRate,
    commission_amount: commissionAmount,
    gst_percent: 0,
    gst_amount: 0,
    final_rate: finalRate,
    shipping_charge: finalRate,
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
    success: true,
    service_type: serviceType,
    pricing_type: pricing.pricing_type,
    zone: finalZone,
    distance_km: Number(zoneResult.distance_km) || 0,
    weight: numericWeight,
    weight_from: Number(rateData.weight_from),
    weight_to: Number(rateData.weight_to),
    base_rate: pricing.base_rate,
    addition_rule_id: pricing.addition_rule_id || null,
    addition_from_kg: pricing.addition_from_kg ?? null,
    addition_step_kg: pricing.addition_step_kg ?? null,
    addition_steps: pricing.addition_steps || 0,
    addition_per_step: pricing.addition_per_step || 0,
    addition_amount: pricing.addition_amount || 0,
    fsc_percentage: pricing.fsc_percentage || 0,
    fsc_amount: pricing.fsc_amount || 0,
    additional_charge: pricing.additional_charge || 0,
    additional_charge_amount: pricing.additional_charge_amount || 0,
    minimum_cod_charge: pricing.minimum_cod_charge || 0,
    cod_charge_percentage: pricing.cod_charge_percentage || 0,
    cod_percentage_amount: pricing.cod_percentage_amount || 0,
    cod_charge_amount: pricing.cod_charge_amount || 0,
    to_pay_charge: pricing.to_pay_charge || 0,
    payment_type: pricing.payment_type || null,
    product_value: pricing.product_value || 0,
    cod_threshold: pricing.cod_threshold || 0,
    subtotal_before_gst: pricing.subtotal_before_gst || 0,
    commission_percent: pricing.commission_percent || 0,
    commission_amount: pricing.commission_amount || 0,
    gst_percent: pricing.gst_percent || 0,
    gst_amount: pricing.gst_amount || 0,
    shipping_charge: pricing.shipping_charge,
    final_rate: pricing.final_rate,
    rate_card_id: rateCardService.rate_card_id,
    service_id: rateCardService.id,
    use_shipping_charge_api:
      Number(rateCardService.use_shipping_charge_api) === 1,
    pickup: zoneResult.pickup,
    delivery: zoneResult.delivery,
  };
};

// ======================================================
// CALCULATE SINGLE SHIPPING RATE
// ======================================================

const calculateShippingRate = async (
  userId,
  pickup_pincode,
  delivery_pincode,
  weight,
  serviceType = "ROAD",
  paymentType = "PREPAID",
  productValue = 0
) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!/^\d{6}$/.test(String(pickup_pincode || "").trim())) {
    throw new Error("Valid 6-digit pickup pincode is required");
  }

  if (!/^\d{6}$/.test(String(delivery_pincode || "").trim())) {
    throw new Error("Valid 6-digit delivery pincode is required");
  }

  const numericWeight = Number(weight);
  if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
    throw new Error("Valid weight is required");
  }

  const normalizedService = normalizeServiceType(serviceType);
  if (!SUPPORTED_SERVICES.has(normalizedService)) {
    throw new Error("Invalid shipping service");
  }

  const user = await getUserRateCard(userId);
  const rateCardService = await getAdminRateCardService(
    user.rate_card_id,
    normalizedService
  );

  const zoneResult = await calculateZone(pickup_pincode, delivery_pincode);
  let finalZone = zoneResult.zone;

  const pickupCity = String(zoneResult.pickup?.city || "")
    .trim()
    .toLowerCase();
  const deliveryCity = String(zoneResult.delivery?.city || "")
    .trim()
    .toLowerCase();

  if (pickupCity && deliveryCity && pickupCity === deliveryCity) {
    finalZone = "A";
  }

  const useApi = Number(rateCardService.use_shipping_charge_api) === 1;
  let pricing;
  let rateData = null;

  if (useApi) {
    const apiResult = await calculateDelhiveryRate({
      pickupPincode: pickup_pincode,
      deliveryPincode: delivery_pincode,
      weight: numericWeight,
      serviceType: normalizedService,
      paymentType: paymentType,
    });

    pricing = calculateApiPricing({
      apiRate: apiResult.api_base_rate,
      commissionPercent: Number(rateCardService.commission_percent) || 0,
    });

    rateData = {
      weight_from: numericWeight,
      weight_to: numericWeight,
    };
  } else {
    let normalRate;
    try {
      normalRate = await getAdminRate(rateCardService.id, numericWeight);
    } catch (error) {
      normalRate = await getLastAdminRate(rateCardService.id);
    }

    rateData = normalRate;
    const baseRate = getZoneRate(normalRate, finalZone);

    const addition = await calculateAdditionAmount(
      rateCardService.id,
      numericWeight,
      finalZone
    );

    pricing = calculateOwnPricing({
      baseRate,
      rateCardService,
      paymentType,
      productValue,
      additionAmount: addition.addition_amount,
      additionSteps: addition.addition_steps,
      additionPerStep: addition.addition_per_step,
      additionRuleId: addition.addition_rule_id,
      additionFromKg: addition.addition_from_kg,
      additionStepKg: addition.addition_step_kg,
    });
  }

  return buildShippingResult({
    serviceType: normalizedService,
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

const calculateShippingOptions = async (
  userId,
  pickup_pincode,
  delivery_pincode,
  weight,
  paymentType = "PREPAID",
  productValue = 0
) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const numericWeight = Number(weight);
  if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
    throw new Error("Valid weight is required");
  }

  let road = null;
  try {
    road = await calculateShippingRate(
      userId,
      pickup_pincode,
      delivery_pincode,
      numericWeight,
      "ROAD",
      paymentType,
      productValue
    );
  } catch (error) {
    console.log("ROAD rate unavailable:", error.message);
  }

  let air = null;
  try {
    air = await calculateShippingRate(
      userId,
      pickup_pincode,
      delivery_pincode,
      numericWeight,
      "AIR",
      paymentType,
      productValue
    );
  } catch (error) {
    console.log("AIR rate unavailable:", error.message);
  }

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
