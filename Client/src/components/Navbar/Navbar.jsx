import { Link } from "react-router-dom";
import ParcelDropLogo from "../Common/ParcelDropLogo";

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
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur-md">
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
                className="cursor-pointer text-[15px] font-medium text-slate-700 transition-all duration-300 hover:text-[#008dd2]"
              >
                {item}
              </li>
            ))}
        </ul>

        {/* Auth Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link
            to="/login"
            className="rounded-xl px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-[14px] font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50 hover:text-[#008dd2]"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="rounded-xl bg-[#008dd2] px-3.5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-[14px] font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#007fbd] hover:shadow-md"
          >
            Sign Up
          </Link>
        </div>

      </nav>
    </header>
  );
}

export default Navbar;