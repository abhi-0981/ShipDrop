import React, { useEffect, useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  HiOutlineIdentification,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineExclamation,
  HiOutlineX,
  HiOutlineCube,
} from "react-icons/hi";
import api from "../../services/api";

const PRIMARY = "#008dd2";

function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name) {
  if (!name) return "PI";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function PartyIdentities() {
  const [identities, setIdentities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [editingIdentity, setEditingIdentity] = useState(null);
  const [identityName, setIdentityName] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingIdentity, setDeletingIdentity] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load identities from backend API
  const fetchIdentities = async () => {
    try {
      setLoading(true);
      const response = await api.get("/party-identities");
      if (response?.data?.success) {
        setIdentities(response.data.partyIdentities || []);
      } else {
        throw new Error(response?.data?.message || "Failed to load party identities");
      }
    } catch (error) {
      console.error("Fetch party identities error:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load party identities"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdentities();
  }, []);

  // Filtered identities based on search
  const filteredIdentities = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return identities;
    return identities.filter((item) =>
      item.name?.toLowerCase().includes(query)
    );
  }, [identities, searchTerm]);

  // Total linked orders across all identities
  const totalLinkedOrders = useMemo(() => {
    return identities.reduce((sum, item) => sum + (Number(item.linked_orders_count) || 0), 0);
  }, [identities]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode("create");
    setEditingIdentity(null);
    setIdentityName("");
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (identity) => {
    setModalMode("edit");
    setEditingIdentity(identity);
    setIdentityName(identity.name || "");
    setShowModal(true);
  };

  // Open Delete Confirmation Modal
  const handleOpenDelete = (identity) => {
    setDeletingIdentity(identity);
    setShowDeleteModal(true);
  };

  // Submit Create or Edit Form
  const handleSaveIdentity = async (e) => {
    e?.preventDefault();
    const cleanName = identityName.trim();

    if (!cleanName) {
      toast.error("Please enter a party identity name");
      return;
    }

    if (cleanName.length > 100) {
      toast.error("Party identity name must not exceed 100 characters");
      return;
    }

    // Client-side quick duplicate check
    const duplicate = identities.find(
      (item) =>
        item.name.toLowerCase() === cleanName.toLowerCase() &&
        (modalMode === "create" || item.id !== editingIdentity?.id)
    );

    if (duplicate) {
      toast.error(`A party identity named "${cleanName}" already exists`);
      return;
    }

    try {
      setSaving(true);

      if (modalMode === "create") {
        const response = await api.post("/party-identities", {
          name: cleanName,
        });

        if (!response?.data?.success) {
          throw new Error(response?.data?.message || "Failed to create party identity");
        }

        toast.success(`Party identity "${cleanName}" created successfully!`);
      } else {
        const response = await api.put(`/party-identities/${editingIdentity.id}`, {
          name: cleanName,
        });

        if (!response?.data?.success) {
          throw new Error(response?.data?.message || "Failed to update party identity");
        }

        toast.success(`Party identity renamed to "${cleanName}" successfully!`);
      }

      setShowModal(false);
      setEditingIdentity(null);
      setIdentityName("");
      await fetchIdentities();
    } catch (error) {
      console.error("Save party identity error:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save party identity"
      );
    } finally {
      setSaving(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingIdentity?.id) return;

    try {
      setDeleting(true);
      const response = await api.delete(`/party-identities/${deletingIdentity.id}`);

      if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Failed to delete party identity");
      }

      toast.success(
        `Party identity "${deletingIdentity.name}" deleted. Linked orders were safely unassigned.`
      );
      setShowDeleteModal(false);
      setDeletingIdentity(null);
      await fetchIdentities();
    } catch (error) {
      console.error("Delete party identity error:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to delete party identity"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f8fc] px-3 sm:px-4 py-4 sm:py-5 pb-24 lg:pb-8">
      <div className="mx-auto max-w-[1450px]">
        {/* ==================================================
            TOP HEADER
        ================================================== */}
        <div className="mb-3 rounded-2xl border border-slate-200 bg-white px-4 sm:px-5 py-3.5 sm:py-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: "#edf8ff",
                  color: PRIMARY,
                }}
              >
                <HiOutlineIdentification size={22} />
              </div>

              <div>
                <h1 className="text-base sm:text-[17px] font-semibold tracking-[-0.2px] text-slate-900">
                  Party Identities
                </h1>
                <p className="mt-0.5 text-xs text-slate-400">
                  Manage your custom business identities to select when creating orders.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#008dd2] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-[#007ab6] active:scale-95"
            >
              <HiOutlinePlus size={16} />
              <span>Add Party Identity</span>
            </button>
          </div>
        </div>

        {/* ==================================================
            OVERVIEW STATS CARDS
        ================================================== */}
        <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Identities
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-800">
                {identities.length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-sky-50 text-[#008dd2] flex items-center justify-center">
              <HiOutlineIdentification size={20} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Orders Assigned
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-800">
                {totalLinkedOrders}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HiOutlineCube size={20} />
            </div>
          </div>

        </div>

        {/* ==================================================
            SEARCH BAR
        ================================================== */}
        <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <HiOutlineSearch size={18} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search party identities by name (e.g. NS, ABC Traders)..."
              className="h-10.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-10 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <HiOutlineX size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ==================================================
            CONTENT: LOADING SKELETON OR TABLE
        ================================================== */}
        {loading ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="h-12 animate-pulse bg-slate-50" />
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse border-t border-slate-100"
              />
            ))}
          </div>
        ) : filteredIdentities.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-[#008dd2]">
              <HiOutlineIdentification size={28} />
            </div>
            <h3 className="mt-3 text-sm sm:text-base font-bold text-slate-800">
              {searchTerm ? "No matching party identities found" : "No party identities yet"}
            </h3>
            <p className="mt-1 max-w-md text-xs sm:text-[13px] text-slate-400">
              {searchTerm
                ? "Try searching with a different name or clear the search filter."
                : "Create party identities like 'NS', 'ABC Traders', or your store initials to tag and distinguish orders."}
            </p>
            {!searchTerm && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-4 flex items-center gap-1.5 rounded-xl bg-[#008dd2] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-[#007ab6] active:scale-95"
              >
                <HiOutlinePlus size={16} />
                <span>Create Your First Identity</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70">
                    <th className="w-[10%] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Tag
                    </th>
                    <th className="w-[45%] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Party Identity Name
                    </th>
                   
                    <th className="w-[15%] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Created
                    </th>
                    <th className="w-[12%] px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredIdentities.map((identity) => (
                    <tr
                      key={identity.id}
                      className="hover:bg-slate-50/80 transition"
                    >
                      <td className="px-4 py-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100/80 font-mono text-xs font-bold text-[#008dd2]">
                          {getInitials(identity.name)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800 text-sm">
                          {identity.name}
                        </span>
                      </td>
                      
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDate(identity.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(identity)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#008dd2] transition"
                            title="Edit / Rename Identity"
                          >
                            <HiOutlinePencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(identity)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                            title="Delete Identity"
                          >
                            <HiOutlineTrash size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="space-y-2.5 sm:hidden">
              {filteredIdentities.map((identity) => (
                <div
                  key={identity.id}
                  className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100/80 font-mono text-sm font-bold text-[#008dd2]">
                        {getInitials(identity.name)}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">
                          {identity.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Created {formatDate(identity.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(identity)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                        title="Edit"
                      >
                        <HiOutlinePencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDelete(identity)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200"
                        title="Delete"
                      >
                        <HiOutlineTrash size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                    <span className="text-slate-400">Linked Orders:</span>
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {Number(identity.linked_orders_count) || 0} orders
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ==================================================
            CREATE / EDIT MODAL
        ================================================== */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
            onClick={(e) => {
              if (e.target === e.currentTarget && !saving) setShowModal(false);
            }}
          >
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-[#008dd2]">
                    <HiOutlineIdentification size={18} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    {modalMode === "create" ? "Add Party Identity" : "Edit Party Identity"}
                  </h3>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <HiOutlineX size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveIdentity} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Party Identity Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={identityName}
                    onChange={(e) => setIdentityName(e.target.value)}
                    placeholder="e.g. NS, ABC Traders, Shree Enterprises"
                    maxLength={100}
                    disabled={saving}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
                  />
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    This identity name will appear in your Create Order dropdown and All Orders list.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setShowModal(false)}
                    className="h-10 rounded-xl border border-slate-200 px-4 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !identityName.trim()}
                    className="h-10 rounded-xl bg-[#008dd2] px-5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-[#007ab6] disabled:opacity-50 active:scale-95 flex items-center gap-1.5"
                  >
                    {saving ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{modalMode === "create" ? "Create Identity" : "Save Changes"}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================================================
            DELETE CONFIRMATION MODAL
        ================================================== */}
        {showDeleteModal && deletingIdentity && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
            onClick={(e) => {
              if (e.target === e.currentTarget && !deleting) setShowDeleteModal(false);
            }}
          >
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <HiOutlineExclamation size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Delete Party Identity?
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Are you sure you want to delete <strong className="text-slate-800 font-bold">"{deletingIdentity.name}"</strong>?
                  </p>
                </div>
              </div>

              {Number(deletingIdentity.linked_orders_count) > 0 ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <p className="font-semibold flex items-center gap-1">
                    <span>⚠️</span> Notice: Safe Order Handling
                  </p>
                  <p className="mt-1 text-amber-700 leading-relaxed">
                    This identity is currently linked to <strong>{deletingIdentity.linked_orders_count} orders</strong>.
                    Deleting it will safely unassign the identity from those orders (their Party will show as "—"). <strong>No orders will be deleted.</strong>
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                  This action cannot be undone. You can create a new identity with this name at any time.
                </p>
              )}

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setShowDeleteModal(false)}
                  className="h-10 rounded-xl border border-slate-200 px-4 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleConfirmDelete}
                  className="h-10 rounded-xl bg-red-600 px-5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-red-700 disabled:opacity-50 active:scale-95 flex items-center gap-1.5"
                >
                  {deleting ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete Identity</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
