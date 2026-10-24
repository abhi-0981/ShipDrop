import React, { useState, useEffect } from "react";
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
  const [previewItem, setPreviewItem] = useState(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem("adminToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
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

    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/admin/announcements`,
        {
          title: title.trim(),
          description: description.trim(),
          type,
          is_active: 1,
        },
        { headers: getAuthHeader() }
      );

      if (res.data?.success) {
        toast.success("Broadcast announcement sent to all users!");
        setTitle("");
        setDescription("");
        setType("INFO");
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
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* MODAL HEADER */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#008dd2]/10 text-[#008dd2] flex items-center justify-center border border-[#008dd2]/20">
                  <HiOutlineSpeakerphone className="text-base" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Create User Broadcast Notice
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    This message will pop up on every user's screen until closed
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* MODAL FORM */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
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
                  placeholder="e.g. Scheduled Maintenance on Sunday 2:00 AM"
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
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    User Screen Popup Preview:
                  </p>
                  <div className="bg-white rounded-lg p-3 border border-slate-200/80 shadow-2xs">
                    <p className="text-xs font-bold text-slate-900">{title || "Notice Title"}</p>
                    <p className="text-[11px] text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                      {description || "Description preview..."}
                    </p>
                  </div>
                </div>
              )}

              {/* ACTIONS */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
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
                  className="px-5 py-2 text-xs font-bold text-white bg-[#008dd2] hover:bg-[#007cb8] rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? "Broadcasting..." : "Broadcast to All Users"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP PREVIEW FLOATING CARD */}
      {previewItem && (() => {
        const typeCfg =
          NOTICE_TYPES.find((t) => t.id === previewItem.type) || NOTICE_TYPES[0];
        const topAccentColors = {
          INFO: "from-[#008dd2] via-sky-400 to-blue-600",
          UPDATE: "from-emerald-500 via-teal-400 to-emerald-600",
          ALERT: "from-amber-500 via-orange-400 to-amber-600",
          WARNING: "from-rose-500 via-red-500 to-rose-600",
        };
        const accentGradient = topAccentColors[previewItem.type] || topAccentColors.INFO;

        return (
          <div className="fixed bottom-6 right-6 z-50 w-[calc(100%-48px)] sm:w-[410px] pointer-events-auto animate-in slide-in-from-bottom-5 fade-in duration-200">
            <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 shadow-[0_16px_40px_-10px_rgba(0,0,0,0.22)]">
              {/* TOP ACCENT STRIP */}
              <div className={`h-1 w-full bg-gradient-to-r ${accentGradient}`} />

              {/* CARD CONTENT */}
              <div className="p-4 sm:p-5">
                {/* HEADER META ROW */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${typeCfg.badge}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                      {typeCfg.label}
                    </span>

                    {previewItem.created_at && (
                      <span className="text-[10.5px] font-medium text-slate-400 truncate">
                        • {formatDate(previewItem.created_at)}
                      </span>
                    )}
                  </div>

                  {/* CLOSE BUTTON */}
                  <button
                    type="button"
                    onClick={() => setPreviewItem(null)}
                    aria-label="Close"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* MAIN MESSAGE WITH ICON */}
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border mt-0.5 shadow-xs bg-sky-50 text-[#008dd2] border-sky-200">
                    <HiOutlineSpeakerphone className="text-lg" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-[14px] font-bold text-slate-900 tracking-tight leading-snug">
                      {previewItem.title}
                    </h4>

                    <div className="text-[12.5px] text-slate-600 leading-relaxed font-normal whitespace-pre-line mt-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {previewItem.description}
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER BAR */}
              <div className="px-4 sm:px-5 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 font-medium">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-emerald-500 shrink-0"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="truncate">Won't show again</span>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#008dd2] hover:bg-[#007cb8] active:scale-[0.98] transition-all shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <span>Got it</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
