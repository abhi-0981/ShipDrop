import React, { useState, useEffect, useMemo, useCallback } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  HiOutlineDocumentReport,
  HiOutlineCube,
  HiOutlineCalendar,
  HiOutlineDownload,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineCurrencyRupee,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineTruck,
  HiOutlineLocationMarker,
  HiOutlineDuplicate,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineArrowNarrowRight,
  HiOutlineX,
} from "react-icons/hi";

// Date formatting helper (YYYY-MM-DD)
const formatDateForInput = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Preset dates helper
const getPresetDates = (preset) => {
  const now = new Date();
  const todayStr = formatDateForInput(now);

  if (preset === "today") {
    return { start: todayStr, end: todayStr };
  }
  if (preset === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const yStr = formatDateForInput(y);
    return { start: yStr, end: yStr };
  }
  if (preset === "7days") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { start: formatDateForInput(d), end: todayStr };
  }
  if (preset === "30days") {
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    return { start: formatDateForInput(d), end: todayStr };
  }
  if (preset === "thisMonth") {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: formatDateForInput(d), end: todayStr };
  }
  if (preset === "lastMonth") {
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start: formatDateForInput(firstDay), end: formatDateForInput(lastDay) };
  }
  return { start: todayStr, end: todayStr };
};

