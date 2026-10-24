import React, { useState, useEffect } from "react";
import api from "../../services/api";

const TYPE_CONFIG = {
  INFO: {
    badge: "bg-sky-50 dark:bg-sky-950/70 text-[#008dd2] dark:text-[#38bdf8] border-sky-200/60 dark:border-sky-800/60",
    iconBg: "bg-sky-50 dark:bg-sky-950/60 text-[#008dd2] dark:text-[#38bdf8] border-sky-200/60 dark:border-sky-800/50",
    dot: "bg-[#008dd2]",
    label: "General Notice",
  },
  UPDATE: {
    badge: "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50",
    dot: "bg-emerald-500",
    label: "Feature Update",
  },
  ALERT: {
    badge: "bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60",
    iconBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/50",
    dot: "bg-amber-500",
    label: "Attention Required",
  },
  WARNING: {
    badge: "bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/60",
    iconBg: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/50",
    dot: "bg-rose-500",
    label: "Urgent Warning",
  },
};

export default function AnnouncementModal() {
  const [announcement, setAnnouncement] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

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
    const timer = setTimeout(checkActiveAnnouncement, 700);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const handleClose = async () => {
    if (!announcement || isClosing) return;
    setIsClosing(true);
    const itemToDismiss = announcement;

    // Smooth exit delay
    setTimeout(() => {
      setIsOpen(false);
      setAnnouncement(null);
      setIsClosing(false);
    }, 220);

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
  };

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

  // Top accent line colors per type
  const topAccentColors = {
    INFO: "from-[#008dd2] via-sky-400 to-blue-600",
    UPDATE: "from-emerald-500 via-teal-400 to-emerald-600",
    ALERT: "from-amber-500 via-orange-400 to-amber-600",
    WARNING: "from-rose-500 via-red-500 to-rose-600",
  };
  const accentGradient = topAccentColors[announcement.type] || topAccentColors.INFO;

  return (
    <div
      role="region"
      aria-label="System Announcement"
      className={`fixed bottom-5 right-5 z-[9999] w-[calc(100%-40px)] sm:w-[410px] pointer-events-auto transition-all duration-200 ${
        isClosing
          ? "opacity-0 translate-y-3 scale-95 pointer-events-none"
          : "opacity-100 translate-y-0 scale-100 animate-in slide-in-from-bottom-5 fade-in duration-300"
      }`}
    >
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-[0_16px_40px_-10px_rgba(0,0,0,0.22)] dark:shadow-[0_16px_45px_-10px_rgba(0,0,0,0.75)]">
        {/* TOP ACCENT STRIP */}
        <div className={`h-1 w-full bg-gradient-to-r ${accentGradient}`} />

        {/* CARD CONTENT */}
        <div className="p-4 sm:p-5">
          {/* HEADER META ROW */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${typeConfig.badge}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${typeConfig.dot} animate-pulse`} />
                {typeConfig.label}
              </span>

              {announcement.created_at && (
                <span className="text-[10.5px] font-medium text-slate-400 dark:text-slate-500 truncate">
                  • {formatDate(announcement.created_at)}
                </span>
              )}
            </div>

            {/* CLOSE BUTTON */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <svg
                width="13"
                height="13"
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
          </div>

          {/* MAIN MESSAGE WITH ICON */}
          <div className="flex items-start gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border mt-0.5 shadow-xs ${typeConfig.iconBg}`}
            >
              <svg
                width="17"
                height="17"
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
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-[14px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                {announcement.title}
              </h4>

              <div className="text-[12.5px] text-slate-600 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line mt-1.5 max-h-[140px] overflow-y-auto pr-1 select-text [scrollbar-width:thin]">
                {announcement.description}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER BAR */}
        <div className="px-4 sm:px-5 py-2.5 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 dark:text-slate-500 font-medium">
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
            onClick={handleClose}
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
}
