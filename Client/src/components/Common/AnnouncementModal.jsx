import React, { useState, useEffect } from "react";
import api from "../../services/api";

const TYPE_CONFIG = {
  INFO: {
    label: "Official Announcement",
    badge: "bg-sky-500/10 text-[#008dd2] dark:text-sky-400 border-sky-500/25",
    dotBg: "bg-[#008dd2]",
    bar: "from-[#008dd2] via-sky-400 to-indigo-500",
    glowColor: "rgba(0, 141, 210, 0.18)",
    iconBox: "bg-sky-500/10 text-[#008dd2] dark:text-sky-400 border-sky-500/20 shadow-sky-500/10",
    icon: (
      <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  UPDATE: {
    label: "Platform Update",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    dotBg: "bg-emerald-500",
    bar: "from-emerald-500 via-teal-400 to-cyan-500",
    glowColor: "rgba(16, 185, 129, 0.18)",
    iconBox: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-emerald-500/10",
    icon: (
      <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.4 7.2 7.6.8-5.5 5.3 1.3 7.7-6.8-3.6-6.8 3.6 1.3-7.7-5.5-5.3 7.6-.8z" />
      </svg>
    ),
  },
  ALERT: {
    label: "Important Notice",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
    dotBg: "bg-amber-500",
    bar: "from-amber-500 via-orange-400 to-yellow-400",
    glowColor: "rgba(245, 158, 11, 0.18)",
    iconBox: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-amber-500/10",
    icon: (
      <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  WARNING: {
    label: "Urgent Priority Alert",
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
    dotBg: "bg-rose-500",
    bar: "from-rose-500 via-red-500 to-amber-500",
    glowColor: "rgba(244, 63, 94, 0.18)",
    iconBox: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 shadow-rose-500/10",
    icon: (
      <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
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
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300 select-none"
    >
      <div className="relative w-full max-w-[620px] overflow-hidden rounded-3xl bg-white/95 dark:bg-[#0c1322]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.8)_inset] dark:shadow-[0_30px_90px_-20px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.06)_inset] animate-in zoom-in-95 duration-200">
        
        {/* TOP ACCENT GRADIENT BAR */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${typeConfig.bar}`} />

        {/* AMBIENT RADIAL LIGHT GLOW IN BACKGROUND */}
        <div
          className="pointer-events-none absolute -top-24 -left-16 w-80 h-80 rounded-full blur-3xl opacity-20 dark:opacity-25"
          style={{ background: typeConfig.glowColor }}
        />
        <div
          className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl opacity-15 dark:opacity-20"
          style={{ background: typeConfig.glowColor }}
        />

        {/* TOP RIGHT CLOSE BUTTON (X) */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close Announcement"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100/90 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-all cursor-pointer shadow-xs group"
        >
          <svg
            className="w-4 h-4 transition-transform group-hover:scale-110"
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

        {/* MODAL MAIN CONTENT */}
        <div className="relative z-10 p-5 sm:p-7 pt-6">
          
          {/* HEADER: ICON + BADGES */}
          <div className="flex items-start gap-4">
            {/* GLOWING ICON BOX */}
            <div
              className={`relative flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl sm:rounded-3xl border shadow-md transition-transform duration-300 hover:scale-105 ${typeConfig.iconBox}`}
            >
              {typeConfig.icon}
            </div>

            {/* BADGES & SUBTITLE */}
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                {/* CATEGORY PILL */}
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-2xs ${typeConfig.badge}`}
                >
                  <span className="relative flex h-2 w-2">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${typeConfig.dotBg}`}
                    ></span>
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${typeConfig.dotBg}`}
                    ></span>
                  </span>
                  {typeConfig.label}
                </span>

                {/* VERIFIED SHIPDROP ADMIN TAG */}
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <svg className="w-3.5 h-3.5 text-[#008dd2]" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Admin Broadcast
                </span>
              </div>

              {/* DATE / TIMESTAMP */}
              {announcement.created_at && (
                <p className="flex items-center gap-1 text-[11.5px] text-slate-400 dark:text-slate-500 font-medium mt-1.5">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>{formatDate(announcement.created_at)}</span>
                </p>
              )}
            </div>
          </div>

          {/* ANNOUNCEMENT TITLE */}
          <div className="mt-4 sm:mt-5">
            <h3 className="text-lg sm:text-[21px] font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-snug">
              {announcement.title}
            </h3>
          </div>

          {/* DESCRIPTION READER BOX */}
          <div className="relative mt-3.5 sm:mt-4 rounded-2xl bg-gradient-to-b from-slate-50/90 via-slate-50/60 to-slate-100/40 dark:from-slate-900/70 dark:via-slate-900/50 dark:to-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 overflow-hidden shadow-inner">
            
            {/* LEFT ACCENT VERTICAL STRIPE */}
            <div
              className={`absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full bg-gradient-to-b ${typeConfig.bar}`}
            />

            {/* SCROLLABLE TEXT */}
            <div className="max-h-[280px] sm:max-h-[320px] overflow-y-auto pl-2.5 pr-2 [scrollbar-width:thin] scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              <p className="text-[13.5px] sm:text-[14.5px] text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed font-normal">
                {announcement.description}
              </p>
            </div>
          </div>

          {/* FOOTER ACTION BAR */}
          <div className="mt-5 sm:mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/70 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            
            {/* REASSURANCE TEXT */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11.5px] text-slate-400 dark:text-slate-500">
              <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
              <span>Official Merchant Notification</span>
            </div>

            {/* PRIMARY CTA BUTTON */}
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto min-w-[210px] py-3 px-6 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#008dd2] via-[#009beb] to-[#007cb8] hover:from-[#007cb8] hover:to-[#006ca3] shadow-md shadow-[#008dd2]/25 hover:shadow-lg hover:shadow-[#008dd2]/35 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>I have read & understood</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
