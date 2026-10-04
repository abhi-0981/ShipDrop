import { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  HiOutlineViewGrid,
  HiOutlineCreditCard,
  HiOutlineLogout,
  HiOutlineUsers,
  HiOutlineChevronDown,
  HiOutlineTicket,
  HiOutlineClipboardList,
  HiOutlineScale,
  HiOutlineX,
  HiMenuAlt2,
} from "react-icons/hi";

function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [usersOpen, setUsersOpen] = useState(() =>
    location.pathname.startsWith("/users")
  );

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    navigate("/login");
  };

  const isUsersActive = location.pathname.startsWith("/users");

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: HiOutlineViewGrid,
    },
    {
      name: "All Orders",
      path: "/orders",
      icon: HiOutlineClipboardList,
    },
    {
      name: "Weight Checking",
      path: "/weight-checking",
      icon: HiOutlineScale,
    },
    {
      name: "Rate Card",
      path: "/rate-card",
      icon: HiOutlineCreditCard,
    },
    {
      name: "Tickets",
      path: "/tickets",
      icon: HiOutlineTicket,
    },
  ];

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isDesktopCollapsed = collapsed && !mobileOpen;

    return (
      <NavLink
        key={item.path}
        to={item.path}
        title={isDesktopCollapsed ? item.name : ""}
        className={({ isActive }) =>
          `group relative flex items-center rounded-xl transition-all duration-150 ${
            isDesktopCollapsed ? "h-11 justify-center px-0" : "h-11 px-3.5 gap-3"
          } ${
            isActive
              ? "bg-[#008dd2]/10 text-[#008dd2] font-semibold"
              : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 font-medium"
          }`
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-[#008dd2]" />
            )}

            <Icon
              size={20}
              className={`shrink-0 transition-colors ${
                isActive ? "text-[#008dd2]" : "text-slate-400 group-hover:text-slate-700"
              }`}
            />

            {!isDesktopCollapsed && (
              <span className="text-[13px] tracking-tight truncate">
                {item.name}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-800">
      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 active:scale-95"
            aria-label="Open sidebar"
          >
            <HiMenuAlt2 size={20} />
          </button>
          <span className="text-lg font-black tracking-tight text-[#008dd2]">
            ShipDrop
          </span>
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#008dd2]/10 text-xs font-bold text-[#008dd2]">
          A
        </div>
      </header>

      {/* MOBILE BACKDROP */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white shadow-xl lg:shadow-[2px_0_12px_rgba(15,23,42,0.03)] transition-all duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0 w-[260px]" : "-translate-x-full lg:translate-x-0"
        } ${
          collapsed ? "lg:w-[76px]" : "lg:w-[250px]"
        }`}
      >
        {/* LOGO AREA */}
        <div
          className={`flex h-16 shrink-0 items-center border-b border-slate-100 px-4 ${
            collapsed && !mobileOpen ? "justify-center" : "justify-between"
          }`}
        >
          {(!collapsed || mobileOpen) && (
            <span className="text-xl font-black tracking-tight text-[#008dd2]">
              ShipDrop
            </span>
          )}

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <HiMenuAlt2 size={20} />
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <HiOutlineX size={20} />
          </button>
        </div>

        {/* NAVIGATION LIST */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-1 [scrollbar-width:thin]">
          {menuItems.map((item) => renderNavItem(item))}

          {/* USERS DROPDOWN */}
          <div>
            <button
              type="button"
              onClick={() => {
                if (collapsed && !mobileOpen) {
                  setCollapsed(false);
                  setUsersOpen(true);
                  return;
                }
                setUsersOpen(!usersOpen);
              }}
              className={`group relative flex w-full items-center rounded-xl transition-all duration-150 ${
                collapsed && !mobileOpen
                  ? "h-11 justify-center px-0"
                  : "h-11 px-3.5 gap-3"
              } ${
                isUsersActive
                  ? "bg-[#008dd2]/10 text-[#008dd2] font-semibold"
                  : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 font-medium"
              }`}
              title={collapsed && !mobileOpen ? "Users" : ""}
            >
              {isUsersActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-[#008dd2]" />
              )}

              <HiOutlineUsers
                size={20}
                className={`shrink-0 transition-colors ${
                  isUsersActive
                    ? "text-[#008dd2]"
                    : "text-slate-400 group-hover:text-slate-700"
                }`}
              />

              {(!collapsed || mobileOpen) && (
                <>
                  <span className="flex-1 text-left text-[13px] tracking-tight">
                    Users
                  </span>
                  <HiOutlineChevronDown
                    size={15}
                    className={`text-slate-400 transition-transform duration-200 ${
                      usersOpen ? "rotate-180" : ""
                    }`}
                  />
                </>
              )}
            </button>

            {(!collapsed || mobileOpen) && usersOpen && (
              <div className="ml-5 mt-1 border-l-2 border-slate-100 pl-3 space-y-1">
                <NavLink
                  to="/users"
                  className={({ isActive }) =>
                    `flex h-9 items-center rounded-lg px-3 text-xs font-semibold transition ${
                      isActive
                        ? "bg-[#008dd2]/10 text-[#008dd2]"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`
                  }
                >
                  All Users
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        {/* LOGOUT BUTTON */}
        <div className="shrink-0 border-t border-slate-100 p-3 bg-slate-50/50">
          <button
            type="button"
            onClick={logout}
            className={`flex w-full items-center rounded-xl text-rose-600 hover:bg-rose-50 transition-colors ${
              collapsed && !mobileOpen
                ? "h-10 justify-center px-0"
                : "h-10 px-3.5 gap-2.5 text-xs font-bold"
            }`}
            title="Logout"
          >
            <HiOutlineLogout size={19} className="shrink-0" />
            {(!collapsed || mobileOpen) && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main
        className={`min-h-[calc(100vh-56px)] lg:min-h-screen transition-all duration-300 ${
          collapsed ? "lg:ml-[76px]" : "lg:ml-[250px]"
        }`}
      >
        {children}
      </main>
    </div>
  );
}

export default AdminLayout;