const db = require("../config/db");


// =========================================================
// GET ALL USERS
// =========================================================

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

    return res.status(200).json({
      users,
    });

  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      message: error.message || "Failed to fetch users",
    });
  }
};


// =========================================================
// GET USER BY ID
// =========================================================

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const [users] = await db.query(
      `
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
      `,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user: users[0],
    });

  } catch (error) {
    console.error("Get user by ID error:", error);

    return res.status(500).json({
      message: error.message || "Failed to fetch user",
    });
  }
};


// =========================================================
// ASSIGN RATE CARD
// =========================================================

const assignRateCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { rate_card_id } = req.body;

    if (!id) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    // -----------------------------------------------------
    // USER CHECK
    // -----------------------------------------------------

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


    // -----------------------------------------------------
    // REMOVE RATE CARD
    // -----------------------------------------------------

    if (
      rate_card_id === null ||
      rate_card_id === undefined ||
      rate_card_id === ""
    ) {
      await db.query(
        `
          UPDATE users
          SET rate_card_id = NULL
          WHERE id = ?
        `,
        [id]
      );

    } else {

      // ---------------------------------------------------
      // VALIDATE RATE CARD ID
      // ---------------------------------------------------

      const parsedRateCardId =
        Number(rate_card_id);

      if (
        !Number.isInteger(parsedRateCardId) ||
        parsedRateCardId <= 0
      ) {
        return res.status(400).json({
          message: "Invalid Rate Card",
        });
      }


      // ---------------------------------------------------
      // RATE CARD CHECK
      // ---------------------------------------------------

      const [rateCards] = await db.query(
        `
          SELECT
            id,
            name,
            is_active
          FROM admin_rate_cards
          WHERE id = ?
          LIMIT 1
        `,
        [parsedRateCardId]
      );

      if (rateCards.length === 0) {
        return res.status(404).json({
          message: "Rate Card not found",
        });
      }

      if (
        Number(rateCards[0].is_active) !== 1
      ) {
        return res.status(400).json({
          message: "Selected Rate Card is inactive",
        });
      }


      // ---------------------------------------------------
      // ASSIGN
      // ---------------------------------------------------

      await db.query(
        `
          UPDATE users
          SET rate_card_id = ?
          WHERE id = ?
        `,
        [
          parsedRateCardId,
          id,
        ]
      );
    }


    // -----------------------------------------------------
    // RETURN UPDATED USER
    // -----------------------------------------------------

    const [updatedUsers] = await db.query(
      `
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
      `,
      [id]
    );

    return res.status(200).json({
      message: "Rate Card updated successfully",
      user: updatedUsers[0],
    });

  } catch (error) {
    console.error("Assign Rate Card error:", error);

    return res.status(500).json({
      message:
        error.message ||
        "Failed to update Rate Card",
    });
  }
};


// =========================================================
// GET USER WALLET
// =========================================================

const getUserWallet = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }


    // -----------------------------------------------------
    // USER CHECK
    // -----------------------------------------------------

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


    // -----------------------------------------------------
    // CREATE WALLET IF NOT EXISTS
    // -----------------------------------------------------

    await db.query(
      `
        INSERT INTO wallets
        (
          user_id,
          balance
        )
        VALUES (?, 0.00)
        ON DUPLICATE KEY UPDATE
          user_id = user_id
      `,
      [id]
    );


    // -----------------------------------------------------
    // GET WALLET
    // -----------------------------------------------------

    const [walletRows] = await db.query(
      `
        SELECT
          id,
          user_id,
          balance
        FROM wallets
        WHERE user_id = ?
        LIMIT 1
      `,
      [id]
    );

    if (walletRows.length === 0) {
      return res.status(404).json({
        message: "Wallet not found",
      });
    }


    // -----------------------------------------------------
    // GET TRANSACTIONS
    // -----------------------------------------------------

    const [transactions] = await db.query(
      `
        SELECT
          id,
          user_id,
          type,
          amount,
          opening_balance,
          closing_balance,
          description,
          razorpay_order_id,
          razorpay_payment_id,
          status,
          created_at
        FROM wallet_transactions
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
      `,
      [id]
    );


    return res.status(200).json({
      wallet: walletRows[0],
      transactions,
    });

  } catch (error) {
    console.error("Get user wallet error:", error);

    return res.status(500).json({
      message:
        error.message ||
        "Failed to fetch wallet",
    });
  }
};


