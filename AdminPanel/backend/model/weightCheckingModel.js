const db = require("../config/db");

// ======================================================
// HELPERS
// ======================================================

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const roundMoney = (value) =>
  Number(toNumber(value).toFixed(2));

const roundWeight = (value) =>
  Number(toNumber(value).toFixed(3));


// ======================================================
// GET ALL WEIGHT CHECKING RECORDS
// ======================================================

const getAllWeightCheckings = async () => {
  const [rows] = await db.query(`
    SELECT
      wc.id,
      wc.order_db_id,
      wc.order_id,
      wc.user_id,
      wc.awb,

      wc.declared_weight,
      wc.actual_weight,
      wc.weight_difference,

      wc.original_shipping_charge,
      wc.recalculated_shipping_charge,
      wc.extra_charge,

      wc.rate_card_id,
      wc.service_type,
      wc.zone,
      wc.distance_km,
      wc.weight_source,

      wc.status,
      wc.settlement_amount,

      wc.created_at,
      wc.settled_at,

      u.full_name AS user_name,
      u.company_name

    FROM weight_checkings wc

    LEFT JOIN users u
      ON u.id = wc.user_id

    ORDER BY wc.id DESC
  `);

  return rows;
};


// ======================================================
// GET SINGLE WEIGHT CHECKING
// ======================================================

const getWeightCheckingById = async (
  weightCheckingId
) => {
  const [rows] = await db.query(
    `
      SELECT
        wc.id,
        wc.order_db_id,
        wc.order_id,
        wc.user_id,
        wc.awb,

        wc.declared_weight,
        wc.actual_weight,
        wc.weight_difference,

        wc.original_shipping_charge,
        wc.recalculated_shipping_charge,
        wc.extra_charge,

        wc.rate_card_id,
        wc.service_type,
        wc.zone,
        wc.distance_km,
        wc.weight_source,

        wc.status,
        wc.settlement_amount,

        wc.created_at,
        wc.settled_at,

        u.full_name AS user_name,
        u.company_name

      FROM weight_checkings wc

      LEFT JOIN users u
        ON u.id = wc.user_id

      WHERE wc.id = ?

      LIMIT 1
    `,
    [weightCheckingId]
  );

  if (!rows.length) {
    throw new Error(
      "Weight checking record not found"
    );
  }

  return rows[0];
};


// ======================================================
// CREATE WEIGHT CHECKING
// ======================================================

