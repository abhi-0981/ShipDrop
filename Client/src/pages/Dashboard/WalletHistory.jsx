import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { CardSkeleton, TableRowSkeleton } from "../../components/Common/TableSkeleton";
import {
  HiOutlineCreditCard,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineCalendar,
  HiOutlineClipboardCopy,
  HiOutlineEye,
  HiOutlineCheck,
  HiX,
  HiPlus,
  HiOutlineReceiptTax,
} from "react-icons/hi";

const WalletHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");

  // Selected Transaction for Detail Modal
  const [selectedTx, setSelectedTx] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

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

  const copyToClipboard = (text, label = "Copied to clipboard") => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    toast.success(label, { id: "copy-toast", duration: 1500 });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatAmount = (amount) => {
    const value = Number(amount || 0);
    return `₹${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDateParts = (dateStr) => {
    if (!dateStr) return { date: "—", time: "" };
    const parsed = new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) return { date: "—", time: "" };

    const date = parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const time = parsed.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return { date, time };
  };

  const getType = (type) => {
    return String(type || "").toUpperCase() === "DEBIT" ? "DEBIT" : "CREDIT";
  };

  /**
   * Parse description smartly:
   * Categorizes transaction, extracts Order ID, AWB, Razorpay Payment ID,
   * and preserves the user's actual remark/message with crystal-clear high contrast.
   */
  const parseDescriptionData = (transaction) => {
    const rawDesc = String(transaction.description || "").trim();
    const type = getType(transaction.type);
    const isDebit = type === "DEBIT";
    const lower = rawDesc.toLowerCase();

    // Check for Reference / Payment IDs
    const paymentId =
      transaction.razorpay_payment_id ||
      rawDesc.match(/pay_[a-zA-Z0-9]+/i)?.[0] ||
      "";

    const orderIdMatch =
      rawDesc.match(/order\s*(?:id|#)?\s*[:#-]?\s*([a-zA-Z0-9_-]+)/i) ||
      transaction.razorpay_order_id;
    const orderId = orderIdMatch
      ? typeof orderIdMatch === "string"
        ? orderIdMatch
        : orderIdMatch[1]
      : "";

    const awbMatch = rawDesc.match(/awb\s*(?:id|#)?\s*[:#-]?\s*([a-zA-Z0-9_-]+)/i);
    const awb = awbMatch ? awbMatch[1] : "";

    // 1. RECHARGE
    if (
      lower.includes("recharge") ||
      lower.includes("recharged") ||
      lower.includes("money added") ||
      lower.includes("razorpay")
    ) {
      let cleanMsg = rawDesc
        .replace(/^wallet recharged:?\s*/i, "")
        .replace(/^money added to wallet:?\s*/i, "")
        .trim();

      if (!cleanMsg || cleanMsg.toLowerCase() === "wallet recharged") {
        cleanMsg = "Recharge via Razorpay Online Payment";
      }

      return {
        category: "Online Top-Up",
        title: "Wallet Recharged",
        message: cleanMsg,
        paymentId,
        orderId,
        awb,
        badgeClass:
          "bg-emerald-50 text-emerald-700 border-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/60",
        iconType: "credit",
      };
    }

    // 2. CANCELLATION REFUND
    if (lower.includes("cancellation") || lower.includes("refund")) {
      return {
        category: "Order Refund",
        title: "Cancellation Refund",
        message:
          rawDesc || (orderId ? `Refund credited for Order #${orderId}` : "Refund credited to wallet"),
        paymentId,
        orderId,
        awb,
        badgeClass:
          "bg-sky-50 text-sky-700 border-sky-200/90 dark:bg-sky-950/50 dark:text-sky-400 dark:border-sky-900/60",
        iconType: "refund",
      };
    }

    // 3. WEIGHT ADJUSTMENT
    if (lower.includes("weight")) {
      return {
        category: "Weight Adjustment",
        title: "Weight Discrepancy",
        message:
          rawDesc ||
          (isDebit
            ? "Weight difference freight adjustment (Debit)"
            : "Weight adjustment refund (Credit)"),
        paymentId,
        orderId,
        awb,
        badgeClass:
          "bg-amber-50 text-amber-700 border-amber-200/90 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900/60",
        iconType: isDebit ? "debit" : "refund",
      };
    }

    // 4. SHIPPING CHARGE / FREIGHT DEDUCTION (DEBIT)
    if (isDebit) {
      let cleanMsg = rawDesc || "Shipping charge deducted for manifested order";
      return {
        category: "Freight Charge",
        title: "Shipping Freight",
        message: cleanMsg,
        paymentId,
        orderId,
        awb,
        badgeClass:
          "bg-rose-50 text-rose-700 border-rose-200/90 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900/60",
        iconType: "debit",
      };
    }

    // 5. MANUAL / ADMIN CREDIT OR CUSTOM REMARK
    return {
      category: "Wallet Credit",
      title: "Credit Adjustment",
      message: rawDesc || "Amount added to wallet",
      paymentId,
      orderId,
      awb,
      badgeClass:
        "bg-emerald-50 text-emerald-700 border-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/60",
      iconType: "credit",
    };
  };

  // KPI Calculations
  const metrics = useMemo(() => {
    let totalCredit = 0;
    let totalDebit = 0;
    let creditCount = 0;
    let debitCount = 0;

    transactions.forEach((tx) => {
      const type = getType(tx.type);
      const amt = Number(tx.amount || 0);
      if (type === "CREDIT") {
        totalCredit += amt;
        creditCount++;
      } else {
        totalDebit += amt;
        debitCount++;
      }
    });

    // Current live balance from newest transaction
    const latestTx = transactions[0];
    const liveBalance =
      latestTx && latestTx.closing_balance != null
        ? Number(latestTx.closing_balance)
        : null;

    return { totalCredit, totalDebit, creditCount, debitCount, liveBalance };
  }, [transactions]);

  // Filters
  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const type = getType(transaction.type);
      const description = String(transaction.description || "").toLowerCase();
      const transactionId = String(transaction.id || "").toLowerCase();
      const paymentId = String(transaction.razorpay_payment_id || "").toLowerCase();
      const amount = String(transaction.amount ?? "").toLowerCase();
      const openingBalance = String(transaction.opening_balance ?? "").toLowerCase();
      const closingBalance = String(transaction.closing_balance ?? "").toLowerCase();

      const searchMatch =
        !query ||
        transactionId.includes(query) ||
        paymentId.includes(query) ||
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

  const handleOpenRechargeModal = () => {
    window.dispatchEvent(new Event("shipdrop:openRecharge"));
  };

  return (
    <div className="min-h-full w-full overflow-x-hidden bg-[#f6f8fb] dark:bg-[#0b0f19] p-3.5 sm:p-5 md:p-6 pb-24 lg:pb-12 text-slate-800 dark:text-slate-100 transition-colors">
      {/* =====================================================
          1. PAGE HEADER + INSTANT RECHARGE BUTTON
      ====================================================== */}
      <div className="mb-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] px-4 sm:px-6 py-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#008dd2]/10 text-[#008dd2] dark:bg-[#008dd2]/20 dark:text-[#38bdf8]">
              <HiOutlineCreditCard size={22} />
            </div>

            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Wallet History & Activity
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Detailed statement of all recharges, refunds, and freight deductions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {filteredTransactions.length}{" "}
              {filteredTransactions.length === 1 ? "transaction" : "transactions"}
            </span>

            <button
              type="button"
              onClick={handleOpenRechargeModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#008dd2] hover:bg-[#007ab6] text-white px-4 py-2.5 text-xs font-bold shadow-sm shadow-[#008dd2]/20 transition active:scale-95 cursor-pointer"
            >
              <HiPlus size={16} />
              <span>Recharge Wallet</span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          2. TOP 3 EXECUTIVE KPI METRIC CARDS
      ====================================================== */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* CURRENT BALANCE */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Current Balance
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-[#008dd2] dark:bg-sky-950/60 dark:text-[#38bdf8]">
              <HiOutlineCreditCard size={18} />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {metrics.liveBalance != null ? formatAmount(metrics.liveBalance) : "—"}
          </div>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            Available for shipping manifests & label generation
          </p>
        </div>

        {/* TOTAL CREDITS */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Total Inflow (Credits)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <HiOutlineArrowUp size={18} />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            +{formatAmount(metrics.totalCredit)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            Across {metrics.creditCount} successful top-ups & refunds
          </p>
        </div>

        {/* TOTAL DEBITS */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Total Outflow (Debits)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <HiOutlineArrowDown size={18} />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
            -{formatAmount(metrics.totalDebit)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            Across {metrics.debitCount} shipping freight charges
          </p>
        </div>
      </div>

      {/* =====================================================
          3. FILTER CONTROLS BAR
      ====================================================== */}
      <div className="mb-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-3 sm:p-3.5 shadow-xs">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          {/* SEARCH INPUT */}
          <div className="relative min-w-0 flex-1">
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <HiOutlineSearch size={16} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by transaction ID, description message, payment ID..."
              className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 pl-10 pr-3.5 text-xs text-slate-700 dark:text-slate-200 outline-none transition focus:border-[#008dd2] focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#008dd2]/10"
            />
          </div>

          {/* SELECTORS ROW */}
          <div className="flex items-center gap-2">
            {/* TYPE FILTER */}
            <div className="relative flex-1 sm:w-36">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <HiOutlineFilter size={15} />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-7 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-[#008dd2]"
              >
                <option value="ALL">All Types</option>
                <option value="CREDIT">Credits (+)</option>
                <option value="DEBIT">Debits (-)</option>
              </select>
            </div>

            {/* DATE FILTER */}
            <div className="relative flex-1 sm:w-36">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <HiOutlineCalendar size={15} />
              </div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-7 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-[#008dd2]"
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
                Reset
              </button>
            )}

            {/* REFRESH */}
            <button
              type="button"
              onClick={fetchWalletHistory}
              disabled={loading}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 disabled:opacity-50"
              title="Refresh statement"
            >
              <HiOutlineRefresh size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          4. MOBILE VIEW: SMART TRANSACTION CARDS
      ====================================================== */}
      <div className="space-y-3 sm:hidden">
        {loading ? (
          <CardSkeleton count={4} />
        ) : error ? (
          <div className="rounded-2xl border border-rose-100 dark:border-rose-900/60 bg-white dark:bg-[#111827] p-6 text-center space-y-2">
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
          <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 text-center text-slate-400">
            <HiOutlineCreditCard size={32} />
            <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              No transactions found
            </p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const type = getType(tx.type);
            const isDebit = type === "DEBIT";
            const info = parseDescriptionData(tx);
            const dateParts = formatDateParts(tx.created_at);

            return (
              <div
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="cursor-pointer rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 shadow-xs space-y-2.5 active:scale-[0.99] transition"
              >
                {/* TOP ROW: ID + TYPE + AMOUNT */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      #{tx.id}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${info.badgeClass}`}
                    >
                      {info.category}
                    </span>
                  </div>

                  <span
                    className={`text-sm font-extrabold tracking-tight ${
                      isDebit ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {isDebit ? "-" : "+"}
                    {formatAmount(tx.amount)}
                  </span>
                </div>

                {/* DESCRIPTION MESSAGE (CLEAR & PROMINENT) */}
                <div className="rounded-xl bg-slate-50 dark:bg-slate-850 p-2.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {info.message}
                  </p>
                  {info.paymentId && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-slate-500">
                      <span>Ref:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{info.paymentId}</span>
                    </div>
                  )}
                </div>

                {/* BALANCE FLOW */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <span>
                    Opening: <b className="text-slate-700 dark:text-slate-200">{formatAmount(tx.opening_balance)}</b>
                  </span>
                  <span>➔</span>
                  <span>
                    Closing: <b className="text-slate-900 dark:text-white font-bold">{formatAmount(tx.closing_balance)}</b>
                  </span>
                </div>

                {/* FOOTER: DATE */}
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2 text-[10px] text-slate-400">
                  <span>{dateParts.date} at {dateParts.time}</span>
                  <span className="text-[#008dd2] font-semibold">View Receipt →</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =====================================================
          5. TABLET & DESKTOP: PREMIUM FINANCIAL TABLE
      ====================================================== */}
      <div className="hidden sm:block w-full overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[8%]" />
            <col className="w-[11%]" />
            <col className="w-[33%]" />
            <col className="w-[14%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[12%]" />
          </colgroup>

          <thead className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-850/80">
            <tr>
              <th className="px-4 py-3.5 text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                TXN ID
              </th>
              <th className="px-4 py-3.5 text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Type
              </th>
              <th className="px-4 py-3.5 text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Description & Remarks
              </th>
              <th className="px-4 py-3.5 text-right text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Amount
              </th>
              <th className="px-4 py-3.5 text-right text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Opening
              </th>
              <th className="px-4 py-3.5 text-right text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Closing
              </th>
              <th className="px-4 py-3.5 text-right text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Timestamp
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
            {loading && (
              <TableRowSkeleton rows={6} cols={7} />
            )}

            {!loading && error && (
              <tr>
                <td colSpan="7" className="px-5 py-14 text-center">
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>
                  <button
                    type="button"
                    onClick={fetchWalletHistory}
                    className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200 underline cursor-pointer"
                  >
                    Try Again
                  </button>
                </td>
              </tr>
            )}

            {!loading && !error && filteredTransactions.length === 0 && (
              <tr>
                <td colSpan="7" className="px-5 py-14 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                    <HiOutlineCreditCard size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No transactions match your search filters
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Try adjusting the search query or selecting "All Dates"
                  </p>
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              filteredTransactions.map((tx) => {
                const type = getType(tx.type);
                const isDebit = type === "DEBIT";
                const info = parseDescriptionData(tx);
                const dateParts = formatDateParts(tx.created_at);

                return (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="group cursor-pointer transition-colors hover:bg-sky-50/40 dark:hover:bg-slate-800/50"
                  >
                    {/* 1. TXN ID */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 group-hover:bg-[#008dd2]/10 group-hover:text-[#008dd2] transition-colors">
                        #{tx.id}
                      </span>
                    </td>

                    {/* 2. TYPE */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-bold tracking-tight shadow-2xs ${
                          isDebit
                            ? "border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                            : "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {isDebit ? (
                          <HiOutlineArrowDown size={12} className="stroke-[2.5]" />
                        ) : (
                          <HiOutlineArrowUp size={12} className="stroke-[2.5]" />
                        )}
                        <span>{type}</span>
                      </span>
                    </td>

                    {/* 3. DESCRIPTION & REMARKS (PROMINENT & HIGH-CONTRAST) */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1 min-w-0 pr-2">
                        {/* CATEGORY BADGE + REFERENCE TAG */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex items-center rounded-md border px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider ${info.badgeClass}`}
                          >
                            {info.category}
                          </span>

                          {info.paymentId && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(info.paymentId, "Payment ID copied");
                              }}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.2 font-mono text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:border-[#008dd2] hover:text-[#008dd2] transition"
                              title="Click to copy Razorpay ID"
                            >
                              <span>{info.paymentId.length > 18 ? `${info.paymentId.slice(0, 16)}...` : info.paymentId}</span>
                              <HiOutlineClipboardCopy size={11} />
                            </button>
                          )}

                          {info.orderId && (
                            <span className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                              Order #{info.orderId}
                            </span>
                          )}
                        </div>

                        {/* FULL MESSAGE / REMARK (BOLD & LEGIBLE) */}
                        <p className="text-[12.5px] font-semibold text-slate-900 dark:text-slate-100 leading-snug break-words">
                          {info.message}
                        </p>
                      </div>
                    </td>

                    {/* 4. AMOUNT */}
                    <td className="px-4 py-3.5 text-right font-mono">
                      <span
                        className={`text-[13.5px] font-black tracking-tight ${
                          isDebit
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {isDebit ? "-" : "+"}
                        {formatAmount(tx.amount)}
                      </span>
                    </td>

                    {/* 5. OPENING BALANCE */}
                    <td className="px-4 py-3.5 text-right font-mono text-slate-600 dark:text-slate-400 text-xs font-medium tabular-nums">
                      {tx.opening_balance != null ? formatAmount(tx.opening_balance) : "—"}
                    </td>

                    {/* 6. CLOSING BALANCE */}
                    <td className="px-4 py-3.5 text-right font-mono text-slate-900 dark:text-slate-100 text-xs font-bold tabular-nums">
                      {tx.closing_balance != null ? formatAmount(tx.closing_balance) : "—"}
                    </td>

                    {/* 7. DATE & TIME (NO UGLY WRAP) */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {dateParts.date}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap mt-0.5">
                          {dateParts.time}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {/* FOOTER */}
        {!loading && !error && transactions.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
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

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400">
                Click any row to view complete receipt
              </span>
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
          </div>
        )}
      </div>

      {/* =====================================================
          6. TRANSACTION RECEIPT / DETAIL POPUP MODAL
      ====================================================== */}
      {selectedTx && (
        <div
          onClick={() => setSelectedTx(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in-0 duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xl animate-in zoom-in-95 duration-200"
          >
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/70 dark:bg-slate-850/60">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#008dd2]/10 text-[#008dd2]">
                  <HiOutlineReceiptTax size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Transaction Receipt
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    TXN ID: #{selectedTx.id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 transition"
              >
                <HiX size={18} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-6 space-y-4">
              {/* AMOUNT BANNER */}
              {(() => {
                const type = getType(selectedTx.type);
                const isDebit = type === "DEBIT";
                const info = parseDescriptionData(selectedTx);
                const dateParts = formatDateParts(selectedTx.created_at);

                return (
                  <>
                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/80 p-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${info.badgeClass}`}
                      >
                        {info.category}
                      </span>
                      <div
                        className={`mt-2 text-2xl sm:text-3xl font-black tracking-tight ${
                          isDebit ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {isDebit ? "-" : "+"}
                        {formatAmount(selectedTx.amount)}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Status: <span className="font-bold text-emerald-600 dark:text-emerald-400">Processed Successfully</span>
                      </p>
                    </div>

                    {/* DESCRIPTION / REMARKS (CLEAR & HIGHLIGHTED) */}
                    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-4 space-y-1.5 shadow-2xs">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Description / Remarks Note
                      </span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                        {info.message}
                      </p>
                    </div>

                    {/* BALANCE RECONCILIATION FLOW */}
                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/50 p-4">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <p className="text-[11px] text-slate-400">Opening Balance</p>
                          <p className="font-mono font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                            {formatAmount(selectedTx.opening_balance)}
                          </p>
                        </div>
                        <span className="text-slate-300 dark:text-slate-600 font-bold text-lg">➔</span>
                        <div className="text-right">
                          <p className="text-[11px] text-slate-400">Closing Balance</p>
                          <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                            {formatAmount(selectedTx.closing_balance)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* DETAILS GRID */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span className="text-slate-400">Transaction ID</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          #{selectedTx.id}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span className="text-slate-400">Timestamp</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {dateParts.date} at {dateParts.time}
                        </span>
                      </div>

                      {info.paymentId && (
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                          <span className="text-slate-400">Payment Reference</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(info.paymentId, "Payment ID copied")}
                            className="inline-flex items-center gap-1 font-mono font-semibold text-[#008dd2] hover:underline"
                          >
                            <span>{info.paymentId}</span>
                            <HiOutlineClipboardCopy size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="w-full rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 text-xs font-bold shadow-xs hover:opacity-90 transition active:scale-98"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletHistory;