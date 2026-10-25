import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { CardSkeleton, TableRowSkeleton } from "../../components/Common/TableSkeleton";

const WalletHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");

  useEffect(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser?.id) {
        setError("User not found");
        setLoading(false);
        return;
      }
      setUser(savedUser);
    } catch (err) {
      console.error("User parse error:", err);
      setError("Unable to load user");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    fetchWalletHistory();
  }, [user]);

  const fetchWalletHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/payments/wallet/history?user_id=${user.id}`
      );

      setTransactions(
        Array.isArray(response.data?.transactions)
          ? response.data.transactions
          : []
      );
    } catch (err) {
      console.error("Wallet history error:", err);
      setError(
        err.response?.data?.message || "Unable to load wallet history"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    const value = Number(amount || 0);
    return `₹${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date) => {
    if (!date) return "—";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleString("en-IN", {
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

  // Clean, high-contrast, human-readable description
  const getCleanDescription = (tx) => {
    const raw = String(tx.description || "").trim();
    if (!raw) {
      return getType(tx.type) === "DEBIT"
        ? "Shipping Freight Charge"
        : "Wallet Recharge";
    }
    return raw;
  };

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const type = getType(transaction.type);
      const description = String(transaction.description || "").toLowerCase();
      const transactionId = String(transaction.id || "").toLowerCase();
      const amount = String(transaction.amount ?? "").toLowerCase();
      const openingBalance = String(transaction.opening_balance ?? "").toLowerCase();
      const closingBalance = String(transaction.closing_balance ?? "").toLowerCase();

      const searchMatch =
        !query ||
        transactionId.includes(query) ||
        amount.includes(query) ||
        description.includes(query) ||
        openingBalance.includes(query) ||
        closingBalance.includes(query) ||
        type.toLowerCase().includes(query);

      const typeMatch = typeFilter === "ALL" || type === typeFilter;

      let dateMatch = true;

      if (dateFilter !== "ALL" && transaction.created_at) {
        const transactionDate = new Date(transaction.created_at);

        if (!Number.isNaN(transactionDate.getTime())) {
          const now = new Date();

          if (dateFilter === "TODAY") {
            dateMatch = transactionDate.toDateString() === now.toDateString();
          }

          if (dateFilter === "7DAYS") {
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(now.getDate() - 7);
            dateMatch = transactionDate >= sevenDaysAgo;
          }

          if (dateFilter === "30DAYS") {
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(now.getDate() - 30);
            dateMatch = transactionDate >= thirtyDaysAgo;
          }
        }
      }

      return searchMatch && typeMatch && dateMatch;
    });
  }, [transactions, search, typeFilter, dateFilter]);

  const hasFilters =
    search.trim() !== "" || typeFilter !== "ALL" || dateFilter !== "ALL";

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setDateFilter("ALL");
  };

  return (
    <div className="min-h-full w-full overflow-x-hidden bg-[#f6f8fb] dark:bg-[#0b0f19] p-3.5 sm:p-5 md:p-6 pb-20 lg:pb-8 text-slate-800 dark:text-slate-100 transition-colors">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <div className="mb-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] px-4 sm:px-5 py-3.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="6" width="18" height="13" rx="2" />
                <path strokeLinecap="round" d="M3 10h18M16 14h2" />
              </svg>
            </div>

            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Wallet History
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Track credits, debits and live wallet activity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {filteredTransactions.length}{" "}
              {filteredTransactions.length === 1 ? "transaction" : "transactions"}
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================
          FILTER CONTROLS
      ====================================================== */}
      <div className="mb-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] p-3 shadow-xs">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          {/* SEARCH INPUT */}
          <div className="relative min-w-0 flex-1">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="m20 20-4-4" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transaction ID or order description..."
              className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 pl-9 pr-3 text-xs text-slate-700 dark:text-slate-200 outline-none transition focus:border-[#008dd2] focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#008dd2]/10"
            />
          </div>

          {/* SELECTORS ROW */}
          <div className="flex items-center gap-2">
            {/* TYPE FILTER */}
            <div className="relative flex-1 sm:w-36">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-[#008dd2]"
              >
                <option value="ALL">All Types</option>
                <option value="CREDIT">Credit</option>
                <option value="DEBIT">Debit</option>
              </select>
            </div>

            {/* DATE FILTER */}
            <div className="relative flex-1 sm:w-36">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-[#008dd2]"
              >
                <option value="ALL">All Dates</option>
                <option value="TODAY">Today</option>
                <option value="7DAYS">Last 7 Days</option>
                <option value="30DAYS">Last 30 Days</option>
              </select>
            </div>

            {/* CLEAR */}
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-10 shrink-0 rounded-xl px-3 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Clear
              </button>
            )}

            {/* REFRESH */}
            <button
              type="button"
              onClick={fetchWalletHistory}
              disabled={loading}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 disabled:opacity-50"
              title="Refresh"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={loading ? "animate-spin" : ""}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 11a8.1 8.1 0 00-14.9-4M4 5v4h4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 13a8.1 8.1 0 0014.9 4M20 19v-4h-4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          1. MOBILE VIEW: CLEAN CARDS
      ====================================================== */}
      <div className="space-y-2.5 sm:hidden">
        {loading ? (
          <CardSkeleton count={4} />
        ) : error ? (
          <div className="rounded-2xl border border-rose-100 dark:border-rose-900 bg-white dark:bg-[#111827] p-6 text-center space-y-2">
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>
            <button
              type="button"
              onClick={fetchWalletHistory}
              className="text-xs font-bold text-slate-800 dark:text-slate-200 underline"
            >
              Try Again
            </button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 text-center text-slate-400">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No transactions found
            </p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => {
            const type = getType(transaction.type);
            const isDebit = type === "DEBIT";
            const desc = getCleanDescription(transaction);

            return (
              <div
                key={transaction.id}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] p-3.5 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      #{transaction.id}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-md border px-1.5 py-0.2 text-[9.5px] font-bold ${
                        isDebit
                          ? "border-rose-200 bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900/60"
                          : "border-emerald-200 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900/60"
                      }`}
                    >
                      {type}
                    </span>
                  </div>

                  <span
                    className={`text-sm font-extrabold ${
                      isDebit ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {isDebit ? "-" : "+"}
                    {formatAmount(transaction.amount)}
                  </span>
                </div>

                {/* DESCRIPTION */}
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug break-words">
                  {desc}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <span>
                    Opening: <b className="text-slate-700 dark:text-slate-300 font-semibold">{transaction.opening_balance != null ? formatAmount(transaction.opening_balance) : "—"}</b>
                  </span>
                  <span>
                    Closing: <b className="text-slate-700 dark:text-slate-300 font-semibold">{transaction.closing_balance != null ? formatAmount(transaction.closing_balance) : "—"}</b>
                  </span>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-1.5 text-[10.5px] text-slate-400 text-right">
                  {formatDate(transaction.created_at)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =====================================================
          2. TABLET & DESKTOP: CLEAN, SIMPLE & SPACIOUS TABLE
      ====================================================== */}
      <div className="hidden sm:block w-full overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xs">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[8%]" />
            <col className="w-[13%]" />
            <col className="w-[10%]" />
            <col className="w-[13%]" />
            <col className="w-[13%]" />
            <col className="w-[28%]" />
            <col className="w-[15%]" />
          </colgroup>

          <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/70">
            <tr>
              <th className="px-3.5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                ID
              </th>
              <th className="px-3.5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Amount
              </th>
              <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Type
              </th>
              <th className="px-3.5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Opening Balance
              </th>
              <th className="px-3.5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Closing Balance
              </th>
              <th className="px-3.5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Description
              </th>
              <th className="px-3.5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Created At
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-[12.5px]">
            {loading && (
              <TableRowSkeleton rows={6} cols={7} />
            )}

            {!loading && error && (
              <tr>
                <td colSpan="7" className="px-5 py-12 text-center">
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>
                  <button
                    type="button"
                    onClick={fetchWalletHistory}
                    className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200 underline"
                  >
                    Try Again
                  </button>
                </td>
              </tr>
            )}

            {!loading && !error && filteredTransactions.length === 0 && (
              <tr>
                <td colSpan="7" className="px-5 py-12 text-center text-slate-400">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No transactions found
                  </p>
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              filteredTransactions.map((transaction) => {
                const type = getType(transaction.type);
                const isDebit = type === "DEBIT";
                const desc = getCleanDescription(transaction);

                return (
                  <tr
                    key={transaction.id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    {/* ID */}
                    <td className="px-3.5 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                      #{transaction.id}
                    </td>

                    {/* AMOUNT */}
                    <td className="px-3.5 py-3 font-bold font-mono">
                      <span
                        className={`text-[13px] ${
                          isDebit ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {isDebit ? "-" : "+"}
                        {formatAmount(transaction.amount)}
                      </span>
                    </td>

                    {/* TYPE */}
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                          isDebit
                            ? "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-400"
                            : "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-400"
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

                    {/* OPENING BALANCE */}
                    <td className="px-3.5 py-3 font-mono text-slate-600 dark:text-slate-400 font-medium">
                      {transaction.opening_balance != null
                        ? formatAmount(transaction.opening_balance)
                        : "—"}
                    </td>

                    {/* CLOSING BALANCE */}
                    <td className="px-3.5 py-3 font-mono text-slate-800 dark:text-slate-200 font-semibold">
                      {transaction.closing_balance != null
                        ? formatAmount(transaction.closing_balance)
                        : "—"}
                    </td>

                    {/* DESCRIPTION (PROMINENT, CLEAN & HIGH-CONTRAST) */}
                    <td className="px-3.5 py-3">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-[12.5px] leading-snug break-words">
                        {desc}
                      </p>
                    </td>

                    {/* CREATED AT (NO BROKEN WRAP) */}
                    <td className="px-3.5 py-3 text-right text-slate-600 dark:text-slate-400 text-[11.5px] font-medium whitespace-nowrap">
                      {formatDate(transaction.created_at)}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {/* FOOTER */}
        {!loading && !error && transactions.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
            <p>
              Showing{" "}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {filteredTransactions.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {transactions.length}
              </span>{" "}
              transactions
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="font-bold text-[#008dd2] hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletHistory;