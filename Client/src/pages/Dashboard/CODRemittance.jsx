import React, { useState, useEffect, useMemo, useCallback } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  HiOutlineCash,
  HiOutlineCalendar,
  HiOutlineDownload,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineDuplicate,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineX,
  HiOutlineDocumentText,
} from "react-icons/hi";
import { CardSkeleton, TableRowSkeleton } from "../../components/Common/TableSkeleton";

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
  // "all"
  return { start: "", end: "" };
};

export default function CODRemittance() {
  const [remittances, setRemittances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [datePreset, setDatePreset] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [copiedText, setCopiedText] = useState(null);

  // Load User ID
  const getUserId = () => {
    try {
      const savedUser = JSON.parse(localStorage.getItem("user") || "null");
      return savedUser?.id || null;
    } catch {
      return null;
    }
  };

  // Fetch COD Remittances
  const fetchCODRemittances = useCallback(async (isRefresh = false) => {
    const userId = getUserId();
    if (!userId) {
      setError("User session not found. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      const response = await api.get(`/payments/cod-remittance?user_id=${userId}`);
      const data = Array.isArray(response.data?.remittances)
        ? response.data.remittances
        : [];
      setRemittances(data);
    } catch (err) {
      console.error("COD remittance load error:", err);
      setError(err.response?.data?.message || "Unable to load COD remittance data");
      setRemittances([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCODRemittances();
  }, [fetchCODRemittances]);

  // Handle Preset Change
  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    if (preset !== "custom") {
      const dates = getPresetDates(preset);
      setStartDate(dates.start);
      setEndDate(dates.end);
      setCurrentPage(1);
    }
  };

  // Copy Helper
  const handleCopy = (text, label = "ID") => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedText(String(text));
    toast.success(`${label} copied!`, { id: "clipboard-toast", duration: 1500 });
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Amount Formatter (INR)
  const formatAmount = (amount) => {
    const val = Number(amount || 0);
    return `₹${val.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Date Formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const parsed = new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) return "—";
    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Clear Filters
  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setDatePreset("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const hasFilters = Boolean(
    search || statusFilter !== "ALL" || datePreset !== "all" || startDate || endDate
  );

  // Filtered Remittances
  const filteredRemittances = useMemo(() => {
    const query = search.trim().toLowerCase();

    return remittances.filter((item) => {
      const orderId = String(item.order_id || "").toLowerCase();
      const buyer = String(item.buyer || "").toLowerCase();
      const awb = String(item.awb || "").toLowerCase();
      const status = String(item.status || "").toUpperCase();

      // Search matching
      const searchMatch =
        !query ||
        orderId.includes(query) ||
        buyer.includes(query) ||
        awb.includes(query);

      // Status matching
      let statusMatch = true;
      if (statusFilter === "PENDING") {
        statusMatch = status === "PENDING";
      } else if (statusFilter === "SUCCESSFUL") {
        statusMatch = status === "SUCCESSFUL" || status === "TRANSFERRED" || status === "SETTLED";
      }

      // Date matching
      let dateMatch = true;
      if (startDate || endDate) {
        const rawDate = item.tracking_updated_at || item.created_at;
        if (rawDate) {
          const d = new Date(rawDate);
          if (!Number.isNaN(d.getTime())) {
            const dateStr = formatDateForInput(d);
            if (startDate && dateStr < startDate) dateMatch = false;
            if (endDate && dateStr > endDate) dateMatch = false;
          }
        }
      }

      return searchMatch && statusMatch && dateMatch;
    });
  }, [remittances, search, statusFilter, startDate, endDate]);

  // KPI Summary (Only 3 Core Cards)
  const summary = useMemo(() => {
    let totalOrders = 0;
    let totalCodAmount = 0;
    let pendingCount = 0;
    let pendingAmount = 0;
    let settledCount = 0;
    let settledAmount = 0;

    filteredRemittances.forEach((item) => {
      totalOrders++;
      const amt = Number(item.cod_amount || 0);
      totalCodAmount += amt;

      const st = String(item.status || "").toUpperCase();
      if (st === "SUCCESSFUL" || st === "TRANSFERRED" || st === "SETTLED") {
        settledCount++;
        settledAmount += amt;
      } else {
        pendingCount++;
        pendingAmount += amt;
      }
    });

    return {
      totalOrders,
      totalCodAmount,
      pendingCount,
      pendingAmount,
      settledCount,
      settledAmount,
    };
  }, [filteredRemittances]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredRemittances.length / rowsPerPage) || 1;
  const paginatedRemittances = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRemittances.slice(start, start + rowsPerPage);
  }, [filteredRemittances, currentPage, rowsPerPage]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredRemittances.length) {
      toast.error("No remittance records available to export");
      return;
    }
    setExporting(true);
    try {
      const headers = [
        "Order ID",
        "Buyer",
        "AWB No",
        "COD Amount (INR)",
        "Delivered On",
        "Status",
        "Transferred On",
        "Description",
      ];

      const csvRows = [headers.join(",")];

      filteredRemittances.forEach((r) => {
        const row = [
          `"${String(r.order_id || "").replace(/"/g, '""')}"`,
          `"${String(r.buyer || "").replace(/"/g, '""')}"`,
          `"${String(r.awb || "").replace(/"/g, '""')}"`,
          Number(r.cod_amount || 0).toFixed(2),
          `"${r.tracking_updated_at ? formatDate(r.tracking_updated_at) : formatDate(r.created_at)}"`,
          `"${String(r.status || "PENDING").toUpperCase() === "PENDING" ? "Pending" : "Transferred"}"`,
          `"${r.transferred_on ? formatDate(r.transferred_on) : "—"}"`,
          `"${String(r.description || "—").replace(/"/g, '""')}"`,
        ];
        csvRows.push(row.join(","));
      });

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `ShipDrop_COD_Remittance_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("COD Remittance report exported successfully!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export remittance report");
    } finally {
      setExporting(false);
    }
  };

  // Status Badge Component (Compact single-line, refined aesthetics)
  const renderStatusBadge = (status) => {
    const s = String(status || "").toUpperCase();
    if (s === "SUCCESSFUL" || s === "TRANSFERRED" || s === "SETTLED") {
      return (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-200/90 bg-emerald-50/80 px-2.5 py-0.5 text-[11.5px] font-semibold text-emerald-700 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          <span>Transferred</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-200/90 bg-amber-50/80 px-2.5 py-0.5 text-[11.5px] font-semibold text-amber-700 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-300">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
        <span>Pending</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] px-4 py-5 transition-colors duration-200 dark:bg-[#090b10]">
      <div className="mx-auto max-w-[1450px]">
        {/* ==================================================
            1. TOP HEADER (EXECUTIVE REPORT DESIGN)
        ================================================== */}
        <div className="mb-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition-colors dark:border-slate-800 dark:bg-[#0f1319]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#edf8ff] text-[#008dd2] dark:bg-[#008dd2]/10 dark:text-[#38bdf8]">
                <HiOutlineCash className="text-[22px]" />
              </div>

              <div>
                <h1 className="text-[17px] font-semibold tracking-[-0.2px] text-slate-900 dark:text-slate-100">
                  COD Remittance
                </h1>
                <p className="mt-0.5 text-[12px] text-slate-400 dark:text-slate-500">
                  Track delivered COD orders and remittance status
                </p>
              </div>
            </div>

            {/* TOP ACTIONS */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={loading || exporting || filteredRemittances.length === 0}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#10b981] px-3.5 text-[12px] font-medium text-white shadow-xs transition hover:bg-[#059669] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <HiOutlineDownload className="text-[15px]" />
                <span>{exporting ? "Exporting..." : "Export CSV"}</span>
              </button>

              <button
                type="button"
                onClick={() => fetchCODRemittances(true)}
                disabled={loading || refreshing}
                title="Refresh"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-xs transition hover:bg-slate-50 hover:text-slate-700 active:scale-95 dark:border-slate-800 dark:bg-[#141923] dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <HiOutlineRefresh
                  className={`text-[15px] ${refreshing || loading ? "animate-spin text-[#008dd2]" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* ==================================================
            2. DATE PERIOD FILTER BAR
        ================================================== */}
        <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition-colors dark:border-slate-800 dark:bg-[#0f1319]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1 dark:text-slate-500">
                Period:
              </span>
              {[
                { id: "all", label: "All Time" },
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
                      : "bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 font-medium dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Date Range */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1 dark:border-slate-800 dark:bg-slate-800/40">
                <HiOutlineCalendar className="text-slate-400 text-sm" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setDatePreset("custom");
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-[12px] font-medium text-slate-700 outline-none dark:text-slate-200"
                />
                <span className="text-slate-300 text-xs dark:text-slate-600">→</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setDatePreset("custom");
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-[12px] font-medium text-slate-700 outline-none dark:text-slate-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            3. EXACT 3 KPI SUMMARY CARDS (NO 4th CARD)
        ================================================== */}
        <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Card 1: TOTAL ORDERS */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)] transition-all dark:border-slate-800 dark:bg-[#0f1319]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Total Orders
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {summary.totalOrders}
                </p>
                <p className="mt-0.5 text-[11.5px] font-medium text-slate-500 dark:text-slate-400">
                  COD Value: <span className="font-semibold text-slate-800 dark:text-slate-200">{formatAmount(summary.totalCodAmount)}</span>
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-[#008dd2] dark:bg-[#008dd2]/10 dark:text-[#38bdf8]">
                <HiOutlineDocumentText className="text-xl" />
              </div>
            </div>
          </div>

          {/* Card 2: PENDING */}
          <div className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)] transition-all dark:border-amber-900/40 dark:bg-[#0f1319]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Pending
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                  {summary.pendingCount}
                </p>
                <p className="mt-0.5 text-[11.5px] font-medium text-slate-500 dark:text-slate-400">
                  Pending Amount: <span className="font-semibold text-amber-600 dark:text-amber-400">{formatAmount(summary.pendingAmount)}</span>
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <HiOutlineClock className="text-xl" />
              </div>
            </div>
          </div>

          {/* Card 3: SUCCESSFUL */}
          <div className="rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)] transition-all dark:border-emerald-900/40 dark:bg-[#0f1319]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Successful
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {summary.settledCount}
                </p>
                <p className="mt-0.5 text-[11.5px] font-medium text-slate-500 dark:text-slate-400">
                  Transferred: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatAmount(summary.settledAmount)}</span>
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <HiOutlineCheckCircle className="text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            4. SEARCH & STATUS FILTER BAR
        ================================================== */}
        <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition-colors dark:border-slate-800 dark:bg-[#0f1319]">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Bar */}
            <div className="relative min-w-[280px] flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                <HiOutlineSearch className="text-[16px]" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search Order ID, Buyer or AWB..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-8 text-[12.5px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-[#008dd2]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <HiOutlineX className="text-sm" />
                </button>
              )}
            </div>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 min-w-[150px] rounded-lg border border-slate-200 bg-white px-3 text-[12.5px] font-medium text-slate-600 outline-none transition focus:border-[#008dd2] dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="SUCCESSFUL">Transferred</option>
            </select>

            {/* Clear Filters Button */}
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-10 px-3 rounded-lg text-[12px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* ==================================================
            5. MAIN TABLE (REMITTANCE HISTORY)
        ================================================== */}
        <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-colors dark:border-slate-800 dark:bg-[#0f1319]">
          {/* Table Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3.5 dark:border-slate-800 dark:bg-[#0f1319]">
            <div>
              <h2 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">
                Remittance History
              </h2>
              <p className="mt-0.5 text-[11.5px] text-slate-400 dark:text-slate-500">
                {filteredRemittances.length} {filteredRemittances.length === 1 ? "record" : "records"} found
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                COD
              </span>
            </div>
          </div>

          {/* 1. MOBILE RESPONSIVE CARDS */}
          <div className="space-y-3 p-3.5 sm:hidden">
            {loading ? (
              <CardSkeleton count={4} />
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-xs font-semibold text-rose-600">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchCODRemittances(true)}
                  className="mt-2 text-xs font-bold text-[#008dd2] underline"
                >
                  Try Again
                </button>
              </div>
            ) : paginatedRemittances.length === 0 ? (
              <div className="p-10 text-center text-slate-400 dark:text-slate-500">
                <HiOutlineCash className="mx-auto text-3xl mb-1 text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No remittance records found
                </p>
                <p className="text-[11px] mt-0.5">Delivered COD orders will automatically list here.</p>
              </div>
            ) : (
              paginatedRemittances.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-2.5 dark:border-slate-800 dark:bg-[#141923]"
                >
                  <div className="flex items-start justify-between border-b border-slate-100 pb-2 dark:border-slate-800/80">
                    <div>
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-100">
                        <span>#{item.order_id}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.order_id, "Order ID")}
                          className="text-slate-400 hover:text-[#008dd2]"
                        >
                          <HiOutlineDuplicate className="text-xs" />
                        </button>
                      </div>
                      <p className="text-[12px] font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                        {item.buyer || "—"}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {formatAmount(item.cod_amount)}
                      </span>
                      <div className="mt-1">{renderStatusBadge(item.status)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                    <div>
                      <span className="text-slate-400 block text-[10.5px]">AWB No:</span>
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                        {item.awb || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10.5px]">Delivered On:</span>
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        {formatDate(item.tracking_updated_at || item.created_at)}
                      </span>
                    </div>
                  </div>

                  {item.transferred_on && (
                    <div className="border-t border-slate-50 pt-1.5 text-[11px] text-slate-400 dark:border-slate-800/60 flex items-center justify-between">
                      <span>Transferred On:</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {formatDate(item.transferred_on)}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* 2. TABLET & DESKTOP TABLE VIEW */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full min-w-[880px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-white text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  <th className="px-4 py-3 text-left">Order ID</th>
                  <th className="px-4 py-3 text-left">Buyer</th>
                  <th className="px-4 py-3 text-left">AWB No</th>
                  <th className="px-4 py-3 text-left">COD Amount</th>
                  <th className="px-4 py-3 text-left">Delivered On</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Transferred On</th>
                  <th className="px-4 py-3 text-left">Description</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-[12.5px] dark:divide-slate-800">
                {loading ? (
                  <TableRowSkeleton rows={6} cols={8} />
                ) : error ? (
                  <tr>
                    <td colSpan="8" className="px-5 py-14 text-center">
                      <p className="text-xs font-semibold text-rose-600">{error}</p>
                      <button
                        type="button"
                        onClick={() => fetchCODRemittances(true)}
                        className="mt-2 text-xs font-bold text-[#008dd2] underline"
                      >
                        Try Again
                      </button>
                    </td>
                  </tr>
                ) : paginatedRemittances.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-5 py-16 text-center">
                      <HiOutlineCash className="mx-auto text-4xl mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        No COD remittance records found
                      </p>
                      <p className="mt-1 text-[11.5px] text-slate-400 dark:text-slate-500">
                        {hasFilters
                          ? "Try adjusting your search query, dates, or status filter."
                          : "Orders delivered with Cash-on-Delivery will appear here for payout tracking."}
                      </p>
                      {hasFilters && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          <span>Reset Filters</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedRemittances.map((item) => (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                    >
                      {/* Order ID */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-[12.5px] font-semibold text-slate-900 dark:text-slate-100">
                          <span>#{item.order_id}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.order_id, "Order ID")}
                            title="Copy Order ID"
                            className="text-slate-400 hover:text-[#008dd2] transition p-0.5"
                          >
                            <HiOutlineDuplicate className="text-[13px]" />
                          </button>
                        </div>
                      </td>

                      {/* Buyer */}
                      <td className="px-4 py-3">
                        <span className="text-[12.5px] font-medium text-slate-800 dark:text-slate-200">
                          {item.buyer || "—"}
                        </span>
                      </td>

                      {/* AWB */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.awb ? (
                          <div className="flex items-center gap-1.5 font-mono text-[12px] text-slate-700 dark:text-slate-300">
                            <span>{item.awb}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(item.awb, "AWB")}
                              title="Copy AWB"
                              className="text-slate-400 hover:text-[#008dd2] transition p-0.5"
                            >
                              <HiOutlineDuplicate className="text-[13px]" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* COD Amount */}
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-emerald-600 dark:text-emerald-400 text-[13px]">
                        {formatAmount(item.cod_amount)}
                      </td>

                      {/* Delivered On */}
                      <td className="px-4 py-3 whitespace-nowrap text-[12px] text-slate-600 dark:text-slate-300">
                        {formatDate(item.tracking_updated_at || item.created_at)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {renderStatusBadge(item.status)}
                      </td>

                      {/* Transferred On */}
                      <td className="px-4 py-3 whitespace-nowrap text-[12px] text-slate-600 dark:text-slate-300">
                        {item.transferred_on ? formatDate(item.transferred_on) : "—"}
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3 text-[12px] text-slate-500 dark:text-slate-400">
                        {item.description || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ==================================================
              6. TABLE FOOTER & PAGINATION
          ================================================== */}
          {!loading && !error && filteredRemittances.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3 text-xs text-slate-500 gap-3 dark:border-slate-800 dark:bg-slate-800/30 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span>
                  Showing{" "}
                  <b className="font-semibold text-slate-800 dark:text-slate-100">
                    {Math.min((currentPage - 1) * rowsPerPage + 1, filteredRemittances.length)}
                  </b>{" "}
                  to{" "}
                  <b className="font-semibold text-slate-800 dark:text-slate-100">
                    {Math.min(currentPage * rowsPerPage, filteredRemittances.length)}
                  </b>{" "}
                  of{" "}
                  <b className="font-semibold text-slate-800 dark:text-slate-100">
                    {filteredRemittances.length}
                  </b>{" "}
                  records
                </span>

                <span className="text-slate-300 dark:text-slate-600">|</span>

                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <HiOutlineChevronLeft />
                  </button>

                  <span className="px-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <HiOutlineChevronRight />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
