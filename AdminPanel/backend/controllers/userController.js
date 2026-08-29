const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: process.env.DB_PASSWORD,
  database: "shipdrop",
});


// =====================================================
// GET ALL USERS
// =====================================================

const getUsers = async (req, res) => {
  try {

    const [users] = await db.query(`
      SELECT
        u.id,
        u.full_name,
        u.company_name,
        u.gst_no,
        u.email,
        u.phone_no,
        u.created_at,
        u.updated_at,
        u.role,
        u.profile_image,
        u.rate_card_id,
        rc.name AS rate_card_name
      FROM users u
      LEFT JOIN admin_rate_cards rc
        ON rc.id = u.rate_card_id
      ORDER BY u.id DESC
    `);

    res.json({
      users,
    });

  } catch (error) {

    console.error(
      "Get users error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to load users",
    });
  }
};


// =====================================================
// GET SINGLE USER
// =====================================================

const getUserById = async (req, res) => {
  try {

    const { id } = req.params;

    const [users] = await db.query(`
      SELECT
        u.id,
        u.full_name,
        u.company_name,
        u.gst_no,
        u.email,
        u.phone_no,
        u.created_at,
        u.updated_at,
        u.role,
        u.profile_image,
        u.rate_card_id,
        rc.name AS rate_card_name
      FROM users u
      LEFT JOIN admin_rate_cards rc
        ON rc.id = u.rate_card_id
      WHERE u.id = ?
      LIMIT 1
    `, [id]);


    if (users.length === 0) {

      return res.status(404).json({
        message: "User not found",
      });
    }


    res.json({
      user: users[0],
    });

  } catch (error) {

    console.error(
      "Get user error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to load user",
    });
  }
};


// =====================================================
// ASSIGN RATE CARD TO USER
// =====================================================

const assignRateCard = async (req, res) => {
  try {

    const { id } = req.params;

    const {
      rate_card_id,
    } = req.body;


    // -------------------------------------------------
    // Allow NULL = Not Assigned
    // -------------------------------------------------

    if (
      rate_card_id !== null &&
      rate_card_id !== undefined &&
      (
        !Number.isInteger(
          Number(rate_card_id)
        ) ||
        Number(rate_card_id) <= 0
      )
    ) {

      return res.status(400).json({
        message: "Invalid rate card",
      });
    }


    // -------------------------------------------------
    // Check user exists
    // -------------------------------------------------

    const [users] = await db.query(
      `
        SELECT id
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );


    if (users.length === 0) {

      return res.status(404).json({
        message: "User not found",
      });
    }


    // -------------------------------------------------
    // If assigning a rate card,
    // check that rate card exists
    // -------------------------------------------------

    if (
      rate_card_id !== null &&
      rate_card_id !== undefined
    ) {

      const [rateCards] =
        await db.query(
          `
            SELECT
              id,
              name,
              is_active
            FROM admin_rate_cards
            WHERE id = ?
            LIMIT 1
          `,
          [
            Number(
              rate_card_id
            ),
          ]
        );


      if (
        rateCards.length === 0
      ) {

        return res.status(404).json({
          message:
            "Rate card not found",
        });
      }


      // -------------------------------------------------
      // Don't assign inactive rate card
      // -------------------------------------------------

      if (
        Number(
          rateCards[0].is_active
        ) !== 1
      ) {

        return res.status(400).json({
          message:
            "Inactive rate card cannot be assigned",
        });
      }
    }


    // -------------------------------------------------
    // Update user
    // -------------------------------------------------

    await db.query(
      `
        UPDATE users
        SET rate_card_id = ?
        WHERE id = ?
      `,
      [
        rate_card_id === null ||
        rate_card_id === undefined
          ? null
          : Number(
              rate_card_id
            ),

        id,
      ]
    );


    // -------------------------------------------------
    // Get updated user
    // -------------------------------------------------

    const [updatedUsers] =
      await db.query(`
        SELECT
          u.id,
          u.full_name,
          u.company_name,
          u.gst_no,
          u.email,
          u.phone_no,
          u.created_at,
          u.updated_at,
          u.role,
          u.profile_image,
          u.rate_card_id,
          rc.name AS rate_card_name
        FROM users u
        LEFT JOIN admin_rate_cards rc
          ON rc.id = u.rate_card_id
        WHERE u.id = ?
        LIMIT 1
      `, [id]);


    res.json({
      message:
        rate_card_id === null ||
        rate_card_id === undefined
          ? "Rate card removed successfully"
          : "Rate card assigned successfully",

      user:
        updatedUsers[0],
    });

  } catch (error) {

    console.error(
      "Assign rate card error:",
      error.message
    );

    res.status(500).json({
      message:
        "Failed to assign rate card",
    });
  }
};


module.exports = {
  getUsers,
  getUserById,
  assignRateCard,
};