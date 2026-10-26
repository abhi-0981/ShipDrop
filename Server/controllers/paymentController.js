const Razorpay = require("razorpay");
const crypto = require("crypto");

const paymentModel = require("../models/paymentModel");


// ========================================
// RAZORPAY INSTANCE
// ========================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// ========================================
// GET WALLET BALANCE
// ========================================

const getWalletBalance = (req, res) => {
  const user_id = req.user?.id || req.query.user_id;

  if (!user_id) {
    return res.status(400).json({
      message: "User ID is required",
    });
  }

  // Optimize: Check if wallet exists first with a lightweight SELECT
  paymentModel.getWallet(user_id, (err, result) => {
    if (err) {
      return res.status(500).json({
        message: err.message,
      });
    }

    if (result && result.length > 0) {
      return res.status(200).json({
        balance: result[0].balance,
      });
    }

    // Only create wallet if user does not have one yet
    paymentModel.createWalletIfNotExists(user_id, (createErr) => {
      if (createErr) {
        return res.status(500).json({
          message: createErr.message,
        });
      }

      return res.status(200).json({
        balance: 0,
      });
    });
  });
};


// ========================================
// CREATE RAZORPAY ORDER
// ========================================

const createPaymentOrder = async (req, res) => {
  try {
    const user_id = req.user?.id || req.body.user_id;
    const {
      amount,
    } = req.body;

    if (!user_id) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const rechargeAmount = Number(amount);

    if (
      !rechargeAmount ||
      rechargeAmount <= 0
    ) {
      return res.status(400).json({
        message: "Please enter a valid amount",
      });
    }

    // Razorpay amount paise me leta hai
    // ₹500 = 50000 paise

    const razorpayOrder =
      await razorpay.orders.create({
        amount: Math.round(
          rechargeAmount * 100
        ),

        currency: "INR",

        receipt:
          `wallet_${user_id}_${Date.now()}`,

        notes: {
          user_id: String(user_id),
          purpose: "Wallet Recharge",
        },
      });


    // Wallet ensure karo

    paymentModel.createWalletIfNotExists(
      user_id,
      (walletError) => {
        if (walletError) {
          return res.status(500).json({
            message: walletError.message,
          });
        }


        // Pending transaction save karo

        paymentModel.createPendingTransaction(
          {
            user_id: user_id,

            type: "RECHARGE",

            amount: rechargeAmount,

            razorpay_order_id:
              razorpayOrder.id,
          },

          (err) => {
            if (err) {
              return res.status(500).json({
                message: err.message,
              });
            }

            return res.status(201).json({
              message:
                "Payment order created",

              order_id:
                razorpayOrder.id,

              amount:
                razorpayOrder.amount,

              currency:
                razorpayOrder.currency,

              key_id:
                process.env.RAZORPAY_KEY_ID,
            });
          }
        );
      }
    );

  } catch (error) {
    console.log(
      "Razorpay order error:",
      error
    );

    return res.status(500).json({
      message:
        error.error?.description ||
        error.message ||
        "Unable to create payment order",
    });
  }
};


// ========================================
// VERIFY PAYMENT
// ========================================

