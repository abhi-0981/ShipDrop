import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiOutlineRefresh,
  HiOutlineClipboardList,
  HiOutlineUsers,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineCurrencyRupee,
  HiOutlineSearch,
  HiOutlineArrowRight,
  HiOutlineTicket,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineChevronRight,
  HiOutlineCube,
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
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

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
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/70",
    dot: "bg-amber-500",
  },
  MANIFESTED: {
    label: "Manifested",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200/70",
    dot: "bg-purple-500",
  },
  "NOT PICKED": {
    label: "Not Picked",
    badgeClass: "bg-rose-50 text-rose-600 border-rose-200/70",
    dot: "bg-rose-500",
  },
  "IN TRANSIT": {
    label: "In Transit",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200/70",
    dot: "bg-sky-500",
  },
  "OUT FOR DELIVERY": {
    label: "Out for Delivery",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200/70",
    dot: "bg-indigo-500",
  },
  DELIVERED: {
    label: "Delivered",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
    dot: "bg-emerald-500",
  },
  "RTO IN TRANSIT": {
    label: "RTO In Transit",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200/70",
    dot: "bg-orange-500",
  },
  "RTO DELIVERED": {
    label: "RTO Delivered",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200/70",
    dot: "bg-rose-500",
  },
  RETURNED: {
    label: "Returned",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200/70",
    dot: "bg-rose-500",
  },
  CANCELLED: {
    label: "Cancelled",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
  PENDING: {
    label: "Pending",
    badgeClass: "bg-yellow-50 text-yellow-700 border-yellow-200/70",
    dot: "bg-yellow-500",
  },
};

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);
  const config = statusConfig[normalized] || {
    label: status || "Unknown",
    badgeClass: "bg-slate-50 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${config.badgeClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
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
  const [searchTable, setSearchTable] = useState("");
  const [tableFilter, setTableFilter] = useState("ALL");

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

  // Metrics computation
  const counts = data.counts || {};
  const totalOrders = Number(counts.All ?? counts.all_orders ?? 0);
  const delivered = Number(counts.Delivered ?? counts.delivered ?? 0);
  const inTransit = Number(counts["In Transit"] ?? counts.in_transit ?? 0);
  const outForDelivery = Number(
    counts["Out For Delivery"] ?? counts.out_for_delivery ?? 0
  );
  const processing = Number(counts.Processing ?? counts.processing ?? 0);
  const manifested = Number(counts.Manifested ?? counts.manifested ?? 0);
  const notPicked = Number(counts["Not Picked"] ?? counts.not_picked ?? 0);
  const rtoInTransit = Number(counts["RTO In Transit"] ?? counts.rto_in_transit ?? 0);
  const rtoDelivered = Number(counts["RTO Delivered"] ?? counts.rto_delivered ?? 0);
  const totalRto = rtoInTransit + rtoDelivered;

  const deliveryRate = useMemo(() => {
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
        tableFilter === "ALL" || status === tableFilter;

      return matchesSearch && matchesStatus;
    });
  }, [data.orders, searchTable, tableFilter]);

  const openRoute = (path) => {
    window.location.href = path;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-5">
          <div className="h-18 rounded-2xl bg-white border border-slate-200/60" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-white border border-slate-200/60" />
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-white border border-slate-200/60" />
          <div className="h-80 rounded-2xl bg-white border border-slate-200/60" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-3.5 sm:p-6 lg:p-7 pb-24 lg:pb-10 font-sans">
      <div className="mx-auto max-w-7xl space-y-4.5 sm:space-y-6">

        {/* ========================================================= */}
        {/* 1. TOP HEADER & SYSTEM STATUS BAR */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4.5 sm:px-6 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                Logistics Command Center
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
              Operations Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Live tracking and account ledger summary across courier partners
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={refreshDashboard}
              disabled={refreshing}
              className="flex h-9.5 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
            >
              <HiOutlineRefresh
                size={14}
                className={refreshing ? "animate-spin text-[#008dd2]" : ""}
              />
              <span>{refreshing ? "Syncing..." : "Sync Data"}</span>
            </button>

            <button
              type="button"
              onClick={() => openRoute("/orders")}
              className="flex h-9.5 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white shadow-2xs transition hover:bg-slate-800 active:scale-95"
            >
              <span>All Orders</span>
              <HiOutlineArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* ERROR BANNER */}
        {error && (
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <HiOutlineExclamationCircle size={16} />
              <span>{error}</span>
            </div>
            <button onClick={refreshDashboard} className="underline">
              Retry
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. CORE KPI METRICS (High Clarity Clean Layout) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* TOTAL ORDERS */}
          <div
            onClick={() => openRoute("/orders")}
            className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition hover:border-[#008dd2]/40 hover:shadow-xs"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Orders
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#008dd2]">
                <HiOutlineClipboardList size={16} />
              </div>
            </div>

            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {formatNumber(totalOrders)}
            </p>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2 font-medium">
              <span>Delivery Success</span>
              <span className="font-bold text-emerald-600">{deliveryRate}%</span>
            </div>
          </div>

          {/* ACTIVE IN-TRANSIT */}
          <div
            onClick={() => openRoute("/orders")}
            className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition hover:border-[#008dd2]/40 hover:shadow-xs"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                In Transit & OFD
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <HiOutlineTruck size={17} />
              </div>
            </div>

            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {formatNumber(inTransit + outForDelivery)}
            </p>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2 font-medium">
              <span>Out for delivery</span>
              <span className="font-bold text-slate-700">{formatNumber(outForDelivery)}</span>
            </div>
          </div>

          {/* TOTAL REVENUE */}
          <div
            onClick={() => openRoute("/orders")}
            className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition hover:border-[#008dd2]/40 hover:shadow-xs"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Freight Billed
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <HiOutlineCurrencyRupee size={18} />
              </div>
            </div>

            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 truncate">
              {formatMoney(data.totalCharges)}
            </p>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2 font-medium">
              <span>Avg per order</span>
              <span className="font-bold text-slate-700">
                {totalOrders > 0 ? formatMoney(data.totalCharges / totalOrders) : "₹0"}
              </span>
            </div>
          </div>

          {/* ACTIVE MERCHANTS */}
          <div
            onClick={() => openRoute("/users")}
            className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition hover:border-[#008dd2]/40 hover:shadow-xs"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Merchants / Users
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <HiOutlineUsers size={17} />
              </div>
            </div>

            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {formatNumber(data.totalUsers)}
            </p>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2 font-medium">
              <span>Pending RTOs</span>
              <span className={`font-bold ${totalRto > 0 ? "text-rose-600" : "text-slate-700"}`}>
                {formatNumber(totalRto)}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. LOGISTICS PIPELINE FUNNEL (Real Operational View) */}
        {/* ========================================================= */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Shipment Pipeline & Delivery Funnel
              </h2>
              <p className="text-[11px] text-slate-400">
                Live lifecycle stage of active bookings
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700">
              {formatNumber(totalOrders)} Total Shipments
            </span>
          </div>

          {/* Stage Columns / Progress blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Processing</span>
              <span className="text-base font-bold text-slate-800 block mt-0.5">
                {formatNumber(processing)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Manifested</span>
              <span className="text-base font-bold text-slate-800 block mt-0.5">
                {formatNumber(manifested)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Not Picked</span>
              <span className="text-base font-bold text-rose-600 block mt-0.5">
                {formatNumber(notPicked)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">In Transit</span>
              <span className="text-base font-bold text-sky-600 block mt-0.5">
                {formatNumber(inTransit)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Out for Del.</span>
              <span className="text-base font-bold text-indigo-600 block mt-0.5">
                {formatNumber(outForDelivery)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Delivered</span>
              <span className="text-base font-bold text-emerald-600 block mt-0.5">
                {formatNumber(delivered)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">RTO / Ret.</span>
              <span className="text-base font-bold text-orange-600 block mt-0.5">
                {formatNumber(totalRto)}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. ORDERS DATA TABLE + SUPPORT DESK SPLIT */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4.5">

          {/* MAIN COLUMN: RECENT ORDERS TABLE (2 cols on desktop) */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden flex flex-col justify-between">
            <div>
              {/* Header with Search and Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Recent Waybill Activity
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Real-time carrier scans & bookings
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-56">
                    <HiOutlineSearch
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={searchTable}
                      onChange={(e) => setSearchTable(e.target.value)}
                      placeholder="Search AWB, order #..."
                      className="h-8.5 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-8.5 pr-3 text-xs text-slate-700 outline-none transition focus:border-[#008dd2] focus:bg-white"
                    />
                  </div>

                  <select
                    value={tableFilter}
                    onChange={(e) => setTableFilter(e.target.value)}
                    className="h-8.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#008dd2]"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="IN TRANSIT">In Transit</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="RTO IN TRANSIT">RTO</option>
                  </select>
                </div>
              </div>

              {/* Mobile Card List View */}
              <div className="space-y-2 p-3 sm:hidden">
                {filteredOrders.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No matching orders found.
                  </div>
                ) : (
                  filteredOrders.slice(0, 6).map((order, idx) => (
                    <div
                      key={order.id || idx}
                      onClick={() => openRoute("/orders")}
                      className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1.5 text-xs shadow-2xs active:scale-[0.99] transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900">
                          #{order.order_id || order.id || "—"}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="truncate max-w-[170px] font-medium">
                          {order.customer_name || order.customer || "—"}
                        </span>
                        <span className="font-bold text-slate-900">
                          {formatMoney(order.charge)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-1">
                        <span className="font-mono">AWB: {order.awb || "—"}</span>
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
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">AWB Tracking</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Freight</th>
                      <th className="py-3 px-4 text-right">Date</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-400">
                          No matching shipments found.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.slice(0, 7).map((order, index) => (
                        <tr
                          key={order.id || index}
                          onClick={() => openRoute("/orders")}
                          className="cursor-pointer transition hover:bg-slate-50/70"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-[#008dd2]">
                            #{order.order_id || order.id || "—"}
                          </td>

                          <td className="py-3 px-4 font-medium text-slate-700 truncate max-w-[140px]">
                            {order.customer_name || order.customer || "—"}
                          </td>

                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                            {order.awb || "—"}
                          </td>

                          <td className="py-3 px-4">
                            <StatusBadge status={order.status} />
                          </td>

                          <td className="py-3 px-4 text-right font-black text-slate-900">
                            {formatMoney(order.charge)}
                          </td>

                          <td className="py-3 px-4 text-right text-slate-400 text-[11px]">
                            {formatDate(order.created_at)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Footer View All */}
            <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50/40 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">
                Showing top active consignments
              </span>
              <button
                type="button"
                onClick={() => openRoute("/orders")}
                className="font-bold text-[#008dd2] hover:underline flex items-center gap-1"
              >
                <span>Full Orders Registry</span>
                <HiOutlineChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* SIDE COLUMN: RECENT SUPPORT TICKETS */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <HiOutlineTicket size={15} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Support Desk
                    </h3>
                    <p className="text-[10px] text-slate-400">Recent inquiries</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openRoute("/tickets")}
                  className="text-xs font-bold text-[#008dd2] hover:underline"
                >
                  View Desk
                </button>
              </div>

              {/* Tickets Stream */}
              <div className="divide-y divide-slate-100 p-2">
                {data.recentTickets.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <HiOutlineTicket size={24} className="mx-auto mb-1 text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">No open tickets</p>
                    <p className="text-[10px] text-slate-400">Support inbox is clear.</p>
                  </div>
                ) : (
                  data.recentTickets.slice(0, 5).map((ticket, idx) => (
                    <div
                      key={ticket.id || idx}
                      onClick={() => openRoute("/tickets")}
                      className="p-2.5 rounded-xl transition hover:bg-slate-50/80 cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-[#008dd2]">
                          #{ticket.ticket_id || ticket.id || "—"}
                        </span>
                        <StatusBadge status={ticket.status} />
                      </div>

                      <p className="text-xs font-bold text-slate-800 truncate">
                        {ticket.subject || ticket.title || "Support Request"}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{ticket.customer_name || "Merchant"}</span>
                        <span>{formatDate(ticket.created_at)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions Shortcuts Bar */}
            <div className="border-t border-slate-100 p-3 bg-slate-50/50 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                Shortcuts
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => openRoute("/weight-checking")}
                  className="rounded-xl border border-slate-200 bg-white p-2 font-bold text-slate-700 hover:bg-slate-50 text-center active:scale-95 transition"
                >
                  Weight Audit
                </button>
                <button
                  type="button"
                  onClick={() => openRoute("/rate-card")}
                  className="rounded-xl border border-slate-200 bg-white p-2 font-bold text-slate-700 hover:bg-slate-50 text-center active:scale-95 transition"
                >
                  Rate Cards
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default Dashboard;