const db = require("../config/db");

// ======================================================
// HELPERS
// ======================================================

const buildDateCondition = (timeRange, startDate, endDate, column = "o.created_at") => {
  const col = column;

  switch (timeRange) {
    case "today":
      return { condition: `DATE(${col}) = CURDATE()`, params: [] };

    case "yesterday":
      return { condition: `DATE(${col}) = SUBDATE(CURDATE(), 1)`, params: [] };

    case "7days":
      return { condition: `${col} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`, params: [] };

    case "30days":
      return { condition: `${col} >= DATE_SUB(NOW(), INTERVAL 30 DAY)`, params: [] };

    case "this_month":
      return {
        condition: `YEAR(${col}) = YEAR(CURDATE()) AND MONTH(${col}) = MONTH(CURDATE())`,
        params: [],
      };

    case "last_month":
      return {
        condition: `YEAR(${col}) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND MONTH(${col}) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))`,
        params: [],
      };

    case "custom":
      if (startDate && endDate) {
        return {
          condition: `${col} >= ? AND ${col} <= ?`,
          params: [`${startDate} 00:00:00`, `${endDate} 23:59:59`],
        };
      }
      if (startDate) {
        return {
          condition: `${col} >= ?`,
          params: [`${startDate} 00:00:00`],
        };
      }
      return { condition: "1=1", params: [] };

    case "all":
    default:
      return { condition: "1=1", params: [] };
  }
};

// Map raw state names from user input / Delhivery to standard Indian states
const normalizeIndianState = (rawState) => {
  if (!rawState) return "Unknown";
  const s = String(rawState).trim().toLowerCase().replace(/[.\-_]/g, " ");

  if (s.includes("maharashtra") || s === "mh") return "Maharashtra";
  if (s.includes("delhi") || s === "dl" || s.includes("new delhi")) return "Delhi";
  if (s.includes("uttar pradesh") || s === "up") return "Uttar Pradesh";
  if (s.includes("gujarat") || s === "gj") return "Gujarat";
  if (s.includes("karnataka") || s === "ka") return "Karnataka";
  if (s.includes("rajasthan") || s === "rj") return "Rajasthan";
  if (s.includes("tamil") || s === "tn") return "Tamil Nadu";
  if (s.includes("west bengal") || s.includes("bengal") || s === "wb") return "West Bengal";
  if (s.includes("telangana") || s === "ts" || s === "tg") return "Telangana";
  if (s.includes("andhra") || s === "ap") return "Andhra Pradesh";
  if (s.includes("madhya") || s === "mp") return "Madhya Pradesh";
  if (s.includes("haryana") || s === "hr") return "Haryana";
  if (s.includes("punjab") || s === "pb") return "Punjab";
  if (s.includes("bihar") || s === "br") return "Bihar";
  if (s.includes("kerala") || s === "kl") return "Kerala";
  if (s.includes("odisha") || s.includes("orissa") || s === "or" || s === "od") return "Odisha";
  if (s.includes("jharkhand") || s === "jh") return "Jharkhand";
  if (s.includes("chhattisgarh") || s === "cg" || s === "ct") return "Chhattisgarh";
  if (s.includes("assam") || s === "as") return "Assam";
  if (s.includes("uttarakhand") || s.includes("uttaranchal") || s === "uk") return "Uttarakhand";
  if (s.includes("himachal") || s === "hp") return "Himachal Pradesh";
  if (s.includes("jammu") || s.includes("kashmir") || s === "jk") return "Jammu & Kashmir";
  if (s.includes("goa") || s === "ga") return "Goa";
  if (s.includes("chandigarh") || s === "ch") return "Chandigarh";
  if (s.includes("puducherry") || s.includes("pondicherry") || s === "py") return "Puducherry";
  if (s.includes("tripura") || s === "tr") return "Tripura";
  if (s.includes("meghalaya") || s === "ml") return "Meghalaya";
  if (s.includes("manipur") || s === "mn") return "Manipur";
  if (s.includes("nagaland") || s === "nl") return "Nagaland";
  if (s.includes("mizoram") || s === "mz") return "Mizoram";
  if (s.includes("sikkim") || s === "sk") return "Sikkim";
  if (s.includes("arunachal") || s === "ar") return "Arunachal Pradesh";
  if (s.includes("ladakh") || s === "la") return "Ladakh";

  return rawState.trim();
};

