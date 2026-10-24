import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  HiOutlineSpeakerphone,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineEye,
  HiOutlineInformationCircle,
  HiOutlineExclamationCircle,
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineRefresh,
  HiOutlineGlobe,
  HiOutlineUserGroup,
  HiOutlineSearch,
  HiOutlineUser,
} from "react-icons/hi";
import { API_BASE_URL } from "../../config/api";

const NOTICE_TYPES = [
  {
    id: "INFO",
    label: "General Info",
    desc: "Standard update or notice",
    color: "blue",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    icon: HiOutlineInformationCircle,
  },
  {
    id: "UPDATE",
    label: "Feature / Update",
    desc: "New system feature or upgrade",
    color: "emerald",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: HiOutlineSparkles,
  },
  {
    id: "ALERT",
    label: "Important Notice",
    desc: "Notice requiring attention",
    color: "amber",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    icon: HiOutlineExclamationCircle,
  },
  {
    id: "WARNING",
    label: "Urgent Warning",
    desc: "Delays, maintenance or urgent news",
    color: "rose",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    icon: HiOutlineExclamationCircle,
  },
];

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("INFO");
  const [targetType, setTargetType] = useState("ALL"); // "ALL" | "SPECIFIC"
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem("adminToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchUsersList = async () => {
    if (usersLoading) return;
    setUsersLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/users`, {
        headers: getAuthHeader(),
      });
      if (res.data?.users) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error("Fetch users error:", err);
      toast.error("Failed to load user list");
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchAnnouncements = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/announcements`, {
        headers: getAuthHeader(),
      });
      if (res.data?.success) {
        setAnnouncements(res.data.announcements || []);
      }
    } catch (err) {
      console.error("Fetch announcements error:", err);
      toast.error(err.response?.data?.message || "Failed to load announcements");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Filtered users for specific targeting
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter((u) => {
      const name = (u.full_name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const phone = (u.phone_no || "").toLowerCase();
      const company = (u.company_name || "").toLowerCase();
      const idStr = String(u.id);
      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        company.includes(q) ||
        idStr === q
      );
    });
  }, [users, userSearch]);

  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredUsers.map((u) => u.id);
    setSelectedUserIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const handleClearSelection = () => {
    setSelectedUserIds([]);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    if (targetType === "SPECIFIC" && selectedUserIds.length === 0) {
      toast.error("Please select at least 1 user from the list");
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/admin/announcements`,
        {
          title: title.trim(),
          description: description.trim(),
          type,
          target_type: targetType,
          target_user_ids: targetType === "SPECIFIC" ? selectedUserIds : [],
          is_active: 1,
        },
        { headers: getAuthHeader() }
      );

      if (res.data?.success) {
        toast.success(
          targetType === "SPECIFIC"
            ? `Notice sent to ${selectedUserIds.length} selected user(s)!`
            : "Broadcast announcement sent to all users!"
        );
        setTitle("");
        setDescription("");
        setType("INFO");
        setTargetType("ALL");
        setSelectedUserIds([]);
        setUserSearch("");
        setShowModal(false);
        fetchAnnouncements(true);
      }
    } catch (err) {
      console.error("Create announcement error:", err);
      toast.error(err.response?.data?.message || "Failed to publish announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/admin/announcements/${item.id}/status`,
        {},
        { headers: getAuthHeader() }
      );
      if (res.data?.success) {
        toast.success(res.data.message || "Status updated");
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === item.id ? { ...a, is_active: res.data.is_active } : a))
        );
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
      return;
    }
    try {
      const res = await axios.delete(`${API_BASE_URL}/admin/announcements/${item.id}`, {
        headers: getAuthHeader(),
      });
      if (res.data?.success) {
        toast.success("Announcement deleted");
        setAnnouncements((prev) => prev.filter((a) => a.id !== item.id));
      }
    } catch (err) {
      toast.error("Failed to delete announcement");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const totalActive = announcements.filter((a) => a.is_active).length;
  const totalReads = announcements.reduce((sum, a) => sum + Number(a.read_count || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-[#008dd2]/10 text-[#008dd2] flex items-center justify-center border border-[#008dd2]/20">
              <HiOutlineSpeakerphone className="text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                User Broadcast & Popup Notices
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Send real-time popup announcements to all users across their dashboard
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchAnnouncements()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition cursor-pointer"
            title="Refresh list"
          >
            <HiOutlineRefresh className={`text-sm ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#008dd2] hover:bg-[#007cb8] rounded-xl transition shadow-xs cursor-pointer active:scale-95"
          >
            <HiOutlinePlus className="text-base" />
            <span>New Broadcast Notice</span>
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Broadcasts
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {announcements.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Historical announcements created
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active Popups
          </p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold text-emerald-600">
              {totalActive}
            </p>
            {totalActive > 0 && (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Currently popping up on users' screens
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Reads / Dismissals
          </p>
          <p className="text-2xl font-bold text-[#008dd2] mt-1">
            {totalReads}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Confirmed user acknowledgments
          </p>
        </div>
      </div>

      {/* ANNOUNCEMENT TABLE / LIST */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">All Broadcast Messages</h2>
          <span className="text-xs text-slate-400 font-medium">
            {announcements.length} {announcements.length === 1 ? "notice" : "notices"}
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#008dd2]"></div>
            <p className="text-xs font-medium text-slate-500 mt-2">Loading notices...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <HiOutlineSpeakerphone className="text-2xl" />
            </div>
            <p className="text-sm font-semibold text-slate-800">No broadcast notices yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Create your first broadcast message to show an important notice or update on all users' screens.
            </p>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-4 px-4 py-2 text-xs font-bold text-white bg-[#008dd2] hover:bg-[#007cb8] rounded-xl transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <HiOutlinePlus className="text-sm" />
              <span>Create Announcement</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {announcements.map((item) => {
              const typeCfg =
                NOTICE_TYPES.find((t) => t.id === item.type) || NOTICE_TYPES[0];
              const IconComp = typeCfg.icon;

              return (
                <div
                  key={item.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${typeCfg.badge}`}
                      >
                        <IconComp className="text-xs" />
                        {typeCfg.label}
                      </span>

                      {item.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Live Popup Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Paused / Inactive
                        </span>
                      )}

                      {/* TARGET AUDIENCE BADGE */}
                      {item.target_type === "SPECIFIC" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          <HiOutlineUserGroup className="text-xs" />
                          <span>Specific ({item.target_user_ids?.length || 0} Users)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                          <HiOutlineGlobe className="text-xs" />
                          <span>All Users (Broadcast)</span>
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <HiOutlineClock className="text-xs" />
                        {formatDate(item.created_at)}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed whitespace-pre-line max-w-3xl">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    {/* READ COUNT */}
                    <div className="text-right px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-xs font-bold text-slate-800 block">
                        {item.read_count || 0}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Users Read
                      </span>
                    </div>

                    {/* PREVIEW BUTTON */}
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      title="Preview Popup"
                      className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                    >
                      <HiOutlineEye className="text-base" />
                    </button>

                    {/* STATUS TOGGLE */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        item.is_active
                          ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      }`}
                    >
                      {item.is_active ? "Pause Popup" : "Activate"}
                    </button>

                    {/* DELETE */}
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      title="Delete Announcement"
                      className="p-2 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition cursor-pointer"
                    >
                      <HiOutlineTrash className="text-base" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE BROADCAST MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* MODAL HEADER */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#008dd2]/10 text-[#008dd2] flex items-center justify-center border border-[#008dd2]/20">
                  <HiOutlineSpeakerphone className="text-base" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Create User Notice / Announcement
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Send real-time popup notice to all users or selected specific users
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition cursor-pointer text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* MODAL FORM (SCROLLABLE) */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto orders-scrollbar flex-1">
              {/* TARGET AUDIENCE PICKER */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Target Audience (Kisko Bhejna Hai?)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* OPTION 1: ALL USERS */}
                  <button
                    type="button"
                    onClick={() => setTargetType("ALL")}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-3 ${
                      targetType === "ALL"
                        ? "border-[#008dd2] bg-sky-50/70 ring-2 ring-[#008dd2]/20"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition ${
                        targetType === "ALL" ? "bg-[#008dd2] text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <HiOutlineGlobe className="text-lg" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 block">All Users (Broadcast)</span>
                      <span className="text-[11px] text-slate-500 block truncate">Sabhi registered users ko</span>
                    </div>
                  </button>

                  {/* OPTION 2: SPECIFIC USERS */}
                  <button
                    type="button"
                    onClick={() => {
                      setTargetType("SPECIFIC");
                      fetchUsersList();
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-3 ${
                      targetType === "SPECIFIC"
                        ? "border-purple-500 bg-purple-50/70 ring-2 ring-purple-500/20"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition ${
                        targetType === "SPECIFIC" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <HiOutlineUserGroup className="text-lg" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 block">Specific Users (Selective)</span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {selectedUserIds.length > 0
                          ? `${selectedUserIds.length} user(s) selected`
                          : "Chuniye specific logo ko"}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* SPECIFIC USERS SELECTION BOX */}
              {targetType === "SPECIFIC" && (
                <div className="rounded-2xl border border-purple-200/90 bg-purple-50/30 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">Choose Users:</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700">
                        {selectedUserIds.length} of {users.length} Selected
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllFiltered}
                        className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer"
                      >
                        Select All Filtered ({filteredUsers.length})
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* USER SEARCH INPUT */}
                  <div className="relative">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input
                      type="text"
                      placeholder="Search by name, email, phone, company, or user ID..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition"
                    />
                    {userSearch && (
                      <button
                        type="button"
                        onClick={() => setUserSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* SELECTED CHIPS */}
                  {selectedUserIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-white rounded-xl border border-slate-200/80 orders-scrollbar">
                      {selectedUserIds.map((id) => {
                        const userObj = users.find((u) => u.id === id);
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200"
                          >
                            <span>{userObj?.full_name || `User #${id}`}</span>
                            <button
                              type="button"
                              onClick={() => toggleUserSelection(id)}
                              className="hover:text-rose-600 cursor-pointer ml-0.5"
                              title="Remove"
                            >
                              ✕
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* SCROLLABLE USERS LIST */}
                  <div className="rounded-xl border border-slate-200 bg-white max-h-52 overflow-y-auto divide-y divide-slate-100 shadow-2xs orders-scrollbar">
                    {usersLoading ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-purple-600 mr-2"></div>
                        Loading registered users...
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        {users.length === 0 ? "No users registered yet" : `No users match "${userSearch}"`}
                      </div>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSelected = selectedUserIds.includes(u.id);
                        return (
                          <div
                            key={u.id}
                            onClick={() => toggleUserSelection(u.id)}
                            className={`p-2.5 px-3 flex items-center justify-between gap-3 transition cursor-pointer ${
                              isSelected ? "bg-purple-50/70 hover:bg-purple-100/60" : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}} // handled by parent div click
                                className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
                              />
                              <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                  isSelected ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {(u.full_name || "U").charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-900 truncate">
                                    {u.full_name || "Unnamed User"}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-mono">
                                    #{u.id}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 truncate flex items-center gap-2">
                                  <span>{u.email}</span>
                                  {u.phone_no && <span>• {u.phone_no}</span>}
                                  {u.company_name && <span>• {u.company_name}</span>}
                                </div>
                              </div>
                            </div>

                            {isSelected && (
                              <span className="text-[10.5px] font-bold text-purple-700 shrink-0 bg-purple-100 px-2 py-0.5 rounded-full">
                                Selected ✓
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* NOTICE TYPE PICKER */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Notice Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {NOTICE_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        type === t.id
                          ? "border-[#008dd2] bg-sky-50/60 ring-2 ring-[#008dd2]/20"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-800 block">
                        {t.label}
                      </span>
                      <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {t.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* TITLE */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notice Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Important Account Verification or Notice"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10 transition"
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Message Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter the full message details that users should read..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10 transition resize-y"
                />
              </div>

              {/* LIVE PREVIEW OF POPUP */}
              {(title || description) && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      User Screen Popup Preview:
                    </p>
                    <span className="text-[10.5px] font-semibold text-slate-500">
                      Audience: {targetType === "SPECIFIC" ? `${selectedUserIds.length} user(s)` : "All Users"}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-slate-200/80 shadow-2xs">
                    <p className="text-xs font-bold text-slate-900">{title || "Notice Title"}</p>
                    <p className="text-[11px] text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                      {description || "Description preview..."}
                    </p>
                  </div>
                </div>
              )}

              {/* ACTIONS */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                    targetType === "SPECIFIC"
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "bg-[#008dd2] hover:bg-[#007cb8]"
                  }`}
                >
                  {submitting
                    ? "Sending Notice..."
                    : targetType === "SPECIFIC"
                    ? `Send Notice to ${selectedUserIds.length} Selected User${selectedUserIds.length === 1 ? "" : "s"}`
                    : "Broadcast to All Users"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP PREVIEW MODAL (EXACT USER SIDE REPLICA) */}
      {previewItem && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewItem(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md animate-in fade-in duration-150 select-none"
        >
          <div className="relative w-full max-w-[490px] overflow-hidden rounded-[26px] bg-white border border-slate-200/90 shadow-[0_25px_70px_-15px_rgba(2,12,27,0.35)] animate-in zoom-in-95 duration-150">
            {/* AMBIENT RADIANT GLOW */}
            <div
              className={`absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-36 rounded-full blur-3xl pointer-events-none opacity-60 ${
                previewItem.type === "UPDATE"
                  ? "bg-gradient-to-b from-emerald-500/25 via-teal-500/10 to-transparent"
                  : previewItem.type === "ALERT"
                  ? "bg-gradient-to-b from-amber-500/25 via-orange-500/10 to-transparent"
                  : previewItem.type === "WARNING"
                  ? "bg-gradient-to-b from-rose-500/25 via-red-500/10 to-transparent"
                  : "bg-gradient-to-b from-sky-500/25 via-blue-500/10 to-transparent"
              }`}
            />

            {/* TOP ACCENT LINE */}
            <div
              className={`h-[2px] w-full bg-gradient-to-r ${
                previewItem.type === "UPDATE"
                  ? "from-transparent via-emerald-400 to-transparent"
                  : previewItem.type === "ALERT"
                  ? "from-transparent via-amber-400 to-transparent"
                  : previewItem.type === "WARNING"
                  ? "from-transparent via-rose-500 to-transparent"
                  : "from-transparent via-sky-400 to-transparent"
              }`}
            />

            {/* CLOSE BUTTON */}
            <button
              type="button"
              onClick={() => setPreviewItem(null)}
              className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100/90 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-all cursor-pointer shadow-xs active:scale-90"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="p-6 sm:p-7 pt-5 relative">
              {/* TOP META ROW */}
              <div className="flex items-center justify-between pr-10 mb-5">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border tracking-wide uppercase ${
                    previewItem.type === "UPDATE"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200/80"
                      : previewItem.type === "ALERT"
                      ? "bg-amber-50 text-amber-700 border-amber-200/80"
                      : previewItem.type === "WARNING"
                      ? "bg-rose-50 text-rose-700 border-rose-200/80"
                      : "bg-sky-50 text-sky-600 border-sky-200/80"
                  }`}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
                  </span>
                  {previewItem.type === "UPDATE"
                    ? "Feature Update"
                    : previewItem.type === "ALERT"
                    ? "Attention Required"
                    : previewItem.type === "WARNING"
                    ? "Urgent Alert"
                    : "Official Notice"}
                </span>

                {previewItem.created_at && (
                  <span className="text-[11px] font-medium text-slate-400">
                    {formatDate(previewItem.created_at)}
                  </span>
                )}
              </div>

              {/* HERO ICON & AUTHOR */}
              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`flex h-13 w-13 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ring-4 ring-white ${
                    previewItem.type === "UPDATE"
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25"
                      : previewItem.type === "ALERT"
                      ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/25"
                      : previewItem.type === "WARNING"
                      ? "bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/25"
                      : "bg-gradient-to-br from-sky-500 to-[#008dd2] shadow-sky-500/25"
                  }`}
                >
                  {previewItem.type === "UPDATE" ? (
                    <HiOutlineSparkles className="text-2xl" />
                  ) : previewItem.type === "WARNING" || previewItem.type === "ALERT" ? (
                    <HiOutlineExclamationCircle className="text-2xl" />
                  ) : (
                    <HiOutlineSpeakerphone className="text-2xl" />
                  )}
                </div>

                <div className="min-w-0 pt-0.5">
                  <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500">
                    <svg className="w-3.5 h-3.5 text-[#008dd2] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    <span>ShipDrop Notice</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.2 rounded-full">
                      {previewItem.target_type === "SPECIFIC"
                        ? `Target: ${previewItem.target_user_ids?.length || 0} User(s)`
                        : "Target: All Users"}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug mt-1">
                    {previewItem.title}
                  </h2>
                </div>
              </div>

              {/* MESSAGE CONTENT BOX */}
              <div className="mt-3 rounded-2xl bg-slate-50/80 border border-slate-200/60 p-4 sm:p-4.5">
                <div className="text-[13px] sm:text-[13.5px] text-slate-700 whitespace-pre-line leading-relaxed font-normal max-h-[220px] overflow-y-auto pr-1">
                  {previewItem.description}
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className={`w-full py-3 px-5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 group ${
                    previewItem.type === "UPDATE"
                      ? "bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 shadow-emerald-500/25 hover:brightness-105"
                      : previewItem.type === "ALERT"
                      ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 shadow-amber-500/25 hover:brightness-105"
                      : previewItem.type === "WARNING"
                      ? "bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 shadow-rose-500/25 hover:brightness-105"
                      : "bg-gradient-to-r from-[#008dd2] via-sky-500 to-[#007cb8] shadow-sky-500/25 hover:brightness-105"
                  }`}
                >
                  <span>Okk! Got it</span>
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>

                <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>This notification won't pop up again once closed.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
