const {
  createPickupAddress,
  createOrder,
  createProduct,
  createPackage,

  getProcessingOrders,
  getAllOrders,

  getOrderById,
  updateOrder,
  deleteProcessingOrders,

} = require("../models/orderModel");


// ======================================================
// CREATE ORDER
// ======================================================

const createOrderController = async (
  req,
  res
) => {

  try {

    // ==================================================
    // REQUEST BODY
    // ==================================================

    const body = req.body || {};

    const {
      user_id,

      // ----------------------------------------------
      // NEW FRONTEND PICKUP DATA
      // ----------------------------------------------

      pickup_address,
      pickup_pincode,
      pickup_city,

      // ----------------------------------------------
      // WAREHOUSE
      // ----------------------------------------------

      warehouse_id,

      // ----------------------------------------------
      // OPTIONAL OLD PICKUP ADDRESS ID
      // ----------------------------------------------

      pickup_address_id,

      // ----------------------------------------------
      // NESTED ORDER DATA
      // ----------------------------------------------

      orderData,

      // ----------------------------------------------
      // PRODUCTS
      // ----------------------------------------------

      products,

      // ----------------------------------------------
      // PACKAGES
      // ----------------------------------------------

      packages,
    } = body;


    // ==================================================
    // USER ID
    // ==================================================

    if (!user_id) {

      return res.status(400).json({

        success: false,

        message:
          "User ID is required",

      });

    }


    // ==================================================
    // NORMALIZE NESTED ORDER DATA
    // ==================================================

    const nestedOrderData =
      orderData &&
      typeof orderData === "object"
        ? orderData
        : {};


    // ==================================================
    // MERGE ORDER DATA
    // ==================================================
    // Frontend currently sends consignee details
    // inside orderData.
    //
    // We convert them into the structure expected
    // by orderModel.createOrder().

    const finalOrderData = {

      ...nestedOrderData,

      user_id:
        user_id,

      // ----------------------------------------------
      // PICKUP ADDRESS ID
      // ----------------------------------------------

      pickup_address_id:
        pickup_address_id ||
        null,

      // ----------------------------------------------
      // WAREHOUSE
      // ----------------------------------------------

      warehouse_id:
        warehouse_id ||
        nestedOrderData.warehouse_id ||
        null,

      // ----------------------------------------------
      // PICKUP DETAILS
      // ----------------------------------------------

      pickup_address:
        pickup_address ||
        nestedOrderData.pickup_address ||
        null,

      pickup_pincode:
        pickup_pincode ||
        nestedOrderData.pickup_pincode ||
        null,

      pickup_city:
        pickup_city ||
        nestedOrderData.pickup_city ||
        null,

      // ----------------------------------------------
      // CONSIGNEE
      // ----------------------------------------------

      consignee_name:
        nestedOrderData.consignee_name ||
        body.consignee_name ||
        null,

      mobile:
        nestedOrderData.mobile ||
        body.mobile ||
        null,

      alternate_mobile:
        nestedOrderData.alternate_mobile ||
        body.alternate_mobile ||
        null,

      email:
        nestedOrderData.email ||
        body.email ||
        null,

      gstin:
        nestedOrderData.gstin ||
        body.gstin ||
        null,

      company_name:
        nestedOrderData.company_name ||
        body.company_name ||
        null,

      floor_no:
        nestedOrderData.floor_no ||
        body.floor_no ||
        null,

      landmark:
        nestedOrderData.landmark ||
        body.landmark ||
        null,

      address_line1:
        nestedOrderData.address_line1 ||
        body.address_line1 ||
        null,

      address_line2:
        nestedOrderData.address_line2 ||
        body.address_line2 ||
        null,

      pincode:
        nestedOrderData.pincode ||
        body.pincode ||
        null,

      city:
        nestedOrderData.city ||
        body.city ||
        null,

      state:
        nestedOrderData.state ||
        body.state ||
        null,

      country:
        nestedOrderData.country ||
        body.country ||
        "India",

      payment_type:
        nestedOrderData.payment_type ||
        body.payment_type ||
        "Prepaid",

      risk_type:
        nestedOrderData.risk_type ||
        body.risk_type ||
        "Owner Risk",

    };


    // ==================================================
    // PICKUP ADDRESS VALIDATION
    // ==================================================

    const finalPickupAddress =
      String(
        finalOrderData.pickup_address ||
        ""
      ).trim();


    const finalPickupPincode =
      String(
        finalOrderData.pickup_pincode ||
        ""
      ).trim();


    const finalPickupCity =
      String(
        finalOrderData.pickup_city ||
        ""
      ).trim();


    // ==================================================
    // PICKUP ADDRESS ID
    // ==================================================
    //
    // If frontend already provides pickup_address_id,
    // keep it.
    //
    // Otherwise create pickup address automatically
    // from the selected warehouse/pickup details.
    //

    let finalPickupAddressId =
      finalOrderData.pickup_address_id;


    if (!finalPickupAddressId) {

      // ----------------------------------------------
      // PICKUP ADDRESS REQUIRED
      // ----------------------------------------------

      if (!finalPickupAddress) {

        return res.status(400).json({

          success: false,

          message:
            "Pickup address is required",

        });

      }


      // ----------------------------------------------
      // PICKUP PINCODE REQUIRED
      // ----------------------------------------------

      if (
        !/^\d{6}$/.test(
          finalPickupPincode
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Valid 6-digit pickup pincode is required",

        });

      }


      // ----------------------------------------------
      // CREATE PICKUP ADDRESS
      // ----------------------------------------------

      const pickupAddressResult =
        await new Promise(
          (
            resolve,
            reject
          ) => {

            createPickupAddress(

              Number(user_id),

              finalPickupAddress,

              finalPickupPincode,

              finalPickupCity,

              (
                error,
                result
              ) => {

                if (error) {

                  return reject(
                    error
                  );

                }

                resolve(
                  result
                );

              }

            );

          }
        );


      // ----------------------------------------------
      // GET INSERTED ID
      // ----------------------------------------------

      if (
        !pickupAddressResult ||
        !pickupAddressResult.insertId
      ) {

        throw new Error(
          "Unable to create pickup address"
        );

      }


      finalPickupAddressId =
        pickupAddressResult.insertId;

    }


    // ==================================================
    // FINAL ORDER DATA
    // ==================================================

    finalOrderData.pickup_address_id =
      Number(
        finalPickupAddressId
      );


    finalOrderData.user_id =
      Number(
        user_id
      );


    if (
      finalOrderData.warehouse_id
    ) {

      finalOrderData.warehouse_id =
        Number(
          finalOrderData.warehouse_id
        );

    }


    // ==================================================
    // REQUIRED CONSIGNEE VALIDATION
    // ==================================================

    if (
      !String(
        finalOrderData.consignee_name ||
        ""
      ).trim()
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Consignee name is required",

      });

    }


    // ==================================================
    // MOBILE VALIDATION
    // ==================================================

    if (
      !/^\d{10}$/.test(
        String(
          finalOrderData.mobile ||
          ""
        ).trim()
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Valid 10-digit mobile number is required",

      });

    }


    // ==================================================
    // DELIVERY PINCODE
    // ==================================================

    if (
      !/^\d{6}$/.test(
        String(
          finalOrderData.pincode ||
          ""
        ).trim()
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Valid 6-digit delivery pincode is required",

      });

    }


    // ==================================================
    // DELIVERY ADDRESS
    // ==================================================

    if (
      !String(
        finalOrderData.address_line1 ||
        ""
      ).trim()
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Delivery address is required",

      });

    }


    // ==================================================
    // CREATE ORDER
    // ==================================================

    const createdOrder =
      await new Promise(
        (
          resolve,
          reject
        ) => {

          createOrder(
            finalOrderData,
            (
              error,
              result
            ) => {

              if (error) {

                return reject(
                  error
                );

              }

              resolve(
                result
              );

            }
          );

        }
      );


    // ==================================================
    // ORDER CHECK
    // ==================================================

    if (
      !createdOrder ||
      !createdOrder.id
    ) {

      throw new Error(
        "Order could not be created"
      );

    }


    const internalOrderId =
      Number(
        createdOrder.id
      );


    // ==================================================
    // CREATE PRODUCTS
    // ==================================================

    if (
      Array.isArray(products) &&
      products.length > 0
    ) {

      for (
        const product
        of products
      ) {

        await new Promise(
          (
            resolve,
            reject
          ) => {

            createProduct(

              {

                order_id:
                  internalOrderId,

                product_name:
                  product.product_name,

                sku:
                  product.sku ||
                  null,

                price:
                  Number(
                    product.price
                  ) || 0,

                qty:
                  Number(
                    product.qty
                  ) || 1,

                tax:
                  Number(
                    product.tax
                  ) || 0,

              },

              (
                error,
                result
              ) => {

                if (error) {

                  return reject(
                    error
                  );

                }

                resolve(
                  result
                );

              }

            );

          }
        );

      }

    }


    // ==================================================
    // CREATE PACKAGES
    // ==================================================

    if (
      Array.isArray(packages) &&
      packages.length > 0
    ) {

      for (
        const packageData
        of packages
      ) {

        await new Promise(
          (
            resolve,
            reject
          ) => {

            createPackage(

              {

                order_id:
                  internalOrderId,

                length:
                  Number(
                    packageData.length
                  ) || 0,

                width:
                  Number(
                    packageData.width
                  ) || 0,

                height:
                  Number(
                    packageData.height
                  ) || 0,

                weight:
                  Number(
                    packageData.weight
                  ) || 0,

                package_count:
                  Number(
                    packageData.package_count ||
                    packageData.count
                  ) || 1,

              },

              (
                error,
                result
              ) => {

                if (error) {

                  return reject(
                    error
                  );

                }

                resolve(
                  result
                );

              }

            );

          }
        );

      }

    }


    // ==================================================
    // SUCCESS RESPONSE
    // ==================================================

    return res.status(201).json({

      success:
        true,

      id:
        createdOrder.id,

      order_id:
        createdOrder.order_id,

      pickup_address_id:
        finalPickupAddressId,

      warehouse_id:
        finalOrderData.warehouse_id ||
        null,

      message:
        "Order created successfully",

    });


  } catch (error) {

    console.log(
      "Create order error:",
      error
    );


    return res.status(500).json({

      success:
        false,

      message:
        error.message ||
        "Unable to create order",

    });

  }

};


