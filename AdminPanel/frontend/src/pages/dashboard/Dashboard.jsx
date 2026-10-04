import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineCube,
  HiOutlineExclamationCircle,
  HiOutlineRefresh,
  HiOutlineTicket,
  HiOutlineTruck,
  HiOutlineUsers,
  HiOutlineCurrencyRupee,
  HiOutlineTrendingUp,
  HiOutlineExternalLink,
} from "react-icons/hi";

/* =========================================================
   API
========================================================= */

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

/* =========================================================
   HELPERS
========================================================= */

const number = (value) =>
  new Intl.NumberFormat("en-IN").format(
    Number(value || 0)
  );

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const date = (value) => {
  if (!value) return "-";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return "-";
  }

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const time = (value) => {
  if (!value) return "";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const cleanStatus = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/_/g, " ");

/* =========================================================
   STATUS NAVIGATION
========================================================= */

const STATUS_ROUTES = {
  Processing: "/processing-orders",
  Manifested: "/manifested",
  "Not Picked": "/not-picked",
  "In Transit": "/in-transit",
  "Out For Delivery": "/out-for-delivery",
  Delivered: "/delivered",
  "RTO In Transit": "/rto-in-transit",
  "RTO Delivered": "/rto-delivered",
  Returned: "/returned",
  Cancelled: "/cancelled",
  Pending: "/pending",
};

/* =========================================================
   STATUS STYLE
========================================================= */

const statusStyle = (status) => {
  const value = cleanStatus(status);

  switch (value) {
    case "PROCESSING":
      return {
        bg: "bg-indigo-50",
        text: "text-indigo-600",
        dot: "bg-indigo-500",
      };

    case "MANIFESTED":
      return {
        bg: "bg-blue-50",
        text: "text-blue-600",
        dot: "bg-blue-500",
      };

    case "NOT PICKED":
      return {
        bg: "bg-orange-50",
        text: "text-orange-600",
        dot: "bg-orange-500",
      };

    case "IN TRANSIT":
      return {
        bg: "bg-violet-50",
        text: "text-violet-600",
        dot: "bg-violet-500",
      };

    case "OUT FOR DELIVERY":
      return {
        bg: "bg-cyan-50",
        text: "text-cyan-600",
        dot: "bg-cyan-500",
      };

    case "DELIVERED":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        dot: "bg-emerald-500",
      };

    case "RTO IN TRANSIT":
      return {
        bg: "bg-amber-50",
        text: "text-amber-600",
        dot: "bg-amber-500",
      };

    case "RTO DELIVERED":
      return {
        bg: "bg-rose-50",
        text: "text-rose-600",
        dot: "bg-rose-500",
      };

    case "RETURNED":
      return {
        bg: "bg-slate-100",
        text: "text-slate-600",
        dot: "bg-slate-500",
      };

    case "CANCELLED":
    case "CANCELED":
      return {
        bg: "bg-red-50",
        text: "text-red-600",
        dot: "bg-red-500",
      };

    case "PENDING":
      return {
        bg: "bg-yellow-50",
        text: "text-yellow-600",
        dot: "bg-yellow-500",
      };

    default:
      return {
        bg: "bg-slate-100",
        text: "text-slate-600",
        dot: "bg-slate-400",
      };
  }
};

/* =========================================================
   STATUS BADGE
========================================================= */

