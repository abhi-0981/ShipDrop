import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

import {
  HiOutlineViewGrid,
  HiOutlineCreditCard,
  HiOutlineLogout,
  HiOutlineMenuAlt2,
  HiOutlineUsers,
  HiOutlineChevronDown,
  HiOutlineTicket,
  HiOutlineClipboardList
} from "react-icons/hi";

function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);

  const [usersOpen, setUsersOpen] = useState(
    location.pathname.startsWith("/users"),
  );

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");

    navigate("/login");
  };

  // =====================================================
  // ACTIVE MENU
  // =====================================================

  const isPathActive = (path) => {
    return location.pathname === path;
  };

  const isUsersActive = location.pathname.startsWith("/users");

  const isTicketsActive = location.pathname.startsWith("/tickets");

  // =====================================================
  // NORMAL MENU ITEMS
  // =====================================================

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
      icon: HiOutlineClipboardList,
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

  // =====================================================
  // MENU ITEM COMPONENT
  // =====================================================

  const renderMenuItem = (item) => {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.path}
        to={item.path}
        title={collapsed ? item.name : ""}
        className={({ isActive }) =>
          `
          group
          relative
          flex
          items-center
          rounded-xl
          transition-all
          duration-200
          ${collapsed ? "h-11 justify-center" : "h-11 px-3 gap-3"}
          ${
            isActive
              ? "bg-[#008dd2]/8 text-[#008dd2]"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }
          `
        }
      >
        {({ isActive }) => (
          <>
            {/* ACTIVE INDICATOR */}

            {isActive && (
              <span
                className="
                  absolute
                  left-0
                  top-2
                  bottom-2
                  w-[3px]
                  rounded-r-full
                  bg-[#008dd2]
                "
              />
            )}

            {/* ICON */}

            <Icon
              size={20}
              className={`
                flex-shrink-0
                transition-colors
                duration-200
                ${
                  isActive
                    ? "text-[#008dd2]"
                    : "text-slate-500 group-hover:text-slate-700"
                }
              `}
            />

            {/* LABEL */}

            {!collapsed && (
              <span className="text-[13px] font-medium">{item.name}</span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  // =====================================================
  // LAYOUT
  // =====================================================

  return (
    <div className="min-h-screen bg-[#f7fbfe]">
      {/* ================================================= */}
      {/* SIDEBAR */}
      {/* ================================================= */}

      <aside
        className={`
          fixed
          left-0
          top-0
          z-50
          h-screen
          bg-white
          border-r
          border-slate-200/70
          shadow-[4px_0_24px_rgba(15,23,42,0.03)]
          transition-all
          duration-300
          ${collapsed ? "w-[78px]" : "w-[244px]"}
        `}
      >
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div
          className={`
            h-[72px]
            flex
            items-center
            border-b
            border-slate-100
            ${collapsed ? "justify-center px-3" : "justify-between px-5"}
          `}
        >
          {/* LOGO */}

          {!collapsed && (
            <div className="flex items-center min-w-0">
              <img
                src="/logo.png"
                alt="ShipDrop"
                className="h-9 w-auto object-contain"
              />
            </div>
          )}

          {/* COLLAPSE BUTTON */}

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="
              w-9
              h-9
              rounded-xl
              flex
              items-center
              justify-center
              text-slate-500
              hover:text-[#008dd2]
              hover:bg-[#008dd2]/5
              transition-all
              duration-200
            "
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <HiOutlineMenuAlt2 size={20} />
          </button>
        </div>

        {/* ================================================= */}
        {/* NAVIGATION */}
        {/* ================================================= */}

        <nav
          className="
            px-3
            py-6
            overflow-y-auto
            h-[calc(100vh-72px)]
            pb-32
          "
        >
          {/* ================================================= */}
          {/* WORKSPACE */}
          {/* ================================================= */}

          {!collapsed && (
            <p
              className="
                px-3
                mb-3
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.16em]
                text-slate-400
              "
            >
              Workspace
            </p>
          )}

          {/* ================================================= */}
          {/* MAIN MENU */}
          {/* ================================================= */}

          <div className="space-y-1">
            {menuItems.map((item) => renderMenuItem(item))}

            {/* ================================================= */}
            {/* USERS */}
            {/* ================================================= */}

            <div className="pt-1">
              {/* USERS BUTTON */}

              <button
                type="button"
                onClick={() => {
                  if (collapsed) {
                    setCollapsed(false);
                    setUsersOpen(true);
                    return;
                  }

                  setUsersOpen(!usersOpen);
                }}
                title={collapsed ? "Users" : ""}
                className={`
                  group
                  relative
                  w-full
                  flex
                  items-center
                  rounded-xl
                  transition-all
                  duration-200
                  ${collapsed ? "justify-center h-11" : "h-11 px-3 gap-3"}
                  ${
                    isUsersActive
                      ? "bg-[#008dd2]/8 text-[#008dd2]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >
                {/* ACTIVE INDICATOR */}

                {isUsersActive && (
                  <span
                    className="
                      absolute
                      left-0
                      top-2
                      bottom-2
                      w-[3px]
                      rounded-r-full
                      bg-[#008dd2]
                    "
                  />
                )}

                {/* ICON */}

                <HiOutlineUsers
                  size={20}
                  className={`
                    flex-shrink-0
                    ${
                      isUsersActive
                        ? "text-[#008dd2]"
                        : "text-slate-500 group-hover:text-slate-700"
                    }
                  `}
                />

                {/* TEXT */}

                {!collapsed && (
                  <>
                    <span
                      className="
                        flex-1
                        text-left
                        text-[13px]
                        font-medium
                      "
                    >
                      Users
                    </span>

                    <HiOutlineChevronDown
                      size={16}
                      className={`
                        text-slate-400
                        transition-transform
                        duration-200
                        ${usersOpen ? "rotate-180" : ""}
                      `}
                    />
                  </>
                )}
              </button>

              {/* ================================================= */}
              {/* USERS SUBMENU */}
              {/* ================================================= */}

              {!collapsed && usersOpen && (
                <div
                  className="
                      ml-[22px]
                      mt-1
                      border-l
                      border-slate-200
                      pl-3
                    "
                >
                  <NavLink
                    to="/users"
                    className={({ isActive }) =>
                      `
                        relative
                        flex
                        h-9
                        items-center
                        rounded-lg
                        px-3
                        text-[12px]
                        font-medium
                        transition-all
                        duration-200
                        ${
                          isActive
                            ? "bg-[#008dd2]/8 text-[#008dd2]"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                        }
                        `
                    }
                  >
                    All Users
                  </NavLink>
                </div>
              )}
            </div>
          </div>

          {/* ================================================= */}
          {/* SUPPORT */}
          {/* ================================================= */}

          {!collapsed && (
            <div className="mt-8">
              <p
                className="
                  px-3
                  mb-3
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.16em]
                  text-slate-400
                "
              >
                Support
              </p>

              {/* TICKETS */}

              <NavLink
                to="/tickets"
                className={({ isActive }) =>
                  `
                  group
                  relative
                  flex
                  items-center
                  h-11
                  px-3
                  gap-3
                  rounded-xl
                  transition-all
                  duration-200
                  ${
                    isActive
                      ? "bg-[#008dd2]/8 text-[#008dd2]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }
                  `
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span
                        className="
                          absolute
                          left-0
                          top-2
                          bottom-2
                          w-[3px]
                          rounded-r-full
                          bg-[#008dd2]
                        "
                      />
                    )}

                    <HiOutlineTicket
                      size={20}
                      className={
                        isActive
                          ? "text-[#008dd2]"
                          : "text-slate-500 group-hover:text-slate-700"
                      }
                    />

                    <span
                      className="
                        text-[13px]
                        font-medium
                      "
                    >
                      Tickets
                    </span>
                  </>
                )}
              </NavLink>
            </div>
          )}
        </nav>

        {/* ================================================= */}
        {/* BOTTOM AREA */}
        {/* ================================================= */}

        <div
          className="
            absolute
            bottom-0
            left-0
            right-0
            px-3
            pb-4
            bg-white
          "
        >
          {/* TOP BORDER */}

          <div className="border-t border-slate-100 pt-3">
            {/* ================================================= */}
            {/* ADMIN PROFILE */}
            {/* ================================================= */}

            {!collapsed && (
              <div
                className="
                  mb-2
                  px-3
                  py-3
                  rounded-xl
                  bg-slate-50
                  border
                  border-slate-100
                "
              >
                <div className="flex items-center gap-3">
                  {/* AVATAR */}

                  <div
                    className="
                      w-9
                      h-9
                      rounded-xl
                      bg-[#008dd2]/10
                      flex
                      items-center
                      justify-center
                      text-[#008dd2]
                      font-semibold
                      text-sm
                    "
                  >
                    A
                  </div>

                  {/* INFO */}

                  <div className="min-w-0">
                    <p
                      className="
                        text-[13px]
                        font-semibold
                        text-slate-800
                        truncate
                      "
                    >
                      Admin
                    </p>

                    <p
                      className="
                        text-[11px]
                        text-slate-400
                        truncate
                        mt-0.5
                      "
                    >
                      Administrator
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ================================================= */}
            {/* LOGOUT */}
            {/* ================================================= */}

            <button
              type="button"
              onClick={logout}
              title={collapsed ? "Logout" : ""}
              className={`
                group
                w-full
                flex
                items-center
                rounded-xl
                text-slate-500
                hover:bg-red-50
                hover:text-red-600
                transition-all
                duration-200
                ${collapsed ? "justify-center h-11" : "h-11 px-3 gap-3"}
              `}
            >
              <HiOutlineLogout
                size={20}
                className="
                  transition-transform
                  duration-200
                  group-hover:-translate-x-0.5
                "
              />

              {!collapsed && (
                <span
                  className="
                    text-[13px]
                    font-medium
                  "
                >
                  Logout
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* ================================================= */}
      {/* MAIN CONTENT */}
      {/* ================================================= */}

      <main
        className={`
          min-h-screen
          transition-all
          duration-300
          ${collapsed ? "ml-[78px]" : "ml-[244px]"}
        `}
      >
        {children}
      </main>
    </div>
  );
}

export default AdminLayout;