// ======================================================
// GET PROCESSING ORDERS
// ======================================================

const getProcessingOrdersController =
  async (
    req,
    res
  ) => {

    try {

      const user_id =
        Number(
          req.query.user_id ||
          req.body?.user_id
        );


      if (
        !user_id
      ) {

        return res.status(400).json({

          success: false,

          message:
            "User ID is required",

        });

      }


      getProcessingOrders(
        user_id,
        (
          error,
          rows
        ) => {

          if (error) {

            console.log(
              "Get processing orders error:",
              error
            );

            return res.status(500).json({

              success: false,

              message:
                error.message ||
                "Unable to fetch processing orders",

            });

          }


          return res.status(200).json({

            success:
              true,

            orders:
              rows || [],

          });

        }
      );

    } catch (error) {

      return res.status(500).json({

        success: false,

        message:
          error.message ||
          "Unable to fetch processing orders",

      });

    }

  };


  // ======================================================
// GET ALL ORDERS
// ======================================================

const getAllOrdersController =
  async (
    req,
    res
  ) => {

    try {

      const user_id =
        Number(
          req.query.user_id ||
          req.body?.user_id
        );


      // ==================================================
      // USER ID
      // ==================================================

      if (!user_id) {

        return res.status(400).json({

          success: false,

          message:
            "User ID is required",

        });

      }


      // ==================================================
      // GET ALL ORDERS
      // ==================================================

      getAllOrders(

        user_id,

        (
          error,
          rows
        ) => {

          if (error) {

            console.log(
              "Get all orders error:",
              error
            );


            return res.status(500).json({

              success: false,

              message:
                error.message ||
                "Unable to fetch all orders",

            });

          }


          // ==================================================
          // SUCCESS RESPONSE
          // ==================================================

          return res.status(200).json({

            success: true,

            orders:
              rows || [],

          });

        }

      );

    } catch (error) {

      console.log(
        "Get all orders controller error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          error.message ||
          "Unable to fetch all orders",

      });

    }

  };

