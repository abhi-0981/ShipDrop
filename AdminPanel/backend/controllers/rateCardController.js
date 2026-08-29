const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: process.env.DB_PASSWORD,
  database: "shipdrop",
});


// =====================================================
// CREATE RATE CARD
// =====================================================

const createRateCard = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Rate card name is required",
      });
    }

    const rateCardName = name.trim();

    const [existing] = await db.query(
      `SELECT id
       FROM admin_rate_cards
       WHERE name = ?
       LIMIT 1`,
      [rateCardName]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: "Rate card already exists",
      });
    }

    const [result] = await db.query(
      `INSERT INTO admin_rate_cards
       (name)
       VALUES (?)`,
      [rateCardName]
    );

    const rateCardId = result.insertId;

    await db.query(
      `INSERT INTO admin_rate_card_services
       (
         rate_card_id,
         service_type,
         use_shipping_charge_api,
         commission_percent
       )
       VALUES
       (?, ?, ?, ?),
       (?, ?, ?, ?)`,
      [
        rateCardId,
        "ROAD",
        true,
        0,

        rateCardId,
        "AIR",
        true,
        0,
      ]
    );

    res.status(201).json({
      message: "Rate card created successfully",

      rateCard: {
        id: rateCardId,
        name: rateCardName,
        is_active: true,
      },
    });

  } catch (error) {

    console.error(
      "Create rate card error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to create rate card",
    });
  }
};


// =====================================================
// UPDATE RATE CARD
// =====================================================

