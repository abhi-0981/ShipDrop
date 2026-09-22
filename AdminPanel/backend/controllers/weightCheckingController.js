const weightCheckingModel = require("../model/weightCheckingModel");


// ======================================================
// GET ALL WEIGHT CHECKINGS
// ======================================================

const getAllWeightCheckings = async (
  req,
  res
) => {
  try {
    const records =
      await weightCheckingModel.getAllWeightCheckings();

    return res.status(200).json({
      success: true,
      records,
    });

  } catch (error) {
    console.error(
      "Get all weight checkings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch weight checking records",
    });
  }
};


// ======================================================
// GET SINGLE WEIGHT CHECKING
// ======================================================

const getWeightCheckingById = async (
  req,
  res
) => {
  try {
    const id =
      Number(req.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid weight checking ID is required",
      });
    }

    const record =
      await weightCheckingModel.getWeightCheckingById(
        id
      );

    return res.status(200).json({
      success: true,
      record,
    });

  } catch (error) {
    console.error(
      "Get weight checking error:",
      error
    );

    return res.status(404).json({
      success: false,
      message:
        error.message ||
        "Weight checking record not found",
    });
  }
};


// ======================================================
// CREATE WEIGHT CHECKING
// ======================================================

const createWeightChecking = async (
  req,
  res
) => {
  try {
    const {
      order_db_id,
      order_id,
      user_id,
      awb,

      declared_weight,
      actual_weight,

      original_shipping_charge,
      recalculated_shipping_charge,
      extra_charge,

      rate_card_id,
      service_type,
      zone,
      distance_km,
      weight_source,

      status,
      settlement_amount,
    } = req.body;


    // --------------------------------------------------
    // REQUIRED
    // --------------------------------------------------

    if (
      !order_db_id ||
      !order_id ||
      !user_id
    ) {
      return res.status(400).json({
        success: false,
        message:
          "order_db_id, order_id and user_id are required",
      });
    }


    // --------------------------------------------------
    // WEIGHT
    // --------------------------------------------------

    const declared =
      Number(
        declared_weight
      );

    const actual =
      Number(
        actual_weight
      );


    if (
      !Number.isFinite(
        declared
      ) ||
      declared <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Declared weight must be a valid positive number",
      });
    }


    if (
      !Number.isFinite(
        actual
      ) ||
      actual <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Actual weight must be a valid positive number",
      });
    }


    const difference =
      Number(
        (
          actual -
          declared
        ).toFixed(3)
      );


    // --------------------------------------------------
    // CHARGES
    // --------------------------------------------------

    const originalCharge =
      Math.max(
        0,
        Number(
          original_shipping_charge ||
            0
        )
      );


    const recalculatedCharge =
      Math.max(
        0,
        Number(
          recalculated_shipping_charge ||
            0
        )
      );


    const extraCharge =
      Math.max(
        0,
        Number(
          extra_charge ||
            0
        )
      );


    // --------------------------------------------------
    // CREATE
    // --------------------------------------------------

    const result =
      await weightCheckingModel.createWeightChecking(
        {
          order_db_id,
          order_id,
          user_id,

          awb:
            awb ||
            null,

          declared_weight:
            declared,

          actual_weight:
            actual,

          weight_difference:
            difference,

          original_shipping_charge:
            originalCharge,

          recalculated_shipping_charge:
            recalculatedCharge,

          extra_charge:
            extraCharge,

          rate_card_id:
            rate_card_id ||
            null,

          service_type:
            service_type ||
            null,

          zone:
            zone ||
            null,

          distance_km:
            distance_km ||
            null,

          weight_source:
            weight_source ||
            "MANUAL",

          status:
            status ||
            "PENDING",

          settlement_amount:
            Number(
              settlement_amount ||
                0
            ),
        }
      );


    return res.status(201).json({
      success: true,

      message:
        "Weight checking record created successfully",

      record:
        result,
    });

  } catch (error) {
    console.error(
      "Create weight checking error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to create weight checking record",
    });
  }
};


