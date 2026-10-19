import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineRefresh,
  HiOutlineDownload,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineCurrencyRupee,
  HiOutlineTrendingUp,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineCreditCard,
  HiOutlineCash,
  HiOutlineUserCircle,
  HiOutlineExternalLink,
  HiOutlineChevronRight,
  HiOutlineAdjustments,
  HiOutlineCalendar,
  HiOutlineInformationCircle,
} from "react-icons/hi";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { API_BASE_URL } from "../../config/api";

const formatMoney = (val) =>
  `₹${Number(val || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatNumber = (val) =>
  new Intl.NumberFormat("en-IN").format(Number(val || 0));

export default function BusinessAnalytics() {
  const navigate = useNavigate();

  // -----------------------------------------------------
  // FILTERS STATE
  // -----------------------------------------------------
  const [timeRange, setTimeRange] = useState("30days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [paymentType, setPaymentType] = useState("ALL");
  const [orderStatus, setOrderStatus] = useState("ALL");

  // User search query inside the user dropdown filter
  const [userSearchText, setUserSearchText] = useState("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Table local search & sort
  const [tableSearch, setTableSearch] = useState("");
  const [sortBy, setSortBy] = useState("freightSpent"); // freightSpent, codRemitted, profit, ordersCount, balance
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // -----------------------------------------------------
  // DATA STATES
  // -----------------------------------------------------
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({
    kpis: {
      totalRevenue: 0,
      estimatedProfit: 0,
      totalOrders: 0,
      deliveredOrders: 0,
      inTransitOrders: 0,
      processingOrders: 0,
      rtoOrders: 0,
      cancelledOrders: 0,
      deliverySuccessRate: 0,
      rtoRate: 0,
      codOrders: 0,
      prepaidOrders: 0,
      totalCODRemitted: 0,
      pendingCODRemittance: 0,
      remittedPayoutCount: 0,
      pendingPayoutCount: 0,
      totalRechargeInflow: 0,
      currentWalletHolding: 0,
      totalCODOrderValue: 0,
      avgOrderFreight: 0,
    },
    trend: [],
    userBreakdown: [],
  });

  // -----------------------------------------------------
  // FETCH USERS FOR FILTER
  // -----------------------------------------------------
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await fetch(`${API_BASE_URL}/admin/analytics/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setUsersList(data.users);
        }
      } catch (err) {
        console.error("Failed to fetch users list for analytics filter:", err);
      }
    };
    fetchUsers();
  }, []);

  // -----------------------------------------------------
  // FETCH SUMMARY DATA
  // -----------------------------------------------------
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams({
        timeRange,
        startDate: startDate || "",
        endDate: endDate || "",
        userId: selectedUserId,
        paymentType,
        status: orderStatus,
      });

      const res = await fetch(
        `${API_BASE_URL}/admin/analytics/summary?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load analytics data");
      }

      setAnalyticsData({
        kpis: data.kpis || {},
        trend: data.trend || [],
        userBreakdown: data.userBreakdown || [],
      });
      setCurrentPage(1);
    } catch (err) {
      console.error("Analytics fetch error:", err);
      toast.error(err.message || "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  }, [timeRange, startDate, endDate, selectedUserId, paymentType, orderStatus]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".user-select-container")) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // -----------------------------------------------------
  // FILTERED & SORTED USERS TABLE
  // -----------------------------------------------------
  const processedUsers = useMemo(() => {
    let list = [...(analyticsData.userBreakdown || [])];

    // Client-side text search
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.company?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q) ||
          String(u.userId).includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === "profit") {
        valA = a.estimatedProfit;
        valB = b.estimatedProfit;
      } else if (sortBy === "balance") {
        valA = a.currentWalletBalance;
        valB = b.currentWalletBalance;
      }

      if (typeof valA === "string") {
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    return list;
  }, [analyticsData.userBreakdown, tableSearch, sortBy, sortOrder]);

  const totalPages = Math.ceil(processedUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedUsers.slice(start, start + pageSize);
  }, [processedUsers, currentPage]);

  const selectedUserObject = useMemo(() => {
    if (selectedUserId === "all") return null;
    return usersList.find((u) => String(u.id) === String(selectedUserId));
  }, [selectedUserId, usersList]);

  // -----------------------------------------------------
  // EXPORT TO EXCEL
  // -----------------------------------------------------
  const exportToExcel = () => {
    try {
      const exportRows = (analyticsData.userBreakdown || []).map((u) => ({
        "User ID": u.userId,
        "Customer Name": u.name,
        "Company / Brand": u.company,
        "Email Address": u.email,
        "Contact Phone": u.phone,
        "Total Orders Booked": u.ordersCount,
        "Delivered Orders": u.deliveredCount,
        "RTO Orders": u.rtoCount,
        "Delivery Success Rate (%)": `${u.successRate}%`,
        "Freight Spend (INR)": u.freightSpent,
        "COD Remitted / Payout Taken (INR)": u.codRemitted,
        "Pending COD Remittance (INR)": u.codPending,
        "Total Wallet Recharged (INR)": u.totalRecharged,
        "Current Wallet Balance (INR)": u.currentWalletBalance,
        "Estimated Platform Profit (INR)": u.estimatedProfit,
      }));

      const kpiRows = [
        { Metric: "Time Range Filter", Value: timeRange },
        { Metric: "Selected User Filter", Value: selectedUserObject ? `${selectedUserObject.full_name} (${selectedUserObject.company_name || "Individual"})` : "All Users" },
        { Metric: "Payment Type Filter", Value: paymentType },
        { Metric: "Order Status Filter", Value: orderStatus },
        { Metric: "Total Gross Freight Turnover", Value: formatMoney(analyticsData.kpis.totalRevenue) },
        { Metric: "Estimated Platform Profit", Value: formatMoney(analyticsData.kpis.estimatedProfit) },
        { Metric: "Total Orders Booked", Value: analyticsData.kpis.totalOrders },
        { Metric: "Total COD Remitted (User Payouts)", Value: formatMoney(analyticsData.kpis.totalCODRemitted) },
        { Metric: "Pending COD Remittances", Value: formatMoney(analyticsData.kpis.pendingCODRemittance) },
        { Metric: "Wallet Recharges Inflow", Value: formatMoney(analyticsData.kpis.totalRechargeInflow) },
        { Metric: "Current Total Wallet Holding", Value: formatMoney(analyticsData.kpis.currentWalletHolding) },
        { Metric: "Delivery Success Rate", Value: `${analyticsData.kpis.deliverySuccessRate}%` },
        { Metric: "RTO Rate", Value: `${analyticsData.kpis.rtoRate}%` },
      ];

      const wb = XLSX.utils.book_new();

      const wsKPI = XLSX.utils.json_to_sheet(kpiRows);
      XLSX.utils.book_append_sheet(wb, wsKPI, "Executive Summary");

      const wsUsers = XLSX.utils.json_to_sheet(exportRows);
      XLSX.utils.book_append_sheet(wb, wsUsers, "User Payouts & Profit");

      const timestamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `ShipDrop_Business_Analytics_${timestamp}.xlsx`);
      toast.success("Analytics report downloaded successfully!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to generate export file");
    }
  };

  const { kpis, trend } = analyticsData;

  // Maximum value for SVG trend chart normalization
  const maxTrendRevenue = useMemo(() => {
    if (!trend || trend.length === 0) return 1000;
    const max = Math.max(...trend.map((t) => Number(t.freight_revenue || 0)));
    return max > 0 ? max : 1000;
  }, [trend]);

  const maxTrendOrders = useMemo(() => {
    if (!trend || trend.length === 0) return 10;
    const max = Math.max(...trend.map((t) => Number(t.orders_count || 0)));
    return max > 0 ? max : 10;
  }, [trend]);

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* ===================================================
          TOP BAR & EXECUTIVE CONTROLS
      =================================================== */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#008dd2]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#008dd2] animate-pulse" />
              Executive Business Intelligence
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">
              Live Financial Auditing & Analytics
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Business & Profit Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Pura business analysis, seller payout tracking, net margins & order pipelines.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-60"
          >
            <HiOutlineRefresh
              size={16}
              className={`text-slate-500 ${loading ? "animate-spin text-[#008dd2]" : ""}`}
            />
            <span>Refresh</span>
          </button>

          <button
            onClick={exportToExcel}
            disabled={loading || (analyticsData.userBreakdown || []).length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[#008dd2] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#007bb8] active:scale-95 disabled:opacity-60"
          >
            <HiOutlineDownload size={16} />
            <span>Export Full Report (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* ===================================================
          MULTI-DIMENSIONAL FILTER TOOLBAR
      =================================================== */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <HiOutlineFilter size={16} className="text-[#008dd2]" />
            <span>Multi-Dimensional Filters</span>
          </div>

          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "7days", label: "7 Days" },
              { id: "30days", label: "30 Days" },
              { id: "this_month", label: "This Month" },
              { id: "last_month", label: "Last Month" },
              { id: "all", label: "All Time" },
              { id: "custom", label: "Custom Range" },
            ].map((p) => {
              const active = timeRange === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setTimeRange(p.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    active
                      ? "bg-[#008dd2] text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. USER SELECTOR (Individual User vs All) */}
          <div className="relative user-select-container">
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Seller / User Scope
            </label>
            <div
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex h-10 w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs hover:border-[#008dd2]/50 transition"
            >
              <div className="truncate">
                {selectedUserObject ? (
                  <span className="font-semibold text-[#008dd2]">
                    {selectedUserObject.full_name} ({selectedUserObject.company_name || "Seller"})
                  </span>
                ) : (
                  <span className="text-slate-700 font-medium">All Users (Platform Total)</span>
                )}
              </div>
              <HiOutlineAdjustments size={16} className="shrink-0 text-slate-400" />
            </div>

            {/* Dropdown Menu */}
            {isUserDropdownOpen && (
              <div className="absolute left-0 top-full z-30 mt-1.5 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <div className="relative mb-2">
                  <HiOutlineSearch
                    size={14}
                    className="absolute left-2.5 top-2.5 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Search seller name, brand, phone..."
                    value={userSearchText}
                    onChange={(e) => setUserSearchText(e.target.value)}
                    className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2 text-xs outline-none focus:border-[#008dd2] focus:bg-white"
                    autoFocus
                  />
                </div>

                <div className="max-h-56 overflow-y-auto space-y-0.5">
                  <button
                    onClick={() => {
                      setSelectedUserId("all");
                      setIsUserDropdownOpen(false);
                      setUserSearchText("");
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                      selectedUserId === "all"
                        ? "bg-[#008dd2]/10 font-bold text-[#008dd2]"
                        : "hover:bg-slate-50 text-slate-700 font-medium"
                    }`}
                  >
                    <span>All Users (Overall Platform)</span>
                    {selectedUserId === "all" && <HiOutlineCheckCircle size={14} />}
                  </button>

                  {usersList
                    .filter((u) => {
                      if (!userSearchText.trim()) return true;
                      const q = userSearchText.toLowerCase();
                      return (
                        u.full_name?.toLowerCase().includes(q) ||
                        u.company_name?.toLowerCase().includes(q) ||
                        u.phone_no?.toLowerCase().includes(q) ||
                        u.email?.toLowerCase().includes(q) ||
                        String(u.id).includes(q)
                      );
                    })
                    .map((u) => {
                      const isSelected = String(selectedUserId) === String(u.id);
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            setSelectedUserId(String(u.id));
                            setIsUserDropdownOpen(false);
                            setUserSearchText("");
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                            isSelected
                              ? "bg-[#008dd2]/10 font-bold text-[#008dd2]"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="font-semibold truncate">
                              {u.full_name}{" "}
                              <span className="text-[10px] font-normal text-slate-400">
                                #{u.id}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {u.company_name || u.email || u.phone_no}
                            </div>
                          </div>
                          {isSelected && <HiOutlineCheckCircle size={14} className="shrink-0 text-[#008dd2]" />}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* 2. PAYMENT TYPE FILTER */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Payment Mode
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs outline-none focus:border-[#008dd2]"
            >
              <option value="ALL">All Payment Types</option>
              <option value="COD">Cash on Delivery (COD)</option>
              <option value="PREPAID">Prepaid (Wallet / Online)</option>
            </select>
          </div>

          {/* 3. ORDER STATUS FILTER */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Delivery / Pipeline Status
            </label>
            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs outline-none focus:border-[#008dd2]"
            >
              <option value="ALL">All Order Statuses</option>
              <option value="DELIVERED">Delivered Only</option>
              <option value="IN TRANSIT">In Transit</option>
              <option value="MANIFESTED">Manifested / Processing</option>
              <option value="RTO DELIVERED">RTO (Returned to Origin)</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* 4. RESET OR ACTIVE FILTER INDICATOR */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setTimeRange("30days");
                setStartDate("");
                setEndDate("");
                setSelectedUserId("all");
                setPaymentType("ALL");
                setOrderStatus("ALL");
              }}
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-95"
            >
              <HiOutlineAdjustments size={15} />
              <span>Reset All Filters</span>
            </button>
          </div>
        </div>

        {/* Custom Date Range Picker bar (when custom range is picked) */}
        {timeRange === "custom" && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#008dd2]">
              <HiOutlineCalendar size={16} />
              <span>Specify Custom Date Range:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium outline-none focus:border-[#008dd2]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium outline-none focus:border-[#008dd2]"
              />
            </div>
            <button
              onClick={fetchAnalytics}
              className="h-8 rounded-lg bg-[#008dd2] px-3 text-xs font-semibold text-white shadow-xs hover:bg-[#007bb8] transition"
            >
              Apply Dates
            </button>
          </div>
        )}

        {/* Active Filter Pill Bar */}
        {(selectedUserId !== "all" || paymentType !== "ALL" || orderStatus !== "ALL") && (
          <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="font-semibold text-slate-400">Active Filters:</span>
            {selectedUserObject && (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 font-medium text-[#008dd2] border border-blue-200">
                User: {selectedUserObject.full_name}
                <button
                  onClick={() => setSelectedUserId("all")}
                  className="hover:text-red-500 font-bold ml-1"
                >
                  ×
                </button>
              </span>
            )}
            {paymentType !== "ALL" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 border border-emerald-200">
                Mode: {paymentType}
                <button
                  onClick={() => setPaymentType("ALL")}
                  className="hover:text-red-500 font-bold ml-1"
                >
                  ×
                </button>
              </span>
            )}
            {orderStatus !== "ALL" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 font-medium text-purple-700 border border-purple-200">
                Status: {orderStatus}
                <button
                  onClick={() => setOrderStatus("ALL")}
                  className="hover:text-red-500 font-bold ml-1"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ===================================================
          EXECUTIVE KPI METRIC CARDS GRID (8 CARDS)
      =================================================== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* CARD 1: GROSS FREIGHT REVENUE */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Gross Freight Turnover
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#008dd2]">
              <HiOutlineCurrencyRupee size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              {formatMoney(kpis.totalRevenue)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>Avg per parcel</span>
              <span className="font-semibold text-slate-700">
                {formatMoney(kpis.avgOrderFreight)}
              </span>
            </div>
          </div>
          <div className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-400">
            Total shipping fee billed on orders
          </div>
        </div>

        {/* CARD 2: ESTIMATED PLATFORM PROFIT */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 via-white to-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Net Platform Profit (Est.)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <HiOutlineTrendingUp size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-emerald-600">
              {formatMoney(kpis.estimatedProfit)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-emerald-800/80">
              <span>Platform Margin</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                ~18% Spread
              </span>
            </div>
          </div>
          <div className="mt-3 border-t border-emerald-100 pt-2 text-[11px] text-emerald-700/70">
            Aggregator freight margin profit
          </div>
        </div>

        {/* CARD 3: COD REMITTED (USER PAYOUTS TAKEN) */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/30 via-white to-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-900">
              Total COD Remitted (Payouts)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <HiOutlineCash size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-indigo-700">
              {formatMoney(kpis.totalCODRemitted)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-indigo-900/80">
              <span>Transfers Completed</span>
              <span className="font-semibold text-indigo-700">
                {formatNumber(kpis.remittedPayoutCount)} payouts
              </span>
            </div>
          </div>
          <div className="mt-3 border-t border-indigo-100 pt-2 text-[11px] text-indigo-600/70">
            Paisa jo sellers ke bank me bheja gaya
          </div>
        </div>

        {/* CARD 4: PENDING COD REMITTANCES */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Pending COD Payouts
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <HiOutlineClock size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-amber-700">
              {formatMoney(kpis.pendingCODRemittance)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-amber-900/80">
              <span>Pending Queue</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                {formatNumber(kpis.pendingPayoutCount)} pending
              </span>
            </div>
          </div>
          <div className="mt-3 border-t border-amber-100 pt-2 text-[11px] text-amber-700/70">
            COD cash collected waiting for remittance
          </div>
        </div>

        {/* CARD 5: WALLET RECHARGE INFLOW */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Wallet Recharges Inflow
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <HiOutlineCreditCard size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              {formatMoney(kpis.totalRechargeInflow)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>Deposited by sellers</span>
              <span className="font-semibold text-slate-700">Fresh Capital</span>
            </div>
          </div>
          <div className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-400">
            Total money loaded via Razorpay / manual credit
          </div>
        </div>

        {/* CARD 6: ACTIVE WALLET HOLDING (LIABILITY) */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Live Wallet Holding
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
              <HiOutlineCash size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              {formatMoney(kpis.currentWalletHolding)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>Platform Liability</span>
              <span className="font-semibold text-cyan-700">Current Balances</span>
            </div>
          </div>
          <div className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-400">
            Active balances sitting in seller wallets right now
          </div>
        </div>

        {/* CARD 7: TOTAL ORDERS BOOKED */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Parcels / Orders Booked
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#008dd2]">
              <HiOutlineTruck size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              {formatNumber(kpis.totalOrders)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>Split by Payment</span>
              <span className="font-semibold text-slate-700">
                {kpis.codOrders} COD / {kpis.prepaidOrders} Prep
              </span>
            </div>
          </div>
          <div className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-400">
            Total consignments placed in selected range
          </div>
        </div>

        {/* CARD 8: DELIVERY SUCCESS RATE & RTO */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Delivery Success vs RTO
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <HiOutlineCheckCircle size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-emerald-600">
                {kpis.deliverySuccessRate}%
              </span>
              <span className="text-xs text-slate-400 font-medium">Delivered</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>RTO / Return Rate</span>
              <span
                className={`font-semibold ${
                  kpis.rtoRate > 15 ? "text-rose-600" : "text-amber-600"
                }`}
              >
                {kpis.rtoRate}% ({kpis.rtoOrders} pkgs)
              </span>
            </div>
          </div>
          <div className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-400">
            {kpis.deliveredOrders} delivered of {kpis.totalOrders} total
          </div>
        </div>
      </div>

      {/* ===================================================
          CHARTS & VISUAL BREAKDOWN SECTION
      =================================================== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* TIME-SERIES BAR VISUALIZER (2 COLS) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Freight Revenue & Order Volume Timeline
              </h2>
              <p className="text-xs text-slate-500">
                Periodic trend breakdown based on currently applied filters
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#008dd2]" />
                <span className="text-slate-600">Freight (₹)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-emerald-400" />
                <span className="text-slate-600">Orders</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="mt-4">
            {trend.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-xs text-slate-400 font-medium">
                No orders found for the selected timeframe and filter criteria.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex h-48 items-end gap-2 overflow-x-auto pt-6 pb-2">
                  {trend.map((point, idx) => {
                    const revenueHeight = Math.max(
                      6,
                      Math.round((Number(point.freight_revenue || 0) / maxTrendRevenue) * 100)
                    );
                    const ordersHeight = Math.max(
                      6,
                      Math.round((Number(point.orders_count || 0) / maxTrendOrders) * 100)
                    );

                    return (
                      <div
                        key={idx}
                        className="group relative flex flex-1 min-w-[28px] max-w-[50px] flex-col items-center h-full justify-end"
                      >
                        {/* Hover Tooltip */}
                        <div className="pointer-events-none absolute bottom-full mb-2 hidden w-36 rounded-lg bg-slate-900 p-2 text-center text-[10px] text-white shadow-lg group-hover:block z-20">
                          <div className="font-bold border-b border-slate-700 pb-1 mb-1">
                            {point.period_label || point.period_key}
                          </div>
                          <div className="text-blue-300">
                            Freight: {formatMoney(point.freight_revenue)}
                          </div>
                          <div className="text-emerald-300">
                            Orders: {point.orders_count}
                          </div>
                        </div>

                        {/* Dual Bars */}
                        <div className="flex items-end gap-1 w-full justify-center">
                          <div
                            style={{ height: `${revenueHeight}%` }}
                            className="w-1/2 rounded-t-sm bg-[#008dd2] transition-all group-hover:brightness-110"
                          />
                          <div
                            style={{ height: `${ordersHeight}%` }}
                            className="w-1/2 rounded-t-sm bg-emerald-400 transition-all group-hover:brightness-110"
                          />
                        </div>

                        {/* Date Label */}
                        <span className="mt-1.5 truncate text-[10px] font-medium text-slate-500 w-full text-center">
                          {point.period_label || point.period_key}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ORDER PIPELINE & FINANCIAL METRIC DIALS (1 COL) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Logistics Pipeline Distribution
              </h2>
              <p className="text-xs text-slate-500">
                Order fulfillment status breakdown
              </p>
            </div>

            <div className="mt-4 space-y-3.5">
              {/* Delivered */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Delivered
                  </span>
                  <span className="text-slate-800">
                    {formatNumber(kpis.deliveredOrders)}{" "}
                    <span className="text-slate-400 font-normal">
                      ({kpis.totalOrders > 0 ? Math.round((kpis.deliveredOrders / kpis.totalOrders) * 100) : 0}%)
                    </span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{
                      width: `${kpis.totalOrders > 0 ? (kpis.deliveredOrders / kpis.totalOrders) * 100 : 0}%`,
                    }}
                    className="h-full rounded-full bg-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* In Transit */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-blue-700 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    In Transit / OFD
                  </span>
                  <span className="text-slate-800">
                    {formatNumber(kpis.inTransitOrders)}{" "}
                    <span className="text-slate-400 font-normal">
                      ({kpis.totalOrders > 0 ? Math.round((kpis.inTransitOrders / kpis.totalOrders) * 100) : 0}%)
                    </span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{
                      width: `${kpis.totalOrders > 0 ? (kpis.inTransitOrders / kpis.totalOrders) * 100 : 0}%`,
                    }}
                    className="h-full rounded-full bg-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Processing */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-amber-700 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Processing / Manifested
                  </span>
                  <span className="text-slate-800">
                    {formatNumber(kpis.processingOrders)}{" "}
                    <span className="text-slate-400 font-normal">
                      ({kpis.totalOrders > 0 ? Math.round((kpis.processingOrders / kpis.totalOrders) * 100) : 0}%)
                    </span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{
                      width: `${kpis.totalOrders > 0 ? (kpis.processingOrders / kpis.totalOrders) * 100 : 0}%`,
                    }}
                    className="h-full rounded-full bg-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* RTO Returned */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-rose-700 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    RTO / Returned
                  </span>
                  <span className="text-slate-800">
                    {formatNumber(kpis.rtoOrders)}{" "}
                    <span className="text-slate-400 font-normal">
                      ({kpis.totalOrders > 0 ? Math.round((kpis.rtoOrders / kpis.totalOrders) * 100) : 0}%)
                    </span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{
                      width: `${kpis.totalOrders > 0 ? (kpis.rtoOrders / kpis.totalOrders) * 100 : 0}%`,
                    }}
                    className="h-full rounded-full bg-rose-500 transition-all"
                  />
                </div>
              </div>

              {/* Cancelled */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    Cancelled
                  </span>
                  <span className="text-slate-800">
                    {formatNumber(kpis.cancelledOrders)}{" "}
                    <span className="text-slate-400 font-normal">
                      ({kpis.totalOrders > 0 ? Math.round((kpis.cancelledOrders / kpis.totalOrders) * 100) : 0}%)
                    </span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{
                      width: `${kpis.totalOrders > 0 ? (kpis.cancelledOrders / kpis.totalOrders) * 100 : 0}%`,
                    }}
                    className="h-full rounded-full bg-slate-400 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Financial Cash Flow Summary Pill */}
          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Net Settlement Ratio:</span>
              <span className="font-bold text-slate-800">
                {kpis.totalCODRemitted + kpis.pendingCODRemittance > 0
                  ? `${Math.round(
                      (kpis.totalCODRemitted /
                        (kpis.totalCODRemitted + kpis.pendingCODRemittance)) *
                        100
                    )}% Remitted`
                  : "100% Settled"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          PER-USER FINANCIAL & PAYOUT INTELLIGENCE TABLE
          Directly delivers: "kon sa user monthly kitna pesa
          nikal raha hai sare kitne nikal rahe hai pura sab kuch"
      =================================================== */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {/* Table Header Bar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Seller-wise Payouts & Profit Breakdown
              </h2>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-[#008dd2]">
                {processedUsers.length} Sellers
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Live tracking of kitna paisa har user nikal raha hai (COD Remittance), unki shipping spend, aur profit.
            </p>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px] sm:w-64">
              <HiOutlineSearch
                size={15}
                className="absolute left-3 top-3 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search user name, company, phone..."
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium text-slate-800 outline-none focus:border-[#008dd2] focus:bg-white transition"
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs outline-none focus:border-[#008dd2]"
            >
              <option value="freightSpent">Sort: Highest Freight Spend</option>
              <option value="codRemitted">Sort: Most COD Remitted (Payout)</option>
              <option value="profit">Sort: Highest Platform Profit</option>
              <option value="ordersCount">Sort: Most Orders Booked</option>
              <option value="balance">Sort: Highest Wallet Balance</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 shadow-xs hover:bg-slate-50 transition"
              title="Toggle Ascending / Descending"
            >
              {sortOrder === "desc" ? "↓" : "↑"}
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 sm:px-5">Seller / User Profile</th>
                <th className="px-4 py-3 text-right">Orders Booked</th>
                <th className="px-4 py-3 text-right">Freight Spent</th>
                <th className="px-4 py-3 text-right text-indigo-900 bg-indigo-50/40">
                  COD Remitted (Payout Taken)
                </th>
                <th className="px-4 py-3 text-right text-amber-900 bg-amber-50/30">
                  Pending Remittance
                </th>
                <th className="px-4 py-3 text-right">Wallet Balance</th>
                <th className="px-4 py-3 text-right text-emerald-900 bg-emerald-50/30">
                  Est. Net Profit
                </th>
                <th className="px-4 py-3 text-center">Success %</th>
                <th className="px-4 py-3 text-center sm:px-5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No seller records found matching the specified filters.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const isFiltered = String(selectedUserId) === String(u.userId);
                  return (
                    <tr
                      key={u.userId}
                      className={`transition hover:bg-slate-50/80 ${
                        isFiltered ? "bg-blue-50/30" : ""
                      }`}
                    >
                      {/* USER INFO */}
                      <td className="px-4 py-3 sm:px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-700">
                            {u.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 truncate">
                                {u.name}
                              </span>
                              <span className="rounded-md bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-500">
                                #{u.userId}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {u.company !== "Individual" ? (
                                <span className="font-semibold text-slate-700">{u.company}</span>
                              ) : (
                                <span>{u.email}</span>
                              )}
                              {u.phone && <span className="ml-1 text-slate-400">• {u.phone}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ORDERS */}
                      <td className="px-4 py-3 text-right">
                        <div className="font-bold text-slate-900">
                          {formatNumber(u.ordersCount)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {u.deliveredCount} del / {u.rtoCount} rto
                        </div>
                      </td>

                      {/* FREIGHT SPENT */}
                      <td className="px-4 py-3 text-right">
                        <div className="font-bold text-slate-900">
                          {formatMoney(u.freightSpent)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {u.ordersCount > 0
                            ? formatMoney(u.freightSpent / u.ordersCount) + "/pkg"
                            : "—"}
                        </div>
                      </td>

                      {/* COD REMITTED (PAYOUT NIKALA) */}
                      <td className="px-4 py-3 text-right bg-indigo-50/20 font-bold text-indigo-700">
                        <div>{formatMoney(u.codRemitted)}</div>
                        <div className="text-[10px] font-medium text-indigo-500">
                          Money Paid Out
                        </div>
                      </td>

                      {/* PENDING REMITTANCE */}
                      <td className="px-4 py-3 text-right bg-amber-50/15 font-semibold text-amber-700">
                        <div>{formatMoney(u.codPending)}</div>
                        <div className="text-[10px] text-amber-600/70 font-normal">
                          In Queue
                        </div>
                      </td>

                      {/* WALLET BALANCE & RECHARGED */}
                      <td className="px-4 py-3 text-right">
                        <div
                          className={`font-bold ${
                            u.currentWalletBalance < 0
                              ? "text-rose-600"
                              : "text-slate-900"
                          }`}
                        >
                          {formatMoney(u.currentWalletBalance)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Total Dep: {formatMoney(u.totalRecharged)}
                        </div>
                      </td>

                      {/* ESTIMATED PROFIT */}
                      <td className="px-4 py-3 text-right bg-emerald-50/20 font-bold text-emerald-600">
                        <div>{formatMoney(u.estimatedProfit)}</div>
                        <div className="text-[10px] font-medium text-emerald-700/70">
                          Margin Generated
                        </div>
                      </td>

                      {/* SUCCESS RATE */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            u.successRate >= 80
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : u.successRate >= 50
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {u.ordersCount > 0 ? `${u.successRate}%` : "—"}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-4 py-3 text-center sm:px-5">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Filter by this user button */}
                          <button
                            onClick={() => {
                              setSelectedUserId(String(u.userId));
                              window.scrollTo({ top: 0, behavior: "smooth" });
                              toast.success(`Analytics filtered for ${u.name}`);
                            }}
                            title="Filter full analytics dashboard for this user"
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:border-[#008dd2] hover:text-[#008dd2] transition"
                          >
                            <HiOutlineFilter size={14} />
                          </button>

                          {/* View user details profile */}
                          <button
                            onClick={() => navigate(`/users/${u.userId}`)}
                            title="Open full user account profile & ledger"
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:border-[#008dd2] hover:text-[#008dd2] transition"
                          >
                            <HiOutlineExternalLink size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 sm:px-5">
            <span className="text-xs text-slate-500">
              Showing page <span className="font-semibold">{currentPage}</span> of{" "}
              <span className="font-semibold">{totalPages}</span> (
              {processedUsers.length} total users)
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-7 w-7 rounded-lg text-xs font-semibold transition ${
                      currentPage === pageNum
                        ? "bg-[#008dd2] text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================
          INTELLIGENCE SUMMARY CALLOUT
      =================================================== */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5 flex items-start gap-3">
        <HiOutlineInformationCircle size={22} className="shrink-0 text-[#008dd2] mt-0.5" />
        <div className="text-xs text-slate-600 leading-relaxed">
          <span className="font-bold text-slate-800">
            Automated Audit & Real-Time Aggregation:
          </span>{" "}
          Pura analytics real-time MySQL database se direct compute hota hai. COD remittances
          ka status (Success vs Pending), wallet recharge inflow, current wallet holding liability,
          aur per-seller shipping spend har calculation me accurate sync rehta hai. Aap kisi bhi
          user ke row me filter button daba kar single-user mode me poora dashboard analyse kar sakte hain.
        </div>
      </div>
    </div>
  );
}