// ======================================================
// GET SELLER ANALYTICS OVERVIEW
// ======================================================

const getSellerAnalyticsOverview = async (req, res) => {
  try {
    const rawUserId =
      req.user?.id ||
      req.user?.user_id ||
      req.query?.user_id ||
      req.query?.userId;

    const numericUserId = Number(rawUserId);

    if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid User ID is required",
      });
    }

    const {
      timeRange = "30days",
      startDate = "",
      endDate = "",
      paymentType = "ALL",
      serviceType = "ALL",
    } = req.query;

    const dateInfo = buildDateCondition(timeRange, startDate, endDate, "o.created_at");

    let whereConditions = ["o.user_id = ?", dateInfo.condition];
    let queryParams = [numericUserId, ...dateInfo.params];

    if (paymentType && paymentType !== "ALL") {
      if (paymentType.toUpperCase() === "COD") {
        whereConditions.push("UPPER(TRIM(COALESCE(o.payment_type, ''))) = 'COD'");
      } else {
        whereConditions.push("UPPER(TRIM(COALESCE(o.payment_type, ''))) <> 'COD'");
      }
    }

    if (serviceType && serviceType !== "ALL") {
      whereConditions.push(
        "(UPPER(TRIM(COALESCE(o.shipping_mode, ''))) = ? OR EXISTS (SELECT 1 FROM manifests m WHERE m.order_id = o.id AND UPPER(TRIM(COALESCE(m.service_type, ''))) = ?))"
      );
      queryParams.push(serviceType.toUpperCase(), serviceType.toUpperCase());
    }

    const whereSql = whereConditions.join(" AND ");

    // 1. Core KPIs query
    const kpiQuery = `
      SELECT
        COUNT(o.id) AS total_orders,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(o.tracking_status, o.status, ''))) = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered_orders,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(o.tracking_status, o.status, ''))) IN ('IN_TRANSIT', 'IN TRANSIT', 'SHIPPED') THEN 1 ELSE 0 END) AS in_transit_orders,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(o.tracking_status, o.status, ''))) IN ('OUT_FOR_DELIVERY', 'OUT FOR DELIVERY', 'OFD') THEN 1 ELSE 0 END) AS ofd_orders,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(o.tracking_status, o.status, ''))) LIKE '%RTO%' OR UPPER(TRIM(COALESCE(o.tracking_status, o.status, ''))) = 'RETURNED' THEN 1 ELSE 0 END) AS rto_orders,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(o.tracking_status, o.status, ''))) IN ('CANCELLED', 'CANCELED') THEN 1 ELSE 0 END) AS cancelled_orders,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(o.tracking_status, o.status, ''))) IN ('PENDING', 'NDR', 'NOT_PICKED', 'NOT PICKED') THEN 1 ELSE 0 END) AS pending_orders,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(o.tracking_status, o.status, ''))) IN ('PROCESSING', 'BOOKED') THEN 1 ELSE 0 END) AS processing_orders,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(o.payment_type, ''))) = 'COD' THEN 1 ELSE 0 END) AS cod_orders,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(o.payment_type, ''))) <> 'COD' THEN 1 ELSE 0 END) AS prepaid_orders,
        COALESCE(SUM(
          COALESCE(
            (SELECT m.shipping_charge FROM manifests m WHERE m.order_id = o.id AND m.user_id = o.user_id ORDER BY m.id DESC LIMIT 1),
            o.manual_amount_including_gst,
            0
          )
        ), 0) AS total_freight,
        COALESCE(SUM(
          CASE WHEN UPPER(TRIM(COALESCE(o.payment_type, ''))) = 'COD'
            THEN COALESCE(o.manual_amount_including_gst, 0)
            ELSE 0 END
        ), 0) AS cod_total_value
      FROM orders o
      WHERE ${whereSql}
    `;

    // 2. State-wise Breakdown query
    const stateQuery = `
      SELECT
        TRIM(COALESCE(o.state, 'Unknown')) AS state_name,
        COUNT(o.id) AS orders_count,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(o.tracking_status, o.status, ''))) = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered_count,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(o.tracking_status, o.status, ''))) LIKE '%RTO%' OR UPPER(TRIM(COALESCE(o.tracking_status, o.status, ''))) = 'RETURNED' THEN 1 ELSE 0 END) AS rto_count,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(o.payment_type, ''))) = 'COD' THEN 1 ELSE 0 END) AS cod_count,
        COALESCE(SUM(
          COALESCE(
            (SELECT m.shipping_charge FROM manifests m WHERE m.order_id = o.id AND m.user_id = o.user_id ORDER BY m.id DESC LIMIT 1),
            o.manual_amount_including_gst,
            0
          )
        ), 0) AS freight_spent
      FROM orders o
      WHERE ${whereSql}
      GROUP BY state_name
      ORDER BY orders_count DESC
    `;

    // 3. Time Trend (Daily / Weekly)
    const isDaily = timeRange === "today" || timeRange === "yesterday" || timeRange === "7days" || timeRange === "30days";
    const groupFormat = isDaily ? "%Y-%m-%d" : "%Y-%m";
    const labelFormat = isDaily ? "%d %b" : "%b %Y";

    const trendQuery = `
      SELECT
        DATE_FORMAT(o.created_at, '${groupFormat}') AS date_key,
        DATE_FORMAT(o.created_at, '${labelFormat}') AS date_label,
        COUNT(o.id) AS orders_count,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(o.tracking_status, o.status, ''))) = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered_count,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(o.tracking_status, o.status, ''))) LIKE '%RTO%' THEN 1 ELSE 0 END) AS rto_count,
        COALESCE(SUM(
          COALESCE(
            (SELECT m.shipping_charge FROM manifests m WHERE m.order_id = o.id AND m.user_id = o.user_id ORDER BY m.id DESC LIMIT 1),
            o.manual_amount_including_gst,
            0
          )
        ), 0) AS freight
      FROM orders o
      WHERE ${whereSql}
      GROUP BY date_key, date_label
      ORDER BY date_key ASC
    `;

    // 4. Zone Distribution
    const zoneQuery = `
      SELECT
        UPPER(TRIM(COALESCE(m.zone, 'Other'))) AS zone_name,
        COUNT(o.id) AS count,
        COALESCE(SUM(m.shipping_charge), 0) AS freight
      FROM orders o
      LEFT JOIN manifests m ON m.order_id = o.id AND m.user_id = o.user_id
      WHERE ${whereSql}
      GROUP BY zone_name
      ORDER BY count DESC
      LIMIT 6
    `;

    // 5. Top Cities
    const cityQuery = `
      SELECT
        TRIM(COALESCE(o.city, 'Unknown')) AS city_name,
        COUNT(o.id) AS orders_count,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(o.tracking_status, o.status, ''))) = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered_count
      FROM orders o
      WHERE ${whereSql} AND o.city IS NOT NULL AND TRIM(o.city) <> ''
      GROUP BY city_name
      ORDER BY orders_count DESC
      LIMIT 8
    `;

    // 6. Service Type (Surface / Road vs Air)
    const serviceQuery = `
      SELECT
        CASE
          WHEN UPPER(TRIM(COALESCE(m.service_type, o.shipping_mode, ''))) IN ('AIR', 'EXPRESS') THEN 'Air Express'
          ELSE 'Surface (Road)'
        END AS service_name,
        COUNT(o.id) AS count,
        COALESCE(SUM(
          COALESCE(
            (SELECT m.shipping_charge FROM manifests m WHERE m.order_id = o.id AND m.user_id = o.user_id ORDER BY m.id DESC LIMIT 1),
            0
          )
        ), 0) AS freight
      FROM orders o
      LEFT JOIN manifests m ON m.order_id = o.id AND m.user_id = o.user_id
      WHERE ${whereSql}
      GROUP BY service_name
      ORDER BY count DESC
    `;

    // Execute queries in parallel
    const [
      [kpiRows],
      [stateRows],
      [trendRows],
      [zoneRows],
      [cityRows],
      [serviceRows],
    ] = await Promise.all([
      db.promise().query(kpiQuery, queryParams),
      db.promise().query(stateQuery, queryParams),
      db.promise().query(trendQuery, queryParams),
      db.promise().query(zoneQuery, queryParams),
      db.promise().query(cityQuery, queryParams),
      db.promise().query(serviceQuery, queryParams),
    ]);

    const kpi = kpiRows?.[0] || {};
    const totalOrders = Number(kpi.total_orders || 0);
    const deliveredOrders = Number(kpi.delivered_orders || 0);
    const rtoOrders = Number(kpi.rto_orders || 0);
    const inTransitOrders = Number(kpi.in_transit_orders || 0) + Number(kpi.ofd_orders || 0);
    const pendingOrders = Number(kpi.pending_orders || 0);
    const processingOrders = Number(kpi.processing_orders || 0);
    const cancelledOrders = Number(kpi.cancelled_orders || 0);
    const totalFreight = Number(kpi.total_freight || 0);
    const codOrders = Number(kpi.cod_orders || 0);
    const prepaidOrders = Number(kpi.prepaid_orders || 0);
    const codTotalValue = Number(kpi.cod_total_value || 0);

    // Completed orders base for success rate
    const completedBase = deliveredOrders + rtoOrders;
    const deliverySuccessRate =
      completedBase > 0
        ? Number(((deliveredOrders / completedBase) * 100).toFixed(1))
        : totalOrders > 0
        ? Number(((deliveredOrders / totalOrders) * 100).toFixed(1))
        : 0;

    const rtoRate =
      completedBase > 0
        ? Number(((rtoOrders / completedBase) * 100).toFixed(1))
        : totalOrders > 0
        ? Number(((rtoOrders / totalOrders) * 100).toFixed(1))
        : 0;

    const avgFreightPerOrder =
      totalOrders > 0 ? Number((totalFreight / totalOrders).toFixed(2)) : 0;

    // Normalize State Breakdown with Percentage share
    const stateMap = new Map();
    let normalizedTotalStateOrders = 0;

    (stateRows || []).forEach((row) => {
      const normName = normalizeIndianState(row.state_name);
      const count = Number(row.orders_count || 0);
      const delivered = Number(row.delivered_count || 0);
      const rto = Number(row.rto_count || 0);
      const cod = Number(row.cod_count || 0);
      const freight = Number(row.freight_spent || 0);

      normalizedTotalStateOrders += count;

      if (!stateMap.has(normName)) {
        stateMap.set(normName, {
          state: normName,
          orders: count,
          delivered,
          rto,
          cod,
          freight,
        });
      } else {
        const existing = stateMap.get(normName);
        existing.orders += count;
        existing.delivered += delivered;
        existing.rto += rto;
        existing.cod += cod;
        existing.freight += freight;
      }
    });

    const stateBreakdown = Array.from(stateMap.values())
      .map((st) => ({
        ...st,
        share:
          normalizedTotalStateOrders > 0
            ? Number(((st.orders / normalizedTotalStateOrders) * 100).toFixed(1))
            : 0,
        successRate:
          st.orders > 0 ? Number(((st.delivered / st.orders) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.orders - a.orders);

    return res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalOrders,
          deliveredOrders,
          deliverySuccessRate,
          rtoOrders,
          rtoRate,
          inTransitOrders,
          pendingOrders,
          processingOrders,
          cancelledOrders,
          totalFreight,
          avgFreightPerOrder,
          codOrders,
          prepaidOrders,
          codTotalValue,
        },
        stateBreakdown,
        trend: trendRows || [],
        zones: zoneRows || [],
        cities: cityRows || [],
        services: serviceRows || [],
      },
    });
  } catch (error) {
    console.error("Seller analytics overview error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load business analytics overview",
    });
  }
};