// =========================================================
// ADD MONEY TO USER WALLET FROM ADMIN
// =========================================================

const addUserWalletTransaction = async (
  req,
  res
) => {

  let connection;

  try {

    const { id } = req.params;

    const {
      amount,
      description,
    } = req.body;


    // -----------------------------------------------------
    // BASIC VALIDATION
    // -----------------------------------------------------

    if (!id) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }


    const walletAmount =
      Number(amount);


    if (
      !Number.isFinite(walletAmount) ||
      walletAmount <= 0
    ) {
      return res.status(400).json({
        message: "Please enter a valid amount",
      });
    }


    const transactionDescription =
      typeof description === "string"
        ? description.trim()
        : "";


    if (!transactionDescription) {
      return res.status(400).json({
        message: "Description is required",
      });
    }


    // -----------------------------------------------------
    // USER CHECK
    // -----------------------------------------------------

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


    // -----------------------------------------------------
    // GET DATABASE CONNECTION
    // -----------------------------------------------------

    connection =
      await db.getConnection();


    // -----------------------------------------------------
    // START TRANSACTION
    // -----------------------------------------------------

    await connection.beginTransaction();


    // -----------------------------------------------------
    // ENSURE WALLET EXISTS
    // -----------------------------------------------------

    await connection.query(
      `
        INSERT INTO wallets
        (
          user_id,
          balance
        )
        VALUES (?, 0.00)
        ON DUPLICATE KEY UPDATE
          user_id = user_id
      `,
      [id]
    );


    // -----------------------------------------------------
    // LOCK WALLET ROW
    // -----------------------------------------------------

    const [walletRows] =
      await connection.query(
        `
          SELECT
            balance
          FROM wallets
          WHERE user_id = ?
          LIMIT 1
          FOR UPDATE
        `,
        [id]
      );


    if (
      !walletRows ||
      walletRows.length === 0
    ) {
      throw new Error(
        "Wallet not found"
      );
    }


    // -----------------------------------------------------
    // CALCULATE OPENING / CLOSING BALANCE
    // -----------------------------------------------------

    const openingBalance =
      Number(
        walletRows[0].balance
      ) || 0;


    const closingBalance =
      openingBalance +
      walletAmount;


    // -----------------------------------------------------
    // UPDATE WALLET BALANCE
    // -----------------------------------------------------

    const [
      walletUpdateResult
    ] = await connection.query(
      `
        UPDATE wallets
        SET
          balance = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `,
      [
        closingBalance,
        id,
      ]
    );


    if (
      walletUpdateResult.affectedRows !== 1
    ) {
      throw new Error(
        "Unable to update wallet balance"
      );
    }


    // -----------------------------------------------------
    // CREATE WALLET TRANSACTION
    // -----------------------------------------------------

    const [
      transactionResult
    ] = await connection.query(
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
        id,
        walletAmount,
        openingBalance,
        closingBalance,
        transactionDescription,
      ]
    );


    if (
      transactionResult.affectedRows !== 1
    ) {
      throw new Error(
        "Unable to create wallet transaction"
      );
    }


    // -----------------------------------------------------
    // COMMIT
    // -----------------------------------------------------

    await connection.commit();


    // -----------------------------------------------------
    // RELEASE
    // -----------------------------------------------------

    connection.release();
    connection = null;


    // -----------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------

    return res.status(201).json({
      message:
        "Wallet recharged successfully",

      transaction: {
        id:
          transactionResult.insertId,

        user_id:
          Number(id),

        type:
          "RECHARGE",

        amount:
          walletAmount,

        opening_balance:
          openingBalance,

        closing_balance:
          closingBalance,

        description:
          transactionDescription,

        status:
          "SUCCESS",
      },

      balance:
        closingBalance,
    });

  } catch (error) {

    console.error(
      "Add user wallet transaction error:",
      error
    );


    // -----------------------------------------------------
    // ROLLBACK
    // -----------------------------------------------------

    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Wallet rollback error:",
          rollbackError
        );
      }

      connection.release();
    }


    return res.status(500).json({
      message:
        error.message ||
        "Failed to add money to wallet",
    });
  }
};


// =========================================================
// EXPORT
// =========================================================

module.exports = {
  getUsers,
  getUserById,
  assignRateCard,
  getUserWallet,
  addUserWalletTransaction,
};