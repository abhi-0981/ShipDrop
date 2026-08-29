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
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({
      message: "User ID is required",
    });
  }

  paymentModel.createWalletIfNotExists(
    user_id,
    (err) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      paymentModel.getWallet(
        user_id,
        (err, result) => {
          if (err) {
            return res.status(500).json({
              message: err.message,
            });
          }

          if (result.length === 0) {
            return res.status(404).json({
              message: "Wallet not found",
            });
          }

          return res.status(200).json({
            balance: result[0].balance,
          });
        }
      );
    }
  );
};


// ========================================
// CREATE RAZORPAY ORDER
// ========================================

const createPaymentOrder = async (req, res) => {
  try {
    const {
      user_id,
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
  const {
    user_id,
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
// EXPORT
// ========================================

module.exports = {
  getWalletBalance,
  createPaymentOrder,
  verifyPayment,
};