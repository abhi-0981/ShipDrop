import React, { useState, useEffect, useMemo, useCallback } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  HiOutlineCreditCard,
  HiOutlineCash,
  HiOutlineDownload,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineCalendar,
  HiOutlineDuplicate,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineX,
  HiOutlinePlus,
  HiOutlineCheckCircle,
  HiOutlineTruck,
  HiOutlineArrowDown,
  HiOutlineArrowUp,
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

export default function WalletHistory() {
  const [transactions, setTransactions] = useState([]);
  const [liveBalance, setLiveBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [datePreset, setDatePreset] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [, setCopiedText] = useState(null);

  // Load User from localStorage
  useEffect(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (!savedUser?.id) {
        setError("User session not found. Please log in again.");
        setLoading(false);
        return;
      }
      setUser(savedUser);
    } catch {
      setError("Unable to load user profile");
      setLoading(false);
    }
  }, []);

  // Fetch Wallet History and Live Balance
  const fetchWalletData = useCallback(async (isRefresh = false) => {
    if (!user?.id) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      const [historyRes, walletRes] = await Promise.allSettled([
        api.get(`/payments/wallet/history?user_id=${user.id}`),
        api.get(`/payments/wallet?user_id=${user.id}`),
      ]);

      if (historyRes.status === "fulfilled") {
        const txList = Array.isArray(historyRes.value.data?.transactions)
          ? historyRes.value.data.transactions
          : [];
        setTransactions(txList);
      } else {
        console.error("Wallet history fetch error:", historyRes.reason);
        setError(
          historyRes.reason?.response?.data?.message || "Unable to load wallet history"
        );
      }

      if (walletRes.status === "fulfilled") {
        setLiveBalance(Number(walletRes.value.data?.balance || 0));
      }
    } catch (err) {
      console.error("Wallet data load error:", err);
      setError("Failed to load wallet ledger");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      fetchWalletData();
    }
  }, [user, fetchWalletData]);

  // Open Global Recharge Modal
  const handleOpenRecharge = () => {
    window.dispatchEvent(new CustomEvent("shipdrop:openRechargeModal"));
  };

  // Preset Date Filter Handler
  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    if (preset !== "custom") {
      const dates = getPresetDates(preset);
      setStartDate(dates.start);
      setEndDate(dates.end);
      setCurrentPage(1);
    }
  };

  // Copy helper
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

  const getType = (type) => {
    return String(type || "").toUpperCase() === "DEBIT" ? "DEBIT" : "CREDIT";
  };

  // Parse rich transaction details (categories, clean titles, badges)
  const getDescriptionData = (transaction) => {
    const rawDesc = String(transaction.description || "").trim();
    const type = getType(transaction.type);
    const isDebit = type === "DEBIT";
    const paymentId = transaction.razorpay_payment_id;

    // Extract Order ID if present
    const orderMatch = rawDesc.match(/order(?:\s*id)?\s*[-:#]?\s*([a-z0-9,\s-]+)/i);
    const rawOrderMatches = orderMatch?.[1]?.trim() || "";
    const singleOrderId = rawOrderMatches.split(/[\s,]+/)[0]?.replace(/^#/, "");

    // 1. CANCELLATION REFUND
    if (
      rawDesc.toLowerCase().includes("cancellation refund") ||
      (rawDesc.toLowerCase().includes("refund") && !rawDesc.toLowerCase().includes("weight"))
    ) {
      return {
        categoryKey: "REFUND",
        category: "Refund",
        title: "Order Cancellation Refund",
        subtitle: singleOrderId
          ? `Full freight refunded for Order #${singleOrderId}`
          : "Full shipping freight refund credited to wallet",
        badge: "100% Refund",
        badgeClass:
          "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
        iconType: "refund",
      };
    }

    // 2. WEIGHT DISCREPANCY / WEIGHT ADJUSTMENT
    if (
      rawDesc.toLowerCase().includes("weight adjustment") ||
      rawDesc.toLowerCase().includes("weight")
    ) {
      const weightMatch = rawDesc.match(/actual\s*weight\s*([0-9.]+)\s*(?:kg)?/i);
      const actualWeightStr = weightMatch ? `${weightMatch[1]} kg` : "";

      if (isDebit) {
        return {
          categoryKey: "WEIGHT",
          category: "Weight Surcharge",
          title: "Weight Discrepancy Adjustment",
          subtitle: actualWeightStr && singleOrderId
            ? `Courier freight adjusted for revised weight (${actualWeightStr}) on Order #${singleOrderId}`
            : singleOrderId
            ? `Courier billable weight discrepancy debited for Order #${singleOrderId}`
            : "Courier billable weight discrepancy charge debited from wallet",
          badge: "Revised Weight",
          badgeClass:
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
          iconType: "weight-debit",
        };
      } else {
        return {
          categoryKey: "WEIGHT",
          category: "Weight Reversal",
          title: "Weight Discrepancy Reversal",
          subtitle: singleOrderId
            ? `Original freight credited back due to weight revision on Order #${singleOrderId}`
            : "Original freight credited back due to courier weight recalculation",
          badge: "Freight Reversal",
          badgeClass:
            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
          iconType: "weight-credit",
        };
      }
    }

    // 3. SHIPPING CHARGES (MANIFESTATION / LABEL CREATION)
    if (isDebit) {
      const isBatch = rawOrderMatches.includes(",") || rawDesc.toLowerCase().includes("orders");
      return {
        categoryKey: "FREIGHT",
        category: "Shipment Freight",
        title: isBatch ? "Batch Shipment Freight" : "Shipment Freight Charge",
        subtitle: isBatch
          ? `Freight charges debited for batch manifest (${rawOrderMatches})`
          : singleOrderId
          ? `Freight charges deducted for Order #${singleOrderId}`
          : "Shipping and logistics fee debited from wallet",
        badge: "Manifested",
        badgeClass:
          "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
        iconType: "debit",
      };
    }

    // 4. WALLET RECHARGE / TOP-UP
    if (
      rawDesc.toLowerCase().includes("recharge") ||
      rawDesc.toLowerCase().includes("wallet recharged") ||
      transaction.type === "RECHARGE" ||
      paymentId
    ) {
      return {
        categoryKey: "RECHARGE",
        category: "Wallet Top-Up",
        title: "Wallet Recharge",
        subtitle: paymentId
          ? `Money added to wallet balance (${paymentId})`
          : "Money added to wallet balance",
        badge: "Recharge",
        badgeClass:
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
        iconType: "recharge",
      };
    }

    // 5. COD REMITTANCE
    if (
      rawDesc.toLowerCase().includes("cod") ||
      rawDesc.toLowerCase().includes("remittance")
    ) {
      return {
        categoryKey: "REMITTANCE",
        category: "COD Payout",
        title: "COD Remittance Payout",
        subtitle: singleOrderId
          ? `Cash on Delivery collections settled for Order #${singleOrderId}`
          : "COD collection remittance payout credited to wallet",
        badge: "COD Settled",
        badgeClass:
          "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
        iconType: "cod",
      };
    }

    // 6. GENERAL / MANUAL ADJUSTMENT
    return {
      categoryKey: "ADJUSTMENT",
      category: "Adjustment",
      title: "Wallet Balance Adjustment",
      subtitle: rawDesc || "Balance adjustment by ShipDrop Accounts",
      badge: isDebit ? "Debit Adjust" : "Credit Adjust",
      badgeClass: isDebit
        ? "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
        : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
      iconType: isDebit ? "debit" : "recharge",
    };
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setCategoryFilter("ALL");
    setDatePreset("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const hasFilters = Boolean(
    search.trim() ||
      typeFilter !== "ALL" ||
      categoryFilter !== "ALL" ||
      datePreset !== "all" ||
      startDate ||
      endDate
  );

  // Filter Transactions
  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((t) => {
      const type = getType(t.type);
      const descData = getDescriptionData(t);
      const txnId = String(t.id || "").toLowerCase();
      const rawDesc = String(t.description || "").toLowerCase();
      const amountStr = String(t.amount || "");
      const openingStr = String(t.opening_balance || "");
      const closingStr = String(t.closing_balance || "");

      // 1. Text Search matching
      const searchMatch =
        !query ||
        txnId.includes(query) ||
        rawDesc.includes(query) ||
        descData.title.toLowerCase().includes(query) ||
        descData.subtitle.toLowerCase().includes(query) ||
        amountStr.includes(query) ||
        openingStr.includes(query) ||
        closingStr.includes(query);

      // 2. Type Filter matching
      const typeMatch = typeFilter === "ALL" || type === typeFilter;

      // 3. Category Filter matching
      const categoryMatch =
        categoryFilter === "ALL" || descData.categoryKey === categoryFilter;

      // 4. Date Range matching
      let dateMatch = true;
      if (startDate || endDate) {
        if (t.created_at) {
          const d = new Date(t.created_at);
          if (!Number.isNaN(d.getTime())) {
            const dateStr = formatDateForInput(d);
            if (startDate && dateStr < startDate) dateMatch = false;
            if (endDate && dateStr > endDate) dateMatch = false;
          }
        }
      }

      return searchMatch && typeMatch && categoryMatch && dateMatch;
    });
  }, [transactions, search, typeFilter, categoryFilter, startDate, endDate]);


  // Pagination calculation
  const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredTransactions.slice(start, start + rowsPerPage);
  }, [filteredTransactions, currentPage, rowsPerPage]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredTransactions.length) {
      toast.error("No transactions available to export");
      return;
    }
    setExporting(true);
    try {
      const headers = [
        "Transaction ID",
        "Type",
        "Amount (INR)",
        "Opening Balance (INR)",
        "Closing Balance (INR)",
        "Category",
        "Title",
        "Details",
        "Date & Time",
      ];

      const csvRows = [headers.join(",")];

      filteredTransactions.forEach((t) => {
        const descData = getDescriptionData(t);
        const type = getType(t.type);
        const row = [
          `"${t.id || ""}"`,
          `"${type}"`,
          Number(t.amount || 0).toFixed(2),
          t.opening_balance != null ? Number(t.opening_balance).toFixed(2) : "—",
          t.closing_balance != null ? Number(t.closing_balance).toFixed(2) : "—",
          `"${descData.category}"`,
          `"${descData.title.replace(/"/g, '""')}"`,
          `"${descData.subtitle.replace(/"/g, '""')}"`,
          `"${formatDate(t.created_at)}"`,
        ];
        csvRows.push(row.join(","));
      });

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `ShipDrop_Wallet_Ledger_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Wallet ledger exported successfully!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export wallet ledger");
    } finally {
      setExporting(false);
    }
  };

  // Description Icon Renderer
  const renderCategoryIcon = (iconType) => {
    switch (iconType) {
      case "refund":
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <HiOutlineArrowDown className="text-sm" />
          </div>
        );
      case "weight-debit":
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <HiOutlineArrowUp className="text-sm" />
          </div>
        );
      case "weight-credit":
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <HiOutlineCheckCircle className="text-sm" />
          </div>
        );
      case "cod":
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <HiOutlineCash className="text-sm" />
          </div>
        );
      case "debit":
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <HiOutlineTruck className="text-sm" />
          </div>
        );
      default:
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <HiOutlinePlus className="text-sm" />
          </div>
        );
    }
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
                <HiOutlineCreditCard className="text-[22px]" />
              </div>

              <div>
                <h1 className="text-[17px] font-semibold tracking-[-0.2px] text-slate-900 dark:text-slate-100">
                  Wallet Ledger & Transactions
                </h1>
                <p className="mt-0.5 text-[12px] text-slate-400 dark:text-slate-500">
                  Track live wallet balance, shipping debits, top-ups, refunds, and COD payouts
                </p>
              </div>
            </div>

            {/* TOP ACTIONS */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenRecharge}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#008dd2] px-3.5 text-[12px] font-semibold text-white shadow-xs transition hover:bg-[#007bb8] active:scale-95"
              >
                <HiOutlinePlus className="text-[15px]" />
                <span>Recharge Wallet</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                disabled={loading || exporting || filteredTransactions.length === 0}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 text-[12px] font-medium text-white shadow-xs transition hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <HiOutlineDownload className="text-[15px]" />
                <span>{exporting ? "Exporting..." : "Export CSV"}</span>
              </button>

              <button
                type="button"
                onClick={() => fetchWalletData(true)}
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
            4. SEARCH & FILTER CONTROLS
        ================================================== */}
        <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition-colors dark:border-slate-800 dark:bg-[#0f1319]">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
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
                placeholder="Search transaction ID, Order #, or details..."
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

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 min-w-[130px] rounded-lg border border-slate-200 bg-white px-3 text-[12.5px] font-medium text-slate-600 outline-none transition focus:border-[#008dd2] dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
            >
              <option value="ALL">All Types</option>
              <option value="CREDIT">Credits (+)</option>
              <option value="DEBIT">Debits (-)</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 text-[12.5px] font-medium text-slate-600 outline-none transition focus:border-[#008dd2] dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
            >
              <option value="ALL">All Categories</option>
              <option value="RECHARGE">Wallet Recharges</option>
              <option value="FREIGHT">Shipment Freight</option>
              <option value="REFUND">Order Refunds</option>
              <option value="WEIGHT">Weight Adjustments</option>
              <option value="REMITTANCE">COD Remittances</option>
            </select>

            {/* Clear Filters */}
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-10 px-3 rounded-lg text-[12px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* ==================================================
            5. MAIN TABLE (TRANSACTION LEDGER)
        ================================================== */}
        <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-colors dark:border-slate-800 dark:bg-[#0f1319]">
          {/* Table Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3.5 dark:border-slate-800 dark:bg-[#0f1319]">
            <div>
              <h2 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">
                Transaction History
              </h2>
              <p className="mt-0.5 text-[11.5px] text-slate-400 dark:text-slate-500">
                {filteredTransactions.length}{" "}
                {filteredTransactions.length === 1 ? "record" : "records"} found
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                Live Ledger
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
                  onClick={() => fetchWalletData(true)}
                  className="mt-2 text-xs font-bold text-[#008dd2] underline"
                >
                  Try Again
                </button>
              </div>
            ) : paginatedTransactions.length === 0 ? (
              <div className="p-10 text-center text-slate-400 dark:text-slate-500">
                <HiOutlineCreditCard className="mx-auto text-3xl mb-1 text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No transactions found
                </p>
                <p className="text-[11px] mt-0.5">Wallet activities will appear here.</p>
              </div>
            ) : (
              paginatedTransactions.map((item) => {
                const type = getType(item.type);
                const isDebit = type === "DEBIT";
                const desc = getDescriptionData(item);

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-2.5 dark:border-slate-800 dark:bg-[#141923]"
                  >
                    <div className="flex items-start justify-between border-b border-slate-100 pb-2 dark:border-slate-800/80">
                      <div className="flex items-start gap-2.5">
                        {renderCategoryIcon(desc.iconType)}
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                              {desc.title}
                            </span>
                            {desc.badge && (
                              <span
                                className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9.5px] font-bold leading-none ${desc.badgeClass}`}
                              >
                                {desc.badge}
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[10.5px] text-slate-400">
                            TXN #{item.id}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-sm font-bold ${
                            isDebit ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isDebit ? "-" : "+"}
                          {formatAmount(item.amount)}
                        </span>
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              isDebit
                                ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                                : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isDebit ? "bg-rose-500" : "bg-emerald-500"
                              }`}
                            />
                            {type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Opening:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {item.opening_balance != null ? formatAmount(item.opening_balance) : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Closing:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {item.closing_balance != null ? formatAmount(item.closing_balance) : "—"}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-50 pt-1.5 text-[10.5px] text-slate-500 dark:border-slate-800/60 flex items-center justify-between">
                      <span className="truncate max-w-[65%]">{desc.subtitle}</span>
                      <span className="shrink-0 text-slate-400">{formatDate(item.created_at)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 2. TABLET & DESKTOP TABLE VIEW */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full min-w-[880px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-white text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200">
                  <th className="px-4 py-3 text-left">TXN ID</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Opening Bal</th>
                  <th className="px-4 py-3 text-left">Closing Bal</th>
                  <th className="px-4 py-3 text-left">Description & Details</th>
                  <th className="px-4 py-3 text-left">Date & Time</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-[12.5px] dark:divide-slate-800">
                {loading ? (
                  <TableRowSkeleton rows={6} cols={7} />
                ) : error ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-14 text-center">
                      <p className="text-xs font-semibold text-rose-600">{error}</p>
                      <button
                        type="button"
                        onClick={() => fetchWalletData(true)}
                        className="mt-2 text-xs font-bold text-[#008dd2] underline"
                      >
                        Try Again
                      </button>
                    </td>
                  </tr>
                ) : paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-16 text-center">
                      <HiOutlineCreditCard className="mx-auto text-4xl mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        No transactions found
                      </p>
                      <p className="mt-1 text-[11.5px] text-slate-400 dark:text-slate-500">
                        {hasFilters
                          ? "Try adjusting your search query, dates, or category filter."
                          : "Wallet activities such as recharges, shipping debits, and refunds will appear here."}
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
                  paginatedTransactions.map((item) => {
                    const type = getType(item.type);
                    const isDebit = type === "DEBIT";
                    const desc = getDescriptionData(item);

                    return (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                      >
                        {/* TXN ID */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-mono text-[12.5px] font-bold text-slate-900 dark:text-slate-100">
                            <span>#{item.id}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(item.id, "Transaction ID")}
                              title="Copy Transaction ID"
                              className="text-slate-500 hover:text-[#008dd2] transition p-0.5"
                            >
                              <HiOutlineDuplicate className="text-[13px]" />
                            </button>
                          </div>
                        </td>

                        {/* Amount */}
                        <td
                          className={`px-4 py-3 whitespace-nowrap font-bold text-[13px] ${
                            isDebit
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isDebit ? "-" : "+"}
                          {formatAmount(item.amount)}
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                              isDebit
                                ? "border-rose-200/90 bg-rose-50/80 text-rose-700 dark:border-rose-800/80 dark:bg-rose-950/40 dark:text-rose-300"
                                : "border-emerald-200/90 bg-emerald-50/80 text-emerald-700 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-300"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isDebit ? "bg-rose-500" : "bg-emerald-500"
                              }`}
                            />
                            {type}
                          </span>
                        </td>

                        {/* Opening Balance */}
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                          {item.opening_balance != null
                            ? formatAmount(item.opening_balance)
                            : "—"}
                        </td>

                        {/* Closing Balance */}
                        <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-800 dark:text-slate-200">
                          {item.closing_balance != null
                            ? formatAmount(item.closing_balance)
                            : "—"}
                        </td>

                        {/* Description & Details */}
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2.5 max-w-[420px]">
                            <div className="mt-0.5 shrink-0">
                              {renderCategoryIcon(desc.iconType)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-800 dark:text-slate-100 text-[12.5px] leading-tight">
                                  {desc.title}
                                </span>
                                {desc.badge && (
                                  <span
                                    className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9.5px] font-bold leading-none ${desc.badgeClass}`}
                                  >
                                    {desc.badge}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[11.5px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                                {desc.subtitle}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td className="px-4 py-3 whitespace-nowrap text-[12px] font-medium text-slate-700 dark:text-slate-300">
                          {formatDate(item.created_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ==================================================
              6. TABLE FOOTER & PAGINATION
          ================================================== */}
          {!loading && !error && filteredTransactions.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3 text-xs text-slate-500 gap-3 dark:border-slate-800 dark:bg-slate-800/30 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span>
                  Showing{" "}
                  <b className="font-semibold text-slate-800 dark:text-slate-100">
                    {Math.min(
                      (currentPage - 1) * rowsPerPage + 1,
                      filteredTransactions.length
                    )}
                  </b>{" "}
                  to{" "}
                  <b className="font-semibold text-slate-800 dark:text-slate-100">
                    {Math.min(currentPage * rowsPerPage, filteredTransactions.length)}
                  </b>{" "}
                  of{" "}
                  <b className="font-semibold text-slate-800 dark:text-slate-100">
                    {filteredTransactions.length}
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