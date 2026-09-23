import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  HiOutlineArrowLeft,
  HiOutlineUserCircle,
  HiOutlineSave,
  HiOutlinePlus,
  HiOutlineX,
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

  // =====================================================
  // API RESPONSE HELPER
  // =====================================================

  const getJsonResponse = async (response) => {
    const contentType =
      response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return await response.json();
    }

    const text = await response.text();

    return {
      message:
        text ||
        `Request failed with status ${response.status}`,
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

      // -------------------------------------------------
      // USER
      // -------------------------------------------------

      const userResponse = await fetch(
        `${API_BASE_URL}/admin/users/${id}`
      );

      const userData =
        await getJsonResponse(userResponse);

      if (!userResponse.ok) {
        throw new Error(
          userData.message ||
            "Failed to load user"
        );
      }

      setUser(userData.user);

      setSelectedRateCard(
        userData.user.rate_card_id
          ? String(userData.user.rate_card_id)
          : ""
      );

      // -------------------------------------------------
      // RATE CARDS
      // -------------------------------------------------

      const rateCardResponse = await fetch(
        `${API_BASE_URL}/rate-cards`
      );

      const rateCardData =
        await getJsonResponse(rateCardResponse);

      if (!rateCardResponse.ok) {
        throw new Error(
          rateCardData.message ||
            "Failed to load rate cards"
        );
      }

      const activeRateCards = (
        rateCardData.rateCards || []
      ).filter(
        (rateCard) =>
          Number(rateCard.is_active) === 1
      );

      setRateCards(activeRateCards);
    } catch (err) {
      console.error(
        "Load user details error:",
        err
      );

      setError(
        err.message ||
          "Unable to load user details"
      );
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

      const response = await fetch(
        `${API_BASE_URL}/admin/users/${id}/wallet`
      );

      const data =
        await getJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load wallet"
        );
      }

      setTransactions(
        Array.isArray(data.transactions)
          ? data.transactions
          : []
      );
    } catch (err) {
      console.error(
        "Load wallet error:",
        err
      );

      setError(
        err.message ||
          "Unable to load wallet"
      );
    } finally {
      setWalletLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadData();
  }, [id]);

  // =====================================================
  // LOAD WALLET WHEN TAB OPENS
  // =====================================================

  useEffect(() => {
    if (
      activeTab === "wallet" &&
      user?.id
    ) {
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
            rate_card_id: selectedRateCard
              ? Number(selectedRateCard)
              : null,
          }),
        }
      );

      const data =
        await getJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save rate card"
        );
      }

      setUser(data.user);

      setSelectedRateCard(
        data.user.rate_card_id
          ? String(data.user.rate_card_id)
          : ""
      );

      setSuccess(
        "Rate card saved successfully"
      );
    } catch (err) {
      console.error(
        "Save rate card error:",
        err
      );

      setError(
        err.message ||
          "Unable to save rate card"
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // ADD WALLET TRANSACTION
  // =====================================================

  const addWalletTransaction = async () => {
    const amount = Number(walletAmount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        "Please enter a valid amount"
      );
      return;
    }

    if (
      !String(walletDescription).trim()
    ) {
      setError(
        "Please enter a description"
      );
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
            description:
              String(walletDescription).trim(),
          }),
        }
      );

      const data =
        await getJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to add wallet transaction"
        );
      }

      setShowWalletModal(false);

      setWalletAmount("");
      setWalletDescription("");

      setSuccess(
        "Wallet transaction added successfully"
      );

      await loadWallet();
    } catch (err) {
      console.error(
        "Add wallet transaction error:",
        err
      );

      setError(
        err.message ||
          "Unable to add wallet transaction"
      );
    } finally {
      setWalletSaving(false);
    }
  };

  // =====================================================
  // CLOSE WALLET MODAL
  // =====================================================

  const closeWalletModal = () => {
    if (walletSaving) return;

    setShowWalletModal(false);
    setWalletAmount("");
    setWalletDescription("");
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="p-7">
        <div className="flex h-64 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#008dd2]" />
        </div>
      </div>
    );
  }

  // =====================================================
  // USER NOT FOUND
  // =====================================================

  if (!user) {
    return (
      <div className="p-7">
        <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error || "User not found"}
        </div>

        <button
          type="button"
          onClick={() => navigate("/users")}
          className="mt-4 flex items-center gap-2 text-sm font-medium text-[#008dd2]"
        >
          <HiOutlineArrowLeft size={17} />
          Back to All Users
        </button>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-w-0 p-7">
      {/* ================================================= */}
      {/* BACK */}
      {/* ================================================= */}

      <button
        type="button"
        onClick={() => navigate("/users")}
        className="mb-5 flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-[#008dd2]"
      >
        <HiOutlineArrowLeft size={17} />
        Back to All Users
      </button>

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mb-7">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#008dd2]">
          User Account
        </p>

        <h1 className="text-2xl font-semibold text-slate-900">
          {user.full_name}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage user information, Rate Card and wallet
          transactions.
        </p>
      </div>

      {/* ================================================= */}
      {/* ALERTS */}
      {/* ================================================= */}

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="ml-4 text-red-400 hover:text-red-600"
          >
            <HiOutlineX size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="ml-4 text-emerald-400 hover:text-emerald-600"
          >
            <HiOutlineX size={16} />
          </button>
        </div>
      )}

      {/* ================================================= */}
      {/* CONTENT GRID */}
      {/* ================================================= */}

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
        {/* ================================================= */}
        {/* USER PROFILE CARD */}
        {/* ================================================= */}

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          {/* AVATAR */}

          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#008dd2]/10 text-[#008dd2]">
              {user.profile_image ? (
                <img
                  src={user.profile_image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <HiOutlineUserCircle size={38} />
              )}
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-slate-900">
                {user.full_name}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                User #{user.id}
              </p>
            </div>
          </div>

          {/* DETAILS */}

          <div className="border-t border-slate-100 pt-4">
            <div className="py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Email
              </p>

              <p className="mt-1 break-all text-sm text-slate-700">
                {user.email || "—"}
              </p>
            </div>

            <div className="border-t border-slate-100 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Phone
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {user.phone_no || "—"}
              </p>
            </div>

            <div className="border-t border-slate-100 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Company
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {user.company_name || "—"}
              </p>
            </div>

            <div className="border-t border-slate-100 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                GST Number
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {user.gst_no || "—"}
              </p>
            </div>

            <div className="border-t border-slate-100 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Role
              </p>

              <span className="mt-1 inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium capitalize text-slate-600">
                {user.role || "user"}
              </span>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* MAIN CARD */}
        {/* ================================================= */}

        <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* ================================================= */}
          {/* TABS */}
          {/* ================================================= */}

          <div className="flex border-b border-slate-100 px-6">
            <button
              type="button"
              onClick={() =>
                setActiveTab("account")
              }
              className={`relative mr-7 px-1 py-4 text-sm font-medium transition ${
                activeTab === "account"
                  ? "text-[#008dd2]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Account Settings

              {activeTab === "account" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#008dd2]" />
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveTab("wallet")
              }
              className={`relative px-1 py-4 text-sm font-medium transition ${
                activeTab === "wallet"
                  ? "text-[#008dd2]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Wallet

              {activeTab === "wallet" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#008dd2]" />
              )}
            </button>
          </div>

          {/* ================================================= */}
          {/* ACCOUNT SETTINGS */}
          {/* ================================================= */}

          {activeTab === "account" && (
            <>
              <div className="border-b border-slate-100 px-6 py-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#008dd2]">
                  Account Settings
                </p>

                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  Rate Card
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Assign a Rate Card to this user.
                </p>
              </div>

              <div className="p-6">
                <div className="max-w-[520px]">
                  <label className="mb-2 block text-xs font-medium text-slate-700">
                    Rate Card
                  </label>

                  <select
                    value={selectedRateCard}
                    onChange={(e) =>
                      setSelectedRateCard(
                        e.target.value
                      )
                    }
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
                  >
                    <option value="">
                      Not Assigned
                    </option>

                    {rateCards.map(
                      (rateCard) => (
                        <option
                          key={rateCard.id}
                          value={rateCard.id}
                        >
                          {rateCard.name}
                        </option>
                      )
                    )}
                  </select>

                  <p className="mt-2 text-xs text-slate-400">
                    Only active Rate Cards are
                    available for assignment.
                  </p>
                </div>

                <div className="my-7 border-t border-slate-100" />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={saveRateCard}
                    disabled={saving}
                    className="flex h-10 items-center gap-2 rounded-lg bg-[#008dd2] px-5 text-xs font-semibold text-white transition hover:bg-[#007fbd] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <HiOutlineSave size={17} />

                    {saving
                      ? "Saving..."
                      : "Save"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ================================================= */}
          {/* WALLET */}
          {/* ================================================= */}

          {activeTab === "wallet" && (
            <div className="min-w-0">
              {/* WALLET HEADER */}

              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#008dd2]">
                    Wallet
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-slate-900">
                    Wallet Log
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    View all wallet transactions for
                    this user.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowWalletModal(true)
                  }
                  className="ml-4 flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#008dd2] px-4 text-xs font-semibold text-white transition hover:bg-[#007fbd]"
                >
                  <HiOutlinePlus size={17} />
                  Add Wallet Transaction
                </button>
              </div>

              {/* ================================================= */}
              {/* WALLET TABLE */}
              {/* ================================================= */}

              <div className="w-full overflow-hidden">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[7%]" />
                    <col className="w-[11%]" />
                    <col className="w-[10%]" />
                    <col className="w-[15%]" />
                    <col className="w-[15%]" />
                    <col className="w-[22%]" />
                    <col className="w-[20%]" />
                  </colgroup>

                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      {/* 1. ID */}

                      <th className="px-3 py-3.5 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                        ID
                      </th>

                      {/* 2. AMOUNT */}

                      <th className="px-3 py-3.5 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                        Amount
                      </th>

                      {/* 3. TYPE */}

                      <th className="px-3 py-3.5 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                        Type
                      </th>

                      {/* 4. OPENING BALANCE */}

                      <th className="px-3 py-3.5 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                        Opening Balance
                      </th>

                      {/* 5. CLOSING BALANCE */}

                      <th className="px-3 py-3.5 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                        Closing Balance
                      </th>

                      {/* 6. DESCRIPTION */}

                      <th className="px-3 py-3.5 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                        Description
                      </th>

                      {/* 7. CREATED AT */}

                      <th className="px-3 py-3.5 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                        Created At
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {/* LOADING */}

                    {walletLoading && (
                      <tr>
                        <td
                          colSpan="7"
                          className="px-4 py-14 text-center"
                        >
                          <div className="flex flex-col items-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#008dd2]" />

                            <span className="mt-3 text-xs text-slate-400">
                              Loading transactions...
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* EMPTY */}

                    {!walletLoading &&
                      transactions.length ===
                        0 && (
                        <tr>
                          <td
                            colSpan="7"
                            className="px-4 py-14 text-center"
                          >
                            <p className="text-sm font-medium text-slate-500">
                              No wallet transactions
                              found.
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Wallet activity will
                              appear here.
                            </p>
                          </td>
                        </tr>
                      )}

                    {/* TRANSACTIONS */}

                    {!walletLoading &&
                      transactions.map(
                        (transaction) => {
                          const type =
                            String(
                              transaction.type ||
                                ""
                            ).toUpperCase();

                          const isDebit =
                            type === "DEBIT";

                          return (
                            <tr
                              key={
                                transaction.id
                              }
                              className="transition-colors hover:bg-slate-50/70"
                            >
                              {/* ID */}

                              <td className="overflow-hidden px-3 py-4">
                                <span className="block truncate text-[11px] font-semibold text-slate-700">
                                  #{transaction.id}
                                </span>
                              </td>

                              {/* AMOUNT */}

                              <td className="overflow-hidden px-3 py-4">
                                <span
                                  className={`block truncate text-[11px] font-semibold ${
                                    isDebit
                                      ? "text-red-600"
                                      : "text-emerald-600"
                                  }`}
                                >
                                  {isDebit
                                    ? "-"
                                    : "+"}
                                  {formatAmount(
                                    transaction.amount
                                  )}
                                </span>
                              </td>

                              {/* TYPE */}

                              <td className="overflow-hidden px-3 py-4">
                                <span
                                  className={`inline-flex max-w-full rounded-full border px-2 py-1 text-[9px] font-semibold ${
                                    isDebit
                                      ? "border-red-100 bg-red-50 text-red-600"
                                      : "border-emerald-100 bg-emerald-50 text-emerald-600"
                                  }`}
                                >
                                  {isDebit
                                    ? "Debit"
                                    : "Credit"}
                                </span>
                              </td>

                              {/* OPENING BALANCE */}

                              <td className="overflow-hidden px-3 py-4">
                                <span className="block truncate text-[11px] text-slate-600">
                                  {transaction.opening_balance !==
                                    null &&
                                  transaction.opening_balance !==
                                    undefined
                                    ? formatAmount(
                                        transaction.opening_balance
                                      )
                                    : "—"}
                                </span>
                              </td>

                              {/* CLOSING BALANCE */}

                              <td className="overflow-hidden px-3 py-4">
                                <span className="block truncate text-[11px] font-medium text-slate-700">
                                  {transaction.closing_balance !==
                                    null &&
                                  transaction.closing_balance !==
                                    undefined
                                    ? formatAmount(
                                        transaction.closing_balance
                                      )
                                    : "—"}
                                </span>
                              </td>

                              {/* DESCRIPTION */}

                              <td className="overflow-hidden px-3 py-4">
                                <p
                                  title={
                                    transaction.description ||
                                    ""
                                  }
                                  className="line-clamp-2 text-[11px] leading-4 text-slate-600"
                                >
                                  {transaction.description ||
                                    "—"}
                                </p>
                              </td>

                              {/* CREATED AT */}

                              <td className="overflow-hidden px-3 py-4">
                                <span
                                  title={formatCreatedAt(
                                    transaction.created_at
                                  )}
                                  className="block truncate text-[10px] text-slate-500"
                                >
                                  {formatCreatedAt(
                                    transaction.created_at
                                  )}
                                </span>
                              </td>
                            </tr>
                          );
                        }
                      )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================================================= */}
      {/* ADD WALLET TRANSACTION MODAL */}
      {/* ================================================= */}

      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl">
            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Add Wallet Transaction
                </h3>

                <p className="mt-0.5 text-xs text-slate-400">
                  Add money to this user's wallet.
                </p>
              </div>

              <button
                type="button"
                onClick={closeWalletModal}
                disabled={walletSaving}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <HiOutlineX size={18} />
              </button>
            </div>

            {/* MODAL BODY */}

            <div className="space-y-5 p-5">
              {/* AMOUNT */}

              <div>
                <label className="mb-2 block text-xs font-medium text-slate-700">
                  Amount
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={walletAmount}
                    onChange={(e) =>
                      setWalletAmount(
                        e.target.value
                      )
                    }
                    placeholder="Enter amount"
                    disabled={walletSaving}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10 disabled:bg-slate-50"
                  />
                </div>
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="mb-2 block text-xs font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  value={walletDescription}
                  onChange={(e) =>
                    setWalletDescription(
                      e.target.value
                    )
                  }
                  placeholder="Enter transaction description"
                  rows={4}
                  disabled={walletSaving}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10 disabled:bg-slate-50"
                />
              </div>
            </div>

            {/* MODAL FOOTER */}

            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={closeWalletModal}
                disabled={walletSaving}
                className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={
                  addWalletTransaction
                }
                disabled={walletSaving}
                className="h-10 rounded-lg bg-[#008dd2] px-5 text-xs font-semibold text-white transition hover:bg-[#007fbd] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {walletSaving
                  ? "Saving..."
                  : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDetails;