import React, { useState, useEffect, useCallback } from "react";
import api from "../../services/api";

const TYPE_CONFIG = {
  INFO: {
    label: "Official Notice",
    badge:
      "bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60",
    dot: "bg-sky-500",
    glow: "from-sky-500/25 via-blue-500/10 to-transparent",
    topLine: "from-transparent via-sky-400 to-transparent",
    iconGradient: "from-sky-500 to-[#008dd2]",
    iconShadow: "shadow-sky-500/25 ring-sky-500/15",
    btnGradient: "from-[#008dd2] via-sky-500 to-[#007cb8]",
    btnShadow: "shadow-sky-500/25 hover:shadow-sky-500/35",
  },
  UPDATE: {
    label: "Feature Update",
    badge:
      "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60",
    dot: "bg-emerald-500",
    glow: "from-emerald-500/25 via-teal-500/10 to-transparent",
    topLine: "from-transparent via-emerald-400 to-transparent",
    iconGradient: "from-emerald-500 to-teal-600",
    iconShadow: "shadow-emerald-500/25 ring-emerald-500/15",
    btnGradient: "from-emerald-600 via-teal-500 to-emerald-600",
    btnShadow: "shadow-emerald-500/25 hover:shadow-emerald-500/35",
  },
  ALERT: {
    label: "Attention Required",
    badge:
      "bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60",
    dot: "bg-amber-500",
    glow: "from-amber-500/25 via-orange-500/10 to-transparent",
    topLine: "from-transparent via-amber-400 to-transparent",
    iconGradient: "from-amber-500 to-orange-500",
    iconShadow: "shadow-amber-500/25 ring-amber-500/15",
    btnGradient: "from-amber-500 via-orange-500 to-amber-600",
    btnShadow: "shadow-amber-500/25 hover:shadow-amber-500/35",
  },
  WARNING: {
    label: "Urgent Alert",
    badge:
      "bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60",
    dot: "bg-rose-500",
    glow: "from-rose-500/25 via-red-500/10 to-transparent",
    topLine: "from-transparent via-rose-500 to-transparent",
    iconGradient: "from-rose-500 to-red-600",
    iconShadow: "shadow-rose-500/25 ring-rose-500/15",
    btnGradient: "from-rose-600 via-red-500 to-rose-600",
    btnShadow: "shadow-rose-500/25 hover:shadow-rose-500/35",
  },
};

