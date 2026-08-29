import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import {
  HiOutlinePlus,
  HiOutlineRefresh,
  HiOutlinePencil,
  // HiOutlineDuplicate,
  HiOutlineTrash,
  HiOutlineCog,
} from "react-icons/hi";

const API_BASE_URL = "http://localhost:5001/api";

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

  // const [success, setSuccess] = useState("");

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

  // =====================================================
  // INITIAL LOAD
  // =====================================================

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
        },
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
        },
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
            : item,
        ),
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

    toast.success(
      "Rate card deleted successfully."
    );

    await fetchRateCards();

  } catch (err) {
    console.error(
      "Delete rate card error:",
      err
    );

    toast.error(
      err.message ||
      "Failed to delete rate card"
    );
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
  // PAGE
  // =====================================================

  return (
    <div className="p-7">
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mb-7 flex items-start justify-between">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#008dd2]">
            Pricing
          </p>

          <h1 className="text-2xl font-semibold text-slate-900">Rate Cards</h1>

          <p className="mt-1 text-sm text-slate-500">
            Create and manage customer shipping rate cards.
          </p>
        </div>

        {/* HEADER ACTIONS */}

        <div className="flex items-center gap-2">
          {/* REFRESH */}

          <button
            type="button"
            onClick={handleRefresh}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-[#008dd2]/30 hover:text-[#008dd2]"
            title="Refresh"
          >
            <HiOutlineRefresh size={19} />
          </button>

          {/* ADD NEW */}

          <button
            type="button"
            onClick={() => {
              setName("");
              setError("");

              setShowAddModal(true);
            }}
            className="flex h-10 items-center gap-2 rounded-lg bg-[#008dd2] px-4 text-sm font-medium text-white shadow-sm transition hover:bg-[#007fbd]"
          >
            <HiOutlinePlus size={18} />
            Add New
          </button>
        </div>
      </div>

      {/* ================================================= */}
      {/* ERROR */}
      {/* ================================================= */}

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="ml-4 text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ================================================= */}
      {/* SUCCESS */}
      {/* ================================================= */}


      {/* ================================================= */}
      {/* TABLE CARD */}
      {/* ================================================= */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {/* TABLE HEADER */}

        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-800">
            All Rate Cards
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            {rateCards.length}{" "}
            {rateCards.length === 1 ? "rate card" : "rate cards"}
          </p>
        </div>

        {/* ================================================= */}
        {/* TABLE */}
        {/* ================================================= */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px]">
            {/* TABLE HEAD */}

            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  ID
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Rate Card
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            {/* TABLE BODY */}

            <tbody>
              {rateCards.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-5 py-16 text-center">
                    <p className="text-sm font-medium text-slate-600">
                      No rate cards found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Create your first rate card.
                    </p>
                  </td>
                </tr>
              ) : (
                rateCards.map((card) => {
                  const active = Number(card.is_active) === 1;

                  return (
                    <tr
                      key={card.id}
                      className="border-b border-slate-100 last:border-0 transition hover:bg-slate-50/40"
                    >
                      {/* =========================== */}
                      {/* ID */}
                      {/* =========================== */}

                      <td className="px-5 py-4 text-sm text-slate-500">
                        #{card.id}
                      </td>

                      {/* =========================== */}
                      {/* RATE CARD */}
                      {/* =========================== */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#008dd2]/10 text-[#008dd2]">
                            <HiOutlineCog size={19} />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {card.name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">B2C</p>
                          </div>
                        </div>
                      </td>

                      {/* =========================== */}
                      {/* STATUS */}
                      {/* =========================== */}

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => toggleStatus(card)}
                          className="flex items-center gap-2"
                        >
                          <span
                            className={`relative inline-flex h-6 w-10 items-center rounded-full transition ${
                              active ? "bg-[#008dd2]" : "bg-slate-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition ${
                                active
                                  ? "translate-x-[18px]"
                                  : "translate-x-[2px]"
                              }`}
                            />
                          </span>

                          <span
                            className={`text-xs font-medium ${
                              active ? "text-[#008dd2]" : "text-slate-400"
                            }`}
                          >
                            {active ? "Active" : "Inactive"}
                          </span>
                        </button>
                      </td>

                      {/* =========================== */}
                      {/* ACTIONS */}
                      {/* =========================== */}

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* -------------------------------- */}
                          {/* SET RATE */}
                          {/* -------------------------------- */}

                          <button
                            type="button"
                            onClick={() => openSetRate(card.id)}
                            className="h-8 rounded-lg bg-[#008dd2]/8 px-3 text-xs font-medium text-[#008dd2] transition hover:bg-[#008dd2]/15"
                          >
                            Set Rate
                          </button>

                          {/* -------------------------------- */}
                          {/* EDIT */}
                          {/* -------------------------------- */}

                          <button
                            type="button"
                            onClick={() => {
                              setEditingCard(card);
                              setName(card.name || "");
                              setError("");
                              setShowAddModal(true);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[#008dd2]"
                            title="Edit"
                          >
                            <HiOutlinePencil size={17} />
                          </button>

                          {/* -------------------------------- */}
                          {/* DELETE */}
                          {/* -------------------------------- */}

                          <button
                            type="button"
                            onClick={() => deleteRateCard(card)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                            title="Delete"
                          >
                            <HiOutlineTrash size={17} />
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
      {/* ADD RATE CARD MODAL */}
      {/* ================================================= */}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {editingCard ? "Edit Rate Card" : "Add Rate Card"}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {editingCard
                    ? "Update the rate card name."
                    : "Create a new B2C shipping rate card."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCard(null);
                  setName("");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            {/* FORM */}

            <form onSubmit={editingCard ? updateRateCard : createRateCard}>
              <div className="px-6 py-6">
                <label className="mb-2 block text-xs font-medium text-slate-600">
                  Rate Card Name
                </label>

                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter rate card name"
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
                />
              </div>

              {/* MODAL FOOTER */}

              <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCard(null);
                    setName("");
                  }}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="h-9 rounded-lg bg-[#008dd2] px-4 text-xs font-medium text-white transition hover:bg-[#007fbd] disabled:cursor-not-allowed disabled:opacity-60"
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