const updateRateCard = async (req, res) => {
  try {

    const { id } = req.params;
    const { name } = req.body;

    if (
      !id ||
      !Number.isInteger(Number(id))
    ) {
      return res.status(400).json({
        message: "Valid rate card ID is required",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Rate card name is required",
      });
    }

    const rateCardName = name.trim();

    const [existing] = await db.query(
      `SELECT id
       FROM admin_rate_cards
       WHERE name = ?
       AND id != ?
       LIMIT 1`,
      [
        rateCardName,
        id,
      ]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: "Rate card already exists",
      });
    }

    const [result] = await db.query(
      `UPDATE admin_rate_cards
       SET name = ?
       WHERE id = ?`,
      [
        rateCardName,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Rate card not found",
      });
    }

    const [updated] = await db.query(
      `SELECT
        id,
        name,
        is_active,
        created_at,
        updated_at
       FROM admin_rate_cards
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    return res.json({
      message: "Rate card updated successfully",
      rateCard: updated[0],
    });

  } catch (error) {

    console.error(
      "Update rate card error:",
      error.message
    );

    return res.status(500).json({
      message: "Failed to update rate card",
    });
  }
};


// =====================================================
// GET ALL RATE CARDS
// =====================================================

const getRateCards = async (req, res) => {
  try {

    const [rateCards] =
      await db.query(
        `SELECT
          id,
          name,
          is_active,
          created_at,
          updated_at
         FROM admin_rate_cards
         ORDER BY id DESC`
      );

    res.json({
      rateCards,
    });

  } catch (error) {

    console.error(
      "Get rate cards error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to load rate cards",
    });
  }
};


// =====================================================
// UPDATE RATE CARD STATUS
// =====================================================

const updateRateCardStatus = async (
  req,
  res
) => {

  try {

    const { id } = req.params;
    const { is_active } = req.body;

    if (
      is_active !== true &&
      is_active !== false
    ) {

      return res.status(400).json({
        message:
          "is_active must be true or false",
      });
    }

    const [result] =
      await db.query(
        `UPDATE admin_rate_cards
         SET is_active = ?
         WHERE id = ?`,
        [
          is_active,
          id,
        ]
      );

    if (
      result.affectedRows === 0
    ) {

      return res.status(404).json({
        message:
          "Rate card not found",
      });
    }

    res.json({
      message:
        "Rate card status updated successfully",

      is_active,
    });

  } catch (error) {

    console.error(
      "Update rate card status error:",
      error.message
    );

    res.status(500).json({
      message:
        "Failed to update rate card status",
    });
  }
};


// =====================================================
// GET RATE CARD SERVICES
// =====================================================

const getRateCardServices = async (
  req,
  res
) => {

  try {

    const { id } = req.params;

    const [rateCards] =
      await db.query(
        `SELECT
          id,
          name,
          is_active
         FROM admin_rate_cards
         WHERE id = ?
         LIMIT 1`,
        [id]
      );

    if (
      rateCards.length === 0
    ) {

      return res.status(404).json({
        message:
          "Rate card not found",
      });
    }

    const [services] =
      await db.query(
        `SELECT
          id,
          rate_card_id,
          service_type,
          use_shipping_charge_api,
          commission_percent,
          created_at,
          updated_at
         FROM admin_rate_card_services
         WHERE rate_card_id = ?
         ORDER BY
           CASE
             WHEN service_type = 'ROAD'
               THEN 1
             WHEN service_type = 'AIR'
               THEN 2
             ELSE 3
           END`,
        [id]
      );

    res.json({

      rateCard:
        rateCards[0],

      services,

    });

  } catch (error) {

    console.error(
      "Get rate card services error:",
      error.message
    );

    res.status(500).json({
      message:
        "Failed to load rate card services",
    });
  }
};


// =====================================================
// UPDATE SERVICE API SETTINGS
// =====================================================

const updateServiceSettings = async (
  req,
  res
) => {

  try {

    const {
      rateCardId,
      serviceId,
    } = req.params;

    const {
      use_shipping_charge_api,
      commission_percent,
    } = req.body;

    if (
      use_shipping_charge_api !== true &&
      use_shipping_charge_api !== false
    ) {

      return res.status(400).json({
        message:
          "use_shipping_charge_api must be true or false",
      });
    }

    const commission =
      Number(
        commission_percent
      );

    if (
      !Number.isFinite(
        commission
      )
    ) {

      return res.status(400).json({
        message:
          "Commission must be a valid number",
      });
    }

    if (
      commission < 0 ||
      commission > 100
    ) {

      return res.status(400).json({
        message:
          "Commission must be between 0 and 100",
      });
    }

    const [services] =
      await db.query(
        `SELECT
          id,
          rate_card_id,
          service_type
         FROM admin_rate_card_services
         WHERE id = ?
         AND rate_card_id = ?
         LIMIT 1`,
        [
          serviceId,
          rateCardId,
        ]
      );

    if (
      services.length === 0
    ) {

      return res.status(404).json({
        message:
          "Service not found",
      });
    }

    await db.query(
      `UPDATE admin_rate_card_services
       SET
         use_shipping_charge_api = ?,
         commission_percent = ?
       WHERE id = ?
       AND rate_card_id = ?`,
      [
        use_shipping_charge_api,
        commission,
        serviceId,
        rateCardId,
      ]
    );

    const [updated] =
      await db.query(
        `SELECT
          id,
          rate_card_id,
          service_type,
          use_shipping_charge_api,
          commission_percent
         FROM admin_rate_card_services
         WHERE id = ?
         AND rate_card_id = ?
         LIMIT 1`,
        [
          serviceId,
          rateCardId,
        ]
      );

    res.json({

      message:
        "Service settings updated successfully",

      service:
        updated[0],

    });

  } catch (error) {

    console.error(
      "Update service settings error:",
      error.message
    );

    res.status(500).json({
      message:
        "Failed to update service settings",
    });
  }
};


// =====================================================
// GET SERVICE RATES
// =====================================================

const getServiceRates = async (
  req,
  res
) => {

  try {

    const {
      rateCardId,
      serviceId,
    } = req.params;

    const [services] =
      await db.query(
        `SELECT
          id,
          rate_card_id,
          service_type,
          use_shipping_charge_api,
          commission_percent
         FROM admin_rate_card_services
         WHERE id = ?
         AND rate_card_id = ?
         LIMIT 1`,
        [
          serviceId,
          rateCardId,
        ]
      );

    if (
      services.length === 0
    ) {

      return res.status(404).json({
        message:
          "Service not found",
      });
    }

    const [rates] =
      await db.query(
        `SELECT
          id,
          service_id,
          weight_from,
          weight_to,
          zone_a_rate,
          zone_b_rate,
          zone_c_rate,
          zone_d_rate,
          zone_e_rate,
          zone_f_rate,
          created_at,
          updated_at
         FROM admin_rate_card_rates
         WHERE service_id = ?
         ORDER BY weight_from ASC`,
        [serviceId]
      );

    res.json({

      service:
        services[0],

      rates,

    });

  } catch (error) {

    console.error(
      "Get service rates error:",
      error.message
    );

    res.status(500).json({
      message:
        "Failed to load service rates",
    });
  }
};


// =====================================================
// CREATE / UPDATE RATE SLAB
// =====================================================

const saveServiceRate = async (
  req,
  res
) => {

  try {

    const {
      rateCardId,
      serviceId,
    } = req.params;

    const {
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
    // VALIDATE WEIGHT
    // -----------------------------------------------

    if (
      weight_from === undefined ||
      weight_from === "" ||
      weight_to === undefined ||
      weight_to === ""
    ) {

      return res.status(400).json({
        message:
          "Weight From and Weight To are required",
      });
    }


    const weightFrom =
      Number(
        weight_from
      );

    const weightTo =
      Number(
        weight_to
      );


    if (
      !Number.isFinite(
        weightFrom
      ) ||
      !Number.isFinite(
        weightTo
      )
    ) {

      return res.status(400).json({
        message:
          "Invalid weight values",
      });
    }


    if (
      weightFrom < 0
    ) {

      return res.status(400).json({
        message:
          "Weight From cannot be negative",
      });
    }


    if (
      weightTo <= weightFrom
    ) {

      return res.status(400).json({
        message:
          "Weight To must be greater than Weight From",
      });
    }


    // -----------------------------------------------
    // CHECK SERVICE
    // -----------------------------------------------

    const [services] =
      await db.query(
        `SELECT id
         FROM admin_rate_card_services
         WHERE id = ?
         AND rate_card_id = ?
         LIMIT 1`,
        [
          serviceId,
          rateCardId,
        ]
      );


    if (
      services.length === 0
    ) {

      return res.status(404).json({
        message:
          "Service not found",
      });
    }


    // -----------------------------------------------
    // CHECK EXACT SLAB
    // -----------------------------------------------

    const [existingExact] =
      await db.query(
        `SELECT id
         FROM admin_rate_card_rates
         WHERE service_id = ?
         AND weight_from = ?
         AND weight_to = ?
         LIMIT 1`,
        [
          serviceId,
          weightFrom,
          weightTo,
        ]
      );


    // -----------------------------------------------
    // CHECK OVERLAPPING SLAB
    // -----------------------------------------------

    let overlapQuery = `
      SELECT
        id,
        weight_from,
        weight_to
      FROM admin_rate_card_rates
      WHERE service_id = ?
      AND weight_from < ?
      AND weight_to > ?
    `;


    const overlapParams = [

      serviceId,

      weightTo,

      weightFrom,

    ];


    if (
      existingExact.length > 0
    ) {

      overlapQuery +=
        ` AND id != ?`;

      overlapParams.push(
        existingExact[0].id
      );
    }


    overlapQuery +=
      ` ORDER BY weight_from ASC
        LIMIT 1`;


    const [overlapping] =
      await db.query(
        overlapQuery,
        overlapParams
      );


    if (
      overlapping.length > 0
    ) {

      return res.status(409).json({
        message:
          `Weight range overlaps with existing slab ${overlapping[0].weight_from} - ${overlapping[0].weight_to} kg`,
      });
    }


    // -----------------------------------------------
    // RATES
    // -----------------------------------------------

    const zoneA =
      Number(
        zone_a_rate
      ) || 0;

    const zoneB =
      Number(
        zone_b_rate
      ) || 0;

    const zoneC =
      Number(
        zone_c_rate
      ) || 0;

    const zoneD =
      Number(
        zone_d_rate
      ) || 0;

    const zoneE =
      Number(
        zone_e_rate
      ) || 0;

    const zoneF =
      Number(
        zone_f_rate
      ) || 0;


    // -----------------------------------------------
    // UPDATE
    // -----------------------------------------------

    if (
      existingExact.length > 0
    ) {

      const rateId =
        existingExact[0].id;


      await db.query(
        `UPDATE admin_rate_card_rates
         SET
           zone_a_rate = ?,
           zone_b_rate = ?,
           zone_c_rate = ?,
           zone_d_rate = ?,
           zone_e_rate = ?,
           zone_f_rate = ?
         WHERE id = ?`,
        [
          zoneA,
          zoneB,
          zoneC,
          zoneD,
          zoneE,
          zoneF,
          rateId,
        ]
      );


      const [savedRate] =
        await db.query(
          `SELECT
            id,
            service_id,
            weight_from,
            weight_to,
            zone_a_rate,
            zone_b_rate,
            zone_c_rate,
            zone_d_rate,
            zone_e_rate,
            zone_f_rate,
            created_at,
            updated_at
           FROM admin_rate_card_rates
           WHERE id = ?
           LIMIT 1`,
          [rateId]
        );


      return res.json({

        message:
          "Rate slab updated successfully",

        rate:
          savedRate[0],

      });
    }


    // -----------------------------------------------
    // INSERT
    // -----------------------------------------------

    const [result] =
      await db.query(
        `INSERT INTO admin_rate_card_rates
        (
          service_id,
          weight_from,
          weight_to,
          zone_a_rate,
          zone_b_rate,
          zone_c_rate,
          zone_d_rate,
          zone_e_rate,
          zone_f_rate
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          serviceId,

          weightFrom,
          weightTo,

          zoneA,
          zoneB,
          zoneC,
          zoneD,
          zoneE,
          zoneF,
        ]
      );


    const rateId =
      result.insertId;


    const [savedRate] =
      await db.query(
        `SELECT
          id,
          service_id,
          weight_from,
          weight_to,
          zone_a_rate,
          zone_b_rate,
          zone_c_rate,
          zone_d_rate,
          zone_e_rate,
          zone_f_rate,
          created_at,
          updated_at
         FROM admin_rate_card_rates
         WHERE id = ?
         LIMIT 1`,
        [rateId]
      );


    res.status(201).json({

      message:
        "Rate slab created successfully",

      rate:
        savedRate[0],

    });

  } catch (error) {

    console.error(
      "Save service rate error:",
      error.message
    );

    res.status(500).json({
      message:
        "Failed to save rate slab",
    });
  }
};