const StatusBadge = ({ status }) => {
  const style = statusStyle(status);

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full px-2.5 py-1
        text-[10px] font-bold
        ${style.bg} ${style.text}
      `}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
      />

      {cleanStatus(status) || "UNKNOWN"}
    </span>
  );
};

/* =========================================================
   MAIN
========================================================= */

function AdminDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /* =====================================================
     LOAD
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
        "Dashboard error:",
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

  const refresh = () => {
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

  const notPicked =
    Number(counts["Not Picked"] || 0);

  const outForDelivery =
    Number(counts["Out For Delivery"] || 0);

  const rtoInTransit =
    Number(counts["RTO In Transit"] || 0);

  const rtoDelivered =
    Number(counts["RTO Delivered"] || 0);

  const pending =
    Number(counts.Pending || 0);

  const deliveryRate =
    totalOrders > 0
      ? Math.round(
          (delivered / totalOrders) * 100
        )
      : 0;

  const rtoTotal =
    rtoInTransit + rtoDelivered;

  const recentOrders = Array.isArray(
    dashboard?.orders
  )
    ? dashboard.orders
    : [];

  const tickets = Array.isArray(
    dashboard?.recentTickets
  )
    ? dashboard.recentTickets
    : [];

  /* =====================================================
     OPERATION FLOW
  ===================================================== */

  const flow = useMemo(
    () => [
      {
        label: "Processing",
        value: processing,
        route: "/processing-orders",
        icon: HiOutlineClock,
        color: "indigo",
      },
      {
        label: "Manifested",
        value: manifested,
        route: "/manifested",
        icon: HiOutlineClipboardList,
        color: "blue",
      },
      {
        label: "Not Picked",
        value: notPicked,
        route: "/not-picked",
        icon: HiOutlineExclamationCircle,
        color: "orange",
      },
      {
        label: "In Transit",
        value: inTransit,
        route: "/in-transit",
        icon: HiOutlineTruck,
        color: "violet",
      },
      {
        label: "Out For Delivery",
        value: outForDelivery,
        route: "/out-for-delivery",
        icon: HiOutlineTruck,
        color: "cyan",
      },
      {
        label: "Delivered",
        value: delivered,
        route: "/delivered",
        icon: HiOutlineCheckCircle,
        color: "emerald",
      },
    ],
    [
      processing,
      manifested,
      notPicked,
      inTransit,
      outForDelivery,
      delivered,
    ]
  );

  /* =====================================================
     COLOR HELPERS
  ===================================================== */

  const getFlowClasses = (color) => {
    const map = {
      indigo:
        "bg-indigo-50 text-indigo-600 border-indigo-100",
      blue:
        "bg-blue-50 text-blue-600 border-blue-100",
      orange:
        "bg-orange-50 text-orange-600 border-orange-100",
      violet:
        "bg-violet-50 text-violet-600 border-violet-100",
      cyan:
        "bg-cyan-50 text-cyan-600 border-cyan-100",
      emerald:
        "bg-emerald-50 text-emerald-600 border-emerald-100",
    };

    return (
      map[color] ||
      "bg-slate-50 text-slate-600 border-slate-100"
    );
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="min-h-full bg-[#f5f7fa] p-5">
        <div className="mx-auto max-w-[1550px] animate-pulse space-y-5">
          <div className="h-32 rounded-2xl bg-white" />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map(
              (_, i) => (
                <div
                  key={i}
                  className="h-32 rounded-2xl bg-white"
                />
              )
            )}
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <div className="h-[390px] rounded-2xl bg-white xl:col-span-2" />
            <div className="h-[390px] rounded-2xl bg-white" />
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
      <div className="flex min-h-[70vh] items-center justify-center bg-[#f5f7fa] p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            <HiOutlineExclamationCircle
              size={25}
            />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Dashboard unavailable
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={refresh}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#008dd2] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#007fbd]"
          >
            <HiOutlineRefresh size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* =====================================================
     DASHBOARD
  ===================================================== */

  return (
    <div className="min-h-full bg-[#f5f7fa]">
      <div className="mx-auto max-w-[1550px] space-y-5 p-4 sm:p-5 lg:p-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_3px_15px_rgba(15,23,42,0.04)]">

          <div className="relative z-10 flex flex-col gap-5 p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />

                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                  Operations Center
                </span>
              </div>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Shipping Dashboard
              </h1>

              <p className="mt-1.5 max-w-xl text-xs leading-5 text-slate-500 sm:text-sm">
                Track shipments, monitor delivery performance
                and manage your daily shipping operations.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 sm:block">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                  Total Shipments
                </p>

                <p className="mt-0.5 text-lg font-bold text-slate-900">
                  {number(totalOrders)}
                </p>
              </div>

              <button
                type="button"
                onClick={refresh}
                disabled={refreshing}
                className="
                  inline-flex items-center gap-2
                  rounded-xl border border-slate-200
                  bg-white px-4 py-2.5
                  text-xs font-semibold text-slate-700
                  shadow-sm transition
                  hover:border-[#008dd2]/30
                  hover:bg-[#008dd2]/5
                  hover:text-[#008dd2]
                  disabled:opacity-50
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
                  ? "Refreshing"
                  : "Refresh"}
              </button>
            </div>
          </div>

          <div className="absolute -right-16 -top-24 h-56 w-56 rounded-full bg-[#008dd2]/5" />
          <div className="absolute -bottom-28 right-20 h-48 w-48 rounded-full bg-[#008dd2]/5" />
        </section>

        {/* =================================================
            MAIN KPI
        ================================================= */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* ALL ORDERS */}

          <button
            type="button"
            onClick={() =>
              navigate("/all-orders")
            }
            className="
              group rounded-2xl border
              border-slate-200 bg-white
              p-5 text-left
              shadow-[0_3px_15px_rgba(15,23,42,0.04)]
              transition duration-200
              hover:-translate-y-0.5
              hover:border-[#008dd2]/30
              hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)]
            "
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  Total Orders
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {number(totalOrders)}
                </p>

                <p className="mt-1 text-[11px] text-slate-400">
                  All shipments in system
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#008dd2]/10 text-[#008dd2]">
                <HiOutlineCube size={21} />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-1 text-[11px] font-bold text-[#008dd2]">
              View all orders
              <HiOutlineArrowRight
                size={13}
                className="transition group-hover:translate-x-1"
              />
            </div>
          </button>

          {/* IN TRANSIT */}

          <button
            type="button"
            onClick={() =>
              navigate("/in-transit")
            }
            className="
              group rounded-2xl border
              border-slate-200 bg-white
              p-5 text-left
              shadow-[0_3px_15px_rgba(15,23,42,0.04)]
              transition duration-200
              hover:-translate-y-0.5
              hover:border-violet-200
              hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)]
            "
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  In Transit
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {number(inTransit)}
                </p>

                <p className="mt-1 text-[11px] text-slate-400">
                  Shipments on the way
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <HiOutlineTruck size={21} />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-1 text-[11px] font-bold text-violet-600">
              View in transit
              <HiOutlineArrowRight
                size={13}
                className="transition group-hover:translate-x-1"
              />
            </div>
          </button>

          {/* DELIVERED */}

          <button
            type="button"
            onClick={() =>
              navigate("/delivered")
            }
            className="
              group rounded-2xl border
              border-slate-200 bg-white
              p-5 text-left
              shadow-[0_3px_15px_rgba(15,23,42,0.04)]
              transition duration-200
              hover:-translate-y-0.5
              hover:border-emerald-200
              hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)]
            "
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  Delivered
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {number(delivered)}
                </p>

                <p className="mt-1 text-[11px] text-slate-400">
                  {deliveryRate}% delivery rate
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <HiOutlineCheckCircle size={21} />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
              View delivered
              <HiOutlineArrowRight
                size={13}
                className="transition group-hover:translate-x-1"
              />
            </div>
          </button>

          {/* RTO */}

          <button
            type="button"
            onClick={() =>
              navigate("/rto-in-transit")
            }
            className="
              group rounded-2xl border
              border-slate-200 bg-white
              p-5 text-left
              shadow-[0_3px_15px_rgba(15,23,42,0.04)]
              transition duration-200
              hover:-translate-y-0.5
              hover:border-rose-200
              hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)]
            "
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  RTO Shipments
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {number(rtoTotal)}
                </p>

                <p className="mt-1 text-[11px] text-slate-400">
                  Returned to origin
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <HiOutlineTrendingUp size={21} />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-1 text-[11px] font-bold text-rose-600">
              View RTO shipments
              <HiOutlineArrowRight
                size={13}
                className="transition group-hover:translate-x-1"
              />
            </div>
          </button>
        </section>

        {/* =================================================
            OPERATIONS + PERFORMANCE
        ================================================= */}

        <section className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">

          {/* OPERATIONS FLOW */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_3px_15px_rgba(15,23,42,0.04)]">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Shipment Operations
                </h2>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Click any stage to open its shipments
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/all-orders")
                }
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#008dd2]"
              >
                All orders
                <HiOutlineArrowRight size={13} />
              </button>
            </div>

            <div className="p-5">

              {/* FLOW */}

              <div className="grid gap-3 md:grid-cols-2">

                {flow.map(
                  (item, index) => {
                    const Icon = item.icon;

                    const percentage =
                      totalOrders > 0
                        ? Math.min(
                            100,
                            (item.value /
                              totalOrders) *
                              100
                          )
                        : 0;

                    return (
                      <React.Fragment
                        key={item.label}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              item.route
                            )
                          }
                          className="
                            group rounded-xl
                            border border-slate-100
                            bg-slate-50/50
                            p-4 text-left
                            transition
                            hover:border-slate-200
                            hover:bg-white
                            hover:shadow-sm
                          "
                        >
                          <div className="flex items-center gap-3">

                            <div
                              className={`
                                flex h-10 w-10
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                border
                                ${getFlowClasses(
                                  item.color
                                )}
                              `}
                            >
                              <Icon size={18} />
                            </div>

                            <div className="min-w-0 flex-1">

                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs font-semibold text-slate-700">
                                  {item.label}
                                </span>

                                <span className="text-sm font-bold text-slate-900">
                                  {number(
                                    item.value
                                  )}
                                </span>
                              </div>

                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className="h-full rounded-full bg-[#008dd2] transition-all duration-500"
                                  style={{
                                    width: `${percentage}%`,
                                  }}
                                />
                              </div>

                            </div>

                            <HiOutlineArrowRight
                              size={15}
                              className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#008dd2]"
                            />
                          </div>
                        </button>

                        {index === 2 && (
                          <div className="hidden md:block md:col-span-2 h-px bg-slate-100" />
                        )}
                      </React.Fragment>
                    );
                  }
                )}

              </div>

              {/* SECONDARY STATUSES */}

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-4">

                <button
                  type="button"
                  onClick={() =>
                    navigate("/pending")
                  }
                  className="rounded-xl border border-slate-100 p-3 text-left transition hover:border-yellow-200 hover:bg-yellow-50/40"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Pending
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {number(pending)}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/rto-in-transit")
                  }
                  className="rounded-xl border border-slate-100 p-3 text-left transition hover:border-amber-200 hover:bg-amber-50/40"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    RTO Transit
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {number(rtoInTransit)}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/rto-delivered")
                  }
                  className="rounded-xl border border-slate-100 p-3 text-left transition hover:border-rose-200 hover:bg-rose-50/40"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    RTO Delivered
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {number(rtoDelivered)}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/not-picked")
                  }
                  className="rounded-xl border border-slate-100 p-3 text-left transition hover:border-orange-200 hover:bg-orange-50/40"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Not Picked
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {number(notPicked)}
                  </p>
                </button>

              </div>
            </div>
          </div>

          {/* PERFORMANCE */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_3px_15px_rgba(15,23,42,0.04)]">

            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-900">
                Delivery Performance
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Current delivery health
              </p>
            </div>

            <div className="p-5">

              {/* CIRCLE */}

              <div className="flex justify-center py-3">
                <div
                  className="relative flex h-48 w-48 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(
                      #008dd2 ${
                        deliveryRate * 3.6
                      }deg,
                      #edf1f5 ${
                        deliveryRate * 3.6
                      }deg
                    )`,
                  }}
                >
                  <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full bg-white">
                    <span className="text-4xl font-bold tracking-tight text-slate-900">
                      {deliveryRate}%
                    </span>

                    <span className="mt-1 text-[11px] font-semibold text-slate-400">
                      Delivery Rate
                    </span>
                  </div>
                </div>
              </div>

              {/* PERFORMANCE NUMBERS */}

              <div className="mt-4 space-y-2">

                <button
                  type="button"
                  onClick={() =>
                    navigate("/delivered")
                  }
                  className="flex w-full items-center justify-between rounded-xl bg-emerald-50/70 px-4 py-3 text-left transition hover:bg-emerald-50"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />

                    <span className="text-xs font-semibold text-slate-700">
                      Delivered
                    </span>
                  </div>

                  <span className="text-sm font-bold text-emerald-700">
                    {number(delivered)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/in-transit")
                  }
                  className="flex w-full items-center justify-between rounded-xl bg-violet-50/70 px-4 py-3 text-left transition hover:bg-violet-50"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-violet-500" />

                    <span className="text-xs font-semibold text-slate-700">
                      In Transit
                    </span>
                  </div>

                  <span className="text-sm font-bold text-violet-700">
                    {number(inTransit)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/rto-in-transit")
                  }
                  className="flex w-full items-center justify-between rounded-xl bg-rose-50/70 px-4 py-3 text-left transition hover:bg-rose-50"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />

                    <span className="text-xs font-semibold text-slate-700">
                      RTO
                    </span>
                  </div>

                  <span className="text-sm font-bold text-rose-700">
                    {number(rtoTotal)}
                  </span>
                </button>

              </div>

            </div>
          </div>
        </section>

        {/* =================================================
            RECENT ORDERS
        ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_3px_15px_rgba(15,23,42,0.04)]">

          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Recent Orders
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Latest shipment activity
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/all-orders")
              }
              className="
                inline-flex w-fit
                items-center gap-1.5
                rounded-lg bg-[#008dd2]/5
                px-3 py-2
                text-[11px] font-bold
                text-[#008dd2]
                transition hover:bg-[#008dd2]/10
              "
            >
              View all orders
              <HiOutlineArrowRight size={13} />
            </button>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px]">

              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Order
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Customer
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    AWB
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Charge
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Created
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Action
                  </th>

                </tr>
              </thead>

              <tbody>

                {recentOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-14 text-center"
                    >
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                        <HiOutlineCube size={20} />
                      </div>

                      <p className="mt-3 text-xs font-semibold text-slate-500">
                        No recent orders
                      </p>
                    </td>
                  </tr>
                ) : (
                  recentOrders.map(
                    (order, index) => {
                      const customer =
                        order.customer_name ||
                        order.customer_company ||
                        order.consignee_name ||
                        "Customer";

                      return (
                        <tr
                          key={
                            order.id ||
                            order.order_id ||
                            index
                          }
                          className="
                            border-b border-slate-50
                            transition hover:bg-slate-50
                          "
                        >
                          <td className="px-5 py-3.5">
                            <p className="text-xs font-bold text-slate-900">
                              #
                              {order.order_id ||
                                order.id ||
                                "-"}
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {order.payment_type ||
                                "Order"}
                            </p>
                          </td>

                          <td className="px-5 py-3.5">
                            <p className="max-w-[180px] truncate text-xs font-semibold text-slate-700">
                              {customer}
                            </p>

                            {order.customer_email && (
                              <p className="mt-0.5 max-w-[180px] truncate text-[10px] text-slate-400">
                                {
                                  order.customer_email
                                }
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-3.5">
                            <span className="font-mono text-[11px] text-slate-600">
                              {order.awb || "-"}
                            </span>
                          </td>

                          <td className="px-5 py-3.5">
                            <StatusBadge
                              status={
                                order.status
                              }
                            />
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <span className="text-xs font-bold text-slate-700">
                              {money(
                                order.charge
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-3.5">
                            <p className="text-[11px] font-medium text-slate-600">
                              {date(
                                order.created_at
                              )}
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {time(
                                order.created_at
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  "/all-orders"
                                )
                              }
                              className="
                                inline-flex h-8 w-8
                                items-center
                                justify-center
                                rounded-lg
                                border border-slate-200
                                text-slate-400
                                transition
                                hover:border-[#008dd2]/30
                                hover:bg-[#008dd2]/5
                                hover:text-[#008dd2]
                              "
                              title="View order"
                            >
                              <HiOutlineExternalLink
                                size={15}
                              />
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )
                )}

              </tbody>
            </table>
          </div>
        </section>

        {/* =================================================
            BOTTOM SECTION
        ================================================= */}

        <section className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">

          {/* TICKETS */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_3px_15px_rgba(15,23,42,0.04)]">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Support Tickets
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
                className="text-[11px] font-bold text-[#008dd2]"
              >
                View all
              </button>

            </div>

            <div className="divide-y divide-slate-100">

              {tickets.length === 0 ? (
                <div className="px-5 py-10 text-center">

                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                    <HiOutlineTicket size={19} />
                  </div>

                  <p className="mt-3 text-xs font-semibold text-slate-500">
                    No recent tickets
                  </p>

                </div>
              ) : (
                tickets.slice(0, 4).map(
                  (ticket, index) => (
                    <button
                      type="button"
                      key={
                        ticket.id ||
                        index
                      }
                      onClick={() =>
                        navigate("/tickets")
                      }
                      className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-slate-50"
                    >

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#008dd2]/10 text-[#008dd2]">
                        <HiOutlineTicket
                          size={16}
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

                      <HiOutlineArrowRight
                        size={14}
                        className="shrink-0 text-slate-300"
                      />

                    </button>
                  )
                )
              )}

            </div>
          </div>

          {/* QUICK ACTIONS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_3px_15px_rgba(15,23,42,0.04)]">

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Quick Actions
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Jump directly to an operation
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">

              <button
                type="button"
                onClick={() =>
                  navigate("/all-orders")
                }
                className="group rounded-xl border border-slate-200 p-4 text-left transition hover:border-[#008dd2]/30 hover:bg-[#008dd2]/5"
              >
                <HiOutlineCube
                  size={19}
                  className="text-[#008dd2]"
                />

                <p className="mt-3 text-xs font-bold text-slate-700">
                  All Orders
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  {number(totalOrders)} shipments
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/manifested")
                }
                className="group rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/50"
              >
                <HiOutlineClipboardList
                  size={19}
                  className="text-blue-600"
                />

                <p className="mt-3 text-xs font-bold text-slate-700">
                  Manifested
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  {number(manifested)} shipments
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/in-transit")
                }
                className="group rounded-xl border border-slate-200 p-4 text-left transition hover:border-violet-200 hover:bg-violet-50/50"
              >
                <HiOutlineTruck
                  size={19}
                  className="text-violet-600"
                />

                <p className="mt-3 text-xs font-bold text-slate-700">
                  In Transit
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  {number(inTransit)} shipments
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/delivered")
                }
                className="group rounded-xl border border-slate-200 p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50/50"
              >
                <HiOutlineCheckCircle
                  size={19}
                  className="text-emerald-600"
                />

                <p className="mt-3 text-xs font-bold text-slate-700">
                  Delivered
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  {number(delivered)} shipments
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/not-picked")
                }
                className="group rounded-xl border border-slate-200 p-4 text-left transition hover:border-orange-200 hover:bg-orange-50/50"
              >
                <HiOutlineExclamationCircle
                  size={19}
                  className="text-orange-600"
                />

                <p className="mt-3 text-xs font-bold text-slate-700">
                  Not Picked
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  {number(notPicked)} shipments
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/tickets")
                }
                className="group rounded-xl border border-slate-200 p-4 text-left transition hover:border-[#008dd2]/30 hover:bg-[#008dd2]/5"
              >
                <HiOutlineTicket
                  size={19}
                  className="text-[#008dd2]"
                />

                <p className="mt-3 text-xs font-bold text-slate-700">
                  Tickets
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  Support center
                </p>
              </button>

            </div>
          </div>
        </section>

        {/* =================================================
            FOOTER SUMMARY
        ================================================= */}

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">

          <button
            type="button"
            onClick={() =>
              navigate("/processing-orders")
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-indigo-200"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Processing
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">
              {number(processing)}
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/pending")
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-yellow-200"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Pending
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">
              {number(pending)}
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/rto-in-transit")
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-amber-200"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              RTO In Transit
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">
              {number(rtoInTransit)}
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/rto-delivered")
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-rose-200"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              RTO Delivered
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">
              {number(rtoDelivered)}
            </p>
          </button>

        </section>

      </div>
    </div>
  );
}

export default AdminDashboard;