// ======================================================
// UPDATE ACTUAL WEIGHT
// ======================================================

const updateActualWeight =
  async (
    req,
    res
  ) => {
    try {
      const id =
        Number(
          req.params.id
        );

      const actualWeight =
        Number(
          req.body?.actual_weight
        );


      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid weight checking ID is required",
        });
      }


      if (
        !Number.isFinite(
          actualWeight
        ) ||
        actualWeight <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Actual weight must be a valid positive number",
        });
      }


      const result =
        await weightCheckingModel.updateActualWeight(
          id,
          actualWeight
        );


      if (
        result.affectedRows ===
        0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Record not found or already settled",
        });
      }


      return res.status(200).json({
        success: true,
        message:
          "Actual weight updated successfully",
      });

    } catch (error) {
      console.error(
        "Update actual weight error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to update actual weight",
      });
    }
  };


// ======================================================
// UPDATE CHARGES
// ======================================================

const updateWeightCharges =
  async (
    req,
    res
  ) => {
    try {
      const id =
        Number(
          req.params.id
        );

      const recalculatedShippingCharge =
        Number(
          req.body?.recalculated_shipping_charge
        );

      const extraCharge =
        Number(
          req.body?.extra_charge
        );


      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid weight checking ID is required",
        });
      }


      if (
        !Number.isFinite(
          recalculatedShippingCharge
        ) ||
        recalculatedShippingCharge < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid recalculated shipping charge",
        });
      }


      if (
        !Number.isFinite(
          extraCharge
        ) ||
        extraCharge < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid extra charge",
        });
      }


      const result =
        await weightCheckingModel.updateWeightCharges(
          id,
          recalculatedShippingCharge,
          extraCharge
        );


      if (
        result.affectedRows ===
        0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Record not found or already settled",
        });
      }


      return res.status(200).json({
        success: true,
        message:
          "Weight charges updated successfully",
      });

    } catch (error) {
      console.error(
        "Update weight charges error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to update weight charges",
      });
    }
  };


// ======================================================
// SETTLE SINGLE
// ======================================================

const settleWeightChecking =
  async (
    req,
    res
  ) => {
    try {
      const id =
        Number(
          req.params.id
        );


      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid weight checking ID is required",
        });
      }


      const result =
        await weightCheckingModel
          .settleWeightChecking(
            id
          );


      if (
        !result ||
        String(
          result.status || ""
        ).toUpperCase() !==
        "SETTLED"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Weight checking was not settled",
        });
      }


      return res.status(200).json({
        success: true,

        message:
          "Weight checking settled successfully",

        settlement:
          result,
      });

    } catch (error) {
      console.error(
        "Settle weight checking error:",
        error
      );

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to settle weight checking",
      });
    }
  };


// ======================================================
// SETTLE SELECTED
// ======================================================

const settleSelectedWeightCheckings =
  async (
    req,
    res
  ) => {
    try {
      const rawIds =
        req.body?.ids;


      if (
        !Array.isArray(
          rawIds
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Selected weight checking IDs are required",
        });
      }


      const ids = [
        ...new Set(
          rawIds
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
      ];


      if (!ids.length) {
        return res.status(400).json({
          success: false,
          message:
            "Please select at least one pending weight settlement",
        });
      }


      const result =
        await weightCheckingModel
          .settleSelectedWeightCheckings(
            ids
          );


      const settledCount =
        Number(
          result?.settled_count ||
            0
        );


      const totalAmount =
        Number(
          result?.total_amount ||
            0
        );


      const settlements =
        Array.isArray(
          result?.settlements
        )
          ? result.settlements
          : [];


      // ==================================================
      // NEVER SAY SUCCESS IF NOTHING SETTLED
      // ==================================================

      if (
        settledCount === 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "No selected weight checking record was settled.",

          settled_count:
            0,

          total_amount:
            0,

          settlements: [],
        });
      }


      // ==================================================
      // ALL SELECTED IDS MUST SETTLE
      // ==================================================

      if (
        settledCount !==
        ids.length
      ) {
        return res.status(400).json({
          success: false,

          message:
            `Settlement incomplete. ${settledCount} of ${ids.length} selected records were settled.`,

          settled_count:
            settledCount,

          total_amount:
            totalAmount,

          settlements,
        });
      }


      return res.status(200).json({
        success: true,

        message:
          `${settledCount} record${
            settledCount ===
            1
              ? ""
              : "s"
          } settled successfully`,

        settled_count:
          settledCount,

        total_amount:
          totalAmount,

        settlements,
      });

    } catch (error) {
      console.error(
        "Settle selected weight checking error:",
        error
      );

      return res.status(400).json({
        success: false,

        message:
          error.message ||
          "Failed to settle selected weight records",
      });
    }
  };


