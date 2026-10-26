import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineLocationMarker,
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
  HiOutlineMail,
  HiOutlineBadgeCheck,
  HiOutlineExternalLink,
  HiOutlineDownload,
  HiOutlineTrash,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";

export default function PickupAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [users, setUsers] = useState([]);
  const [states, setStates] = useState([]);
  const [stats, setStats] = useState({
    total_addresses: 0,
    total_users: 0,
    registered_count: 0,
    total_states: 0,
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
  const [selectedState, setSelectedState] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Selected for Modal
  const [viewingAddress, setViewingAddress] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Copy helper
  const copyToClipboard = (text, fieldKey) => {
    if (!text || text === "—" || text === "-") return;
    navigator.clipboard.writeText(String(text).trim());
    setCopiedField(fieldKey);
    toast.success("Copied to clipboard!", { id: "clipboard-toast", duration: 1500 });
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Fetch Users for Filter Dropdown
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

  // Fetch Pickup Addresses from API
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (selectedUser !== "ALL") params.append("user_id", selectedUser);
      if (selectedState !== "ALL") params.append("state", selectedState);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`${API_BASE_URL}/admin/pickup-addresses?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load pickup addresses");
      }

      setAddresses(data.addresses || []);
      if (data.stats) setStats(data.stats);
      if (Array.isArray(data.states) && data.states.length > 0) {
        setStates(data.states);
      }
    } catch (err) {
      console.error("Fetch pickup addresses error:", err);
      setError(err.message || "Failed to load pickup addresses");
      toast.error(err.message || "Failed to load pickup addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchAddresses();
    setCurrentPage(1);
  }, [selectedUser, selectedState, selectedStatus]);

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAddresses();
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedUser("ALL");
    setSelectedState("ALL");
    setSelectedStatus("ALL");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedUser !== "ALL" ||
    selectedState !== "ALL" ||
    selectedStatus !== "ALL";

  // Client-side pagination
  const totalPages = Math.ceil(addresses.length / pageSize) || 1;
  const paginatedAddresses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return addresses.slice(start, start + pageSize);
  }, [addresses, currentPage, pageSize]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!addresses.length) {
      toast.error("No data to export");
      return;
    }
    const headers = [
      "ID",
      "Warehouse Name",
      "Merchant Name",
      "Merchant Company",
      "Merchant Email",
      "Merchant Phone",
      "Contact Person",
      "Contact Phone",
      "Contact Email",
      "GSTIN",
      "Address Line 1",
      "Address Line 2",
      "City",
      "State",
      "Pincode",
      "Delhivery Registered",
      "Status",
      "Deleted by User",
      "Deleted At",
      "Created At",
    ];

    const rows = addresses.map((a) => [
      a.id,
      `"${(a.warehouse_name || "").replace(/"/g, '""')}"`,
      `"${(a.user_name || "").replace(/"/g, '""')}"`,
      `"${(a.user_company || "").replace(/"/g, '""')}"`,
      a.user_email || "",
      a.user_phone || "",
      `"${(a.contact_name || "").replace(/"/g, '""')}"`,
      a.phone || "",
      a.email || "",
      a.gstin || "",
      `"${(a.address_line1 || "").replace(/"/g, '""')}"`,
      `"${(a.address_line2 || "").replace(/"/g, '""')}"`,
      a.city || "",
      a.state || "",
      a.pincode || "",
      a.delhivery_registered ? "Yes" : "No",
      a.status || "Active",
      Number(a.is_deleted) === 1 ? "Yes" : "No",
      a.deleted_at || "",
      a.created_at || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `all_pickup_addresses_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Addresses exported to CSV!");
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
            <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center text-[#008dd2] shadow-xs">
              <HiOutlineLocationMarker size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                All Pickup Addresses
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Overview of all merchant warehouse & pickup locations configured across the platform
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchAddresses}
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
        {/* Card 1: Total Locations */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Locations</span>
            <div className="h-8 w-8 rounded-lg bg-sky-50 text-[#008dd2] flex items-center justify-center">
              <HiOutlineLocationMarker size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
            {stats.total_addresses || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across all registered merchants</p>
        </div>

        {/* Card 2: Registered with Delhivery */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Delhivery Active</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HiOutlineBadgeCheck size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-bold text-emerald-600">
            {stats.registered_count || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Verified pickup hubs</p>
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
          <p className="text-[11px] text-rose-500/80 mt-0.5">Preserved for audit/orders</p>
        </div>

        {/* Card 4: Merchants with Locations */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Merchants</span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <HiOutlineUser size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
            {stats.total_users || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Distinct merchants with hubs</p>
        </div>

        {/* Card 5: States Covered */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs hover:shadow-xs transition col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">States Covered</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <HiOutlineOfficeBuilding size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
            {stats.total_states || states.length || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Pan-India coverage</p>
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
              placeholder="Search by warehouse, contact person, phone, pincode, city, or merchant name..."
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

            {/* STATE FILTER */}
            <div className="relative">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2.5 text-xs font-medium text-slate-700 bg-slate-50/70 border border-slate-200 rounded-xl outline-none transition focus:bg-white focus:border-[#008dd2] cursor-pointer"
              >
                <option value="ALL">All States</option>
                {states.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <HiOutlineLocationMarker
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {/* STATUS FILTER */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2.5 text-xs font-medium text-slate-700 bg-slate-50/70 border border-slate-200 rounded-xl outline-none transition focus:bg-white focus:border-[#008dd2] cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE_ONLY">Active Hubs Only</option>
                <option value="DELETED">Deleted by User</option>
                <option value="REGISTERED">Delhivery Registered</option>
                <option value="UNREGISTERED">Pending / Unregistered</option>
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
            Showing <strong className="text-slate-700">{addresses.length}</strong> pickup location
            {addresses.length === 1 ? "" : "s"}
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
              <span className="text-xs font-medium">Loading pickup addresses...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <HiOutlineX size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-800">{error}</p>
            <button
              onClick={fetchAddresses}
              className="mt-3 px-4 py-1.5 text-xs font-semibold text-[#008dd2] hover:underline"
            >
              Try Again
            </button>
          </div>
        ) : addresses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <HiOutlineLocationMarker size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-800">No pickup addresses found</p>
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
                  <th className="py-3 px-4">Pickup Location</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Address & Pincode</th>
                  <th className="py-3 px-4">GSTIN</th>
                  <th className="py-3 px-4 text-center">Delhivery Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedAddresses.map((addr) => {
                  const isDeleted = Number(addr.is_deleted) === 1;
                  const isRegistered =
                    Number(addr.delhivery_registered) === 1 ||
                    String(addr.status || "").toLowerCase() === "active";

                  return (
                    <tr
                      key={addr.id}
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
                            to={`/users/${addr.user_id}`}
                            className="font-semibold text-slate-900 hover:text-[#008dd2] transition flex items-center gap-1 group/user"
                            title="View Merchant Profile"
                          >
                            <span>{addr.user_name || "Unknown Merchant"}</span>
                            <HiOutlineExternalLink
                              size={12}
                              className="text-slate-400 group-hover/user:text-[#008dd2]"
                            />
                          </Link>
                          {addr.user_company && (
                            <p className="text-[11px] text-slate-500 font-medium">
                              {addr.user_company}
                            </p>
                          )}
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                            <span>UID: #{addr.user_id}</span>
                            {addr.user_phone && <span>• {addr.user_phone}</span>}
                          </div>
                        </div>
                      </td>

                      {/* LOCATION NAME */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-semibold ${isDeleted ? "text-rose-950 font-bold" : "text-slate-800"}`}>
                              {addr.warehouse_name || "Unnamed Hub"}
                            </span>
                            {isDeleted && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 shadow-2xs">
                                <HiOutlineTrash size={11} className="text-rose-600" />
                                Deleted by User
                              </span>
                            )}
                          </div>
                          {(addr.landmark || addr.floor_no) && (
                            <p className="text-[11px] text-slate-500">
                              {addr.floor_no ? `Floor ${addr.floor_no}` : ""}
                              {addr.floor_no && addr.landmark ? ", " : ""}
                              {addr.landmark ? `Near ${addr.landmark}` : ""}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-block text-[10px] text-slate-400">
                              Added: {formatDate(addr.created_at)}
                            </span>
                            {isDeleted && addr.deleted_at && (
                              <span className="inline-block text-[10px] text-rose-600 font-semibold bg-rose-100/70 px-1.5 py-0.2 rounded border border-rose-200">
                                Deleted: {formatDate(addr.deleted_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* CONTACT PERSON */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-0.5">
                          <p className="font-medium text-slate-800">
                            {addr.contact_name || "—"}
                          </p>
                          {addr.phone && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(addr.phone, `phone_${addr.id}`)}
                              className="text-[11px] text-slate-600 hover:text-[#008dd2] flex items-center gap-1 transition"
                              title="Click to copy phone"
                            >
                              <HiOutlinePhone size={11} className="text-slate-400" />
                              <span>{addr.phone}</span>
                              {copiedField === `phone_${addr.id}` ? (
                                <HiOutlineCheck size={11} className="text-emerald-500" />
                              ) : (
                                <HiOutlineClipboardCopy
                                  size={11}
                                  className="text-slate-300 hover:text-slate-500"
                                />
                              )}
                            </button>
                          )}
                          {addr.email && (
                            <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                              {addr.email}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* ADDRESS & PINCODE */}
                      <td className="py-3.5 px-4 align-top max-w-[280px]">
                        <div className="space-y-1">
                          <p className="text-slate-700 leading-snug font-medium line-clamp-2">
                            {[addr.address_line1, addr.address_line2].filter(Boolean).join(", ") ||
                              "—"}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                              {addr.city || "—"}, {addr.state || "—"}
                            </span>
                            {addr.pincode && (
                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(addr.pincode, `pin_${addr.id}`)
                                }
                                className="inline-flex items-center gap-0.5 rounded-md bg-sky-50 text-[#008dd2] px-1.5 py-0.5 text-[10px] font-bold hover:bg-sky-100 transition"
                                title="Click to copy pincode"
                              >
                                <span>{addr.pincode}</span>
                                {copiedField === `pin_${addr.id}` ? (
                                  <HiOutlineCheck size={10} className="text-emerald-500" />
                                ) : (
                                  <HiOutlineClipboardCopy size={10} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* GSTIN */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        {addr.gstin ? (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(addr.gstin, `gst_${addr.id}`)}
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-800 bg-slate-100/80 hover:bg-slate-200/80 px-2 py-0.5 rounded-md transition"
                            title="Click to copy GSTIN"
                          >
                            <span>{addr.gstin}</span>
                            {copiedField === `gst_${addr.id}` ? (
                              <HiOutlineCheck size={12} className="text-emerald-600" />
                            ) : (
                              <HiOutlineClipboardCopy size={12} className="text-slate-400" />
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* STATUS */}
                      <td className="py-3.5 px-4 align-top text-center">
                        {isDeleted ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 shadow-2xs">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                              Deleted by User
                            </span>
                            {addr.deleted_at && (
                              <span className="text-[10px] text-rose-600 font-medium">
                                {formatDate(addr.deleted_at)}
                              </span>
                            )}
                          </div>
                        ) : isRegistered ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Registered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setViewingAddress(addr)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-[#008dd2] hover:text-white rounded-lg transition active:scale-95"
                          title="View complete address details"
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
        {!loading && addresses.length > pageSize && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-500">
            <div>
              Showing{" "}
              <strong className="text-slate-800">
                {(currentPage - 1) * pageSize + 1}
              </strong>{" "}
              to{" "}
              <strong className="text-slate-800">
                {Math.min(currentPage * pageSize, addresses.length)}
              </strong>{" "}
              of <strong className="text-slate-800">{addresses.length}</strong> entries
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
      {viewingAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-sky-50 text-[#008dd2] flex items-center justify-center shadow-xs">
                  <HiOutlineLocationMarker size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {viewingAddress.warehouse_name || "Pickup Hub Details"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Location ID: #{viewingAddress.id} • Added on {formatDate(viewingAddress.created_at)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingAddress(null)}
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition"
              >
                <HiOutlineX size={18} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* DELETED BANNER */}
              {Number(viewingAddress.is_deleted) === 1 && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 flex items-start gap-3 text-rose-800">
                  <div className="h-7 w-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                    <HiOutlineTrash size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-rose-900 flex items-center gap-2">
                      <span>Deleted by Merchant</span>
                      {viewingAddress.deleted_at && (
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200">
                          {formatDate(viewingAddress.deleted_at)}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-rose-700 mt-1 leading-relaxed">
                      The merchant removed this pickup warehouse from their account dashboard. It will never be removed from the Admin Panel to safeguard historical order references, manifest history, and audit compliance.
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION: MERCHANT OWNER */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Merchant Profile
                  </span>
                  <Link
                    to={`/users/${viewingAddress.user_id}`}
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
                      {viewingAddress.user_name || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Company Name:</span>
                    <span className="font-semibold text-slate-800">
                      {viewingAddress.user_company || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Email:</span>
                    <span className="text-slate-700 font-medium">{viewingAddress.user_email || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Mobile:</span>
                    <span className="text-slate-700 font-medium">{viewingAddress.user_phone || "—"}</span>
                  </div>
                </div>
              </div>

              {/* SECTION: PICKUP LOCATION & CONTACT */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Pickup Hub & Contact
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Warehouse / Hub Name:</span>
                    <span className="font-semibold text-slate-900 text-sm">
                      {viewingAddress.warehouse_name || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Registration Status:</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 mt-0.5">
                      <HiOutlineBadgeCheck size={16} />
                      {Number(viewingAddress.delhivery_registered) === 1
                        ? "Registered with Delhivery"
                        : "Active in Platform"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Contact Person:</span>
                    <span className="font-medium text-slate-800">
                      {viewingAddress.contact_name || "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Contact Phone:</span>
                    <span className="font-medium text-slate-800 font-mono">
                      {viewingAddress.phone || "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Contact Email:</span>
                    <span className="text-slate-700 font-medium">
                      {viewingAddress.email || "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">GSTIN Number:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {viewingAddress.gstin || "Not Registered"}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION: FULL ADDRESS */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Full Physical Address
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const fullAddr = [
                        viewingAddress.address_line1,
                        viewingAddress.address_line2,
                        viewingAddress.floor_no ? `Floor ${viewingAddress.floor_no}` : null,
                        viewingAddress.landmark ? `Near ${viewingAddress.landmark}` : null,
                        viewingAddress.city,
                        viewingAddress.state,
                        viewingAddress.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ");
                      copyToClipboard(fullAddr, "modal_full_addr");
                    }}
                    className="text-xs text-[#008dd2] font-semibold hover:underline flex items-center gap-1"
                  >
                    <HiOutlineClipboardCopy size={13} />
                    <span>Copy Full Address</span>
                  </button>
                </div>

                <p className="text-xs text-slate-800 leading-relaxed font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {[
                    viewingAddress.address_line1,
                    viewingAddress.address_line2,
                    viewingAddress.floor_no ? `Floor ${viewingAddress.floor_no}` : null,
                    viewingAddress.landmark ? `Landmark: ${viewingAddress.landmark}` : null,
                    `${viewingAddress.city || ""}, ${viewingAddress.state || ""} - ${viewingAddress.pincode || ""}`,
                    viewingAddress.country || "India",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>

              {/* SECTION: RETURN / RTO ADDRESS */}
              {viewingAddress.return_address && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Return / RTO Address
                  </span>
                  <p className="text-xs text-slate-700">
                    {[
                      viewingAddress.return_address,
                      viewingAddress.return_city,
                      viewingAddress.return_state,
                      viewingAddress.return_pincode,
                      viewingAddress.return_country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-end gap-2 px-6 py-3.5 bg-slate-50/80 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingAddress(null)}
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
