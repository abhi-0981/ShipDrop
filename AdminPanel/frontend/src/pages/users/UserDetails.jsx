import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  HiOutlineArrowLeft,
  HiOutlineUserCircle,
  HiOutlineSave,
  HiOutlinePlus,
  HiOutlineX,
  HiOutlineCreditCard,
  HiOutlineCash,
  HiOutlineOfficeBuilding,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineDocumentText,
} from "react-icons/hi";
import { API_BASE_URL } from "../../config/api";

function UserDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  // =====================================================
  // STATES
  // =====================================================

  const [user, setUser] = useState(null);
  const [rateCards, setRateCards] = useState([]);
  const [selectedRateCard, setSelectedRateCard] = useState("");
  const [activeTab, setActiveTab] = useState("account");

  const [transactions, setTransactions] = useState([]);
  const [walletLoading, setWalletLoading] = useState(false);

  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletDescription, setWalletDescription] = useState("");
  const [walletSaving, setWalletSaving] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // FORMAT AMOUNT
  // =====================================================

  const formatAmount = (amount) => {
    const value = Number(amount || 0);
    return `₹${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // =====================================================
  // FORMAT CREATED AT
  // =====================================================

  const formatCreatedAt = (date) => {
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

  // =====================================================
  // API RESPONSE HELPER
  // =====================================================

  const getJsonResponse = async (response) => {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return await response.json();
    }
    const text = await response.text();
    return {
      message: text || `Request failed with status ${response.status}`,
    };
  };

  // =====================================================
  // LOAD USER + RATE CARDS
  // =====================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const userResponse = await fetch(`${API_BASE_URL}/admin/users/${id}`);
      const userData = await getJsonResponse(userResponse);

      if (!userResponse.ok) {
        throw new Error(userData.message || "Failed to load user");
      }

      setUser(userData.user);
      setSelectedRateCard(
        userData.user.rate_card_id ? String(userData.user.rate_card_id) : ""
      );

      const rateCardResponse = await fetch(`${API_BASE_URL}/rate-cards`);
      const rateCardData = await getJsonResponse(rateCardResponse);

      if (!rateCardResponse.ok) {
        throw new Error(rateCardData.message || "Failed to load rate cards");
      }

      const activeRateCards = (rateCardData.rateCards || []).filter(
        (rateCard) => Number(rateCard.is_active) === 1
      );

      setRateCards(activeRateCards);
    } catch (err) {
      console.error("Load user details error:", err);
      setError(err.message || "Unable to load user details");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD WALLET
  // =====================================================

  const loadWallet = async () => {
    try {
      setWalletLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/admin/users/${id}/wallet`);
      const data = await getJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to load wallet");
      }

      setTransactions(
        Array.isArray(data.transactions) ? data.transactions : []
      );
    } catch (err) {
      console.error("Load wallet error:", err);
      setError(err.message || "Unable to load wallet");
    } finally {
      setWalletLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (activeTab === "wallet" && user?.id) {
      loadWallet();
    }
  }, [activeTab, user?.id]);

  // =====================================================
  // SAVE RATE CARD
  // =====================================================

  const saveRateCard = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_BASE_URL}/admin/users/${id}/rate-card`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rate_card_id: selectedRateCard ? Number(selectedRateCard) : null,
          }),
        }
      );

      const data = await getJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to save rate card");
      }

      setUser(data.user);
      setSelectedRateCard(
        data.user.rate_card_id ? String(data.user.rate_card_id) : ""
      );
      setSuccess("Rate card saved successfully");
    } catch (err) {
      console.error("Save rate card error:", err);
      setError(err.message || "Unable to save rate card");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // ADD WALLET TRANSACTION
  // =====================================================

  const addWalletTransaction = async () => {
    const amount = Number(walletAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!String(walletDescription).trim()) {
      setError("Please enter a description");
      return;
    }

    try {
      setWalletSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_BASE_URL}/admin/users/${id}/wallet`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            description: String(walletDescription).trim(),
          }),
        }
      );

      const data = await getJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to add wallet transaction");
      }

      setShowWalletModal(false);
      setWalletAmount("");
      setWalletDescription("");
      setSuccess("Wallet transaction added successfully");

      await loadWallet();
    } catch (err) {
      console.error("Add wallet transaction error:", err);
      setError(err.message || "Unable to add wallet transaction");
    } finally {
      setWalletSaving(false);
    }
  };

  const closeWalletModal = () => {
    if (walletSaving) return;
    setShowWalletModal(false);
    setWalletAmount("");
    setWalletDescription("");
  };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (loading) {
    return (
      <div className="p-4 sm:p-7 min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2.5">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#008dd2]" />
          <p className="text-xs font-medium text-slate-400">Loading user profile...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // USER NOT FOUND
  // =====================================================

  if (!user) {
    return (
      <div className="p-4 sm:p-7 max-w-lg mx-auto text-center">
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-sm text-rose-600 font-semibold">
          {error || "User not found"}
        </div>
        <button
          type="button"
          onClick={() => navigate("/users")}
          className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#008dd2] hover:underline"
        >
          <HiOutlineArrowLeft size={16} />
          Back to All Users
        </button>
      </div>
    );
  }

  return (
    <div className="p-3.5 sm:p-6 md:p-7 max-w-7xl mx-auto pb-24 lg:pb-8">
      {/* ================================================= */}
      {/* TOP BAR / BACK NAVIGATION */}
      {/* ================================================= */}
      <div className="mb-4 sm:mb-6">
        <button
          type="button"
          onClick={() => navigate("/users")}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#008dd2] transition active:scale-95"
        >
          <HiOutlineArrowLeft size={16} />
          Back to All Users
        </button>

        <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {user.full_name || "Merchant Account"}
              </h1>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                #{user.id}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              Manage merchant settings, assigned rates and credit ledger
            </p>
          </div>
        </div>
      </div>

      {/* ALERTS */}
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs sm:text-sm text-rose-600 animate-in fade-in duration-150">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            className="text-rose-400 hover:text-rose-600"
          >
            <HiOutlineX size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs sm:text-sm text-emerald-600 animate-in fade-in duration-150">
          <span>{success}</span>
          <button
            type="button"
            onClick={() => setSuccess("")}
            className="text-emerald-400 hover:text-emerald-600"
          >
            <HiOutlineX size={16} />
          </button>
        </div>
      )}

      {/* ================================================= */}
      {/* MAIN TWO-COLUMN WORKSPACE */}
      {/* ================================================= */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[310px_minmax(0,1fr)]">
        
        {/* LEFT COLUMN: USER PROFILE SUMMARY CARD */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#008dd2]/10 text-[#008dd2]">
              {user.profile_image ? (
                <img
                  src={user.profile_image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <HiOutlineUserCircle size={36} />
              )}
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-slate-900 leading-tight">
                {user.full_name || "Unnamed"}
              </h2>
              <p className="truncate text-xs text-slate-400 mt-0.5">
                {user.email || "No email"}
              </p>
              <span className="mt-1.5 inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold capitalize text-slate-600">
                {user.role || "user"}
              </span>
            </div>
          </div>

          {/* USER SPECIFICATION ROWS */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-2.5 text-slate-600">
              <HiOutlineOfficeBuilding size={16} className="text-slate-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Company</span>
                <span className="truncate font-semibold text-slate-800 block">
                  {user.company_name || "—"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-slate-600">
              <HiOutlinePhone size={16} className="text-slate-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Contact Phone</span>
                <span className="font-semibold text-slate-800 block">
                  {user.phone_no || "—"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-slate-600">
              <HiOutlineDocumentText size={16} className="text-slate-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">GSTIN</span>
                <span className="font-mono font-semibold text-slate-800 block">
                  {user.gst_no || "Not Registered"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-slate-600">
              <HiOutlineCreditCard size={16} className="text-slate-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Current Rate Card</span>
                <span className="font-bold text-[#008dd2] block truncate">
                  {user.rate_card_name || "Default / Unassigned"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TABBED MANAGEMENT WORKSPACE */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          
          {/* TAB BUTTONS BAR */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 px-3 sm:px-6">
            <button
              type="button"
              onClick={() => setActiveTab("account")}
              className={`flex items-center gap-2 px-3 sm:px-4 py-3.5 text-xs font-bold transition border-b-2 ${
                activeTab === "account"
                  ? "border-[#008dd2] text-[#008dd2]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <HiOutlineCreditCard size={17} />
              <span>Rate Card Settings</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("wallet")}
              className={`flex items-center gap-2 px-3 sm:px-4 py-3.5 text-xs font-bold transition border-b-2 ${
                activeTab === "wallet"
                  ? "border-[#008dd2] text-[#008dd2]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <HiOutlineCash size={17} />
              <span>Wallet Ledger</span>
            </button>
          </div>

          {/* TAB 1: RATE CARD SETTINGS */}
          {activeTab === "account" && (
            <div className="p-4 sm:p-6 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Assign Courier Rate Card</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  The merchant will be charged shipping rates according to the selected tier.
                </p>
              </div>

              <div className="max-w-md space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Select Rate Card
                </label>
                <select
                  value={selectedRateCard}
                  onChange={(e) => setSelectedRateCard(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
                >
                  <option value="">Not Assigned (Standard Base Rate)</option>
                  {rateCards.map((rateCard) => (
                    <option key={rateCard.id} value={rateCard.id}>
                      {rateCard.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">
                  Active rate cards dictate per-kg zone surface and air charges.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={saveRateCard}
                  disabled={saving}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#008dd2] px-6 text-xs font-bold text-white shadow-xs transition hover:bg-[#007ab6] active:scale-95 disabled:opacity-50"
                >
                  <HiOutlineSave size={16} />
                  <span>{saving ? "Saving..." : "Save Rate Card"}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: WALLET TRANSACTIONS LEDGER */}
          {activeTab === "wallet" && (
            <div>
              {/* LEDGER BAR */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-6 border-b border-slate-100 bg-slate-50/40">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Wallet Log & Transactions</h3>
                  <p className="text-xs text-slate-400">
                    Live record of debits, recharges, and order bookings
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowWalletModal(true)}
                  className="flex h-9.5 items-center justify-center gap-1.5 rounded-xl bg-[#008dd2] px-4 text-xs font-bold text-white shadow-xs transition hover:bg-[#007ab6] active:scale-95 shrink-0"
                >
                  <HiOutlinePlus size={16} />
                  <span>Add Credit Transaction</span>
                </button>
              </div>

              {/* 1. MOBILE VIEW: APP TRANSACTION TILES */}
              <div className="p-3 space-y-2 sm:hidden">
                {walletLoading ? (
                  <div className="py-12 text-center text-xs font-medium text-slate-400">
                    Loading transactions...
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-xs font-bold text-slate-700">No transactions yet</p>
                    <p className="text-[11px] mt-0.5">Wallet debits and top-ups will show here.</p>
                  </div>
                ) : (
                  transactions.map((t) => {
                    const isDebit = String(t.type || "").toUpperCase() === "DEBIT";
                    return (
                      <div
                        key={t.id}
                        className="rounded-xl border border-slate-200/80 bg-white p-3 space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-700">
                            #{t.id}
                          </span>
                          <span
                            className={`text-xs font-black ${
                              isDebit ? "text-rose-600" : "text-emerald-600"
                            }`}
                          >
                            {isDebit ? "-" : "+"}
                            {formatAmount(t.amount)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 font-medium leading-relaxed">
                          {t.description || "Wallet transaction"}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-50 pt-1.5">
                          <span>
                            Bal:{" "}
                            <b className="font-semibold text-slate-600">
                              {t.closing_balance != null
                                ? formatAmount(t.closing_balance)
                                : "—"}
                            </b>
                          </span>
                          <span>{formatCreatedAt(t.created_at)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* 2. TABLET & DESKTOP: TABLE VIEW */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Opening</th>
                      <th className="py-3 px-4">Closing</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Date</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-xs">
                    {walletLoading ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-slate-400 font-medium">
                          Loading wallet transactions...
                        </td>
                      </tr>
                    ) : transactions.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-slate-400 font-medium">
                          No wallet activity found for this merchant.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((t) => {
                        const isDebit = String(t.type || "").toUpperCase() === "DEBIT";

                        return (
                          <tr key={t.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                              #{t.id}
                            </td>

                            <td className="py-3.5 px-4 font-black">
                              <span
                                className={isDebit ? "text-rose-600" : "text-emerald-600"}
                              >
                                {isDebit ? "-" : "+"}
                                {formatAmount(t.amount)}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                  isDebit
                                    ? "bg-rose-50 text-rose-600"
                                    : "bg-emerald-50 text-emerald-600"
                                }`}
                              >
                                {isDebit ? "Debit" : "Credit"}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-slate-600 font-medium">
                              {t.opening_balance != null
                                ? formatAmount(t.opening_balance)
                                : "—"}
                            </td>

                            <td className="py-3.5 px-4 text-slate-800 font-bold">
                              {t.closing_balance != null
                                ? formatAmount(t.closing_balance)
                                : "—"}
                            </td>

                            <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate font-medium">
                              {t.description || "—"}
                            </td>

                            <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                              {formatCreatedAt(t.created_at)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* ADD WALLET TRANSACTION MODAL / BOTTOM SHEET */}
      {/* ========================================================= */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Credit Merchant Wallet
                </h3>
                <p className="text-xs text-slate-400">
                  Add manual adjustment or promotional credit
                </p>
              </div>

              <button
                type="button"
                onClick={closeWalletModal}
                disabled={walletSaving}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <HiOutlineX size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={walletAmount}
                    onChange={(e) => setWalletAmount(e.target.value)}
                    placeholder="500.00"
                    disabled={walletSaving}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-sm font-bold text-slate-800 outline-none focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason / Description *
                </label>
                <textarea
                  value={walletDescription}
                  onChange={(e) => setWalletDescription(e.target.value)}
                  placeholder="e.g. Account recharge, cashback reward, or adjustment"
                  rows={3}
                  disabled={walletSaving}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 outline-none focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={closeWalletModal}
                disabled={walletSaving}
                className="h-10 rounded-xl px-4 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={addWalletTransaction}
                disabled={walletSaving}
                className="h-10 rounded-xl bg-[#008dd2] px-5 text-xs font-bold text-white shadow-xs transition hover:bg-[#007ab6] active:scale-95 disabled:opacity-50"
              >
                {walletSaving ? "Adding..." : "Add to Wallet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDetails;