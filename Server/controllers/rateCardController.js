const rateCardModel =
  require("../models/rateCardModel");


// ======================================================
// ALLOWED SHIPPING SERVICES
// ======================================================

const ALLOWED_SERVICES = new Set([
  "ROAD",
  "AIR",
  "SHADOWFAX_ROAD",
]);


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
// VALIDATE SERVICE
// ======================================================

const isValidService = (
  serviceType
) => {

  return ALLOWED_SERVICES.has(
    serviceType
  );

};


// ======================================================
// VALIDATE RATE DATA
// ======================================================

const validateRateData = ({
  weight_from,
  weight_to,
  zone_a_rate,
  zone_b_rate,
  zone_c_rate,
  zone_d_rate,
  zone_e_rate,
  zone_f_rate,
}) => {

  // -----------------------------------------------
  // WEIGHT
  // -----------------------------------------------

  const from =
    Number(weight_from);

  const to =
    Number(weight_to);


  if (
    Number.isNaN(from) ||
    Number.isNaN(to) ||
    from < 0 ||
    to <= from
  ) {

    return {
      valid: false,
      message:
        "Invalid weight slab",
    };

  }


  // -----------------------------------------------
  // ZONE RATES
  // -----------------------------------------------

  const rates = [
    zone_a_rate,
    zone_b_rate,
    zone_c_rate,
    zone_d_rate,
    zone_e_rate,
    zone_f_rate,
  ];


  const hasInvalidRate =
    rates.some(
      (rate) => {

        const value =
          Number(rate);

        return (
          Number.isNaN(value) ||
          value < 0
        );

      }
    );


  if (
    hasInvalidRate
  ) {

    return {
      valid: false,
      message:
        "Rates must be valid positive numbers",
    };

  }


  return {
    valid: true,
  };

};


// ======================================================
// GET ALL RATE CARDS
// ======================================================

const getRateCards = (
  req,
  res
) => {

  rateCardModel.getRateCards(
    (err, result) => {

      if (err) {

        console.log(
          "Get rate cards error:",
          err
        );


        return res.status(500).json({

          success: false,

          message:
            "Unable to fetch rate cards",

        });

      }


      return res.status(200).json({

        success: true,

        rateCards:
          result,

      });

    }
  );

};


// ======================================================
// CREATE NEW RATE CARD
// ======================================================

const createRateCard = (
  req,
  res
) => {

  const {

    service_type,

    weight_from,
    weight_to,

    zone_a_rate,
    zone_b_rate,
    zone_c_rate,
    zone_d_rate,
    zone_e_rate,
    zone_f_rate,

  } = req.body;


  // -----------------------------------------------
  // SERVICE TYPE
  // -----------------------------------------------

  const normalizedService =
    normalizeServiceType(
      service_type
    );


  if (
    !isValidService(
      normalizedService
    )
  ) {

    return res.status(400).json({

      success: false,

      message:
        "Invalid service type",

    });

  }


  // -----------------------------------------------
  // REQUIRED FIELDS
  // -----------------------------------------------

  const requiredFields = [

    weight_from,
    weight_to,

    zone_a_rate,
    zone_b_rate,
    zone_c_rate,
    zone_d_rate,
    zone_e_rate,
    zone_f_rate,

  ];


  if (
    requiredFields.some(
      (value) =>
        value ===
        undefined ||
        value === null ||
        value === ""
    )
  ) {

    return res.status(400).json({

      success: false,

      message:
        "All rate fields are required",

    });

  }


  // -----------------------------------------------
  // VALIDATE
  // -----------------------------------------------

  const validation =
    validateRateData({

      weight_from,
      weight_to,

      zone_a_rate,
      zone_b_rate,
      zone_c_rate,
      zone_d_rate,
      zone_e_rate,
      zone_f_rate,

    });


  if (
    !validation.valid
  ) {

    return res.status(400).json({

      success: false,

      message:
        validation.message,

    });

  }


  // -----------------------------------------------
  // CREATE
  // -----------------------------------------------

  rateCardModel.createRateCard(

    {

      service_type:
        normalizedService,

      weight_from:
        Number(weight_from),

      weight_to:
        Number(weight_to),

      zone_a_rate:
        Number(zone_a_rate),

      zone_b_rate:
        Number(zone_b_rate),

      zone_c_rate:
        Number(zone_c_rate),

      zone_d_rate:
        Number(zone_d_rate),

      zone_e_rate:
        Number(zone_e_rate),

      zone_f_rate:
        Number(zone_f_rate),

    },

    (err, result) => {

      if (err) {

        console.log(
          "Create rate card error:",
          err
        );


        return res.status(500).json({

          success: false,

          message:
            "Unable to create rate card",

          error:
            err.message,

        });

      }


      return res.status(201).json({

        success: true,

        message:
          `${normalizedService} rate card created successfully`,

        id:
          result.insertId,

      });

    }

  );

};


