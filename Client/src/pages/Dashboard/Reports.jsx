import React, { useState, useEffect, useMemo, useCallback } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  HiOutlineDocumentReport,
  HiOutlineTruck,
  HiOutlineScale,
  HiOutlineCalendar,
  HiOutlineDownload,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineCurrencyRupee,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineCash,
  HiOutlineCreditCard,
  HiOutlineLocationMarker,
} from "react-icons/hi";

// Date Helper to format YYYY-MM-DD
const formatDateForInput = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Preset ranges calculation
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

export default function Reports() {
  const [activeTab, setActiveTab] = useState("shipment"); // "shipment" | "weight"

  // Date Filters
  const [datePreset, setDatePreset] = useState("30days");
  const initialDates = useMemo(() => getPresetDates("30days"), []);
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);

  // Sub-filters for Shipment Report
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Sub-filters for Weight Discrepancy Report
  const [weightStatusFilter, setWeightStatusFilter] = useState("ALL");
  const [weightSearchTerm, setWeightSearchTerm] = useState("");

  // Data States
  const [loading, setLoading] = useState(false);
  const [shipmentData, setShipmentData] = useState({ summary: {}, orders: [] });
  const [weightData, setWeightData] = useState({ summary: {}, discrepancies: [] });

  // Pagination for display table
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 25;

  // Handle preset change
  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    if (preset !== "custom") {
      const dates = getPresetDates(preset);
      setStartDate(dates.start);
      setEndDate(dates.end);
    }
  };

  // Fetch Shipment Status Report
  const fetchShipmentReport = useCallback(async () => {
    setLoading(true);
    try {
      const savedUser = JSON.parse(localStorage.getItem("user") || "null");
      const userIdParam = savedUser?.id ? `&user_id=${savedUser.id}` : "";

      const queryParams = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        status: statusFilter,
        payment_type: paymentFilter,
        search: searchTerm,
      }).toString();

      const res = await api.get(`/reports/shipment-status?${queryParams}${userIdParam}`);
      if (res.data?.success) {
        setShipmentData({
          summary: res.data.summary || {},
          orders: res.data.orders || [],
        });
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Fetch shipment report error:", err);
      toast.error(err.response?.data?.message || "Failed to fetch shipment report");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, statusFilter, paymentFilter, searchTerm]);

  // Fetch Weight Discrepancy Report
  const fetchWeightReport = useCallback(async () => {
    setLoading(true);
    try {
      const savedUser = JSON.parse(localStorage.getItem("user") || "null");
      const userIdParam = savedUser?.id ? `&user_id=${savedUser.id}` : "";

      const queryParams = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        status: weightStatusFilter,
        search: weightSearchTerm,
      }).toString();

      const res = await api.get(`/reports/weight-discrepancy?${queryParams}${userIdParam}`);
      if (res.data?.success) {
        setWeightData({
          summary: res.data.summary || {},
          discrepancies: res.data.discrepancies || [],
        });
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Fetch weight report error:", err);
      toast.error(err.response?.data?.message || "Failed to fetch weight discrepancy report");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, weightStatusFilter, weightSearchTerm]);

  // Load report on tab change or date change
  useEffect(() => {
    if (activeTab === "shipment") {
      fetchShipmentReport();
    } else {
      fetchWeightReport();
    }
  }, [activeTab, startDate, endDate, fetchShipmentReport, fetchWeightReport]);

  // Format Currency
  const formatINR = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Format Date String for Table
  const formatDisplayDate = (dStr) => {
    if (!dStr) return "-";
    try {
      return new Date(dStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dStr;
    }
  };

  // =========================================================
  // EXPORT TO CSV / EXCEL HANDLERS
  // =========================================================
  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const handleExportShipmentCsv = () => {
    const list = shipmentData.orders || [];
    if (list.length === 0) {
      toast.error("No shipment records to export");
      return;
    }

    const headers = [
      "Order ID",
      "AWB Number",
      "Carrier",
      "Customer Name",
      "Customer Phone",
      "Destination City",
      "Destination State",
      "Pincode",
      "Payment Mode",
      "Lifecycle Status",
      "Detailed Status",
      "Weight (kg)",
      "Shipping Charge (INR)",
      "Order Booking Date",
    ];

    const rows = list.map((o) => [
      o.order_id || o.id,
      o.awb || "-",
      o.carrier || "-",
      o.consignee_name || "-",
      o.mobile || "-",
      o.city || "-",
      o.state || "-",
      o.pincode || "-",
      o.payment_type || "-",
      o.lifecycle_status || "-",
      o.status || "-",
      Number(o.weight || 0.5).toFixed(3),
      Number(o.shipping_charge || 0).toFixed(2),
      o.created_at ? new Date(o.created_at).toLocaleString("en-IN") : "-",
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ShipDrop_Shipment_Report_${startDate}_to_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${list.length} shipment records to CSV!`);
  };

  const handleExportWeightCsv = () => {
    const list = weightData.discrepancies || [];
    if (list.length === 0) {
      toast.error("No weight discrepancy records to export");
      return;
    }

    const headers = [
      "Order ID",
      "AWB Number",
      "Discrepancy Date",
      "Declared Weight (kg)",
      "Courier Billed Weight (kg)",
      "Weight Difference (kg)",
      "Original Freight (INR)",
      "Recalculated Freight (INR)",
      "Extra Charged Amount (INR)",
      "Discrepancy Status",
      "Settlement Amount (INR)",
      "Settled Date",
    ];

    const rows = list.map((w) => [
      w.order_id || w.order_db_id,
      w.awb || "-",
      w.created_at ? new Date(w.created_at).toLocaleString("en-IN") : "-",
      Number(w.declared_weight || 0).toFixed(3),
      Number(w.actual_weight || 0).toFixed(3),
      Number(w.weight_difference || 0).toFixed(3),
      Number(w.original_shipping_charge || 0).toFixed(2),
      Number(w.recalculated_shipping_charge || 0).toFixed(2),
      Number(w.extra_charge || 0).toFixed(2),
      String(w.status || "pending").toUpperCase(),
      Number(w.settlement_amount || 0).toFixed(2),
      w.settled_at ? new Date(w.settled_at).toLocaleString("en-IN") : "-",
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ShipDrop_Weight_Discrepancy_Report_${startDate}_to_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${list.length} weight discrepancy records to CSV!`);
  };

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    const s = String(status || "").toUpperCase();
    if (s.includes("DELIVERED") && !s.includes("RTO")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <HiOutlineCheckCircle className="text-xs" /> Delivered
        </span>
      );
    }
    if (s.includes("RTO DELIVERED")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <HiOutlineExclamationCircle className="text-xs" /> RTO Delivered
        </span>
      );
    }
    if (s.includes("RTO")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
          <HiOutlineExclamationCircle className="text-xs" /> RTO In Transit
        </span>
      );
    }
    if (s.includes("OUT FOR DELIVERY") || s === "OFD") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
          <HiOutlineTruck className="text-xs" /> Out for Delivery
        </span>
      );
    }
    if (s.includes("IN TRANSIT")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          <HiOutlineTruck className="text-xs" /> In Transit
        </span>
      );
    }
    if (s.includes("NDR") || s.includes("UNDELIVERED") || s === "PENDING") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <HiOutlineClock className="text-xs" /> NDR / Pending
        </span>
      );
    }
    if (s.includes("CANCEL")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
        {status}
      </span>
    );
  };

  // Pagination Slice
  const currentItems = useMemo(() => {
    const list = activeTab === "shipment" ? shipmentData.orders : weightData.discrepancies;
    const startIndex = (currentPage - 1) * rowsPerPage;
    return list.slice(startIndex, startIndex + rowsPerPage);
  }, [activeTab, shipmentData.orders, weightData.discrepancies, currentPage]);

  const totalPages = useMemo(() => {
    const list = activeTab === "shipment" ? shipmentData.orders : weightData.discrepancies;
    return Math.max(1, Math.ceil(list.length / rowsPerPage));
  }, [activeTab, shipmentData.orders, weightData.discrepancies]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 font-sans">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#111827] rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#008dd2] to-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20 ring-4 ring-sky-50 dark:ring-sky-950/50">
            <HiOutlineDocumentReport className="text-2xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Reports & Logistics Analytics
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Generate date-range shipment lifecycle reports and track weight discrepancies with 1-click Excel/CSV export
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => (activeTab === "shipment" ? fetchShipmentReport() : fetchWeightReport())}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
            title="Refresh Report Data"
          >
            <HiOutlineRefresh className={`text-sm ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={activeTab === "shipment" ? handleExportShipmentCsv : handleExportWeightCsv}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl transition shadow-sm shadow-emerald-500/20 cursor-pointer active:scale-95"
          >
            <HiOutlineDownload className="text-base" />
            <span>Export to CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* 2. TAB SWITCHER */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            setActiveTab("shipment");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2.5 px-6 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
            activeTab === "shipment"
              ? "border-[#008dd2] text-[#008dd2]"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <HiOutlineTruck className="text-lg" />
          <span>Shipment Status & Lifecycle Report</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10.5px] bg-sky-50 dark:bg-sky-950/60 text-[#008dd2] font-semibold border border-sky-200/60 dark:border-sky-800/60">
            {shipmentData.orders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("weight");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2.5 px-6 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
            activeTab === "weight"
              ? "border-[#008dd2] text-[#008dd2]"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <HiOutlineScale className="text-lg" />
          <span>Weight Discrepancy Report</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10.5px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/60 dark:border-indigo-800/60">
            {weightData.discrepancies.length}
          </span>
        </button>
      </div>

      {/* 3. FILTER BAR (DATE RANGE PICKER & PRESETS) */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        {/* TOP ROW: PRESETS + DATE RANGE INPUTS */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* DATE RANGE PRESET BUTTONS */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "7days", label: "Last 7 Days" },
              { id: "30days", label: "Last 30 Days" },
              { id: "thisMonth", label: "This Month" },
              { id: "lastMonth", label: "Last Month" },
              { id: "custom", label: "Custom Date" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetChange(p.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
                  datePreset === p.id
                    ? "bg-[#008dd2] text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* TWO DATE RANGE INPUTS (FROM - TO) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[11px] font-bold text-slate-400 uppercase">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("custom");
                }}
                className="text-xs font-semibold text-slate-800 dark:text-slate-100 bg-transparent outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[11px] font-bold text-slate-400 uppercase">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset("custom");
                }}
                className="text-xs font-semibold text-slate-800 dark:text-slate-100 bg-transparent outline-none cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => (activeTab === "shipment" ? fetchShipmentReport() : fetchWeightReport())}
              className="px-4 py-2 text-xs font-bold text-white bg-[#008dd2] hover:bg-[#007cb8] rounded-xl transition shadow-xs cursor-pointer"
            >
              Apply Filter
            </button>
          </div>
        </div>

        {/* BOTTOM ROW: SUB-FILTERS & SEARCH */}
        {activeTab === "shipment" ? (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {/* SEARCH */}
            <div className="relative flex-1 min-w-[240px]">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                placeholder="Search by AWB, Order ID, Customer name, Phone, City..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchShipmentReport()}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#008dd2]"
              />
            </div>

            {/* STATUS DROPDOWN */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="DELIVERED">Delivered</option>
                <option value="RTO DELIVERED">RTO Delivered</option>
                <option value="RTO IN TRANSIT">RTO In Transit</option>
                <option value="IN TRANSIT">In Transit</option>
                <option value="OUT FOR DELIVERY">Out for Delivery</option>
                <option value="NDR">NDR / Undelivered / Pending</option>
                <option value="MANIFESTED">Manifested / Not Picked</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* PAYMENT MODE */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Payment:</span>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
              >
                <option value="ALL">All Payments</option>
                <option value="COD">Cash on Delivery (COD)</option>
                <option value="PREPAID">Prepaid</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {/* SEARCH */}
            <div className="relative flex-1 min-w-[240px]">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                placeholder="Search by AWB or Order ID in discrepancies..."
                value={weightSearchTerm}
                onChange={(e) => setWeightSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchWeightReport()}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#008dd2]"
              />
            </div>

            {/* STATUS */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Discrepancy Status:</span>
              <select
                value={weightStatusFilter}
                onChange={(e) => setWeightStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="pending">Pending Review</option>
                <option value="settled">Settled / Charged</option>
                <option value="waived">Waived / Forgiven</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 4. SUMMARY KPI CARDS */}
      {activeTab === "shipment" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* TOTAL ORDERS */}
          <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Booked</span>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {shipmentData.summary.total_orders || 0}
            </div>
            <p className="text-[10.5px] text-slate-400 mt-0.5">
              Cost: {formatINR(shipmentData.summary.total_shipping_charges)}
            </p>
          </div>

          {/* DELIVERED */}
          <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Delivered</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                {shipmentData.summary.delivered_percentage || 0}%
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1">
              {shipmentData.summary.delivered_count || 0}
            </div>
            <p className="text-[10.5px] text-slate-400 mt-0.5">Successful Handover</p>
          </div>

          {/* TOTAL RTO */}
          <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-rose-200/60 dark:border-rose-900/40 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Total RTO</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700">
                {shipmentData.summary.rto_percentage || 0}%
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-rose-600 mt-1">
              {shipmentData.summary.total_rto_count || 0}
            </div>
            <p className="text-[10.5px] text-slate-400 mt-0.5">
              {shipmentData.summary.rto_delivered_count || 0} Delivered / {shipmentData.summary.rto_in_transit_count || 0} Transit
            </p>
          </div>

          {/* IN TRANSIT / OFD */}
          <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-sky-200/60 dark:border-sky-900/40 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">In Transit & OFD</span>
            <div className="text-xl sm:text-2xl font-extrabold text-[#008dd2] mt-1">
              {shipmentData.summary.in_transit_count || 0}
            </div>
            <p className="text-[10.5px] text-slate-400 mt-0.5">
              {shipmentData.summary.out_for_delivery_count || 0} Out For Delivery
            </p>
          </div>

          {/* NDR / PENDING */}
          <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">NDR / Pending</span>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-600 mt-1">
              {shipmentData.summary.ndr_pending_count || 0}
            </div>
            <p className="text-[10.5px] text-slate-400 mt-0.5">Delivery issue / undelivered</p>
          </div>

          {/* MANIFESTED & NOT PICKED */}
          <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Manifest / Pickup</span>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-700 dark:text-slate-300 mt-1">
              {shipmentData.summary.manifested_count || 0}
            </div>
            <p className="text-[10.5px] text-slate-400 mt-0.5">
              {shipmentData.summary.cancelled_count || 0} Cancelled
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* TOTAL DISCREPANCIES */}
          <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Flagged</span>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {weightData.summary.total_discrepancies || 0}
            </div>
            <p className="text-[10.5px] text-slate-400 mt-0.5">Courier weight disputes</p>
          </div>

          {/* TOTAL EXTRA CHARGED */}
          <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-rose-200/60 dark:border-rose-900/40 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Total Extra Charged</span>
            <div className="text-xl sm:text-2xl font-extrabold text-rose-600 mt-1">
              {formatINR(weightData.summary.total_extra_charges)}
            </div>
            <p className="text-[10.5px] text-slate-400 mt-0.5">
              Weight Diff: +{weightData.summary.total_weight_diff_kg || 0} kg
            </p>
          </div>

          {/* PENDING AMOUNT */}
          <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Pending Review</span>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-600 mt-1">
              {formatINR(weightData.summary.pending_amount)}
            </div>
            <p className="text-[10.5px] text-slate-400 mt-0.5">
              {weightData.summary.pending_count || 0} shipments pending
            </p>
          </div>

          {/* SETTLED AMOUNT */}
          <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Settled from Wallet</span>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1">
              {formatINR(weightData.summary.settled_amount)}
            </div>
            <p className="text-[10.5px] text-slate-400 mt-0.5">
              {weightData.summary.settled_count || 0} shipments settled
            </p>
          </div>

          {/* WAIVED */}
          <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Waived / Reimbursed</span>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-700 dark:text-slate-200 mt-1">
              {formatINR(weightData.summary.waived_amount)}
            </div>
            <p className="text-[10.5px] text-slate-400 mt-0.5">
              {weightData.summary.waived_count || 0} shipments waived
            </p>
          </div>
        </div>
      )}

      {/* 5. DATA TABLE SECTION */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* TABLE TOP BAR */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {activeTab === "shipment" ? "Detailed Orders Lifecycle Breakdown" : "Weight Discrepancy Breakdown"}
            </h3>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg">
              {activeTab === "shipment" ? shipmentData.orders.length : weightData.discrepancies.length} records
            </span>
          </div>

          <div className="text-xs text-slate-400">
            Date: {formatDisplayDate(startDate)} to {formatDisplayDate(endDate)}
          </div>
        </div>

        {/* TABLE BODY */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 text-center space-y-3">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#008dd2] border-r-transparent"></div>
              <p className="text-xs text-slate-500">Generating report data...</p>
            </div>
          ) : activeTab === "shipment" ? (
            shipmentData.orders.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No shipments found for selected dates</p>
                <p className="text-xs text-slate-400">Try changing the date range or status filters above.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Order / AWB</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4">Carrier</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Weight</th>
                    <th className="py-3 px-4 text-right">Freight (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {currentItems.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          #{order.order_id || order.id}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono block">
                          {order.awb || "-"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {formatDisplayDate(order.created_at)}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[140px]">
                          {order.consignee_name || "-"}
                        </span>
                        <span className="text-[11px] text-slate-400 block">{order.mobile || "-"}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-slate-700 dark:text-slate-300 block truncate max-w-[150px]">
                          {order.city ? `${order.city}, ${order.state || ""}` : "-"}
                        </span>
                        <span className="text-[10.5px] text-slate-400 block">{order.pincode || "-"}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                          {order.carrier || "Delivery"}
                        </span>
                        <span className="block text-[10.5px] text-slate-400 mt-0.5">
                          {order.payment_type || "Prepaid"}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {renderStatusBadge(order.lifecycle_status || order.status)}
                      </td>

                      <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                        {Number(order.weight || 0.5).toFixed(2)} kg
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {formatINR(order.shipping_charge)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            weightData.discrepancies.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No weight discrepancies recorded for selected dates</p>
                <p className="text-xs text-slate-400">All shipments in this range had matching declared & billed weights!</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Order / AWB</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Declared Weight</th>
                    <th className="py-3 px-4 text-right">Actual Weight</th>
                    <th className="py-3 px-4 text-right">Weight Diff</th>
                    <th className="py-3 px-4 text-right">Original Freight</th>
                    <th className="py-3 px-4 text-right">Extra Charged</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {currentItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          #{item.order_id || item.order_db_id}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono block">
                          {item.awb || "-"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {formatDisplayDate(item.created_at)}
                      </td>

                      <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                        {Number(item.declared_weight || 0).toFixed(3)} kg
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                        {Number(item.actual_weight || 0).toFixed(3)} kg
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-amber-600">
                        +{Number(item.weight_difference || 0).toFixed(3)} kg
                      </td>

                      <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">
                        {formatINR(item.original_shipping_charge)}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-rose-600">
                        +{formatINR(item.extra_charge)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider ${
                            item.status === "settled"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : item.status === "waived"
                              ? "bg-slate-100 text-slate-600 border border-slate-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {item.status || "pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
