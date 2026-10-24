const db = require("../config/db");
const promiseDb = db.promise();

// Helper to normalize status into major lifecycle buckets
const getLifecycleStatus = (status, trackingStatus) => {
  const s = String(status || "").trim().toUpperCase();
  const t = String(trackingStatus || "").trim().toUpperCase();

  if (s.includes("CANCEL") || t.includes("CANCEL")) return "CANCELLED";
  if (s.includes("RTO DELIVERED") || t.includes("RTO DELIVERED") || s.includes("RETURN ACCEPTED") || t.includes("RETURN ACCEPTED")) return "RTO DELIVERED";
  if (s.includes("RTO IN TRANSIT") || t.includes("RTO IN TRANSIT") || s.includes("RTO") || t.includes("RTO")) return "RTO IN TRANSIT";
  if (s === "DELIVERED" || t === "DELIVERED") return "DELIVERED";
  if (s.includes("OUT FOR DELIVERY") || t.includes("OUT FOR DELIVERY") || s === "OFD" || t === "OFD") return "OUT FOR DELIVERY";
  if (s.includes("IN TRANSIT") || t.includes("IN TRANSIT")) return "IN TRANSIT";
  if (s.includes("NDR") || t.includes("NDR") || s.includes("UNDELIVERED") || t.includes("UNDELIVERED") || s === "PENDING" || t === "PENDING") return "NDR / PENDING";
  if (s === "MANIFESTED" || t === "MANIFESTED") return "MANIFESTED";
  if (s === "NOT PICKED" || t === "NOT PICKED") return "NOT PICKED";
  if (s === "PROCESSING" || t === "PROCESSING") return "READY TO SHIP";

  return s || t || "BOOKED";
};

