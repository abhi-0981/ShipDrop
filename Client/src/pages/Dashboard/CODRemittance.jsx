import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api";
const CODRemittance = () => {
  const [remittances, setRemittances] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const userId = user?.id || user?.user_id;

  // ========================================
  // FETCH COD REMITTANCE
  // ========================================

  const fetchRemittances = useCallback(
    async (isRefresh = false) => {
      if (!userId) {
        setError("User ID not found. Please login again.");
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

        setRemittances(
          Array.isArray(response?.data?.remittances)
            ? response.data.remittances
            : []
        );
      } catch (err) {
        console.error("COD remittance fetch error:", err);

        setError(
          err?.response?.data?.message ||
            "Unable to load COD remittance records."
        );

        setRemittances([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId]
  );

  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {
    fetchRemittances();
  }, [fetchRemittances]);

  // ========================================
  // FILTER DATA
  // ========================================

  const filteredRemittances = useMemo(() => {
    const query = search.trim().toLowerCase();

    return remittances.filter((item) => {
      const searchMatch =
        !query ||
        String(item.order_id || "")
          .toLowerCase()
          .includes(query) ||
        String(item.buyer || "")
          .toLowerCase()
          .includes(query) ||
        String(item.awb || "")
          .toLowerCase()
          .includes(query);

      const status = String(item.status || "").toUpperCase();

      const statusMatch =
        statusFilter === "ALL" || status === statusFilter;

      return searchMatch && statusMatch;
    });
  }, [remittances, search, statusFilter]);

  // ========================================
  // COUNTS
  // ========================================

  const pendingCount = useMemo(
    () =>
      remittances.filter(
        (item) =>
          String(item.status || "").toUpperCase() === "PENDING"
      ).length,
    [remittances]
  );

  const successfulCount = useMemo(
    () =>
      remittances.filter(
        (item) =>
          String(item.status || "").toUpperCase() === "SUCCESSFUL"
      ).length,
    [remittances]
  );

  const totalCODAmount = useMemo(
    () =>
      remittances.reduce(
        (total, item) =>
          total + (Number(item.cod_amount) || 0),
        0
      ),
    [remittances]
  );

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

    return parsedDate.toLocaleString("en-IN", {
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

  const getStatusStyle = (status) => {
    const normalizedStatus = String(status || "").toUpperCase();

    if (normalizedStatus === "SUCCESSFUL") {
      return {
        wrapper: "bg-emerald-50 text-emerald-700 border-emerald-100",
        dot: "bg-emerald-500",
        label: "Successful",
      };
    }

    return {
      wrapper: "bg-amber-50 text-amber-700 border-amber-100",
      dot: "bg-amber-500",
      label: "Pending",
    };
  };

  // ========================================
  // CLEAR FILTERS
  // ========================================

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
  };

  const hasFilters =
    search.trim() !== "" || statusFilter !== "ALL";

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="min-h-full w-full overflow-x-hidden bg-[#f6f8fb] p-3.5 pb-20 sm:p-5 md:p-6 lg:pb-8">

      {/* ========================================
          HEADER
      ======================================== */}

      <div className="mb-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#008dd2]/10 text-[#008dd2]">
              <svg
                width="21"
                height="21"
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
              <h1 className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                COD Remittance
              </h1>

              <p className="mt-0.5 text-xs text-slate-400">
                Track your delivered COD orders and remittance status
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchRemittances(true)}
            disabled={loading || refreshing}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-[#008dd2]/30 hover:bg-[#008dd2]/5 hover:text-[#008dd2] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              className={refreshing ? "animate-spin" : ""}
              width="15"
              height="15"
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

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* ========================================
          SUMMARY CARDS
      ======================================== */}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Total Orders
          </p>

          <p className="mt-1.5 text-xl font-bold text-slate-900">
            {remittances.length}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Pending
          </p>

          <p className="mt-1.5 text-xl font-bold text-amber-600">
            {pendingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Successful
          </p>

          <p className="mt-1.5 text-xl font-bold text-emerald-600">
            {successfulCount}
          </p>
        </div>

        <div className="rounded-2xl border border-[#008dd2]/10 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            COD Amount
          </p>

          <p className="mt-1.5 truncate text-xl font-bold text-[#008dd2]">
            {formatAmount(totalCODAmount)}
          </p>
        </div>
      </div>

      {/* ========================================
          FILTERS
      ======================================== */}

      <div className="mb-4 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">

          {/* SEARCH */}

          <div className="relative min-w-0 flex-1">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg
                width="16"
                height="16"
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
              placeholder="Search order ID, buyer or AWB..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
            />
          </div>

          {/* STATUS */}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-medium text-slate-600 outline-none transition focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
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
              className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ========================================
          ERROR
      ======================================== */}

      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
            <svg
              width="15"
              height="15"
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

          <div className="min-w-0">
            <p className="text-xs font-bold text-red-700">
              Unable to load remittance
            </p>

            <p className="mt-0.5 text-xs text-red-600">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* ========================================
          TABLE
      ======================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Remittance History
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-400">
              {loading
                ? "Loading records..."
                : `${filteredRemittances.length} record${
                    filteredRemittances.length === 1 ? "" : "s"
                  } found`}
            </p>
          </div>

          {!loading && (
            <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500">
              {filteredRemittances.length}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full">

            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">

                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Order ID
                </th>

                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Buyer
                </th>

                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  AWB No
                </th>

                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  COD Amount
                </th>

                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Created On
                </th>

                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Remit. Status
                </th>

                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Transferred On
                </th>

                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Description
                </th>

              </tr>
            </thead>

            <tbody>

              {/* LOADING */}

              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr
                    key={index}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    {Array.from({ length: 8 }).map((__, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-4 py-4"
                      >
                        <div
                          className={`h-3 animate-pulse rounded bg-slate-100 ${
                            cellIndex === 1
                              ? "w-28"
                              : cellIndex === 7
                              ? "w-32"
                              : "w-20"
                          }`}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredRemittances.length === 0 ? (

                /* EMPTY */

                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-16 text-center"
                  >
                    <div className="mx-auto flex max-w-sm flex-col items-center">

                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <svg
                          width="22"
                          height="22"
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

                      <p className="text-sm font-bold text-slate-700">
                        {hasFilters
                          ? "No matching records"
                          : "No COD remittance records"}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {hasFilters
                          ? "Try changing your search or status filter."
                          : "Delivered COD orders will appear here."}
                      </p>

                      {hasFilters && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="mt-3 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-[#008dd2]/30 hover:text-[#008dd2]"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

              ) : (

                /* DATA */

                filteredRemittances.map((item, index) => {
                  const statusStyle = getStatusStyle(item.status);

                  return (
                    <tr
                      key={item.id || item.order_id || index}
                      className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/60"
                    >

                      <td className="px-4 py-3.5">
                        <span className="text-xs font-bold text-slate-800">
                          #{item.order_id || "—"}
                        </span>
                      </td>

                      <td className="max-w-[190px] px-4 py-3.5">
                        <span
                          title={item.buyer || ""}
                          className="block truncate text-xs font-medium text-slate-700"
                        >
                          {item.buyer || "—"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="text-xs font-medium text-slate-600">
                          {item.awb || "—"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <span className="text-xs font-bold text-slate-800">
                          {formatAmount(item.cod_amount)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className="text-xs text-slate-500">
                          {formatDate(item.created_at)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold ${statusStyle.wrapper}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
                          />

                          {statusStyle.label}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className="text-xs text-slate-500">
                          {formatDate(item.transferred_on)}
                        </span>
                      </td>

                      <td className="max-w-[220px] px-4 py-3.5">
                        <span
                          title={item.description || ""}
                          className="block truncate text-xs text-slate-500"
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

        {/* FOOTER */}

        {!loading && filteredRemittances.length > 0 && (
          <div className="flex flex-col gap-1 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[11px] text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-800">
                {filteredRemittances.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-800">
                {remittances.length}
              </span>{" "}
              remittance records
            </span>

            <span className="text-[11px] text-slate-400">
              COD amount:{" "}
              <span className="font-bold text-slate-600">
                {formatAmount(totalCODAmount)}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CODRemittance;