const createWeightChecking = async (
  weightData
) => {
  const declaredWeight =
    roundWeight(
      weightData.declared_weight
    );

  const actualWeight =
    roundWeight(
      weightData.actual_weight
    );

  const difference =
    roundWeight(
      actualWeight -
        declaredWeight
    );

  const originalCharge =
    Math.max(
      0,
      roundMoney(
        weightData.original_shipping_charge
      )
    );

  const recalculatedCharge =
    Math.max(
      0,
      roundMoney(
        weightData.recalculated_shipping_charge
      )
    );

  // ====================================================
  // SIGNED WALLET ADJUSTMENT
  //
  // Positive = recover from wallet
  // Negative = refund to wallet
  // Zero     = no wallet adjustment
  // ====================================================

  const extraCharge =
    roundMoney(
      recalculatedCharge -
      originalCharge
    );

  const [result] = await db.query(
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

        ?, ?
      )
    `,
    [
      weightData.order_db_id,
      weightData.order_id,
      weightData.user_id,
      weightData.awb || null,

      declaredWeight,
      actualWeight,
      difference,

      originalCharge,
      recalculatedCharge,
      extraCharge,

      weightData.rate_card_id || null,
      weightData.service_type || null,
      weightData.zone || null,
      weightData.distance_km || null,

      weightData.weight_source ||
        "MANUAL",

      weightData.status ||
        "PENDING",

      roundMoney(
        weightData.settlement_amount
      ),
    ]
  );

  return {
    id: result.insertId,
  };
};


// ======================================================
// UPDATE ACTUAL WEIGHT
// ======================================================

const updateActualWeight = async (
  weightCheckingId,
  actualWeight
) => {
  const actual =
    roundWeight(actualWeight);

  if (actual <= 0) {
    throw new Error(
      "Actual weight must be greater than zero"
    );
  }

  const [result] =
    await db.query(
      `
        UPDATE weight_checkings

        SET
          actual_weight = ?,

          weight_difference =
            ROUND(
              ? - declared_weight,
              3
            ),

          weight_source = 'MANUAL'

        WHERE id = ?

        AND status = 'PENDING'
      `,
      [
        actual,
        actual,
        weightCheckingId,
      ]
    );

  return result;
};


// ======================================================
// UPDATE WEIGHT CHARGES
// ======================================================

const updateWeightCharges = async (
  weightCheckingId,
  recalculatedShippingCharge,
  extraCharge
) => {
  const recalculated =
    Math.max(
      0,
      roundMoney(
        recalculatedShippingCharge
      )
    );

  // Keep adjustment signed.
  // Positive = recovery
  // Negative = refund
  const extra =
    roundMoney(extraCharge);

  const [result] =
    await db.query(
      `
        UPDATE weight_checkings

        SET
          recalculated_shipping_charge = ?,
          extra_charge = ?

        WHERE id = ?

        AND status = 'PENDING'
      `,
      [
        recalculated,
        extra,
        weightCheckingId,
      ]
    );

  return result;
};


// ======================================================
// SYNC USER ORDER PACKAGE WEIGHT
//
// Courier actual weight becomes
// User Panel package weight.
// ======================================================

const syncSettledOrderWeight = async (
  connection,
  orderDbId,
  actualWeight
) => {
  const targetWeight =
    roundWeight(actualWeight);

  if (
    !orderDbId ||
    targetWeight <= 0
  ) {
    throw new Error(
      "Invalid order ID or actual weight while updating package weight"
    );
  }

  const [packageRows] =
    await connection.query(
      `
        SELECT
          id,
          weight,
          package_count

        FROM order_packages

        WHERE order_id = ?

        ORDER BY id ASC

        FOR UPDATE
      `,
      [orderDbId]
    );

  if (
    !packageRows ||
    packageRows.length === 0
  ) {
    throw new Error(
      `No package found for order ${orderDbId}`
    );
  }

  const declaredTotal =
    packageRows.reduce(
      (total, pkg) => {
        const weight =
          toNumber(pkg.weight);

        const count =
          toNumber(
            pkg.package_count,
            1
          );

        return (
          total +
          weight * count
        );
      },
      0
    );

  // ====================================================
  // NORMAL CASE
  // ====================================================

  if (declaredTotal > 0) {
    let assignedTotal = 0;

    for (
      let index = 0;
      index < packageRows.length;
      index += 1
    ) {
      const pkg =
        packageRows[index];

      const count =
        toNumber(
          pkg.package_count,
          1
        );

      let newWeight;

      // Last package gets remaining weight
      // so total remains exact.
      if (
        index ===
        packageRows.length - 1
      ) {
        const remaining =
          targetWeight -
          assignedTotal;

        newWeight =
          Number(
            (
              remaining /
              count
            ).toFixed(3)
          );
      } else {
        newWeight =
          Number(
            (
              (
                toNumber(
                  pkg.weight
                ) *
                targetWeight
              ) /
              declaredTotal
            ).toFixed(3)
          );
      }

      if (
        !Number.isFinite(
          newWeight
        ) ||
        newWeight < 0
      ) {
        throw new Error(
          `Invalid calculated package weight for package ${pkg.id}`
        );
      }

      await connection.query(
        `
          UPDATE order_packages

          SET weight = ?

          WHERE id = ?
        `,
        [
          newWeight,
          pkg.id,
        ]
      );

      assignedTotal +=
        newWeight * count;
    }

    return;
  }

  // ====================================================
  // FALLBACK
  // ====================================================

  for (
    let index = 0;
    index < packageRows.length;
    index += 1
  ) {
    const pkg =
      packageRows[index];

    const count =
      toNumber(
        pkg.package_count,
        1
      );

    const newWeight =
      index === 0
        ? Number(
            (
              targetWeight /
              count
            ).toFixed(3)
          )
        : 0;

    await connection.query(
      `
        UPDATE order_packages

        SET weight = ?

        WHERE id = ?
      `,
      [
        newWeight,
        pkg.id,
      ]
    );
  }
};


// ======================================================
// SETTLE ONE RECORD
// ======================================================

const settleWeightChecking = async (
  weightCheckingId
) => {
  const result =
    await settleWeightCheckings([
      weightCheckingId,
    ]);

  if (
    result.settled_count !== 1
  ) {
    throw new Error(
      "Weight checking was not settled"
    );
  }

  return result.settlements[0];
};


// ======================================================
// SETTLE SELECTED / ALL
//
// selectedIds:
//   array -> only those records
//   null  -> all pending records
// ======================================================

const settleWeightCheckings = async (
  selectedIds = null
) => {
  const connection =
    await db.getConnection();

  try {
    await connection.beginTransaction();

    // ==================================================
    // NORMALIZE IDS
    // ==================================================

    const validIds =
      Array.isArray(selectedIds)
        ? [
            ...new Set(
              selectedIds
                .map((id) =>
                  Number(id)
                )
                .filter(
                  (id) =>
                    Number.isInteger(
                      id
                    ) &&
                    id > 0
                )
            ),
          ]
        : null;

    if (
      Array.isArray(
        selectedIds
      ) &&
      validIds.length === 0
    ) {
      throw new Error(
        "Please select at least one pending weight settlement"
      );
    }

    // ==================================================
    // FETCH RECORDS
    // ==================================================

    const whereClause =
      validIds === null
        ? `
            status = 'PENDING'
          `
        : `
            id IN (
              ${validIds
                .map(() => "?")
                .join(", ")}
            )
          `;

    const [rows] =
      await connection.query(
        `
          SELECT
            id,
            order_db_id,
            order_id,
            user_id,
            awb,

            declared_weight,
            actual_weight,

            original_shipping_charge,
            recalculated_shipping_charge,
            extra_charge,

            status

          FROM weight_checkings

          WHERE ${whereClause}

          ORDER BY id ASC

          FOR UPDATE
        `,
        validIds === null
          ? []
          : validIds
      );

    // ==================================================
    // SELECTED MODE VALIDATION
    // ==================================================

    if (
      Array.isArray(
        selectedIds
      )
    ) {
      if (
        rows.length !==
        validIds.length
      ) {
        const [
          statusRows,
        ] =
          await connection.query(
            `
              SELECT
                id,
                awb,
                status,
                extra_charge

              FROM weight_checkings

              WHERE id IN (
                ${validIds
                  .map(() => "?")
                  .join(", ")}
              )
            `,
            validIds
          );

        const reasons =
          statusRows.map(
            (row) => {
              const status =
                String(
                  row.status || ""
                )
                  .trim()
                  .toUpperCase();

              if (
                status !==
                "PENDING"
              ) {
                return `AWB ${row.awb}: already ${status.toLowerCase()}`;
              }

              return `AWB ${row.awb}: cannot be settled`;
            }
          );

        if (
          reasons.length
        ) {
          throw new Error(
            reasons.join(" | ")
          );
        }

        throw new Error(
          `Selected record(s) were not found`
        );
      }
    }

    // ==================================================
    // NOTHING AVAILABLE
    // ==================================================

    if (!rows.length) {
      await connection.rollback();

      return {
        settled_count: 0,
        total_amount: 0,
        settlements: [],
      };
    }

    const settlements = [];

    let totalAmount = 0;

    // ==================================================
    // PROCESS EACH RECORD
    // ==================================================

    for (
      const record of rows
    ) {
      const status =
        String(
          record.status || ""
        )
          .trim()
          .toUpperCase();

      if (
        status !== "PENDING"
      ) {
        throw new Error(
          `AWB ${record.awb}: record is already ${status.toLowerCase()}`
        );
      }

      const originalCharge =
        roundMoney(
          record.original_shipping_charge
        );

      // =================================================
      // FINAL PRICE FOR ACTUAL WEIGHT
      //
      // Import/rate calculation already stored this in:
      // weight_checkings.recalculated_shipping_charge
      // =================================================

      const recalculatedCharge =
        roundMoney(
          record.recalculated_shipping_charge
        );

      // Signed amount:
      // + = recover
      // - = refund
      const extraCharge =
        roundMoney(
          record.extra_charge
        );

      if (
        originalCharge < 0
      ) {
        throw new Error(
          `AWB ${record.awb}: invalid original shipping charge`
        );
      }

      if (
        recalculatedCharge < 0
      ) {
        throw new Error(
          `AWB ${record.awb}: invalid recalculated shipping charge`
        );
      }

      const actualWeight =
        roundWeight(
          record.actual_weight
        );

      if (
        actualWeight <= 0
      ) {
        throw new Error(
          `AWB ${record.awb}: actual weight is invalid`
        );
      }

      // ==================================================
      // LOCK WALLET
      // ==================================================

      const [walletRows] =
        await connection.query(
          `
            SELECT
              id,
              user_id,
              balance

            FROM wallets

            WHERE user_id = ?

            LIMIT 1

            FOR UPDATE
          `,
          [record.user_id]
        );

      if (
        !walletRows.length
      ) {
        throw new Error(
          `AWB ${record.awb}: wallet not found for user ${record.user_id}`
        );
      }

      const wallet =
        walletRows[0];

      const openingBalance =
        roundMoney(
          wallet.balance
        );

      // ==================================================
      // CREDIT ORIGINAL CHARGE
      //
      // This reverses the original wallet deduction.
      // ==================================================

      const balanceAfterCredit =
        roundMoney(
          openingBalance +
          originalCharge
        );

      await connection.query(
        `
          UPDATE wallets

          SET
            balance = ?,
            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = ?
        `,
        [
          balanceAfterCredit,
          wallet.id,
        ]
      );

      await connection.query(
        `
          INSERT INTO wallet_transactions
          (
            user_id,
            type,
            amount,
            opening_balance,
            closing_balance,
            description,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            status
          )

          VALUES
          (
            ?,
            'RECHARGE',
            ?,
            ?,
            ?,
            ?,
            NULL,
            NULL,
            NULL,
            'SUCCESS'
          )
        `,
        [
          record.user_id,
          originalCharge,
          openingBalance,
          balanceAfterCredit,

          `Weight adjustment for Order #${record.order_id} - original shipping charge credited back.`,
        ]
      );

      // ==================================================
      // FINAL BALANCE
      //
      // original charge is credited back
      // actual charge is deducted
      //
      // Example:
      //
      // Original = 47.20
      // Actual   = 23.60
      //
      // +47.20 - 23.60
      // = +23.60 refund
      //
      // Example:
      //
      // Original = 47.20
      // Actual   = 70.80
      //
      // +47.20 - 70.80
      // = -23.60 recovery
      // ==================================================

      const closingBalance =
        roundMoney(
          balanceAfterCredit -
          recalculatedCharge
        );

      if (
        closingBalance < 0
      ) {
        throw new Error(
          `AWB ${record.awb}: insufficient wallet balance`
        );
      }

      // ==================================================
      // DEBIT FINAL RECALCULATED CHARGE
      // ==================================================

      await connection.query(
        `
          UPDATE wallets

          SET
            balance = ?,
            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = ?
        `,
        [
          closingBalance,
          wallet.id,
        ]
      );

      await connection.query(
        `
          INSERT INTO wallet_transactions
          (
            user_id,
            type,
            amount,
            opening_balance,
            closing_balance,
            description,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            status
          )

          VALUES
          (
            ?,
            'DEBIT',
            ?,
            ?,
            ?,
            ?,
            NULL,
            NULL,
            NULL,
            'SUCCESS'
          )
        `,
        [
          record.user_id,
          recalculatedCharge,
          balanceAfterCredit,
          closingBalance,

          `Weight adjustment for Order #${record.order_id} - corrected shipping charge for actual weight ${actualWeight} KG.`,
        ]
      );

      // ==================================================
      // UPDATE USER PANEL PACKAGE WEIGHT
      // ==================================================

      await syncSettledOrderWeight(
        connection,
        record.order_db_id,
        actualWeight
      );

      // ==================================================
      // UPDATE CONFIRMED MANIFEST SHIPPING CHARGE
      //
      // Manifested shipment must also use the final
      // actual-weight charge.
      // ==================================================

      const [manifestRows] =
        await connection.query(
          `
            SELECT
              id

            FROM manifests

            WHERE order_id = ?

            AND user_id = ?

            AND UPPER(
              COALESCE(status, '')
            ) = 'CONFIRMED'

            LIMIT 1

            FOR UPDATE
          `,
          [
            record.order_db_id,
            record.user_id,
          ]
        );

      if (!manifestRows.length) {
        throw new Error(
          `AWB ${record.awb}: confirmed manifest not found`
        );
      }

      await connection.query(
        `
          UPDATE manifests

          SET
            shipping_charge = ?

          WHERE id = ?
        `,
        [
          recalculatedCharge,
          manifestRows[0].id,
        ]
      );

      // ==================================================
      // MARK SETTLED
      // ==================================================

      const [
        updateResult,
      ] =
        await connection.query(
          `
            UPDATE weight_checkings

            SET
              status = 'SETTLED',
              settlement_amount = ?,
              settled_at =
                CURRENT_TIMESTAMP

            WHERE id = ?

            AND status = 'PENDING'
          `,
          [
            extraCharge,
            record.id,
          ]
        );

      if (
        updateResult.affectedRows !==
        1
      ) {
        throw new Error(
          `AWB ${record.awb}: failed to mark record as SETTLED`
        );
      }

      // ==================================================
      // VERIFY SETTLEMENT
      // ==================================================

      const [
        verifyRows,
      ] =
        await connection.query(
          `
            SELECT
              status,
              settlement_amount,
              recalculated_shipping_charge,
              actual_weight,
              settled_at

            FROM weight_checkings

            WHERE id = ?

            LIMIT 1
          `,
          [record.id]
        );

      if (
        !verifyRows.length ||
        String(
          verifyRows[0].status
        )
          .trim()
          .toUpperCase() !==
        "SETTLED"
      ) {
        throw new Error(
          `AWB ${record.awb}: settlement verification failed`
        );
      }

      // ==================================================
      // ADD RESULT
      // ==================================================

      totalAmount +=
        extraCharge;

      settlements.push({
        id:
          Number(record.id),

        user_id:
          Number(record.user_id),

        order_id:
          record.order_id,

        awb:
          record.awb,

        // Signed adjustment
        // + = recovery
        // - = refund
        amount:
          extraCharge,

        original_charge:
          originalCharge,

        recalculated_charge:
          recalculatedCharge,

        actual_weight:
          actualWeight,

        opening_balance:
          openingBalance,

        balance_after_credit:
          balanceAfterCredit,

        closing_balance:
          closingBalance,

        status:
          "SETTLED",
      });
    }

    // ==================================================
    // COMMIT
    // ==================================================

    await connection.commit();

    return {
      settled_count:
        settlements.length,

      total_amount:
        roundMoney(
          totalAmount
        ),

      settlements,
    };

  } catch (error) {
    await connection.rollback();

    throw error;

  } finally {
    connection.release();
  }
};