// =========================================================
// 1. SHIPMENT STATUS & LIFECYCLE REPORT (DATE RANGE)
// =========================================================
const getShipmentStatusReportController = async (req, res) => {
  try {
    const userId = Number(req.user?.id || req.user?.user_id || req.query.user_id);
    if (!userId || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const {
      start_date,
      end_date,
      status = "ALL",
      carrier = "ALL",
      payment_type = "ALL",
      search = "",
    } = req.query;

    const params = [userId];
    let whereClauses = ["o.user_id = ?"];

    // Date range filter on order booking date (created_at)
    if (start_date) {
      const formattedStart = start_date.includes(" ") || start_date.includes("T")
        ? start_date
        : `${start_date} 00:00:00`;
      whereClauses.push("o.created_at >= ?");
      params.push(formattedStart);
    }

    if (end_date) {
      const formattedEnd = end_date.includes(" ") || end_date.includes("T")
        ? end_date
        : `${end_date} 23:59:59`;
      whereClauses.push("o.created_at <= ?");
      params.push(formattedEnd);
    }

    // Carrier filter
    if (carrier && carrier !== "ALL") {
      whereClauses.push("o.carrier = ?");
      params.push(carrier);
    }

    // Payment type filter (COD vs Prepaid)
    if (payment_type && payment_type !== "ALL") {
      whereClauses.push("o.payment_type = ?");
      params.push(payment_type);
    }

    // Search filter (AWB, order_id, customer name, mobile, city)
    if (search && String(search).trim()) {
      const q = `%${String(search).trim()}%`;
      whereClauses.push(
        "(o.order_id LIKE ? OR o.awb LIKE ? OR o.consignee_name LIKE ? OR o.mobile LIKE ? OR o.city LIKE ?)"
      );
      params.push(q, q, q, q, q);
    }

    const whereSql = whereClauses.join(" AND ");

    // Fetch detailed orders within the date range
    const [rows] = await promiseDb.query(
      `
      SELECT
        o.id,
        o.order_id,
        o.awb,
        o.carrier,
        o.consignee_name,
        o.mobile,
        o.city,
        o.state,
        o.pincode,
        o.payment_type,
        o.status,
        CASE
          WHEN UPPER(TRIM(COALESCE(o.status, ''))) IN ('CANCELLED', 'CANCELED') THEN 'CANCELLED'
          ELSE o.tracking_status
        END AS tracking_status,
        o.created_at,
        o.updated_at,
        COALESCE(
          (SELECT m_charge.shipping_charge FROM manifests m_charge WHERE m_charge.order_id = o.id AND m_charge.user_id = o.user_id ORDER BY m_charge.id DESC LIMIT 1),
          o.manual_amount_including_gst,
          0
        ) AS shipping_charge,
        COALESCE(
          (SELECT pkg.weight FROM order_packages pkg WHERE pkg.order_id = o.id ORDER BY pkg.id ASC LIMIT 1),
          0.5
        ) AS weight
      FROM orders o
      WHERE ${whereSql}
      ORDER BY o.created_at DESC
      LIMIT 2500
      `,
      params
    );

    // Compute lifecycle KPI aggregates for this date range
    let totalOrders = rows.length;
    let deliveredCount = 0;
    let rtoDeliveredCount = 0;
    let rtoInTransitCount = 0;
    let inTransitCount = 0;
    let outForDeliveryCount = 0;
    let ndrPendingCount = 0;
    let manifestedCount = 0;
    let cancelledCount = 0;
    let totalShippingCost = 0;
    let codOrdersCount = 0;
    let prepaidOrdersCount = 0;

    const mappedOrders = rows.map((order) => {
      const lifecycle = getLifecycleStatus(order.status, order.tracking_status);
      const charge = Number(order.shipping_charge) || 0;
      totalShippingCost += charge;

      if (lifecycle === "DELIVERED") deliveredCount++;
      else if (lifecycle === "RTO DELIVERED") rtoDeliveredCount++;
      else if (lifecycle === "RTO IN TRANSIT") rtoInTransitCount++;
      else if (lifecycle === "OUT FOR DELIVERY") {
        outForDeliveryCount++;
        inTransitCount++;
      } else if (lifecycle === "IN TRANSIT") inTransitCount++;
      else if (lifecycle === "NDR / PENDING") ndrPendingCount++;
      else if (lifecycle === "MANIFESTED" || lifecycle === "NOT PICKED") manifestedCount++;
      else if (lifecycle === "CANCELLED") cancelledCount++;

      const pType = String(order.payment_type || "").toUpperCase();
      if (pType.includes("COD")) codOrdersCount++;
      else prepaidOrdersCount++;

      return {
        ...order,
        lifecycle_status: lifecycle,
        shipping_charge: charge,
        weight: Number(order.weight) || 0.5,
      };
    });

    // Optional status filter applied after lifecycle categorization if specific status selected
    let filteredOrders = mappedOrders;
    if (status && status !== "ALL") {
      const targetNormalized = String(status).toUpperCase();
      filteredOrders = mappedOrders.filter((o) =>
        o.lifecycle_status.includes(targetNormalized) ||
        String(o.status).toUpperCase().includes(targetNormalized)
      );
    }

    const summary = {
      total_orders: totalOrders,
      delivered_count: deliveredCount,
      delivered_percentage: totalOrders > 0 ? Number(((deliveredCount / totalOrders) * 100).toFixed(1)) : 0,
      rto_delivered_count: rtoDeliveredCount,
      rto_in_transit_count: rtoInTransitCount,
      total_rto_count: rtoDeliveredCount + rtoInTransitCount,
      rto_percentage: totalOrders > 0 ? Number((((rtoDeliveredCount + rtoInTransitCount) / totalOrders) * 100).toFixed(1)) : 0,
      in_transit_count: inTransitCount,
      out_for_delivery_count: outForDeliveryCount,
      ndr_pending_count: ndrPendingCount,
      manifested_count: manifestedCount,
      cancelled_count: cancelledCount,
      total_shipping_charges: Number(totalShippingCost.toFixed(2)),
      cod_orders_count: codOrdersCount,
      prepaid_orders_count: prepaidOrdersCount,
    };

    return res.status(200).json({
      success: true,
      summary,
      total_rows: filteredOrders.length,
      orders: filteredOrders,
    });
  } catch (error) {
    console.error("Get shipment status report error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to generate shipment status report",
      error: error.message,
    });
  }
};