// =====================================================
// GET SERVICE ADDITIONS
// =====================================================

const getServiceAdditions = async (
  req,
  res
) => {

  try {

    const {
      rateCardId,
      serviceId,
    } = req.params;


    // -----------------------------------------------
    // CHECK SERVICE
    // -----------------------------------------------

    const [services] =
      await db.query(
        `SELECT id
         FROM admin_rate_card_services
         WHERE id = ?
         AND rate_card_id = ?
         LIMIT 1`,
        [
          serviceId,
          rateCardId,
        ]
      );


    if (
      services.length === 0
    ) {

      return res.status(404).json({
        message:
          "Service not found",
      });
    }


    // -----------------------------------------------
    // GET ADDITIONS
    // -----------------------------------------------

    const [additions] =
      await db.query(
        `SELECT
          id,
          service_id,
          from_kg,
          step_kg,
          zone_a_rate,
          zone_b_rate,
          zone_c_rate,
          zone_d_rate,
          zone_e_rate,
          zone_f_rate,
          created_at,
          updated_at
         FROM admin_rate_card_additions
         WHERE service_id = ?
         ORDER BY
           from_kg ASC,
           id ASC`,
        [serviceId]
      );


    return res.json({
      additions,
    });

  } catch (error) {

    console.error(
      "Get service additions error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Failed to load service additions",
    });
  }
};


