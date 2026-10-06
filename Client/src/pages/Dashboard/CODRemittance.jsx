import { useEffect, useMemo, useState } from "react";

import api from "../../services/api";

const CODRemittance = () => {
  const [remittances, setRemittances] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  // ========================================

  // LOAD USER

  // ========================================

  const getUserId = () => {
    try {
      const savedUser = JSON.parse(localStorage.getItem("user"));

      return savedUser?.id || null;
    } catch (error) {
      console.error("User parse error:", error);

      return null;
    }
  };

  // ========================================

  // FETCH COD REMITTANCE

  // ========================================

  const fetchCODRemittances = async (showRefreshLoader = false) => {
    const userId = getUserId();

    if (!userId) {
      setError("User not found. Please login again.");

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

      const response = await api.get(
        `/payments/cod-remittance?user_id=${userId}`,
      );

      const data = Array.isArray(response.data?.remittances)
        ? response.data.remittances
        : [];

      setRemittances(data);
    } catch (error) {
      console.error(
        "COD remittance error:",

        error,
      );

      setError(
        error.response?.data?.message || "Unable to load COD remittance",
      );

      setRemittances([]);
    } finally {
      setLoading(false);

      setRefreshing(false);
    }
  };

  // ========================================

  // INITIAL LOAD

  // ========================================

  useEffect(() => {
    fetchCODRemittances();
  }, []);

  // ========================================

  // FILTERED DATA

  // ========================================

  const filteredRemittances = useMemo(() => {
    const query = search

      .trim()

      .toLowerCase();

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

  // ========================================

  // SUMMARY

  // ========================================

  const totalRecords = remittances.length;

  const pendingCount = remittances.filter(
    (item) => String(item.status || "").toUpperCase() === "PENDING",
  ).length;

  const successfulCount = remittances.filter(
    (item) => String(item.status || "").toUpperCase() === "SUCCESSFUL",
  ).length;

  // ========================================

  // FORMAT AMOUNT

  // ========================================

  const formatAmount = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,

      maximumFractionDigits: 2,
    })}`;
  };

  // ========================================

  // FORMAT DATE

  // ========================================

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleString(
      "en-IN",

      {
        day: "2-digit",

        month: "short",

        year: "numeric",

        hour: "2-digit",

        minute: "2-digit",

        hour12: true,
      },
    );
  };

  // ========================================

  // STATUS

  // ========================================

  const getStatus = (status) => {
    return String(status || "PENDING").toUpperCase();
  };

  // ========================================

  // CLEAR FILTERS

  // ========================================

  const clearFilters = () => {
    setSearch("");

    setStatusFilter("ALL");
  };

  const hasFilters = search.trim() !== "" || statusFilter !== "ALL";

  return (
    <div className="min-h-full w-full max-w-full overflow-x-hidden bg-[#f6f8fb] px-3 py-4 sm:px-4 lg:px-5">
      {/* =====================================================

          PAGE HEADER

      ===================================================== */}

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#008dd2]/10 text-[#008dd2]">
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M12 2v20" />

              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-[17px] font-bold tracking-tight text-slate-900">
              COD Remittance
            </h1>

            <p className="mt-0.5 truncate text-[11px] text-slate-400">
              Track delivered COD orders and remittance status
            </p>
          </div>
        </div>

        {/* REFRESH */}

        <button
          type="button"
          onClick={() => fetchCODRemittances(true)}
          disabled={refreshing}
          title="Refresh"
          className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:border-[#008dd2]/30 hover:bg-[#008dd2]/5 hover:text-[#008dd2] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg
            className={refreshing ? "animate-spin" : ""}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 11a8.1 8.1 0 0 0-14.9-4" />

            <path d="M4 4v5h5" />

            <path d="M4 13a8.1 8.1 0 0 0 14.9 4" />

            <path d="M20 20v-5h-5" />
          </svg>

          <span className="hidden sm:inline">
            {refreshing ? "Refreshing..." : "Refresh"}
          </span>
        </button>
      </div>

      {/* =====================================================

          SUMMARY CARDS

      ===================================================== */}

      <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
        {/* TOTAL */}

        <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-3 shadow-sm sm:px-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Total Orders
              </p>

              <p className="mt-1 text-lg font-bold text-slate-800">
                {totalRecords}
              </p>
            </div>

            <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 sm:flex">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <rect x="4" y="4" width="16" height="16" rx="2" />

                <path d="M8 9h8" />

                <path d="M8 13h6" />

                <path d="M8 17h4" />
              </svg>
            </div>
          </div>
        </div>

        {/* PENDING */}

        <div className="rounded-xl border border-amber-100 bg-white px-3 py-3 shadow-sm sm:px-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-amber-500">
                Pending
              </p>

              <p className="mt-1 text-lg font-bold text-slate-800">
                {pendingCount}
              </p>
            </div>

            <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500 sm:flex">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="12" cy="12" r="9" />

                <path d="M12 7v5l3 2" />
              </svg>
            </div>
          </div>
        </div>

        {/* SUCCESSFUL */}

        <div className="rounded-xl border border-emerald-100 bg-white px-3 py-3 shadow-sm sm:px-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-emerald-500">
                Successful
              </p>

              <p className="mt-1 text-lg font-bold text-slate-800">
                {successfulCount}
              </p>
            </div>

            <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500 sm:flex">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="12" cy="12" r="9" />

                <path d="m8 12 2.5 2.5L16 9" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================

          FILTER BAR

      ===================================================== */}

      <div className="mb-3 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* SEARCH */}

          <div className="relative min-w-0 flex-1">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />

                <path d="m20 20-3.5-3.5" />
              </svg>
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Order ID, Buyer or AWB..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-[11px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
            />
          </div>

          {/* STATUS */}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-[11px] font-medium text-slate-600 outline-none transition focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10 sm:w-[135px]"
          >
            <option value="ALL">All Status</option>

            <option value="PENDING">Pending</option>

            <option value="SUCCESSFUL">Successful</option>
          </select>

          {/* CLEAR */}

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-9 rounded-lg px-3 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* =====================================================

          TABLE

      ===================================================== */}

      <div className="w-full max-w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        {/* TABLE HEADER */}

        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="text-[13px] font-bold text-slate-800">
              Remittance History
            </h2>

            <p className="mt-0.5 text-[10px] text-slate-400">
              {filteredRemittances.length}{" "}
              {filteredRemittances.length === 1 ? "record" : "records"} found
            </p>
          </div>

          <div className="rounded-md bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-500">
            COD
          </div>
        </div>

        {/* DESKTOP TABLE */}

        <div className="hidden w-full md:block">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[12%]" />

              <col className="w-[14%]" />

              <col className="w-[13%]" />

              <col className="w-[12%]" />

              <col className="w-[15%]" />

              <col className="w-[11%]" />

              <col className="w-[15%]" />

              <col className="w-[8%]" />
            </colgroup>

            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Order ID
                </th>

                <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Buyer
                </th>

                <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  AWB No
                </th>

                <th className="px-3 py-2.5 text-right text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  COD Amount
                </th>

                <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Delivered On
                </th>

                <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Status
                </th>

                <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Transferred On
                </th>

                <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Description
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center">
                      <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#008dd2]" />

                      <p className="mt-3 text-[11px] font-medium text-slate-500">
                        Loading remittance...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="8" className="px-5 py-14 text-center">
                    <div className="mx-auto max-w-sm">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="9" />

                          <path d="M12 8v5" />

                          <path d="M12 16h.01" />
                        </svg>
                      </div>

                      <p className="mt-3 text-[12px] font-semibold text-slate-700">
                        Unable to load remittance
                      </p>

                      <p className="mt-1 text-[10px] text-slate-400">{error}</p>

                      <button
                        type="button"
                        onClick={() => fetchCODRemittances()}
                        className="mt-3 rounded-lg bg-[#008dd2] px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-[#007dbb]"
                      >
                        Try Again
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredRemittances.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-14 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        >
                          <path d="M6 2h9l3 3v17H6z" />

                          <path d="M15 2v4h4" />

                          <path d="M9 12h6" />

                          <path d="M9 16h6" />
                        </svg>
                      </div>

                      <p className="mt-3 text-[12px] font-bold text-slate-700">
                        {hasFilters
                          ? "No matching records"
                          : "No COD remittance records"}
                      </p>

                      <p className="mt-1 text-[10px] text-slate-400">
                        {hasFilters
                          ? "Try changing your search or filter."
                          : "Delivered COD orders will appear here."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRemittances.map((item, index) => {
                  const status = getStatus(item.status);

                  return (
                    <tr
                      key={item.id || item.order_id || index}
                      className="border-b border-slate-100 last:border-b-0 transition hover:bg-slate-50/60"
                    >
                      {/* ORDER */}

                      <td className="px-3 py-3">
                        <span className="block truncate text-[11px] font-bold text-slate-800">
                          #{item.order_id || "—"}
                        </span>
                      </td>

                      {/* BUYER */}

                      <td className="px-3 py-3">
                        <span className="block truncate text-[11px] font-medium text-slate-700">
                          {item.buyer || "—"}
                        </span>
                      </td>

                      {/* AWB */}

                      <td className="px-3 py-3">
                        <span className="block truncate text-[10px] font-medium text-slate-500">
                          {item.awb || "—"}
                        </span>
                      </td>

                      {/* AMOUNT */}

                      <td className="px-3 py-3 text-right">
                        <span className="text-[11px] font-bold text-slate-800">
                          {formatAmount(item.cod_amount)}
                        </span>
                      </td>

                      {/* CREATED */}

                      <td className="px-3 py-3">
                        <span className="block truncate text-[10px] text-slate-500">
                          {formatDate(item.tracking_updated_at)}
                        </span>
                      </td>

                      {/* STATUS */}

                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[9px] font-bold ${
                            status === "SUCCESSFUL"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              status === "SUCCESSFUL"
                                ? "bg-emerald-500"
                                : "bg-amber-500"
                            }`}
                          />

                          {status === "SUCCESSFUL" ? "Successful" : "Pending"}
                        </span>
                      </td>

                      {/* TRANSFERRED */}

                      <td className="px-3 py-3">
                        <span className="block truncate text-[10px] text-slate-500">
                          {formatDate(item.transferred_on)}
                        </span>
                      </td>

                      {/* DESCRIPTION */}

                      <td className="px-3 py-3">
                        <span
                          title={item.description || ""}
                          className="block truncate text-[10px] text-slate-500"
                        >
                          {item.description || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* =================================================

            MOBILE CARD VIEW

        ================================================= */}

        <div className="md:hidden">
          {loading ? (
            <div className="flex flex-col items-center px-5 py-14">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#008dd2]" />

              <p className="mt-3 text-[11px] text-slate-500">
                Loading remittance...
              </p>
            </div>
          ) : error ? (
            <div className="px-5 py-12 text-center">
              <p className="text-[12px] font-semibold text-red-500">{error}</p>

              <button
                type="button"
                onClick={() => fetchCODRemittances()}
                className="mt-3 rounded-lg bg-[#008dd2] px-3 py-2 text-[10px] font-semibold text-white"
              >
                Try Again
              </button>
            </div>
          ) : filteredRemittances.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path d="M6 2h9l3 3v17H6z" />

                  <path d="M15 2v4h4" />

                  <path d="M9 12h6" />

                  <path d="M9 16h6" />
                </svg>
              </div>

              <p className="mt-3 text-[12px] font-bold text-slate-700">
                {hasFilters
                  ? "No matching records"
                  : "No COD remittance records"}
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                {hasFilters
                  ? "Try changing your search or filter."
                  : "Delivered COD orders will appear here."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredRemittances.map((item, index) => {
                const status = getStatus(item.status);

                return (
                  <div key={item.id || item.order_id || index} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-bold text-slate-800">
                          #{item.order_id || "—"}
                        </p>

                        <p className="mt-0.5 truncate text-[10px] text-slate-500">
                          {item.buyer || "—"}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-md px-2 py-1 text-[9px] font-bold ${
                          status === "SUCCESSFUL"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {status === "SUCCESSFUL" ? "Successful" : "Pending"}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                          AWB
                        </p>

                        <p className="mt-0.5 truncate text-[10px] font-medium text-slate-600">
                          {item.awb || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                          COD Amount
                        </p>

                        <p className="mt-0.5 text-[11px] font-bold text-slate-800">
                          {formatAmount(item.cod_amount)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                          Delivered On
                        </p>

                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {formatDate(item.tracking_updated_at)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                          Transferred On
                        </p>

                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {formatDate(item.transferred_on)}
                        </p>
                      </div>
                    </div>

                    {item.description && (
                      <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                          Description
                        </p>

                        <p className="mt-0.5 text-[10px] text-slate-600">
                          {item.description}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* =================================================

            FOOTER

        ================================================= */}

        {!loading && !error && filteredRemittances.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-2.5">
            <p className="text-[10px] text-slate-400">
              Showing{" "}
              <span className="font-bold text-slate-700">
                {filteredRemittances.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-700">{totalRecords}</span>{" "}
              records
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CODRemittance;
