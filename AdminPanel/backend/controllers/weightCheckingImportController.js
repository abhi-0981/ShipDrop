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
    .toLowerCase();


const getRowValue = (
  row,
  wantedHeader
) => {
  const target =
    normalizeHeader(wantedHeader);

  const key =
    Object.keys(row).find(
      (item) =>
        normalizeHeader(item) ===
        target
    );

  return key === undefined
    ? ""
    : row[key];
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
// CALCULATE RATE FOR A SPECIFIC WEIGHT
// ======================================================

const calculateRateForWeight = async ({
  userId,
  pickupPincode,
  deliveryPincode,
  weight,
  serviceType,
  paymentType,
  productValue,
}) => {
  const result =
    await calculateShippingRate(
      userId,
      pickupPincode,
      deliveryPincode,
      weight,
      serviceType,
      paymentType,
      productValue
    );

  const shippingCharge =
    Number(
      result?.shipping_charge ??
        result?.final_rate ??
        0
    );

  if (
    !Number.isFinite(
      shippingCharge
    ) ||
    shippingCharge < 0
  ) {
    throw new Error(
      `Invalid shipping charge returned for ${weight} KG`
    );
  }

  return {
    shippingCharge:
      roundMoney(
        shippingCharge
      ),

    rateCardId:
      result?.rate_card_id ||
      null,

    serviceType:
      result?.service_type ||
      serviceType,

    zone:
      result?.zone ||
      null,

    distanceKm:
      result?.distance_km ??
      null,

    baseRate:
      Number(
        result?.base_rate || 0
      ),

    finalRate:
      Number(
        result?.final_rate ||
          shippingCharge
      ),
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

      if (
        !headers.includes("awb")
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Required column "AWB" is missing',
        });
      }

      if (
        !headers.includes(
          "weight(gm)"
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Required column "weight(gm)" is missing',
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


          // ----------------------------------------------
          // ACTUAL WEIGHT
          // ----------------------------------------------

          const actualWeightGrams =
            Number(
              getRowValue(
                row,
                "weight(gm)"
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
                  o.pincode AS delivery_pincode,

                  pa.pickup_pincode,

                  pkg.weight AS declared_weight,

                  m.id AS manifest_id,
                  m.shipping_charge,
                  m.zone,
                  m.distance_km,
                  m.service_type,

                  COALESCE(
                    (
                      SELECT
                        SUM(
                          COALESCE(
                            op.price,
                            0
                          ) *
                          COALESCE(
                            op.qty,
                            0
                          )
                        )

                      FROM order_products op

                      WHERE
                        op.order_id =
                        o.id
                    ),
                    0
                  ) AS product_value

                FROM orders o

                LEFT JOIN pickup_addresses pa
                  ON pa.id =
                     o.pickup_address_id

                LEFT JOIN order_packages pkg
                  ON pkg.order_id =
                     o.id

                LEFT JOIN manifests m
                  ON m.order_id =
                     o.id

                  AND m.user_id =
                     o.user_id

                  AND UPPER(
                    COALESCE(
                      m.status,
                      ''
                    )
                  ) = 'CONFIRMED'

                WHERE
                  TRIM(
                    CAST(
                      o.awb AS CHAR
                    )
                  ) = ?

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
          // CONFIRMED MANIFEST
          // ==================================================

          if (
            !order.manifest_id
          ) {
            skipped.push({
              row:
                excelRowNumber,

              awb,

              reason:
                "Confirmed manifest was not found for this order",
            });

            continue;
          }


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
                }
              );


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