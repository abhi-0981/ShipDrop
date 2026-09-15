const db = require("../config/db");

// ========================================
// CREATE WALLET IF USER DOESN'T HAVE ONE
// ========================================

const createWalletIfNotExists = (
  user_id,
  callback
) => {
  const query = `
    INSERT INTO wallets
    (user_id, balance)
    VALUES (?, 0.00)
    ON DUPLICATE KEY UPDATE user_id = user_id
  `;

  db.query(
    query,
    [user_id],
    callback
  );
};


// ========================================
// GET WALLET
// ========================================

const getWallet = (
  user_id,
  callback
) => {
  const query = `
    SELECT *
    FROM wallets
    WHERE user_id = ?
    LIMIT 1
  `;

  db.query(
    query,
    [user_id],
    callback
  );
};


// ========================================
// CREATE PENDING TRANSACTION
// ========================================

const createPendingTransaction = (
  transactionData,
  callback
) => {
  const query = `
    INSERT INTO wallet_transactions
    (
      user_id,
      type,
      amount,
      razorpay_order_id,
      status
    )
    VALUES (?, ?, ?, ?, 'PENDING')
  `;

  db.query(
    query,
    [
      transactionData.user_id,
      transactionData.type,
      transactionData.amount,
      transactionData.razorpay_order_id
    ],
    callback
  );
};


// ========================================
// FIND TRANSACTION BY RAZORPAY ORDER ID
// ========================================

const getTransactionByRazorpayOrderId = (
  razorpay_order_id,
  callback
) => {
  const query = `
    SELECT *
    FROM wallet_transactions
    WHERE razorpay_order_id = ?
    LIMIT 1
  `;

  db.query(
    query,
    [razorpay_order_id],
    callback
  );
};


// ========================================
// MARK TRANSACTION SUCCESS
// ========================================

const markTransactionSuccess = (
  transactionId,
  paymentId,
  signature,
  callback
) => {
  const query = `
    UPDATE wallet_transactions
    SET
      razorpay_payment_id = ?,
      razorpay_signature = ?,
      status = 'SUCCESS'
    WHERE id = ?
      AND status = 'PENDING'
  `;

  db.query(
    query,
    [
      paymentId,
      signature,
      transactionId
    ],
    callback
  );
};


// ========================================
// ADD MONEY TO WALLET
// WITH OPENING / CLOSING BALANCE
// ========================================

const addMoneyToWallet = (
  user_id,
  amount,
  transactionId,
  callback
) => {
  db.getConnection((connectionError, connection) => {
    if (connectionError) {
      return callback(connectionError);
    }

    connection.beginTransaction((transactionError) => {
      if (transactionError) {
        connection.release();
        return callback(transactionError);
      }

      connection.query(
        `
          SELECT balance
          FROM wallets
          WHERE user_id = ?
          LIMIT 1
          FOR UPDATE
        `,
        [user_id],
        (walletError, walletRows) => {
          if (walletError) {
            return connection.rollback(() => {
              connection.release();
              callback(walletError);
            });
          }

          if (!walletRows || walletRows.length === 0) {
            return connection.rollback(() => {
              connection.release();
              callback(new Error("Wallet not found"));
            });
          }

          const openingBalance =
            Number(walletRows[0].balance) || 0;

          const rechargeAmount =
            Number(amount) || 0;

          const closingBalance =
            openingBalance + rechargeAmount;

          connection.query(
            `
              UPDATE wallets
              SET
                balance = ?,
                updated_at = CURRENT_TIMESTAMP
              WHERE user_id = ?
            `,
            [
              closingBalance,
              user_id
            ],
            (updateError, updateResult) => {
              if (updateError) {
                return connection.rollback(() => {
                  connection.release();
                  callback(updateError);
                });
              }

              if (updateResult.affectedRows !== 1) {
                return connection.rollback(() => {
                  connection.release();
                  callback(
                    new Error("Unable to update wallet balance")
                  );
                });
              }

              connection.query(
                `
                  UPDATE wallet_transactions
                  SET
                    opening_balance = ?,
                    closing_balance = ?,
                    description = 'Wallet Recharged'
                  WHERE id = ?
                    AND user_id = ?
                    AND type = 'RECHARGE'
                    AND status = 'SUCCESS'
                `,
                [
                  openingBalance,
                  closingBalance,
                  transactionId,
                  user_id
                ],
                (transactionError, transactionResult) => {
                  if (transactionError) {
                    return connection.rollback(() => {
                      connection.release();
                      callback(transactionError);
                    });
                  }

                  if (transactionResult.affectedRows !== 1) {
                    return connection.rollback(() => {
                      connection.release();
                      callback(
                        new Error(
                          "Unable to update wallet transaction history"
                        )
                      );
                    });
                  }

                  connection.commit((commitError) => {
                    if (commitError) {
                      return connection.rollback(() => {
                        connection.release();
                        callback(commitError);
                      });
                    }

                    connection.release();

                    callback(null, {
                      opening_balance: openingBalance,
                      closing_balance: closingBalance
                    });
                  });
                }
              );
            }
          );
        }
      );
    });
  });
};


// ========================================
// FIND TRANSACTION BY PAYMENT ID
// ========================================

const getTransactionByPaymentId = (
  paymentId,
  callback
) => {
  const query = `
    SELECT *
    FROM wallet_transactions
    WHERE razorpay_payment_id = ?
    LIMIT 1
  `;

  db.query(
    query,
    [paymentId],
    callback
  );
};


// ========================================
// GET WALLET TRANSACTION HISTORY
// ========================================

const getWalletTransactions = (
  user_id,
  callback
) => {
  const query = `
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
  `;

  db.query(
    query,
    [user_id],
    callback
  );
};


module.exports = {
  createWalletIfNotExists,
  getWallet,
  createPendingTransaction,
  getTransactionByRazorpayOrderId,
  markTransactionSuccess,
  addMoneyToWallet,
  getTransactionByPaymentId,
  getWalletTransactions
};