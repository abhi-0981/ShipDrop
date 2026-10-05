import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

const CODRemittance = () => {
  const [remittances, setRemittances] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ========================================
  // GET USER ID
  // ========================================

  const getUserId = () => {
    try {
      const user = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      return user?.id || user?.user_id || null;
    } catch {
      return null;
    }
  };

  // ========================================
  // FETCH REMITTANCES
  // ========================================

  const fetchRemittances = async (
    isRefresh = false
  ) => {
    const userId = getUserId();

    if (!userId) {
      setError("User session not found. Please login again.");
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

      const response = await api.get(
        `/payments/cod-remittance?user_id=${userId}`
      );

      const records = Array.isArray(
        response?.data?.remittances
      )
        ? response.data.remittances
        : [];

      setRemittances(records);
    } catch (err) {
      console.error(
        "COD Remittance Error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to load COD remittance records."
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
    fetchRemittances();
  }, []);

  // ========================================
  // FILTER
  // ========================================

  const filteredRemittances = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return remittances.filter((item) => {
      const orderId = String(
        item.order_id || ""
      ).toLowerCase();

      const buyer = String(
        item.buyer || ""
      ).toLowerCase();

      const awb = String(
        item.awb || ""
      ).toLowerCase();

      const status = String(
        item.status || ""
      ).toUpperCase();

      const matchesSearch =
        !query ||
        orderId.includes(query) ||
        buyer.includes(query) ||
        awb.includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    remittances,
    search,
    statusFilter,
  ]);

  // ========================================
  // FORMAT AMOUNT
  // ========================================

  const formatAmount = (amount) => {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // ========================================
  // FORMAT DATE
  // ========================================

  const formatDate = (date) => {
    if (!date) return "—";

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return "—";
    }

    return value.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ========================================
  // STATUS
  // ========================================

  const renderStatus = (status) => {
    const normalized = String(
      status || "PENDING"
    ).toUpperCase();

    if (normalized === "SUCCESSFUL") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Successful
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-600">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Pending
      </span>
    );
  };

  // ========================================
  // CLEAR FILTERS
  // ========================================

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
  };

  const hasFilters =
    search.trim() ||
    statusFilter !== "ALL";

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-[#f7f9fc] px-3 py-4 sm:px-4 lg:px-5">

      {/* =====================================================
          PAGE TOP
      ===================================================== */}

      <div className="mb-4 flex items-center justify-between">

        <div className="flex min-w-0 items-center gap-3">

          {/* ICON */}

          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#008dd2] shadow-sm ring-1 ring-slate-200">

            <div className="absolute inset-0 rounded-xl bg-[#008dd2]/5" />

            <svg
              className="relative"
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

          {/* TITLE */}

          <div className="min-w-0">

            <div className="flex items-center gap-2">

              <h1 className="truncate text-[16px] font-bold text-slate-800">
                COD Remittance
              </h1>

              <span className="hidden rounded-md bg-[#008dd2]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#008dd2] sm:inline-flex">
                COD
              </span>

            </div>

            <p className="mt-0.5 truncate text-[11px] text-slate-400">
              Delivered COD orders and payment remittance
            </p>

          </div>

        </div>

        {/* REFRESH */}

        <button
          type="button"
          onClick={() =>
            fetchRemittances(true)
          }
          disabled={refreshing}
          className="group flex h-9 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 shadow-sm transition-all hover:border-[#008dd2]/30 hover:text-[#008dd2] disabled:opacity-60"
        >

          <svg
            className={
              refreshing
                ? "animate-spin"
                : "transition-transform group-hover:rotate-180"
            }
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 11a8.1 8.1 0 0 0-14.8-4.4L4 8" />
            <path d="M4 4v4h4" />
            <path d="M4 13a8.1 8.1 0 0 0 14.8 4.4L20 16" />
            <path d="M20 20v-4h-4" />
          </svg>

          <span className="hidden sm:inline">
            {refreshing
              ? "Refreshing"
              : "Refresh"}
          </span>

        </button>

      </div>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div className="border-b border-slate-100 px-3 py-3 sm:px-4">

          <div className="flex flex-col gap-2.5 md:flex-row md:items-center">

            {/* SEARCH */}

            <div className="relative min-w-0 flex-1">

              <svg
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                />
                <path d="m20 20-3.5-3.5" />
              </svg>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search Order ID, Buyer or AWB..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-[11px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
              />

            </div>


            {/* STATUS */}

            <div className="relative">

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
                className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-[11px] font-medium text-slate-600 outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10 md:w-[130px]"
              >

                <option value="ALL">
                  All Status
                </option>

                <option value="PENDING">
                  Pending
                </option>

                <option value="SUCCESSFUL">
                  Successful
                </option>

              </select>

              <svg
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>

            </div>


            {/* CLEAR */}

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-9 rounded-lg px-3 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
              >
                Clear
              </button>
            )}

          </div>

        </div>


        {/* =================================================
            SMALL TABLE META
        ================================================= */}

        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">

          <div className="flex items-center gap-2">

            <span className="text-[11px] font-semibold text-slate-700">
              Remittance History
            </span>

            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
              {filteredRemittances.length}
            </span>

          </div>

          {hasFilters && (
            <span className="text-[10px] text-slate-400">
              Filtered results
            </span>
          )}

        </div>


        {/* =================================================
            DESKTOP TABLE
        ================================================= */}

        <div className="hidden w-full md:block">

          <table className="w-full table-fixed">

            <colgroup>
              <col className="w-[11%]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
              <col className="w-[15%]" />
              <col className="w-[10%]" />
            </colgroup>

            <thead>

              <tr className="bg-[#fafbfc]">

                <th className="border-b border-slate-100 px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Order ID
                </th>

                <th className="border-b border-slate-100 px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Buyer
                </th>

                <th className="border-b border-slate-100 px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  AWB No
                </th>

                <th className="border-b border-slate-100 px-3 py-2.5 text-right text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  COD Amount
                </th>

                <th className="border-b border-slate-100 px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Created On
                </th>

                <th className="border-b border-slate-100 px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Status
                </th>

                <th className="border-b border-slate-100 px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Transferred On
                </th>

                <th className="border-b border-slate-100 px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Description
                </th>

              </tr>

            </thead>


            <tbody>

              {/* LOADING */}

              {loading ? (

                <tr>

                  <td
                    colSpan="8"
                    className="py-16 text-center"
                  >

                    <div className="inline-flex items-center gap-2 text-[11px] text-slate-400">

                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-[#008dd2]" />

                      Loading remittance...

                    </div>

                  </td>

                </tr>

              ) : error ? (

                /* ERROR */

                <tr>

                  <td
                    colSpan="8"
                    className="py-16 text-center"
                  >

                    <div className="mx-auto max-w-sm">

                      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500">

                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="9"
                          />
                          <path d="M12 8v5" />
                          <path d="M12 16h.01" />
                        </svg>

                      </div>

                      <p className="mt-2 text-[11px] font-semibold text-slate-700">
                        Unable to load remittance
                      </p>

                      <p className="mt-1 text-[10px] text-slate-400">
                        {error}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          fetchRemittances()
                        }
                        className="mt-3 rounded-lg bg-[#008dd2] px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-[#007dbb]"
                      >
                        Try Again
                      </button>

                    </div>

                  </td>

                </tr>

              ) : filteredRemittances.length === 0 ? (

                /* EMPTY */

                <tr>

                  <td
                    colSpan="8"
                    className="py-16 text-center"
                  >

                    <div className="mx-auto flex max-w-xs flex-col items-center">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">

                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        >
                          <path d="M6 2h9l3 3v17H6z" />
                          <path d="M15 2v4h4" />
                          <path d="M9 12h6" />
                          <path d="M9 16h6" />
                        </svg>

                      </div>

                      <p className="mt-3 text-[11px] font-semibold text-slate-700">
                        {hasFilters
                          ? "No matching records"
                          : "No COD remittance records"}
                      </p>

                      <p className="mt-1 text-[10px] leading-4 text-slate-400">
                        {hasFilters
                          ? "Try changing your search or status filter."
                          : "Delivered COD orders will appear here."}
                      </p>

                      {hasFilters && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="mt-3 text-[10px] font-semibold text-[#008dd2] hover:underline"
                        >
                          Clear filters
                        </button>
                      )}

                    </div>

                  </td>

                </tr>

              ) : (

                /* DATA */

                filteredRemittances.map(
                  (item, index) => (
                    <tr
                      key={
                        item.id ||
                        item.order_id ||
                        index
                      }
                      className="group transition-colors hover:bg-[#f8fbfd]"
                    >

                      {/* ORDER ID */}

                      <td className="border-b border-slate-50 px-3 py-3">

                        <span className="block truncate text-[11px] font-bold text-slate-800">
                          #{item.order_id || "—"}
                        </span>

                      </td>


                      {/* BUYER */}

                      <td className="border-b border-slate-50 px-3 py-3">

                        <span
                          title={
                            item.buyer || ""
                          }
                          className="block truncate text-[11px] font-medium text-slate-700"
                        >
                          {item.buyer || "—"}
                        </span>

                      </td>


                      {/* AWB */}

                      <td className="border-b border-slate-50 px-3 py-3">

                        <span
                          title={
                            item.awb || ""
                          }
                          className="block truncate text-[10px] text-slate-500"
                        >
                          {item.awb || "—"}
                        </span>

                      </td>


                      {/* AMOUNT */}

                      <td className="border-b border-slate-50 px-3 py-3 text-right">

                        <span className="text-[11px] font-bold text-slate-800">
                          {formatAmount(
                            item.cod_amount
                          )}
                        </span>

                      </td>


                      {/* CREATED */}

                      <td className="border-b border-slate-50 px-3 py-3">

                        <span className="block truncate text-[10px] text-slate-500">
                          {formatDate(
                            item.created_at
                          )}
                        </span>

                      </td>


                      {/* STATUS */}

                      <td className="border-b border-slate-50 px-3 py-3">

                        {renderStatus(
                          item.status
                        )}

                      </td>


                      {/* TRANSFERRED */}

                      <td className="border-b border-slate-50 px-3 py-3">

                        <span className="block truncate text-[10px] text-slate-500">
                          {formatDate(
                            item.transferred_on
                          )}
                        </span>

                      </td>


                      {/* DESCRIPTION */}

                      <td className="border-b border-slate-50 px-3 py-3">

                        <span
                          title={
                            item.description ||
                            ""
                          }
                          className="block truncate text-[10px] text-slate-400"
                        >
                          {item.description ||
                            "—"}
                        </span>

                      </td>

                    </tr>
                  )
                )

              )}

            </tbody>

          </table>

        </div>


        {/* =================================================
            MOBILE
        ================================================= */}

        <div className="md:hidden">

          {loading ? (

            <div className="flex justify-center py-14">

              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#008dd2]" />

            </div>

          ) : error ? (

            <div className="px-5 py-12 text-center">

              <p className="text-[11px] font-semibold text-red-500">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  fetchRemittances()
                }
                className="mt-3 rounded-lg bg-[#008dd2] px-3 py-1.5 text-[10px] font-semibold text-white"
              >
                Try Again
              </button>

            </div>

          ) : filteredRemittances.length === 0 ? (

            <div className="px-5 py-14 text-center">

              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path d="M6 2h9l3 3v17H6z" />
                  <path d="M15 2v4h4" />
                  <path d="M9 12h6" />
                  <path d="M9 16h6" />
                </svg>
              </div>

              <p className="mt-3 text-[11px] font-semibold text-slate-700">
                {hasFilters
                  ? "No matching records"
                  : "No COD remittance records"}
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                {hasFilters
                  ? "Try changing your filters."
                  : "Delivered COD orders will appear here."}
              </p>

            </div>

          ) : (

            <div className="divide-y divide-slate-100">

              {filteredRemittances.map(
                (item, index) => {

                  const status =
                    String(
                      item.status ||
                        "PENDING"
                    ).toUpperCase();

                  return (
                    <div
                      key={
                        item.id ||
                        item.order_id ||
                        index
                      }
                      className="p-4"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <p className="truncate text-[12px] font-bold text-slate-800">
                            #{item.order_id || "—"}
                          </p>

                          <p className="mt-0.5 truncate text-[10px] text-slate-500">
                            {item.buyer || "—"}
                          </p>

                        </div>

                        {renderStatus(
                          status
                        )}

                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3">

                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                            AWB No
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
                            {formatAmount(
                              item.cod_amount
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                            Created On
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            {formatDate(
                              item.created_at
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                            Transferred On
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            {formatDate(
                              item.transferred_on
                            )}
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
                }
              )}

            </div>

          )}

        </div>


        {/* =================================================
            FOOTER
        ================================================= */}

        {!loading &&
          !error &&
          filteredRemittances.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-[#fafbfc] px-4 py-2.5">

              <span className="text-[10px] text-slate-400">
                Showing{" "}
                <b className="text-slate-600">
                  {filteredRemittances.length}
                </b>{" "}
                of{" "}
                <b className="text-slate-600">
                  {remittances.length}
                </b>
              </span>

              <span className="hidden text-[10px] text-slate-400 sm:block">
                COD Remittance
              </span>

            </div>
          )}

      </div>

    </div>
  );
};

export default CODRemittance;