// ======================================================
// EXPORT GST / TAX STATEMENT
// ======================================================

const exportGstTaxReport = async (req, res) => {
  try {
    const rawUserId =
      req.user?.id ||
      req.user?.user_id ||
      req.query?.user_id ||
      req.query?.userId;

    const numericUserId = Number(rawUserId);

    if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid User ID is required",
      });
    }

    const {
      timeRange = "this_month",
      startDate = "",
      endDate = "",
    } = req.query;

    const dateInfo = buildDateCondition(timeRange, startDate, endDate, "o.created_at");

    const query = `
      SELECT
        o.id,
        COALESCE(o.order_id, o.id) AS display_order_id,
        COALESCE(o.awb, '—') AS awb,
        o.created_at,
        o.consignee_name,
        COALESCE(o.city, '—') AS destination_city,
        COALESCE(o.state, '—') AS destination_state,
        COALESCE(o.pincode, '—') AS destination_pincode,
        COALESCE(o.pickup_city, '—') AS pickup_city,
        COALESCE(o.payment_type, 'Prepaid') AS payment_type,
        COALESCE(o.tracking_status, o.status, 'Processing') AS status,
        COALESCE(
          (SELECT m.shipping_charge FROM manifests m WHERE m.order_id = o.id AND m.user_id = o.user_id ORDER BY m.id DESC LIMIT 1),
          o.manual_amount_including_gst,
          0
        ) AS total_freight_charged
      FROM orders o
      WHERE o.user_id = ? AND ${dateInfo.condition}
      ORDER BY o.id DESC
      LIMIT 1000
    `;

    const [rows] = await db.promise().query(query, [numericUserId, ...dateInfo.params]);

    // Format rows with 18% GST calculation (Base amount + 9% CGST + 9% SGST or 18% IGST)
    const formattedRows = (rows || []).map((r) => {
      const totalAmount = Number(r.total_freight_charged || 0);
      // Assume total amount includes 18% GST (Taxable value = Total / 1.18)
      const taxableValue = Number((totalAmount / 1.18).toFixed(2));
      const totalTax = Number((totalAmount - taxableValue).toFixed(2));

      const isIntraState =
        String(r.pickup_city || "").toLowerCase() ===
        String(r.destination_city || "").toLowerCase();

      const cgst = isIntraState ? Number((totalTax / 2).toFixed(2)) : 0;
      const sgst = isIntraState ? Number((totalTax / 2).toFixed(2)) : 0;
      const igst = !isIntraState ? totalTax : 0;

      return {
        order_id: `#${r.display_order_id}`,
        awb: r.awb,
        date: new Date(r.created_at).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        consignee: r.consignee_name || "—",
        destination_city: r.destination_city,
        destination_state: r.destination_state,
        destination_pincode: r.destination_pincode,
        payment_mode: r.payment_type,
        shipment_status: r.status,
        taxable_value: taxableValue,
        cgst_9pct: cgst,
        sgst_9pct: sgst,
        igst_18pct: igst,
        total_freight_gst_included: totalAmount,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedRows.length,
      data: formattedRows,
    });
  } catch (error) {
    console.error("Export GST tax report error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate GST tax report",
    });
  }
};

module.exports = {
  getSellerAnalyticsOverview,
  exportGstTaxReport,
};
