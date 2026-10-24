const path = require("path");
const XLSX = require("xlsx");

require("dotenv").config();

const db = require("../config/db");

const {
  calculateShippingRate,
} = require("../services/rateService");


// ======================================================
// HELPERS
// ======================================================

const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

const getRowValue = (row, wantedHeaders) => {
  const targets = Array.isArray(wantedHeaders)
    ? wantedHeaders.map(normalizeHeader)
    : [normalizeHeader(wantedHeaders)];

  const key = Object.keys(row).find((item) =>
    targets.includes(normalizeHeader(item))
  );

  return key === undefined ? "" : row[key];
};


const roundWeight = (value) =>
  Number(
    Number(value).toFixed(3)
  );


const roundMoney = (value) =>
  Number(
    Number(value).toFixed(2)
  );


// ======================================================
// CALCULATE RATE FOR A SPECIFIC WEIGHT (ULTRA-RESILIENT)
// ======================================================

const calculateRateForWeight = async ({
  userId,
  pickupPincode,
  deliveryPincode,
  weight,
  serviceType,
  paymentType,
  productValue,
  knownZone,
  originalCharge,
  declaredWeight,
}) => {
  const numericWeight = Number(weight);
  const safeWeight = Number.isFinite(numericWeight) && numericWeight > 0 ? numericWeight : 0.5;
  const safeService = String(serviceType || "ROAD").trim().toUpperCase();
  const safePayment = String(paymentType || "Pre-paid").trim();
  const safeProductValue = Number(productValue) || 0;
  const safeZone = String(knownZone || "B").trim().toUpperCase();

  // Tier 1: Try calculateShippingRate with sanitized pincodes
  try {
    const cleanPickup = /^\d{6}$/.test(String(pickupPincode || "").trim())
      ? String(pickupPincode).trim()
      : "110001";
    const cleanDelivery = /^\d{6}$/.test(String(deliveryPincode || "").trim())
      ? String(deliveryPincode).trim()
      : "110001";

    const result = await calculateShippingRate(
      userId,
      cleanPickup,
      cleanDelivery,
      safeWeight,
      safeService,
      safePayment,
      safeProductValue
    );

    const shippingCharge = Number(
      result?.shipping_charge ?? result?.final_rate ?? 0
    );

    if (Number.isFinite(shippingCharge) && shippingCharge > 0) {
      return {
        shippingCharge: roundMoney(shippingCharge),
        rateCardId: result?.rate_card_id || null,
        serviceType: result?.service_type || safeService,
        zone: result?.zone || safeZone,
        distanceKm: result?.distance_km ?? null,
        baseRate: Number(result?.base_rate || 0),
        finalRate: Number(result?.final_rate || shippingCharge),
      };
    }
  } catch (err) {
    console.warn("calculateShippingRate warning for weight import, trying database rate card:", err.message);
  }

  // Tier 2: Direct Database Rate Card calculation using known order zone (no external HTTP APIs)
  try {
    const zoneCol = `zone_${safeZone.toLowerCase()}_rate`;

    // Get user rate card or default rate card
    const [uRows] = await db.query(
      "SELECT id, rate_card_id FROM users WHERE id = ? LIMIT 1",
      [userId]
    );
    let rateCardId = uRows[0]?.rate_card_id;
    if (!rateCardId) {
      const [defaultCard] = await db.query(
        "SELECT id FROM admin_rate_cards ORDER BY id ASC LIMIT 1"
      );
      rateCardId = defaultCard[0]?.id;
    }

    if (rateCardId) {
      const [services] = await db.query(
        "SELECT * FROM admin_rate_card_services WHERE rate_card_id = ? AND service_type = ? LIMIT 1",
        [rateCardId, safeService]
      );

      if (services && services.length > 0) {
        const srv = services[0];

        // Find rate slab
        const [slabRows] = await db.query(
          `SELECT * FROM admin_rate_card_rates WHERE service_id = ? AND ? >= weight_from AND ? <= weight_to ORDER BY weight_from ASC LIMIT 1`,
          [srv.id, safeWeight, safeWeight]
        );

        let baseRate = 0;
        let additionAmount = 0;

        if (slabRows && slabRows.length > 0) {
          baseRate = Number(slabRows[0][zoneCol] || slabRows[0].zone_b_rate || slabRows[0].zone_a_rate || 0);
        } else {
          const [lastSlab] = await db.query(
            `SELECT * FROM admin_rate_card_rates WHERE service_id = ? ORDER BY weight_to DESC LIMIT 1`,
            [srv.id]
          );
          if (lastSlab && lastSlab.length > 0) {
            baseRate = Number(lastSlab[0][zoneCol] || lastSlab[0].zone_b_rate || 0);
            const [addRules] = await db.query(
              `SELECT * FROM admin_rate_card_additions WHERE service_id = ? AND from_kg <= ? ORDER BY from_kg DESC LIMIT 1`,
              [srv.id, safeWeight]
            );
            if (addRules && addRules.length > 0) {
              const rule = addRules[0];
              const fromKg = Number(rule.from_kg);
              const stepKg = Number(rule.step_kg) || 0.5;
              const perStepRate = Number(rule[zoneCol] || rule.zone_b_rate || 0);
              const extraKg = Math.max(0, safeWeight - fromKg);
              const steps = Math.ceil(extraKg / stepKg);
              additionAmount = steps * perStepRate;
            }
          }
        }

        const chargeable = baseRate + additionAmount;
        const fsc = (chargeable * (Number(srv.fsc_percentage) || 0)) / 100;
        const addFixed = Number(srv.additional_charge) || 0;
        const subtotal = chargeable + fsc + addFixed;
        const gst = (subtotal * 18) / 100;
        const calculatedTotal = roundMoney(subtotal + gst);

        if (calculatedTotal > 0) {
          return {
            shippingCharge: calculatedTotal,
            rateCardId: rateCardId,
            serviceType: safeService,
            zone: safeZone,
            distanceKm: null,
            baseRate: roundMoney(baseRate),
            finalRate: calculatedTotal,
          };
        }
      }
    }
  } catch (err2) {
    console.warn("Direct rate card calculation warning, trying proportional estimation:", err2.message);
  }

  // Tier 3: Proportional Estimation from original shipping charge (never fails)
  const orig = Number(originalCharge) || 50;
  const dWeight = Number(declaredWeight) || 0.5;
  const unitRate = dWeight > 0 ? orig / dWeight : 100;
  const estimatedShipping = roundMoney(Math.max(orig, orig + (safeWeight - dWeight) * unitRate));

  return {
    shippingCharge: estimatedShipping,
    rateCardId: null,
    serviceType: safeService,
    zone: safeZone,
    distanceKm: null,
    baseRate: orig,
    finalRate: estimatedShipping,
  };
};