// ======================================================
// GET ORDER BY ID
// ======================================================

const getOrderByIdController =
  async (
    req,
    res
  ) => {

    try {

      const orderId =
        Number(
          req.params.id
        );

      const userId =
        Number(
          req.query.user_id ||
          req.body?.user_id
        );


      if (
        !orderId
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Order ID is required",

        });

      }


      if (
        !userId
      ) {

        return res.status(400).json({

          success: false,

          message:
            "User ID is required",

        });

      }


      const order =
        await getOrderById(
          orderId,
          userId
        );


      return res.status(200).json({

        success:
          true,

        order,

      });

    } catch (error) {

      console.log(
        "Get order error:",
        error
      );


      const statusCode =
        error.message ===
        "Order not found"
          ? 404
          : 500;


      return res.status(
        statusCode
      ).json({

        success:
          false,

        message:
          error.message ||
          "Unable to fetch order",

      });

    }

  };


// ======================================================
// UPDATE ORDER
// ======================================================

const updateOrderController =
  async (
    req,
    res
  ) => {

    try {

      const orderId =
        Number(
          req.params.id
        );


      const {
        user_id,
        warehouse_id,
        pickup_address_id,
        pickup_address,
        pickup_pincode,
        pickup_city,
        orderData,
        products,
        packages,
      } = req.body;


      const userId =
        Number(
          user_id
        );


      if (
        !orderId ||
        !userId
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Valid order ID and user ID are required",

        });

      }


      const nestedOrderData =
        orderData &&
        typeof orderData === "object"
          ? orderData
          : {};


      // ==================================================
      // CREATE PICKUP ADDRESS IF NEEDED
      // ==================================================

      let finalPickupAddressId =
        pickup_address_id ||
        nestedOrderData.pickup_address_id ||
        null;


      if (
        !finalPickupAddressId &&
        pickup_address
      ) {

        const pickupAddressResult =
          await new Promise(
            (
              resolve,
              reject
            ) => {

              createPickupAddress(

                userId,

                String(
                  pickup_address
                ).trim(),

                String(
                  pickup_pincode ||
                  ""
                ).trim(),

                String(
                  pickup_city ||
                  ""
                ).trim(),

                (
                  error,
                  result
                ) => {

                  if (error) {

                    return reject(
                      error
                    );

                  }

                  resolve(
                    result
                  );

                }

              );

            }
          );


        finalPickupAddressId =
          pickupAddressResult?.insertId ||
          null;

      }


      // ==================================================
      // FINAL ORDER DATA
      // ==================================================

      const finalOrderData = {

        ...nestedOrderData,

        user_id:
          userId,

        warehouse_id:
          warehouse_id ||
          nestedOrderData.warehouse_id ||
          null,

        pickup_address_id:
          finalPickupAddressId,

      };


      // ==================================================
      // UPDATE
      // ==================================================

      const result =
        await updateOrder(

          orderId,

          userId,

          finalOrderData,

          {
            pickup_address_id:
              finalPickupAddressId,

            pickup_address:
              pickup_address,

            pickup_pincode:
              pickup_pincode,

            pickup_city:
              pickup_city,

          },

          Array.isArray(
            products
          )
            ? products
            : [],

          Array.isArray(
            packages
          )
            ? packages
            : []

        );


      return res.status(200).json(
        result
      );


    } catch (error) {

      console.log(
        "Update order error:",
        error
      );


      return res.status(500).json({

        success:
          false,

        message:
          error.message ||
          "Unable to update order",

      });

    }

  };


