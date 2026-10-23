import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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
    <div className="relative min-h-screen w-full overflow-hidden bg-[#090d16] text-white selection:bg-[#008dd2] selection:text-white flex flex-col justify-between">
      {/* =========================================================
          BACKGROUND MESH & GLOW EFFECTS
      ========================================================= */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Top-center radial cyan glow */}
        <div className="absolute -top-40 left-1/2 h-[520px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#008dd2]/25 via-[#008dd2]/5 to-transparent blur-3xl" />
        
        {/* Bottom-right violet glow */}
        <div className="absolute -bottom-40 right-[-10%] h-[450px] w-[500px] rounded-full bg-indigo-600/15 blur-3xl" />
        
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* =========================================================
          TOP NAVBAR
      ========================================================= */}
      <header className="relative z-10 mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link
          to={isLoggedIn ? "/dashboard" : "/"}
          className="group flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#008dd2] to-[#006ca3] shadow-[0_0_20px_rgba(0,141,210,0.4)]">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21 8-9 5-9-5" />
              <path d="M3 8l9-5 9 5v9l-9 5-9-5V8Z" />
              <path d="M12 13v9" />
            </svg>
          </div>
          <div className="flex items-center text-[22px] font-extrabold tracking-tight">
            <span className="text-[#008dd2]">Parcel</span>
            <span className="text-white">Drop</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(isLoggedIn ? "/tickets" : "/")}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
            <span>Need Help?</span>
          </button>
        </div>
      </header>

      {/* =========================================================
          MAIN 404 CONTENT
      ========================================================= */}
      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        {/* FLOATING LOGISTICS ICON GRAPHIC */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Animated radar rings */}
          <div className="absolute h-56 w-56 animate-ping rounded-full border border-[#008dd2]/20 duration-1000" />
          <div className="absolute h-72 w-72 rounded-full border border-white/5" />

          {/* Central Glassmorphic Card with 404 Graphics */}
          <div className="relative flex h-36 w-36 items-center justify-center rounded-3xl border border-white/15 bg-gradient-to-b from-white/10 to-white/[0.02] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <div className="flex flex-col items-center">
              {/* Lost Parcel Icon */}
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#008dd2]/15 text-[#008dd2] shadow-inner">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-bounce"
                  style={{ animationDuration: "2.4s" }}
                >
                  <path d="m21 8-9 5-9-5" />
                  <path d="M3 8l9-5 9 5v9l-9 5-9-5V8Z" />
                  <path d="M12 13v9" />
                  <path d="M7.5 5.5 16.5 10.5" />
                </svg>
                {/* Red alert ping on top corner of box */}
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-rose-500 text-[9px] font-bold text-white items-center justify-center">
                    !
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Floating Pill Badges */}
          <div className="absolute -left-12 top-6 hidden sm:flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-950/60 px-3 py-1 text-[11px] font-medium text-rose-300 backdrop-blur-md shadow-lg">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>AWB #404-NOT-FOUND</span>
          </div>

          <div className="absolute -right-12 bottom-6 hidden sm:flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-950/60 px-3 py-1 text-[11px] font-medium text-sky-300 backdrop-blur-md shadow-lg">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span>Status: Lost in Transit</span>
          </div>
        </div>

        {/* 404 ERROR BADGE */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#008dd2]/30 bg-[#008dd2]/10 px-3.5 py-1 text-[12px] font-semibold uppercase tracking-widest text-[#38bdf8]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#38bdf8]" />
          404 Error • Route Missing
        </div>

        {/* MAIN HEADINGS */}
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Shipment Took a <span className="bg-gradient-to-r from-[#008dd2] via-[#38bdf8] to-[#818cf8] bg-clip-text text-transparent">Wrong Turn</span>
        </h1>

        <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
          The page or parcel you are looking for has either been relocated, delivered to another destination, or never existed in our dispatch hub.
        </p>

        {/* ACTION BUTTONS */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {/* PRIMARY: Dashboard / Home */}
          <Link
            to={isLoggedIn ? "/dashboard" : "/"}
            className="group flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#008dd2] to-[#0077b6] px-6 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(0,141,210,0.35)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_25px_rgba(0,141,210,0.5)] active:scale-[0.98]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>{isLoggedIn ? "Go to Dashboard" : "Return to Home"}</span>
          </Link>

          {/* SECONDARY: Track Shipment */}
          <Link
            to="/"
            className="flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-semibold text-slate-200 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/10 hover:text-white active:scale-[0.98]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span>Track a Shipment</span>
          </Link>

          {/* TERTIARY: Go Back */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-11 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-slate-400 transition-colors hover:text-white"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Go Back</span>
          </button>
        </div>

        {/* QUICK SHORTCUT LINKS */}
        <div className="mt-12 w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Popular Destinations
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {[
              { label: "Dashboard", path: "/dashboard" },
              { label: "All Orders", path: "/all-orders" },
              { label: "Create Order", path: "/create-order" },
              { label: "Rate Calculator", path: "/rate-calculator" },
              { label: "Support Tickets", path: "/tickets" },
            ].map((dest) => (
              <Link
                key={dest.path}
                to={dest.path}
                className="rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-[#008dd2]/40 hover:bg-[#008dd2]/10 hover:text-[#38bdf8]"
              >
                {dest.label}
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer className="relative z-10 border-t border-white/5 py-6 text-center text-xs text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-slate-400">ParcelDrop Network Status: Operational</span>
          </div>
          <p className="text-slate-400">
            © {new Date().getFullYear()} ParcelDrop Logistics. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
