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
  HiOutlineSwitchHorizontal,
  HiOutlineShieldCheck,
  HiOutlineExclamation,
  HiOutlineExternalLink,
  HiOutlineCheckCircle,
} from "react-icons/hi";
import toast from "react-hot-toast";
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

  // Impersonation modal states
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [impersonateReason, setImpersonateReason] = useState(
    "Customer Support / Troubleshooting"
  );
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonateError, setImpersonateError] = useState("");
  const [directRedirectUrl, setDirectRedirectUrl] = useState("");

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
  // LOGIN AS USER (IMPERSONATION)
  // =====================================================

  const handleConfirmImpersonate = async () => {
    if (!user) return;

    // 1. Immediately open a blank new tab in direct response to the click event.
    // This completely bypasses browser popup blockers on Chrome, Edge, Safari, and Firefox.
    const newTab = window.open("about:blank", "_blank");
    if (newTab) {
      try {
        newTab.document.title = `Opening ${user.full_name || "Merchant"} Dashboard...`;
        newTab.document.body.innerHTML = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f8fafc; color: #334155;">
            <div style="width: 44px; height: 44px; border: 3px solid #e2e8f0; border-top-color: #008dd2; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            <h3 style="margin-top: 20px; margin-bottom: 6px; font-size: 16px; font-weight: 600; color: #0f172a;">Connecting to Merchant Dashboard...</h3>
            <p style="margin: 0; font-size: 13px; color: #64748b;">Authenticating support credentials for ${user.full_name || "Merchant"}...</p>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
          </div>
        `;
      } catch (e) {
        // Fallback for about:blank access restrictions
      }
    }

    try {
      setIsImpersonating(true);
      setImpersonateError("");
      setDirectRedirectUrl("");

      const adminToken =
        localStorage.getItem("adminToken") ||
        localStorage.getItem("token") ||
        localStorage.getItem("admin_token");

      if (!adminToken) {
        throw new Error("Admin session not found. Please log in again.");
      }

      // Compute client URL dynamically
      const origin = window.location.origin;
      const userAppUrl = origin.includes("localhost")
        ? origin.replace(":5174", ":5173")
        : "https://parceldrop.in";

      const response = await fetch(
        `${API_BASE_URL}/admin/impersonate/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            target_user_id: user.id,
            reason: impersonateReason.trim() || "Customer Support / Troubleshooting",
            admin_return_url: window.location.href,
            user_app_url: userAppUrl,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || `Failed to start impersonation session (Status: ${response.status})`
        );
      }

      toast.success(
        `Opening dashboard for ${user.full_name || "Merchant"} in new tab...`
      );

      if (data.redirect_url) {
        setDirectRedirectUrl(data.redirect_url);

        // Redirect the already-opened new tab
        if (newTab && !newTab.closed) {
          newTab.location.href = data.redirect_url;
        } else {
          // If popup was somehow blocked, try window.open directly
          const fallbackWin = window.open(data.redirect_url, "_blank");
          if (!fallbackWin) {
            // Popup blocker intercepted: direct clickable link will remain visible in the modal
            return;
          }
        }
      }

      // Close modal smoothly after brief moment
      setTimeout(() => {
        setShowImpersonateModal(false);
      }, 700);
    } catch (err) {
      console.error("Impersonation error:", err);
      if (newTab && !newTab.closed) {
        newTab.close();
      }
      setImpersonateError(err.message || "Failed to switch to user dashboard");
      toast.error(err.message || "Impersonation failed");
    } finally {
      setIsImpersonating(false);
    }
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

          <div>
            <button
              type="button"
              onClick={() => {
                setImpersonateReason("Customer Support / Troubleshooting");
                setImpersonateError("");
                setShowImpersonateModal(true);
              }}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#008dd2]/30 bg-[#008dd2]/10 px-3.5 text-xs font-bold text-[#008dd2] transition hover:bg-[#008dd2] hover:text-white active:scale-95 shadow-2xs"
            >
              <HiOutlineSwitchHorizontal size={16} />
              <span>Login as User</span>
            </button>
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

      {/* ================================================= */}
      {/* CONFIRMATION MODAL: LOGIN AS USER (IMPERSONATION) */}
      {/* ================================================= */}
      {showImpersonateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => !isImpersonating && setShowImpersonateModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
          >
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#008dd2]/10 text-[#008dd2]">
                  <HiOutlineShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                    Login as User (Support Mode)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Authorized troubleshooting access to merchant dashboard
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isImpersonating}
                onClick={() => setShowImpersonateModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <HiOutlineX size={18} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-5 space-y-4">
              {/* TARGET USER CARD */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Target Merchant Account
                  </span>
                  <span className="font-mono text-[10px] font-bold text-[#008dd2] bg-[#008dd2]/10 px-2 py-0.5 rounded-md">
                    UID #{user.id}
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#008dd2]/10 text-[#008dd2]">
                    {user.profile_image ? (
                      <img
                        src={user.profile_image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <HiOutlineUserCircle size={24} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {user.full_name || "Merchant"}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {user.email || "No email"}
                    </p>
                    {user.company_name && (
                      <p className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">
                        {user.company_name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* WARNING NOTICE */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 flex items-start gap-2.5 text-amber-900">
                <HiOutlineExclamation
                  size={18}
                  className="shrink-0 text-amber-600 mt-0.5"
                />
                <div className="text-[11.5px] leading-relaxed">
                  <p className="font-bold text-amber-800">
                    Authorized Troubleshooting Notice
                  </p>
                  <p className="mt-0.5 text-amber-700">
                    You are accessing this merchant's account without requiring their password. All actions taken will be recorded in the security audit log with your Administrator ID. Sensitive actions like resetting passwords are automatically restricted.
                  </p>
                </div>
              </div>

              {/* REASON INPUT */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Reason for Access (Audit Trail)
                </label>
                <input
                  type="text"
                  value={impersonateReason}
                  onChange={(e) => setImpersonateReason(e.target.value)}
                  disabled={isImpersonating}
                  placeholder="e.g. Troubleshooting shipment tracking issue..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              {/* ERROR NOTICE */}
              {impersonateError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center justify-between">
                  <span>{impersonateError}</span>
                  <button
                    type="button"
                    onClick={() => setImpersonateError("")}
                    className="text-rose-400 hover:text-rose-600 font-bold ml-2"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* SUCCESS / DIRECT OPEN LINK */}
              {directRedirectUrl && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-800 text-xs font-bold">
                    <HiOutlineCheckCircle size={18} className="text-emerald-600 shrink-0" />
                    <span>Support Session Ready!</span>
                  </div>
                  <p className="text-[11.5px] text-emerald-700">
                    If the merchant dashboard did not open automatically in a new tab:
                  </p>
                  <a
                    href={directRedirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#008dd2] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#007cb8] transition"
                  >
                    <HiOutlineExternalLink size={15} />
                    <span>Open Merchant Dashboard in New Tab &rarr;</span>
                  </a>
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/80 px-5 py-3.5">
              <button
                type="button"
                disabled={isImpersonating}
                onClick={() => setShowImpersonateModal(false)}
                className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isImpersonating}
                onClick={handleConfirmImpersonate}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#008dd2] px-4 text-xs font-bold text-white shadow-xs transition hover:bg-[#007cb8] active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
              >
                {isImpersonating ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>Accessing Dashboard...</span>
                  </>
                ) : (
                  <>
                    <HiOutlineSwitchHorizontal size={16} />
                    <span>Confirm & Login as User</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDetails;