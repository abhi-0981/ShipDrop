import React, { useState, useEffect, useMemo, useCallback } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  HiOutlineCash,
  HiOutlineCalendar,
  HiOutlineDownload,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineCurrencyRupee,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineClipboardCopy,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineX,
  HiOutlineShieldCheck,
  HiOutlineCube,
  HiOutlineTruck,
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
    toast.success(`${label} copied to clipboard!`, { id: "clipboard-toast", duration: 1500 });
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

  // KPI Summary
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

    const realizationRate =
      totalCodAmount > 0
        ? Math.round((settledAmount / totalCodAmount) * 100)
        : totalOrders > 0 && pendingCount === 0
        ? 100
        : 0;

    return {
      totalOrders,
      totalCodAmount,
      pendingCount,
      pendingAmount,
      settledCount,
      settledAmount,
      realizationRate,
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
        "Remittance ID",
        "Order ID",
        "Buyer / Consignee",
        "AWB Number",
        "COD Amount (INR)",
        "Delivered On",
        "Remittance Status",
        "Transferred On",
        "Remarks / Description",
      ];

      const csvRows = [headers.join(",")];

      filteredRemittances.forEach((r) => {
        const row = [
          `"${r.id || ""}"`,
          `"${String(r.order_id || "").replace(/"/g, '""')}"`,
          `"${String(r.buyer || "").replace(/"/g, '""')}"`,
          `"${String(r.awb || "").replace(/"/g, '""')}"`,
          Number(r.cod_amount || 0).toFixed(2),
          `"${r.tracking_updated_at ? formatDate(r.tracking_updated_at) : formatDate(r.created_at)}"`,
          `"${String(r.status || "PENDING").toUpperCase()}"`,
          `"${r.transferred_on ? formatDate(r.transferred_on) : "Pending"}"`,
          `"${String(r.description || "COD collection payout").replace(/"/g, '""')}"`,
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

  // Status Badge Component
  const renderStatusBadge = (status) => {
    const s = String(status || "").toUpperCase();
    if (s === "SUCCESSFUL" || s === "TRANSFERRED" || s === "SETTLED") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <HiOutlineCheckCircle className="text-[13px] text-emerald-600 dark:text-emerald-400" />
          <span>Transferred</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
        </span>
        <span>Pending Settlement</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] px-4 py-5 transition-colors duration-200 dark:bg-[#090b10]">
      <div className="mx-auto max-w-[1450px]">
        {/* ==================================================
            1. TOP HEADER (REPORT DESIGN)
        ================================================== */}
        <div className="mb-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition-colors dark:border-slate-800 dark:bg-[#0f1319]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#edf8ff] text-[#008dd2] dark:bg-[#008dd2]/10 dark:text-[#38bdf8]">
                <HiOutlineCash className="text-[22px]" />
              </div>

              <div>
                <h1 className="text-[17px] font-semibold tracking-[-0.2px] text-slate-900 dark:text-slate-100">
                  COD Remittance Ledger
                </h1>
                <p className="mt-0.5 text-[12px] text-slate-400 dark:text-slate-500">
                  Track delivered Cash-on-Delivery collections, pending settlements, and automated wallet payouts
                </p>
              </div>
            </div>

            {/* TOP ACTION BUTTONS */}
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
            3. KPI SUMMARY CARDS (REPORT STATCARD DESIGN)
        ================================================== */}
        <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {/* Card 1: Total COD Collected */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)] transition-all dark:border-slate-800 dark:bg-[#0f1319]">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
                  Total COD Orders
                </p>
                <h3 className="mt-1 text-[22px] font-bold text-slate-800 tracking-tight dark:text-slate-100">
                  {formatAmount(summary.totalCodAmount)}
                </h3>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-[#008dd2]">{summary.totalOrders}</span>
                  <span>Delivered COD parcels</span>
                </div>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#008dd2] dark:bg-blue-950/40 dark:text-[#38bdf8]">
                <HiOutlineCube className="text-[20px]" />
              </div>
            </div>
          </div>

          {/* Card 2: Pending Remittance */}
          <div className="rounded-2xl border border-amber-200/70 bg-white p-3.5 sm:p-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)] transition-all dark:border-amber-900/40 dark:bg-[#0f1319]">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-[11px] font-semibold tracking-wide text-amber-600 uppercase dark:text-amber-400">
                  Pending Payout
                </p>
                <h3 className="mt-1 text-[22px] font-bold text-amber-600 tracking-tight dark:text-amber-400">
                  {formatAmount(summary.pendingAmount)}
                </h3>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {summary.pendingCount}
                  </span>
                  <span>Awaiting wallet settlement</span>
                </div>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <HiOutlineClock className="text-[20px]" />
              </div>
            </div>
          </div>

          {/* Card 3: Successfully Transferred */}
          <div className="rounded-2xl border border-emerald-200/70 bg-white p-3.5 sm:p-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)] transition-all dark:border-emerald-900/40 dark:bg-[#0f1319]">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-[11px] font-semibold tracking-wide text-emerald-600 uppercase dark:text-emerald-400">
                  Transferred to Wallet
                </p>
                <h3 className="mt-1 text-[22px] font-bold text-emerald-600 tracking-tight dark:text-emerald-400">
                  {formatAmount(summary.settledAmount)}
                </h3>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {summary.settledCount}
                  </span>
                  <span>Settled & credited directly</span>
                </div>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <HiOutlineCheckCircle className="text-[20px]" />
              </div>
            </div>
          </div>

          {/* Card 4: Settlement Health Rate */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)] transition-all dark:border-slate-800 dark:bg-[#0f1319]">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
                  Settlement Rate
                </p>
                <h3 className="mt-1 text-[22px] font-bold text-slate-800 tracking-tight dark:text-slate-100">
                  {summary.realizationRate}%
                </h3>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {summary.settledCount}/{summary.totalOrders}
                  </span>
                  <span>Completed realization</span>
                </div>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                <HiOutlineShieldCheck className="text-[20px]" />
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            4. SEARCH & FILTER CONTROLS
        ================================================== */}
        <div className="mb-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs transition-colors dark:border-slate-800 dark:bg-[#0f1319]">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            {/* Search Bar */}
            <div className="relative min-w-0 flex-1">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                <HiOutlineSearch className="text-[16px]" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by Order ID, Buyer Name, or AWB number..."
                className="h-9.5 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-[#008dd2] dark:focus:bg-[#141923]"
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
              className="h-9.5 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-[12px] font-medium text-slate-600 outline-none transition focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10 sm:w-[170px] dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Settlement</option>
              <option value="SUCCESSFUL">Transferred to Wallet</option>
            </select>

            {/* Clear Filters Button */}
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-9.5 shrink-0 rounded-lg px-3 text-[12px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* ==================================================
            5. MAIN TABLE (DESKTOP & MOBILE VIEWS)
        ================================================== */}
        <div className="w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-[#0f1319]">
          {/* Table Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3.5 dark:border-slate-800 dark:bg-[#0f1319]">
            <div>
              <h2 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">
                Remittance Records
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                Showing {filteredRemittances.length} matching{" "}
                {filteredRemittances.length === 1 ? "record" : "records"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#edf8ff] px-2.5 py-1 text-[11px] font-bold text-[#008dd2] dark:bg-[#008dd2]/10 dark:text-[#38bdf8]">
                <span>COD Settler</span>
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
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100">
                          #{item.order_id}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.order_id, "Order ID")}
                          className="text-slate-400 hover:text-[#008dd2]"
                        >
                          <HiOutlineClipboardCopy className="text-xs" />
                        </button>
                      </div>
                      <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                        {item.buyer || "Consignee"}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {formatAmount(item.cod_amount)}
                      </span>
                      <div className="mt-1">{renderStatusBadge(item.status)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">AWB Number:</span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {item.awb || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Delivered On:</span>
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        {formatDate(item.tracking_updated_at || item.created_at)}
                      </span>
                    </div>
                  </div>

                  {item.transferred_on && (
                    <div className="border-t border-slate-50 pt-1.5 text-[10px] text-slate-400 dark:border-slate-800/60 flex items-center justify-between">
                      <span>Transferred Date:</span>
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
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-[11%]" />  {/* Order ID */}
                <col className="w-[18%]" />  {/* Buyer */}
                <col className="w-[15%]" />  {/* AWB */}
                <col className="w-[12%]" />  {/* COD Amount */}
                <col className="w-[14%]" />  {/* Delivered On */}
                <col className="w-[15%]" />  {/* Status */}
                <col className="w-[15%]" />  {/* Transferred On */}
              </colgroup>

              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  <th className="px-4 py-3 text-left">Order ID</th>
                  <th className="px-4 py-3 text-left">Buyer / Consignee</th>
                  <th className="px-4 py-3 text-left">AWB Number</th>
                  <th className="px-4 py-3 text-right">COD Amount</th>
                  <th className="px-4 py-3 text-left">Delivered Date</th>
                  <th className="px-4 py-3 text-left">Remittance Status</th>
                  <th className="px-4 py-3 text-left">Payout Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
                {loading ? (
                  <TableRowSkeleton rows={6} cols={7} />
                ) : error ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-14 text-center">
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
                    <td colSpan="7" className="px-5 py-16 text-center">
                      <HiOutlineCash className="mx-auto text-4xl mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        No COD remittance records found
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
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
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100">
                            #{item.order_id}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.order_id, "Order ID")}
                            title="Copy Order ID"
                            className="text-slate-400 opacity-60 transition hover:opacity-100 hover:text-[#008dd2]"
                          >
                            <HiOutlineClipboardCopy className="text-[13px]" />
                          </button>
                        </div>
                      </td>

                      {/* Buyer */}
                      <td className="px-4 py-3.5">
                        <div className="min-w-0 pr-2">
                          <p className="truncate font-bold text-slate-800 dark:text-slate-100">
                            {item.buyer || "Consignee"}
                          </p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            Ref: #{item.id}
                          </span>
                        </div>
                      </td>

                      {/* AWB */}
                      <td className="px-4 py-3.5">
                        {item.awb ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {item.awb}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(item.awb, "AWB")}
                              title="Copy AWB Number"
                              className="text-slate-400 opacity-60 transition hover:opacity-100 hover:text-[#008dd2]"
                            >
                              <HiOutlineClipboardCopy className="text-[13px]" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* COD Amount */}
                      <td className="px-4 py-3.5 text-right font-black text-emerald-600 dark:text-emerald-400 text-[13px]">
                        {formatAmount(item.cod_amount)}
                      </td>

                      {/* Delivered On */}
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 text-[11px]">
                        {formatDate(item.tracking_updated_at || item.created_at)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">{renderStatusBadge(item.status)}</td>

                      {/* Transferred On */}
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 text-[11px]">
                        {item.transferred_on ? (
                          <div>
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              {formatDate(item.transferred_on)}
                            </span>
                            {item.description && (
                              <p className="truncate text-[10px] text-slate-400 max-w-[150px]">
                                {item.description}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Pending payout</span>
                        )}
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
