import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiOutlineRefresh,
  HiOutlineClipboardList,
  HiOutlineUsers,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineSwitchHorizontal,
  HiOutlineCurrencyRupee,
  HiOutlineArrowRight,
  HiOutlineEye,
  HiOutlineTicket,
  HiOutlineClock,
  HiOutlineExclamationCircle,
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
    className: "bg-amber-50 text-amber-700 border-amber-100",
  },
  MANIFESTED: {
    label: "Manifested",
    className: "bg-purple-50 text-purple-700 border-purple-100",
  },
  "NOT PICKED": {
    label: "Not Picked",
    className: "bg-red-50 text-red-600 border-red-100",
  },
  "IN TRANSIT": {
    label: "In Transit",
    className: "bg-blue-50 text-blue-700 border-blue-100",
  },
  "OUT FOR DELIVERY": {
    label: "Out for Delivery",
    className: "bg-indigo-50 text-indigo-700 border-indigo-100",
  },
  DELIVERED: {
    label: "Delivered",
    className: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  "RTO IN TRANSIT": {
    label: "RTO In Transit",
    className: "bg-orange-50 text-orange-700 border-orange-100",
  },
  "RTO DELIVERED": {
    label: "RTO Delivered",
    className: "bg-orange-50 text-orange-700 border-orange-100",
  },
  RETURNED: {
    label: "Returned",
    className: "bg-rose-50 text-rose-700 border-rose-100",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  PENDING: {
    label: "Pending",
    className: "bg-yellow-50 text-yellow-700 border-yellow-100",
  },
};

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);

  const config =
    statusConfig[normalized] || {
      label: status || "Unknown",
      className: "bg-slate-50 text-slate-600 border-slate-200",
    };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-[0_4px_20px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-[2px] hover:border-[#008dd2]/20 hover:shadow-[0_10px_30px_rgba(15,23,42,0.07)]"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-[25px] font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={21} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-slate-400 transition-colors group-hover:text-[#008dd2]">
        View details
        <HiOutlineArrowRight
          size={13}
          className="transition-transform group-hover:translate-x-1"
        />
      </div>
    </button>
  );
}

