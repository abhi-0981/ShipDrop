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
  searchPreviousCustomers,
  searchOrderForTracking,
  getOrderStatusCounts,
  getDashboardSummary,
  clearOrderStatusCountsCache,
} = require("../models/orderModel");

const db = require("../config/db");

const {
  attachTrackingToOrders,
  getTrackingForWaybills,
  orderStatusMap,
} = require("../services/delhiveryTrackingService");

// ======================================================
// ACTIVE TRACKING AUTO-SYNC HELPERS
// ======================================================

const isOrderActive = (order) => {
  const awb = String(order?.awb || "").trim();
  if (!awb) return false;
  const status = String(order?.status || "").toUpperCase().trim();
  const trackingStatus = String(order?.tracking_status || "").toUpperCase().trim();
  const isTerminal =
    status === "DELIVERED" ||
    status === "CANCELLED" ||
    status === "CANCELED" ||
    status === "RTO DELIVERED" ||
    status === "LOST" ||
    trackingStatus === "DELIVERED" ||
    trackingStatus === "CANCELLED" ||
    trackingStatus === "CANCELED" ||
    trackingStatus === "RTO DELIVERED" ||
    trackingStatus === "LOST";
  return !isTerminal;
};

const isOrderTrackingStale = (order, staleMinutes = 2) => {
  if (!isOrderActive(order)) return false;
  if (!order.tracking_updated_at) return true;
  const lastMs = new Date(order.tracking_updated_at).getTime();
  if (isNaN(lastMs)) return true;
  return Date.now() - lastMs > staleMinutes * 60 * 1000;
};

// Throttled background sync per user: at most once every 45s
const userLastSyncMap = new Map();

const triggerBackgroundActiveOrdersSync = (userId) => {
  const numericUserId = Number(userId);
  if (!numericUserId) return;

  const lastSync = userLastSyncMap.get(numericUserId) || 0;
  if (Date.now() - lastSync < 45 * 1000) {
    return;
  }
  userLastSyncMap.set(numericUserId, Date.now());

  if (userLastSyncMap.size > 500) {
    const cutoff = Date.now() - 5 * 60 * 1000;
    for (const [uid, time] of userLastSyncMap.entries()) {
      if (time < cutoff) userLastSyncMap.delete(uid);
    }
  }

  setImmediate(async () => {
    try {
      const [rows] = await db.promise().query(
        `
        SELECT awb FROM orders
        WHERE user_id = ?
          AND awb IS NOT NULL
          AND TRIM(awb) <> ''
          AND (carrier IS NULL OR carrier = 'Delivery')
          AND UPPER(TRIM(COALESCE(status, ''))) NOT IN ('DELIVERED', 'CANCELLED', 'CANCELED', 'RTO DELIVERED')
          AND UPPER(TRIM(COALESCE(tracking_status, ''))) NOT IN ('DELIVERED', 'CANCELLED', 'CANCELED', 'RTO DELIVERED')
          AND (tracking_updated_at IS NULL OR tracking_updated_at < NOW() - INTERVAL 2 MINUTE)
        ORDER BY COALESCE(tracking_updated_at, '2000-01-01') ASC
        LIMIT 30
      `,
        [numericUserId]
      );

      if (!rows || rows.length === 0) return;

      const waybills = [
        ...new Set(
          rows.map((r) => String(r.awb || "").trim()).filter(Boolean)
        ),
      ];

      if (waybills.length > 0) {
        await getTrackingForWaybills(waybills);
        clearOrderStatusCountsCache(numericUserId);
      }
    } catch (err) {
      console.warn("Background active orders sync notice:", err?.message || err);
    }
  });
};

// ======================================================
// CREATE ORDER
// ======================================================

