import { Link } from "react-router-dom";

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
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link to="/">
          <h1 className="text-3xl font-extrabold text-[#008dd2]">
            ShipDrop
          </h1>
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <li
              key={item}
              className="cursor-pointer text-[15px] font-medium text-slate-700 transition-all duration-300 hover:text-[#008dd2]"
            >
              {item}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <button className="rounded-full border border-slate-300 px-7 py-2.5 text-sm font-semibold transition-all hover:border-[#008dd2] hover:text-[#008dd2]">
              Login
            </button>
          </Link>

          <Link to="/register">
            <button className="rounded-full bg-[#008dd2] px-7 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5">
              Sign Up
            </button>
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;