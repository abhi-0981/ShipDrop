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
// ========================================

const addMoneyToWallet = (
  user_id,
  amount,
  callback
) => {
  const query = `
    UPDATE wallets
    SET balance = balance + ?
    WHERE user_id = ?
  `;

  db.query(
    query,
    [
      amount,
      user_id
    ],
    callback
  );
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


module.exports = {
  createWalletIfNotExists,
  getWallet,
  createPendingTransaction,
  getTransactionByRazorpayOrderId,
  markTransactionSuccess,
  addMoneyToWallet,
  getTransactionByPaymentId
};