function ProgressRow({ label, value, total }) {
  const numericValue = Number(value || 0);
  const numericTotal = Number(total || 0);

  const percentage =
    numericTotal > 0
      ? Math.min(100, (numericValue / numericTotal) * 100)
      : 0;

  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[12px] font-medium text-slate-600">
          {label}
        </span>

        <span className="text-[12px] font-semibold text-slate-800">
          {formatNumber(numericValue)}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#008dd2] transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
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

  const fetchDashboard = useCallback(async () => {
    try {
      setError("");

      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_BASE}/admin/dashboard`, {
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

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message || "Unable to load dashboard"
        );
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

  const totalOrders = Number(
    counts.All ?? counts.all_orders ?? 0
  );

  const processing = Number(
    counts.Processing ?? counts.processing ?? 0
  );

  const manifested = Number(
    counts.Manifested ?? counts.manifested ?? 0
  );

  const notPicked = Number(
    counts["Not Picked"] ?? counts.not_picked ?? 0
  );

  const inTransit = Number(
    counts["In Transit"] ?? counts.in_transit ?? 0
  );

  const ofd = Number(
    counts["Out For Delivery"] ?? counts.out_for_delivery ?? 0
  );

  const delivered = Number(
    counts.Delivered ?? counts.delivered ?? 0
  );

  const rtoInTransit = Number(
    counts["RTO In Transit"] ?? counts.rto_in_transit ?? 0
  );

  const rtoDelivered = Number(
    counts["RTO Delivered"] ?? counts.rto_delivered ?? 0
  );

  const returned = Number(
    counts.Returned ?? counts.returned ?? 0
  );

  const cancelled = Number(
    counts.Cancelled ?? counts.cancelled ?? 0
  );

  const pending = Number(
    counts.Pending ?? counts.pending ?? 0
  );

  const rtoTotal = rtoInTransit + rtoDelivered;

  const deliveryPercentage = useMemo(() => {
    if (!totalOrders) return 0;

    return Math.round((delivered / totalOrders) * 100);
  }, [delivered, totalOrders]);

  const displayedOrders = data.orders.slice(0, 8);

  const statusRows = [
    ["Processing", processing],
    ["Manifested", manifested],
    ["Not Picked", notPicked],
    ["In Transit", inTransit],
    ["Out for Delivery", ofd],
    ["Delivered", delivered],
    ["RTO", rtoTotal],
    ["Returned", returned],
    ["Pending", pending],
    ["Cancelled", cancelled],
  ];

  const openOrders = () => {
    window.location.href = "/orders";
  };

  const openUsers = () => {
    window.location.href = "/users";
  };

  const openTickets = () => {
    window.location.href = "/tickets";
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-[#f7fbfe] p-6">
        <div className="mx-auto max-w-[1500px] animate-pulse space-y-5">
          <div className="h-28 rounded-2xl bg-white" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-36 rounded-2xl bg-white"
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="h-96 rounded-2xl bg-white xl:col-span-2" />
            <div className="h-96 rounded-2xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#f7fbfe]">
      <div className="mx-auto max-w-[1500px] p-5 md:p-6">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white px-5 py-5 shadow-[0_4px_20px_rgba(15,23,42,0.035)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />

              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-600">
                Operations Overview
              </span>
            </div>

            <h1 className="mt-1 text-[25px] font-bold tracking-tight text-slate-900">
              Dashboard
            </h1>

            <p className="mt-1 text-[12px] text-slate-500">
              Monitor your shipping operations, orders and delivery
              performance.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshDashboard}
            disabled={refreshing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-600 transition hover:border-[#008dd2]/30 hover:bg-[#008dd2]/5 hover:text-[#008dd2] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <HiOutlineRefresh
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <div className="flex items-center gap-2 text-[12px] text-red-600">
              <HiOutlineExclamationCircle size={18} />

              <span>{error}</span>
            </div>

            <button
              type="button"
              onClick={refreshDashboard}
              className="text-[11px] font-semibold text-red-600 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* ================================================= */}
        {/* KPI CARDS */}
        {/* ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Total Orders"
            value={formatNumber(totalOrders)}
            subtitle="All orders in system"
            icon={HiOutlineClipboardList}
            iconClass="bg-[#008dd2]/10 text-[#008dd2]"
            onClick={openOrders}
          />

          <StatCard
            title="Total Users"
            value={formatNumber(data.totalUsers)}
            subtitle="Registered customers"
            icon={HiOutlineUsers}
            iconClass="bg-violet-50 text-violet-600"
            onClick={openUsers}
          />

          <StatCard
            title="In Transit"
            value={formatNumber(inTransit)}
            subtitle="Shipments on the move"
            icon={HiOutlineTruck}
            iconClass="bg-blue-50 text-blue-600"
            onClick={openOrders}
          />

          <StatCard
            title="Delivered"
            value={`${formatNumber(delivered)}`}
            subtitle={`${deliveryPercentage}% of total orders`}
            icon={HiOutlineCheckCircle}
            iconClass="bg-emerald-50 text-emerald-600"
            onClick={openOrders}
          />
        </div>

        {/* SECOND KPI ROW */}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Processing"
            value={formatNumber(processing)}
            subtitle="Waiting for processing"
            icon={HiOutlineClock}
            iconClass="bg-amber-50 text-amber-600"
            onClick={openOrders}
          />

          <StatCard
            title="Manifested"
            value={formatNumber(manifested)}
            subtitle="Manifested shipments"
            icon={HiOutlineClipboardList}
            iconClass="bg-purple-50 text-purple-600"
            onClick={openOrders}
          />

          <StatCard
            title="RTO"
            value={formatNumber(rtoTotal)}
            subtitle={`${formatNumber(rtoInTransit)} in transit`}
            icon={HiOutlineSwitchHorizontal}
            iconClass="bg-orange-50 text-orange-600"
            onClick={openOrders}
          />

          <StatCard
            title="Total Charges"
            value={formatMoney(data.totalCharges)}
            subtitle="Shipping charges"
            icon={HiOutlineCurrencyRupee}
            iconClass="bg-teal-50 text-teal-600"
            onClick={openOrders}
          />
        </div>

        {/* ================================================= */}
        {/* ANALYTICS */}
        {/* ================================================= */}

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">

          {/* STATUS OVERVIEW */}

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.04)] xl:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">
                  Order Status Overview
                </h2>

                <p className="mt-1 text-[11px] text-slate-400">
                  Current shipment distribution
                </p>
              </div>

              <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-500">
                {formatNumber(totalOrders)} Orders
              </span>
            </div>

            <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
              {statusRows.map(([label, value]) => (
                <ProgressRow
                  key={label}
                  label={label}
                  value={value}
                  total={totalOrders}
                />
              ))}
            </div>
          </div>

          {/* DELIVERY PERFORMANCE */}

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">
                Delivery Performance
              </h2>

              <p className="mt-1 text-[11px] text-slate-400">
                Overall shipment health
              </p>
            </div>

            <div className="mt-7 flex justify-center">
              <div className="relative flex h-44 w-44 items-center justify-center rounded-full bg-slate-100">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(#008dd2 ${
                      deliveryPercentage * 3.6
                    }deg, #e8eef3 0deg)`,
                  }}
                />

                <div className="absolute inset-[11px] flex flex-col items-center justify-center rounded-full bg-white">
                  <span className="text-[30px] font-bold text-slate-900">
                    {deliveryPercentage}%
                  </span>

                  <span className="text-[11px] font-medium text-slate-400">
                    Delivered
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-7 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5">
                <span className="text-[11px] font-medium text-emerald-700">
                  Delivered
                </span>

                <span className="text-[12px] font-bold text-emerald-700">
                  {formatNumber(delivered)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-blue-50 px-3 py-2.5">
                <span className="text-[11px] font-medium text-blue-700">
                  In Transit
                </span>

                <span className="text-[12px] font-bold text-blue-700">
                  {formatNumber(inTransit)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-orange-50 px-3 py-2.5">
                <span className="text-[11px] font-medium text-orange-700">
                  RTO
                </span>

                <span className="text-[12px] font-bold text-orange-700">
                  {formatNumber(rtoTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* RECENT ORDERS */}
        {/* ================================================= */}

        <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">
                Recent Orders
              </h2>

              <p className="mt-1 text-[11px] text-slate-400">
                Latest shipment activity
              </p>
            </div>

            <button
              type="button"
              onClick={openOrders}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#008dd2] hover:underline"
            >
              View all
              <HiOutlineArrowRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Order
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    AWB
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Status
                  </th>

                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Charge
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {displayedOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-5 py-14 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <HiOutlineClipboardList
                          size={30}
                          className="text-slate-300"
                        />

                        <p className="mt-3 text-[13px] font-semibold text-slate-500">
                          No orders found
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                          New orders will appear here.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedOrders.map((order, index) => (
                    <tr
                      key={
                        order.id ||
                        order.order_id ||
                        `order-${index}`
                      }
                      className="border-b border-slate-50 transition hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-4">
                        <p className="text-[12px] font-bold text-slate-800">
                          #{order.order_id || order.id || "-"}
                        </p>

                        <p className="mt-0.5 text-[10px] text-slate-400">
                          ID: {order.id || "-"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="max-w-[180px] truncate text-[12px] font-semibold text-slate-700">
                          {order.customer_name ||
                            order.customer_company ||
                            order.consignee_name ||
                            "-"}
                        </p>

                        <p className="mt-0.5 max-w-[180px] truncate text-[10px] text-slate-400">
                          {order.customer_email ||
                            order.email ||
                            "-"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-mono text-[11px] text-slate-600">
                          {order.awb || "Not assigned"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge status={order.status} />
                      </td>

                      <td className="px-4 py-4 text-right">
                        <span className="text-[12px] font-semibold text-slate-700">
                          {formatMoney(order.charge)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <span className="text-[11px] text-slate-500">
                          {formatDate(order.created_at)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================================================= */}
        {/* QUICK ACTIONS + TICKETS */}
        {/* ================================================= */}

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">

          {/* QUICK ACTIONS */}

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
            <h2 className="text-[15px] font-bold text-slate-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-[11px] text-slate-400">
              Frequently used admin sections
            </p>

            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={openOrders}
                className="flex w-full items-center justify-between rounded-xl border border-slate-100 px-3.5 py-3 text-left transition hover:border-[#008dd2]/20 hover:bg-[#008dd2]/5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#008dd2]/10 text-[#008dd2]">
                    <HiOutlineClipboardList size={18} />
                  </div>

                  <span className="text-[12px] font-semibold text-slate-700">
                    Manage Orders
                  </span>
                </div>

                <HiOutlineArrowRight
                  size={15}
                  className="text-slate-400"
                />
              </button>

              <button
                type="button"
                onClick={openUsers}
                className="flex w-full items-center justify-between rounded-xl border border-slate-100 px-3.5 py-3 text-left transition hover:border-violet-200 hover:bg-violet-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <HiOutlineUsers size={18} />
                  </div>

                  <span className="text-[12px] font-semibold text-slate-700">
                    Manage Users
                  </span>
                </div>

                <HiOutlineArrowRight
                  size={15}
                  className="text-slate-400"
                />
              </button>

              <button
                type="button"
                onClick={openTickets}
                className="flex w-full items-center justify-between rounded-xl border border-slate-100 px-3.5 py-3 text-left transition hover:border-amber-200 hover:bg-amber-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <HiOutlineTicket size={18} />
                  </div>

                  <span className="text-[12px] font-semibold text-slate-700">
                    Support Tickets
                  </span>
                </div>

                <HiOutlineArrowRight
                  size={15}
                  className="text-slate-400"
                />
              </button>
            </div>
          </div>

          {/* TICKETS */}

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.04)] lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">
                  Recent Tickets
                </h2>

                <p className="mt-1 text-[11px] text-slate-400">
                  Latest support activity
                </p>
              </div>

              <button
                type="button"
                onClick={openTickets}
                className="text-[11px] font-semibold text-[#008dd2] hover:underline"
              >
                View all
              </button>
            </div>

            <div className="divide-y divide-slate-50">
              {data.recentTickets.length === 0 ? (
                <div className="flex flex-col items-center px-5 py-12">
                  <HiOutlineTicket
                    size={29}
                    className="text-slate-300"
                  />

                  <p className="mt-3 text-[12px] font-semibold text-slate-500">
                    No recent tickets
                  </p>
                </div>
              ) : (
                data.recentTickets.slice(0, 5).map((ticket, index) => (
                  <div
                    key={
                      ticket.id ||
                      ticket.ticket_id ||
                      `ticket-${index}`
                    }
                    className="flex items-center justify-between gap-4 px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-slate-700">
                        {ticket.subject ||
                          ticket.title ||
                          `Ticket #${ticket.id || "-"}`}
                      </p>

                      <p className="mt-1 text-[10px] text-slate-400">
                        {ticket.ticket_id
                          ? `#${ticket.ticket_id}`
                          : `Ticket #${ticket.id || "-"}`}
                        {ticket.created_at
                          ? ` • ${formatDate(ticket.created_at)}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <StatusBadge status={ticket.status} />

                      <button
                        type="button"
                        onClick={openTickets}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-[#008dd2]/10 hover:text-[#008dd2]"
                        title="View tickets"
                      >
                        <HiOutlineEye size={17} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}

        <div className="mt-5 flex items-center justify-between px-1">
          <p className="text-[10px] text-slate-400">
            ShipDrop Admin Dashboard
          </p>

          <p className="text-[10px] text-slate-400">
            Live operational data
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;