// =====================================================
// CREATE / UPDATE SERVICE ADDITION
// =====================================================

const saveServiceAddition = async (
  req,
  res
) => {

  try {

    const {
      rateCardId,
      serviceId,
    } = req.params;


    const {

      id,

      from_kg,
      step_kg,

      zone_a_rate,
      zone_b_rate,
      zone_c_rate,
      zone_d_rate,
      zone_e_rate,
      zone_f_rate,

    } = req.body;


    // -----------------------------------------------
    // CHECK SERVICE
    // -----------------------------------------------

    const [services] =
      await db.query(
        `SELECT id
         FROM admin_rate_card_services
         WHERE id = ?
         AND rate_card_id = ?
         LIMIT 1`,
        [
          serviceId,
          rateCardId,
        ]
      );


    if (
      services.length === 0
    ) {

      return res.status(404).json({
        message:
          "Service not found",
      });
    }


    // -----------------------------------------------
    // NORMALIZE
    // -----------------------------------------------

    const from =
      Number(
        from_kg
      );

    const step =
      Number(
        step_kg
      );


    // -----------------------------------------------
    // VALIDATE FROM
    // -----------------------------------------------

    if (
      !Number.isFinite(
        from
      ) ||
      from < 0
    ) {

      return res.status(400).json({
        message:
          "From (kg) must be a valid non-negative number",
      });
    }


    // -----------------------------------------------
    // VALIDATE STEP
    // -----------------------------------------------

    if (
      !Number.isFinite(
        step
      ) ||
      step <= 0
    ) {

      return res.status(400).json({
        message:
          "Step (kg) must be greater than 0",
      });
    }


    // -----------------------------------------------
    // ZONE RATES
    // -----------------------------------------------

    const zoneRates = [

      zone_a_rate,
      zone_b_rate,
      zone_c_rate,
      zone_d_rate,
      zone_e_rate,
      zone_f_rate,

    ].map(
      (value) =>
        Number(
          value ?? 0
        )
    );


    if (
      zoneRates.some(
        (value) =>
          !Number.isFinite(
            value
          ) ||
          value < 0
      )
    ) {

      return res.status(400).json({
        message:
          "Zone addition rates must be valid non-negative numbers",
      });
    }


    // -----------------------------------------------
    // ADDITION ID
    // -----------------------------------------------

    const additionId =
      Number(
        id
      );


    // -----------------------------------------------
    // UPDATE EXISTING
    // -----------------------------------------------

    if (
      Number.isInteger(
        additionId
      ) &&
      additionId > 0
    ) {

      const [result] =
        await db.query(
          `UPDATE admin_rate_card_additions
           SET
             from_kg = ?,
             step_kg = ?,
             zone_a_rate = ?,
             zone_b_rate = ?,
             zone_c_rate = ?,
             zone_d_rate = ?,
             zone_e_rate = ?,
             zone_f_rate = ?
           WHERE id = ?
           AND service_id = ?`,
          [

            from,
            step,

            zoneRates[0],
            zoneRates[1],
            zoneRates[2],
            zoneRates[3],
            zoneRates[4],
            zoneRates[5],

            additionId,
            serviceId,

          ]
        );


      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({
          message:
            "Addition rule not found",
        });
      }

    } else {

      // ---------------------------------------------
      // CREATE NEW
      // ---------------------------------------------

      const [result] =
        await db.query(
          `INSERT INTO admin_rate_card_additions
          (
            service_id,
            from_kg,
            step_kg,
            zone_a_rate,
            zone_b_rate,
            zone_c_rate,
            zone_d_rate,
            zone_e_rate,
            zone_f_rate
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [

            serviceId,

            from,
            step,

            zoneRates[0],
            zoneRates[1],
            zoneRates[2],
            zoneRates[3],
            zoneRates[4],
            zoneRates[5],

          ]
        );


      return res.status(201).json({

        message:
          "Addition rule created successfully",

        addition: {

          id:
            result.insertId,

          service_id:
            Number(
              serviceId
            ),

          from_kg:
            from,

          step_kg:
            step,

          zone_a_rate:
            zoneRates[0],

          zone_b_rate:
            zoneRates[1],

          zone_c_rate:
            zoneRates[2],

          zone_d_rate:
            zoneRates[3],

          zone_e_rate:
            zoneRates[4],

          zone_f_rate:
            zoneRates[5],

        },

      });
    }


    // -----------------------------------------------
    // GET UPDATED ROW
    // -----------------------------------------------

    const [saved] =
      await db.query(
        `SELECT
          id,
          service_id,
          from_kg,
          step_kg,
          zone_a_rate,
          zone_b_rate,
          zone_c_rate,
          zone_d_rate,
          zone_e_rate,
          zone_f_rate,
          created_at,
          updated_at
         FROM admin_rate_card_additions
         WHERE id = ?
         AND service_id = ?
         LIMIT 1`,
        [
          additionId,
          serviceId,
        ]
      );


    return res.json({

      message:
        "Addition rule updated successfully",

      addition:
        saved[0],

    });

  } catch (error) {

    console.error(
      "Save service addition error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Failed to save addition rule",
    });
  }
};


// =====================================================
// DELETE SERVICE ADDITION
// =====================================================

const deleteServiceAddition = async (
  req,
  res
) => {

  try {

    const {
      rateCardId,
      serviceId,
      additionId,
    } = req.params;


    // -----------------------------------------------
    // CHECK SERVICE
    // -----------------------------------------------

    const [services] =
      await db.query(
        `SELECT id
         FROM admin_rate_card_services
         WHERE id = ?
         AND rate_card_id = ?
         LIMIT 1`,
        [
          serviceId,
          rateCardId,
        ]
      );


    if (
      services.length === 0
    ) {

      return res.status(404).json({
        message:
          "Service not found",
      });
    }


    // -----------------------------------------------
    // DELETE
    // -----------------------------------------------

    const [result] =
      await db.query(
        `DELETE FROM admin_rate_card_additions
         WHERE id = ?
         AND service_id = ?`,
        [
          additionId,
          serviceId,
        ]
      );


    if (
      result.affectedRows === 0
    ) {

      return res.status(404).json({
        message:
          "Addition rule not found",
      });
    }


    return res.json({
      message:
        "Addition rule deleted successfully",
    });

  } catch (error) {

    console.error(
      "Delete service addition error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Failed to delete addition rule",
    });
  }
};


// =====================================================
// DELETE RATE CARD
// =====================================================

const deleteRateCard = async (
  req,
  res
) => {

  const connection =
    await db.getConnection();


  try {

    const { id } =
      req.params;


    if (
      !id ||
      !Number.isInteger(
        Number(id)
      )
    ) {

      return res.status(400).json({
        message:
          "Valid rate card ID is required",
      });
    }


    const rateCardId =
      Number(id);


    await connection.beginTransaction();


    // -----------------------------------------------
    // CHECK RATE CARD
    // -----------------------------------------------

    const [rateCards] =
      await connection.query(
        `SELECT id
         FROM admin_rate_cards
         WHERE id = ?
         LIMIT 1`,
        [
          rateCardId,
        ]
      );


    if (
      rateCards.length === 0
    ) {

      await connection.rollback();

      return res.status(404).json({
        message:
          "Rate card not found",
      });
    }


    // -----------------------------------------------
    // GET SERVICES
    // -----------------------------------------------

    const [services] =
      await connection.query(
        `SELECT id
         FROM admin_rate_card_services
         WHERE rate_card_id = ?`,
        [
          rateCardId,
        ]
      );


    // -----------------------------------------------
    // DELETE SERVICE RATES
    // -----------------------------------------------

    for (
      const service
      of services
    ) {

      await connection.query(
        `DELETE FROM admin_rate_card_rates
         WHERE service_id = ?`,
        [
          service.id,
        ]
      );
    }


    // -----------------------------------------------
    // DELETE SERVICE ADDITIONS
    // -----------------------------------------------

    for (
      const service
      of services
    ) {

      await connection.query(
        `DELETE FROM admin_rate_card_additions
         WHERE service_id = ?`,
        [
          service.id,
        ]
      );
    }


    // -----------------------------------------------
    // DELETE SERVICES
    // -----------------------------------------------

    await connection.query(
      `DELETE FROM admin_rate_card_services
       WHERE rate_card_id = ?`,
      [
        rateCardId,
      ]
    );


    // -----------------------------------------------
    // DELETE RATE CARD
    // -----------------------------------------------

    await connection.query(
      `DELETE FROM admin_rate_cards
       WHERE id = ?`,
      [
        rateCardId,
      ]
    );


    await connection.commit();


    return res.json({
      message:
        "Rate card deleted successfully",
    });

  } catch (error) {

    await connection.rollback();

    console.error(
      "Delete rate card error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Failed to delete rate card",
    });

  } finally {

    connection.release();

  }
};


// =====================================================
// DELETE RATE SLAB
// =====================================================

const deleteServiceRate = async (
  req,
  res
) => {

  try {

    const {
      rateCardId,
      serviceId,
      rateId,
    } = req.params;


    // -----------------------------------------------
    // CHECK SERVICE
    // -----------------------------------------------

    const [services] =
      await db.query(
        `SELECT id
         FROM admin_rate_card_services
         WHERE id = ?
         AND rate_card_id = ?
         LIMIT 1`,
        [
          serviceId,
          rateCardId,
        ]
      );


    if (
      services.length === 0
    ) {

      return res.status(404).json({
        message:
          "Service not found",
      });
    }


    // -----------------------------------------------
    // DELETE
    // -----------------------------------------------

    const [result] =
      await db.query(
        `DELETE FROM admin_rate_card_rates
         WHERE id = ?
         AND service_id = ?`,
        [
          rateId,
          serviceId,
        ]
      );


    if (
      result.affectedRows === 0
    ) {

      return res.status(404).json({
        message:
          "Rate slab not found",
      });
    }


    res.json({
      message:
        "Rate slab deleted successfully",
    });

  } catch (error) {

    console.error(
      "Delete service rate error:",
      error.message
    );

    res.status(500).json({
      message:
        "Failed to delete rate slab",
    });
  }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {

  createRateCard,

  updateRateCard,

  deleteRateCard,

  getRateCards,

  updateRateCardStatus,

  getRateCardServices,

  updateServiceSettings,

  getServiceRates,

  saveServiceRate,

  deleteServiceRate,

  getServiceAdditions,

  saveServiceAddition,

  deleteServiceAddition,

};