const createOrderController = async (req, res) => {
  try {
    // ==================================================
    // REQUEST BODY
    // ==================================================

    const body = req.body || {};
    const user_id = req.user?.id ? Number(req.user.id) : body.user_id;

    const {

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

        message: "User ID is required",
      });
    }

    // ==================================================
    // NORMALIZE NESTED ORDER DATA
    // ==================================================

    const nestedOrderData =
      orderData && typeof orderData === "object" ? orderData : {};

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

      user_id: user_id,

      // ----------------------------------------------
      // PICKUP ADDRESS ID
      // ----------------------------------------------

      pickup_address_id: pickup_address_id || null,

      // ----------------------------------------------
      // WAREHOUSE
      // ----------------------------------------------

      warehouse_id: warehouse_id || nestedOrderData.warehouse_id || null,

      // ----------------------------------------------
      // PICKUP DETAILS
      // ----------------------------------------------

      pickup_address: pickup_address || nestedOrderData.pickup_address || null,

      pickup_pincode: pickup_pincode || nestedOrderData.pickup_pincode || null,

      pickup_city: pickup_city || nestedOrderData.pickup_city || null,

      // ----------------------------------------------
      // CONSIGNEE
      // ----------------------------------------------

      consignee_name:
        nestedOrderData.consignee_name || body.consignee_name || null,

      mobile: nestedOrderData.mobile || body.mobile || null,

      alternate_mobile:
        nestedOrderData.alternate_mobile || body.alternate_mobile || null,

      email: nestedOrderData.email || body.email || null,

      gstin: nestedOrderData.gstin || body.gstin || null,

      company_name: nestedOrderData.company_name || body.company_name || null,

      floor_no: nestedOrderData.floor_no || body.floor_no || null,

      landmark: nestedOrderData.landmark || body.landmark || null,

      address_line1:
        nestedOrderData.address_line1 || body.address_line1 || null,

      address_line2:
        nestedOrderData.address_line2 || body.address_line2 || null,

      pincode: nestedOrderData.pincode || body.pincode || null,

      city: nestedOrderData.city || body.city || null,

      state: nestedOrderData.state || body.state || null,

      country: nestedOrderData.country || body.country || "India",

      payment_type:
        nestedOrderData.payment_type || body.payment_type || "Prepaid",

      risk_type: nestedOrderData.risk_type || body.risk_type || "Owner Risk",

      fragile_shipment: nestedOrderData.fragile_shipment === true ||
  nestedOrderData.fragile_shipment === 1,

