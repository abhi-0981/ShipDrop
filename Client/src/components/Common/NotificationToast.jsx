import React, { useEffect, useState, useRef } from "react";
import { HiX, HiArrowRight } from "react-icons/hi";

/**
 * Modern Harmonic Sound Chime via Web Audio API
 * Plays a pleasant, gentle 2-tone chime without external audio files / 404 risk.
 */
let lastChimeTime = 0;

export const playNotificationChime = () => {
  const now = Date.now();
  if (now - lastChimeTime < 150) return;
  lastChimeTime = now;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Tone 1: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.18, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.28);

    // Tone 2: B5 (987.77 Hz - perfect fifth harmony)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(987.77, now + 0.08);
    gain2.gain.setValueAtTime(0.001, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.22, now + 0.11);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.55);
  } catch (err) {
    // Autoplay policy fallback (silent)
  }
};

const getNotificationConfig = (type, notification) => {
  const norm = String(type || "").toUpperCase();
  const refId = String(notification?.reference_id || "").toUpperCase();
  if (norm === "NDR_ALERT") {
    return {
      label: "NDR Action Required",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900/60",
      iconBg: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400",
      barColor: "bg-rose-500",
      actionText: "Click to take action",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    };
  }
  if (norm === "TICKET_REPLY") {
    return {
      label: "Support Reply",
      badgeClass: "bg-sky-50 text-[#008dd2] border-sky-200/80 dark:bg-sky-950/60 dark:text-[#38bdf8] dark:border-sky-900/60",
      iconBg: "bg-sky-100 text-[#008dd2] dark:bg-sky-900/40 dark:text-sky-300",
      barColor: "bg-[#008dd2]",
      actionText: "Click to view reply",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    };
  }
  if (norm === "WALLET") {
    const isLow = refId === "LOW_WALLET_BALANCE";
    if (isLow) {
      return {
        label: "Low Balance",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900/60",
        iconBg: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400",
        barColor: "bg-rose-500",
        actionText: "Click to Recharge Now",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
      };
    }
    return {
      label: "Wallet Credited",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900/60",
      iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
      barColor: "bg-emerald-500",
      actionText: "Click to view details",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 7V6a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v8a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V7" />
          <path d="M16 13h2" />
        </svg>
      ),
    };
  }
  if (norm === "COD_REMITTANCE") {
    return {
      label: "COD Payout",
      badgeClass: "bg-violet-50 text-violet-700 border-violet-200/80 dark:bg-violet-950/60 dark:text-violet-400 dark:border-violet-900/60",
      iconBg: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
      barColor: "bg-violet-500",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
          <path d="M12 6v2M12 16v2" />
        </svg>
      ),
    };
  }
  if (norm === "WEIGHT_DISCREPANCY") {
    return {
      label: "Weight Discrepancy",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900/60",
      iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
      barColor: "bg-amber-500",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="M7 21h10" />
          <path d="M12 3v18" />
          <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
        </svg>
      ),
    };
  }

  // Default / System / Shipment
  return {
    label: "ShipDrop Alert",
    badgeClass: "bg-sky-50 text-[#008dd2] border-sky-200/80 dark:bg-sky-950/60 dark:text-[#38bdf8] dark:border-sky-900/60",
    iconBg: "bg-sky-100 text-[#008dd2] dark:bg-sky-900/40 dark:text-sky-300",
    barColor: "bg-[#008dd2]",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
    ),
  };
};

export default function NotificationToast({
  notification,
  onOpen,
  onDismiss,
  duration = 6500,
}) {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(duration);
  const timerRef = useRef(null);

  // Play audio chime on mount or on any update/reply
  useEffect(() => {
    if (notification) {
      playNotificationChime();
    }
  }, [
    notification?.id,
    notification?.toastInstanceKey,
    notification?.message_count,
    notification?.created_at,
  ]);

  // Handle countdown & progress bar
  useEffect(() => {
    if (!notification) return;

    if (isPaused) {
      // Pause
      clearInterval(timerRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    const intervalTime = 30; // update every 30ms for smooth progress bar

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const timeLeft = Math.max(0, remainingTimeRef.current - elapsed);
      const nextProgress = Math.max(0, (timeLeft / duration) * 100);

      setProgress(nextProgress);

      if (timeLeft <= 0) {
        clearInterval(timerRef.current);
        handleCloseWithoutOpen();
      }
    }, intervalTime);

    return () => clearInterval(timerRef.current);
  }, [notification, isPaused, duration]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    // calculate remaining
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const handleCloseWithoutOpen = () => {
    setIsClosing(true);
    setTimeout(() => {
      onDismiss?.(notification);
    }, 250);
  };

  const handleClickOpen = (e) => {
    e.stopPropagation();
    setIsClosing(true);
    setTimeout(() => {
      onOpen?.(notification);
    }, 150);
  };

  if (!notification) return null;

  const config = getNotificationConfig(notification.type, notification);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClickOpen}
      className={`w-full cursor-pointer select-none transition-all duration-300 ease-out transform ${
        isClosing
          ? "opacity-0 translate-x-8 scale-95"
          : "opacity-100 translate-x-0 scale-100"
      } animate-in slide-in-from-right-8 fade-in-0 duration-300`}
    >
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-sky-950/15 dark:shadow-black/60 ring-1 ring-slate-900/5 dark:ring-white/10 hover:shadow-sky-500/10 hover:border-[#008dd2]/50 transition-all">
        {/* TOP ACCENT LINE */}
        <div className={`h-1 w-full ${config.barColor}`} />

        <div className="p-3.5 sm:p-4">
          {/* HEADER ROW */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#008dd2] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#008dd2]"></span>
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Notification
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.2 text-[10px] font-bold ${config.badgeClass}`}
              >
                {config.label}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                Just now
              </span>
              <button
                type="button"
                title="Dismiss to bell"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseWithoutOpen();
                }}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
              >
                <HiX size={15} />
              </button>
            </div>
          </div>

          {/* MAIN BODY */}
          <div className="flex items-start gap-3">
            {/* ICON BADGE */}
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.iconBg} shadow-xs`}
            >
              {config.icon}
            </div>

            {/* CONTENT */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-1">
                  {notification.title || "New notification"}
                </h4>
                {Number(notification.message_count || 1) > 1 && (
                  <span className="rounded-full bg-sky-100 dark:bg-sky-950/80 text-[#008dd2] dark:text-[#38bdf8] border border-sky-200 dark:border-sky-900 px-1.5 py-0.2 text-[9px] font-extrabold shrink-0">
                    +{notification.message_count} replies
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                {notification.message || "You have a new update in your account."}
              </p>

              <div className="mt-2.5 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#008dd2] dark:text-[#38bdf8] flex items-center gap-1 group-hover:underline">
                  {config.actionText || "Click to view details"} <HiArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  Dismiss = Save in Bell
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PROGRESS BAR (AUTO-DISMISS TIMER) */}
        <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full ${config.barColor} transition-all duration-75 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
