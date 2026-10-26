import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineIdentification,
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineFilter,
  HiOutlineX,
  HiOutlineClipboardCopy,
  HiOutlineCheck,
  HiOutlineEye,
  HiOutlineOfficeBuilding,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineBadgeCheck,
  HiOutlineExternalLink,
  HiOutlineDownload,
  HiOutlineCube,
  HiOutlineTrash,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";

function getInitials(name) {
  if (!name) return "PI";
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function PartyIdentities() {
  const [parties, setParties] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total_parties: 0,
    total_users: 0,
    gst_registered: 0,
    non_gst: 0,
    deleted_count: 0,
    active_count: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("user_id") || "ALL";
    } catch {
      return "ALL";
    }
  });
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [gstFilter, setGstFilter] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Selected for Modal
  const [viewingParty, setViewingParty] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const copyToClipboard = (text, fieldKey) => {
    if (!text || text === "—" || text === "-") return;
    navigator.clipboard.writeText(String(text).trim());
    setCopiedField(fieldKey);
    toast.success("Copied to clipboard!", { id: "clipboard-toast", duration: 1500 });
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Fetch Users for Filter
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (e) {
      console.warn("Could not load users list for filter:", e.message);
    }
  };

  // Fetch Party Identities from API
  const fetchParties = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (selectedUser !== "ALL") params.append("user_id", selectedUser);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (gstFilter !== "ALL") params.append("gst_filter", gstFilter);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`${API_BASE_URL}/admin/party-identities?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load party identities");
      }

      setParties(data.parties || []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error("Fetch party identities error:", err);
      setError(err.message || "Failed to load party identities");
      toast.error(err.message || "Failed to load party identities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchParties();
    setCurrentPage(1);
  }, [selectedUser, statusFilter, gstFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchParties();
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedUser("ALL");
    setStatusFilter("ALL");
    setGstFilter("ALL");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedUser !== "ALL" ||
    statusFilter !== "ALL" ||
    gstFilter !== "ALL";

  // Pagination calculation
  const totalPages = Math.ceil(parties.length / pageSize) || 1;
  const paginatedParties = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return parties.slice(start, start + pageSize);
  }, [parties, currentPage, pageSize]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!parties.length) {
      toast.error("No data to export");
      return;
    }
    const headers = [
      "ID",
      "Party Name",
      "Reference Name",
      "Company Name",
      "Merchant Name",
      "Merchant Company",
      "Merchant Email",
      "Merchant Phone",
      "GSTIN",
      "Phone",
      "Address",
      "Linked Orders Count",
      "Deleted by User",
      "Deleted At",
      "Created At",
    ];

    const rows = parties.map((p) => [
      p.id,
      `"${(p.name || "").replace(/"/g, '""')}"`,
      `"${(p.reference_name || "").replace(/"/g, '""')}"`,
      `"${(p.company_name || "").replace(/"/g, '""')}"`,
      `"${(p.user_name || "").replace(/"/g, '""')}"`,
      `"${(p.user_company || "").replace(/"/g, '""')}"`,
      p.user_email || "",
      p.user_phone || "",
      p.gst_no || "",
      p.phone_no || "",
      `"${(p.address || "").replace(/"/g, '""')}"`,
      p.linked_orders_count || 0,
      Number(p.is_deleted) === 1 ? "Yes" : "No",
      p.deleted_at || "",
      p.created_at || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `all_party_identities_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Party identities exported to CSV!");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-xs">
              <HiOutlineIdentification size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                All Parties Information
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Overview of all billing identities, brands & sender party profiles across merchants
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchParties}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs active:scale-95 disabled:opacity-60"
            title="Refresh"
          >
            <HiOutlineRefresh size={16} className={loading ? "animate-spin text-[#008dd2]" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#008dd2] hover:bg-[#007bb8] rounded-xl transition shadow-xs active:scale-95"
            title="Export CSV"
          >
            <HiOutlineDownload size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: Total Parties */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Parties</span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <HiOutlineIdentification size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
            {stats.total_parties || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Configured sender profiles</p>
        </div>

        {/* Card 2: GST Registered */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">GST Registered</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HiOutlineBadgeCheck size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-bold text-emerald-600">
            {stats.gst_registered || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">With valid GSTIN number</p>
        </div>

        {/* Card 3: Deleted by User */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/30 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">Deleted by User</span>
            <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <HiOutlineTrash size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-bold text-rose-600">
            {stats.deleted_count || 0}
          </p>
          <p className="text-[11px] text-rose-500/80 mt-0.5">Preserved for invoices/audit</p>
        </div>

        {/* Card 4: Non-GST Parties */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Non-GST Entities</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <HiOutlineOfficeBuilding size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
            {stats.non_gst || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Unregistered profiles</p>
        </div>

        {/* Card 5: Merchants */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs hover:shadow-xs transition col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Merchants</span>
            <div className="h-8 w-8 rounded-lg bg-sky-50 text-[#008dd2] flex items-center justify-center">
              <HiOutlineUser size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
            {stats.total_users || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Merchants using parties</p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3">
          {/* SEARCH INPUT */}
          <div className="relative flex-1">
            <HiOutlineSearch
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by party name, company, GST number, phone, address, or merchant..."
              className="w-full pl-10 pr-4 py-2.5 text-xs font-medium text-slate-800 bg-slate-50/70 border border-slate-200 rounded-xl outline-none transition focus:bg-white focus:border-[#008dd2] focus:ring-4 focus:ring-[#008dd2]/10"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* USER / MERCHANT FILTER */}
            <div className="relative">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2.5 text-xs font-medium text-slate-700 bg-slate-50/70 border border-slate-200 rounded-xl outline-none transition focus:bg-white focus:border-[#008dd2] cursor-pointer"
              >
                <option value="ALL">All Merchants</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || u.company_name || `User #${u.id}`} {u.company_name ? `(${u.company_name})` : ""}
                  </option>
                ))}
              </select>
              <HiOutlineFilter
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {/* STATUS FILTER */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2.5 text-xs font-medium text-slate-700 bg-slate-50/70 border border-slate-200 rounded-xl outline-none transition focus:bg-white focus:border-[#008dd2] cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE_ONLY">Active Profiles</option>
                <option value="DELETED">Deleted by User</option>
              </select>
              <HiOutlineFilter
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {/* GST STATUS FILTER */}
            <div className="relative">
              <select
                value={gstFilter}
                onChange={(e) => setGstFilter(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2.5 text-xs font-medium text-slate-700 bg-slate-50/70 border border-slate-200 rounded-xl outline-none transition focus:bg-white focus:border-[#008dd2] cursor-pointer"
              >
                <option value="ALL">All GST Status</option>
                <option value="WITH_GST">GST Registered</option>
                <option value="WITHOUT_GST">Non-GST</option>
              </select>
              <HiOutlineBadgeCheck
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold text-white bg-[#008dd2] hover:bg-[#007bb8] rounded-xl transition shadow-xs active:scale-95"
            >
              Search
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-3 py-2.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition active:scale-95"
                title="Clear all filters"
              >
                <HiOutlineX size={15} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </form>

        {/* RESULTS COUNT BANNER */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-700">{parties.length}</strong> party identit
            {parties.length === 1 ? "y" : "ies"}
            {hasActiveFilters && " (Filtered)"}
          </span>
          {hasActiveFilters && (
            <span className="text-[11px] text-amber-600 font-medium">Filters Applied</span>
          )}
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            <div className="flex items-center justify-center gap-2 text-slate-400 py-12">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#008dd2]" />
              <span className="text-xs font-medium">Loading party identities...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <HiOutlineX size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-800">{error}</p>
            <button
              onClick={fetchParties}
              className="mt-3 px-4 py-1.5 text-xs font-semibold text-[#008dd2] hover:underline"
            >
              Try Again
            </button>
          </div>
        ) : parties.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <HiOutlineIdentification size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-800">No party identities found</p>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search query or merchant filters
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-[#008dd2] bg-sky-50 rounded-lg hover:bg-sky-100 transition"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Merchant / User</th>
                  <th className="py-3 px-4">Party Identity</th>
                  <th className="py-3 px-4">Company / Brand</th>
                  <th className="py-3 px-4">GSTIN & Phone</th>
                  <th className="py-3 px-4">Registered Address</th>
                  <th className="py-3 px-4 text-center">Linked Orders</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedParties.map((party) => {
                  const isDeleted = Number(party.is_deleted) === 1;
                  const hasGst = Boolean(party.gst_no && String(party.gst_no).trim());

                  return (
                    <tr
                      key={party.id}
                      className={`transition-colors group ${
                        isDeleted
                          ? "bg-rose-50/50 hover:bg-rose-50/80 border-l-4 border-l-rose-500"
                          : "hover:bg-slate-50/70"
                      }`}
                    >
                      {/* MERCHANT INFO */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-0.5">
                          <Link
                            to={`/users/${party.user_id}`}
                            className="font-semibold text-slate-900 hover:text-[#008dd2] transition flex items-center gap-1 group/user"
                            title="View Merchant Profile"
                          >
                            <span>{party.user_name || "Unknown Merchant"}</span>
                            <HiOutlineExternalLink
                              size={12}
                              className="text-slate-400 group-hover/user:text-[#008dd2]"
                            />
                          </Link>
                          {party.user_company && (
                            <p className="text-[11px] text-slate-500 font-medium">
                              {party.user_company}
                            </p>
                          )}
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                            <span>UID: #{party.user_id}</span>
                            {party.user_phone && <span>• {party.user_phone}</span>}
                          </div>
                        </div>
                      </td>

                      {/* PARTY IDENTITY */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-start gap-2.5">
                          <div className={`h-8 w-8 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                            isDeleted
                              ? "bg-rose-100 text-rose-700"
                              : "bg-purple-100 text-purple-700"
                          }`}>
                            {getInitials(party.name)}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`font-semibold block ${isDeleted ? "text-rose-950 font-bold" : "text-slate-900"}`}>
                                {party.name}
                              </span>
                              {isDeleted && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 shadow-2xs">
                                  <HiOutlineTrash size={11} className="text-rose-600" />
                                  Deleted by User
                                </span>
                              )}
                            </div>
                            {party.reference_name && (
                              <span className="text-[11px] text-slate-500 block">
                                Ref: {party.reference_name}
                              </span>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] text-slate-400 block">
                                Created: {formatDate(party.created_at)}
                              </span>
                              {isDeleted && party.deleted_at && (
                                <span className="inline-block text-[10px] text-rose-600 font-semibold bg-rose-100/70 px-1.5 py-0.2 rounded border border-rose-200">
                                  Deleted: {formatDate(party.deleted_at)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* COMPANY / BRAND */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-0.5">
                          <span className="font-medium text-slate-800 block">
                            {party.company_name || "—"}
                          </span>
                        </div>
                      </td>

                      {/* GSTIN & PHONE */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="space-y-1">
                          {hasGst ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(party.gst_no, `gst_${party.id}`)}
                                className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-800 bg-slate-100/90 hover:bg-slate-200 px-2 py-0.5 rounded-md transition"
                                title="Click to copy GSTIN"
                              >
                                <span>{party.gst_no}</span>
                                {copiedField === `gst_${party.id}` ? (
                                  <HiOutlineCheck size={11} className="text-emerald-600" />
                                ) : (
                                  <HiOutlineClipboardCopy size={11} className="text-slate-400" />
                                )}
                              </button>
                              <span className="inline-block text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded">
                                GST
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                              Non-GST
                            </span>
                          )}

                          {party.phone_no && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(party.phone_no, `phone_${party.id}`)}
                              className="text-[11px] text-slate-600 hover:text-[#008dd2] flex items-center gap-1 transition"
                              title="Click to copy phone"
                            >
                              <HiOutlinePhone size={11} className="text-slate-400" />
                              <span>{party.phone_no}</span>
                              {copiedField === `phone_${party.id}` ? (
                                <HiOutlineCheck size={11} className="text-emerald-500" />
                              ) : (
                                <HiOutlineClipboardCopy size={11} className="text-slate-300" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* ADDRESS */}
                      <td className="py-3.5 px-4 align-top max-w-[280px]">
                        <p className="text-slate-700 leading-snug font-medium line-clamp-2">
                          {party.address || "—"}
                        </p>
                      </td>

                      {/* LINKED ORDERS */}
                      <td className="py-3.5 px-4 align-top text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                          <HiOutlineCube size={12} className="text-slate-400" />
                          <span>{party.linked_orders_count || 0}</span>
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setViewingParty(party)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-[#008dd2] hover:text-white rounded-lg transition active:scale-95"
                          title="View party card"
                        >
                          <HiOutlineEye size={14} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION BAR */}
        {!loading && parties.length > pageSize && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-500">
            <div>
              Showing{" "}
              <strong className="text-slate-800">
                {(currentPage - 1) * pageSize + 1}
              </strong>{" "}
              to{" "}
              <strong className="text-slate-800">
                {Math.min(currentPage * pageSize, parties.length)}
              </strong>{" "}
              of <strong className="text-slate-800">{parties.length}</strong> entries
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <HiChevronLeft size={16} />
              </button>

              <span className="px-3 py-1 font-semibold text-slate-700">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <HiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {viewingParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs">
                  <HiOutlineIdentification size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {viewingParty.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Party ID: #{viewingParty.id} • Registered on {formatDate(viewingParty.created_at)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingParty(null)}
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition"
              >
                <HiOutlineX size={18} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* DELETED BANNER */}
              {Number(viewingParty.is_deleted) === 1 && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 flex items-start gap-3 text-rose-800">
                  <div className="h-7 w-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                    <HiOutlineTrash size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-rose-900 flex items-center gap-2">
                      <span>Deleted by Merchant</span>
                      {viewingParty.deleted_at && (
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200">
                          {formatDate(viewingParty.deleted_at)}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-rose-700 mt-1 leading-relaxed">
                      The merchant removed this party identity profile from their account dashboard. It will never be removed from the Admin Panel to maintain order billing history, GST compliance, and audit tracking.
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION: MERCHANT OWNER */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Merchant Owner
                  </span>
                  <Link
                    to={`/users/${viewingParty.user_id}`}
                    className="text-xs font-semibold text-[#008dd2] hover:underline flex items-center gap-1"
                  >
                    <span>View User Account</span>
                    <HiOutlineExternalLink size={12} />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Merchant Name:</span>
                    <span className="font-semibold text-slate-800">
                      {viewingParty.user_name || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Company Name:</span>
                    <span className="font-semibold text-slate-800">
                      {viewingParty.user_company || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Email:</span>
                    <span className="text-slate-700 font-medium">{viewingParty.user_email || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Mobile:</span>
                    <span className="text-slate-700 font-medium">{viewingParty.user_phone || "—"}</span>
                  </div>
                </div>
              </div>

              {/* SECTION: PARTY PROFILE DETAILS */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Identity & Tax Information
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Display / Party Name:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {viewingParty.name}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Reference / Nickname:</span>
                    <span className="font-medium text-slate-800">
                      {viewingParty.reference_name || "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Legal Company Name:</span>
                    <span className="font-semibold text-slate-800">
                      {viewingParty.company_name || "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Phone Number:</span>
                    <span className="font-mono font-medium text-slate-800">
                      {viewingParty.phone_no || "—"}
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">GSTIN Number:</span>
                    {viewingParty.gst_no ? (
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono font-bold text-slate-900 text-sm bg-slate-100 px-2 py-0.5 rounded">
                          {viewingParty.gst_no}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <HiOutlineBadgeCheck size={14} />
                          GST Registered
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500 mt-0.5 font-medium">
                        Unregistered / No GST
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Linked Orders Count:</span>
                    <span className="inline-flex items-center gap-1 font-bold text-slate-800 text-sm mt-0.5">
                      <HiOutlineCube size={15} className="text-[#008dd2]" />
                      {viewingParty.linked_orders_count || 0} order(s)
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION: ADDRESS */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Full Registered Address
                  </span>
                  {viewingParty.address && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(viewingParty.address, "modal_party_addr")}
                      className="text-xs text-[#008dd2] font-semibold hover:underline flex items-center gap-1"
                    >
                      <HiOutlineClipboardCopy size={13} />
                      <span>Copy Address</span>
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-800 leading-relaxed font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {viewingParty.address || "No address provided"}
                </p>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-end gap-2 px-6 py-3.5 bg-slate-50/80 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingParty(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