// ======================================================
// IMPORT COURIER WEIGHT FILE
// ======================================================

const importWeightFile =
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Weight file is required",
      });
    }

    try {
      // ==================================================
      // READ EXCEL
      // ==================================================

      const workbook =
        XLSX.read(
          req.file.buffer,
          {
            type: "buffer",
          }
        );

      const sheetName =
        workbook.SheetNames[0];

      if (!sheetName) {
        return res.status(400).json({
          success: false,
          message:
            "Excel file has no sheet",
        });
      }

      const worksheet =
        workbook.Sheets[
        sheetName
        ];

      const rows =
        XLSX.utils.sheet_to_json(
          worksheet,
          {
            defval: "",
            raw: true,
          }
        );

      if (!rows.length) {
        return res.status(400).json({
          success: false,
          message:
            "Excel file is empty",
        });
      }


      // ==================================================
      // VALIDATE HEADERS
      // ==================================================

      const headers =
        Object.keys(
          rows[0]
        ).map(
          normalizeHeader
        );

      const hasAwb = headers.includes("awb");
      const hasWeight = headers.some(
        (h) =>
          h === "weight(gm)" ||
          h === "weight(g)" ||
          h === "weight(gms)" ||
          h === "actualweight(gm)" ||
          h === "actualweight" ||
          h === "weight"
      );

      if (!hasAwb) {
        return res.status(400).json({
          success: false,
          message: 'Required column "AWB" is missing',
        });
      }

      if (!hasWeight) {
        return res.status(400).json({
          success: false,
          message: 'Required column "Weight(gm)" is missing',
        });
      }


      // ==================================================
      // DB CONNECTION
      // ==================================================

      const connection =
        await db.getConnection();

      const imported = [];
      const skipped = [];
      const errors = [];

      try {
        await connection.beginTransaction();


        // ==================================================
        // PROCESS EACH EXCEL ROW
        // ==================================================

        for (
          let index = 0;
          index < rows.length;
          index += 1
        ) {
          const row =
            rows[index];

          const excelRowNumber =
            index + 2;


          // ----------------------------------------------
          // AWB
          // ----------------------------------------------

          const awb =
            String(
              getRowValue(
                row,
                "AWB"
              )
            ).trim();


          const actualWeightGrams =
            Number(
              getRowValue(
                row,
                [
                  "weight(gm)",
                  "weight(g)",
                  "weight(gms)",
                  "actualweight(gm)",
                  "actualweight",
                  "weight",
                ]
              )
            );


          if (!awb) {
            errors.push({
              row:
                excelRowNumber,

              message:
                "AWB is empty",
            });

            continue;
          }


          if (
            !Number.isFinite(
              actualWeightGrams
            ) ||
            actualWeightGrams <= 0
          ) {
            errors.push({
              row:
                excelRowNumber,

              awb,

              message:
                "weight(gm) must be a valid positive number",
            });

            continue;
          }


          const actualWeight =
            roundWeight(
              actualWeightGrams /
              1000
            );


          // ==================================================
          // FIND ORDER
          // ==================================================

          const [orders] =
            await connection.query(
              `
                SELECT
                  o.id,
                  o.order_id,
                  o.user_id,
                  o.awb,
                  o.payment_type,
                  COALESCE(NULLIF(TRIM(o.pincode), ''), '110001') AS delivery_pincode,

                  COALESCE(
                    NULLIF(TRIM(pa.pickup_pincode), ''),
                    NULLIF(TRIM(w.pincode), ''),
                    NULLIF(TRIM(pr.pickup_pincode), ''),
                    '110001'
                  ) AS pickup_pincode,

                  COALESCE(
                    NULLIF(pkg.weight, 0),
                    NULLIF(o.weight, 0),
                    0.5
                  ) AS declared_weight,

                  COALESCE(m.id, o.id) AS manifest_id,
                  COALESCE(m.shipping_charge, o.manual_amount_including_gst, 0) AS shipping_charge,
                  COALESCE(NULLIF(TRIM(m.zone), ''), 'B') AS zone,
                  COALESCE(m.distance_km, 0) AS distance_km,
                  COALESCE(NULLIF(TRIM(m.service_type), ''), 'ROAD') AS service_type,

                  COALESCE(
                    (
                      SELECT
                        SUM(
                          COALESCE(op.price, 0) * COALESCE(op.qty, 0)
                        )
                      FROM order_products op
                      WHERE op.order_id = o.id
                    ),
                    0
                  ) AS product_value

                FROM orders o

                LEFT JOIN pickup_addresses pa
                  ON pa.id = o.pickup_address_id

                LEFT JOIN warehouses w
                  ON w.id = o.warehouse_id

                LEFT JOIN order_packages pkg
                  ON pkg.order_id = o.id

                LEFT JOIN manifests m
                  ON m.order_id = o.id
                  AND m.user_id = o.user_id

                LEFT JOIN pickup_requests pr
                  ON pr.id = m.pickup_request_id

                WHERE
                  REPLACE(TRIM(CAST(o.awb AS CHAR)), ' ', '') = REPLACE(TRIM(?), ' ', '')

                ORDER BY
                  m.id DESC

                LIMIT 1
              `,
              [awb]
            );


          if (
            !orders ||
            orders.length === 0
          ) {
            skipped.push({
              row:
                excelRowNumber,

              awb,

              reason:
                "Order with this AWB was not found",
            });

            continue;
          }


          const order =
            orders[0];


          // ==================================================
          // DECLARED WEIGHT
          // ==================================================

          const declaredWeight =
            roundWeight(
              Number(
                order.declared_weight
              )
            );


          if (
            !Number.isFinite(
              declaredWeight
            ) ||
            declaredWeight <= 0
          ) {
            skipped.push({
              row:
                excelRowNumber,

              awb,

              reason:
                "Declared order weight is missing or invalid",
            });

            continue;
          }


          // ==================================================
          // WEIGHT DIFFERENCE
          // ==================================================

          // Actual weight can be LOWER, EQUAL, or HIGHER
          // than the declared weight.
          //
          // LOWER  -> customer gets refund
          // EQUAL  -> no net wallet adjustment
          // HIGHER -> customer pays extra
          //
          // Do not skip lower-weight records here.
          const weightDifference =
            roundWeight(
              actualWeight -
              declaredWeight
            );


          // ==================================================
          // ORIGINAL SHIPPING CHARGE
          // ==================================================

          const originalCharge =
            roundMoney(
              Number(
                order.shipping_charge ||
                0
              )
            );


          if (
            !Number.isFinite(
              originalCharge
            ) ||
            originalCharge < 0
          ) {
            skipped.push({
              row:
                excelRowNumber,

              awb,

              reason:
                "Invalid current shipping charge",
            });

            continue;
          }


          // ==================================================
          // SERVICE
          // ==================================================

          let serviceType =
            String(
              order.service_type ||
              "ROAD"
            )
              .trim()
              .toUpperCase();


          if (
            !["ROAD", "AIR"].includes(
              serviceType
            )
          ) {
            serviceType =
              "ROAD";
          }


          const paymentType =
            order.payment_type ||
            "Pre-paid";


          const productValue =
            Number(
              order.product_value ||
              0
            );


          // ==================================================
          // CALCULATE DECLARED + ACTUAL RATE
          // ==================================================

          let declaredRate;
          let actualRate;


          try {
            actualRate =
              await calculateRateForWeight(
                {
                  userId:
                    order.user_id,

                  pickupPincode:
                    order.pickup_pincode,

                  deliveryPincode:
                    order.delivery_pincode,

                  weight:
                    actualWeight,

                  serviceType,

                  paymentType,

                  productValue,

                  knownZone:
                    order.zone,

                  originalCharge,

                  declaredWeight,
                }
              );

            declaredRate =
              await calculateRateForWeight(
                {
                  userId:
                    order.user_id,

                  pickupPincode:
                    order.pickup_pincode,

                  deliveryPincode:
                    order.delivery_pincode,

                  weight:
                    declaredWeight,

                  serviceType,

                  paymentType,

                  productValue,

                  knownZone:
                    order.zone,

                  originalCharge,

                  declaredWeight,
                }
              );

          } catch (
          rateError
          ) {
            errors.push({
              row:
                excelRowNumber,

              awb,

              message:
                `Unable to calculate weight rates: ${rateError.message}`,
            });

            continue;
          }


          // ==================================================
          // CHARGES
          // ==================================================

          const recalculatedShippingCharge =
            roundMoney(
              actualRate.shippingCharge
            );


          const declaredRateCharge =
            roundMoney(
              declaredRate.shippingCharge
            );


          // ==================================================
          // WALLET ADJUSTMENT
          // ==================================================
          // Compare the final actual-weight charge with the
          // charge that was actually collected on the manifest.
          //
          // Positive -> extra amount to collect
          // Negative -> amount to refund
          // Zero     -> no net adjustment
          const extraCharge =
            roundMoney(
              recalculatedShippingCharge -
              originalCharge
            );


          // ==================================================
          // EXISTING WEIGHT CHECKING
          // ==================================================

          const [existing] =
            await connection.query(
              `
                SELECT
                  id,
                  status

                FROM weight_checkings

                WHERE
                  order_db_id = ?

                ORDER BY
                  id DESC

                LIMIT 1
              `,
              [order.id]
            );


          if (
            existing &&
            existing.length > 0
          ) {
            const existingRecord =
              existing[0];


            const existingStatus =
              String(
                existingRecord.status ||
                ""
              )
                .trim()
                .toUpperCase();


            // Already settled / waived
            // should never be overwritten.

            if (
              existingStatus !==
              "PENDING"
            ) {
              skipped.push({
                row:
                  excelRowNumber,

                awb,

                reason:
                  existingStatus ===
                    "SETTLED"
                    ? "This weight checking is already settled"
                    : existingStatus ===
                      "WAIVED"
                      ? "This weight checking has already been waived"
                      : `Weight checking already exists with status ${existingRecord.status}`,
              });

              continue;
            }


            // ==================================================
            // UPDATE EXISTING PENDING
            // ==================================================

            await connection.query(
              `
                UPDATE weight_checkings

                SET
                  awb = ?,

                  declared_weight = ?,
                  actual_weight = ?,
                  weight_difference = ?,

                  original_shipping_charge = ?,

                  recalculated_shipping_charge = ?,

                  extra_charge = ?,

                  rate_card_id = ?,

                  service_type = ?,

                  zone = ?,

                  distance_km = ?,

                  weight_source =
                    'COURIER_IMPORT',

                  status = 'PENDING',

                  settlement_amount = 0,

                  settled_at = NULL

                WHERE
                  id = ?

                  AND status = 'PENDING'
              `,
              [
                awb,

                declaredWeight,

                actualWeight,

                weightDifference,

                originalCharge,

                recalculatedShippingCharge,

                extraCharge,

                actualRate.rateCardId,

                actualRate.serviceType,

                actualRate.zone ||
                order.zone ||
                null,

                actualRate.distanceKm ??
                order.distance_km ??
                null,

                existingRecord.id,
              ]
            );


            imported.push({
              id:
                Number(
                  existingRecord.id
                ),

              row:
                excelRowNumber,

              awb,

              order_id:
                order.order_id,

              declared_weight:
                declaredWeight,

              actual_weight:
                actualWeight,

              weight_difference:
                weightDifference,

              original_shipping_charge:
                originalCharge,

              declared_rate_charge:
                declaredRateCharge,

              recalculated_shipping_charge:
                recalculatedShippingCharge,

              extra_charge:
                extraCharge,

              updated:
                true,
            });

            continue;
          }


          // ==================================================
          // INSERT NEW RECORD
          // ==================================================

          const [result] =
            await connection.query(
              `
                INSERT INTO weight_checkings
                (
                  order_db_id,
                  order_id,
                  user_id,
                  awb,

                  declared_weight,
                  actual_weight,
                  weight_difference,

                  original_shipping_charge,
                  recalculated_shipping_charge,
                  extra_charge,

                  rate_card_id,
                  service_type,
                  zone,
                  distance_km,
                  weight_source,

                  status,
                  settlement_amount
                )

                VALUES
                (
                  ?, ?, ?, ?,

                  ?, ?, ?,

                  ?, ?, ?,

                  ?, ?, ?, ?, ?,

                  'PENDING',

                  0
                )
              `,
              [
                order.id,

                order.order_id,

                order.user_id,

                awb,

                declaredWeight,

                actualWeight,

                weightDifference,

                originalCharge,

                recalculatedShippingCharge,

                extraCharge,

                actualRate.rateCardId,

                actualRate.serviceType,

                actualRate.zone ||
                order.zone ||
                null,

                actualRate.distanceKm ??
                order.distance_km ??
                null,

                "COURIER_IMPORT",
              ]
            );


          imported.push({
            id:
              Number(
                result.insertId
              ),

            row:
              excelRowNumber,

            awb,

            order_id:
              order.order_id,

            declared_weight:
              declaredWeight,

            actual_weight:
              actualWeight,

            weight_difference:
              weightDifference,

            original_shipping_charge:
              originalCharge,

            declared_rate_charge:
              declaredRateCharge,

            recalculated_shipping_charge:
              recalculatedShippingCharge,

            extra_charge:
              extraCharge,
          });
        }


        // ==================================================
        // COMMIT
        // ==================================================

        await connection.commit();


        return res.status(200).json({
          success: true,

          message:
            "Weight file imported successfully",

          summary: {
            total_rows:
              rows.length,

            imported:
              imported.length,

            skipped:
              skipped.length,

            errors:
              errors.length,
          },

          imported,

          skipped,

          errors,
        });

      } catch (error) {
        await connection.rollback();

        throw error;

      } finally {
        connection.release();
      }

    } catch (error) {
      console.error(
        "Weight file import error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Failed to import weight file",
      });
    }
  };


// ======================================================
// EXPORT
// ======================================================

module.exports = {
  importWeightFile,
};