dangerous_good: nestedOrderData.dangerous_good === true ||
  nestedOrderData.dangerous_good === 1,
    };

    // ==================================================
    // PARTY IDENTITY VALIDATION
    // ==================================================
    let validatedPartyIdentityId = null;
    const rawPartyIdentityId =
      body.party_identity_id !== undefined
        ? body.party_identity_id
        : nestedOrderData.party_identity_id !== undefined
        ? nestedOrderData.party_identity_id
        : null;

    if (rawPartyIdentityId) {
      const parsedPid = Number(rawPartyIdentityId);
      if (!Number.isInteger(parsedPid) || parsedPid <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid Party Identity ID is required",
        });
      }

      const [partyRows] = await db.promise().query(
        "SELECT id FROM party_identities WHERE id = ? AND user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL) LIMIT 1",
        [parsedPid, user_id]
      );

      if (!partyRows || partyRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Selected Party Identity does not belong to your account",
        });
      }

      validatedPartyIdentityId = parsedPid;
    }

    finalOrderData.party_identity_id = validatedPartyIdentityId;

    // ==================================================
    // WAREHOUSE OWNERSHIP VALIDATION
    // ==================================================
    if (finalOrderData.warehouse_id) {
      const [warehouseRows] = await db.promise().query(
        "SELECT id FROM warehouses WHERE id = ? AND user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL) LIMIT 1",
        [Number(finalOrderData.warehouse_id), user_id]
      );
      if (!warehouseRows || warehouseRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Selected warehouse does not belong to your account",
        });
      }
    }

    // ==================================================
    // CARRIER & MANUAL CARRIER FIELDS VALIDATION
    // ==================================================
    const ALLOWED_CARRIERS = [
      "Delivery",
      "MARK EXPRESS",
      "TIRUPATI COURIER",
      "DTDC",
      "TRACKON COURIER",
      "SELF",
    ];

    const rawCarrier = body.carrier || nestedOrderData.carrier || "Delivery";
    const selectedCarrier = String(rawCarrier).trim();

    if (!ALLOWED_CARRIERS.includes(selectedCarrier)) {
      return res.status(400).json({
        success: false,
        message: "Invalid carrier selected",
      });
    }

    finalOrderData.carrier = selectedCarrier;

    if (selectedCarrier !== "Delivery") {
      const rawConsignment =
        body.consignment_no !== undefined
          ? body.consignment_no
          : nestedOrderData.consignment_no;
      const consignmentNo = String(rawConsignment ?? "").trim();

      if (!consignmentNo) {
        return res.status(400).json({
          success: false,
          message: "Consignment No is required for manual carrier orders",
        });
      }

      const rawPackageType =
        body.package_type !== undefined
          ? body.package_type
          : nestedOrderData.package_type;
      const packageType = String(rawPackageType ?? "").trim();

      if (!packageType) {
        return res.status(400).json({
          success: false,
          message: "Package Type is required for manual carrier orders",
        });
      }

      const rawManualAmount =
        body.manual_amount_including_gst !== undefined
          ? body.manual_amount_including_gst
          : nestedOrderData.manual_amount_including_gst;
      const parsedAmount = Number(rawManualAmount);

      if (
        rawManualAmount === undefined ||
        rawManualAmount === null ||
        rawManualAmount === "" ||
        !Number.isFinite(parsedAmount) ||
        parsedAmount < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A valid non-negative Amount (Including GST) is required for manual carrier orders",
        });
      }

      const rawShippingMode =
        body.shipping_mode !== undefined
          ? body.shipping_mode
          : nestedOrderData.shipping_mode;
      const shippingMode = String(rawShippingMode ?? "Surface").trim();

      const rawPaymentType =
        body.payment_type !== undefined
          ? body.payment_type
          : nestedOrderData.payment_type;
      const paymentType =
        String(rawPaymentType ?? "Prepaid").trim().toUpperCase() === "COD"
          ? "COD"
          : "Prepaid";

      finalOrderData.consignment_no = consignmentNo;
      finalOrderData.package_type = packageType;
      finalOrderData.manual_amount_including_gst = parsedAmount;
      finalOrderData.shipping_mode = shippingMode || "Surface";
      finalOrderData.payment_type = paymentType;
      finalOrderData.status = "Booked";
    } else {
      finalOrderData.carrier = "Delivery";
      finalOrderData.consignment_no = null;
      finalOrderData.package_type = null;
      finalOrderData.manual_amount_including_gst = null;
      finalOrderData.shipping_mode = null;
      finalOrderData.status = "Processing";
    }

    // ==================================================
    // PICKUP ADDRESS VALIDATION
    // ==================================================

    const finalPickupAddress = String(
      finalOrderData.pickup_address || "",
    ).trim();

    const finalPickupPincode = String(
      finalOrderData.pickup_pincode || "",
    ).trim();

    const finalPickupCity = String(finalOrderData.pickup_city || "").trim();

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

    let finalPickupAddressId = finalOrderData.pickup_address_id;

    if (!finalPickupAddressId) {
      // ----------------------------------------------
      // PICKUP ADDRESS REQUIRED
      // ----------------------------------------------

      if (!finalPickupAddress) {
        return res.status(400).json({
          success: false,

          message: "Pickup address is required",
        });
      }

      // ----------------------------------------------
      // PICKUP PINCODE REQUIRED
      // ----------------------------------------------

      if (!/^\d{6}$/.test(finalPickupPincode)) {
        return res.status(400).json({
          success: false,

          message: "Valid 6-digit pickup pincode is required",
        });
      }

      // ----------------------------------------------
      // CREATE PICKUP ADDRESS
      // ----------------------------------------------

      const pickupAddressResult = await new Promise((resolve, reject) => {
        createPickupAddress(
          Number(user_id),

          finalPickupAddress,

          finalPickupPincode,

          finalPickupCity,

          (error, result) => {
            if (error) {
              return reject(error);
            }

            resolve(result);
          },
        );
      });

      // ----------------------------------------------
      // GET INSERTED ID
      // ----------------------------------------------

      if (!pickupAddressResult || !pickupAddressResult.insertId) {
        throw new Error("Unable to create pickup address");
      }

      finalPickupAddressId = pickupAddressResult.insertId;
    }

    // ==================================================
    // FINAL ORDER DATA
    // ==================================================

    finalOrderData.pickup_address_id = Number(finalPickupAddressId);

    finalOrderData.user_id = Number(user_id);

    if (finalOrderData.warehouse_id) {
      finalOrderData.warehouse_id = Number(finalOrderData.warehouse_id);
    }

    // ==================================================
    // REQUIRED CONSIGNEE VALIDATION
    // ==================================================

    if (!String(finalOrderData.consignee_name || "").trim()) {
      return res.status(400).json({
        success: false,

        message: "Consignee name is required",
      });
    }

    // ==================================================
    // MOBILE VALIDATION
    // ==================================================

    if (!/^\d{10}$/.test(String(finalOrderData.mobile || "").trim())) {
      return res.status(400).json({
        success: false,

        message: "Valid 10-digit mobile number is required",
      });
    }

    // ==================================================
    // DELIVERY PINCODE
    // ==================================================

    if (!/^\d{6}$/.test(String(finalOrderData.pincode || "").trim())) {
      return res.status(400).json({
        success: false,

        message: "Valid 6-digit delivery pincode is required",
      });
    }

    // ==================================================
    // DELIVERY ADDRESS
    // ==================================================

    if (!String(finalOrderData.address_line1 || "").trim()) {
      return res.status(400).json({
        success: false,

        message: "Delivery address is required",
      });
    }

    // ==================================================
    // CREATE ORDER
    // ==================================================

    const createdOrder = await new Promise((resolve, reject) => {
      createOrder(finalOrderData, (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      });
    });

    // ==================================================
    // ORDER CHECK
    // ==================================================

    if (!createdOrder || !createdOrder.id) {
      throw new Error("Order could not be created");
    }

    const internalOrderId = Number(createdOrder.id);

    // ==================================================
    // CREATE PRODUCTS
    // ==================================================

    if (Array.isArray(products) && products.length > 0) {
      for (const product of products) {
        await new Promise((resolve, reject) => {
          createProduct(
            {
              order_id: internalOrderId,

              product_name: product.product_name,

              sku: product.sku || null,

              price: Number(product.price) || 0,

              qty: Number(product.qty) || 1,

              tax: Number(product.tax) || 0,
            },

            (error, result) => {
              if (error) {
                return reject(error);
              }

              resolve(result);
            },
          );
        });
      }
    }

    // ==================================================
    // CREATE PACKAGES
    // ==================================================

    if (Array.isArray(packages) && packages.length > 0) {
      for (const packageData of packages) {
        await new Promise((resolve, reject) => {
          createPackage(
            {
              order_id: internalOrderId,

              length: Number(packageData.length) || 0,

              width: Number(packageData.width) || 0,

              height: Number(packageData.height) || 0,

              weight: Number(packageData.weight) || 0,

              package_count:
                Number(packageData.package_count || packageData.count) || 1,
            },

            (error, result) => {
              if (error) {
                return reject(error);
              }

              resolve(result);
            },
          );
        });
      }
    }

    // ==================================================
    // SUCCESS RESPONSE
    // ==================================================

    return res.status(201).json({
      success: true,
      id: createdOrder.id,
      order_id: createdOrder.order_id,
      carrier: createdOrder.carrier,
      consignment_no: createdOrder.consignment_no,
      package_type: createdOrder.package_type,
      manual_amount_including_gst: createdOrder.manual_amount_including_gst,
      shipping_mode: createdOrder.shipping_mode,
      payment_type: createdOrder.payment_type,
      status: createdOrder.status,
      pickup_address_id: finalPickupAddressId,
      warehouse_id: finalOrderData.warehouse_id || null,
      message: createdOrder.order_id
        ? "Order created successfully"
        : "Manual carrier order saved successfully",
    });
  } catch (error) {
    console.log("Create order error:", error);

    return res.status(500).json({
      success: false,

      message: error.message || "Unable to create order",
    });
  }
};

