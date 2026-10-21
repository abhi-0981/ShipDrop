const {
  createOfflineOrder,
  getOfflineOrders,
  deleteOfflineOrder,
} = require("../models/offlineOrderModel");

// ======================================================
// CREATE OFFLINE ORDER CONTROLLER
// ======================================================
const createOfflineOrderController = async (req, res) => {
  try {
    const userId = Number(req.user?.id || req.body?.user_id);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User session expired. Please log in again.",
      });
    }

    const {
      party_identity_id,
      carrier,
      consignment_no,
      consignee_name,
      mobile,
      address,
      pincode,
      city,
      state,
      package_type,
      amount,
      shipping_mode,
      product_name,
      shipping_charge,
      payment_mode,
      length,
      width,
      height,
      weight,
    } = req.body;

    // Validation
    const cleanCarrier = String(carrier || "").trim();
    if (!cleanCarrier || cleanCarrier.toLowerCase() === "delivery") {
      return res.status(400).json({
        success: false,
        message: "Please select a valid manual carrier (Delivery is not allowed for offline orders)",
      });
    }

    const cleanConsignmentNo = String(consignment_no || "").trim();
    if (!cleanConsignmentNo) {
      return res.status(400).json({
        success: false,
        message: "Consignment No is required",
      });
    }

    const cleanName = String(consignee_name || "").trim();
    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Customer/Consignee Name is required",
      });
    }

    const cleanMobile = String(mobile || "").trim();
    if (!/^\d{10}$/.test(cleanMobile)) {
      return res.status(400).json({
        success: false,
        message: "Valid 10-digit mobile number is required",
      });
    }

    const cleanPincode = String(pincode || "").trim();
    if (!/^\d{6}$/.test(cleanPincode)) {
      return res.status(400).json({
        success: false,
        message: "Valid 6-digit pincode is required",
      });
    }

    const cleanCity = String(city || "").trim();
    const cleanState = String(state || "").trim();
    if (!cleanCity || !cleanState) {
      return res.status(400).json({
        success: false,
        message: "City and State are required (auto-filled from pincode)",
      });
    }

    const cleanPackageType = String(package_type || "Box").trim();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid non-negative Amount (Including GST) is required",
      });
    }

    const parsedShippingCharge = Number(shipping_charge);
    if (!Number.isFinite(parsedShippingCharge) || parsedShippingCharge < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid non-negative Shipping Charge is required",
      });
    }

    const parsedWeight = Number(weight);
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      return res.status(400).json({
        success: false,
        message: "Weight must be greater than 0 kg",
      });
    }

    const cleanPaymentMode =
      String(payment_mode || "Prepaid").trim().toUpperCase() === "COD"
        ? "COD"
        : "Prepaid";

    const cleanShippingMode = String(shipping_mode || "Surface").trim();

    const orderData = {
      user_id: userId,
      party_identity_id: party_identity_id ? Number(party_identity_id) : null,
      carrier: cleanCarrier,
      consignment_no: cleanConsignmentNo,
      consignee_name: cleanName,
      mobile: cleanMobile,
      address: address ? String(address).trim() : null,
      pincode: cleanPincode,
      city: cleanCity,
      state: cleanState,
      package_type: cleanPackageType,
      amount: parsedAmount,
      shipping_mode: cleanShippingMode,
      product_name: product_name ? String(product_name).trim() : null,
      shipping_charge: parsedShippingCharge,
      payment_mode: cleanPaymentMode,
      length: Number(length) || 0,
      width: Number(width) || 0,
      height: Number(height) || 0,
      weight: parsedWeight,
    };

    createOfflineOrder(orderData, (error, created) => {
      if (error) {
        console.error("Create offline order error:", error);
        return res.status(500).json({
          success: false,
          message: error.message || "Failed to create offline order",
        });
      }

      return res.status(201).json({
        success: true,
        message: "Offline order created successfully",
        order: created,
      });
    });
  } catch (err) {
    console.error("createOfflineOrderController unexpected error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
};

// ======================================================
// GET OFFLINE ORDERS CONTROLLER
// ======================================================
const getOfflineOrdersController = async (req, res) => {
  try {
    const userId = Number(req.user?.id || req.query?.user_id);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User session expired",
      });
    }

    const {
      page = 1,
      limit = 50,
      search = "",
      party_identity_id,
      carrier,
      payment_mode,
    } = req.query;

    getOfflineOrders(
      userId,
      {
        page,
        limit,
        search,
        party_identity_id,
        carrier,
        payment_mode,
      },
      (error, result) => {
        if (error) {
          console.error("getOfflineOrders error:", error);
          return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch offline orders",
          });
        }

        return res.status(200).json({
          success: true,
          orders: result.orders,
          pagination: result.pagination,
        });
      }
    );
  } catch (err) {
    console.error("getOfflineOrdersController unexpected error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
};

// ======================================================
// DELETE OFFLINE ORDER CONTROLLER
// ======================================================
const deleteOfflineOrderController = async (req, res) => {
  try {
    const userId = Number(req.user?.id || req.body?.user_id);
    const orderId = Number(req.params.id);

    if (!userId || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Valid Order ID and User are required",
      });
    }

    deleteOfflineOrder(orderId, userId, (error, deleted) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: error.message || "Failed to delete offline order",
        });
      }

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Offline order not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Offline order deleted successfully",
      });
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
};

module.exports = {
  createOfflineOrderController,
  getOfflineOrdersController,
  deleteOfflineOrderController,
};
