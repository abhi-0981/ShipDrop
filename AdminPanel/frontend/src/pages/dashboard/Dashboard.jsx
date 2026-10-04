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
  HiOutlineArrowUp,
  HiOutlineArrowRight,
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineRefresh as HiRto,
  HiOutlineExclamation,
  HiOutlineTicket,
  HiOutlineUsers,
  HiOutlineEye,
} from "react-icons/hi";

import { API_BASE_URL } from "../../config/api";

const STATUS_ORDER = [
  "Processing",
  "Manifested",
  "Not Picked",
  "In Transit",
  "Out For Delivery",
  "Delivered",
  "RTO",
  "Returned",
  "Cancelled",
  "Pending",
];

function formatMoney(value) {
  const number = Number(value || 0);

  return `₹${number.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeStatus(status) {
  if (!status) return "Pending";

  const value = String(status).trim().toLowerCase();

  const map = {
    processing: "Processing",
    manifested: "Manifested",
    "not picked": "Not Picked",
    not_picked: "Not Picked",
    "in transit": "In Transit",
    in_transit: "In Transit",
    "out for delivery": "Out For Delivery",
    out_for_delivery: "Out For Delivery",
    delivered: "Delivered",
    rto: "RTO",
    returned: "Returned",
    cancelled: "Cancelled",
    canceled: "Cancelled",
    pending: "Pending",
  };

  return map[value] || status;
}

function getStatusClasses(status) {
  switch (normalizeStatus(status)) {
    case "Delivered":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";

    case "In Transit":
    case "Out For Delivery":
      return "bg-blue-50 text-blue-700 border-blue-100";

    case "Processing":
    case "Manifested":
      return "bg-violet-50 text-violet-700 border-violet-100";

    case "Not Picked":
    case "Pending":
      return "bg-amber-50 text-amber-700 border-amber-100";

    case "RTO":
    case "Returned":
      return "bg-orange-50 text-orange-700 border-orange-100";

    case "Cancelled":
      return "bg-red-50 text-red-700 border-red-100";

    default:
      return "bg-slate-50 text-slate-600 border-slate-100";
  }
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  onClick,
  danger = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left bg-white border border-slate-200 rounded-2xl p-4 hover:border-slate-300 hover:shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition-all"
    >
      <div className="flex items-start justify-between">
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center ${
            danger ? "bg-red-50 text-red-500" : "bg-[#008dd2]/10 text-[#008dd2]"
          }`}
        >
          <Icon size={20} />
        </div>

        <HiOutlineArrowRight
          size={16}
          className="text-slate-300 group-hover:text-[#008dd2] transition"
        />
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-slate-500">{title}</p>

        <p className="mt-1 text-[25px] leading-none font-bold tracking-tight text-slate-900">
          {value}
        </p>

        {subtitle && (
          <p className="mt-2 text-[11px] text-slate-400">{subtitle}</p>
        )}
      </div>
    </button>
  );
}

