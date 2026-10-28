import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  FiSearch,
  FiPackage,
  FiMapPin,
  FiClock,
  FiCalendar,
  FiCheckCircle,
  FiTruck,
  FiCopy,
  FiCheck,
  FiRefreshCw,
  FiArrowRight,
  FiAlertCircle,
  FiExternalLink,
} from "react-icons/fi";
import api from "../../services/api";

// ======================================================
// FORMATTING & PARSING HELPERS
// ======================================================

const formatTrackingDateTime = (value) => {
  if (!value) return "—";
  try {
    // Normalizing space-separated datetime like "2026-10-28 14:30:00" to ISO
    const safeStr = typeof value === "string" ? value.trim().replace(" ", "T") : value;
    const date = new Date(safeStr);
    if (Number.isNaN(date.getTime())) {
      const fallbackDate = new Date(value);
      if (Number.isNaN(fallbackDate.getTime())) return String(value);
      return fallbackDate.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return String(value);
  }
};

const formatTrackingDate = (value) => {
  if (!value) return "—";
  try {
    const safeStr = typeof value === "string" ? value.trim().replace(" ", "T") : value;
    const date = new Date(safeStr);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
};

const humanizeStatus = (status) => {
  if (!status) return "Tracking Unavailable";
  const s = String(status).trim().toUpperCase();
  if (s === "DELIVERED") return "Delivered";
  if (s === "IN_TRANSIT" || s === "IN TRANSIT") return "In Transit";
  if (s === "OUT_FOR_DELIVERY" || s === "OUT FOR DELIVERY") return "Out For Delivery";
  if (s === "MANIFESTED") return "Manifested";
  if (s === "NOT_PICKED" || s === "NOT PICKED") return "Not Picked";
  if (s === "RTO_IN_TRANSIT" || s === "RTO IN TRANSIT") return "RTO In Transit";
  if (s === "RTO_DELIVERED" || s === "RTO DELIVERED") return "RTO Delivered";
  if (s === "CANCELLED") return "Cancelled";
  if (s === "PENDING") return "Pending (NDR)";

  return status
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
    .join(" ");
};

const getStatusBadgeClass = (status) => {
  const s = String(status || "").toUpperCase();
  if (s.includes("DELIVERED") && !s.includes("RTO")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50";
  }
  if (s.includes("OUT") || s.includes("OFD")) {
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50";
  }
  if (s.includes("TRANSIT") || s.includes("DISPATCH") || s.includes("ARRIVED") || s.includes("REACHED")) {
    return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/50";
  }
  if (s.includes("RTO") || s.includes("CANCEL")) {
    return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50";
  }
  if (s.includes("PENDING")) {
    return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/50";
  }
  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
};

// Milestone Step Finder
const getMilestoneIndex = (status) => {
  const s = String(status || "").toUpperCase();
  if (s.includes("DELIVERED") && !s.includes("RTO")) return 3;
  if (s.includes("OUT") || s.includes("OFD")) return 2;
  if (s.includes("TRANSIT") || s.includes("DISPATCH") || s.includes("REACHED") || s.includes("ARRIVED")) return 1;
  return 0; // Manifested / Booked
};

/**
 * Robust extractor for Delhivery tracking scans.
 * Delhivery returns scan objects where event attributes are inside ScanDetail.
 */
const extractTrackingScans = (order) => {
  let rawScans = [];

  if (Array.isArray(order?.tracking_scans) && order.tracking_scans.length > 0) {
    rawScans = order.tracking_scans;
  } else if (order?.tracking_data) {
    try {
      let tData = order.tracking_data;
      if (typeof tData === "string") tData = JSON.parse(tData);
      if (Array.isArray(tData?.Scans)) rawScans = tData.Scans;
      else if (Array.isArray(tData?.Shipment?.Scans)) rawScans = tData.Shipment.Scans;
      else if (Array.isArray(tData?.scans)) rawScans = tData.scans;
    } catch {}
  }

  const parsed = rawScans.map((scan, index) => {
    // Delhivery puts the actual attributes inside scan.ScanDetail
    const detail =
      scan?.ScanDetail ||
      scan?.scanDetail ||
      scan?.scan_detail ||
      scan ||
      {};

    const statusTitle =
      detail?.Scan ||
      detail?.scan ||
      detail?.Status ||
      detail?.status ||
      detail?.ScanGroup ||
      detail?.scan_group ||
      detail?.Instructions ||
      detail?.instructions ||
      detail?.ScanType ||
      detail?.scan_type ||
      "Status Update";

    const location =
      detail?.ScannedLocation ||
      detail?.scanned_location ||
      detail?.ScanLocation ||
      detail?.scan_location ||
      detail?.StatusLocation ||
      detail?.status_location ||
      detail?.Location ||
      detail?.location ||
      detail?.City ||
      detail?.city ||
      "";

    const dateTime =
      detail?.ScanDateTime ||
      detail?.scan_date_time ||
      detail?.StatusDateTime ||
      detail?.status_date_time ||
      detail?.DateTime ||
      detail?.date_time ||
      scan?.dateTime ||
      scan?.status_datetime ||
      null;

    const instructions =
      detail?.Instructions ||
      detail?.instructions ||
      detail?.Comment ||
      detail?.comment ||
      detail?.Remark ||
      detail?.remark ||
      "";

    const cleanTitle = String(statusTitle).trim();
    const cleanInstructions = String(instructions).trim();
    const hasDistinctNote =
      Boolean(cleanInstructions) &&
      cleanInstructions.toLowerCase() !== cleanTitle.toLowerCase();

    return {
      id: `${index}-${dateTime || index}`,
      status: cleanTitle,
      location: String(location).trim(),
      dateTime,
      instructions: hasDistinctNote ? cleanInstructions : "",
      statusCode: detail?.StatusCode || detail?.status_code || detail?.ScanType || "",
    };
  });

  parsed.sort((a, b) => {
    const aTime = a.dateTime ? new Date(String(a.dateTime).replace(" ", "T")).getTime() : 0;
    const bTime = b.dateTime ? new Date(String(b.dateTime).replace(" ", "T")).getTime() : 0;
    return bTime - aTime;
  });

  // If no scans recorded yet, synthesize the base manifest event
  if (parsed.length === 0 && order) {
    parsed.push({
      id: "manifest-0",
      status: order.tracking_status || order.status || "Manifested",
      location: order.tracking_location || order.pickup_city || "Origin Facility",
      dateTime: order.tracking_status_datetime || order.created_at,
      instructions: order.tracking_instructions || "Shipment created & manifested with courier",
      statusCode: "MANIFEST",
    });
  }

  return parsed;
};

// ======================================================
// COMPONENT
// ======================================================

export default function Tracking() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("search") || searchParams.get("awb") || "";

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const stored = localStorage.getItem("shipdrop_recent_tracking");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const searchInputRef = useRef(null);

  const saveRecentSearch = (query) => {
    const q = String(query || "").trim();
    if (!q) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== q.toLowerCase());
      const next = [q, ...filtered].slice(0, 5);
      try {
        localStorage.setItem("shipdrop_recent_tracking", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const executeSearch = async (queryToSearch) => {
    const search = String(queryToSearch ?? searchInput ?? "").trim();
    if (!search) {
      toast.error("Please enter a Tracking ID or Order ID");
      searchInputRef.current?.focus();
      return;
    }

    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    if (!savedUser?.id) {
      toast.error("Please login to track your shipments");
      return;
    }

    setLoading(true);
    setSearchedQuery(search);

    try {
      const response = await api.get("/orders/tracking-search", {
        params: {
          user_id: savedUser.id,
          search,
        },
      });

      const foundOrder = response.data?.order;
      if (!foundOrder) {
        setOrder(null);
        toast.error("No shipment found matching this ID");
        return;
      }

      setOrder(foundOrder);
      saveRecentSearch(search);
      setSearchParams({ search }, { replace: true });
    } catch (error) {
      setOrder(null);
      toast.error(error.response?.data?.message || "Unable to search shipment");
    } finally {
      setLoading(false);
    }
  };

  // Auto-search on mount if URL has search param
  useEffect(() => {
    if (initialQuery.trim()) {
      executeSearch(initialQuery.trim());
    }
  }, []);

  // Quick auto-search when 14-digit AWB is entered
  useEffect(() => {
    const trimmed = String(searchInput || "").trim();
    if (/^\d{14}$/.test(trimmed) && trimmed !== searchedQuery && !loading) {
      executeSearch(trimmed);
    }
  }, [searchInput]);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleClear = () => {
    setSearchInput("");
    setOrder(null);
    setSearchedQuery("");
    setSearchParams({}, { replace: true });
    searchInputRef.current?.focus();
  };

  const activeMilestone = order ? getMilestoneIndex(order.tracking_status) : 0;
  const scans = order ? extractTrackingScans(order) : [];

  return (
    <div className="min-h-full w-full bg-[#f6f8fb] dark:bg-[#090b10] p-3.5 sm:p-5 md:p-6 pb-24 lg:pb-10 transition-colors">
      <div className="mx-auto max-w-5xl space-y-5">
        {/* ==================================================
            PAGE HEADER
        ================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span>Tools</span>
              <span>/</span>
              <span className="text-[#008dd2]">Tracking</span>
            </div>
            <h1 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Shipment Tracking
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Live tracking status, milestone updates, and full scan history directly from logistics network.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/70 dark:bg-emerald-950/40 dark:border-emerald-900/40 px-3 py-1.5 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                Live Status
              </span>
            </div>
          </div>
        </div>

        {/* ==================================================
            SEARCH CARD
        ================================================== */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeSearch(searchInput);
            }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
          >
            <div className="relative flex-1">
              <FiSearch
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter Tracking ID or Order ID..."
                disabled={loading}
                className="h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 pl-11 pr-10 text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-[#008dd2] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-[#008dd2]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition"
                  title="Clear input"
                >
                  ×
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !searchInput.trim()}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#008dd2] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#007ab6] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Tracking...</span>
                </>
              ) : (
                <>
                  <FiSearch size={16} />
                  <span>Track Shipment</span>
                </>
              )}
            </button>
          </form>

          {/* RECENT SEARCHES */}
          {recentSearches.length > 0 && !order && (
            <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-400">Recent:</span>
              {recentSearches.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setSearchInput(item);
                    executeSearch(item);
                  }}
                  className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-sky-50 hover:text-[#008dd2] dark:hover:bg-slate-700 transition"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ==================================================
            EMPTY / INITIAL STATE
        ================================================== */}
        {!order && !loading && (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-8 sm:p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-[#008dd2] shadow-xs mb-3.5">
              <FiTruck size={26} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Track Any Order or Shipment
            </h3>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-400">
              Enter a 14-digit Delhivery Tracking Number (AWB) or your 6-digit Order ID above to view live real-time status, scan updates, and expected delivery.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/all-orders"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
              >
                <span>View All Orders</span>
                <FiArrowRight size={13} />
              </Link>
              <Link
                to="/processing-orders"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
              >
                <span>Ready to Ship Orders</span>
                <FiArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}

        {/* ==================================================
            TRACKING RESULT
        ================================================== */}
        {order && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* OVERVIEW CARD */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              {/* TOP STRIP */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 px-4 py-3.5 sm:px-6">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/60 text-[#008dd2]">
                    <FiPackage size={17} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        Order #{order.order_id ?? order.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(order.order_id ?? order.id, "order_id")}
                        className="text-slate-400 hover:text-slate-600 transition"
                        title="Copy Order ID"
                      >
                        {copiedKey === "order_id" ? <FiCheck className="text-emerald-500" size={13} /> : <FiCopy size={13} />}
                      </button>
                    </div>
                    <p className="text-[11px] font-medium text-slate-400">
                      Courier: <span className="font-semibold text-slate-700 dark:text-slate-300">{order.courier_name || order.carrier || "Delhivery"}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                      order.tracking_status || order.status,
                    )}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {humanizeStatus(order.tracking_status || order.status)}
                  </span>

                  <button
                    type="button"
                    onClick={() => executeSearch(searchedQuery)}
                    disabled={loading}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition"
                    title="Refresh tracking data"
                  >
                    <FiRefreshCw size={13} className={loading ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>

              {/* 4-COLUMN STATS */}
              <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-slate-800 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
                <div className="p-4 sm:p-5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Tracking AWB
                  </span>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="font-mono text-sm font-bold text-slate-800 dark:text-slate-100">
                      {order.tracking_awb || order.awb || "—"}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopy(order.tracking_awb || order.awb, "awb")}
                      className="text-slate-400 hover:text-slate-600 transition"
                      title="Copy AWB"
                    >
                      {copiedKey === "awb" ? <FiCheck className="text-emerald-500" size={13} /> : <FiCopy size={13} />}
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Current Location
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <FiMapPin size={14} className="text-slate-400 shrink-0" />
                    <p className="truncate text-xs font-bold text-slate-700 dark:text-slate-200">
                      {order.tracking_location || scans[0]?.location || "In Transit Facility"}
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Status Date & Time
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <FiClock size={14} className="text-slate-400 shrink-0" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {formatTrackingDateTime(order.tracking_status_datetime || scans[0]?.dateTime)}
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Expected Delivery
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <FiCalendar size={14} className="text-slate-400 shrink-0" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {formatTrackingDate(order.tracking_expected_delivery)}
                    </p>
                  </div>
                </div>
              </div>

              {/* LATEST UPDATE BANNER */}
              {order.tracking_instructions && (
                <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 bg-sky-50/40 dark:bg-sky-950/20 px-4 py-3 sm:px-6 text-xs text-slate-700 dark:text-slate-300">
                  <FiAlertCircle size={15} className="text-[#008dd2] shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Latest Update:</span>
                  <span className="truncate">{order.tracking_instructions}</span>
                </div>
              )}
            </div>

            {/* MILESTONE STEPPER */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5">
                Delivery Progress
              </h2>

              <div className="relative">
                {/* Horizontal Track Line */}
                <div className="absolute top-4 left-6 right-6 hidden sm:block h-0.5 bg-slate-100 dark:bg-slate-800" />
                <div
                  className="absolute top-4 left-6 hidden sm:block h-0.5 bg-[#008dd2] transition-all duration-500"
                  style={{ width: `${(activeMilestone / 3) * 85}%` }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2">
                  {[
                    { title: "Manifested", desc: "Shipment booked" },
                    { title: "In Transit", desc: "On the way to hub" },
                    { title: "Out for Delivery", desc: "Courier out for delivery" },
                    { title: "Delivered", desc: "Package handed over" },
                  ].map((step, index) => {
                    const isPassed = index <= activeMilestone;
                    const isCurrent = index === activeMilestone;

                    return (
                      <div
                        key={step.title}
                        className="flex sm:flex-col items-center sm:items-center text-left sm:text-center gap-3 sm:gap-2 relative z-10"
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition ${
                            isCurrent
                              ? "border-[#008dd2] bg-[#008dd2] text-white shadow-md shadow-[#008dd2]/20 ring-4 ring-[#008dd2]/15"
                              : isPassed
                              ? "border-[#008dd2] bg-[#008dd2] text-white"
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-300"
                          }`}
                        >
                          {isPassed ? <FiCheck size={14} /> : <span className="text-xs font-bold">{index + 1}</span>}
                        </div>
                        <div>
                          <p
                            className={`text-xs font-bold ${
                              isCurrent
                                ? "text-[#008dd2]"
                                : isPassed
                                ? "text-slate-800 dark:text-slate-100"
                                : "text-slate-400"
                            }`}
                          >
                            {step.title}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>


            {/* TIMELINE SCANS */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Shipment Timeline
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Full scan log directly from Delhivery logistics network
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                  {scans.length} {scans.length === 1 ? "Event" : "Events"}
                </span>
              </div>

              {scans.length > 0 ? (
                <div className="relative pl-2 sm:pl-3">
                  {/* Vertical Progress Line */}
                  <div className="absolute left-[13px] sm:left-[17px] top-3 bottom-3 w-0.5 bg-slate-200 dark:bg-slate-800" />

                  <div className="space-y-4">
                    {scans.map((scan, idx) => (
                      <div key={scan.id || idx} className="relative flex items-start gap-3.5">
                        {/* Event Circle Node */}
                        <div
                          className={`relative z-10 mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                            idx === 0
                              ? "border-[#008dd2] bg-white dark:bg-slate-900 ring-4 ring-[#008dd2]/20"
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                          }`}
                        >
                          {idx === 0 && <span className="h-1.5 w-1.5 rounded-full bg-[#008dd2]" />}
                        </div>

                        {/* Event Card Content */}
                        <div
                          className={`flex-1 rounded-xl border p-3.5 sm:p-4 transition ${
                            idx === 0
                              ? "border-sky-200 dark:border-sky-900/50 bg-sky-50/50 dark:bg-sky-950/20 shadow-xs"
                              : "border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-800/40"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 sm:gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                  {scan.status || "Status Update"}
                                </p>
                                {idx === 0 && (
                                  <span className="rounded-md bg-[#008dd2]/10 px-2 py-0.5 text-[10px] font-bold text-[#008dd2]">
                                    Latest Event
                                  </span>
                                )}
                              </div>

                              {scan.location && (
                                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <FiMapPin size={12} className="text-[#008dd2] shrink-0" />
                                  <span>{scan.location}</span>
                                </p>
                              )}

                              {scan.instructions && (
                                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                  {scan.instructions}
                                </p>
                              )}
                            </div>

                            <div className="shrink-0 text-left sm:text-right mt-1 sm:mt-0">
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                <FiClock size={11} className="text-slate-400" />
                                <span>{formatTrackingDateTime(scan.dateTime)}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 p-8 text-center">
                  <p className="text-xs font-semibold text-slate-500">
                    No timeline scan events logged yet for this shipment.
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Status updates will appear here as soon as the courier scans the package.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
