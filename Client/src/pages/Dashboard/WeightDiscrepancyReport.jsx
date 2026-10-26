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



  // Status Badge
  const getDisputeStatusBadge = (status) => {
    const s = String(status || "").toLowerCase().trim();
    if (s === "settled") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          <HiOutlineCheckCircle className="text-xs text-emerald-600" />
          Settled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
        <HiOutlineClock className="text-xs text-amber-600" />
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
    <div className="min-h-screen bg-[#f5f8fc] px-4 py-5">
      <div className="mx-auto max-w-[1450px]">
        {/* ==================================================
            1. TOP HEADER
        ================================================== */}
        <div className="mb-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#edf8ff] text-[#008dd2]">
                <HiOutlineScale className="text-[20px]" />
              </div>

              <div>
                <h1 className="text-[17px] font-semibold tracking-[-0.2px] text-slate-900">
                  Weight Discrepancy & Dispute Report
                </h1>
                <p className="mt-0.5 text-[12px] text-slate-400">
                  Audit courier verified weight vs declared package weight and track wallet adjustments
                </p>
              </div>
            </div>

            {/* TOP BUTTONS */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={loading || exporting || filteredDiscrepancies.length === 0}
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
                placeholder="Search by AWB or Order ID..."
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
              className="h-10 min-w-[135px] rounded-lg border border-slate-200 bg-white px-3 text-[12px] text-slate-600 outline-none focus:border-[#008dd2]"
            >
              <option value="ALL">All Status</option>
              <option value="pending">Pending</option>
              <option value="settled">Settled</option>
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
                  <th className="py-3 px-4">Date Flagged</th>
                  <th className="py-3 px-4">Declared Wt.</th>
                  <th className="py-3 px-4">Billed Wt.</th>
                  <th className="py-3 px-4">Excess Wt.</th>
                  <th className="py-3 px-4 text-right">Original (₹)</th>
                  <th className="py-3 px-4 text-right">Extra Debit (₹)</th>
                  <th className="py-3 px-4 text-center">Dispute Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[12px] text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-14 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-7 w-7 border-2 border-[#008dd2] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[12px] font-medium text-slate-400">Loading weight discrepancy reports...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentDiscrepancies.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-14 text-center">
                      <div className="max-w-sm mx-auto flex flex-col items-center justify-center text-slate-400">
                        <div className="h-12 w-12 rounded-xl bg-[#edf8ff] text-[#008dd2] flex items-center justify-center text-2xl mb-2.5">
                          <HiOutlineScale />
                        </div>
                        <p className="text-[13px] font-bold text-slate-800">No weight discrepancies found</p>
                        <p className="text-[11.5px] text-slate-400 mt-0.5">
                          There are no weight discrepancies flagged by couriers for your account in the selected period.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentDiscrepancies.map((d) => (
                    <tr key={d.id || d.awb} className="hover:bg-slate-50/60 transition-colors">
                      {/* Order ID & AWB */}
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-semibold text-slate-900 text-[12px] flex items-center gap-1.5">
                            <span>#{d.order_id}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(d.order_id, "Order ID")}
                              className="text-slate-400 hover:text-slate-600 transition"
                              title="Copy Order ID"
                            >
                              <HiOutlineClipboardCopy className="text-xs" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              {d.awb}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(d.awb, "AWB")}
                              className="text-slate-400 hover:text-[#008dd2] transition"
                              title="Copy AWB"
                            >
                              <HiOutlineClipboardCopy className="text-xs" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Date Flagged */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-[12px] font-medium text-slate-700">
                          {d.created_at ? new Date(d.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                        </div>
                        <div className="text-[10.5px] text-slate-400">
                          {d.zone ? `Zone ${d.zone}` : ""}
                        </div>
                      </td>

                      {/* Declared Wt */}
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11.5px]">
                          {Number(d.declared_weight || 0).toFixed(3)} kg
                        </span>
                      </td>

                      {/* Billed Wt */}
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100 font-semibold text-[11.5px]">
                          {Number(d.actual_weight || 0).toFixed(3)} kg
                        </span>
                      </td>

                      {/* Weight Difference */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md text-[11.5px]">
                          +{Number(d.weight_difference || 0).toFixed(3)} kg
                        </span>
                      </td>

                      {/* Original Shipping Charge */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-medium text-slate-600 text-[12px]">
                        ₹{Number(d.original_shipping_charge || 0).toFixed(2)}
                      </td>

                      {/* Extra Debit Charge */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-rose-600 text-[12px]">
                          +₹{Number(d.extra_charge || 0).toFixed(2)}
                        </span>
                      </td>

                      {/* Dispute Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-100">
              <div className="text-[12px] font-medium text-slate-500">
                Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * rowsPerPage + 1}</span> to{" "}
                <span className="font-semibold text-slate-700">
                  {Math.min(currentPage * rowsPerPage, filteredDiscrepancies.length)}
                </span>{" "}
                of <span className="font-semibold text-slate-700">{filteredDiscrepancies.length}</span> records
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
