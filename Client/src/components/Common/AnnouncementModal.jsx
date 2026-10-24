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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 select-none"
    >
      <div className="relative w-full max-w-[460px] overflow-hidden rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-200">
        {/* TOP ACCENT COLOR STRIPE */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${typeConfig.bar}`} />

        {/* CLOSE BUTTON (X) */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close Announcement"
          className="absolute top-3.5 right-3.5 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="p-6">
          {/* HEADER ICON & BADGE */}
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-2xs ${typeConfig.iconBg}`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>

            <div className="min-w-0">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${typeConfig.badge}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse"></span>
                {typeConfig.label}
              </span>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                Announcement from ShipDrop Admin {announcement.created_at ? `• ${formatDate(announcement.created_at)}` : ""}
              </p>
            </div>
          </div>

          {/* TITLE */}
          <div className="mt-4">
            <h3 className="text-base sm:text-[17px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
              {announcement.title}
            </h3>
          </div>

          {/* MESSAGE CONTENT BOX */}
          <div className="mt-3 max-h-[260px] overflow-y-auto rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 p-3.5 [scrollbar-width:thin]">
            <p className="text-xs sm:text-[12.5px] text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-normal">
              {announcement.description}
            </p>
          </div>

          {/* ACTION BUTTON */}
          <div className="mt-5">
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#008dd2] hover:bg-[#007cb8] active:scale-[0.98] transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>I have read and understood</span>
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
