import { useEffect, useMemo, useState } from "react";
import axios from "axios";

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

      const response = await axios.get(
        `http://localhost:5000/api/payments/wallet/history?user_id=${user.id}`
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

  const getType = (type) => {
    return String(type || "").toUpperCase() === "DEBIT" ? "DEBIT" : "CREDIT";
  };

  const getDescriptionData = (transaction) => {
    const description = String(transaction.description || "").trim();
    const type = getType(transaction.type);

    if (description.toLowerCase().includes("cancellation refund")) {
      const orderId =
        description.match(/order id\s*[-:#]?\s*(.+)$/i)?.[1] || "";

      return {
        title: "Cancellation Refund",
        subtitle: orderId ? `Order #${orderId}` : "Amount refunded to wallet",
        icon: "refund",
        iconClass: "bg-blue-50 text-blue-600",
      };
    }

    if (type === "DEBIT") {
      const orderId =
        description.match(/order id\s*[-:#]?\s*(.+)$/i)?.[1] || "";

      return {
        title: "Shipping Charge",
        subtitle: orderId ? `Order #${orderId}` : "Amount debited from wallet",
        icon: "debit",
        iconClass: "bg-red-50 text-red-600",
      };
    }

    if (description.toLowerCase().includes("wallet recharged")) {
      return {
        title: "Wallet Recharged",
        subtitle: "Money added to wallet",
        icon: "recharge",
        iconClass: "bg-emerald-50 text-emerald-600",
      };
    }

    return {
      title: description || "Wallet Credit",
      subtitle: description ? "Wallet transaction" : "Amount added to wallet",
      icon: "recharge",
      iconClass: "bg-emerald-50 text-emerald-600",
    };
  };

  const DescriptionIcon = ({ type }) => {
    if (type === "debit") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 19V5"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.5 10.5L12 5l5.5 5.5"
          />
        </svg>
      );
    }

    if (type === "refund") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 7v5h-5"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 12a7 7 0 10-2.05 4.95"
          />
        </svg>
      );
    }

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-4 w-4"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 10l5-5 5 5"
        />
      </svg>
    );
  };

  const SearchIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
    >
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="m20 20-4-4" />
    </svg>
  );

  const FilterIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16M7 12h10M10 18h4"
      />
    </svg>
  );

  const CalendarIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path strokeLinecap="round" d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  );

  const RefreshIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 11a8.1 8.1 0 00-14.9-4M4 5v4h4"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 13a8.1 8.1 0 0014.9 4M20 19v-4h-4"
      />
    </svg>
  );

  const WalletIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-5 w-5"
    >
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 14h2" />
    </svg>
  );

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const type = getType(transaction.type);
      const description = String(transaction.description || "").toLowerCase();
      const transactionId = String(transaction.id || "").toLowerCase();
      const amount = String(transaction.amount ?? "").toLowerCase();
      const openingBalance = String(
        transaction.opening_balance ?? ""
      ).toLowerCase();
      const closingBalance = String(
        transaction.closing_balance ?? ""
      ).toLowerCase();

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
            dateMatch =
              transactionDate.toDateString() === now.toDateString();
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
    <div className="min-h-full w-full overflow-x-hidden bg-[#f6f8fb] p-3.5 sm:p-5 md:p-6 pb-20 lg:pb-8">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <div className="mb-4 rounded-2xl border border-slate-200/80 bg-white px-4 sm:px-5 py-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <WalletIcon />
            </div>

            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                Wallet History
              </h1>
              <p className="mt-0.5 text-xs text-slate-400">
                Track credits, debits and live wallet activity
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {filteredTransactions.length}{" "}
              {filteredTransactions.length === 1
                ? "transaction"
                : "transactions"}
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================
          FILTER CONTROLS - RESPONSIVE DOCK
      ====================================================== */}
      <div className="mb-4 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          {/* SEARCH INPUT */}
          <div className="relative min-w-0 flex-1">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transaction ID or order description..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-xs text-slate-700 outline-none transition focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
            />
          </div>

          {/* SELECTORS ROW */}
          <div className="flex items-center gap-2">
            {/* TYPE FILTER */}
            <div className="relative flex-1 sm:w-36">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <FilterIcon />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-7 text-xs font-semibold text-slate-700 outline-none focus:border-[#008dd2]"
              >
                <option value="ALL">All Types</option>
                <option value="CREDIT">Credit</option>
                <option value="DEBIT">Debit</option>
              </select>
            </div>

            {/* DATE FILTER */}
            <div className="relative flex-1 sm:w-36">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <CalendarIcon />
              </div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-7 text-xs font-semibold text-slate-700 outline-none focus:border-[#008dd2]"
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
                className="h-10 shrink-0 rounded-xl px-3 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                Clear
              </button>
            )}

            {/* REFRESH */}
            <button
              type="button"
              onClick={fetchWalletHistory}
              disabled={loading}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshIcon />
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          1. MOBILE VIEW: TOUCH-FRIENDLY TRANSACTION CARDS
      ====================================================== */}
      <div className="space-y-2.5 sm:hidden">
        {loading ? (
          <div className="py-12 text-center text-xs font-semibold text-slate-400">
            Loading transactions...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-100 bg-white p-6 text-center space-y-2">
            <p className="text-xs font-bold text-rose-600">{error}</p>
            <button
              type="button"
              onClick={fetchWalletHistory}
              className="text-xs font-bold text-slate-800 underline"
            >
              Try Again
            </button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-6 text-center text-slate-400">
            <WalletIcon />
            <p className="mt-2 text-xs font-bold text-slate-700">
              No transactions found
            </p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => {
            const type = getType(transaction.type);
            const isDebit = type === "DEBIT";
            const desc = getDescriptionData(transaction);

            return (
              <div
                key={transaction.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${desc.iconClass}`}
                    >
                      <DescriptionIcon type={desc.icon} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-tight">
                        {desc.title}
                      </p>
                      <span className="font-mono text-[10px] text-slate-400">
                        #{transaction.id}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-sm font-black ${
                      isDebit ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {isDebit ? "-" : "+"}
                    {formatAmount(transaction.amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    Opening:{" "}
                    <b className="text-slate-700 font-semibold">
                      {transaction.opening_balance != null
                        ? formatAmount(transaction.opening_balance)
                        : "—"}
                    </b>
                  </span>
                  <span>
                    Closing:{" "}
                    <b className="text-slate-700 font-semibold">
                      {transaction.closing_balance != null
                        ? formatAmount(transaction.closing_balance)
                        : "—"}
                    </b>
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-50 pt-1.5 text-[10px] text-slate-400">
                  <span className="truncate max-w-[200px]">{desc.subtitle}</span>
                  <span>{formatDate(transaction.created_at)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =====================================================
          2. TABLET & DESKTOP: STRUCTURED TABLE VIEW
      ====================================================== */}
      <div className="hidden sm:block w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[8%]" />
            <col className="w-[14%]" />
            <col className="w-[11%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
            <col className="w-[22%]" />
            <col className="w-[15%]" />
          </colgroup>

          <thead className="border-b border-slate-100 bg-slate-50/70">
            <tr>
              <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                ID
              </th>
              <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Amount
              </th>
              <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Type
              </th>
              <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Opening Balance
              </th>
              <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Closing Balance
              </th>
              <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Description
              </th>
              <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Created At
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {loading && (
              <tr>
                <td colSpan="7" className="px-5 py-14 text-center">
                  <div className="flex flex-col items-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#008dd2]" />
                    <span className="mt-3 text-xs font-semibold text-slate-400">
                      Loading transactions...
                    </span>
                  </div>
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan="7" className="px-5 py-14 text-center">
                  <p className="text-xs font-bold text-rose-600">{error}</p>
                  <button
                    type="button"
                    onClick={fetchWalletHistory}
                    className="mt-2 text-xs font-bold text-slate-800 underline"
                  >
                    Try Again
                  </button>
                </td>
              </tr>
            )}

            {!loading && !error && filteredTransactions.length === 0 && (
              <tr>
                <td colSpan="7" className="px-5 py-14 text-center">
                  <p className="text-xs font-bold text-slate-600">
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
                const description = getDescriptionData(transaction);

                return (
                  <tr
                    key={transaction.id}
                    className="transition-colors hover:bg-slate-50/60"
                  >
                    <td className="overflow-hidden px-4 py-3.5 font-mono font-bold text-slate-700">
                      #{transaction.id}
                    </td>

                    <td className="overflow-hidden px-4 py-3.5 font-bold">
                      <span
                        className={isDebit ? "text-rose-600" : "text-emerald-600"}
                      >
                        {isDebit ? "-" : "+"}
                        {formatAmount(transaction.amount)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                          isDebit
                            ? "border-rose-100 bg-rose-50 text-rose-600"
                            : "border-emerald-100 bg-emerald-50 text-emerald-600"
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

                    <td className="overflow-hidden px-4 py-3.5 text-slate-700 font-semibold">
                      {transaction.opening_balance != null
                        ? formatAmount(transaction.opening_balance)
                        : "—"}
                    </td>

                    <td className="overflow-hidden px-4 py-3.5 text-slate-700 font-semibold">
                      {transaction.closing_balance != null
                        ? formatAmount(transaction.closing_balance)
                        : "—"}
                    </td>

                    <td className="overflow-hidden px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${description.iconClass}`}
                        >
                          <DescriptionIcon type={description.icon} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-800">
                            {description.title}
                          </p>
                          <p className="truncate text-[11px] text-slate-400">
                            {description.subtitle}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="overflow-hidden px-4 py-3.5 text-slate-400 text-[11px]">
                      {formatDate(transaction.created_at)}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {/* FOOTER COUNTER */}
        {!loading && !error && transactions.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3 text-xs text-slate-500">
            <p>
              Showing{" "}
              <span className="font-bold text-slate-800">
                {filteredTransactions.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-800">
                {transactions.length}
              </span>{" "}
              transactions
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="font-bold text-[#008dd2] hover:underline"
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