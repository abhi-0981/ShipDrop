import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiOutlineRefresh,
  HiOutlineClipboardList,
  HiOutlineUsers,
  HiOutlineTruck,
  HiOutlineCurrencyRupee,
  HiOutlineSearch,
  HiOutlineDownload,
  HiOutlineChevronDown,
  HiOutlineArrowUp,
  HiOutlineArrowRight,
  HiOutlineDotsHorizontal,
} from "react-icons/hi";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value || 0));

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeStatus = (status) =>
  String(status || "")
    .trim()
    .toUpperCase()
    .replace(/_/g, " ");

const statusConfig = {
  PROCESSING: {
    label: "Processing",
    className: "bg-amber-50/80 text-amber-700 border-amber-200/60",
    dot: "bg-amber-500",
  },
  MANIFESTED: {
    label: "Manifested",
    className: "bg-purple-50/80 text-purple-700 border-purple-200/60",
    dot: "bg-purple-500",
  },
  "NOT PICKED": {
    label: "Not Picked",
    className: "bg-rose-50/80 text-rose-600 border-rose-200/60",
    dot: "bg-rose-500",
  },
  "IN TRANSIT": {
    label: "In Transit",
    className: "bg-sky-50/80 text-sky-700 border-sky-200/60",
    dot: "bg-sky-500",
  },
  "OUT FOR DELIVERY": {
    label: "Out for Delivery",
    className: "bg-indigo-50/80 text-indigo-700 border-indigo-200/60",
    dot: "bg-indigo-500",
  },
  DELIVERED: {
    label: "Delivered",
    className: "bg-emerald-50/80 text-emerald-700 border-emerald-200/60",
    dot: "bg-emerald-500",
  },
  "RTO IN TRANSIT": {
    label: "RTO In Transit",
    className: "bg-orange-50/80 text-orange-700 border-orange-200/60",
    dot: "bg-orange-500",
  },
  "RTO DELIVERED": {
    label: "RTO Delivered",
    className: "bg-orange-50/80 text-orange-700 border-orange-200/60",
    dot: "bg-orange-500",
  },
  RETURNED: {
    label: "Returned",
    className: "bg-rose-50/80 text-rose-700 border-rose-200/60",
    dot: "bg-rose-500",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-slate-100 text-slate-600 border-slate-200/60",
    dot: "bg-slate-400",
  },
  PENDING: {
    label: "Pending",
    className: "bg-yellow-50/80 text-yellow-700 border-yellow-200/60",
    dot: "bg-yellow-500",
  },
};

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);
  const config =
    statusConfig[normalized] || {
      label: status || "Unknown",
      className: "bg-slate-50 text-slate-600 border-slate-200",
      dot: "bg-slate-400",
    };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold ${config.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

// -------------------------------------------------------------
// RADIAL SPEEDOMETER SEGMENTED GAUGE (Enterprise UI Polish)
// -------------------------------------------------------------
function SpeedometerGauge({ percentage = 70.8 }) {
  const totalBars = 20;
  const activeBars = Math.round((percentage / 100) * totalBars);

  return (
    <div className="relative flex flex-col items-center justify-center py-1">
      <div className="relative h-32 w-64 flex items-end justify-center overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-48 w-48">
            {Array.from({ length: totalBars }).map((_, index) => {
              const rotation = -135 + index * (270 / (totalBars - 1));
              const isActive = index < activeBars;
              return (
                <div
                  key={index}
                  className="absolute left-1/2 top-0 h-full w-1.5 -translate-x-1/2"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <div
                    className={`h-4.5 w-1.5 rounded-full transition-all duration-300 ${
                      isActive
                        ? "bg-[#008dd2] shadow-[0_0_8px_rgba(0,141,210,0.3)]"
                        : "bg-slate-200/80"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="z-10 pb-2 text-center">
          <span className="text-3xl font-black tracking-tight text-slate-900">
            {percentage}%
          </span>
          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Delivery Rate
          </p>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState({
    counts: {},
    orders: [],
    totalUsers: 0,
    totalCharges: 0,
    recentTickets: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("This Month");
  const [insightsView, setInsightsView] = useState("Monthly");
  const [searchTable, setSearchTable] = useState("");
  const [statusTableFilter, setStatusTableFilter] = useState("ALL");

  const fetchDashboard = useCallback(async () => {
    try {
      setError("");
      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_BASE}/admin/dashboard`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Unable to load dashboard data");
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
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const refreshDashboard = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const counts = data.counts || {};
  const totalOrders = Number(counts.All ?? counts.all_orders ?? 0);
  const delivered = Number(counts.Delivered ?? counts.delivered ?? 0);
  const inTransit = Number(counts["In Transit"] ?? counts.in_transit ?? 0);
  const outForDelivery = Number(
    counts["Out For Delivery"] ?? counts.out_for_delivery ?? 0
  );
  const activeShipments = inTransit + outForDelivery;

  const deliveryPercentage = useMemo(() => {
    if (!totalOrders) return 0;
    return Math.round((delivered / totalOrders) * 100);
  }, [delivered, totalOrders]);

  const filteredOrders = useMemo(() => {
    return data.orders.filter((order) => {
      const q = searchTable.trim().toLowerCase();
      const status = normalizeStatus(order.status);
      const matchesSearch =
        !q ||
        String(order.order_id || order.id || "").toLowerCase().includes(q) ||
        String(order.awb || "").toLowerCase().includes(q) ||
        String(order.customer_name || order.customer || "").toLowerCase().includes(q);

      const matchesStatus =
        statusTableFilter === "ALL" || status === statusTableFilter;

      return matchesSearch && matchesStatus;
    });
  }, [data.orders, searchTable, statusTableFilter]);

  const currentDateString = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  // 12-Month Bar representation matching screenshot
  const months = [
    { label: "Jan", height: "42%" },
    { label: "Feb", height: "55%" },
    { label: "Mar", height: "38%" },
    { label: "Apr", height: "68%" },
    { label: "May", height: "50%" },
    { label: "Jun", height: "82%" },
    {
      label: "Jul",
      height: "100%",
      active: true,
      amount: formatMoney(data.totalCharges || 52430),
    },
    { label: "Aug", height: "60%" },
    { label: "Sep", height: "72%" },
    { label: "Oct", height: "58%" },
    { label: "Nov", height: "65%" },
    { label: "Dec", height: "78%" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1500px] animate-pulse space-y-6">
          <div className="h-16 rounded-2xl bg-white shadow-2xs" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-white shadow-2xs" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="h-80 rounded-2xl bg-white lg:col-span-2 shadow-2xs" />
            <div className="h-80 rounded-2xl bg-white shadow-2xs" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-3 sm:p-6 lg:p-7 pb-24 lg:pb-10 font-sans">
      <div className="mx-auto max-w-[1500px] space-y-5 sm:space-y-6">

        {/* ========================================================= */}
        {/* 1. TOP HEADER & WORKSPACE GREETING */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Welcome back, Admin! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
              {currentDateString}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Period selector pill */}
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="h-10 appearance-none rounded-xl border border-slate-200/90 bg-white pl-3.5 pr-8 text-xs font-bold text-slate-700 shadow-2xs outline-none transition hover:bg-slate-50 focus:border-[#008dd2]"
              >
                <option value="This Month">This Month</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="This Year">This Year</option>
              </select>
              <HiOutlineChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={refreshDashboard}
              disabled={refreshing}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-600 shadow-2xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
              title="Refresh Dashboard"
            >
              <HiOutlineRefresh
                size={16}
                className={refreshing ? "animate-spin text-[#008dd2]" : ""}
              />
            </button>

            {/* Export */}
            <button
              type="button"
              onClick={() => (window.location.href = "/orders")}
              className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95"
            >
              <HiOutlineDownload size={15} className="text-slate-500" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* ERROR NOTICE */}
        {error && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600 flex items-center justify-between shadow-2xs">
            <span>{error}</span>
            <button onClick={refreshDashboard} className="underline">
              Retry
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. TOP METRIC SUMMARY CARDS */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4.5">
          {/* Card 1: Total Orders */}
          <div
            onClick={() => (window.location.href = "/orders")}
            className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs transition duration-200 hover:border-[#008dd2]/40 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-bold text-slate-500">
                Total Orders
              </span>
              <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-blue-50 text-[#008dd2]">
                <HiOutlineClipboardList size={18} />
              </div>
            </div>

            <p className="text-2xl sm:text-[28px] font-black tracking-tight text-slate-900 mt-2">
              {formatNumber(totalOrders)}
            </p>

            <div className="mt-2.5 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold text-emerald-600">
              <span className="flex items-center rounded-full bg-emerald-50 px-1.5 py-0.2">
                <HiOutlineArrowUp size={11} className="mr-0.5" />
                +4.8%
              </span>
              <span className="text-slate-400 truncate">From last month</span>
            </div>
          </div>

          {/* Card 2: Total Customers */}
          <div
            onClick={() => (window.location.href = "/users")}
            className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs transition duration-200 hover:border-[#008dd2]/40 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-bold text-slate-500">
                Total Customers
              </span>
              <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <HiOutlineUsers size={18} />
              </div>
            </div>

            <p className="text-2xl sm:text-[28px] font-black tracking-tight text-slate-900 mt-2">
              {formatNumber(data.totalUsers)}
            </p>

            <div className="mt-2.5 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold text-emerald-600">
              <span className="flex items-center rounded-full bg-emerald-50 px-1.5 py-0.2">
                <HiOutlineArrowUp size={11} className="mr-0.5" />
                +2.1%
              </span>
              <span className="text-slate-400 truncate">From last month</span>
            </div>
          </div>

          {/* Card 3: Total Revenue */}
          <div
            onClick={() => (window.location.href = "/orders")}
            className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs transition duration-200 hover:border-[#008dd2]/40 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-bold text-slate-500">
                Total Revenue
              </span>
              <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <HiOutlineCurrencyRupee size={20} />
              </div>
            </div>

            <p className="text-2xl sm:text-[28px] font-black tracking-tight text-slate-900 mt-2 truncate">
              {formatMoney(data.totalCharges)}
            </p>

            <div className="mt-2.5 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold text-emerald-600">
              <span className="flex items-center rounded-full bg-emerald-50 px-1.5 py-0.2">
                <HiOutlineArrowUp size={11} className="mr-0.5" />
                +4.9%
              </span>
              <span className="text-slate-400 truncate">From last month</span>
            </div>
          </div>

          {/* Card 4: Active Shipments */}
          <div
            onClick={() => (window.location.href = "/orders")}
            className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs transition duration-200 hover:border-[#008dd2]/40 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-bold text-slate-500">
                Active Shipments
              </span>
              <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <HiOutlineTruck size={19} />
              </div>
            </div>

            <p className="text-2xl sm:text-[28px] font-black tracking-tight text-slate-900 mt-2">
              {formatNumber(activeShipments)}
            </p>

            <div className="mt-2.5 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold text-emerald-600">
              <span className="flex items-center rounded-full bg-emerald-50 px-1.5 py-0.2">
                <HiOutlineArrowUp size={11} className="mr-0.5" />
                +3.4%
              </span>
              <span className="text-slate-400 truncate">In transit loop</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. CHARTS GRID (Columns + Speedometer Gauge) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4.5">

          {/* REVENUE INSIGHTS COLUMN GRAPH */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  Revenue Insights
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {formatMoney(data.totalCharges)}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-600">
                    +4.8%
                  </span>
                </div>
              </div>

              {/* View Toggle Pill */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-[11px] font-bold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setInsightsView("Monthly")}
                  className={`rounded-lg px-3 py-1 transition ${
                    insightsView === "Monthly"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setInsightsView("Yearly")}
                  className={`rounded-lg px-3 py-1 transition ${
                    insightsView === "Yearly"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>

            {/* Custom Bar Graph Layout */}
            <div className="mt-8">
              <div className="flex items-center justify-end gap-3 text-[11px] font-semibold text-slate-500 mb-4">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#008dd2]" />
                  Freight Earnings
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-200" />
                  Shipment Baseline
                </span>
              </div>

              <div className="relative h-44 sm:h-52 w-full flex items-end justify-between gap-1.5 sm:gap-3 px-1 border-b border-slate-100">
                {months.map((m, idx) => (
                  <div
                    key={idx}
                    className="group relative flex-1 h-full flex flex-col items-center justify-end"
                  >
                    {/* Tooltip on active bar */}
                    {m.active && (
                      <div className="absolute -top-7 z-10 rounded-lg bg-slate-900 px-2 py-0.5 text-[9px] font-bold text-white shadow-md animate-bounce">
                        {m.amount}
                      </div>
                    )}

                    <div
                      style={{ height: m.height }}
                      className={`w-full max-w-[26px] rounded-t-lg transition-all duration-300 ${
                        m.active
                          ? "bg-gradient-to-t from-[#008dd2] to-[#38bdf8] shadow-sm"
                          : "bg-slate-100 hover:bg-slate-200"
                      }`}
                    />
                    <span className="mt-2 text-[10px] font-bold text-slate-400 group-hover:text-slate-700">
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PERFORMANCE RADIAL SPEEDOMETER CARD */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  Sales & Delivery Overview
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Fulfillment success performance
                </p>
              </div>
              <HiOutlineDotsHorizontal size={18} className="text-slate-400" />
            </div>

            <div className="my-auto py-3">
              <SpeedometerGauge percentage={deliveryPercentage || 70.8} />
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs mb-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Delivered
                  </span>
                  <span className="font-bold text-slate-900">
                    {formatNumber(delivered)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Target Total
                  </span>
                  <span className="font-bold text-slate-900">
                    {formatNumber(totalOrders)}
                  </span>
                </div>
              </div>

              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  style={{ width: `${deliveryPercentage}%` }}
                  className="h-full rounded-full bg-[#008dd2] transition-all duration-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. RECENT ORDERS TABLE (Matches Screenshot Bottom Grid) */}
        {/* ========================================================= */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-100">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Recent Orders
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Real-time shipments processed through logistics network
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-60">
                <HiOutlineSearch
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchTable}
                  onChange={(e) => setSearchTable(e.target.value)}
                  placeholder="Search order ID, AWB..."
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-8.5 pr-3 text-xs text-slate-700 outline-none transition focus:border-[#008dd2] focus:bg-white"
                />
              </div>

              <div className="relative">
                <select
                  value={statusTableFilter}
                  onChange={(e) => setStatusTableFilter(e.target.value)}
                  className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-7 text-xs font-bold text-slate-700 outline-none focus:border-[#008dd2]"
                >
                  <option value="ALL">All Category</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="IN TRANSIT">In Transit</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="RTO IN TRANSIT">RTO</option>
                </select>
                <HiOutlineChevronDown
                  size={13}
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              <button
                type="button"
                onClick={() => (window.location.href = "/orders")}
                className="hidden sm:flex h-9 items-center gap-1 rounded-xl bg-slate-900 px-3.5 text-xs font-bold text-white shadow-2xs transition hover:bg-slate-800"
              >
                <span>View All</span>
                <HiOutlineArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Mobile Card List View */}
          <div className="space-y-2.5 p-3.5 sm:hidden">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No matching orders found.
              </div>
            ) : (
              filteredOrders.slice(0, 6).map((order, idx) => (
                <div
                  key={order.id || idx}
                  onClick={() => (window.location.href = "/orders")}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1.5 text-xs shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      #{order.order_id || order.id || "-"}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="truncate max-w-[170px]">
                      {order.customer_name || order.customer || "-"}
                    </span>
                    <span className="font-bold text-slate-900">
                      {formatMoney(order.charge)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-1">
                    <span className="font-mono">AWB: {order.awb || "-"}</span>
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3.5">Order ID</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">AWB Tracking</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Total Charge</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400 font-medium">
                      No matching orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.slice(0, 8).map((order, index) => (
                    <tr
                      key={order.id || index}
                      onClick={() => (window.location.href = "/orders")}
                      className="cursor-pointer transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        #{order.order_id || order.id || "-"}
                      </td>

                      <td className="px-4 py-3.5 text-slate-500 font-medium">
                        {formatDate(order.created_at)}
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        <span className="truncate max-w-xs block">
                          {order.customer_name || order.customer || "-"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">
                        {order.awb || "—"}
                      </td>

                      <td className="px-4 py-3.5">
                        <StatusBadge status={order.status} />
                      </td>

                      <td className="px-5 py-3.5 text-right font-black text-slate-900">
                        {formatMoney(order.charge)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;