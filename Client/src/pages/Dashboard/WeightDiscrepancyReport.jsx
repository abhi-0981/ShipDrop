import React, { useState, useEffect, useMemo, useCallback } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
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
  HiOutlineClipboardCopy,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineArrowNarrowRight,
  HiOutlineX,
  HiOutlineExclamation,
  HiOutlineShieldCheck,
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

export default function WeightDiscrepancyReport() {
  // Preset selector
  const [datePreset, setDatePreset] = useState("30days");
  const initialDates = useMemo(() => getPresetDates("30days"), []);
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | pending | settled | waived
  const [searchTerm, setSearchTerm] = useState("");

  // Data
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reportData, setReportData] = useState({ summary: {}, discrepancies: [] });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [copiedText, setCopiedText] = useState(null);

  // Handle preset change
  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    if (preset !== "custom") {
      const dates = getPresetDates(preset);
      setStartDate(dates.start);
      setEndDate(dates.end);
    }
  };

  // Copy helper
  const handleCopy = (text, label = "AWB") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success(`${label} copied to clipboard!`, { id: "clipboard-toast", duration: 1500 });
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Fetch weight report from backend
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const savedUser = JSON.parse(localStorage.getItem("user") || "null");
      const userIdParam = savedUser?.id ? `&user_id=${savedUser.id}` : "";

      const queryParams = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        status: statusFilter,
        search: searchTerm,
      }).toString();

      const res = await api.get(`/reports/weight-discrepancy?${queryParams}${userIdParam}`);
      if (res.data?.success) {
        setReportData({
          summary: res.data.summary || {},
          discrepancies: res.data.discrepancies || [],
        });
        setCurrentPage(1);
      } else {
        toast.error(res.data?.message || "Failed to load weight discrepancy report");
      }
    } catch (err) {
      console.error("Fetch weight report error:", err);
      toast.error(err.response?.data?.message || "Failed to load weight report");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, statusFilter, searchTerm]);

  // Initial & Filter fetch
  useEffect(() => {
    fetchReport();
  }, [startDate, endDate, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReport();
  };

  // Client-side search & pagination
  const filteredDiscrepancies = useMemo(() => {
    let list = reportData.discrepancies || [];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (d) =>
          String(d.awb || "").toLowerCase().includes(q) ||
          String(d.order_id || "").toLowerCase().includes(q) ||
          String(d.service_type || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [reportData.discrepancies, searchTerm]);

  const totalPages = Math.ceil(filteredDiscrepancies.length / rowsPerPage) || 1;
  const currentDiscrepancies = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredDiscrepancies.slice(start, start + rowsPerPage);
  }, [filteredDiscrepancies, currentPage, rowsPerPage]);

  // KPI Summary
  const summary = reportData.summary || {};
  const totalCount = summary.total_discrepancies || 0;
  const totalExtraCharges = summary.total_extra_charges || 0;
  const totalWeightDiff = summary.total_weight_diff_kg || 0;
  const pendingCount = summary.pending_count || 0;
  const pendingAmount = summary.pending_amount || 0;
  const settledCount = summary.settled_count || 0;
  const settledAmount = summary.settled_amount || 0;
  const waivedCount = summary.waived_count || 0;
  const waivedAmount = summary.waived_amount || 0;

  // Status Badge
  const getDisputeStatusBadge = (status) => {
    const s = String(status || "").toLowerCase().trim();
    if (s === "settled") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <HiOutlineCheckCircle className="text-sm text-emerald-500" />
          Settled
        </span>
      );
    }
    if (s === "waived") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <HiOutlineShieldCheck className="text-sm text-indigo-500" />
          Waived
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <HiOutlineClock className="text-sm text-amber-500 animate-spin" />
        Pending Review
      </span>
    );
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredDiscrepancies.length) {
      toast.error("No weight discrepancy records to export");
      return;
    }
    setExporting(true);
    try {
      const headers = [
        "Order ID",
        "AWB",
        "Service Type",
        "Zone",
        "Declared Weight (KG)",
        "Courier Billed Weight (KG)",
        "Weight Discrepancy (KG)",
        "Original Charge (INR)",
        "Recalculated Charge (INR)",
        "Extra Debit Charge (INR)",
        "Dispute Status",
        "Settlement Amount (INR)",
        "Flagged Date",
        "Settled Date",
      ];

      const csvRows = [headers.join(",")];

      filteredDiscrepancies.forEach((d) => {
        const row = [
          `"${String(d.order_id || "").replace(/"/g, '""')}"`,
          `"${String(d.awb || "").replace(/"/g, '""')}"`,
          `"${String(d.service_type || "Delhivery").replace(/"/g, '""')}"`,
          `"${String(d.zone || "").replace(/"/g, '""')}"`,
          d.declared_weight || 0,
          d.actual_weight || 0,
          d.weight_difference || 0,
          d.original_shipping_charge || 0,
          d.recalculated_shipping_charge || 0,
          d.extra_charge || 0,
          `"${String(d.status || "pending").toUpperCase()}"`,
          d.settlement_amount || 0,
          `"${d.created_at ? new Date(d.created_at).toLocaleString("en-IN") : ""}"`,
          `"${d.settled_at ? new Date(d.settled_at).toLocaleString("en-IN") : ""}"`,
        ];
        csvRows.push(row.join(","));
      });

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `ShipDrop_Weight_Discrepancy_${startDate}_to_${endDate}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Weight discrepancy report exported successfully!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export weight discrepancy report");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100/60 p-4 sm:p-6 lg:p-8">
      {/* ============================================================ */}
      {/* 1. TOP HEADER BANNER */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6 mb-6">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-amber-500/15 via-rose-400/10 to-transparent rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <HiOutlineScale className="text-base" />
              <span>Weight Audit Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              Weight Discrepancy & Dispute Report
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Audit courier billed weight vs declared package weight, analyze excess freight debits, and track dispute resolution progress.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 hover:border-slate-300 transition shadow-sm disabled:opacity-50"
              title="Refresh Data"
            >
              <HiOutlineRefresh className={`text-base text-slate-500 ${loading ? "animate-spin text-amber-600" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={loading || exporting || filteredDiscrepancies.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-semibold transition shadow-md shadow-amber-600/20 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
            >
              <HiOutlineDownload className="text-base" />
              <span>{exporting ? "Generating CSV..." : "Export Discrepancy CSV"}</span>
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
                    ? "bg-amber-600 text-white shadow-sm shadow-amber-600/20 font-semibold"
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
        {/* Card 1: Total Cases */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Discrepancies</div>
          <div className="text-2xl font-extrabold text-slate-800 mt-2">{totalCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Flagged parcels</p>
        </div>

        {/* Card 2: Extra Debit Charges */}
        <div className="rounded-2xl bg-white border border-rose-200 p-4 shadow-sm hover:shadow-md transition relative overflow-hidden">
          <div className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">Extra Billed (₹)</div>
          <div className="text-2xl font-extrabold text-rose-700 mt-2">₹{totalExtraCharges.toLocaleString("en-IN")}</div>
          <p className="text-[11px] text-rose-500 mt-1">Total carrier debits</p>
        </div>

        {/* Card 3: Weight Difference */}
        <div className="rounded-2xl bg-white border border-amber-200 p-4 shadow-sm hover:shadow-md transition relative overflow-hidden">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Excess Weight</div>
          <div className="text-2xl font-extrabold text-amber-800 mt-2">{totalWeightDiff} kg</div>
          <p className="text-[11px] text-amber-600 mt-1">Cumulative difference</p>
        </div>

        {/* Card 4: Pending Disputes */}
        <div className="rounded-2xl bg-white border border-orange-200 p-4 shadow-sm hover:shadow-md transition">
          <div className="text-[11px] font-semibold text-orange-600 uppercase tracking-wider">Pending Review</div>
          <div className="text-2xl font-extrabold text-orange-700 mt-2">{pendingCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">₹{pendingAmount.toLocaleString("en-IN")} at stake</p>
        </div>

        {/* Card 5: Settled */}
        <div className="rounded-2xl bg-white border border-emerald-200 p-4 shadow-sm hover:shadow-md transition">
          <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Settled in Favor</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2">{settledCount}</div>
          <p className="text-[11px] text-emerald-600 mt-1">₹{settledAmount.toLocaleString("en-IN")} recovered</p>
        </div>

        {/* Card 6: Waived */}
        <div className="rounded-2xl bg-white border border-indigo-200 p-4 shadow-sm hover:shadow-md transition">
          <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">Waived Charges</div>
          <div className="text-2xl font-extrabold text-indigo-700 mt-2">{waivedCount}</div>
          <p className="text-[11px] text-indigo-600 mt-1">₹{waivedAmount.toLocaleString("en-IN")} waived</p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. FILTER TOOLBAR & LIVE SEARCH */}
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
              placeholder="Search by AWB or Order ID..."
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 outline-none focus:border-amber-600 focus:bg-white focus:ring-2 focus:ring-amber-600/10 transition"
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
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Dispute:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Cases</option>
                <option value="pending">Pending</option>
                <option value="settled">Settled</option>
                <option value="waived">Waived</option>
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
      {/* 4. DISCREPANCY COMPARISON TABLE */}
      {/* ============================================================ */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Order ID & AWB</th>
                <th className="py-3.5 px-4">Date Flagged</th>
                <th className="py-3.5 px-4">Declared Wt.</th>
                <th className="py-3.5 px-4">Billed Wt.</th>
                <th className="py-3.5 px-4">Excess Wt.</th>
                <th className="py-3.5 px-4 text-right">Original (₹)</th>
                <th className="py-3.5 px-4 text-right">Extra Debit (₹)</th>
                <th className="py-3.5 px-4 text-center">Dispute Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-semibold text-slate-500">Loading weight discrepancy reports...</span>
                    </div>
                  </td>
                </tr>
              ) : currentDiscrepancies.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center justify-center text-slate-400">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mb-3">
                        <HiOutlineScale />
                      </div>
                      <p className="text-sm font-bold text-slate-700">No weight discrepancies found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        There are no weight discrepancies flagged by couriers for your account in the selected date range.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentDiscrepancies.map((d) => (
                  <tr key={d.id || d.awb} className="hover:bg-slate-50/70 transition-colors">
                    {/* Order ID & AWB */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <span>#{d.order_id}</span>
                          <button
                            onClick={() => handleCopy(d.order_id, "Order ID")}
                            className="text-slate-400 hover:text-slate-600 transition"
                            title="Copy Order ID"
                          >
                            <HiOutlineClipboardCopy className="text-xs" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-mono font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {d.awb}
                          </span>
                          <button
                            onClick={() => handleCopy(d.awb, "AWB")}
                            className="text-slate-400 hover:text-amber-600 transition"
                            title="Copy AWB"
                          >
                            <HiOutlineClipboardCopy className="text-xs" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Date Flagged */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-xs font-semibold text-slate-700">
                        {d.created_at ? new Date(d.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {d.zone ? `Zone ${d.zone}` : ""}
                      </div>
                    </td>

                    {/* Declared Wt */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        {Number(d.declared_weight || 0).toFixed(3)} kg
                      </span>
                    </td>

                    {/* Billed Wt */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100 font-semibold">
                        {Number(d.actual_weight || 0).toFixed(3)} kg
                      </span>
                    </td>

                    {/* Weight Difference */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[11px]">
                        +{Number(d.weight_difference || 0).toFixed(3)} kg
                      </span>
                    </td>

                    {/* Original Shipping Charge */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-medium text-slate-600">
                      ₹{Number(d.original_shipping_charge || 0).toFixed(2)}
                    </td>

                    {/* Extra Debit Charge */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="font-extrabold text-rose-600 text-xs">
                        +₹{Number(d.extra_charge || 0).toFixed(2)}
                      </span>
                    </td>

                    {/* Dispute Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {getDisputeStatusBadge(d.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {!loading && filteredDiscrepancies.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 bg-slate-50/70 border-t border-slate-200">
            <div className="text-xs font-medium text-slate-500">
              Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * rowsPerPage + 1}</span> to{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(currentPage * rowsPerPage, filteredDiscrepancies.length)}
              </span>{" "}
              of <span className="font-semibold text-slate-700">{filteredDiscrepancies.length}</span> records
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
