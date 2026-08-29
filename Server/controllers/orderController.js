const orderModel = require("../models/orderModel");

// ========================================
// CREATE ORDER
// ========================================

const createOrder = (req, res) => {
  try {
    const {
      user_id,

      pickup_address,
      pickup_pincode,
      pickup_city,

      products,
      packages,

      // Support both formats
      orderData = {},

      consignee_name,
      mobile,
      alternate_mobile,
      email,
      gstin,
      company_name,
      floor_no,
      landmark,
      address_line1,
      address_line2,
      pincode,
      city,
      state,
      country,
      payment_type,
      risk_type,
    } = req.body;

    // ======================================
    // MERGE ORDER DATA
    // ======================================

    const finalOrderData = {
      ...orderData,

      consignee_name: consignee_name ?? orderData.consignee_name,

      mobile: mobile ?? orderData.mobile,

      alternate_mobile: alternate_mobile ?? orderData.alternate_mobile,

      email: email ?? orderData.email,

      gstin: gstin ?? orderData.gstin,

      company_name: company_name ?? orderData.company_name,

      floor_no: floor_no ?? orderData.floor_no,

      landmark: landmark ?? orderData.landmark,

      address_line1: address_line1 ?? orderData.address_line1,

      address_line2: address_line2 ?? orderData.address_line2,

      pincode: pincode ?? orderData.pincode,

      city: city ?? orderData.city,

      state: state ?? orderData.state,

      country: country ?? orderData.country ?? "India",

      payment_type: payment_type ?? orderData.payment_type ?? "Prepaid",

      risk_type: risk_type ?? orderData.risk_type ?? "Owner Risk",
    };

    // ======================================
    // BASIC VALIDATION
    // ======================================

    if (!user_id) {
      return res.status(400).json({
        success: false,

        message: "User ID is required",
      });
    }

    if (!pickup_address || !String(pickup_address).trim()) {
      return res.status(400).json({
        success: false,

        message: "Pickup address is required",
      });
    }

    if (!pickup_pincode || !/^\d{6}$/.test(String(pickup_pincode).trim())) {
      return res.status(400).json({
        success: false,

        message: "Valid 6-digit pickup pincode is required",
      });
    }

    // ======================================
    // PICKUP CITY
    // ======================================

    if (!pickup_city || !String(pickup_city).trim()) {
      return res.status(400).json({
        success: false,

        message: "Pickup city is required",
      });
    }

    // ======================================
    // CONSIGNEE
    // ======================================

    if (
      !finalOrderData.consignee_name ||
      !String(finalOrderData.consignee_name).trim()
    ) {
      return res.status(400).json({
        success: false,

        message: "Consignee name is required",
      });
    }

    // ======================================
    // MOBILE
    // ======================================

    if (!/^\d{10}$/.test(String(finalOrderData.mobile || "").trim())) {
      return res.status(400).json({
        success: false,

        message: "Valid 10-digit mobile number is required",
      });
    }

    // ======================================
    // DELIVERY ADDRESS
    // ======================================

    if (
      !finalOrderData.address_line1 ||
      !String(finalOrderData.address_line1).trim()
    ) {
      return res.status(400).json({
        success: false,

        message: "Delivery address is required",
      });
    }

    // ======================================
    // DELIVERY PINCODE
    // ======================================

    if (!/^\d{6}$/.test(String(finalOrderData.pincode || "").trim())) {
      return res.status(400).json({
        success: false,

        message: "Valid 6-digit delivery pincode is required",
      });
    }

    // ======================================
    // DELIVERY CITY / STATE
    // ======================================

    if (!finalOrderData.city || !finalOrderData.state) {
      return res.status(400).json({
        success: false,

        message: "Valid delivery pincode is required",
      });
    }

    // ======================================
    // PRODUCTS
    // ======================================

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,

        message: "At least one product is required",
      });
    }

    // ======================================
    // PACKAGES
    // ======================================

    if (!Array.isArray(packages) || packages.length === 0) {
      return res.status(400).json({
        success: false,

        message: "At least one package is required",
      });
    }

    // ======================================
    // PRODUCT VALIDATION
    // ======================================

    for (const product of products) {
      if (!product.product_name || !String(product.product_name).trim()) {
        return res.status(400).json({
          success: false,

          message: "Product title is required",
        });
      }

      if (
        !Number.isFinite(Number(product.price)) ||
        Number(product.price) <= 0
      ) {
        return res.status(400).json({
          success: false,

          message: "Product price must be greater than 0",
        });
      }
    }

    // ======================================
    // PACKAGE VALIDATION
    // ======================================

    for (const item of packages) {
      if (
        !Number.isFinite(Number(item.length)) ||
        Number(item.length) <= 0 ||
        !Number.isFinite(Number(item.width)) ||
        Number(item.width) <= 0 ||
        !Number.isFinite(Number(item.height)) ||
        Number(item.height) <= 0 ||
        !Number.isFinite(Number(item.weight)) ||
        Number(item.weight) <= 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Valid package length, width, height and weight are required",
        });
      }
    }

    // ======================================
    // CREATE PICKUP ADDRESS
    // ======================================

    orderModel.createPickupAddress(
      user_id,

      String(pickup_address).trim(),

      String(pickup_pincode).trim(),

      String(pickup_city).trim(),

      (err, pickupResult) => {
        if (err) {
          console.log("Pickup address error:", err);

          return res.status(500).json({
            success: false,

            message: err.message,
          });
        }

        const pickup_address_id = pickupResult.insertId;

        // ==================================
        // CREATE ORDER
        // ==================================

        orderModel.createOrder(
          {
            ...finalOrderData,

            user_id,

            pickup_address_id,
          },

          (err, orderResult) => {
            if (err) {
              console.log("Create order error:", err);

              return res.status(500).json({
                success: false,

                message: err.message,
              });
            }

            const order_id = orderResult.insertId;

            // ==================================
            // PRODUCTS
            // ==================================

            products.forEach((product) => {
              orderModel.createProduct(
                {
                  ...product,

                  order_id,
                },

                (productError) => {
                  if (productError) {
                    console.log("Product insert error:", productError);
                  }
                },
              );
            });

            // ==================================
            // PACKAGES
            // ==================================

            packages.forEach((item) => {
              orderModel.createPackage(
                {
                  ...item,

                  order_id,
                },

                (packageError) => {
                  if (packageError) {
                    console.log("Package insert error:", packageError);
                  }
                },
              );
            });

            // ==================================
            // RESPONSE
            // ==================================

            return res.status(201).json({
              success: true,

              message: "Order saved successfully",

              order_id,

              status: "PROCESSING",
            });
          },
        );
      },
    );
  } catch (error) {
    console.log("Create order controller error:", error);

    return res.status(500).json({
      success: false,

      message: error.message || "Unable to create order",
    });
  }
};

