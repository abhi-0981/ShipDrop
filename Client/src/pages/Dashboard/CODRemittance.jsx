import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

const CODRemittance = () => {
  const [remittances, setRemittances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const getUserId = () => {
    try {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      return savedUser?.id || null;
    } catch (err) {
      console.error("User parse error:", err);
      return null;
    }
  };

  const fetchCODRemittances = async (showRefreshLoader = false) => {
    const userId = getUserId();
    if (!userId) {
      setError("Session expired or user not found. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      if (showRefreshLoader) {
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
      console.error("COD remittance fetch error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to fetch remittance records. Please try again."
      );
      setRemittances([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCODRemittances();
  }, []);

  // Filtered dataset
  const filteredRemittances = useMemo(() => {
    const query = search.trim().toLowerCase();
    return remittances.filter((item) => {
      const orderId = String(item.order_id || "").toLowerCase();
      const buyer = String(item.buyer || "").toLowerCase();
      const awb = String(item.awb || "").toLowerCase();
      const status = String(item.status || "").toUpperCase();

      const searchMatch =
        !query ||
        orderId.includes(query) ||
        buyer.includes(query) ||
        awb.includes(query);

      const statusMatch = statusFilter === "ALL" || status === statusFilter;
      return searchMatch && statusMatch;
    });
  }, [remittances, search, statusFilter]);

  // Analytics
  const metrics = useMemo(() => {
    let pendingCount = 0;
    let successfulCount = 0;
    let totalAmt = 0;
    let pendingAmt = 0;

    remittances.forEach((item) => {
      const amt = Number(item.cod_amount) || 0;
      const st = String(item.status || "").toUpperCase();
      totalAmt += amt;
      if (st === "SUCCESSFUL") {
        successfulCount += 1;
      } else {
        pendingCount += 1;
        pendingAmt += amt;
      }
    });

    return {
      totalRecords: remittances.length,
      pendingCount,
      successfulCount,
      totalAmt,
      pendingAmt,
    };
  }, [remittances]);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  };

  const formatDate = (date) => {
    if (!date) return "—";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "—";
    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
  };

  const hasFilters = search.trim() !== "" || statusFilter !== "ALL";

  return (
    <div className="min-h-screen w-full bg-slate-50/60 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* ================= HEADER ================= */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              COD Remittance
            </h1>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Real-time settlement status of delivered Cash-on-Delivery shipments.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => fetchCODRemittances(true)}
              disabled={refreshing || loading}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{refreshing ? "Syncing..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* ================= STATS CARDS ================= */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Orders
              </span>
              <span className="rounded-md bg-slate-100 p-1.5 text-slate-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900">{metrics.totalRecords}</p>
            <p className="mt-1 text-xs text-slate-400">
              Value: <span className="font-semibold text-slate-700">{formatAmount(metrics.totalAmt)}</span>
            </p>
          </div>

          <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                Pending Settlement
              </span>
              <span className="rounded-md bg-amber-50 p-1.5 text-amber-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900">{metrics.pendingCount}</p>
            <p className="mt-1 text-xs text-amber-600 font-medium">
              Due: {formatAmount(metrics.pendingAmt)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Settled / Successful
              </span>
              <span className="rounded-md bg-emerald-50 p-1.5 text-emerald-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900">{metrics.successfulCount}</p>
            <p className="mt-1 text-xs text-slate-400">
              Completed payout cycles
            </p>
          </div>

          <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-600">
                Clearance Rate
              </span>
              <span className="rounded-md bg-sky-50 p-1.5 text-sky-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900">
              {metrics.totalRecords > 0
                ? `${Math.round((metrics.successfulCount / metrics.totalRecords) * 100)}%`
                : "0%"}
            </p>
            <p className="mt-1 text-xs text-slate-400">Successful remittance ratio</p>
          </div>
        </div>

        {/* ================= CONTROLS & FILTERS ================= */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order ID, Buyer, or AWB number..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-8 text-xs text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending Only</option>
              <option value="SUCCESSFUL">Successful Only</option>
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-9 rounded-lg border border-transparent px-3 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* ================= DATA TABLE CONTAINER ================= */}
        <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
          {/* Table View (Desktop) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200/70 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Order Info</th>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">AWB No</th>
                  <th className="px-4 py-3 text-right">COD Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created On</th>
                  <th className="px-4 py-3">Transferred On</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-20 text-center">
                      <div className="inline-flex flex-col items-center">
                        <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
                        <span className="mt-3 text-xs font-medium text-slate-400">Loading records...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="8" className="py-16 text-center">
                      <p className="text-xs font-semibold text-rose-500">{error}</p>
                      <button
                        type="button"
                        onClick={() => fetchCODRemittances()}
                        className="mt-2.5 inline-flex items-center rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
                      >
                        Try Again
                      </button>
                    </td>
                  </tr>
                ) : filteredRemittances.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-16 text-center text-slate-400">
                      <p className="text-sm font-semibold text-slate-600">No records found</p>
                      <p className="mt-1 text-xs">
                        {hasFilters ? "Try adjusting your search criteria" : "Delivered COD orders will be listed here"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRemittances.map((item, index) => {
                    const status = String(item.status || "PENDING").toUpperCase();
                    const isSuccess = status === "SUCCESSFUL";

                    return (
                      <tr key={item.id || item.order_id || index} className="transition-colors hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                          #{item.order_id || "—"}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {item.buyer || "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500">
                          {item.awb || "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          {formatAmount(item.cod_amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              isSuccess
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                : "bg-amber-50 text-amber-700 border border-amber-200/60"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isSuccess ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                            />
                            {isSuccess ? "Successful" : "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatDate(item.created_at)}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatDate(item.transferred_on)}
                        </td>
                        <td className="px-4 py-3 max-w-[180px] truncate text-slate-400" title={item.description || ""}>
                          {item.description || "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Card View (Mobile) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="py-16 text-center">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
                <p className="mt-3 text-xs text-slate-400">Loading records...</p>
              </div>
            ) : filteredRemittances.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No remittance records found.
              </div>
            ) : (
              filteredRemittances.map((item, idx) => {
                const status = String(item.status || "PENDING").toUpperCase();
                const isSuccess = status === "SUCCESSFUL";

                return (
                  <div key={item.id || item.order_id || idx} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-slate-900">
                          #{item.order_id || "—"}
                        </span>
                        <p className="text-xs text-slate-500 mt-0.5">{item.buyer || "—"}</p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          isSuccess
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${isSuccess ? "bg-emerald-500" : "bg-amber-500"}`} />
                        {isSuccess ? "Successful" : "Pending"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2.5">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400">AWB</span>
                        <p className="font-mono text-slate-700">{item.awb || "—"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400">Amount</span>
                        <p className="font-semibold text-slate-900">{formatAmount(item.cod_amount)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400">Created</span>
                        <p className="text-slate-600">{formatDate(item.created_at)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400">Transferred</span>
                        <p className="text-slate-600">{formatDate(item.transferred_on)}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Table Footer */}
          {!loading && !error && filteredRemittances.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200/70 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
              <span>
                Showing <strong className="font-semibold text-slate-800">{filteredRemittances.length}</strong> of{" "}
                <strong className="font-semibold text-slate-800">{remittances.length}</strong> entries
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CODRemittance;