// ======================================================
// UPDATE RATE CARD
// ======================================================

const updateRateCard = (
  req,
  res
) => {

  const {
    id
  } = req.params;


  const {

    service_type,

    weight_from,
    weight_to,

    zone_a_rate,
    zone_b_rate,
    zone_c_rate,
    zone_d_rate,
    zone_e_rate,
    zone_f_rate,

  } = req.body;


  // -----------------------------------------------
  // SERVICE TYPE
  // -----------------------------------------------

  const normalizedService =
    normalizeServiceType(
      service_type
    );


  if (
    !isValidService(
      normalizedService
    )
  ) {

    return res.status(400).json({

      success: false,

      message:
        "Invalid service type",

    });

  }


  // -----------------------------------------------
  // REQUIRED FIELDS
  // -----------------------------------------------

  const requiredFields = [

    weight_from,
    weight_to,

    zone_a_rate,
    zone_b_rate,
    zone_c_rate,
    zone_d_rate,
    zone_e_rate,
    zone_f_rate,

  ];


  if (
    requiredFields.some(
      (value) =>
        value ===
        undefined ||
        value === null ||
        value === ""
    )
  ) {

    return res.status(400).json({

      success: false,

      message:
        "All rate fields are required",

    });

  }


  // -----------------------------------------------
  // VALIDATE
  // -----------------------------------------------

  const validation =
    validateRateData({

      weight_from,
      weight_to,

      zone_a_rate,
      zone_b_rate,
      zone_c_rate,
      zone_d_rate,
      zone_e_rate,
      zone_f_rate,

    });


  if (
    !validation.valid
  ) {

    return res.status(400).json({

      success: false,

      message:
        validation.message,

    });

  }


  // -----------------------------------------------
  // UPDATE
  // -----------------------------------------------

  rateCardModel.updateRateCard(

    id,

    {

      service_type:
        normalizedService,

      weight_from:
        Number(weight_from),

      weight_to:
        Number(weight_to),

      zone_a_rate:
        Number(zone_a_rate),

      zone_b_rate:
        Number(zone_b_rate),

      zone_c_rate:
        Number(zone_c_rate),

      zone_d_rate:
        Number(zone_d_rate),

      zone_e_rate:
        Number(zone_e_rate),

      zone_f_rate:
        Number(zone_f_rate),

    },

    (err, result) => {

      if (err) {

        console.log(
          "Update rate card error:",
          err
        );


        return res.status(500).json({

          success: false,

          message:
            "Unable to update rate card",

          error:
            err.message,

        });

      }


      if (
        result.affectedRows ===
        0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Rate card not found",

        });

      }


      return res.status(200).json({

        success: true,

        message:
          "Rate card updated successfully",

      });

    }

  );

};


// ======================================================
// EXPORT
// ======================================================

module.exports = {

  getRateCards,

  createRateCard,

  updateRateCard,

};