// ========================================
// GET PROCESSING ORDERS
// ========================================

const getProcessingOrders = (req, res) => {
  const user_id = req.query.user_id;

  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: "User ID is required",
    });
  }

  orderModel.getProcessingOrders(
    user_id,
    (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      return res.status(200).json({
        success: true,
        orders: result,
      });
    }
  );
};

// ========================================
// GET SINGLE PROCESSING ORDER
// ========================================

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.query.user_id;

    if (!id || !Number.isInteger(Number(id))) {
      return res.status(400).json({
        success: false,

        message: "Valid order ID is required",
      });
    }

    if (!user_id) {
  return res.status(400).json({
    success: false,
    message: "User ID is required",
  });
}

   const order = await orderModel.getOrderById(
  Number(id),
  user_id
);

    if (!order) {
      return res.status(404).json({
        success: false,

        message: "Processing order not found",
      });
    }

    return res.status(200).json({
      success: true,

      order,
    });
  } catch (error) {
    console.log("Get order by ID error:", error);

    return res.status(500).json({
      success: false,

      message: error.message || "Unable to fetch order",
    });
  }
};

// ========================================
// UPDATE PROCESSING ORDER
// ========================================

const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      user_id,

      pickup_address,
      pickup_pincode,
      pickup_city,

      orderData,

      products,
      packages,
    } = req.body;

    // ======================================
    // ORDER ID
    // ======================================

    const orderId = Number(id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,

        message: "Valid order ID is required",
      });
    }

    // ======================================
    // USER
    // ======================================

    if (!user_id) {
      return res.status(400).json({
        success: false,

        message: "User ID is required",
      });
    }

    // ======================================
    // PICKUP
    // ======================================

    if (!pickup_address || !String(pickup_address).trim()) {
      return res.status(400).json({
        success: false,

        message: "Pickup address is required",
      });
    }

    if (!pickup_pincode || !/^\d{6}$/.test(String(pickup_pincode).trim())) {
      return res.status(400).json({
        success: false,

        message: "Valid 6-digit pickup pincode is required",
      });
    }

    // ======================================
    // ORDER DATA
    // ======================================

    if (!orderData) {
      return res.status(400).json({
        success: false,

        message: "Order data is required",
      });
    }

    // ======================================
    // PRODUCTS
    // ======================================

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,

        message: "At least one product is required",
      });
    }

    // ======================================
    // PACKAGES
    // ======================================

    if (!Array.isArray(packages) || packages.length === 0) {
      return res.status(400).json({
        success: false,

        message: "At least one package is required",
      });
    }

    // ======================================
    // UPDATE
    // ======================================

    await orderModel.updateOrder(
      orderId,

      user_id,

      orderData,

      {
        pickup_address,

        pickup_pincode,

        pickup_city,
      },

      products,

      packages,
    );

    return res.status(200).json({
      success: true,

      message: `Order #${orderId} updated successfully`,

      order_id: orderId,
    });
  } catch (error) {
    console.log("Update order error:", error);

    return res.status(500).json({
      success: false,

      message: error.message || "Unable to update order",
    });
  }
};

// ========================================
// DELETE PROCESSING ORDERS
// ========================================

const deleteOrders = async (req, res) => {
  try {
    const { user_id, order_ids } = req.body;

    // ======================================
    // USER ID
    // ======================================

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // ======================================
    // ORDER IDS
    // ======================================

    if (!Array.isArray(order_ids) || order_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one order",
      });
    }

    // ======================================
    // CLEAN IDS
    // ======================================

    const cleanOrderIds = [
      ...new Set(
        order_ids
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    ];

    if (cleanOrderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order IDs",
      });
    }

    // ======================================
    // DELETE
    // ======================================

    const deletedCount = await orderModel.deleteProcessingOrders(
      user_id,
      cleanOrderIds,
    );

    // ======================================
    // SUCCESS
    // ======================================

    return res.status(200).json({
      success: true,

      message: "Orders deleted successfully",

      deleted_count: deletedCount,
    });
  } catch (error) {
    console.log("Delete orders controller error:", error);

    return res.status(500).json({
      success: false,

      message: error.message || "Unable to delete orders",
    });
  }
};

// ========================================
// EXPORT
// ========================================

module.exports = {
  createOrder,
  getProcessingOrders,
  getOrderById,
  updateOrder,
  deleteOrders,
};
