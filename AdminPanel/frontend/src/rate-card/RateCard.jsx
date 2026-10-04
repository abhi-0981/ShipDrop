import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  HiOutlinePlus,
  HiOutlineRefresh,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCog,
  HiOutlineX,
  HiOutlineAdjustments,
} from "react-icons/hi";
import { API_BASE_URL } from "../config/api";

function RateCard() {
  const navigate = useNavigate();

  // =====================================================
  // STATES
  // =====================================================

  const [rateCards, setRateCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  // =====================================================
  // LOAD RATE CARDS
  // =====================================================

  const fetchRateCards = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/rate-cards`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load rate cards");
      }

      setRateCards(data.rateCards || []);
    } catch (err) {
      console.error("Fetch rate cards error:", err);
      setError(err.message || "Unable to fetch rate cards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRateCards();
  }, []);

  // =====================================================
  // CREATE RATE CARD
  // =====================================================

  const createRateCard = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Rate card name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/rate-cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create rate card");
      }

      setShowAddModal(false);
      setName("");
      toast.success("Rate card created successfully.");
      await fetchRateCards();
    } catch (err) {
      console.error("Create rate card error:", err);
      setError(err.message || "Failed to create rate card");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // UPDATE RATE CARD
  // =====================================================

  const updateRateCard = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Rate card name is required.");
      return;
    }

    if (!editingCard) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/rate-cards/${editingCard.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update rate card");
      }

      setShowAddModal(false);
      setEditingCard(null);
      setName("");
      toast.success("Rate card updated successfully.");
      await fetchRateCards();
    } catch (err) {
      console.error("Update rate card error:", err);
      setError(err.message || "Failed to update rate card");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // STATUS TOGGLE
  // =====================================================

  const toggleStatus = async (card) => {
    try {
      setError("");
      const newStatus = Number(card.is_active) === 1 ? false : true;

      const response = await fetch(
        `${API_BASE_URL}/rate-cards/${card.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_active: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update status");
      }

      setRateCards((prev) =>
        prev.map((item) =>
          item.id === card.id
            ? {
                ...item,
                is_active: newStatus ? 1 : 0,
              }
            : item
        )
      );
    } catch (err) {
      console.error("Toggle status error:", err);
      setError(err.message || "Failed to update status");
    }
  };

  // =====================================================
  // DELETE RATE CARD
  // =====================================================

  const deleteRateCard = async (card) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${card.name}"?\n\nThis will permanently delete this rate card and all its rates.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/rate-cards/${card.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete rate card"
        );
      }

      toast.success("Rate card deleted successfully.");
      await fetchRateCards();
    } catch (err) {
      console.error("Delete rate card error:", err);
      toast.error(err.message || "Failed to delete rate card");
    }
  };

  // =====================================================
  // OPEN SET RATE
  // =====================================================

  const openSetRate = (cardId) => {
    navigate(`/rate-card/${cardId}/set-rate`);
  };

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = async () => {
    await fetchRateCards();
  };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (loading) {
    return (
      <div className="p-4 sm:p-7 min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2.5">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#008dd2]" />
          <p className="text-xs font-medium text-slate-400">Loading rate cards...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE RENDER
  // =====================================================

  return (
    <div className="p-3.5 sm:p-6 md:p-7 max-w-7xl mx-auto pb-24 lg:pb-8">
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mb-4 sm:mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="mb-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#008dd2]">
            Pricing
          </p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Rate Cards
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-400">
            Create and manage merchant shipping rate plans
          </p>
        </div>

        {/* HEADER ACTIONS */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="flex h-9.5 w-9.5 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-xs transition hover:border-[#008dd2]/40 hover:text-[#008dd2] active:scale-95"
            title="Refresh Rate Cards"
          >
            <HiOutlineRefresh size={18} />
          </button>

          <button
            type="button"
            onClick={() => {
              setName("");
              setEditingCard(null);
              setError("");
              setShowAddModal(true);
            }}
            className="flex h-9.5 sm:h-10 items-center gap-1.5 rounded-xl bg-[#008dd2] px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-[#007ab6] active:scale-95 shrink-0"
          >
            <HiOutlinePlus size={16} />
            <span>Add New</span>
          </button>
        </div>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs sm:text-sm text-rose-600 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            className="font-bold underline ml-2 text-rose-500 hover:text-rose-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ================================================= */}
      {/* 1. MOBILE VIEW: APP-STYLE CARD TILES */}
      {/* ================================================= */}

      <div className="space-y-3 sm:hidden">
        {rateCards.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400">
            <HiOutlineCog size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-bold text-slate-700">No rate cards found</p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Create your first shipping rate card to assign to merchants.
            </p>
          </div>
        ) : (
          rateCards.map((card) => {
            const active = Number(card.is_active) === 1;

            return (
              <div
                key={card.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs space-y-3"
              >
                {/* TOP ROW: TITLE, BADGE & TOGGLE */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#008dd2]/10 text-[#008dd2]">
                      <HiOutlineCog size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {card.name}
                        </p>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold text-slate-600">
                          B2C
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        ID #{card.id}
                      </p>
                    </div>
                  </div>

                  {/* ACTIVE / INACTIVE SWITCH */}
                  <button
                    type="button"
                    onClick={() => toggleStatus(card)}
                    className="flex items-center gap-1.5 shrink-0"
                  >
                    <span
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                        active ? "bg-[#008dd2]" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white shadow-xs transition ${
                          active ? "translate-x-[18px]" : "translate-x-[2px]"
                        }`}
                      />
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        active ? "text-[#008dd2]" : "text-slate-400"
                      }`}
                    >
                      {active ? "Active" : "Off"}
                    </span>
                  </button>
                </div>

                {/* BOTTOM ACTIONS: TOUCH OPTIMIZED */}
                <div className="flex items-center justify-between pt-0.5">
                  <button
                    type="button"
                    onClick={() => openSetRate(card.id)}
                    className="flex items-center gap-1.5 rounded-xl bg-[#008dd2]/10 px-3.5 py-2 text-xs font-bold text-[#008dd2] transition active:scale-95"
                  >
                    <HiOutlineAdjustments size={14} />
                    <span>Set Rates</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCard(card);
                        setName(card.name || "");
                        setError("");
                        setShowAddModal(true);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-[#008dd2] hover:bg-slate-50 active:scale-90 transition"
                      title="Edit"
                    >
                      <HiOutlinePencil size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteRateCard(card)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 active:scale-90 transition"
                      title="Delete"
                    >
                      <HiOutlineTrash size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================================================= */}
      {/* 2. DESKTOP & TABLET VIEW: STRUCTURED TABLE */}
      {/* ================================================= */}

      <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/50">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              All Rate Plans
            </h2>
            <p className="text-[11px] text-slate-400">
              {rateCards.length} {rateCards.length === 1 ? "rate card" : "rate cards"} configured
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3.5 w-24">ID</th>
                <th className="px-5 py-3.5">Rate Card Plan</th>
                <th className="px-5 py-3.5 w-36">Status</th>
                <th className="px-5 py-3.5 text-right w-48">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {rateCards.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-5 py-16 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-700">No rate cards found</p>
                    <p className="mt-1 text-xs text-slate-400">Create your first shipping rate card.</p>
                  </td>
                </tr>
              ) : (
                rateCards.map((card) => {
                  const active = Number(card.is_active) === 1;

                  return (
                    <tr
                      key={card.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      {/* ID */}
                      <td className="px-5 py-3.5 font-mono text-slate-500 font-semibold">
                        #{card.id}
                      </td>

                      {/* NAME */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#008dd2]/10 text-[#008dd2]">
                            <HiOutlineCog size={19} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {card.name}
                            </p>
                            <span className="text-[10px] font-semibold text-slate-400">B2C Surface & Air</span>
                          </div>
                        </div>
                      </td>

                      {/* STATUS TOGGLE */}
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => toggleStatus(card)}
                          className="flex items-center gap-2"
                        >
                          <span
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                              active ? "bg-[#008dd2]" : "bg-slate-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 rounded-full bg-white shadow-xs transition ${
                                active ? "translate-x-[18px]" : "translate-x-[2px]"
                              }`}
                            />
                          </span>

                          <span
                            className={`text-xs font-bold ${
                              active ? "text-[#008dd2]" : "text-slate-400"
                            }`}
                          >
                            {active ? "Active" : "Inactive"}
                          </span>
                        </button>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openSetRate(card.id)}
                            className="h-8 rounded-lg bg-[#008dd2]/10 px-3 text-xs font-bold text-[#008dd2] transition hover:bg-[#008dd2]/20 active:scale-95"
                          >
                            Set Rate
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingCard(card);
                              setName(card.name || "");
                              setError("");
                              setShowAddModal(true);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-[#008dd2] transition"
                            title="Edit"
                          >
                            <HiOutlinePencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteRateCard(card)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"
                            title="Delete"
                          >
                            <HiOutlineTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================= */}
      {/* ADD / EDIT MODAL (RESPONSIVE BOTTOM SHEET ON MOBILE) */}
      {/* ================================================= */}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/50 p-0 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingCard ? "Edit Rate Card" : "Add Rate Card"}
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  {editingCard
                    ? "Update the rate card name"
                    : "Create a new B2C shipping rate card"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCard(null);
                  setName("");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <HiOutlineX size={18} />
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={editingCard ? updateRateCard : createRateCard}>
              <div className="p-5 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Rate Card Name *
                </label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Standard Tier, Silver Merchant, VIP"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs sm:text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
                />
              </div>

              {/* FOOTER */}
              <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCard(null);
                    setName("");
                  }}
                  className="h-9.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="h-9.5 rounded-xl bg-[#008dd2] px-5 text-xs font-bold text-white transition hover:bg-[#007ab6] active:scale-95 disabled:opacity-50"
                >
                  {saving
                    ? editingCard
                      ? "Updating..."
                      : "Creating..."
                    : editingCard
                    ? "Update Rate Card"
                    : "Create Rate Card"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RateCard;