// ======================================================
// GET PROCESSING ORDERS
// ======================================================

const getProcessingOrdersController = async (req, res) => {
  try {
    const user_id = Number(req.user?.id || req.query.user_id || req.body?.user_id);

    if (!user_id) {
      return res.status(400).json({
        success: false,

        message: "User ID is required",
      });
    }

    getProcessingOrders(user_id, (error, rows) => {
      if (error) {
        console.log("Get processing orders error:", error);

        return res.status(500).json({
          success: false,

          message: error.message || "Unable to fetch processing orders",
        });
      }

      return res.status(200).json({
        success: true,

        orders: rows || [],
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message: error.message || "Unable to fetch processing orders",
    });
  }
};

// ======================================================
// GET ALL ORDERS
// ======================================================

const getAllOrdersController = async (req, res) => {
  try {
    const requestStart = Date.now();
    const user_id = Number(req.user?.id || req.query.user_id || req.body?.user_id);

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || req.query.statusScope || "").trim();

    // ==================================================
    // USER ID
    // ==================================================

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // ==================================================
    // GET ALL ORDERS
    // ==================================================
    const dbStart = Date.now();

    getAllOrders(
      user_id,
      page,
      limit,
      search,
      status,
      async (error, rows, totalOrders) => {
        console.log(
          `GET ALL ORDERS DB TIME: ${Date.now() - dbStart} ms | ROWS: ${
            rows?.length || 0
          }`,
        );

        if (error) {
          console.log("Get all orders error:", error);

          return res.status(500).json({
            success: false,
            message: error.message || "Unable to fetch all orders",
          });
        }

        const rawRows = rows || [];

        // --------------------------------------------------
        // Unpack stored JSON tracking data into order object
        // --------------------------------------------------
        const ordersWithStoredTracking = rawRows.map((order) => {
          const isCancelled =
            String(order.status || "").trim().toUpperCase() === "CANCELLED" ||
            String(order.status || "").trim().toUpperCase() === "CANCELED" ||
            String(order.order_status || "").trim().toUpperCase() === "CANCELLED" ||
            String(order.order_status || "").trim().toUpperCase() === "CANCELED" ||
            String(order.tracking_status || "").trim().toUpperCase() === "CANCELLED" ||
            String(order.tracking_status || "").trim().toUpperCase() === "CANCELED";

          if (isCancelled) {
            return {
              ...order,
              status: "Cancelled",
              order_status: "Cancelled",
              tracking_status: "CANCELLED",
              tracking_available: false,
            };
          }

          let trackingData = order.tracking_data;
          if (trackingData) {
            try {
              if (typeof trackingData === "string") {
                trackingData = JSON.parse(trackingData);
              }
              if (trackingData && typeof trackingData === "object") {
                let resolvedTrackingStatus = order.tracking_status || trackingData.tracking_status || order.status;
                let resolvedStatus = order.status;

                const checkText = `${resolvedTrackingStatus || ""} ${trackingData.tracking_raw_status || ""} ${trackingData.tracking_instructions || ""}`.toUpperCase();
                if (
                  checkText.includes("RETURN ACCEPT") ||
                  checkText.includes("RETURN_ACCEPT") ||
                  checkText.includes("RETURN DELIVERED") ||
                  checkText.includes("RTO DELIVERED") ||
                  checkText.includes("DELIVERED TO SHIPPER") ||
                  checkText.includes("RETURNED TO SHIPPER")
                ) {
                  resolvedTrackingStatus = "RTO DELIVERED";
                  if (String(resolvedStatus || "").toUpperCase() === "DELIVERED") {
                    resolvedStatus = "RTO Delivered";
                  }
                }

                return {
                  ...order,
                  status: resolvedStatus,
                  tracking_status: resolvedTrackingStatus,
                  tracking_raw_status: trackingData.tracking_raw_status || null,
                  tracking_status_code: trackingData.tracking_status_code || null,
                  tracking_status_type: trackingData.tracking_status_type || null,
                  tracking_status_datetime: trackingData.tracking_status_datetime || null,
                  tracking_location: trackingData.tracking_location || null,
                  tracking_instructions: trackingData.tracking_instructions || null,
                  tracking_scans: Array.isArray(trackingData.tracking_scans) ? trackingData.tracking_scans : [],
                  tracking_expected_delivery: trackingData.tracking_expected_delivery || null,
                  tracking_pickup_date: trackingData.tracking_pickup_date || null,
                  tracking_delivery_date: trackingData.tracking_delivery_date || null,
                  tracking_rto_started_date: trackingData.tracking_rto_started_date || null,
                  tracking_returned_date: trackingData.tracking_returned_date || null,
                  tracking_awb: trackingData.tracking_awb || order.awb,
                  tracking_available: trackingData.tracking_available !== false,
                };
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }

          return {
            ...order,
            tracking_status: order.tracking_status || order.status,
            tracking_available: Boolean(order.tracking_status),
          };
        });

        // ==================================================
        // DELHIVERY LIVE / AUTO TRACKING SYNC
        // ==================================================
        const forceLiveTracking =
          String(req.query.refresh_tracking || req.query.live_tracking || "false").toLowerCase() === "true";

        let finalOrders = ordersWithStoredTracking;

        if (forceLiveTracking) {
          const trackingStart = Date.now();
          finalOrders = await attachTrackingToOrders(ordersWithStoredTracking);
          console.log(
            `GET ALL ORDERS LIVE TRACKING TIME: ${Date.now() - trackingStart} ms`,
          );
        } else {
          // Identify any active orders on the current page with stale tracking (> 2 mins)
          const stalePageAwbs = [
            ...new Set(
              ordersWithStoredTracking
                .filter((o) => isOrderTrackingStale(o, 2))
                .map((o) => String(o.awb || "").trim())
                .filter(Boolean)
            ),
          ];

          if (stalePageAwbs.length > 0 && stalePageAwbs.length <= 25) {
            try {
              const trackingPromise = getTrackingForWaybills(stalePageAwbs);
              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Tracking sync timeout")), 1800)
              );
              const freshTrackingMap = await Promise.race([
                trackingPromise,
                timeoutPromise,
              ]);

              if (freshTrackingMap && typeof freshTrackingMap === "object") {
                clearOrderStatusCountsCache(user_id);
                finalOrders = finalOrders.map((order) => {
                  const awb = String(order.awb || "").trim();
                  const fresh = freshTrackingMap[awb];
                  if (fresh && fresh.tracking_available !== false) {
                    const newStatus =
                      fresh.tracking_status && orderStatusMap[fresh.tracking_status]
                        ? orderStatusMap[fresh.tracking_status]
                        : order.status;
                    return {
                      ...order,
                      status: newStatus,
                      tracking_status: fresh.tracking_status || order.tracking_status,
                      tracking_data: fresh,
                      tracking_updated_at: new Date(),
                      tracking_available: true,
                    };
                  }
                  return order;
                });
              }
            } catch (syncErr) {
              // If timeout or error, continue without blocking the response
              // and let getTrackingForWaybills complete in the background
              getTrackingForWaybills(stalePageAwbs).catch(() => {});
            }
          } else if (stalePageAwbs.length > 25) {
            getTrackingForWaybills(stalePageAwbs.slice(0, 50)).catch((err) => {
              console.warn("Background tracking catch:", err?.message || err);
            });
          }

          // Trigger throttled background sync for any other active orders across this user's account
          triggerBackgroundActiveOrdersSync(user_id);
        }

        // ==================================================
        // SUCCESS RESPONSE
        // ==================================================

        console.log(
          `GET ALL ORDERS TOTAL TIME: ${Date.now() - requestStart} ms`,
        );

        return res.status(200).json({
          success: true,
          orders: finalOrders,
          pagination: {
            page,
            limit,
            totalOrders,
            totalPages: Math.ceil(totalOrders / limit) || 1,
          },
        });
      },
    );
  } catch (error) {
    console.log("Get all orders controller error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to fetch all orders",
    });
  }
};

// ======================================================
// GET ORDER BY ID
// ======================================================

const getOrderByIdController = async (req, res) => {
  try {
    const orderId = Number(req.params.id);

    const userId = Number(req.user?.id || req.query.user_id || req.body?.user_id);

    if (!orderId) {
      return res.status(400).json({
        success: false,

        message: "Order ID is required",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,

        message: "User ID is required",
      });
    }

    const order = await getOrderById(orderId, userId);

    return res.status(200).json({
      success: true,

      order,
    });
  } catch (error) {
    console.log("Get order error:", error);

    const statusCode = error.message === "Order not found" ? 404 : 500;

    return res.status(statusCode).json({
      success: false,

      message: error.message || "Unable to fetch order",
    });
  }
};

// ======================================================
// UPDATE ORDER
// ======================================================

const updateOrderController = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const body = req.body || {};

    const {
      user_id,
      warehouse_id,
      pickup_address_id,
      pickup_address,
      pickup_pincode,
      pickup_city,
      party_identity_id,
      orderData,
      products,
      packages,
    } = body;

    const userId = Number(req.user?.id || user_id);

    if (!orderId || !userId) {
      return res.status(400).json({
        success: false,

        message: "Valid order ID and user ID are required",
      });
    }

    const nestedOrderData =
      orderData && typeof orderData === "object" ? orderData : {};

    // ==================================================
    // CREATE PICKUP ADDRESS IF NEEDED
    // ==================================================

    let finalPickupAddressId =
      pickup_address_id || nestedOrderData.pickup_address_id || null;

    if (!finalPickupAddressId && pickup_address) {
      const pickupAddressResult = await new Promise((resolve, reject) => {
        createPickupAddress(
          userId,

          String(pickup_address).trim(),

          String(pickup_pincode || "").trim(),

          String(pickup_city || "").trim(),

          (error, result) => {
            if (error) {
              return reject(error);
            }

            resolve(result);
          },
        );
      });

      finalPickupAddressId = pickupAddressResult?.insertId || null;
    }

    // ==================================================
    // PARTY IDENTITY VALIDATION
    // ==================================================
    let validatedPartyIdentityId = null;
    const rawPartyIdentityId =
      body.party_identity_id !== undefined
        ? body.party_identity_id
        : nestedOrderData.party_identity_id !== undefined
        ? nestedOrderData.party_identity_id
        : null;

    if (rawPartyIdentityId) {
      const parsedPid = Number(rawPartyIdentityId);
      if (!Number.isInteger(parsedPid) || parsedPid <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid Party Identity ID is required",
        });
      }

      const [partyRows] = await db.promise().query(
        "SELECT id FROM party_identities WHERE id = ? AND user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL) LIMIT 1",
        [parsedPid, userId]
      );

      if (!partyRows || partyRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Selected Party Identity does not belong to your account",
        });
      }

      validatedPartyIdentityId = parsedPid;
    }

    // ==================================================
    // FINAL ORDER DATA
    // ==================================================

    const finalOrderData = {
      ...nestedOrderData,

      user_id: userId,

      warehouse_id: warehouse_id || nestedOrderData.warehouse_id || null,

      pickup_address_id: finalPickupAddressId,

      party_identity_id: validatedPartyIdentityId,
    };

    // ==================================================
    // UPDATE
    // ==================================================

    const result = await updateOrder(
      orderId,

      userId,

      finalOrderData,

      {
        pickup_address_id: finalPickupAddressId,

        pickup_address: pickup_address,

        pickup_pincode: pickup_pincode,

        pickup_city: pickup_city,
      },

      Array.isArray(products) ? products : [],

      Array.isArray(packages) ? packages : [],
    );

    return res.status(200).json(result);
  } catch (error) {
    console.log("Update order error:", error);

    return res.status(500).json({
      success: false,

      message: error.message || "Unable to update order",
    });
  }
};

