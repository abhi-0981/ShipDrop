const db =
  require("../config/db");


// ======================================================
// GET ALL RATE CARDS
// ======================================================

const getRateCards = (
  callback
) => {

  const query = `

    SELECT

      id,
      service_type,

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

    FROM rate_cards

    ORDER BY

      CASE
        WHEN UPPER(service_type) = 'ROAD'
          THEN 1

        WHEN UPPER(service_type) = 'AIR'
          THEN 2

        WHEN UPPER(service_type) = 'SHADOWFAX_ROAD'
          THEN 3

        ELSE 4
      END,

      weight_from ASC

  `;


  db.query(
    query,
    callback
  );

};


// ======================================================
// CREATE RATE CARD
// ======================================================

const createRateCard = (
  rateData,
  callback
) => {

  const query = `

    INSERT INTO rate_cards

    (
      service_type,

      weight_from,
      weight_to,

      zone_a_rate,
      zone_b_rate,
      zone_c_rate,
      zone_d_rate,
      zone_e_rate,
      zone_f_rate
    )

    VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?)

  `;


  db.query(

    query,

    [

      rateData.service_type,

      rateData.weight_from,
      rateData.weight_to,

      rateData.zone_a_rate,
      rateData.zone_b_rate,
      rateData.zone_c_rate,
      rateData.zone_d_rate,
      rateData.zone_e_rate,
      rateData.zone_f_rate,

    ],

    callback

  );

};


// ======================================================
// UPDATE RATE CARD
// ======================================================

const updateRateCard = (
  id,
  rateData,
  callback
) => {

  const query = `

    UPDATE rate_cards

    SET

      service_type = ?,

      weight_from = ?,
      weight_to = ?,

      zone_a_rate = ?,
      zone_b_rate = ?,
      zone_c_rate = ?,
      zone_d_rate = ?,
      zone_e_rate = ?,
      zone_f_rate = ?

    WHERE id = ?

  `;


  db.query(

    query,

    [

      rateData.service_type,

      rateData.weight_from,
      rateData.weight_to,

      rateData.zone_a_rate,
      rateData.zone_b_rate,
      rateData.zone_c_rate,
      rateData.zone_d_rate,
      rateData.zone_e_rate,
      rateData.zone_f_rate,

      id,

    ],

    callback

  );

};


// ======================================================
// GET RATE CARD BY WEIGHT + SERVICE
// ======================================================

const getRateCardByWeight = (
  weight,
  serviceType = "ROAD"
) => {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const normalizedService =
        String(
          serviceType || "ROAD"
        )
          .trim()
          .toUpperCase();


      const numericWeight =
        Number(weight);


      if (
        Number.isNaN(
          numericWeight
        )
      ) {

        return resolve(
          null
        );

      }


      const query = `

        SELECT

          id,
          service_type,

          weight_from,
          weight_to,

          zone_a_rate,
          zone_b_rate,
          zone_c_rate,
          zone_d_rate,
          zone_e_rate,
          zone_f_rate

        FROM rate_cards

        WHERE

          ? >= weight_from

          AND ? <= weight_to

          AND UPPER(service_type) = ?

        ORDER BY

          weight_from ASC

        LIMIT 1

      `;


      db.query(

        query,

        [

          numericWeight,
          numericWeight,
          normalizedService,

        ],

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

            result.length >
            0

              ? result[0]

              : null

          );

        }

      );

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

  getRateCardByWeight,

};