export default function ShipmentLifecycleReport() {
  // Preset selector
  const [datePreset, setDatePreset] = useState("30days");
  const initialDates = useMemo(() => getPresetDates("30days"), []);
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [carrierFilter, setCarrierFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Data
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [reportData, setReportData] = useState({ summary: {}, orders: [] });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [copiedAwb, setCopiedAwb] = useState(null);

  // Handle preset change
  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    if (preset !== "custom") {
      const dates = getPresetDates(preset);
      setStartDate(dates.start);
      setEndDate(dates.end);
    }
  };

  // Copy AWB / Order ID helper
  const handleCopy = (text, type = "AWB") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedAwb(text);
    toast.success(`${type} copied to clipboard!`, { id: "clipboard-toast", duration: 1500 });
    setTimeout(() => setCopiedAwb(null), 2000);
  };

  // Fetch report data from backend
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const savedUser = JSON.parse(localStorage.getItem("user") || "null");
      const userIdParam = savedUser?.id ? `&user_id=${savedUser.id}` : "";

      const queryParams = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        status: statusFilter,
        payment_type: paymentFilter,
        carrier: carrierFilter,
        search: searchTerm,
      }).toString();

      const res = await api.get(`/reports/shipment-status?${queryParams}${userIdParam}`);
      if (res.data?.success) {
        setReportData({
          summary: res.data.summary || {},
          orders: res.data.orders || [],
        });
        setCurrentPage(1);
      } else {
        toast.error(res.data?.message || "Failed to load report");
      }
    } catch (err) {
      console.error("Fetch shipment report error:", err);
      toast.error(err.response?.data?.message || "Failed to load shipment report");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, statusFilter, paymentFilter, carrierFilter, searchTerm]);

  // Initial fetch and auto-refresh when main filters change
  useEffect(() => {
    fetchReport();
  }, [startDate, endDate, statusFilter, paymentFilter, carrierFilter]);

  // Handle Search on Enter or debounce
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReport();
  };

  // Client-side search & pagination
  const filteredOrders = useMemo(() => {
    let list = reportData.orders || [];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (o) =>
          String(o.awb || "").toLowerCase().includes(q) ||
          String(o.order_id || "").toLowerCase().includes(q) ||
          String(o.consignee_name || "").toLowerCase().includes(q) ||
          String(o.city || "").toLowerCase().includes(q) ||
          String(o.mobile || "").includes(q)
      );
    }
    return list;
  }, [reportData.orders, searchTerm]);

  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage) || 1;
  const currentOrders = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredOrders.slice(start, start + rowsPerPage);
  }, [filteredOrders, currentPage, rowsPerPage]);

  // Summary Metrics
  const summary = reportData.summary || {};
  const totalOrders = summary.total_orders || 0;
  const deliveredCount = summary.delivered_count || 0;
  const deliveredPercent = summary.delivered_percentage || 0;
  const rtoDeliveredCount = summary.rto_delivered_count || 0;
  const rtoInTransitCount = summary.rto_in_transit_count || 0;
  const totalRto = summary.total_rto_count || (rtoDeliveredCount + rtoInTransitCount);
  const rtoPercent = summary.rto_percentage || (totalOrders > 0 ? Number(((totalRto / totalOrders) * 100).toFixed(1)) : 0);
  const inTransitCount = summary.in_transit_count || 0;
  const outForDeliveryCount = summary.out_for_delivery_count || 0;
  const ndrPendingCount = summary.ndr_pending_count || 0;
  const manifestedCount = summary.manifested_count || 0;
  const cancelledCount = summary.cancelled_count || 0;
  const totalShipping = summary.total_shipping_charges || 0;

  // Lifecycle status badge styling
  const getStatusBadge = (lifecycleStatus) => {
    const s = String(lifecycleStatus || "").toUpperCase();
    if (s.includes("DELIVERED") && !s.includes("RTO")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Delivered
        </span>
      );
    }
    if (s.includes("RTO DELIVERED")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          RTO Delivered
        </span>
      );
    }
    if (s.includes("RTO")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          RTO In Transit
        </span>
      );
    }
    if (s.includes("OUT FOR DELIVERY") || s === "OFD") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce"></span>
          Out for Delivery
        </span>
      );
    }
    if (s.includes("IN TRANSIT")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          In Transit
        </span>
      );
    }
    if (s.includes("NDR") || s.includes("PENDING")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          NDR / Action Required
        </span>
      );
    }
    if (s.includes("MANIFESTED") || s.includes("NOT PICKED") || s.includes("READY")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Manifested
        </span>
      );
    }
    if (s.includes("CANCEL")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        {lifecycleStatus || "Booked"}
      </span>
    );
  };

  // Export to CSV / Excel
  const handleExportCSV = () => {
    if (!filteredOrders.length) {
      toast.error("No data available to export");
      return;
    }
    setExporting(true);
    try {
      const headers = [
        "Order ID",
        "AWB",
        "Carrier",
        "Lifecycle Status",
        "Original Status",
        "Payment Type",
        "Weight (KG)",
        "Freight Charge (INR)",
        "Consignee Name",
        "Consignee Mobile",
        "City",
        "State",
        "Pincode",
        "Booking Date",
      ];

      const csvRows = [headers.join(",")];

      filteredOrders.forEach((o) => {
        const row = [
          `"${String(o.order_id || "").replace(/"/g, '""')}"`,
          `"${String(o.awb || "").replace(/"/g, '""')}"`,
          `"${String(o.carrier || "Delhivery").replace(/"/g, '""')}"`,
          `"${String(o.lifecycle_status || "").replace(/"/g, '""')}"`,
          `"${String(o.tracking_status || o.status || "").replace(/"/g, '""')}"`,
          `"${String(o.payment_type || "Prepaid").replace(/"/g, '""')}"`,
          o.weight || 0.5,
          o.shipping_charge || 0,
          `"${String(o.consignee_name || "").replace(/"/g, '""')}"`,
          `"${String(o.mobile || "").replace(/"/g, '""')}"`,
          `"${String(o.city || "").replace(/"/g, '""')}"`,
          `"${String(o.state || "").replace(/"/g, '""')}"`,
          `"${String(o.pincode || "").replace(/"/g, '""')}"`,
          `"${o.created_at ? new Date(o.created_at).toLocaleString("en-IN") : ""}"`,
        ];
        csvRows.push(row.join(","));
      });

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `ShipDrop_Shipment_Lifecycle_${startDate}_to_${endDate}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Shipment report exported successfully!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] dark:bg-[#090b10] px-4 py-5">
      <div className="mx-auto max-w-[1450px]">
        {/* ==================================================
            1. TOP HEADER
        ================================================== */}
        <div className="mb-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#edf8ff] text-[#008dd2]">
                <HiOutlineDocumentReport className="text-[20px]" />
              </div>

              <div>
                <h1 className="text-[17px] font-semibold tracking-[-0.2px] text-slate-900">
                  Shipment Report
                </h1>
                <p className="mt-0.5 text-[12px] text-slate-400">
                  Track parcel transitions, delivery success ratios, RTO volumes, and logistics freight expenditure
                </p>
              </div>
            </div>

            {/* TOP BUTTONS */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={loading || exporting || filteredOrders.length === 0}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#10b981] px-3.5 text-[12px] font-medium text-white transition hover:bg-[#059669] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <HiOutlineDownload className="text-[15px]" />
                <span>{exporting ? "Exporting..." : "Export CSV"}</span>
              </button>

              <button
                type="button"
                onClick={fetchReport}
                disabled={loading}
                title="Refresh"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              >
                <HiOutlineRefresh className={`text-[15px] ${loading ? "animate-spin text-[#008dd2]" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* ==================================================
            2. DATE PERIOD FILTER
        ================================================== */}
        <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
                Period:
              </span>
              {[
                { id: "today", label: "Today" },
                { id: "yesterday", label: "Yesterday" },
                { id: "7days", label: "Last 7 Days" },
                { id: "30days", label: "Last 30 Days" },
                { id: "thisMonth", label: "This Month" },
                { id: "lastMonth", label: "Last Month" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetChange(p.id)}
                  className={`px-3 py-1.5 rounded-md text-[12px] transition ${
                    datePreset === p.id
                      ? "bg-[#008dd2] text-white font-semibold shadow-xs"
                      : "bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 font-medium"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Date Inputs */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1">
                <HiOutlineCalendar className="text-slate-400 text-sm" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setDatePreset("custom");
                    setStartDate(e.target.value);
                  }}
                  className="bg-transparent text-[12px] font-medium text-slate-700 outline-none"
                />
                <span className="text-slate-300 text-xs">→</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setDatePreset("custom");
                    setEndDate(e.target.value);
                  }}
                  className="bg-transparent text-[12px] font-medium text-slate-700 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            3. KPI SUMMARY CARDS (Dashboard StatCard Design)
        ================================================== */}
        <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {/* Card 1: Total Booked */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)] transition-all">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-[12px] font-medium text-slate-500 truncate">
                  Total Booked
                </p>
                {loading ? (
                  <div className="mt-1.5 h-6 w-20 rounded-md bg-slate-200 skeleton-shimmer" />
                ) : (
                  <p className="mt-1 text-[22px] font-bold tracking-tight text-slate-800 truncate">
                    {totalOrders}
                  </p>
                )}
                {loading ? (
                  <div className="mt-1 h-3.5 w-28 rounded bg-slate-100 skeleton-shimmer" />
                ) : (
                  <p className="mt-0.5 text-[11px] text-slate-400 truncate">
                    Freight: ₹{totalShipping.toLocaleString("en-IN")}
                  </p>
                )}
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#008dd2]">
                <HiOutlineCube className="text-lg" />
              </div>
            </div>
          </div>

          {/* Card 2: Delivered */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)] transition-all">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-[12px] font-medium text-emerald-600 truncate">
                  Delivered ({deliveredPercent}%)
                </p>
                {loading ? (
                  <div className="mt-1.5 h-6 w-20 rounded-md bg-slate-200 skeleton-shimmer" />
                ) : (
                  <p className="mt-1 text-[22px] font-bold tracking-tight text-emerald-600 truncate">
                    {deliveredCount}
                  </p>
                )}
                {loading ? (
                  <div className="mt-1 h-3.5 w-24 rounded bg-slate-100 skeleton-shimmer" />
                ) : (
                  <p className="mt-0.5 text-[11px] text-slate-400 truncate">
                    Successful delivery rate
                  </p>
                )}
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <HiOutlineCheckCircle className="text-lg" />
              </div>
            </div>
          </div>

          {/* Card 3: RTO Returns */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)] transition-all">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-[12px] font-medium text-rose-500 truncate">
                  RTO Returns ({rtoPercent}%)
                </p>
                {loading ? (
                  <div className="mt-1.5 h-6 w-20 rounded-md bg-slate-200 skeleton-shimmer" />
                ) : (
                  <p className="mt-1 text-[22px] font-bold tracking-tight text-rose-600 truncate">
                    {totalRto}
                  </p>
                )}
                {loading ? (
                  <div className="mt-1 h-3.5 w-32 rounded bg-slate-100 skeleton-shimmer" />
                ) : (
                  <p className="mt-0.5 text-[11px] text-slate-400 truncate">
                    Delivered: {rtoDeliveredCount} • Transit: {rtoInTransitCount}
                  </p>
                )}
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <HiOutlineExclamationCircle className="text-lg" />
              </div>
            </div>
          </div>

          {/* Card 4: Active In-Transit */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)] transition-all">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-[12px] font-medium text-amber-600 truncate">
                  Active In-Transit
                </p>
                {loading ? (
                  <div className="mt-1.5 h-6 w-20 rounded-md bg-slate-200 skeleton-shimmer" />
                ) : (
                  <p className="mt-1 text-[22px] font-bold tracking-tight text-slate-800 truncate">
                    {inTransitCount}
                  </p>
                )}
                {loading ? (
                  <div className="mt-1 h-3.5 w-28 rounded bg-slate-100 skeleton-shimmer" />
                ) : (
                  <p className="mt-0.5 text-[11px] text-slate-400 truncate">
                    Out for Delivery: {outForDeliveryCount}
                  </p>
                )}
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <HiOutlineTruck className="text-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Quick Metric Badges */}
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider">NDR / Pending</div>
              {loading ? (
                <div className="h-5 w-12 rounded bg-slate-200 skeleton-shimmer mt-1" />
              ) : (
                <div className="text-[18px] font-bold text-slate-800 mt-0.5">{ndrPendingCount}</div>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-bold">
              !
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">Manifested / Pickup</div>
              {loading ? (
                <div className="h-5 w-12 rounded bg-slate-200 skeleton-shimmer mt-1" />
              ) : (
                <div className="text-[18px] font-bold text-slate-800 mt-0.5">{manifestedCount}</div>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold">
              <HiOutlineClock />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cancelled Orders</div>
              {loading ? (
                <div className="h-5 w-12 rounded bg-slate-200 skeleton-shimmer mt-1" />
              ) : (
                <div className="text-[18px] font-bold text-slate-800 mt-0.5">{cancelledCount}</div>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-bold">
              ✕
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Payment Mix</div>
              {loading ? (
                <div className="h-4 w-32 rounded bg-slate-200 skeleton-shimmer mt-1.5" />
              ) : (
                <div className="text-[12px] font-semibold text-slate-700 mt-0.5">
                  COD: <span className="text-[#008dd2]">{summary.cod_orders_count || 0}</span> | Prepaid: <span className="text-emerald-600">{summary.prepaid_orders_count || 0}</span>
                </div>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
              ₹
            </div>
          </div>
        </div>


        {/* ==================================================
            4. FILTER BAR
        ================================================== */}
        <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
          <div className="flex flex-wrap items-center gap-2">
            {/* SEARCH */}
            <div className="relative min-w-[280px] flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <HiOutlineSearch className="text-[15px]" />
              </span>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by AWB, Order ID, Consignee, City..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/5"
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <HiOutlineX className="text-sm" />
                </button>
              )}
            </div>

            {/* STATUS FILTER */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 min-w-[145px] rounded-lg border border-slate-200 bg-white px-3 text-[12px] text-slate-600 outline-none focus:border-[#008dd2]"
            >
              <option value="ALL">All Statuses</option>
              <option value="DELIVERED">Delivered</option>
              <option value="RTO DELIVERED">RTO Delivered</option>
              <option value="RTO IN TRANSIT">RTO In Transit</option>
              <option value="IN TRANSIT">In Transit</option>
              <option value="OUT FOR DELIVERY">Out for Delivery</option>
              <option value="NDR">NDR / Pending</option>
              <option value="MANIFESTED">Manifested</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* PAYMENT FILTER */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="h-10 min-w-[130px] rounded-lg border border-slate-200 bg-white px-3 text-[12px] text-slate-600 outline-none focus:border-[#008dd2]"
            >
              <option value="ALL">All Payment</option>
              <option value="COD">COD</option>
              <option value="Prepaid">Prepaid</option>
            </select>

            {/* ROWS PER PAGE */}
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-10 min-w-[110px] rounded-lg border border-slate-200 bg-white px-3 text-[12px] text-slate-600 outline-none focus:border-[#008dd2]"
            >
              <option value={10}>10 Rows</option>
              <option value={25}>25 Rows</option>
              <option value={50}>50 Rows</option>
              <option value={100}>100 Rows</option>
            </select>
          </div>
        </div>

        {/* ==================================================
            5. TABLE
        ================================================== */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-white text-[12px] font-medium text-slate-700">
                  <th className="py-3 px-4">Order ID & AWB</th>
                  <th className="py-3 px-4">Booking Date</th>
                  <th className="py-3 px-4">Consignee & Destination</th>
                  <th className="py-3 px-4">Carrier & Mode</th>
                  <th className="py-3 px-4 text-center">Lifecycle Status</th>
                  <th className="py-3 px-4 text-right">Weight</th>
                  <th className="py-3 px-4 text-right">Freight (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[12px] text-slate-700">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-b-0" style={{ opacity: 1 - i * 0.12 }}>
                      {/* Order ID & AWB */}
                      <td className="py-3 px-4 space-y-1.5">
                        <div className="h-3.5 w-24 rounded bg-slate-200 skeleton-shimmer" />
                        <div className="h-2.5 w-28 rounded bg-slate-100 skeleton-shimmer" />
                      </td>

                      {/* Booking Date */}
                      <td className="py-3 px-4 space-y-1.5">
                        <div className="h-3.5 w-20 rounded bg-slate-200 skeleton-shimmer" />
                        <div className="h-2.5 w-14 rounded bg-slate-100 skeleton-shimmer" />
                      </td>

                      {/* Consignee & Destination */}
                      <td className="py-3 px-4 space-y-1.5">
                        <div className="h-3.5 w-32 rounded bg-slate-200 skeleton-shimmer" />
                        <div className="h-2.5 w-28 rounded bg-slate-100 skeleton-shimmer" />
                      </td>

                      {/* Carrier & Mode */}
                      <td className="py-3 px-4 space-y-1.5">
                        <div className="h-5 w-20 rounded-md bg-slate-200 skeleton-shimmer" />
                        <div className="h-3.5 w-12 rounded bg-slate-100 skeleton-shimmer" />
                      </td>

                      {/* Lifecycle Status */}
                      <td className="py-3 px-4 text-center">
                        <div className="h-6 w-24 rounded-full bg-slate-200 skeleton-shimmer mx-auto" />
                      </td>

                      {/* Weight */}
                      <td className="py-3 px-4 text-right">
                        <div className="h-4 w-14 rounded bg-slate-200 skeleton-shimmer ml-auto" />
                      </td>

                      {/* Freight */}
                      <td className="py-3 px-4 text-right">
                        <div className="h-4 w-16 rounded bg-slate-200 skeleton-shimmer ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : currentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-14 text-center">
                      <div className="max-w-sm mx-auto flex flex-col items-center justify-center text-slate-400">
                        <div className="h-12 w-12 rounded-xl bg-[#edf8ff] text-[#008dd2] flex items-center justify-center text-2xl mb-2.5">
                          <HiOutlineDocumentReport />
                        </div>
                        <p className="text-[13px] font-bold text-slate-800">No shipments found in selected range</p>
                        <p className="text-[11.5px] text-slate-400 mt-0.5">
                          Try expanding your date range or clearing filters to view historical lifecycle events.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentOrders.map((o) => (
                    <tr key={o.id || o.awb} className="hover:bg-slate-50/60 transition-colors">
                      {/* Order ID & AWB */}
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-semibold text-slate-900 text-[12px] flex items-center gap-1.5">
                            <span>#{o.order_id}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(o.order_id, "Order ID")}
                              className="text-slate-400 hover:text-slate-600 transition"
                              title="Copy Order ID"
                            >
                              <HiOutlineDuplicate className="text-xs" />
                            </button>
                          </div>
                          {o.awb ? (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                {o.awb}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(o.awb, "AWB")}
                                className="text-slate-400 hover:text-[#008dd2] transition"
                                title="Copy AWB"
                              >
                                <HiOutlineDuplicate className="text-xs" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10.5px] text-amber-600 font-medium">AWB Pending</span>
                          )}
                        </div>
                      </td>

                      {/* Booking Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-[12px] font-medium text-slate-700">
                          {o.created_at ? new Date(o.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                        </div>
                        <div className="text-[10.5px] text-slate-400 font-medium">
                          {o.created_at ? new Date(o.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                        </div>
                      </td>

                      {/* Consignee & Destination */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 text-[12px] truncate max-w-[180px]">
                          {o.consignee_name || "Customer"}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <HiOutlineLocationMarker className="text-slate-400 shrink-0 text-xs" />
                          <span className="truncate max-w-[170px]">
                            {o.city ? `${o.city}, ` : ""}{o.state || ""}{o.pincode ? ` (${o.pincode})` : ""}
                          </span>
                        </div>
                      </td>

                      {/* Carrier & Mode */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          <span>{o.carrier || "Delhivery"}</span>
                        </div>
                        <div className="mt-1">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              String(o.payment_type || "").toUpperCase().includes("COD")
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {o.payment_type || "Prepaid"}
                          </span>
                        </div>
                      </td>

                      {/* Status Pill */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {getStatusBadge(o.lifecycle_status)}
                      </td>

                      {/* Weight */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-medium text-slate-600 text-[12px]">
                        {Number(o.weight || 0.5).toFixed(2)} kg
                      </td>

                      {/* Shipping Charge */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-slate-800 text-[12px]">
                        ₹{Number(o.shipping_charge || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          {!loading && filteredOrders.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-100">
              <div className="text-[12px] font-medium text-slate-500">
                Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * rowsPerPage + 1}</span> to{" "}
                <span className="font-semibold text-slate-700">
                  {Math.min(currentPage * rowsPerPage, filteredOrders.length)}
                </span>{" "}
                of <span className="font-semibold text-slate-700">{filteredOrders.length}</span> orders
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
                >
                  <HiOutlineChevronLeft className="text-base" />
                </button>

                <span className="text-[12px] font-semibold text-slate-700 px-2">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
                >
                  <HiOutlineChevronRight className="text-base" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
