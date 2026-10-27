import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// 12 FREQUENTLY USED QUICK ACTION BOXES
const QUICK_ACTION_CARDS = [
  {
    id: "dashboard",
    title: "Dashboard",
    path: "/dashboard",
    circleStyle: "bg-blue-50/80 text-[#008dd2] border border-blue-100/90",
    renderIcon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    id: "create-order",
    title: "Create Order",
    path: "/create-order",
    circleStyle: "bg-indigo-50/80 text-indigo-600 border border-indigo-100/90",
    renderIcon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8.5 12 4 3 8.5v7L12 20l9-4.5v-7Z" />
        <path d="M3 8.5 12 13l9-4.5" />
        <path d="M12 13v7" />
      </svg>
    ),
  },
  {
    id: "all-orders",
    title: "All Orders",
    path: "/all-orders",
    circleStyle: "bg-sky-50/80 text-sky-600 border border-sky-100/90",
    renderIcon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    id: "rate-calc",
    title: "Rate Calculator",
    path: "/rate-calculator",
    circleStyle: "bg-purple-50/80 text-purple-600 border border-purple-100/90",
    renderIcon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="3" />
        <line x1="8" y1="6" x2="16" y2="6" />
        <line x1="16" y1="14" x2="16" y2="18" />
        <path d="M16 10h.01" />
        <path d="M12 10h.01" />
        <path d="M8 10h.01" />
        <path d="M12 14h.01" />
        <path d="M8 14h.01" />
        <path d="M12 18h.01" />
        <path d="M8 18h.01" />
      </svg>
    ),
  },
  {
    id: "shipment-report",
    title: "Shipment Report",
    path: "/reports/shipment-lifecycle",
    circleStyle: "bg-emerald-50/80 text-emerald-600 border border-emerald-100/90",
    renderIcon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="17" x2="9" y2="13" />
        <line x1="12" y1="17" x2="12" y2="10" />
        <line x1="15" y1="17" x2="15" y2="14" />
      </svg>
    ),
  },
  {
    id: "party-identities",
    title: "Party Identities",
    path: "/party-identities",
    circleStyle: "bg-amber-50/80 text-amber-600 border border-amber-100/90",
    renderIcon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "cod-remittance",
    title: "Remittance Transaction Log",
    path: "/cod-remittance",
    circleStyle: "bg-green-50/80 text-green-700 border border-green-100/90",
    renderIcon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <path d="M12 11v6" />
        <path d="M9.5 13.5a2.5 2.5 0 0 1 5 0c0 2-3 2-3 3.5" />
      </svg>
    ),
  },
  {
    id: "analytics",
    title: "Business Analytics",
    path: "/analytics",
    circleStyle: "bg-orange-50/80 text-orange-600 border border-orange-100/90",
    renderIcon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    id: "serviceability",
    title: "Pincode Serviceability",
    path: "/serviceability",
    circleStyle: "bg-teal-50/80 text-teal-600 border border-teal-100/90",
    renderIcon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    id: "pickup-address",
    title: "Pickup Addresses",
    path: "/settings/pickup-address",
    circleStyle: "bg-cyan-50/80 text-cyan-600 border border-cyan-100/90",
    renderIcon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18" />
        <path d="M5 21V7l8-4v18" />
        <path d="M19 21V11l-6-3" />
        <path d="M9 9v.01" />
        <path d="M9 12v.01" />
        <path d="M9 15v.01" />
        <path d="M9 18v.01" />
      </svg>
    ),
  },
  {
    id: "tickets",
    title: "Support Tickets",
    path: "/tickets",
    circleStyle: "bg-rose-50/80 text-rose-600 border border-rose-100/90",
    renderIcon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </svg>
    ),
  },
  {
    id: "wallet-passbook",
    title: "Wallet & Passbook",
    path: "/wallet",
    circleStyle: "bg-violet-50/80 text-violet-600 border border-violet-100/90",
    renderIcon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
      </svg>
    ),
  },
];