// ======================================================
// DELETE PROCESSING ORDERS
// ======================================================

const deleteOrdersController = async (req, res) => {
  try {
    const { user_id, order_ids } = req.body;

    const userId = Number(req.user?.id || user_id);

    if (!userId) {
      return res.status(400).json({
        success: false,

        message: "User ID is required",
      });
    }

    if (!Array.isArray(order_ids) || order_ids.length === 0) {
      return res.status(400).json({
        success: false,

        message: "Please select at least one order",
      });
    }

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

        message: "Invalid order selection",
      });
    }

    const result = await deleteProcessingOrders(
      userId,

      cleanOrderIds,
    );

    return res.status(200).json(result);
  } catch (error) {
    console.log("Delete orders error:", error);

    return res.status(500).json({
      success: false,

      message: error.message || "Unable to delete orders",
    });
  }
};

// ======================================================
// SEARCH PREVIOUS CUSTOMERS
// ======================================================

const searchPreviousCustomersController = async (req, res) => {
  try {
    const userId = Number(req.user?.id || req.query?.user_id);
    const search = String(req.query?.search || "").trim();

    console.log("==========================================");
    console.log("PREVIOUS CUSTOMER SEARCH");
    console.log("userId:", userId);
    console.log("search:", search);
    console.log("==========================================");

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid user_id is required",
      });
    }

    if (search.length < 2) {
      return res.status(200).json({
        success: true,
        customers: [],
      });
    }

    const customers = await searchPreviousCustomers(userId, search);

    console.log("Previous customers found:", customers?.length || 0);

    return res.status(200).json({
      success: true,
      customers: Array.isArray(customers) ? customers : [],
    });
  } catch (error) {
    console.error("==========================================");

    console.error("PREVIOUS CUSTOMER SEARCH ERRORRRRR:", error);

    console.error("MESSAGE:", error?.message);

    console.error("CODE:", error?.code);

    console.error("SQL MESSAGE:", error?.sqlMessage);

    console.error("==========================================");

    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to search previous customers",
      code: error?.code || null,
      sqlMessage: error?.sqlMessage || null,
    });
  }
};

