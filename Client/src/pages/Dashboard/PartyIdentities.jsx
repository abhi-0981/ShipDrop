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
  HiOutlineOfficeBuilding,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineDocumentText,
  HiOutlineBookmark,
} from "react-icons/hi";
import api from "../../services/api";
import { TableSkeleton } from "../../components/Common/TableSkeleton";

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

const initialFormData = {
  name: "",
  reference_name: "",
  company_name: "",
  gst_no: "",
  phone_no: "",
  address: "",
};

export default function PartyIdentities() {
  const [identities, setIdentities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [editingIdentity, setEditingIdentity] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
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

  // Filtered identities based on search across name, reference, company, gst, phone, address
  const filteredIdentities = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return identities;
    return identities.filter((item) =>
      item.name?.toLowerCase().includes(query) ||
      item.reference_name?.toLowerCase().includes(query) ||
      item.company_name?.toLowerCase().includes(query) ||
      item.gst_no?.toLowerCase().includes(query) ||
      item.phone_no?.toLowerCase().includes(query) ||
      item.address?.toLowerCase().includes(query)
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
    setFormData(initialFormData);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (identity) => {
    setModalMode("edit");
    setEditingIdentity(identity);
    setFormData({
      name: identity.name || "",
      reference_name: identity.reference_name || "",
      company_name: identity.company_name || "",
      gst_no: identity.gst_no || "",
      phone_no: identity.phone_no || "",
      address: identity.address || "",
    });
    setShowModal(true);
  };

  // Open Delete Confirmation Modal
  const handleOpenDelete = (identity) => {
    setDeletingIdentity(identity);
    setShowDeleteModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "gst_no" ? value.toUpperCase() : value,
    }));
  };

  // Submit Create or Edit Form
  const handleSaveIdentity = async (e) => {
    e?.preventDefault();
    const cleanName = formData.name.trim();

    if (!cleanName) {
      toast.error("Please enter a party identity name");
      return;
    }

    if (cleanName.length > 100) {
      toast.error("Party identity name must not exceed 100 characters");
      return;
    }

    if (formData.phone_no && formData.phone_no.trim()) {
      const cleanPhone = formData.phone_no.trim().replace(/\D/g, "");
      if (cleanPhone.length < 10 || cleanPhone.length > 12) {
        toast.error("Please enter a valid 10-digit phone number");
        return;
      }
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
      const payload = {
        name: cleanName,
        reference_name: formData.reference_name.trim() || null,
        company_name: formData.company_name.trim() || null,
        gst_no: formData.gst_no.trim().toUpperCase() || null,
        phone_no: formData.phone_no.trim() || null,
        address: formData.address.trim() || null,
      };

      if (modalMode === "create") {
        const response = await api.post("/party-identities", payload);

        if (!response?.data?.success) {
          throw new Error(response?.data?.message || "Failed to create party identity");
        }

        toast.success(`Party identity "${cleanName}" created successfully!`);
      } else {
        const response = await api.put(`/party-identities/${editingIdentity.id}`, payload);

        if (!response?.data?.success) {
          throw new Error(response?.data?.message || "Failed to update party identity");
        }

        toast.success(`Party identity "${cleanName}" updated successfully!`);
      }

      setShowModal(false);
      setEditingIdentity(null);
      setFormData(initialFormData);
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
    <div className="min-h-screen bg-[#f6f8fb] dark:bg-[#090b10] text-slate-800 dark:text-slate-100 px-3 sm:px-4 py-4 sm:py-5 pb-24 lg:pb-8 transition-colors duration-200">
      <div className="mx-auto max-w-[1450px]">
        {/* ==================================================
            TOP HEADER
        ================================================== */}
        <div className="mb-3 rounded-2xl border border-slate-200 dark:border-[#1f2535] bg-white dark:bg-[#121620] px-4 sm:px-5 py-3.5 sm:py-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#008dd2]">
                <HiOutlineIdentification size={22} />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800 dark:text-white">
                  Party Identities
                </h1>
                <p className="text-xs text-slate-400">
                  Create and manage client or party profiles (company, GST, phone, address) to tag orders
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#008dd2] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-[#007ab6] active:scale-95"
            >
              <HiOutlinePlus size={16} />
              <span>Add Party Identity</span>
            </button>
          </div>
        </div>

        {/* ==================================================
            STAT CARDS
        ================================================== */}
        <div className="mb-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Parties
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-slate-800">
                {identities.length}
              </span>
              <span className="text-xs text-slate-400">registered</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Linked Orders
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-emerald-600">
                {totalLinkedOrders}
              </span>
              <span className="text-xs text-slate-400">orders</span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Search & Filter
            </span>
            <div className="relative mt-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, company, GST, phone..."
                className="h-8.5 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-700 placeholder-slate-400 outline-none transition focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
              />
              <HiOutlineSearch
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <HiOutlineX size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ==================================================
            IDENTITIES LIST / TABLE
        ================================================== */}
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
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
                ? "Try searching with a different name, company, or phone."
                : "Create party profiles with Name, Reference, Company, GST, Phone and Address to tag your orders easily."}
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
                    <th className="w-[6%] px-3.5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Tag
                    </th>
                    <th className="w-[24%] px-3.5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Party & Reference
                    </th>
                    <th className="w-[24%] px-3.5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Company & GST
                    </th>
                    <th className="w-[24%] px-3.5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Contact & Address
                    </th>
                    <th className="w-[11%] px-3.5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Orders
                    </th>
                    <th className="w-[11%] px-3.5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
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
                      {/* TAG / INITIALS */}
                      <td className="px-3.5 py-3 align-top">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100/80 font-mono text-xs font-bold text-[#008dd2]">
                          {getInitials(identity.name)}
                        </span>
                      </td>

                      {/* NAME & REFERENCE */}
                      <td className="px-3.5 py-3 align-top">
                        <div className="font-semibold text-slate-800 text-sm">
                          {identity.name}
                        </div>
                        {identity.reference_name ? (
                          <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                            <HiOutlineBookmark size={12} className="text-[#008dd2]" />
                            <span>Ref: {identity.reference_name}</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400">Created {formatDate(identity.created_at)}</div>
                        )}
                      </td>

                      {/* COMPANY & GST */}
                      <td className="px-3.5 py-3 align-top">
                        {identity.company_name ? (
                          <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                            <HiOutlineOfficeBuilding size={13} className="text-slate-400 shrink-0" />
                            <span className="truncate">{identity.company_name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}

                        {identity.gst_no && (
                          <div className="mt-1 inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-amber-700 border border-amber-100">
                            <HiOutlineDocumentText size={11} />
                            <span>{identity.gst_no}</span>
                          </div>
                        )}
                      </td>

                      {/* CONTACT & ADDRESS */}
                      <td className="px-3.5 py-3 align-top">
                        {identity.phone_no && (
                          <div className="flex items-center gap-1 text-xs font-medium text-slate-700">
                            <HiOutlinePhone size={13} className="text-emerald-500 shrink-0" />
                            <span>{identity.phone_no}</span>
                          </div>
                        )}

                        {identity.address ? (
                          <div
                            className="mt-0.5 flex items-start gap-1 text-[11px] text-slate-500 line-clamp-2"
                            title={identity.address}
                          >
                            <HiOutlineLocationMarker size={13} className="text-slate-400 shrink-0 mt-0.5" />
                            <span>{identity.address}</span>
                          </div>
                        ) : !identity.phone_no ? (
                          <span className="text-slate-300 text-xs">—</span>
                        ) : null}
                      </td>

                      {/* ORDERS */}
                      <td className="px-3.5 py-3 align-top">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          <HiOutlineCube size={13} className="text-slate-500" />
                          {Number(identity.linked_orders_count) || 0}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-3.5 py-3 align-top text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(identity)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#008dd2] transition"
                            title="Edit Identity"
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
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100/80 font-mono text-sm font-bold text-[#008dd2]">
                        {getInitials(identity.name)}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">
                          {identity.name}
                        </h4>
                        {identity.reference_name && (
                          <p className="text-[11px] text-slate-500 font-medium">
                            Ref: {identity.reference_name}
                          </p>
                        )}
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

                  {/* DETAILS */}
                  <div className="mt-3 space-y-1 border-t border-slate-100 pt-2 text-xs">
                    {identity.company_name && (
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <HiOutlineOfficeBuilding size={13} className="text-slate-400 shrink-0" />
                        <span className="font-semibold">{identity.company_name}</span>
                      </div>
                    )}
                    {identity.gst_no && (
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-amber-700 font-bold">
                        <HiOutlineDocumentText size={13} className="text-amber-500 shrink-0" />
                        <span>GST: {identity.gst_no}</span>
                      </div>
                    )}
                    {identity.phone_no && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <HiOutlinePhone size={13} className="text-emerald-500 shrink-0" />
                        <span>{identity.phone_no}</span>
                      </div>
                    )}
                    {identity.address && (
                      <div className="flex items-start gap-1.5 text-[11px] text-slate-500">
                        <HiOutlineLocationMarker size={13} className="text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{identity.address}</span>
                      </div>
                    )}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget && !saving) setShowModal(false);
            }}
          >
            <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl my-auto">
              {/* MODAL HEADER */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-[#008dd2]">
                    <HiOutlineIdentification size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      {modalMode === "create" ? "Add Party Identity" : "Edit Party Identity"}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Save complete party identity details to tag and organize orders.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <HiOutlineX size={18} />
                </button>
              </div>

              {/* FORM */}
              <form onSubmit={handleSaveIdentity} className="mt-4 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* PARTY NAME */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Party Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      autoFocus
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. NS, Shree Traders, Rahul"
                      maxLength={100}
                      disabled={saving}
                      className="h-10.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
                    />
                  </div>

                  {/* REFERENCE NAME */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Reference Name
                    </label>
                    <input
                      type="text"
                      name="reference_name"
                      value={formData.reference_name}
                      onChange={handleInputChange}
                      placeholder="e.g. Ref-Jaipur, Agent Code"
                      maxLength={100}
                      disabled={saving}
                      className="h-10.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
                    />
                  </div>

                  {/* COMPANY NAME */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      placeholder="e.g. ABC Enterprises Pvt Ltd"
                      maxLength={200}
                      disabled={saving}
                      className="h-10.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
                    />
                  </div>

                  {/* GST NO */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      GST Number
                    </label>
                    <input
                      type="text"
                      name="gst_no"
                      value={formData.gst_no}
                      onChange={handleInputChange}
                      placeholder="e.g. 08AAAAA0000A1Z5"
                      maxLength={20}
                      disabled={saving}
                      className="h-10.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-mono uppercase text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
                    />
                  </div>

                  {/* PHONE NO */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone_no"
                      value={formData.phone_no}
                      onChange={handleInputChange}
                      placeholder="e.g. 9876543210"
                      maxLength={15}
                      disabled={saving}
                      className="h-10.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
                    />
                  </div>

                  {/* ADDRESS */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Address
                    </label>
                    <textarea
                      name="address"
                      rows={2}
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Full shop / office address, city, state, pincode..."
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10 resize-none"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  This party profile will appear in your Create Order dropdown and All Orders list.
                </p>

                {/* FOOTER BUTTONS */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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
                    disabled={saving || !formData.name.trim()}
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

              <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200/60">
                Any orders previously tagged with this identity ({Number(deletingIdentity.linked_orders_count) || 0} orders) will remain intact, and their party tag will be safely unassigned.
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
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