function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [data, setData] = useState({
    counts: {},
    orders: [],
    totalUsers: 0,
    totalCharges: 0,
    recentTickets: [],
  });

  const [search, setSearch] = useState("");

  const fetchDashboard = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("admin");
          navigate("/login");
          return;
        }

        throw new Error("Unable to load dashboard");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Unable to load dashboard");
      }

      setData({
        counts: result.counts || {},
        orders: Array.isArray(result.orders) ? result.orders : [],
        totalUsers: Number(result.totalUsers || 0),
        totalCharges: Number(result.totalCharges || 0),
        recentTickets: Array.isArray(result.recentTickets)
          ? result.recentTickets
          : [],
      });
    } catch (err) {
      console.error("Dashboard error:", err);

      setError(err.message || "Unable to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const counts = data.counts || {};

  const getCount = (key) => {
    return Number(counts[key] ?? counts[key?.toLowerCase()] ?? 0);
  };

  const totalOrders = getCount("all_orders");

  const processing = getCount("processing");

  const manifested = getCount("manifested");

  const notPicked = getCount("not_picked");

  const inTransit = getCount("in_transit");

  const outForDelivery = getCount("out_for_delivery");

  const delivered = getCount("delivered");

  const rto =
    getCount("rto_in_transit") + getCount("rto_delivered") + getCount("rto");

  const returned = getCount("returned");

  const cancelled = getCount("cancelled");

  const pending = getCount("pending");

  const deliveryPercentage = totalOrders
    ? Math.min(100, Math.round((delivered / totalOrders) * 100))
    : 0;

  const shipmentData = useMemo(() => {
    return [
      {
        name: "Processing",
        value: processing,
      },
      {
        name: "Manifested",
        value: manifested,
      },
      {
        name: "In Transit",
        value: inTransit,
      },
      {
        name: "OFD",
        value: outForDelivery,
      },
      {
        name: "Delivered",
        value: delivered,
      },
      {
        name: "RTO",
        value: rto,
      },
    ];
  }, [processing, manifested, inTransit, outForDelivery, delivered, rto]);

  const trendData = useMemo(() => {
    const grouped = {};

    data.orders.forEach((order) => {
      const date =
        order.created_at ||
        order.createdAt ||
        order.order_date ||
        order.createdAt;

      if (!date) return;

      const parsed = new Date(date);

      if (Number.isNaN(parsed.getTime())) return;

      const month = parsed.toLocaleDateString("en-IN", {
        month: "short",
      });

      grouped[month] = (grouped[month] || 0) + 1;
    });

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

    return months.map((month) => ({
      month,
      orders: grouped[month] || 0,
    }));
  }, [data.orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return data.orders.slice(0, 7);
    }

    return data.orders
      .filter((order) => {
        const values = [
          order.order_id,
          order.orderId,
          order.customer_name,
          order.customerName,
          order.name,
          order.status,
          order.destination,
          order.city,
        ];

        return values.some(
          (value) => value && String(value).toLowerCase().includes(query),
        );
      })
      .slice(0, 7);
  }, [data.orders, search]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8fb] p-5 lg:p-7">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-52 bg-slate-200 rounded-lg" />

          <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-32 bg-white rounded-2xl border border-slate-200"
              />
            ))}
          </div>

          <div className="grid xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 h-80 bg-white rounded-2xl border border-slate-200" />

            <div className="h-80 bg-white rounded-2xl border border-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="border-b border-slate-200 bg-white">
        <div className="px-5 lg:px-7 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#008dd2]">
                Overview
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Dashboard
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Monitor your shipping operations and order activity.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center h-10 w-64 rounded-xl border border-slate-200 bg-slate-50 px-3 gap-2">
                <HiOutlineSearch
                  size={18}
                  className="text-slate-400 shrink-0"
                />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search orders..."
                  className="w-full bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
                />
              </div>

              <button
                type="button"
                onClick={() => fetchDashboard(true)}
                disabled={refreshing}
                className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition flex items-center gap-2 text-sm font-semibold"
              >
                <HiOutlineRefresh
                  size={17}
                  className={refreshing ? "animate-spin" : ""}
                />

                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="p-5 lg:p-7 space-y-5">
        {/* ERROR */}

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <HiOutlineExclamation size={20} className="text-red-500" />

              <p className="text-sm text-red-600">{error}</p>
            </div>

            <button
              onClick={() => fetchDashboard()}
              className="text-sm font-semibold text-red-600 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* =====================================================
            KPI CARDS
        ===================================================== */}

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard
            title="Total Orders"
            value={totalOrders.toLocaleString("en-IN")}
            subtitle="All shipments"
            icon={HiOutlineClipboardList}
            onClick={() => navigate("/orders")}
          />

          <StatCard
            title="Processing"
            value={processing.toLocaleString("en-IN")}
            subtitle="Orders awaiting processing"
            icon={HiOutlineClock}
            onClick={() => navigate("/orders")}
          />

          <StatCard
            title="In Transit"
            value={inTransit.toLocaleString("en-IN")}
            subtitle="Currently moving"
            icon={HiOutlineTruck}
            onClick={() => navigate("/orders")}
          />

          <StatCard
            title="Delivered"
            value={delivered.toLocaleString("en-IN")}
            subtitle={`${deliveryPercentage}% of total orders`}
            icon={HiOutlineCheckCircle}
            onClick={() => navigate("/orders")}
          />

          <StatCard
            title="RTO"
            value={rto.toLocaleString("en-IN")}
            subtitle="Return shipments"
            icon={HiRto}
            danger={rto > 0}
            onClick={() => navigate("/orders")}
          />
        </div>

        {/* =====================================================
            SECONDARY STATS
        ===================================================== */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Manifested</span>

              <span className="text-xs font-semibold text-violet-600">
                {manifested}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Out For Delivery</span>

              <span className="text-xs font-semibold text-blue-600">
                {outForDelivery}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Not Picked</span>

              <span className="text-xs font-semibold text-amber-600">
                {notPicked}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Total Charges</span>

              <span className="text-xs font-semibold text-[#008dd2]">
                {formatMoney(data.totalCharges)}
              </span>
            </div>
          </div>
        </div>

        {/* =====================================================
            CHARTS
        ===================================================== */}

        <div className="grid xl:grid-cols-3 gap-5">
          {/* ORDER TREND */}

          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Shipment Overview
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  Order activity overview
                </p>
              </div>

              <span className="text-xs font-semibold text-[#008dd2] bg-[#008dd2]/10 px-2.5 py-1 rounded-lg">
                Orders
              </span>
            </div>

            <div className="h-[270px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient
                      id="ordersGradient"
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

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#eef2f6"
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "#94a3b8",
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "#94a3b8",
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#008dd2"
                    strokeWidth={2.5}
                    fill="url(#ordersGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DELIVERY PERFORMANCE */}

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Delivery Performance
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  Delivered vs total shipments
                </p>
              </div>
            </div>

            <div className="relative h-[220px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: "Delivered",
                        value: deliveryPercentage,
                      },
                      {
                        name: "Remaining",
                        value: 100 - deliveryPercentage,
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={70}
                    outerRadius={92}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#008dd2" />

                    <Cell fill="#e8eef3" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute top-[105px] text-center">
                <p className="text-3xl font-bold text-slate-900">
                  {deliveryPercentage}%
                </p>

                <p className="text-[11px] text-slate-400 mt-1">Delivered</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-slate-400">Delivered</p>

                <p className="text-lg font-bold text-slate-900">
                  {delivered.toLocaleString("en-IN")}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400">Remaining</p>

                <p className="text-lg font-bold text-slate-900">
                  {Math.max(0, totalOrders - delivered).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            RECENT ORDERS
        ===================================================== */}

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Recent Orders
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Latest shipment activity
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="flex items-center gap-1.5 text-xs font-bold text-[#008dd2] hover:gap-2.5 transition-all"
            >
              View All
              <HiOutlineArrowRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Order
                  </th>

                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Customer
                  </th>

                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Date
                  </th>

                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Status
                  </th>

                  <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Charge
                  </th>

                  <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-12 text-center">
                      <HiOutlineClipboardList
                        size={30}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-2 text-sm font-semibold text-slate-500">
                        No orders found
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order, index) => {
                    const orderId =
                      order.order_id || order.orderId || order.id || "-";

                    const customer =
                      order.customer_name ||
                      order.customerName ||
                      order.name ||
                      order.username ||
                      "Customer";

                    const status = normalizeStatus(order.status);

                    const charge =
                      order.charge ??
                      order.shipping_charge ??
                      order.shippingCharge ??
                      0;

                    return (
                      <tr
                        key={order.id || order.order_id || index}
                        className="hover:bg-slate-50/60 transition"
                      >
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-bold text-slate-800">
                            #{orderId}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="text-sm text-slate-600">
                            {customer}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="text-xs text-slate-500">
                            {formatDate(
                              order.created_at ||
                                order.createdAt ||
                                order.order_date,
                            )}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-bold ${getStatusClasses(
                              status,
                            )}`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <span className="text-sm font-semibold text-slate-700">
                            {formatMoney(charge)}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => navigate("/orders")}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-[#008dd2] hover:bg-[#008dd2]/10 transition"
                            title="View order"
                          >
                            <HiOutlineEye size={17} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* =====================================================
            BOTTOM OPERATIONS
        ===================================================== */}

        <div className="grid lg:grid-cols-2 gap-5">
          {/* SHIPMENT STATUS */}

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Shipment Status
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  Current order distribution
                </p>
              </div>

              <HiOutlineTruck size={20} className="text-[#008dd2]" />
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
                const percentage = totalOrders
                  ? Math.round((value / totalOrders) * 100)
                  : 0;

                return (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-slate-600">
                        {name}
                      </span>

                      <span className="text-xs font-bold text-slate-800">
                        {value.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#008dd2] transition-all"
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
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

                <p className="text-xs text-slate-400 mt-1">
                  Items that may need action
                </p>
              </div>

              <HiOutlineExclamation size={20} className="text-amber-500" />
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => navigate("/orders")}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-50/60 border border-amber-100 hover:bg-amber-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                    <HiOutlineClock size={18} />
                  </div>

                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800">
                      Not Picked
                    </p>

                    <p className="text-[11px] text-slate-400">
                      Pickup requires attention
                    </p>
                  </div>
                </div>

                <span className="text-sm font-bold text-amber-600">
                  {notPicked}
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/orders")}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center text-slate-500 border border-slate-100">
                    <HiOutlineClock size={18} />
                  </div>

                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800">Pending</p>

                    <p className="text-[11px] text-slate-400">
                      Orders waiting for action
                    </p>
                  </div>
                </div>

                <span className="text-sm font-bold text-slate-700">
                  {pending}
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/tickets")}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-50/60 border border-blue-100 hover:bg-blue-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <HiOutlineTicket size={18} />
                  </div>

                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800">
                      Support Tickets
                    </p>

                    <p className="text-[11px] text-slate-400">
                      Open customer issues
                    </p>
                  </div>
                </div>

                <span className="text-sm font-bold text-blue-600">
                  {data.recentTickets.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/users")}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 hover:bg-emerald-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <HiOutlineUsers size={18} />
                  </div>

                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800">
                      Total Users
                    </p>

                    <p className="text-[11px] text-slate-400">
                      Registered customers
                    </p>
                  </div>
                </div>

                <span className="text-sm font-bold text-emerald-600">
                  {data.totalUsers.toLocaleString("en-IN")}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-1 pb-2">
          <p className="text-[11px] text-slate-400">ShipDrop Admin Dashboard</p>

          <p className="text-[11px] text-slate-400">
            Shipping operations overview
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