// ======================================================
// SELECTED SETTLEMENT
// ======================================================

const settleSelectedWeightCheckings =
  async (
    selectedIds
  ) => {
    return settleWeightCheckings(
      selectedIds
    );
  };


// ======================================================
// LEGACY SETTLE ALL
// ======================================================

const settleAllPendingWeightCheckings =
  async () => {
    return settleWeightCheckings(
      null
    );
  };


// ======================================================
// RESET IMPORTED PENDING RECORDS
// ======================================================

const resetImportedPendingWeightCheckings =
  async (
    selectedIds = null
  ) => {
    const validIds =
      Array.isArray(
        selectedIds
      )
        ? [
            ...new Set(
              selectedIds
                .map((id) =>
                  Number(id)
                )
                .filter(
                  (id) =>
                    Number.isInteger(
                      id
                    ) &&
                    id > 0
                )
            ),
          ]
        : null;

    if (
      Array.isArray(
        selectedIds
      ) &&
      validIds.length === 0
    ) {
      throw new Error(
        "No imported weight records were selected for reset"
      );
    }

    const whereClause =
      validIds === null
        ? `
            status = 'PENDING'
            AND weight_source =
              'COURIER_IMPORT'
          `
        : `
            status = 'PENDING'
            AND weight_source =
              'COURIER_IMPORT'

            AND id IN (
              ${validIds
                .map(() => "?")
                .join(", ")}
            )
          `;

    const [result] =
      await db.query(
        `
          DELETE FROM weight_checkings

          WHERE ${whereClause}
        `,
        validIds === null
          ? []
          : validIds
      );

    return {
      reset_count:
        Number(
          result?.affectedRows || 0
        ),
    };
  };


// ======================================================
// WAIVE WEIGHT CHECKING
// ======================================================

const waiveWeightChecking =
  async (
    weightCheckingId
  ) => {
    const [result] =
      await db.query(
        `
          UPDATE weight_checkings

          SET
            status = 'WAIVED',
            settlement_amount = 0,
            settled_at =
              CURRENT_TIMESTAMP

          WHERE id = ?

          AND status = 'PENDING'
        `,
        [weightCheckingId]
      );

    return result;
  };


// ======================================================
// EXPORT
// ======================================================

module.exports = {
  getAllWeightCheckings,

  getWeightCheckingById,

  createWeightChecking,

  updateActualWeight,

  updateWeightCharges,

  settleWeightChecking,

  settleAllPendingWeightCheckings,

  settleSelectedWeightCheckings,

  resetImportedPendingWeightCheckings,

  waiveWeightChecking,
};