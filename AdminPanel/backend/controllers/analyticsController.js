const db = require("../config/db");

// ======================================================
// HELPERS
// ======================================================

const buildDateCondition = (timeRange, startDate, endDate, column = "created_at") => {
  const col = column;
  const now = new Date();

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

// ======================================================
// GET BUSINESS ANALYTICS SUMMARY
// ======================================================

const getBusinessSummary = async (req, res) => {
  try {
    const {
      timeRange = "30days",
      startDate = "",
      endDate = "",
      userId = "all",
      paymentType = "ALL",
      status = "ALL",
    } = req.query;

    const specificUserId =
      userId && userId !== "all" && Number.isInteger(Number(userId)) && Number(userId) > 0
        ? Number(userId)
        : null;

    // Build WHERE clauses for orders
    const orderDateInfo = buildDateCondition(timeRange, startDate, endDate, "o.created_at");
    let orderConditions = [orderDateInfo.condition];
    let orderParams = [...orderDateInfo.params];

    if (specificUserId) {
      orderConditions.push("o.user_id = ?");
      orderParams.push(specificUserId);
    }

    if (paymentType && paymentType !== "ALL") {
      if (paymentType.toUpperCase() === "COD") {
        orderConditions.push("UPPER(TRIM(COALESCE(o.payment_type, ''))) = 'COD'");
      } else {
        orderConditions.push("UPPER(TRIM(COALESCE(o.payment_type, ''))) <> 'COD'");
      }
    }

    if (status && status !== "ALL") {
      orderConditions.push("UPPER(TRIM(COALESCE(o.tracking_status, o.status, ''))) = ?");
      orderParams.push(status.toUpperCase());
    }

    const orderWhereSql = orderConditions.join(" AND ");

    // 1. ORDERS & REVENUE AGGREGATE
    const orderSummaryQuery = `
      SELECT
        COUNT(DISTINCT o.id) AS total_orders,

        SUM(CASE WHEN UPPER(TRIM(COALESCE(o.tracking_status, o.status, ''))) = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered_orders,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(o.tracking_status, o.status, ''))) IN ('IN TRANSIT', 'OUT FOR DELIVERY', 'OFD') THEN 1 ELSE 0 END) AS in_transit_orders,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(o.tracking_status, o.status, ''))) IN ('MANIFESTED', 'NOT PICKED', 'PROCESSING') THEN 1 ELSE 0 END) AS processing_orders,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(o.tracking_status, o.status, ''))) IN ('RTO DELIVERED', 'RTO IN TRANSIT', 'RETURNED') THEN 1 ELSE 0 END) AS rto_orders,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(o.tracking_status, o.status, ''))) IN ('CANCELLED', 'CANCELED') THEN 1 ELSE 0 END) AS cancelled_orders,

        SUM(CASE WHEN UPPER(TRIM(COALESCE(o.payment_type, ''))) = 'COD' THEN 1 ELSE 0 END) AS cod_orders,
        SUM(CASE WHEN UPPER(TRIM(COALESCE(o.payment_type, ''))) <> 'COD' THEN 1 ELSE 0 END) AS prepaid_orders,

        COALESCE(SUM(
          COALESCE(
            (SELECT m.shipping_charge FROM manifests m WHERE m.order_id = o.id AND m.user_id = o.user_id ORDER BY m.id DESC LIMIT 1),
            0
          )
        ), 0) AS total_freight_revenue,

        COALESCE(SUM(
          CASE
            WHEN UPPER(TRIM(COALESCE(o.payment_type, ''))) = 'COD'
            THEN COALESCE(
              (SELECT SUM(COALESCE(op.price, 0) * COALESCE(op.qty, 1)) FROM order_products op WHERE op.order_id = o.id),
              0
            )
            ELSE 0
          END
        ), 0) AS total_cod_order_value

      FROM orders o
      WHERE ${orderWhereSql}
    `;

    // 2. COD REMITTANCES SUMMARY (Kitna paisa nikala / payout hua)
    const remDateInfo = buildDateCondition(timeRange, startDate, endDate, "cr.created_at");
    let remConditions = [remDateInfo.condition];
    let remParams = [...remDateInfo.params];

    if (specificUserId) {
      remConditions.push("cr.user_id = ?");
      remParams.push(specificUserId);
    }

    const remWhereSql = remConditions.join(" AND ");

    const codSummaryQuery = `
      SELECT
        COALESCE(SUM(CASE WHEN UPPER(TRIM(COALESCE(cr.status, ''))) IN ('SUCCESS', 'SUCCESSFUL') THEN cr.cod_amount ELSE 0 END), 0) AS total_cod_remitted,
        COALESCE(SUM(CASE WHEN UPPER(TRIM(COALESCE(cr.status, ''))) = 'PENDING' THEN cr.cod_amount ELSE 0 END), 0) AS pending_cod_remittance,
        COUNT(CASE WHEN UPPER(TRIM(COALESCE(cr.status, ''))) IN ('SUCCESS', 'SUCCESSFUL') THEN cr.id ELSE NULL END) AS remitted_payout_count,
        COUNT(CASE WHEN UPPER(TRIM(COALESCE(cr.status, ''))) = 'PENDING' THEN cr.id ELSE NULL END) AS pending_payout_count
      FROM cod_remittances cr
      WHERE ${remWhereSql}
    `;

    // 3. WALLET INFLOW / RECHARGES IN TIMEFRAME
    const txDateInfo = buildDateCondition(timeRange, startDate, endDate, "wt.created_at");
    let txConditions = [
      txDateInfo.condition,
      "UPPER(TRIM(COALESCE(wt.type, ''))) = 'RECHARGE'",
      "UPPER(TRIM(COALESCE(wt.status, ''))) = 'SUCCESS'",
    ];
    let txParams = [...txDateInfo.params];

    if (specificUserId) {
      txConditions.push("wt.user_id = ?");
      txParams.push(specificUserId);
    }

    const txWhereSql = txConditions.join(" AND ");

    const walletTxQuery = `
      SELECT
        COALESCE(SUM(wt.amount), 0) AS total_recharge_inflow,
        COUNT(wt.id) AS recharge_count
      FROM wallet_transactions wt
      WHERE ${txWhereSql}
    `;

    // 4. CURRENT TOTAL WALLET BALANCE HELD
    let walletHoldQuery = `SELECT COALESCE(SUM(balance), 0) AS total_wallet_balance FROM wallets`;
    let walletHoldParams = [];
    if (specificUserId) {
      walletHoldQuery += ` WHERE user_id = ?`;
      walletHoldParams.push(specificUserId);
    }

    // Conditions for user breakdown orders subquery
    let userOrderConditions = [orderDateInfo.condition];
    let userOrderParams = [...orderDateInfo.params];
    if (paymentType && paymentType !== "ALL") {
      if (paymentType.toUpperCase() === "COD") {
        userOrderConditions.push("UPPER(TRIM(COALESCE(o.payment_type, ''))) = 'COD'");
      } else {
        userOrderConditions.push("UPPER(TRIM(COALESCE(o.payment_type, ''))) <> 'COD'");
      }
    }
    if (status && status !== "ALL") {
      userOrderConditions.push("UPPER(TRIM(COALESCE(o.tracking_status, o.status, ''))) = ?");
      userOrderParams.push(status.toUpperCase());
    }

    // 5. USER METRICS BREAKDOWN (Har user ka hisaab)
    let userBreakdownQuery = `
      SELECT
        u.id AS user_id,
        u.full_name,
        u.company_name,
        u.email,
        u.phone_no,
        u.created_at AS registered_at,
        COALESCE(w.balance, 0) AS current_wallet_balance,

        COALESCE(ord.orders_count, 0) AS orders_count,
        COALESCE(ord.delivered_count, 0) AS delivered_count,
        COALESCE(ord.rto_count, 0) AS rto_count,
        COALESCE(ord.freight_spent, 0) AS freight_spent,
        COALESCE(ord.cod_orders_count, 0) AS cod_orders_count,

        COALESCE(rem.cod_remitted, 0) AS cod_remitted,
        COALESCE(rem.cod_pending, 0) AS cod_pending,

        COALESCE(rech.total_recharged, 0) AS total_recharged

      FROM users u
      LEFT JOIN wallets w ON w.user_id = u.id

      LEFT JOIN (
        SELECT
          o.user_id,
          COUNT(o.id) AS orders_count,
          SUM(CASE WHEN UPPER(TRIM(COALESCE(o.tracking_status, o.status, ''))) = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered_count,
          SUM(CASE WHEN UPPER(TRIM(COALESCE(o.tracking_status, o.status, ''))) IN ('RTO DELIVERED', 'RTO IN TRANSIT', 'RETURNED') THEN 1 ELSE 0 END) AS rto_count,
          SUM(CASE WHEN UPPER(TRIM(COALESCE(o.payment_type, ''))) = 'COD' THEN 1 ELSE 0 END) AS cod_orders_count,
          SUM(
            COALESCE(
              (SELECT m.shipping_charge FROM manifests m WHERE m.order_id = o.id AND m.user_id = o.user_id ORDER BY m.id DESC LIMIT 1),
              0
            )
          ) AS freight_spent
        FROM orders o
        WHERE ${userOrderConditions.join(" AND ")}
        GROUP BY o.user_id
      ) ord ON ord.user_id = u.id

      LEFT JOIN (
        SELECT
          cr.user_id,
          SUM(CASE WHEN UPPER(TRIM(COALESCE(cr.status, ''))) IN ('SUCCESS', 'SUCCESSFUL') THEN cr.cod_amount ELSE 0 END) AS cod_remitted,
          SUM(CASE WHEN UPPER(TRIM(COALESCE(cr.status, ''))) = 'PENDING' THEN cr.cod_amount ELSE 0 END) AS cod_pending
        FROM cod_remittances cr
        WHERE ${remDateInfo.condition}
        GROUP BY cr.user_id
      ) rem ON rem.user_id = u.id

      LEFT JOIN (
        SELECT
          wt.user_id,
          SUM(wt.amount) AS total_recharged
        FROM wallet_transactions wt
        WHERE ${txDateInfo.condition}
          AND UPPER(TRIM(COALESCE(wt.type, ''))) = 'RECHARGE'
          AND UPPER(TRIM(COALESCE(wt.status, ''))) = 'SUCCESS'
        GROUP BY wt.user_id
      ) rech ON rech.user_id = u.id
    `;

    const userBreakdownParams = [
      ...userOrderParams,
      ...remDateInfo.params,
      ...txDateInfo.params,
    ];

    if (specificUserId) {
      userBreakdownQuery += ` WHERE u.id = ?`;
      userBreakdownParams.push(specificUserId);
    } else {
      // Order by highest freight spend or order count
      userBreakdownQuery += ` ORDER BY COALESCE(ord.freight_spent, 0) DESC, COALESCE(ord.orders_count, 0) DESC, u.id DESC`;
    }

    // 6. TIME-SERIES TREND (Daily if <= 31 days, otherwise Monthly)
    const isDaily = timeRange === "today" || timeRange === "yesterday" || timeRange === "7days" || timeRange === "30days";
    const groupFormat = isDaily ? "%Y-%m-%d" : "%Y-%m";
    const labelFormat = isDaily ? "%d %b" : "%b %Y";

    let trendQuery = `
      SELECT
        DATE_FORMAT(o.created_at, '${groupFormat}') AS period_key,
        DATE_FORMAT(o.created_at, '${labelFormat}') AS period_label,
        COUNT(o.id) AS orders_count,
        COALESCE(SUM(
          COALESCE(
            (SELECT m.shipping_charge FROM manifests m WHERE m.order_id = o.id AND m.user_id = o.user_id ORDER BY m.id DESC LIMIT 1),
            0
          )
        ), 0) AS freight_revenue
      FROM orders o
      WHERE ${orderWhereSql}
      GROUP BY period_key, period_label
      ORDER BY period_key ASC
    `;

    // 7. ZONE DISTRIBUTION
    const zoneQuery = `
      SELECT
        UPPER(TRIM(COALESCE(m.zone, 'Other'))) AS zone_name,
        COUNT(m.id) AS count,
        COALESCE(SUM(m.shipping_charge), 0) AS freight
      FROM manifests m
      INNER JOIN orders o ON o.id = m.order_id
      WHERE ${orderWhereSql}
      GROUP BY zone_name
      ORDER BY count DESC
      LIMIT 10
    `;

    // 8. SERVICE TYPE (ROAD vs AIR)
    const serviceQuery = `
      SELECT
        UPPER(TRIM(COALESCE(m.service_type, 'ROAD'))) AS service_name,
        COUNT(m.id) AS count,
        COALESCE(SUM(m.shipping_charge), 0) AS freight
      FROM manifests m
      INNER JOIN orders o ON o.id = m.order_id
      WHERE ${orderWhereSql}
      GROUP BY service_name
      ORDER BY count DESC
    `;

    // Execute queries in parallel
    const [
      [orderSummaryRows],
      [codSummaryRows],
      [walletTxRows],
      [walletHoldRows],
      [userRows],
      [trendRows],
      [zoneRows],
      [serviceRows],
    ] = await Promise.all([
      db.query(orderSummaryQuery, orderParams),
      db.query(codSummaryQuery, remParams),
      db.query(walletTxQuery, txParams),
      db.query(walletHoldQuery, walletHoldParams),
      db.query(userBreakdownQuery, userBreakdownParams),
      db.query(trendQuery, orderParams),
      db.query(zoneQuery, orderParams),
      db.query(serviceQuery, orderParams),
    ]);

    const orderStats = orderSummaryRows[0] || {};
    const codStats = codSummaryRows[0] || {};
    const txStats = walletTxRows[0] || {};
    const walletHold = walletHoldRows[0] || {};

    const totalOrders = Number(orderStats.total_orders || 0);
    const deliveredOrders = Number(orderStats.delivered_orders || 0);
    const inTransitOrders = Number(orderStats.in_transit_orders || 0);
    const processingOrders = Number(orderStats.processing_orders || 0);
    const rtoOrders = Number(orderStats.rto_orders || 0);
    const cancelledOrders = Number(orderStats.cancelled_orders || 0);

    const codOrders = Number(orderStats.cod_orders || 0);
    const prepaidOrders = Number(orderStats.prepaid_orders || 0);

    const totalRevenue = Number(orderStats.total_freight_revenue || 0);
    const totalCODRemitted = Number(codStats.total_cod_remitted || 0);
    const pendingCODRemittance = Number(codStats.pending_cod_remittance || 0);
    const totalRechargeInflow = Number(txStats.total_recharge_inflow || 0);
    const currentWalletHolding = Number(walletHold.total_wallet_balance || 0);
    const totalCODOrderValue = Number(orderStats.total_cod_order_value || 0);

    // Business rates
    const resolvedOrders = deliveredOrders + rtoOrders + cancelledOrders;
    const deliverySuccessRate = resolvedOrders > 0 ? Number(((deliveredOrders / resolvedOrders) * 100).toFixed(1)) : 0;
    const rtoRate = resolvedOrders > 0 ? Number(((rtoOrders / resolvedOrders) * 100).toFixed(1)) : 0;
    const avgOrderFreight = totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0;

    // Estimated gross platform profit (average ~18% logistics aggregator spread)
    const estimatedProfit = Number((totalRevenue * 0.18).toFixed(2));

    const kpis = {
      totalRevenue,
      estimatedProfit,
      totalOrders,
      deliveredOrders,
      inTransitOrders,
      processingOrders,
      rtoOrders,
      cancelledOrders,
      deliverySuccessRate,
      rtoRate,
      codOrders,
      prepaidOrders,
      totalCODRemitted,
      pendingCODRemittance,
      remittedPayoutCount: Number(codStats.remitted_payout_count || 0),
      pendingPayoutCount: Number(codStats.pending_payout_count || 0),
      totalRechargeInflow,
      currentWalletHolding,
      totalCODOrderValue,
      avgOrderFreight,
    };

    // Format user breakdown list
    const userBreakdown = (userRows || []).map((u) => {
      const orders = Number(u.orders_count || 0);
      const delivered = Number(u.delivered_count || 0);
      const rto = Number(u.rto_count || 0);
      const freight = Number(u.freight_spent || 0);
      const remitted = Number(u.cod_remitted || 0);
      const pending = Number(u.cod_pending || 0);
      const recharged = Number(u.total_recharged || 0);
      const balance = Number(u.current_wallet_balance || 0);
      const profit = Number((freight * 0.18).toFixed(2));
      const res = delivered + rto;
      const rate = res > 0 ? Number(((delivered / res) * 100).toFixed(1)) : 0;

      return {
        userId: u.user_id,
        name: u.full_name || "—",
        company: u.company_name || "Individual",
        email: u.email || "—",
        phone: u.phone_no || "—",
        registeredAt: u.registered_at,
        ordersCount: orders,
        deliveredCount: delivered,
        rtoCount: rto,
        successRate: rate,
        freightSpent: freight,
        codRemitted: remitted, // Paisa nikala
        codPending: pending,   // Nikalna baki
        totalRecharged: recharged,
        currentWalletBalance: balance,
        estimatedProfit: profit,
      };
    });

    return res.status(200).json({
      success: true,
      timeRange,
      filters: {
        userId,
        paymentType,
        status,
        startDate,
        endDate,
      },
      kpis,
      trend: trendRows || [],
      zoneDistribution: zoneRows || [],
      serviceDistribution: serviceRows || [],
      userBreakdown,
    });
  } catch (error) {
    console.error("Business Analytics Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to calculate business analytics",
    });
  }
};

// ======================================================
// GET USER LIST FOR FILTER DROPDOWN
// ======================================================

const getUsersList = async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT
        id,
        full_name,
        company_name,
        email,
        phone_no
      FROM users
      ORDER BY full_name ASC
    `);

    return res.status(200).json({
      success: true,
      users: users || [],
    });
  } catch (error) {
    console.error("Get Users List Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users list",
    });
  }
};

module.exports = {
  getBusinessSummary,
  getUsersList,
};
