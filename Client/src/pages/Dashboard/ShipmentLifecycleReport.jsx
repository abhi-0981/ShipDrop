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
  HiOutlineClipboardCopy,
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
  const [loading, setLoading] = useState(false);
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
      toast.success("Shipment lifecycle report exported successfully!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100/60 p-4 sm:p-6 lg:p-8">
      {/* ============================================================ */}
      {/* 1. TOP HEADER BANNER (PREMIUM GRADIENT & ACTIONS) */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6 mb-6">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-[#008dd2]/15 via-sky-400/10 to-transparent rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-sky-50 border border-sky-100 text-[#008dd2] text-xs font-semibold uppercase tracking-wider mb-2">
              <HiOutlineDocumentReport className="text-base" />
              <span>Lifecycle Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              Shipment Status & Lifecycle Report
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Track parcel transitions, delivery success ratios, RTO volumes, and logistics freight expenditure across custom date horizons.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 hover:border-slate-300 transition shadow-sm disabled:opacity-50"
              title="Refresh Data"
            >
              <HiOutlineRefresh className={`text-base text-slate-500 ${loading ? "animate-spin text-[#008dd2]" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={loading || exporting || filteredOrders.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#008dd2] hover:bg-[#007bb8] text-white text-xs font-semibold transition shadow-md shadow-[#008dd2]/20 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
            >
              <HiOutlineDownload className="text-base" />
              <span>{exporting ? "Generating CSV..." : "Export CSV Report"}</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* DATE PRESETS & CONTROLS */}
        {/* ============================================================ */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-slate-400 mr-1">Period:</span>
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
                onClick={() => handlePresetChange(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  datePreset === p.id
                    ? "bg-[#008dd2] text-white shadow-sm shadow-[#008dd2]/20 font-semibold"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Exact Date Range Inputs */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5">
              <HiOutlineCalendar className="text-slate-400 text-sm" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setDatePreset("custom");
                  setStartDate(e.target.value);
                }}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none"
              />
              <HiOutlineArrowNarrowRight className="text-slate-400 text-xs" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setDatePreset("custom");
                  setEndDate(e.target.value);
                }}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. EXECUTIVE KPI CARDS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Total Orders */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Booked</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <HiOutlineCube className="text-lg" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">{totalOrders}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
              <span>Freight:</span>
              <span className="font-semibold text-slate-700">₹{totalShipping.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Delivered */}
        <div className="rounded-2xl bg-white border border-emerald-200/80 p-5 shadow-sm hover:shadow-md transition relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Delivered</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <HiOutlineCheckCircle className="text-lg" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{deliveredCount}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {deliveredPercent}%
              </span>
            </div>
            <p className="text-xs text-emerald-600 mt-1 font-medium">Successful delivery rate</p>
          </div>
        </div>

        {/* Card 3: RTO Delivered & In-Transit */}
        <div className="rounded-2xl bg-white border border-rose-200/80 p-5 shadow-sm hover:shadow-md transition relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Total RTO Returns</span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <HiOutlineExclamationCircle className="text-lg" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-rose-700">{totalRto}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                {rtoPercent}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Delivered: <span className="text-rose-600 font-semibold">{rtoDeliveredCount}</span> | Transit: <span className="text-amber-600 font-semibold">{rtoInTransitCount}</span>
            </p>
          </div>
        </div>

        {/* Card 4: In-Transit / OFD */}
        <div className="rounded-2xl bg-white border border-sky-200/80 p-5 shadow-sm hover:shadow-md transition relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider">Active In-Transit</span>
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <HiOutlineTruck className="text-lg" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-sky-700">{inTransitCount}</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Out for Delivery: <span className="font-semibold text-sky-600">{outForDeliveryCount}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Quick Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-purple-600 uppercase">NDR / Pending</div>
            <div className="text-lg font-bold text-slate-800 mt-0.5">{ndrPendingCount}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-bold">
            !
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-indigo-600 uppercase">Manifested / Pickup</div>
            <div className="text-lg font-bold text-slate-800 mt-0.5">{manifestedCount}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold">
            <HiOutlineClock />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Cancelled Orders</div>
            <div className="text-lg font-bold text-slate-800 mt-0.5">{cancelledCount}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-bold">
            ✕
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Payment Mix</div>
            <div className="text-xs font-semibold text-slate-700 mt-1">
              COD: <span className="text-[#008dd2]">{summary.cod_orders_count || 0}</span> | Prepaid: <span className="text-emerald-600">{summary.prepaid_orders_count || 0}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
            ₹
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. VISUAL STATUS BREAKDOWN BAR */}
      {/* ============================================================ */}
      {totalOrders > 0 && (
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Lifecycle Volume Distribution
            </h3>
            <span className="text-xs text-slate-400 font-medium">{totalOrders} Total Parcels Analyzed</span>
          </div>

          {/* Stacked Progress Bar */}
          <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${deliveredPercent}%` }}
              title={`Delivered: ${deliveredCount} (${deliveredPercent}%)`}
              className="h-full bg-emerald-500 transition-all duration-500"
            />
            <div
              style={{ width: `${rtoPercent}%` }}
              title={`Total RTO: ${totalRto} (${rtoPercent}%)`}
              className="h-full bg-rose-500 transition-all duration-500"
            />
            <div
              style={{ width: `${totalOrders > 0 ? ((inTransitCount / totalOrders) * 100).toFixed(1) : 0}%` }}
              title={`In Transit: ${inTransitCount}`}
              className="h-full bg-sky-500 transition-all duration-500"
            />
            <div
              style={{ width: `${totalOrders > 0 ? ((ndrPendingCount / totalOrders) * 100).toFixed(1) : 0}%` }}
              title={`NDR / Pending: ${ndrPendingCount}`}
              className="h-full bg-purple-500 transition-all duration-500"
            />
            <div
              style={{ width: `${totalOrders > 0 ? ((manifestedCount / totalOrders) * 100).toFixed(1) : 0}%` }}
              title={`Manifested: ${manifestedCount}`}
              className="h-full bg-indigo-500 transition-all duration-500"
            />
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 flex-wrap text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Delivered ({deliveredPercent}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>RTO Return ({rtoPercent}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              <span>In Transit ({totalOrders > 0 ? ((inTransitCount / totalOrders) * 100).toFixed(1) : 0}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span>NDR / Pending ({totalOrders > 0 ? ((ndrPendingCount / totalOrders) * 100).toFixed(1) : 0}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span>Manifested ({totalOrders > 0 ? ((manifestedCount / totalOrders) * 100).toFixed(1) : 0}%)</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. FILTER TOOLBAR & LIVE SEARCH */}
      {/* ============================================================ */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-4 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by AWB, Order ID, Consignee, City..."
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 outline-none focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <HiOutlineX className="text-sm" />
              </button>
            )}
          </form>

          {/* Dropdown Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
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
            </div>

            {/* Payment Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Payment:</span>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Payment</option>
                <option value="COD">COD</option>
                <option value="Prepaid">Prepaid</option>
              </select>
            </div>

            {/* Rows Per Page */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[11px] font-semibold text-slate-400">Rows:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. DATA TABLE (ORDERS BREAKDOWN) */}
      {/* ============================================================ */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Order ID & AWB</th>
                <th className="py-3.5 px-4">Booking Date</th>
                <th className="py-3.5 px-4">Consignee & Destination</th>
                <th className="py-3.5 px-4">Carrier & Mode</th>
                <th className="py-3.5 px-4 text-center">Lifecycle Status</th>
                <th className="py-3.5 px-4 text-right">Weight</th>
                <th className="py-3.5 px-4 text-right">Freight (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-3 border-[#008dd2] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-semibold text-slate-500">Loading lifecycle reports...</span>
                    </div>
                  </td>
                </tr>
              ) : currentOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center justify-center text-slate-400">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl text-slate-400 mb-3">
                        <HiOutlineCube />
                      </div>
                      <p className="text-sm font-bold text-slate-700">No shipments found in selected range</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try expanding your date range or clearing filters to view historical lifecycle events.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentOrders.map((o) => (
                  <tr key={o.id || o.awb} className="hover:bg-slate-50/70 transition-colors">
                    {/* Order ID & AWB */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                            <span>#{o.order_id}</span>
                            <button
                              onClick={() => handleCopy(o.order_id, "Order ID")}
                              className="text-slate-400 hover:text-slate-600 transition"
                              title="Copy Order ID"
                            >
                              <HiOutlineClipboardCopy className="text-xs" />
                            </button>
                          </div>
                          {o.awb ? (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {o.awb}
                              </span>
                              <button
                                onClick={() => handleCopy(o.awb, "AWB")}
                                className="text-slate-400 hover:text-[#008dd2] transition"
                                title="Copy AWB"
                              >
                                <HiOutlineClipboardCopy className="text-xs" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-amber-600 font-medium">AWB Pending</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Booking Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-xs font-semibold text-slate-700">
                        {o.created_at ? new Date(o.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {o.created_at ? new Date(o.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                      </div>
                    </td>

                    {/* Consignee & Destination */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 truncate max-w-[180px]">
                        {o.consignee_name || "Customer"}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <HiOutlineLocationMarker className="text-slate-400 shrink-0" />
                        <span className="truncate max-w-[170px]">
                          {o.city ? `${o.city}, ` : ""}{o.state || ""}{o.pincode ? ` (${o.pincode})` : ""}
                        </span>
                      </div>
                    </td>

                    {/* Carrier & Mode */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        <span>{o.carrier || "Delhivery"}</span>
                      </div>
                      <div className="mt-1">
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
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
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(o.lifecycle_status)}
                    </td>

                    {/* Weight */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-medium text-slate-600">
                      {Number(o.weight || 0.5).toFixed(2)} kg
                    </td>

                    {/* Shipping Charge */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-slate-800">
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 bg-slate-50/70 border-t border-slate-200">
            <div className="text-xs font-medium text-slate-500">
              Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * rowsPerPage + 1}</span> to{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(currentPage * rowsPerPage, filteredOrders.length)}
              </span>{" "}
              of <span className="font-semibold text-slate-700">{filteredOrders.length}</span> orders
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
              >
                <HiOutlineChevronLeft className="text-base" />
              </button>

              <span className="text-xs font-semibold text-slate-700 px-2">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
              >
                <HiOutlineChevronRight className="text-base" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
