import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ParcelDropLogo from "../../components/Common/ParcelDropLogo";

export default function NotFound() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    try {
      const user = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (user && token) {
        setIsLoggedIn(true);
      }
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#f6f8fb] text-slate-800 flex flex-col justify-between selection:bg-[#008dd2] selection:text-white">
      {/* =========================================================
          TOP HEADER
      ========================================================= */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 sm:h-[70px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            to={isLoggedIn ? "/dashboard" : "/"}
            className="group flex items-center transition-transform hover:scale-[1.02] active:scale-95"
            title="ParcelDrop"
          >
            <ParcelDropLogo height={38} />
          </Link>

          {/* Right link */}
          <div className="flex items-center gap-2.5">
            <Link
              to={isLoggedIn ? "/tickets" : "/"}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
              <span>{isLoggedIn ? "Help & Support" : "Track Order"}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* =========================================================
          MAIN 404 CONTENT (CLEAN & THEMED)
      ========================================================= */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-10 shadow-[0_4px_24px_rgba(15,23,42,0.04)] text-center relative overflow-hidden">
          {/* Subtle decorative background circle */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-50/80 blur-2xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-slate-50 blur-2xl" />

          {/* Animated 404 Illustration Badge */}
          <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-sky-50 border border-sky-100/90 text-[#008dd2] shadow-sm">
            <svg
              width="38"
              height="38"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-bounce"
              style={{ animationDuration: "2.5s" }}
            >
              <path d="m21 8-9 5-9-5" />
              <path d="M3 8l9-5 9 5v9l-9 5-9-5V8Z" />
              <path d="M12 13v9" />
              <path d="M7.5 5.5 16.5 10.5" />
            </svg>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-rose-500 text-[10px] font-bold text-white items-center justify-center">
                !
              </span>
            </span>
          </div>

          {/* BIG 404 NUMBER */}
          <div className="flex items-center justify-center gap-1 text-[64px] sm:text-[80px] font-black tracking-tight text-slate-900 leading-none">
            <span>4</span>
            <span className="text-[#008dd2]">0</span>
            <span>4</span>
          </div>

          {/* STATUS PILL */}
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#008dd2]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#008dd2]" />
            Route Not Found
          </div>

          {/* HEADINGS */}
          <h1 className="mt-3 text-lg sm:text-xl font-bold tracking-tight text-slate-800">
            Shipment Took a Wrong Turn
          </h1>

          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-500 max-w-md mx-auto">
            Aap jis page ko dhoondh rahe hain wo exist nahi karta ya kisi doosri jagah relocate ho chuka hai.
          </p>

          {/* PRIMARY ACTION BUTTONS */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            {/* Primary: Dashboard or Home */}
            <Link
              to={isLoggedIn ? "/dashboard" : "/"}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#008dd2] px-5 text-xs sm:text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#007fbd] active:scale-95"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>{isLoggedIn ? "Go to Dashboard" : "Back to Home"}</span>
            </Link>

            {/* Secondary: Track Order */}
            <Link
              to="/"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs sm:text-[13px] font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-slate-300 active:scale-95"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <span>Track Order</span>
            </Link>

            {/* Tertiary: Go Back */}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex h-10 items-center justify-center gap-1 rounded-xl px-3 text-xs sm:text-[13px] font-semibold text-slate-500 transition hover:text-slate-800 hover:bg-slate-100/60 active:scale-95"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
              <span>Go Back</span>
            </button>
          </div>

          {/* QUICK DESTINATIONS PILLS */}
          <div className="mt-8 border-t border-slate-100 pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Quick Shortcuts
            </p>
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
              {[
                { label: "Dashboard", path: "/dashboard" },
                { label: "All Orders", path: "/all-orders" },
                { label: "Create Order", path: "/create-order" },
                { label: "Rate Calculator", path: "/rate-calculator" },
                { label: "Tickets", path: "/tickets" },
              ].map((dest) => (
                <Link
                  key={dest.path}
                  to={dest.path}
                  className="rounded-lg border border-slate-200/80 bg-slate-50/70 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-[#008dd2]/40 hover:bg-sky-50 hover:text-[#008dd2]"
                >
                  {dest.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* =========================================================
          FOOTER (CLEAN & LIGHT)
      ========================================================= */}
      <footer className="border-t border-slate-200/70 bg-white py-4 text-center text-[12px] text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span>ParcelDrop Network: Operational</span>
          </div>
          <p>© {new Date().getFullYear()} ParcelDrop Logistics. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