// ======================================================
// TRACKING SEARCH
// ======================================================

const searchTrackingController = async (req, res) => {
  try {
    const userId = Number(req.user?.id || req.query?.user_id || req.body?.user_id);

    const search = String(req.query?.search || req.body?.search || "").trim();

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid user_id is required",
      });
    }

    if (!search) {
      return res.status(400).json({
        success: false,
        message: "Tracking ID or Order ID is required",
      });
    }

    const order = await searchOrderForTracking(userId, search);

    // IMPORTANT:
    // Do not reveal whether the shipment belongs
    // to another user.
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    const awb = String(order.awb || "").trim();

    if (awb) {
      const trackingMap = await getTrackingForWaybills([awb]);

      const tracking = trackingMap?.[awb] || {};

      order.tracking_status = tracking.tracking_status || order.tracking_status;

      order.tracking_raw_status = tracking.tracking_raw_status || null;

      order.tracking_status_code = tracking.tracking_status_code || null;

      order.tracking_status_type = tracking.tracking_status_type || null;

      order.tracking_status_datetime =
        tracking.tracking_status_datetime || null;

      order.tracking_location = tracking.tracking_location || null;

      order.tracking_instructions = tracking.tracking_instructions || null;

      order.tracking_scans = tracking.tracking_scans || [];

      order.tracking_awb = tracking.tracking_awb || awb;

      order.tracking_expected_delivery =
        tracking.tracking_expected_delivery || null;
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Tracking search error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to search shipment",
    });
  }
};

