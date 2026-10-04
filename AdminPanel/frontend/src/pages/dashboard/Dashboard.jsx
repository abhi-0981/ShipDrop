import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineArrowRight,
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineTicket,
  HiOutlineUsers,
  HiOutlineEye,
  HiOutlineCurrencyRupee,
  HiOutlineCube,
} from "react-icons/hi";

import { API_BASE_URL } from "../../config/api";

/* =========================================================
   HELPERS
========================================================= */

const money = (value) => {
  const number = Number(value || 0);

  return `₹${number.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
};

const number = (value) => {
  return Number(value || 0).toLocaleString("en-IN");
};

const dateFormat = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeStatus = (value) => {
  const status = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/_/g, " ");

  const map = {
    PROCESSING: "Processing",
    MANIFESTED: "Manifested",
    "NOT PICKED": "Not Picked",
    "IN TRANSIT": "In Transit",
    "OUT FOR DELIVERY": "Out For Delivery",
    DELIVERED: "Delivered",
    "RTO IN TRANSIT": "RTO In Transit",
    "RTO DELIVERED": "RTO Delivered",
    RTO: "RTO",
    RETURNED: "Returned",
    CANCELLED: "Cancelled",
    CANCELED: "Cancelled",
    PENDING: "Pending",
    NDR: "NDR",
  };

  return map[status] || value || "Pending";
};

const statusClass = (status) => {
  const value = normalizeStatus(status);

  if (value === "Delivered") {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }

  if (value === "In Transit" || value === "Out For Delivery") {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  if (value === "Processing" || value === "Manifested") {
    return "bg-violet-50 text-violet-700 border-violet-100";
  }

  if (value === "Not Picked" || value === "Pending") {
    return "bg-amber-50 text-amber-700 border-amber-100";
  }

  if (
    value === "RTO" ||
    value === "RTO In Transit" ||
    value === "RTO Delivered" ||
    value === "Returned"
  ) {
    return "bg-orange-50 text-orange-700 border-orange-100";
  }

  if (value === "Cancelled" || value === "NDR") {
    return "bg-red-50 text-red-700 border-red-100";
  }

  return "bg-slate-50 text-slate-600 border-slate-100";
};

/* =========================================================
   KPI CARD
========================================================= */

function StatCard({ title, value, subtitle, icon: Icon, iconBg, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group
        text-left
        bg-white
        border border-slate-200
        rounded-2xl
        p-4
        hover:border-[#008dd2]/30
        hover:shadow-[0_12px_35px_rgba(15,23,42,0.06)]
        transition-all
        duration-200
      "
    >
      <div className="flex items-start justify-between">
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center ${iconBg}`}
        >
          <Icon size={19} />
        </div>

        <HiOutlineArrowRight
          size={15}
          className="
            text-slate-300
            group-hover:text-[#008dd2]
            group-hover:translate-x-0.5
            transition
          "
        />
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-medium text-slate-400">{title}</p>

        <p className="mt-1 text-[25px] font-bold tracking-tight text-slate-900">
          {value}
        </p>

        <p className="mt-1.5 text-[10px] text-slate-400">{subtitle}</p>
      </div>
    </button>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [data, setData] = useState({
    counts: {},
    orders: [],
    totalUsers: 0,
    totalCharges: 0,
    recentTickets: [],
  });

  /* =======================================================
     FETCH DASHBOARD
  ======================================================= */

  const fetchDashboard = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
        method: "GET",

        headers: {
          "Content-Type": "application/json",

          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },
      });

      let result = {};

      try {
        result = await response.json();
      } catch {
        result = {};
      }

      /*
        IMPORTANT:

        Do NOT remove adminToken here.

        API failure != logout.

        This was causing:
        Dashboard API error
        -> token deleted
        -> every click -> /login
      */

      if (!response.ok) {
        throw new Error(
          result?.message || `Dashboard request failed (${response.status})`,
        );
      }

      if (result?.success === false) {
        throw new Error(result?.message || "Unable to load dashboard");
      }

      setData({
        counts: result?.counts || {},

        orders: Array.isArray(result?.orders) ? result.orders : [],

        totalUsers: Number(result?.totalUsers || 0),

        totalCharges: Number(result?.totalCharges || 0),

        recentTickets: Array.isArray(result?.recentTickets)
          ? result.recentTickets
          : [],
      });
    } catch (err) {
      console.error("ADMIN DASHBOARD ERROR:", err);

      setError(err?.message || "Unable to load dashboard");
    } finally {
      setLoading(false);

      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard(false);
  }, []);

  /* =======================================================
     COUNTS
  ======================================================= */

  const counts = data.counts || {};

  const count = (...keys) => {
    for (const key of keys) {
      if (counts[key] !== undefined && counts[key] !== null) {
        return Number(counts[key]) || 0;
      }
    }

    return 0;
  };

  const totalOrders = count("all_orders", "All", "ALL", "total");

  const processing = count("processing", "Processing");

  const manifested = count("manifested", "Manifested");

  const notPicked = count("not_picked", "Not Picked");

  const inTransit = count("in_transit", "In Transit");

  const outForDelivery = count("out_for_delivery", "Out For Delivery");

  const delivered = count("delivered", "Delivered");

  const rtoInTransit = count("rto_in_transit", "RTO In Transit");

  const rtoDelivered = count("rto_delivered", "RTO Delivered");

  const rto = rtoInTransit + rtoDelivered;

  const pending = count("pending", "Pending");

  const cancelled = count("cancelled", "Cancelled");

  const returned = count("returned", "Returned");

  const ndr = count("ndr", "NDR");

  const deliveryRate =
    totalOrders > 0 ? Math.round((delivered / totalOrders) * 100) : 0;

  /* =======================================================
     ORDERS SEARCH
  ======================================================= */

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    const list = Array.isArray(data.orders) ? data.orders : [];

    if (!query) {
      return list.slice(0, 7);
    }

    return list
      .filter((order) => {
        const values = [
          order?.order_id,

          order?.orderId,

          order?.id,

          order?.customer_name,

          order?.customerName,

          order?.consignee_name,

          order?.name,

          order?.status,

          order?.tracking_status,

          order?.city,

          order?.state,
        ];

        return values.some(
          (value) => value && String(value).toLowerCase().includes(query),
        );
      })
      .slice(0, 7);
  }, [data.orders, search]);

  /* =======================================================
     CHART DATA
  ======================================================= */

  const monthlyData = useMemo(() => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const result = months.map((month) => ({
      month,
      orders: 0,
    }));

    for (const order of data.orders) {
      const raw = order?.created_at || order?.createdAt || order?.order_date;

      if (!raw) continue;

      const date = new Date(raw);

      if (Number.isNaN(date.getTime())) {
        continue;
      }

      const month = date.getMonth();

      result[month].orders += 1;
    }

    return result;
  }, [data.orders]);

  /* =======================================================
     PIE DATA
  ======================================================= */

  const pieData = [
    {
      name: "Delivered",
      value: deliveryRate,
    },
    {
      name: "Remaining",
      value: Math.max(0, 100 - deliveryRate),
    },
  ];

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8fb] p-5 lg:p-7">
        <div className="animate-pulse space-y-5">
          <div className="h-9 w-56 bg-slate-200 rounded-lg" />

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {Array.from({
              length: 5,
            }).map((_, index) => (
              <div
                key={index}
                className="h-32 rounded-2xl bg-white border border-slate-200"
              />
            ))}
          </div>

          <div className="grid xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 h-[330px] rounded-2xl bg-white border border-slate-200" />

            <div className="h-[330px] rounded-2xl bg-white border border-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="bg-white border-b border-slate-200">
        <div className="px-5 lg:px-7 py-5">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#008dd2]">
                Overview
              </p>

              <h1 className="mt-1 text-[25px] font-bold tracking-tight text-slate-900">
                Dashboard
              </h1>

              <p className="mt-1 text-xs text-slate-400">
                Monitor your shipping operations and business performance.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* SEARCH */}

              <div className="hidden md:flex h-10 w-[270px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
                <HiOutlineSearch size={17} className="text-slate-400" />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search orders..."
                  className="
                    w-full
                    bg-transparent
                    outline-none
                    text-xs
                    text-slate-700
                    placeholder:text-slate-400
                  "
                />
              </div>

              {/* REFRESH */}

              <button
                type="button"
                onClick={() => fetchDashboard(true)}
                disabled={refreshing}
                className="
                  h-10
                  px-3
                  rounded-xl
                  border border-slate-200
                  bg-white
                  text-slate-600
                  hover:bg-slate-50
                  flex items-center gap-2
                  text-xs
                  font-semibold
                  transition
                "
              >
                <HiOutlineRefresh
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ===================================================
          MAIN
      =================================================== */}

      <main className="p-5 lg:p-7 space-y-5">
        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <HiOutlineExclamation size={19} className="text-amber-600" />

              <div>
                <p className="text-xs font-bold text-amber-800">
                  Dashboard data unavailable
                </p>

                <p className="text-[11px] text-amber-600 mt-0.5">{error}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fetchDashboard(false)}
              className="text-xs font-bold text-amber-700 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* =================================================
            MAIN KPI
        ================================================= */}

        <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard
            title="Total Orders"
            value={number(totalOrders)}
            subtitle="All shipments"
            icon={HiOutlineClipboardList}
            iconBg="bg-[#008dd2]/10 text-[#008dd2]"
            onClick={() => navigate("/orders")}
          />

          <StatCard
            title="Processing"
            value={number(processing)}
            subtitle="Awaiting processing"
            icon={HiOutlineClock}
            iconBg="bg-violet-50 text-violet-600"
            onClick={() => navigate("/orders")}
          />

          <StatCard
            title="In Transit"
            value={number(inTransit)}
            subtitle="Currently moving"
            icon={HiOutlineTruck}
            iconBg="bg-blue-50 text-blue-600"
            onClick={() => navigate("/orders")}
          />

          <StatCard
            title="Delivered"
            value={number(delivered)}
            subtitle={`${deliveryRate}% delivery rate`}
            icon={HiOutlineCheckCircle}
            iconBg="bg-emerald-50 text-emerald-600"
            onClick={() => navigate("/orders")}
          />

          <StatCard
            title="RTO"
            value={number(rto)}
            subtitle="Return shipments"
            icon={HiOutlineRefresh}
            iconBg="bg-orange-50 text-orange-600"
            onClick={() => navigate("/orders")}
          />
        </section>

        {/* =================================================
            SMALL METRICS
        ================================================= */}

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Manifested</span>

              <span className="text-xs font-bold text-violet-600">
                {number(manifested)}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Out For Delivery
              </span>

              <span className="text-xs font-bold text-blue-600">
                {number(outForDelivery)}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Not Picked</span>

              <span className="text-xs font-bold text-amber-600">
                {number(notPicked)}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Shipping Charges
              </span>

              <span className="text-xs font-bold text-[#008dd2]">
                {money(data.totalCharges)}
              </span>
            </div>
          </div>
        </section>

        {/* =================================================
            CHART SECTION
        ================================================= */}

        <section className="grid xl:grid-cols-3 gap-5">
          {/* ORDER / REVENUE INSIGHT */}

          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Shipment Insights
                </h2>

                <p className="text-[11px] text-slate-400 mt-1">
                  Monthly shipment activity
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#008dd2]" />

                <span className="text-[10px] font-semibold text-slate-500">
                  Orders
                </span>
              </div>
            </div>

            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyData}
                  margin={{
                    top: 5,
                    right: 5,
                    left: -20,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="shipDropArea"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#008dd2"
                        stopOpacity={0.22}
                      />

                      <stop offset="100%" stopColor="#008dd2" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid vertical={false} stroke="#eef2f6" />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 10,
                      fill: "#94a3b8",
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 10,
                      fill: "#94a3b8",
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 12px 30px rgba(15,23,42,.08)",
                      fontSize: "11px",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#008dd2"
                    strokeWidth={2.5}
                    fill="url(#shipDropArea)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DELIVERY */}

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Delivery Performance
                </h2>

                <p className="text-[11px] text-slate-400 mt-1">
                  Delivered shipments
                </p>
              </div>

              <div className="h-8 w-8 rounded-lg bg-[#008dd2]/10 flex items-center justify-center text-[#008dd2]">
                <HiOutlineCheckCircle size={17} />
              </div>
            </div>

            <div className="relative h-[205px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="58%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={68}
                    outerRadius={88}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#008dd2" />

                    <Cell fill="#e8eef3" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute top-[102px] text-center">
                <p className="text-[30px] font-bold tracking-tight text-slate-900">
                  {deliveryRate}%
                </p>

                <p className="text-[10px] text-slate-400">Delivery Rate</p>
              </div>
            </div>

            <div className="grid grid-cols-2 border-t border-slate-100 pt-4">
              <div>
                <p className="text-[10px] text-slate-400">Delivered</p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  {number(delivered)}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400">Remaining</p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  {number(Math.max(0, totalOrders - delivered))}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            RECENT ORDERS
        ================================================= */}

        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Recent Orders
              </h2>

              <p className="text-[11px] text-slate-400 mt-1">
                Latest shipment activity
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="
                flex
                items-center
                gap-1.5
                text-[11px]
                font-bold
                text-[#008dd2]
                hover:gap-2.5
                transition-all
              "
            >
              View All
              <HiOutlineArrowRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="px-5 py-3 text-left text-[9px] uppercase tracking-wider font-bold text-slate-400">
                    Order ID
                  </th>

                  <th className="px-4 py-3 text-left text-[9px] uppercase tracking-wider font-bold text-slate-400">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-left text-[9px] uppercase tracking-wider font-bold text-slate-400">
                    Date
                  </th>

                  <th className="px-4 py-3 text-left text-[9px] uppercase tracking-wider font-bold text-slate-400">
                    Status
                  </th>

                  <th className="px-4 py-3 text-right text-[9px] uppercase tracking-wider font-bold text-slate-400">
                    Charge
                  </th>

                  <th className="px-5 py-3 text-right text-[9px] uppercase tracking-wider font-bold text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center">
                      <HiOutlineCube
                        size={28}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        No recent orders
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order, index) => {
                    const orderId =
                      order?.order_id || order?.orderId || order?.id || "-";

                    const customer =
                      order?.customer_name ||
                      order?.customerName ||
                      order?.consignee_name ||
                      order?.name ||
                      "Customer";

                    const status = normalizeStatus(
                      order?.tracking_status || order?.status,
                    );

                    const charge =
                      order?.charge ??
                      order?.shipping_charge ??
                      order?.shippingCharge ??
                      0;

                    return (
                      <tr
                        key={order?.id || order?.order_id || index}
                        className="hover:bg-slate-50/60 transition"
                      >
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-bold text-slate-800">
                            #{orderId}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="text-xs text-slate-600">
                            {customer}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="text-[11px] text-slate-400">
                            {dateFormat(
                              order?.created_at ||
                                order?.createdAt ||
                                order?.order_date,
                            )}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`
                                inline-flex
                                items-center
                                px-2.5
                                py-1
                                rounded-lg
                                border
                                text-[9px]
                                font-bold
                                ${statusClass(status)}
                              `}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <span className="text-xs font-semibold text-slate-700">
                            {money(charge)}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => navigate("/orders")}
                            title="View order"
                            className="
                                h-8
                                w-8
                                inline-flex
                                items-center
                                justify-center
                                rounded-lg
                                text-slate-400
                                hover:text-[#008dd2]
                                hover:bg-[#008dd2]/10
                                transition
                              "
                          >
                            <HiOutlineEye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* =================================================
            LOWER SECTION
        ================================================= */}

        <section className="grid lg:grid-cols-2 gap-5">
          {/* SHIPMENT STATUS */}

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Shipment Status
                </h2>

                <p className="text-[11px] text-slate-400 mt-1">
                  Current order distribution
                </p>
              </div>

              <HiOutlineTruck size={19} className="text-[#008dd2]" />
            </div>

            <div className="space-y-4">
              {[
                ["Processing", processing],
                ["Manifested", manifested],
                ["In Transit", inTransit],
                ["Out For Delivery", outForDelivery],
                ["Delivered", delivered],
                ["RTO", rto],
              ].map(([name, value]) => {
                const percentage =
                  totalOrders > 0
                    ? Math.min(100, Math.round((value / totalOrders) * 100))
                    : 0;

                return (
                  <div key={name}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[11px] font-medium text-slate-500">
                        {name}
                      </span>

                      <span className="text-[11px] font-bold text-slate-800">
                        {number(value)}
                      </span>
                    </div>

                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#008dd2] transition-all"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ATTENTION */}

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Attention Required
                </h2>

                <p className="text-[11px] text-slate-400 mt-1">
                  Shipments and issues needing attention
                </p>
              </div>

              <HiOutlineExclamation size={19} className="text-amber-500" />
            </div>

            <div className="space-y-2.5">
              {/* NOT PICKED */}

              <button
                type="button"
                onClick={() => navigate("/orders")}
                className="
                  w-full
                  flex
                  items-center
                  justify-between
                  p-3
                  rounded-xl
                  bg-amber-50/60
                  border border-amber-100
                  hover:bg-amber-50
                  transition
                "
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                    <HiOutlineClock size={17} />
                  </div>

                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800">
                      Not Picked
                    </p>

                    <p className="text-[10px] text-slate-400">
                      Pickup requires attention
                    </p>
                  </div>
                </div>

                <span className="text-sm font-bold text-amber-600">
                  {number(notPicked)}
                </span>
              </button>

              {/* PENDING */}

              <button
                type="button"
                onClick={() => navigate("/orders")}
                className="
                  w-full
                  flex
                  items-center
                  justify-between
                  p-3
                  rounded-xl
                  bg-slate-50
                  border border-slate-100
                  hover:bg-slate-100
                  transition
                "
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-500">
                    <HiOutlineClock size={17} />
                  </div>

                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800">Pending</p>

                    <p className="text-[10px] text-slate-400">
                      Orders waiting for action
                    </p>
                  </div>
                </div>

                <span className="text-sm font-bold text-slate-700">
                  {number(pending)}
                </span>
              </button>

              {/* NDR */}

              <button
                type="button"
                onClick={() => navigate("/orders")}
                className="
                  w-full
                  flex
                  items-center
                  justify-between
                  p-3
                  rounded-xl
                  bg-red-50/60
                  border border-red-100
                  hover:bg-red-50
                  transition
                "
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                    <HiOutlineExclamation size={17} />
                  </div>

                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800">NDR</p>

                    <p className="text-[10px] text-slate-400">
                      Delivery exceptions
                    </p>
                  </div>
                </div>

                <span className="text-sm font-bold text-red-600">
                  {number(ndr)}
                </span>
              </button>

              {/* TICKETS */}

              <button
                type="button"
                onClick={() => navigate("/tickets")}
                className="
                  w-full
                  flex
                  items-center
                  justify-between
                  p-3
                  rounded-xl
                  bg-blue-50/60
                  border border-blue-100
                  hover:bg-blue-50
                  transition
                "
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <HiOutlineTicket size={17} />
                  </div>

                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800">
                      Support Tickets
                    </p>

                    <p className="text-[10px] text-slate-400">
                      Recent customer issues
                    </p>
                  </div>
                </div>

                <span className="text-sm font-bold text-blue-600">
                  {number(data.recentTickets.length)}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="flex items-center justify-between px-1 pb-2">
          <p className="text-[10px] text-slate-400">ShipDrop Admin</p>

          <p className="text-[10px] text-slate-400">
            Shipping operations overview
          </p>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
