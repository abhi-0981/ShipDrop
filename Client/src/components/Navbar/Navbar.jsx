import { Link } from "react-router-dom";
import ParcelDropLogo from "../Common/ParcelDropLogo";
import { hasActiveSession } from "../../utils/auth";

function Navbar() {
  const navItems = [
    "Solutions",
    "Features",
    "Partners",
    "Pricing",
    "Resources",
    "Track Order",
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur-md transition-colors duration-200 dark:border-slate-800/80 dark:bg-[#0c1017]/95">
      <nav className="mx-auto flex h-[70px] sm:h-[76px] max-w-7xl items-center justify-between px-3.5 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          to="/"
          className="group flex items-center transition-transform hover:scale-[1.02] active:scale-95 shrink-0"
          title="ParcelDrop"
        >
          <ParcelDropLogo className="h-8 sm:h-10" />
        </Link>

        {/* Old navigation kept safely, currently hidden */}
        <ul className="hidden items-center gap-8 lg:flex">
          {false &&
            navItems.map((item) => (
              <li
                key={item}
                className="cursor-pointer text-[15px] font-medium text-slate-700 transition-all duration-300 hover:text-[#008dd2] dark:text-slate-300 dark:hover:text-[#38bdf8]"
              >
                {item}
              </li>
            ))}
        </ul>

        {/* Auth Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link
            to={hasActiveSession() ? "/dashboard" : "/login"}
            className="rounded-xl px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-[14px] font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50 hover:text-[#008dd2] dark:text-slate-200 dark:hover:bg-slate-800/60 dark:hover:text-[#38bdf8]"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="rounded-xl bg-[#008dd2] px-3.5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-[14px] font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#007fbd] hover:shadow-md dark:shadow-[0_4px_16px_rgba(0,141,210,0.3)]"
          >
            Sign Up
          </Link>
        </div>

      </nav>
    </header>
  );
}

export default Navbar;