// ======================================================
// GET ORDER STATUS COUNTS
// ======================================================

const getOrderStatusCountsController = async (req, res) => {
  try {
    const userId = Number(
      req.query?.user_id ||
      req.user?.id ||
      req.user?.user_id ||
      req.user?.userId
    );

    if (!userId || !Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required",
      });
    }

    // Auto-sync active orders in background whenever counts are fetched
    triggerBackgroundActiveOrdersSync(userId);

    const counts = await getOrderStatusCounts(userId);

    return res.status(200).json({
      success: true,
      counts,
    });
  } catch (error) {
    console.error("Get order status counts error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to fetch order status counts",
    });
  }
};

// ======================================================
// GET DASHBOARD SUMMARY (FAST UNIFIED ENDPOINT)
// ======================================================

const getDashboardSummaryController = async (req, res) => {
  try {
    const userId = Number(
      req.query?.user_id ||
      req.user?.id ||
      req.user?.user_id ||
      req.user?.userId
    );

    if (!userId || !Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required",
      });
    }

    triggerBackgroundActiveOrdersSync(userId);

    const summary = await getDashboardSummary(userId);

    return res.status(200).json({
      success: true,
      ...summary,
    });
  } catch (error) {
    console.error("Get dashboard summary error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to fetch dashboard summary",
    });
  }
};

// ======================================================
// EXPORT
// ======================================================

module.exports = {
  createOrder: createOrderController,

  getProcessingOrders: getProcessingOrdersController,

  getAllOrders: getAllOrdersController,

  getOrderById: getOrderByIdController,

  updateOrder: updateOrderController,

  deleteOrders: deleteOrdersController,

  searchPreviousCustomers: searchPreviousCustomersController,

  searchTracking: searchTrackingController,

  getOrderStatusCounts: getOrderStatusCountsController,

  getDashboardSummary: getDashboardSummaryController,
};