// =========================================================
// 2. WEIGHT DISCREPANCY REPORT (DATE RANGE)
// =========================================================
const getWeightDiscrepancyReportController = async (req, res) => {
  try {
    const userId = Number(req.user?.id || req.user?.user_id || req.query.user_id);
    if (!userId || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const {
      start_date,
      end_date,
      status = "ALL", // ALL | pending | settled | waived
      search = "",
    } = req.query;

    // Check if weight_checkings table exists
    const [tableCheck] = await promiseDb.query(`SHOW TABLES LIKE 'weight_checkings'`);
    if (!tableCheck || tableCheck.length === 0) {
      return res.status(200).json({
        success: true,
        summary: {
          total_discrepancies: 0,
          total_extra_charges: 0,
          total_weight_diff_kg: 0,
          pending_count: 0,
          pending_amount: 0,
          settled_count: 0,
          settled_amount: 0,
          waived_count: 0,
          waived_amount: 0,
        },
        discrepancies: [],
      });
    }

    const params = [userId];
    let whereClauses = ["wc.user_id = ?"];

    // Date range filter
    if (start_date) {
      const formattedStart = start_date.includes(" ") || start_date.includes("T")
        ? start_date
        : `${start_date} 00:00:00`;
      whereClauses.push("wc.created_at >= ?");
      params.push(formattedStart);
    }

    if (end_date) {
      const formattedEnd = end_date.includes(" ") || end_date.includes("T")
        ? end_date
        : `${end_date} 23:59:59`;
      whereClauses.push("wc.created_at <= ?");
      params.push(formattedEnd);
    }

    // Status filter
    if (status && status !== "ALL") {
      whereClauses.push("LOWER(TRIM(wc.status)) = ?");
      params.push(String(status).toLowerCase().trim());
    }

    // Search filter (AWB or order_id)
    if (search && String(search).trim()) {
      const q = `%${String(search).trim()}%`;
      whereClauses.push("(wc.awb LIKE ? OR wc.order_id LIKE ?)");
      params.push(q, q);
    }

    const whereSql = whereClauses.join(" AND ");

    const [rows] = await promiseDb.query(
      `
      SELECT
        wc.id,
        wc.order_db_id,
        wc.order_id,
        wc.user_id,
        wc.awb,
        COALESCE(wc.declared_weight, 0) AS declared_weight,
        COALESCE(wc.actual_weight, 0) AS actual_weight,
        COALESCE(wc.weight_difference, 0) AS weight_difference,
        COALESCE(wc.original_shipping_charge, 0) AS original_shipping_charge,
        COALESCE(wc.recalculated_shipping_charge, 0) AS recalculated_shipping_charge,
        COALESCE(wc.extra_charge, 0) AS extra_charge,
        wc.service_type,
        wc.zone,
        COALESCE(wc.status, 'pending') AS status,
        COALESCE(wc.settlement_amount, 0) AS settlement_amount,
        wc.created_at,
        wc.settled_at
      FROM weight_checkings wc
      WHERE ${whereSql}
      ORDER BY wc.created_at DESC
      LIMIT 2500
      `,
      params
    );

    // Compute Summary KPIs
    let totalExtraCharges = 0;
    let totalWeightDiff = 0;
    let pendingCount = 0;
    let pendingAmount = 0;
    let settledCount = 0;
    let settledAmount = 0;
    let waivedCount = 0;
    let waivedAmount = 0;

    const discrepancies = rows.map((item) => {
      const extra = Number(item.extra_charge) || 0;
      const diff = Number(item.weight_difference) || 0;
      const st = String(item.status || "").toLowerCase();

      totalExtraCharges += extra;
      totalWeightDiff += diff;

      if (st === "settled") {
        settledCount++;
        settledAmount += Number(item.settlement_amount) || extra;
      } else if (st === "waived") {
        waivedCount++;
        waivedAmount += extra;
      } else {
        pendingCount++;
        pendingAmount += extra;
      }

      return {
        ...item,
        declared_weight: Number(Number(item.declared_weight).toFixed(3)),
        actual_weight: Number(Number(item.actual_weight).toFixed(3)),
        weight_difference: Number(diff.toFixed(3)),
        original_shipping_charge: Number(Number(item.original_shipping_charge).toFixed(2)),
        recalculated_shipping_charge: Number(Number(item.recalculated_shipping_charge).toFixed(2)),
        extra_charge: Number(extra.toFixed(2)),
        settlement_amount: Number(Number(item.settlement_amount).toFixed(2)),
      };
    });

    const summary = {
      total_discrepancies: discrepancies.length,
      total_extra_charges: Number(totalExtraCharges.toFixed(2)),
      total_weight_diff_kg: Number(totalWeightDiff.toFixed(3)),
      pending_count: pendingCount,
      pending_amount: Number(pendingAmount.toFixed(2)),
      settled_count: settledCount,
      settled_amount: Number(settledAmount.toFixed(2)),
      waived_count: waivedCount,
      waived_amount: Number(waivedAmount.toFixed(2)),
    };

    return res.status(200).json({
      success: true,
      summary,
      total_rows: discrepancies.length,
      discrepancies,
    });
  } catch (error) {
    console.error("Get weight discrepancy report error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to generate weight discrepancy report",
      error: error.message,
    });
  }
};

module.exports = {
  getShipmentStatusReportController,
  getWeightDiscrepancyReportController,
};
