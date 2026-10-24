import React, { useState, useEffect } from "react";
import api from "../../services/api";

const TYPE_CONFIG = {
  INFO: {
    badge: "bg-sky-50 dark:bg-sky-950/70 text-[#008dd2] dark:text-[#38bdf8] border-sky-200/60 dark:border-sky-800/60",
    bar: "from-[#008dd2] to-sky-400",
    iconBg: "bg-sky-50 dark:bg-sky-950/60 text-[#008dd2] dark:text-[#38bdf8] border-sky-200/60 dark:border-sky-800/50",
    label: "Important Notice",
  },
  UPDATE: {
    badge: "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60",
    bar: "from-emerald-500 to-teal-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50",
    label: "New Update",
  },
  ALERT: {
    badge: "bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60",
    bar: "from-amber-500 to-orange-400",
    iconBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/50",
    label: "Attention Required",
  },
  WARNING: {
    badge: "bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/60",
    bar: "from-rose-500 to-red-500",
    iconBg: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/50",
    label: "Urgent Alert",
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

  const handleClose = async () => {
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none"
    >
      <div className="relative w-full max-w-[440px] overflow-hidden rounded-[24px] bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 shadow-[0_30px_80px_-15px_rgba(0,0,0,0.35)] dark:shadow-[0_30px_90px_-15px_rgba(0,0,0,0.85)] ring-1 ring-black/[0.04] dark:ring-white/[0.08] animate-in zoom-in-95 duration-200">
        {/* TOP AMBIENT GLOW ACCENT */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#008dd2]/10 via-[#008dd2]/[0.02] to-transparent pointer-events-none" />

        {/* CLOSE BUTTON (X) */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close Announcement"
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="relative p-6 sm:p-7">
          {/* HEADER ICON & BADGE */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-[#008dd2]/15 dark:from-sky-950/60 dark:to-sky-900/30 text-[#008dd2] dark:text-[#38bdf8] border border-[#008dd2]/20 shadow-xs">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#008dd2] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#008dd2]"></span>
              </span>
            </div>

            <div>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${typeConfig.badge}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse"></span>
                {typeConfig.label}
              </span>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                {announcement.created_at ? formatDate(announcement.created_at) : "Important Notice"}
              </p>
            </div>
          </div>

          {/* TITLE */}
          <div className="mt-4">
            <h3 className="text-lg sm:text-[19px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
              {announcement.title}
            </h3>
          </div>

          {/* MESSAGE CONTENT (Clean, open, readable typography with smooth scroll) */}
          <div className="mt-3 max-h-[280px] overflow-y-auto pr-1 [scrollbar-width:thin]">
            <p className="text-[13px] sm:text-[13.5px] text-slate-600 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line">
              {announcement.description}
            </p>
          </div>

          {/* ACTION BUTTON */}
          <div className="mt-6 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3 px-5 rounded-[14px] text-xs font-bold text-white bg-gradient-to-r from-[#008dd2] to-[#007cb8] hover:from-[#007cb8] hover:to-[#006ca0] active:scale-[0.98] transition-all shadow-md shadow-[#008dd2]/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Okay, Got it</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
