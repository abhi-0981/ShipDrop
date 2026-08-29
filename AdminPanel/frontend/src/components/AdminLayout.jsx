import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

import {
  HiOutlineViewGrid,
  HiOutlineCreditCard,
  HiOutlineLogout,
  HiOutlineMenuAlt2,
  HiOutlineUsers,
  HiOutlineChevronDown,
} from "react-icons/hi";


function AdminLayout({ children }) {

  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] =
    useState(false);

  const [usersOpen, setUsersOpen] =
    useState(
      location.pathname.startsWith(
        "/users"
      )
    );


  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {

    localStorage.removeItem(
      "adminToken"
    );

    localStorage.removeItem(
      "admin"
    );

    navigate("/login");
  };


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
      name: "Rate Card",
      path: "/rate-card",
      icon: HiOutlineCreditCard,
    },

  ];


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
          transition-all
          duration-300

          ${
            collapsed
              ? "w-[76px]"
              : "w-[228px]"
          }
        `}
      >


        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="h-[72px] px-5 flex items-center justify-between border-b border-slate-100">


          {/* LOGO */}

          {!collapsed && (

            <img
              src="/logo.png"
              alt="ShipDrop"
              className="h-9 w-auto"
            />

          )}


          {/* COLLAPSE BUTTON */}

          <button
            type="button"
            onClick={() =>
              setCollapsed(
                !collapsed
              )
            }
            className={`
              w-9
              h-9
              rounded-lg
              flex
              items-center
              justify-center
              text-slate-500
              hover:text-[#008dd2]
              hover:bg-[#008dd2]/5
              transition

              ${
                collapsed
                  ? "mx-auto"
                  : ""
              }
            `}
            title={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
          >

            <HiOutlineMenuAlt2
              size={20}
            />

          </button>

        </div>


        {/* ================================================= */}
        {/* NAVIGATION */}
        {/* ================================================= */}

        <nav className="px-3 py-6">


          {/* WORKSPACE */}

          {!collapsed && (

            <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">

              Workspace

            </p>

          )}


          <div className="space-y-1">


            {/* ================================================= */}
            {/* DASHBOARD */}
            {/* ================================================= */}

            {menuItems.map(
              (item) => {

                const Icon =
                  item.icon;


                return (

                  <NavLink
                    key={
                      item.path
                    }
                    to={
                      item.path
                    }
                    className={({
                      isActive,
                    }) =>
                      `
                      relative
                      flex
                      items-center
                      rounded-lg
                      transition-all
                      duration-200

                      ${
                        collapsed
                          ? "justify-center h-11"
                          : "h-11 px-3 gap-3"
                      }

                      ${
                        isActive
                          ? "bg-[#008dd2]/8 text-[#008dd2]"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }
                    `
                    }
                  >

                    {({
                      isActive,
                    }) => (

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


                        <Icon
                          size={20}
                          className={
                            isActive
                              ? "text-[#008dd2]"
                              : "text-slate-500"
                          }
                        />


                        {!collapsed && (

                          <span className="text-[13px] font-medium">

                            {
                              item.name
                            }

                          </span>

                        )}

                      </>

                    )}

                  </NavLink>

                );

              }
            )}


            {/* ================================================= */}
            {/* USERS PARENT */}
            {/* ================================================= */}

            <div>


              {/* USERS BUTTON */}

              <button
                type="button"
                onClick={() => {

                  if (collapsed) {

                    setCollapsed(
                      false
                    );

                    setUsersOpen(
                      true
                    );

                    return;
                  }

                  setUsersOpen(
                    !usersOpen
                  );

                }}
                className={`
                  relative
                  w-full
                  flex
                  items-center
                  rounded-lg
                  transition-all
                  duration-200

                  ${
                    collapsed
                      ? "justify-center h-11"
                      : "h-11 px-3 gap-3"
                  }

                  ${
                    location.pathname.startsWith(
                      "/users"
                    )
                      ? "bg-[#008dd2]/8 text-[#008dd2]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >


                {/* ACTIVE INDICATOR */}

                {location.pathname.startsWith(
                  "/users"
                ) && (

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
                  className={
                    location.pathname.startsWith(
                      "/users"
                    )
                      ? "text-[#008dd2]"
                      : "text-slate-500"
                  }
                />


                {/* TEXT */}

                {!collapsed && (

                  <>

                    <span className="flex-1 text-left text-[13px] font-medium">

                      Users

                    </span>


                    <HiOutlineChevronDown
                      size={16}
                      className={`
                        transition-transform
                        duration-200

                        ${
                          usersOpen
                            ? "rotate-180"
                            : ""
                        }
                      `}
                    />

                  </>

                )}

              </button>


              {/* ================================================= */}
              {/* USERS SUBMENU */}
              {/* ================================================= */}

              {!collapsed &&
                usersOpen && (

                  <div className="ml-[23px] mt-1 border-l border-slate-200 pl-3">


                    <NavLink
                      to="/users"
                      className={({ isActive }) =>
                        `
                        relative
                        flex
                        h-9
                        items-center
                        rounded-md
                        px-3
                        text-[12px]
                        font-medium
                        transition

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

        </nav>


        {/* ================================================= */}
        {/* BOTTOM AREA */}
        {/* ================================================= */}

        <div className="absolute bottom-0 left-0 right-0 px-3 pb-4">


          {/* ADMIN */}

          {!collapsed && (

            <div className="mb-3 px-3 py-3 rounded-xl bg-slate-50 border border-slate-100">

              <div className="flex items-center gap-3">


                <div className="w-9 h-9 rounded-lg bg-[#008dd2]/10 flex items-center justify-center text-[#008dd2] font-semibold text-sm">

                  A

                </div>


                <div className="min-w-0">

                  <p className="text-[13px] font-semibold text-slate-800 truncate">

                    Admin

                  </p>


                  <p className="text-[11px] text-slate-400 truncate">

                    Administrator

                  </p>

                </div>

              </div>

            </div>

          )}


          {/* LOGOUT */}

          <button
            type="button"
            onClick={
              logout
            }
            className={`
              w-full
              flex
              items-center
              rounded-lg
              text-slate-500
              hover:bg-red-50
              hover:text-red-600
              transition

              ${
                collapsed
                  ? "justify-center h-11"
                  : "h-11 px-3 gap-3"
              }
            `}
          >

            <HiOutlineLogout
              size={20}
            />


            {!collapsed && (

              <span className="text-[13px] font-medium">

                Logout

              </span>

            )}

          </button>

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

          ${
            collapsed
              ? "ml-[76px]"
              : "ml-[228px]"
          }
        `}
      >

        {children}

      </main>

    </div>

  );

}


export default AdminLayout;