// ======================================================
// RESET IMPORTED PENDING
// ======================================================

const resetImportedWeightCheckings =
  async (
    req,
    res
  ) => {
    try {
      const rawIds =
        req.body?.ids;


      if (
        !Array.isArray(
          rawIds
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Imported weight checking IDs are required",
        });
      }


      const ids = [
        ...new Set(
          rawIds
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
      ];


      if (!ids.length) {
        return res.status(400).json({
          success: false,
          message:
            "No imported weight records were selected for reset",
        });
      }


      const result =
        await weightCheckingModel
          .resetImportedPendingWeightCheckings(
            ids
          );


      return res.status(200).json({
        success: true,

        message:
          result.reset_count > 0
            ? `${result.reset_count} imported pending weight record${
                result.reset_count ===
                1
                  ? ""
                  : "s"
              } reset successfully`
            : "No pending imported records were available to reset",

        reset_count:
          result.reset_count,
      });

    } catch (error) {
      console.error(
        "Reset imported weight checking error:",
        error
      );

      return res.status(400).json({
        success: false,

        message:
          error.message ||
          "Failed to reset imported weight records",
      });
    }
  };


// ======================================================
// SETTLE ALL - LEGACY
// ======================================================
//
// Frontend does NOT use this anymore.
// Kept only so old API route does not break.
// ======================================================

const settleAllPendingWeightCheckings =
  async (
    req,
    res
  ) => {
    try {
      const result =
        await weightCheckingModel
          .settleAllPendingWeightCheckings();


      const settledCount =
        Number(
          result?.settled_count ||
            0
        );


      if (
        settledCount === 0
      ) {
        return res.status(200).json({
          success: true,

          message:
            "No pending weight settlements found",

          settled_count:
            0,

          total_amount:
            0,

          settlements: [],
        });
      }


      return res.status(200).json({
        success: true,

        message:
          `${settledCount} weight settlement${
            settledCount ===
            1
              ? ""
              : "s"
          } completed successfully`,

        settled_count:
          settledCount,

        total_amount:
          result.total_amount,

        settlements:
          result.settlements,
      });

    } catch (error) {
      console.error(
        "Settle all weight checking error:",
        error
      );

      return res.status(400).json({
        success: false,

        message:
          error.message ||
          "Failed to settle pending weight records",
      });
    }
  };


// ======================================================
// WAIVE
// ======================================================

const waiveWeightChecking =
  async (
    req,
    res
  ) => {
    try {
      const id =
        Number(
          req.params.id
        );


      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid weight checking ID is required",
        });
      }


      const result =
        await weightCheckingModel
          .waiveWeightChecking(
            id
          );


      if (
        result.affectedRows ===
        0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Record not found or already settled",
        });
      }


      return res.status(200).json({
        success: true,

        message:
          "Weight checking waived successfully",
      });

    } catch (error) {
      console.error(
        "Waive weight checking error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Failed to waive weight checking",
      });
    }
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

  resetImportedWeightCheckings,

  waiveWeightChecking,
};