// ======================================================
// DELETE PROCESSING ORDERS
// ======================================================

const deleteOrdersController =
  async (
    req,
    res
  ) => {

    try {

      const {
        user_id,
        order_ids,
      } = req.body;


      const userId =
        Number(
          user_id
        );


      if (
        !userId
      ) {

        return res.status(400).json({

          success: false,

          message:
            "User ID is required",

        });

      }


      if (
        !Array.isArray(
          order_ids
        ) ||
        order_ids.length === 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Please select at least one order",

        });

      }


      const cleanOrderIds =
        [
          ...new Set(

            order_ids

              .map(
                (id) =>
                  Number(id)
              )

              .filter(
                (id) =>
                  Number.isInteger(id) &&
                  id > 0
              )

          ),
        ];


      if (
        cleanOrderIds.length === 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid order selection",

        });

      }


      const result =
        await deleteProcessingOrders(

          userId,

          cleanOrderIds

        );


      return res.status(200).json(
        result
      );


    } catch (error) {

      console.log(
        "Delete orders error:",
        error
      );


      return res.status(500).json({

        success:
          false,

        message:
          error.message ||
          "Unable to delete orders",

      });

    }

  };


// ======================================================
// EXPORT
// ======================================================

module.exports = {

  createOrder:
    createOrderController,

  getProcessingOrders:
    getProcessingOrdersController,

  getAllOrders:
    getAllOrdersController,

  getOrderById:
    getOrderByIdController,

  updateOrder:
    updateOrderController,

  deleteOrders:
    deleteOrdersController,

};