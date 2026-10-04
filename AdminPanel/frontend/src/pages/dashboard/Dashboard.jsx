import React, { useEffect, useMemo, useState } from "react";
import {
  HiOutlineRefresh,
  HiOutlineCube,
  HiOutlineUsers,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineArrowRight,
  HiOutlineTicket,
  HiOutlineCurrencyRupee,
  HiOutlineExternalLink,
  HiOutlineClipboardList,
  HiOutlineOfficeBuilding,
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";

/* =========================================================
   API
========================================================= */

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

/* =========================================================
   HELPERS
========================================================= */

const formatNumber = (value) => {
  return new Intl.NumberFormat("en-IN").format(
    Number(value || 0)
  );
};

const formatCurrency = (value) => {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (value) => {
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

const normalizeStatus = (status) => {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/_/g, " ");
};

/* =========================================================
   STATUS CONFIG
========================================================= */

const STATUS_CONFIG = {
  Processing: {
    key: "Processing",
    label: "Processing",
    path: "/processing-orders",
    icon: HiOutlineClock,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    dot: "bg-indigo-500",
  },

  Manifested: {
    key: "Manifested",
    label: "Manifested",
    path: "/manifested",
    icon: HiOutlineClipboardList,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    dot: "bg-blue-500",
  },

  "Not Picked": {
    key: "Not Picked",
    label: "Not Picked",
    path: "/not-picked",
    icon: HiOutlineExclamationCircle,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    dot: "bg-orange-500",
  },

  "In Transit": {
    key: "In Transit",
    label: "In Transit",
    path: "/in-transit",
    icon: HiOutlineTruck,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    dot: "bg-violet-500",
  },

  "Out For Delivery": {
    key: "Out For Delivery",
    label: "Out For Delivery",
    path: "/out-for-delivery",
    icon: HiOutlineTruck,
    iconBg: "bg-cyan-50",
    iconColor: "text-cyan-600",
    dot: "bg-cyan-500",
  },

  Delivered: {
    key: "Delivered",
    label: "Delivered",
    path: "/delivered",
    icon: HiOutlineCheckCircle,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    dot: "bg-emerald-500",
  },

  "RTO In Transit": {
    key: "RTO In Transit",
    label: "RTO In Transit",
    path: "/rto-in-transit",
    icon: HiOutlineTruck,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    dot: "bg-amber-500",
  },

  "RTO Delivered": {
    key: "RTO Delivered",
    label: "RTO Delivered",
    path: "/rto-delivered",
    icon: HiOutlineCheckCircle,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    dot: "bg-rose-500",
  },

  Returned: {
    key: "Returned",
    label: "Returned",
    path: "/returned",
    icon: HiOutlineArrowRight,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    dot: "bg-slate-500",
  },

  Cancelled: {
    key: "Cancelled",
    label: "Cancelled",
    path: "/cancelled",
    icon: HiOutlineExclamationCircle,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    dot: "bg-red-500",
  },

  Pending: {
    key: "Pending",
    label: "Pending",
    path: "/pending",
    icon: HiOutlineClock,
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-600",
    dot: "bg-yellow-500",
  },
};

/* =========================================================
   STATUS BADGE
========================================================= */

const StatusBadge = ({ status }) => {
  const normalized = normalizeStatus(status);

  let classes =
    "bg-slate-100 text-slate-600";

  switch (normalized) {
    case "PROCESSING":
      classes =
        "bg-indigo-50 text-indigo-600";
      break;

    case "MANIFESTED":
      classes =
        "bg-blue-50 text-blue-600";
      break;

    case "NOT PICKED":
      classes =
        "bg-orange-50 text-orange-600";
      break;

    case "IN TRANSIT":
      classes =
        "bg-violet-50 text-violet-600";
      break;

    case "OUT FOR DELIVERY":
      classes =
        "bg-cyan-50 text-cyan-600";
      break;

    case "DELIVERED":
      classes =
        "bg-emerald-50 text-emerald-600";
      break;

    case "RTO IN TRANSIT":
      classes =
        "bg-amber-50 text-amber-600";
      break;

    case "RTO DELIVERED":
      classes =
        "bg-rose-50 text-rose-600";
      break;

    case "RETURNED":
      classes =
        "bg-slate-100 text-slate-600";
      break;

    case "CANCELLED":
    case "CANCELED":
      classes =
        "bg-red-50 text-red-600";
      break;

    case "PENDING":
      classes =
        "bg-yellow-50 text-yellow-600";
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {normalized || "Unknown"}
    </span>
  );
};

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group w-full rounded-2xl border border-slate-200
        bg-white p-4 text-left
        shadow-[0_2px_10px_rgba(15,23,42,0.04)]
        transition duration-200
        hover:-translate-y-0.5
        hover:border-[#008dd2]/30
        hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]
        focus:outline-none focus:ring-2
        focus:ring-[#008dd2]/20
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-1 text-[24px] font-bold tracking-tight text-slate-900">
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 text-[11px] text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`
            flex h-10 w-10 shrink-0 items-center
            justify-center rounded-xl
            ${iconBg} ${iconColor}
            transition duration-200
            group-hover:scale-105
          `}
        >
          <Icon size={19} />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-[#008dd2] opacity-0 transition group-hover:opacity-100">
        Open
        <HiOutlineArrowRight size={13} />
      </div>
    </button>
  );
};

/* =========================================================
   STATUS ROW
========================================================= */

const StatusRow = ({
  status,
  count,
  total,
  onClick,
}) => {
  const config = STATUS_CONFIG[status];

  if (!config) return null;

  const Icon = config.icon;

  const percentage =
    total > 0
      ? Math.min(
          100,
          (Number(count || 0) / total) * 100
        )
      : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group w-full rounded-xl p-2.5
        text-left transition
        hover:bg-slate-50
      "
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.iconBg} ${config.iconColor}`}
        >
          <Icon size={15} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-[12px] font-medium text-slate-700">
              {config.label}
            </span>

            <span className="text-[12px] font-bold text-slate-900">
              {formatNumber(count)}
            </span>
          </div>

          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#008dd2] transition-all duration-500"
              style={{
                width: `${percentage}%`,
              }}
            />
          </div>
        </div>

        <HiOutlineArrowRight
          size={14}
          className="
            shrink-0 text-slate-300
            transition group-hover:translate-x-0.5
            group-hover:text-[#008dd2]
          "
        />
      </div>
    </button>
  );
};

/* =========================================================
   MAIN DASHBOARD
========================================================= */

function AdminDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /* =====================================================
     FETCH DASHBOARD
  ===================================================== */

  const loadDashboard = async () => {
    try {
      setError("");

      const token =
        localStorage.getItem("adminToken");

      const response = await fetch(
        `${API_BASE}/admin/dashboard`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Unable to load dashboard"
        );
      }

      setDashboard(data);
    } catch (err) {
      console.error(
        "Admin dashboard loading error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load dashboard"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  /* =====================================================
     REFRESH
  ===================================================== */

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  /* =====================================================
     DATA
  ===================================================== */

  const counts = dashboard?.counts || {};

  const totalOrders =
    Number(counts.All || 0);

  const delivered =
    Number(counts.Delivered || 0);

  const inTransit =
    Number(counts["In Transit"] || 0);

  const processing =
    Number(counts.Processing || 0);

  const manifested =
    Number(counts.Manifested || 0);

  const rto =
    Number(counts["RTO In Transit"] || 0) +
    Number(counts["RTO Delivered"] || 0);

  const deliveryPercentage =
    totalOrders > 0
      ? Math.round(
          (delivered / totalOrders) * 100
        )
      : 0;

  const recentOrders = Array.isArray(
    dashboard?.orders
  )
    ? dashboard.orders
    : [];

  const recentTickets = Array.isArray(
    dashboard?.recentTickets
  )
    ? dashboard.recentTickets
    : [];

  const statusRows = useMemo(
    () => [
      "Processing",
      "Manifested",
      "Not Picked",
      "In Transit",
      "Out For Delivery",
      "Delivered",
      "RTO In Transit",
      "RTO Delivered",
      "Returned",
      "Cancelled",
      "Pending",
    ],
    []
  );

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="min-h-full bg-[#f7f9fc] p-4 sm:p-5 lg:p-6">
        <div className="mx-auto max-w-[1600px]">
          <div className="animate-pulse space-y-5">
            <div className="h-28 rounded-2xl bg-white" />

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="h-32 rounded-2xl bg-white"
                  />
                )
              )}
            </div>

            <div className="grid gap-5 xl:grid-cols-3">
              <div className="h-96 rounded-2xl bg-white xl:col-span-2" />
              <div className="h-96 rounded-2xl bg-white" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (error) {
    return (
      <div className="min-h-full bg-[#f7f9fc] p-5">
        <div className="mx-auto flex min-h-[60vh] max-w-[700px] items-center justify-center">
          <div className="w-full rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              <HiOutlineExclamationCircle size={25} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Dashboard couldn't load
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={handleRefresh}
              className="
                mt-5 inline-flex items-center gap-2
                rounded-xl bg-[#008dd2]
                px-4 py-2.5 text-sm
                font-semibold text-white
                transition hover:bg-[#007fbd]
              "
            >
              <HiOutlineRefresh size={17} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="min-h-full bg-[#f7f9fc]">
      <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-5 lg:p-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#008dd2]/10 text-[#008dd2]">
                  <HiOutlineOfficeBuilding size={19} />
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#008dd2]">
                    ParcelDrop Admin
                  </p>

                  <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    Dashboard
                  </h1>
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-500 sm:text-sm">
                Monitor your shipments, delivery performance and
                operations from one place.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="
                inline-flex shrink-0 items-center
                justify-center gap-2 rounded-xl
                border border-slate-200 bg-white
                px-4 py-2.5 text-xs font-semibold
                text-slate-700 shadow-sm
                transition hover:border-[#008dd2]/30
                hover:bg-[#008dd2]/5
                hover:text-[#008dd2]
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              <HiOutlineRefresh
                size={16}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>

          {/* TOP SUMMARY */}
          <div className="grid border-t border-slate-100 sm:grid-cols-4">
            <button
              type="button"
              onClick={() =>
                navigate("/all-orders")
              }
              className="flex items-center gap-3 border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 sm:border-b-0 sm:border-r"
            >
              <HiOutlineCube
                size={18}
                className="text-[#008dd2]"
              />

              <div>
                <p className="text-[11px] text-slate-400">
                  Total Orders
                </p>

                <p className="text-base font-bold text-slate-900">
                  {formatNumber(totalOrders)}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 p-4 sm:border-b-0 sm:border-r">
              <HiOutlineUsers
                size={18}
                className="text-violet-500"
              />

              <div>
                <p className="text-[11px] text-slate-400">
                  Customers
                </p>

                <p className="text-base font-bold text-slate-900">
                  {formatNumber(
                    dashboard?.totalUsers
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/delivered")
              }
              className="flex items-center gap-3 border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 sm:border-b-0 sm:border-r"
            >
              <HiOutlineCheckCircle
                size={18}
                className="text-emerald-500"
              />

              <div>
                <p className="text-[11px] text-slate-400">
                  Delivered
                </p>

                <p className="text-base font-bold text-slate-900">
                  {formatNumber(delivered)}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-3 p-4">
              <HiOutlineCurrencyRupee
                size={18}
                className="text-amber-500"
              />

              <div>
                <p className="text-[11px] text-slate-400">
                  Shipping Charges
                </p>

                <p className="text-base font-bold text-slate-900">
                  {formatCurrency(
                    dashboard?.totalCharges
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            KPI CARDS
        ================================================= */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
          <StatCard
            title="All Orders"
            value={formatNumber(totalOrders)}
            subtitle="View all shipments"
            icon={HiOutlineCube}
            iconBg="bg-sky-50"
            iconColor="text-[#008dd2]"
            onClick={() =>
              navigate("/all-orders")
            }
          />

          <StatCard
            title="Processing"
            value={formatNumber(processing)}
            subtitle="Ready to process"
            icon={HiOutlineClock}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
            onClick={() =>
              navigate("/processing-orders")
            }
          />

          <StatCard
            title="Manifested"
            value={formatNumber(manifested)}
            subtitle="Manifested shipments"
            icon={HiOutlineClipboardList}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            onClick={() =>
              navigate("/manifested")
            }
          />

          <StatCard
            title="In Transit"
            value={formatNumber(inTransit)}
            subtitle="On the way"
            icon={HiOutlineTruck}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
            onClick={() =>
              navigate("/in-transit")
            }
          />

          <StatCard
            title="Delivered"
            value={formatNumber(delivered)}
            subtitle={`${deliveryPercentage}% of total`}
            icon={HiOutlineCheckCircle}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            onClick={() =>
              navigate("/delivered")
            }
          />

          <StatCard
            title="Not Picked"
            value={formatNumber(
              counts["Not Picked"]
            )}
            subtitle="Pickup pending"
            icon={HiOutlineExclamationCircle}
            iconBg="bg-orange-50"
            iconColor="text-orange-600"
            onClick={() =>
              navigate("/not-picked")
            }
          />

          <StatCard
            title="RTO"
            value={formatNumber(rto)}
            subtitle="RTO shipments"
            icon={HiOutlineArrowRight}
            iconBg="bg-rose-50"
            iconColor="text-rose-600"
            onClick={() =>
              navigate("/rto-in-transit")
            }
          />

          <StatCard
            title="Pending"
            value={formatNumber(
              counts.Pending
            )}
            subtitle="Pending shipments"
            icon={HiOutlineClock}
            iconBg="bg-yellow-50"
            iconColor="text-yellow-600"
            onClick={() =>
              navigate("/pending")
            }
          />
        </div>

        {/* =================================================
            MAIN ANALYTICS
        ================================================= */}

        <div className="grid gap-5 xl:grid-cols-3">

          {/* STATUS OVERVIEW */}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)] xl:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Shipment Overview
                </h2>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Current order distribution by status
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/all-orders")
                }
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#008dd2] hover:underline"
              >
                All orders
                <HiOutlineArrowRight size={13} />
              </button>
            </div>

            <div className="mt-4 grid gap-1 sm:grid-cols-2">
              {statusRows.map((status) => (
                <StatusRow
                  key={status}
                  status={status}
                  count={
                    counts[status] || 0
                  }
                  total={totalOrders}
                  onClick={() =>
                    navigate(
                      STATUS_CONFIG[status]
                        .path
                    )
                  }
                />
              ))}
            </div>
          </div>

          {/* DELIVERY PERFORMANCE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Delivery Performance
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Delivered orders against total orders
              </p>
            </div>

            <div className="mt-7 flex justify-center">
              <div
                className="relative flex h-44 w-44 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(
                    #008dd2 ${deliveryPercentage * 3.6}deg,
                    #e9eef5 ${deliveryPercentage * 3.6}deg
                  )`,
                }}
              >
                <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-white">
                  <span className="text-4xl font-bold tracking-tight text-slate-900">
                    {deliveryPercentage}%
                  </span>

                  <span className="mt-1 text-[11px] font-medium text-slate-400">
                    Delivered
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  navigate("/delivered")
                }
                className="rounded-xl bg-emerald-50 p-3 text-left transition hover:bg-emerald-100"
              >
                <p className="text-[10px] font-medium text-emerald-600">
                  Delivered
                </p>

                <p className="mt-1 text-lg font-bold text-emerald-700">
                  {formatNumber(delivered)}
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/in-transit")
                }
                className="rounded-xl bg-violet-50 p-3 text-left transition hover:bg-violet-100"
              >
                <p className="text-[10px] font-medium text-violet-600">
                  In Transit
                </p>

                <p className="mt-1 text-lg font-bold text-violet-700">
                  {formatNumber(inTransit)}
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* =================================================
            RECENT ORDERS + TICKETS
        ================================================= */}

        <div className="grid gap-5 xl:grid-cols-3">

          {/* RECENT ORDERS */}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.04)] xl:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Recent Orders
                </h2>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Latest shipments created in ParcelDrop
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/all-orders")
                }
                className="
                  inline-flex items-center gap-1
                  rounded-lg px-2.5 py-1.5
                  text-[11px] font-semibold
                  text-[#008dd2]
                  transition hover:bg-[#008dd2]/5
                "
              >
                View all
                <HiOutlineArrowRight size={13} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Order
                    </th>

                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Customer
                    </th>

                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      AWB
                    </th>

                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Status
                    </th>

                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Charge
                    </th>

                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center"
                      >
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                          <HiOutlineCube size={20} />
                        </div>

                        <p className="mt-3 text-xs font-medium text-slate-500">
                          No recent orders found
                        </p>
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map(
                      (order, index) => (
                        <tr
                          key={
                            order.id ||
                            order.order_id ||
                            index
                          }
                          onClick={() =>
                            navigate(
                              "/all-orders"
                            )
                          }
                          className="
                            cursor-pointer
                            border-b border-slate-50
                            transition hover:bg-slate-50/70
                          "
                        >
                          <td className="px-4 py-3">
                            <p className="text-xs font-semibold text-slate-900">
                              #
                              {order.order_id ||
                                order.id ||
                                "-"}
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {order.payment_type ||
                                "-"}
                            </p>
                          </td>

                          <td className="px-4 py-3">
                            <p className="max-w-[170px] truncate text-xs font-medium text-slate-700">
                              {order.customer_name ||
                                order.customer_company ||
                                order.consignee_name ||
                                "Customer"}
                            </p>

                            {order.customer_email && (
                              <p className="mt-0.5 max-w-[170px] truncate text-[10px] text-slate-400">
                                {
                                  order.customer_email
                                }
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-mono text-[11px] text-slate-600">
                              {order.awb || "-"}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <StatusBadge
                              status={
                                order.status
                              }
                            />
                          </td>

                          <td className="px-4 py-3 text-right">
                            <span className="text-xs font-semibold text-slate-700">
                              {formatCurrency(
                                order.charge
                              )}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <span className="whitespace-nowrap text-[11px] text-slate-500">
                              {formatDate(
                                order.created_at
                              )}
                            </span>
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TICKETS */}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Recent Tickets
                </h2>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Latest support activity
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/tickets")
                }
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-[#008dd2] transition hover:bg-[#008dd2]/5"
              >
                View all
                <HiOutlineArrowRight size={13} />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentTickets.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                    <HiOutlineTicket size={20} />
                  </div>

                  <p className="mt-3 text-xs font-medium text-slate-500">
                    No recent tickets
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/tickets")
                    }
                    className="mt-3 text-[11px] font-semibold text-[#008dd2] hover:underline"
                  >
                    Open Tickets
                  </button>
                </div>
              ) : (
                recentTickets.map(
                  (ticket, index) => (
                    <button
                      key={
                        ticket.id ||
                        index
                      }
                      type="button"
                      onClick={() =>
                        navigate(
                          "/tickets"
                        )
                      }
                      className="group flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#008dd2]/10 text-[#008dd2]">
                        <HiOutlineTicket
                          size={15}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-700">
                          {ticket.subject ||
                            ticket.title ||
                            ticket.ticket_subject ||
                            `Ticket #${
                              ticket.id ||
                              "-"
                            }`}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                          {ticket.status ||
                            ticket.ticket_status ||
                            "Open"}
                        </p>
                      </div>

                      <HiOutlineExternalLink
                        size={14}
                        className="mt-1 shrink-0 text-slate-300 transition group-hover:text-[#008dd2]"
                      />
                    </button>
                  )
                )
              )}
            </div>
          </div>
        </div>

        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
          <div className="mb-3">
            <h2 className="text-sm font-bold text-slate-900">
              Quick Navigation
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-400">
              Jump directly to important operations
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            <button
              type="button"
              onClick={() =>
                navigate("/all-orders")
              }
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-left transition hover:border-[#008dd2]/30 hover:bg-[#008dd2]/5"
            >
              <HiOutlineCube
                size={17}
                className="text-[#008dd2]"
              />
              <span className="text-[11px] font-semibold text-slate-700">
                All Orders
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/processing-orders"
                )
              }
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50"
            >
              <HiOutlineClock
                size={17}
                className="text-indigo-600"
              />
              <span className="text-[11px] font-semibold text-slate-700">
                Processing
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/manifested")
              }
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
            >
              <HiOutlineClipboardList
                size={17}
                className="text-blue-600"
              />
              <span className="text-[11px] font-semibold text-slate-700">
                Manifested
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/in-transit")
              }
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-left transition hover:border-violet-200 hover:bg-violet-50"
            >
              <HiOutlineTruck
                size={17}
                className="text-violet-600"
              />
              <span className="text-[11px] font-semibold text-slate-700">
                In Transit
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/delivered")
              }
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50"
            >
              <HiOutlineCheckCircle
                size={17}
                className="text-emerald-600"
              />
              <span className="text-[11px] font-semibold text-slate-700">
                Delivered
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/tickets")
              }
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-left transition hover:border-[#008dd2]/30 hover:bg-[#008dd2]/5"
            >
              <HiOutlineTicket
                size={17}
                className="text-[#008dd2]"
              />
              <span className="text-[11px] font-semibold text-slate-700">
                Tickets
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;