export default function CommandPalette() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle modal with Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      // Close with Escape
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
        return;
      }

      if (!isOpen) return;

      // Keyboard navigation between the 12 boxes
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % QUICK_ACTION_CARDS.length);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + QUICK_ACTION_CARDS.length) % QUICK_ACTION_CARDS.length);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        // Dynamic row step based on screen columns (6 on desktop, 4 on tablet, 3 on sm, 2 on xs)
        const step = window.innerWidth >= 1024 ? 6 : window.innerWidth >= 768 ? 4 : window.innerWidth >= 640 ? 3 : 2;
        setSelectedIndex((prev) => (prev + step) % QUICK_ACTION_CARDS.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const step = window.innerWidth >= 1024 ? 6 : window.innerWidth >= 768 ? 4 : window.innerWidth >= 640 ? 3 : 2;
        setSelectedIndex((prev) => (prev - step + QUICK_ACTION_CARDS.length) % QUICK_ACTION_CARDS.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = QUICK_ACTION_CARDS[selectedIndex];
        if (selected) {
          setIsOpen(false);
          navigate(selected.path);
        }
      }
    };

    const handleCustomOpen = () => {
      setSelectedIndex(0);
      setIsOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("shipdrop:openCommandPalette", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("shipdrop:openCommandPalette", handleCustomOpen);
    };
  }, [isOpen, selectedIndex, navigate]);

  // Reset selected index when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-[5px] animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      <div
        className="w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200/90 dark:border-[#1f2535] bg-white dark:bg-[#121620] shadow-2xl transition-all flex flex-col"
        style={{ maxHeight: "calc(100vh - 60px)" }}
      >
        {/* ======================================================== */}
        {/* 1. TOP HEADER WITH TITLE & CLOSE */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1f2535] bg-[#fafbfc] dark:bg-[#171b26] px-5 sm:px-6 py-3.5">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-xl bg-gradient-to-br from-[#008dd2] to-[#0072aa] text-white shadow-xs">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm sm:text-[15px] font-bold text-slate-800 dark:text-white leading-tight">
                Quick Actions
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-none">
                Frequently used shortcuts & navigation tools
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-block rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-400 shadow-2xs">
              ESC
            </kbd>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition active:scale-95 cursor-pointer"
              title="Close (ESC)"
              aria-label="Close Quick Actions"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. 12 QUICK ACTION BOXES (GRID - SLIGHTLY COMPACT) */}
        {/* ======================================================== */}
        <div className="overflow-y-auto flex-1 p-3.5 sm:p-5 [scrollbar-width:thin]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {QUICK_ACTION_CARDS.map((card, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate(card.path);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`group relative flex flex-col items-center justify-center rounded-2xl border p-3 sm:p-3.5 text-center transition-all duration-200 cursor-pointer min-h-[116px] ${
                    isSelected
                      ? "border-[#008dd2] bg-sky-50/50 shadow-md ring-2 ring-[#008dd2]/20 -translate-y-0.5"
                      : "border-slate-200/80 bg-white hover:border-[#008dd2]/70 hover:shadow-md hover:shadow-[#008dd2]/10 hover:-translate-y-0.5 active:scale-95"
                  }`}
                >
                  {/* Soft Circular Icon Badge */}
                  <div
                    className={`mb-2 sm:mb-2.5 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105 shadow-2xs ${card.circleStyle}`}
                  >
                    {card.renderIcon()}
                  </div>

                  {/* Title */}
                  <span className="text-[11.5px] sm:text-[12px] font-semibold text-slate-800 leading-snug group-hover:text-[#008dd2] transition-colors line-clamp-2 px-1">
                    {card.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. FOOTER HINTS */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-[#1f2535] bg-[#fafbfc] dark:bg-[#171b26] px-5 sm:px-6 py-2.5 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[9px] text-slate-500 shadow-2xs">←</kbd>
              {" "}
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[9px] text-slate-500 shadow-2xs">→</kbd>
              {" "}
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[9px] text-slate-500 shadow-2xs">↑</kbd>
              {" "}
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[9px] text-slate-500 shadow-2xs">↓</kbd>
              {" "}to navigate
            </span>
            <span>
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[9px] text-slate-500 shadow-2xs">↵</kbd>
              {" "}to select
            </span>
            <span>
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[9px] text-slate-500 shadow-2xs">ESC</kbd>
              {" "}to close
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 font-mono text-[10px] text-slate-400">
            <span>12 Quick Actions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