const verifyPayment = (req, res) => {
  const user_id = req.user?.id || req.body.user_id;
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;


  if (
    !user_id ||
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature
  ) {
    return res.status(400).json({
      message:
        "Payment details are incomplete",
    });
  }


  // Pehle database me transaction check karo

  paymentModel.getTransactionByRazorpayOrderId(
    razorpay_order_id,

    (err, transactions) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }


      if (transactions.length === 0) {
        return res.status(404).json({
          message:
            "Payment transaction not found",
        });
      }


      const transaction =
        transactions[0];


      // Check karo ki payment isi user ka hai

      if (
        Number(transaction.user_id) !==
        Number(user_id)
      ) {
        return res.status(403).json({
          message:
            "Invalid payment transaction",
        });
      }


      // Agar already success hai
      // to dobara wallet me amount nahi add karna

      if (
        transaction.status ===
        "SUCCESS"
      ) {
        return res.status(200).json({
          message:
            "Payment already verified",
        });
      }


      // ========================================
      // RAZORPAY SIGNATURE VERIFY
      // ========================================

      const generatedSignature =
        crypto
          .createHmac(
            "sha256",
            process.env.RAZORPAY_KEY_SECRET
          )
          .update(
            razorpay_order_id +
              "|" +
              razorpay_payment_id
          )
          .digest("hex");


      const receivedBuffer =
        Buffer.from(
          razorpay_signature,
          "utf8"
        );

      const generatedBuffer =
        Buffer.from(
          generatedSignature,
          "utf8"
        );


      if (
        receivedBuffer.length !==
        generatedBuffer.length
      ) {
        return res.status(400).json({
          message:
            "Payment verification failed",
        });
      }


      const isValid =
        crypto.timingSafeEqual(
          receivedBuffer,
          generatedBuffer
        );


      if (!isValid) {
        return res.status(400).json({
          message:
            "Payment verification failed",
        });
      }


      // ========================================
      // PAYMENT SUCCESS
      // ========================================

      paymentModel.markTransactionSuccess(
        transaction.id,

        razorpay_payment_id,

        razorpay_signature,

        (updateError) => {
          if (updateError) {
            return res.status(500).json({
              message:
                updateError.message,
            });
          }


          // Wallet me amount add karo

          paymentModel.addMoneyToWallet(
            user_id,

            transaction.amount,

            transaction.id,

            (walletError) => {
              if (walletError) {
                return res.status(500).json({
                  message:
                    walletError.message,
                });
              }


              // Updated balance nikalo

              paymentModel.getWallet(
                user_id,

                (balanceError, wallet) => {
                  if (balanceError) {
                    return res.status(500).json({
                      message:
                        balanceError.message,
                    });
                  }


                  // Automatically trigger notification for the recharge
                  try {
                    const rechargeAmt = Number(transaction.amount || 0).toFixed(2);
                    db.query(
                      `INSERT INTO notifications (user_id, type, title, message, reference_id, reference_url, message_count, is_read, created_at)
                       VALUES (?, 'WALLET', ?, ?, ?, '/wallet', 1, 0, NOW())`,
                      [
                        user_id,
                        `Wallet Credited: ₹${rechargeAmt}`,
                        `₹${rechargeAmt} has been successfully credited to your wallet.`,
                        `WALLET_TX_${transaction.id}`,
                      ]
                    );
                    if (Number(wallet[0]?.balance || 0) >= 200) {
                      db.query(
                        `DELETE FROM notifications WHERE user_id = ? AND type = 'WALLET' AND reference_id = 'LOW_WALLET_BALANCE'`,
                        [user_id]
                      );
                    }
                  } catch (notifErr) {
                    console.warn("Could not insert recharge notification:", notifErr.message);
                  }

                  return res.status(200).json({
                    message:
                      "Wallet recharged successfully",

                    balance:
                      wallet[0].balance,
                  });
                }
              );
            }
          );
        }
      );
    }
  );
};


// ========================================
// GET WALLET HISTORY
// ========================================

const getWalletHistory = (req, res) => {
  const user_id = req.user?.id || req.query.user_id;

  if (!user_id) {
    return res.status(400).json({
      message: "User ID is required",
    });
  }

  paymentModel.getWalletTransactions(
    user_id,
    (err, transactions) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      return res.status(200).json({
        transactions,
      });
    }
  );
};



// ========================================
// GET COD REMITTANCE HISTORY
// ========================================

const getCODRemittanceHistory = (req, res) => {
  const user_id = req.user?.id || req.query.user_id;

  if (!user_id) {
    return res.status(400).json({
      message: "User ID is required",
    });
  }

  // Pehle delivered COD orders ke liye
  // missing remittance records create karo

  paymentModel.createCODRemittancesForDeliveredOrders(
    user_id,
    (createError) => {
      if (createError) {
        return res.status(500).json({
          message: createError.message,
        });
      }

      // Ab remittance history fetch karo

      paymentModel.getCODRemittances(
        user_id,
        (err, remittances) => {
          if (err) {
            return res.status(500).json({
              message: err.message,
            });
          }

          return res.status(200).json({
            remittances,
          });
        }
      );
    }
  );
};


// ========================================
// EXPORT
// ========================================

module.exports = {
  getWalletBalance,
  createPaymentOrder,
  verifyPayment,
  getWalletHistory,
  getCODRemittanceHistory,
};