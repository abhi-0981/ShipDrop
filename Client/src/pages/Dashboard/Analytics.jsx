import React, { useState, useEffect, useMemo, useCallback } from "react";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import IndiaMap from "../../components/Analytics/IndiaMap";
import {
  HiOutlineRefresh,
  HiOutlineDownload,
  HiOutlineTrendingUp,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineCash,
  HiOutlineLocationMarker,
  HiOutlineCalendar,
  HiOutlineLightningBolt,
  HiOutlineSearch,
} from "react-icons/hi";

// Format currency
const formatMoney = (val) =>
  `₹${Number(val || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// Format simple count
const formatCount = (val) =>
  new Intl.NumberFormat("en-IN").format(Number(val || 0));

export default function Analytics() {
  // --------------------------------------------------
  // FILTERS
  // --------------------------------------------------
  const [timeRange, setTimeRange] = useState("30days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentType, setPaymentType] = useState("ALL");
  const [showCustomDates, setShowCustomDates] = useState(false);

  // --------------------------------------------------
  // DATA STATES
  // --------------------------------------------------
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    kpis: {
      totalOrders: 0,
      deliveredOrders: 0,
      deliverySuccessRate: 0,
      rtoOrders: 0,
      rtoRate: 0,
      inTransitOrders: 0,
      pendingOrders: 0,
      processingOrders: 0,
      cancelledOrders: 0,
      totalFreight: 0,
      avgFreightPerOrder: 0,
      codOrders: 0,
      prepaidOrders: 0,
      codTotalValue: 0,
    },
    stateBreakdown: [],
    trend: [],
    zones: [],
    cities: [],
    services: [],
  });

  // Selected state on India map
  const [selectedState, setSelectedState] = useState(null);
  const [stateSearch, setStateSearch] = useState("");
  const [exportingGst, setExportingGst] = useState(false);

  // --------------------------------------------------
  // FETCH ANALYTICS OVERVIEW
  // --------------------------------------------------
  const fetchAnalytics = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);

        const storedUser = localStorage.getItem("user");
        let userId = null;
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            userId = user?.id || user?.user_id;
          } catch {}
        }

        const params = {
          user_id: userId,
          timeRange,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          paymentType,
        };

        const res = await api.get("/analytics/overview", { params });

        if (res.data?.success && res.data?.data) {
          setAnalyticsData(res.data.data);
        } else {
          toast.error(res.data?.message || "Failed to load analytics");
        }
      } catch (err) {
        console.error("Error fetching analytics:", err);
        toast.error(
          err.response?.data?.message || "Unable to fetch analytics data"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [timeRange, startDate, endDate, paymentType]
  );

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // --------------------------------------------------
  // EXPORT GST STATEMENT (CSV)
  // --------------------------------------------------
  const handleExportGst = async () => {
    try {
      setExportingGst(true);
      const storedUser = localStorage.getItem("user");
      let userId = null;
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          userId = user?.id || user?.user_id;
        } catch {}
      }

      const params = {
        user_id: userId,
        timeRange,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const res = await api.get("/analytics/gst-report", { params });

      if (res.data?.success && Array.isArray(res.data?.data)) {
        const rows = res.data.data;
        if (rows.length === 0) {
          toast.error("No shipments found for GST report in this time range");
          return;
        }

        // Generate CSV
        const headers = [
          "Order ID",
          "AWB",
          "Date",
          "Customer Name",
          "Destination City",
          "Destination State",
          "Pincode",
          "Payment Mode",
          "Shipment Status",
          "Taxable Freight (₹)",
          "CGST 9% (₹)",
          "SGST 9% (₹)",
          "IGST 18% (₹)",
          "Total Freight with GST (₹)",
        ];

        const csvRows = [headers.join(",")];
        rows.forEach((r) => {
          csvRows.push(
            [
              `"${r.order_id}"`,
              `"${r.awb}"`,
              `"${r.date}"`,
              `"${(r.consignee || "").replace(/"/g, '""')}"`,
              `"${(r.destination_city || "").replace(/"/g, '""')}"`,
              `"${(r.destination_state || "").replace(/"/g, '""')}"`,
              `"${r.destination_pincode}"`,
              `"${r.payment_mode}"`,
              `"${r.shipment_status}"`,
              r.taxable_value,
              r.cgst_9pct,
              r.sgst_9pct,
              r.igst_18pct,
              r.total_freight_gst_included,
            ].join(",")
          );
        });

        const blob = new Blob([csvRows.join("\n")], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `ShipDrop_GST_Tax_Report_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("GST Statement downloaded successfully!");
      } else {
        toast.error("Failed to generate GST report");
      }
    } catch (err) {
      console.error("GST Export error:", err);
      toast.error("Unable to export GST statement");
    } finally {
      setExportingGst(false);
    }
  };

  const {
    kpis,
    stateBreakdown = [],
    trend = [],
    zones = [],
    cities = [],
    services = [],
  } = analyticsData;

  // Filtered states by search
  const filteredStates = useMemo(() => {
    if (!stateSearch.trim()) return stateBreakdown;
    return stateBreakdown.filter((s) =>
      s.state.toLowerCase().includes(stateSearch.trim().toLowerCase())
    );
  }, [stateBreakdown, stateSearch]);

  // Max value in daily trend for chart scaling
  const maxTrendOrders = useMemo(() => {
    let max = 0;
    (trend || []).forEach((t) => {
      if (Number(t.orders_count) > max) max = Number(t.orders_count);
    });
    return max > 0 ? max : 5;
  }, [trend]);

  return (
    <div className="min-h-full w-full bg-[#f6f8fb] p-3.5 sm:p-5 md:p-6 pb-24 lg:pb-12 text-slate-800">
      {/* ==================================================
          1. HEADER & GLOBAL FILTERS
      ================================================== */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[20px] sm:text-[24px] font-bold tracking-tight text-slate-900">
              Business Analytics
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE INSIGHTS
            </span>
          </div>
          <p className="mt-0.5 text-[12px] sm:text-[13px] text-slate-500 font-medium">
            State-wise India sales heatmap, delivery TAT, and shipping ROI.
          </p>
        </div>

        {/* ACTION BUTTONS & TIME FILTERS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* TIME RANGE SELECTOR */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
            {[
              { id: "today", label: "Today" },
              { id: "7days", label: "7D" },
              { id: "30days", label: "30D" },
              { id: "this_month", label: "This Month" },
              { id: "all", label: "All" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTimeRange(t.id);
                  setShowCustomDates(false);
                }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                  timeRange === t.id && !showCustomDates
                    ? "bg-[#008dd2] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {t.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setShowCustomDates(!showCustomDates)}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                showCustomDates || timeRange === "custom"
                  ? "bg-[#008dd2] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <HiOutlineCalendar size={13} />
              <span>Custom</span>
            </button>
          </div>

          {/* PAYMENT FILTER */}
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            className="h-8.5 rounded-xl border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-700 shadow-xs outline-none focus:border-[#008dd2]"
          >
            <option value="ALL">All Payments</option>
            <option value="PREPAID">Prepaid Only</option>
            <option value="COD">COD Only</option>
          </select>

          {/* REFRESH */}
          <button
            type="button"
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            title="Refresh Data"
            className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-50 active:scale-95 disabled:opacity-50"
          >
            <HiOutlineRefresh
              size={15}
              className={refreshing ? "animate-spin text-[#008dd2]" : ""}
            />
          </button>

          {/* EXPORT GST TAX REPORT */}
          <button
            type="button"
            onClick={handleExportGst}
            disabled={exportingGst}
            className="flex h-8.5 items-center gap-1.5 rounded-xl bg-slate-900 px-3 text-[11px] font-bold text-white shadow-xs transition hover:bg-slate-800 active:scale-95 disabled:opacity-50"
          >
            <HiOutlineDownload size={14} />
            <span>{exportingGst ? "Exporting..." : "GST Statement"}</span>
          </button>
        </div>
      </div>

      {/* CUSTOM DATE PICKER ROW (CONDITIONAL) */}
      {showCustomDates && (
        <div className="mb-4 flex flex-wrap items-center gap-2.5 rounded-xl border border-sky-100 bg-sky-50/70 p-3">
          <span className="text-[12px] font-bold text-slate-700">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 outline-none"
          />
          <span className="text-[12px] font-bold text-slate-700">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 outline-none"
          />
          <button
            type="button"
            onClick={() => {
              setTimeRange("custom");
              fetchAnalytics();
            }}
            className="rounded-lg bg-[#008dd2] px-3 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-[#0073ab]"
          >
            Apply Range
          </button>
        </div>
      )}

      {/* ==================================================
          2. EXECUTIVE KPI CARDS (6 METRICS)
      ================================================== */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {/* TOTAL ORDERS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Orders
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-[#008dd2]">
              <HiOutlineTruck size={15} />
            </div>
          </div>
          <p className="mt-2 text-[20px] font-bold tracking-tight text-slate-900">
            {formatCount(kpis.totalOrders)}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
            <span className="text-emerald-600 font-bold">
              {kpis.deliveredOrders} Delivered
            </span>
            <span>•</span>
            <span className="text-amber-600 font-bold">
              {kpis.inTransitOrders} Active
            </span>
          </div>
        </div>

        {/* TOTAL FREIGHT SPENT */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Freight Spent
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <HiOutlineCash size={15} />
            </div>
          </div>
          <p className="mt-2 text-[20px] font-bold tracking-tight text-slate-900">
            {formatMoney(kpis.totalFreight)}
          </p>
          <p className="mt-1 text-[10px] font-semibold text-slate-500 truncate">
            Avg {formatMoney(kpis.avgFreightPerOrder)} / order
          </p>
        </div>

        {/* DELIVERY SUCCESS RATE */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Delivery Rate
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <HiOutlineCheckCircle size={15} />
            </div>
          </div>
          <p className="mt-2 text-[20px] font-bold tracking-tight text-emerald-600">
            {kpis.deliverySuccessRate}%
          </p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(kpis.deliverySuccessRate, 100)}%` }}
            />
          </div>
        </div>

        {/* RTO RATE */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              RTO Return Rate
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <HiOutlineExclamationCircle size={15} />
            </div>
          </div>
          <p className="mt-2 text-[20px] font-bold tracking-tight text-rose-600">
            {kpis.rtoRate}%
          </p>
          <p className="mt-1 text-[10px] font-semibold text-slate-500">
            {kpis.rtoOrders} Returns recorded
          </p>
        </div>

        {/* COD ORDERS & VALUE */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              COD Value
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <HiOutlineCash size={15} />
            </div>
          </div>
          <p className="mt-2 text-[20px] font-bold tracking-tight text-violet-700 truncate">
            {formatMoney(kpis.codTotalValue)}
          </p>
          <p className="mt-1 text-[10px] font-semibold text-slate-500">
            {kpis.codOrders} COD / {kpis.prepaidOrders} Prepaid
          </p>
        </div>

        {/* LIVE IN-TRANSIT PIPELINE */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              In-Transit Hubs
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <HiOutlineClock size={15} />
            </div>
          </div>
          <p className="mt-2 text-[20px] font-bold tracking-tight text-indigo-600">
            {kpis.inTransitOrders}
          </p>
          <p className="mt-1 text-[10px] font-semibold text-slate-500">
            {kpis.pendingOrders} NDR / Pending
          </p>
        </div>
      </div>

      {/* ==================================================
          3. MAIN SECTION: INDIA SALES HEATMAP + TOP STATES
      ================================================== */}
      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        {/* LEFT: INTERACTIVE INDIA HEATMAP */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">
                  India Sales Heatmap
                </h2>
                <span className="rounded-md bg-sky-50 text-[#008dd2] border border-sky-200 px-2 py-0.5 text-[10px] font-bold">
                  {stateBreakdown.length} Active States
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500 font-medium">
                Geographical density of buyer orders across Indian states. Hover or click on any state bubble to view delivery rates & freight.
              </p>
            </div>

            {selectedState && (
              <button
                type="button"
                onClick={() => setSelectedState(null)}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-700 underline"
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* REAL LEAFLET GEO MAP */}
          <div className="py-2">
            <IndiaMap
              stateData={stateBreakdown}
              selectedState={selectedState}
              onSelectState={(name) => setSelectedState(name)}
            />
          </div>

          {/* BOTTOM NOTICE */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center text-[11px] font-medium text-slate-500">
            💡 Bubble size and vibrant blue shades indicate order volume. Click any state bubble or quick pill to filter the dashboard.
          </div>
        </div>

        {/* RIGHT: STATE-WISE LEADERBOARD */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">
                Top Delivery States
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500 font-medium">
                Order share & delivery success per state
              </p>
            </div>

            {/* QUICK STATE SEARCH */}
            <div className="relative w-36 sm:w-44">
              <HiOutlineSearch
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={stateSearch}
                onChange={(e) => setStateSearch(e.target.value)}
                placeholder="Search state..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2.5 text-[11px] font-medium text-slate-700 outline-none focus:border-[#008dd2] focus:bg-white"
              />
            </div>
          </div>

          {/* STATES LIST */}
          <div className="flex-1 overflow-y-auto max-h-[460px] pr-1 space-y-2.5 orders-scrollbar">
            {filteredStates.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-center text-slate-400">
                <HiOutlineLocationMarker size={28} className="mb-2 text-slate-300" />
                <p className="text-[13px] font-bold text-slate-600">
                  No state shipment data
                </p>
                <p className="text-[11px]">
                  State metrics will populate as orders are manifested.
                </p>
              </div>
            ) : (
              filteredStates.map((st, idx) => {
                const isSelected =
                  selectedState &&
                  selectedState.toLowerCase() === st.state.toLowerCase();

                return (
                  <div
                    key={st.state}
                    onClick={() =>
                      setSelectedState(
                        selectedState === st.state ? null : st.state
                      )
                    }
                    className={`cursor-pointer rounded-xl border p-3 transition-all ${
                      isSelected
                        ? "border-[#008dd2] bg-sky-50/60 shadow-xs"
                        : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                            idx === 0
                              ? "bg-amber-100 text-amber-800 font-extrabold"
                              : idx === 1
                              ? "bg-slate-200 text-slate-700"
                              : idx === 2
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-[13px] text-slate-900">
                          {st.state}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold text-slate-900">
                          {st.orders} orders
                        </span>
                        <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-[#008dd2]">
                          {st.share}%
                        </span>
                      </div>
                    </div>

                    {/* PROGRESS BAR */}
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#008dd2]"
                        style={{ width: `${Math.min(st.share * 2.5, 100)}%` }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-medium text-emerald-600">
                        ✓ {st.delivered} delivered ({st.successRate}%)
                      </span>
                      <span className="font-semibold text-slate-700">
                        {formatMoney(st.freight)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ==================================================
          4. ORDERS & FREIGHT TREND TIMELINE (SVG BAR CHART)
      ================================================== */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">
                Shipment Trajectory & Spend
              </h2>
              <span className="flex items-center gap-1 text-[11px] font-bold text-[#008dd2]">
                <HiOutlineTrendingUp size={14} />
                Timeline
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500 font-medium">
              Daily order volume compared with freight spend over the selected
              period.
            </p>
          </div>
        </div>

        {trend.length === 0 ? (
          <div className="flex h-44 items-center justify-center text-slate-400 text-[12px]">
            No trend points available for this date filter.
          </div>
        ) : (
          <div className="w-full overflow-x-auto pb-2 [scrollbar-width:thin]">
            <div className="min-w-[600px] flex items-end gap-2.5 h-48 pt-6 px-2 border-b border-slate-100">
              {trend.map((t) => {
                const count = Number(t.orders_count || 0);
                const heightPct = Math.max(
                  (count / maxTrendOrders) * 100,
                  6
                );

                return (
                  <div
                    key={t.date_key}
                    className="group relative flex-1 flex flex-col items-center h-full justify-end"
                  >
                    {/* HOVER TOOLTIP */}
                    <div className="pointer-events-none absolute -top-12 z-20 hidden group-hover:flex flex-col items-center rounded-lg bg-slate-900 text-white px-2 py-1 text-[10px] whitespace-nowrap shadow-lg">
                      <span className="font-bold">{t.date_label}</span>
                      <span>
                        {count} Orders • {formatMoney(t.freight)}
                      </span>
                    </div>

                    {/* BAR */}
                    <div
                      className="w-full max-w-[28px] rounded-t-md bg-[#008dd2]/80 group-hover:bg-[#008dd2] transition-all cursor-pointer"
                      style={{ height: `${heightPct}%` }}
                    />

                    {/* X-AXIS LABEL */}
                    <span className="mt-2 text-[10px] font-medium text-slate-500 whitespace-nowrap rotate-0 truncate max-w-[40px]">
                      {t.date_label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ==================================================
          5. LOWER BREAKDOWN ROW: ZONES, SERVICES & CITIES
      ================================================== */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* ZONE DISTRIBUTION */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
            Zone Distribution
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500 font-medium">
            Delivery zone categories
          </p>

          <div className="mt-4 space-y-3">
            {zones.length === 0 ? (
              <p className="text-[12px] text-slate-400">No zone data yet</p>
            ) : (
              zones.map((z) => (
                <div key={z.zone_name} className="space-y-1">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-bold text-slate-800">
                      {z.zone_name}
                    </span>
                    <span className="font-semibold text-slate-600">
                      {z.count} orders ({formatMoney(z.freight)})
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-sky-500"
                      style={{
                        width: `${Math.min(
                          (z.count / (kpis.totalOrders || 1)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SERVICE MODE (SURFACE VS AIR) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
            Shipping Mode
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500 font-medium">
            Air Express vs Surface Road
          </p>

          <div className="mt-4 space-y-3">
            {services.length === 0 ? (
              <p className="text-[12px] text-slate-400">No service data yet</p>
            ) : (
              services.map((s) => (
                <div key={s.service_name} className="space-y-1">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-bold text-slate-800">
                      {s.service_name}
                    </span>
                    <span className="font-semibold text-slate-600">
                      {s.count} orders
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        s.service_name.includes("Air")
                          ? "bg-indigo-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          (s.count / (kpis.totalOrders || 1)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* TOP CITIES */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
            Top Destination Cities
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500 font-medium">
            Cities with highest shipments
          </p>

          <div className="mt-3 divide-y divide-slate-100 text-[12px]">
            {cities.length === 0 ? (
              <p className="pt-2 text-slate-400">No city data available</p>
            ) : (
              cities.map((c, i) => (
                <div
                  key={c.city_name}
                  className="flex items-center justify-between py-1.5"
                >
                  <span className="font-medium text-slate-800">
                    <span className="text-slate-400 mr-1.5 font-bold">
                      {i + 1}.
                    </span>
                    {c.city_name}
                  </span>
                  <span className="font-bold text-slate-900">
                    {c.orders_count} orders
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