export default function AnnouncementModal() {
  const [announcement, setAnnouncement] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkActiveAnnouncement = async () => {
      try {
        const savedUser = JSON.parse(localStorage.getItem("user") || "null");
        if (!savedUser?.id) return;

        const res = await api.get(`/announcements/active?user_id=${savedUser.id}`);
        if (!isMounted) return;

        if (res.data?.success && res.data?.has_announcement && res.data?.announcement) {
          const item = res.data.announcement;

          // Check client-side dismissed cache
          const cacheKey = `shipdrop_dismissed_notices_${savedUser.id}`;
          const dismissedList = JSON.parse(localStorage.getItem(cacheKey) || "[]");

          if (!dismissedList.includes(item.id)) {
            setAnnouncement(item);
            setIsOpen(true);
          }
        }
      } catch (err) {
        // silent
      }
    };

    // Small delay after page load so dashboard finishes rendering smoothly
    const timer = setTimeout(checkActiveAnnouncement, 600);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const handleClose = useCallback(async () => {
    if (!announcement) return;
    const itemToDismiss = announcement;

    // Immediately close UI
    setIsOpen(false);
    setAnnouncement(null);

    try {
      const savedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (savedUser?.id) {
        // 1. Update localStorage cache
        const cacheKey = `shipdrop_dismissed_notices_${savedUser.id}`;
        const dismissedList = JSON.parse(localStorage.getItem(cacheKey) || "[]");
        if (!dismissedList.includes(itemToDismiss.id)) {
          dismissedList.push(itemToDismiss.id);
          localStorage.setItem(cacheKey, JSON.stringify(dismissedList));
        }

        // 2. Persist in Database
        await api.post("/announcements/dismiss", {
          user_id: savedUser.id,
          announcement_id: itemToDismiss.id,
        });
      }
    } catch (err) {
      // silent
    }
  }, [announcement]);

  // Handle ESC key to dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen || !announcement) return null;

  const typeConfig = TYPE_CONFIG[announcement.type] || TYPE_CONFIG.INFO;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const renderIcon = () => {
    switch (announcement.type) {
      case "UPDATE":
        return (
          <svg
            className="w-7 h-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        );
      case "ALERT":
        return (
          <svg
            className="w-7 h-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        );
      case "WARNING":
        return (
          <svg
            className="w-7 h-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case "INFO":
      default:
        return (
          <svg
            className="w-7 h-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 5.882V19.24a1.76 1.76 0 0 1-3.417.592l-2.147-6.15M18 8a3 3 0 0 0-3-3H7a4 4 0 0 0-4 4v2a4 4 0 0 0 4 4h2l4 4.5V4l-4 4.5" />
            <path d="M19 8a5 5 0 0 1 0 8" />
            <path d="M21 5a9 9 0 0 1 0 14" />
          </svg>
        );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 dark:bg-black/80 backdrop-blur-md notice-backdrop-animate select-none"
    >
      <div className="relative w-full max-w-[490px] overflow-hidden rounded-[26px] bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800 shadow-[0_25px_70px_-15px_rgba(2,12,27,0.35)] dark:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.85)] notice-card-animate">
        {/* AMBIENT RADIANT GLOW IN TOP BACKGROUND */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-36 rounded-full blur-3xl pointer-events-none opacity-60 dark:opacity-40 bg-gradient-to-b ${typeConfig.glow}`}
        />

        {/* ULTRA-FINE TOP ACCENT HIGHLIGHT */}
        <div className={`h-[2px] w-full bg-gradient-to-r ${typeConfig.topLine}`} />

        {/* CLOSE BUTTON (X) */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close Announcement"
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100/90 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer shadow-xs active:scale-90"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="p-6 sm:p-7 pt-5 relative">
          {/* TOP META ROW: BADGE + DATE */}
          <div className="flex items-center justify-between pr-10 mb-5">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border tracking-wide uppercase ${typeConfig.badge}`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
              </span>
              {typeConfig.label}
            </span>

            {announcement.created_at && (
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                {formatDate(announcement.created_at)}
              </span>
            )}
          </div>

          {/* HERO ICON & AUTHOR SIGNATURE */}
          <div className="flex items-start gap-4 mb-4">
            <div
              className={`flex h-13 w-13 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${typeConfig.iconGradient} text-white shadow-lg ${typeConfig.iconShadow} ring-4 ring-white dark:ring-slate-900`}
            >
              {renderIcon()}
            </div>

            <div className="min-w-0 pt-0.5">
              <div className="flex items-center gap-1 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                <svg
                  className="w-3.5 h-3.5 text-[#008dd2] shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                <span>ShipDrop Official Broadcast</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug mt-1">
                {announcement.title}
              </h2>
            </div>
          </div>

          {/* MESSAGE CONTENT BOX (ELEGANT & CLEAN) */}
          <div className="mt-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/50 p-4 sm:p-4.5">
            <div className="text-[13px] sm:text-[13.5px] text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-normal max-h-[220px] overflow-y-auto pr-1 orders-scrollbar">
              {announcement.description}
            </div>
          </div>

          {/* ACTION BUTTON & DISMISS INFO */}
          <div className="mt-5 space-y-2.5">
            <button
              type="button"
              onClick={handleClose}
              className={`w-full py-3 px-5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r ${typeConfig.btnGradient} hover:brightness-105 active:scale-[0.98] transition-all shadow-md ${typeConfig.btnShadow} cursor-pointer flex items-center justify-center gap-2 group`}
            >
              <span>I Have Read and Understood</span>
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center flex items-center justify-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 opacity-70"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
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
  );
}
