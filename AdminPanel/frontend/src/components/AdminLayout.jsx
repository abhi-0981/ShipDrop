import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import {
  HiOutlineViewGrid,
  HiOutlineCube,
  HiOutlineUsers,
  HiOutlineCreditCard,
  HiOutlineTicket,
  HiOutlineScale,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
} from "react-icons/hi";


const menuItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: HiOutlineViewGrid,
  },
  {
    label: "All Orders",
    path: "/orders",
    icon: HiOutlineCube,
  },
  {
    label: "Users",
    path: "/users",
    icon: HiOutlineUsers,
  },
  {
    label: "Rate Card",
    path: "/rate-card",
    icon: HiOutlineCreditCard,
  },
  {
    label: "Weight Checking",
    path: "/weight-checking",
    icon: HiOutlineScale,
  },
  {
    label: "Tickets",
    path: "/tickets",
    icon: HiOutlineTicket,
  },
];


function AdminLayout({ children }) {

  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] =
    useState(false);


  const handleLogout = () => {

    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");

    navigate("/login", {
      replace: true,
    });

  };


  return (
    <div className="min-h-screen bg-[#f6f8fb]">


      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="
            fixed
            inset-0
            z-40
            bg-slate-950/40
            lg:hidden
          "
        />
      )}


      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`
          fixed
          left-0
          top-0
          z-50
          h-screen
          w-[245px]
          border-r
          border-slate-200
          bg-white
          flex
          flex-col
          transition-transform
          duration-200

          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }

          lg:translate-x-0
        `}
      >


        {/* LOGO */}

        <div
          className="
            h-[68px]
            shrink-0
            flex
            items-center
            justify-between
            px-5
            border-b
            border-slate-100
          "
        >

          <button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
            className="flex items-center gap-2.5"
          >

            <div
              className="
                h-9
                w-9
                rounded-xl
                bg-[#008dd2]
                flex
                items-center
                justify-center
                text-white
                font-bold
                text-lg
                shadow-sm
              "
            >
              P
            </div>


            <div className="text-left">

              <p
                className="
                  text-[19px]
                  font-extrabold
                  tracking-tight
                  text-[#008dd2]
                "
              >
                ParcelDrop
              </p>

              <p
                className="
                  text-[9px]
                  uppercase
                  tracking-[0.18em]
                  font-bold
                  text-slate-400
                "
              >
                Admin Panel
              </p>

            </div>

          </button>


          <button
            type="button"
            onClick={() =>
              setMobileOpen(false)
            }
            className="
              lg:hidden
              h-8
              w-8
              rounded-lg
              flex
              items-center
              justify-center
              text-slate-400
              hover:bg-slate-100
            "
          >
            <HiOutlineX size={19} />
          </button>

        </div>


        {/* MENU */}

        <div className="flex-1 px-3 py-5 overflow-y-auto">

          <p
            className="
              px-3
              mb-2
              text-[9px]
              font-bold
              uppercase
              tracking-[0.16em]
              text-slate-400
            "
          >
            Main Menu
          </p>


          <nav className="space-y-1">

            {menuItems.map(
              ({
                label,
                path,
                icon: Icon,
              }) => (

                <NavLink
                  key={path}
                  to={path}
                  onClick={() =>
                    setMobileOpen(false)
                  }
                  className={({ isActive }) =>
                    `
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    px-3
                    py-2.5
                    text-[13px]
                    font-medium
                    transition-all

                    ${
                      isActive
                        ? `
                          bg-[#008dd2]
                          text-white
                          shadow-sm
                        `
                        : `
                          text-slate-600
                          hover:bg-slate-50
                          hover:text-[#008dd2]
                        `
                    }
                    `
                  }
                >

                  <Icon size={19} />

                  <span>
                    {label}
                  </span>

                </NavLink>

              )
            )}

          </nav>


          {/* OPERATIONS */}

          <div className="mt-7">

            <p
              className="
                px-3
                mb-2
                text-[9px]
                font-bold
                uppercase
                tracking-[0.16em]
                text-slate-400
              "
            >
              Operations
            </p>


            <div
              className="
                rounded-xl
                border
                border-[#008dd2]/10
                bg-[#008dd2]/5
                p-3
              "
            >

              <div className="flex items-center gap-2">

                <div
                  className="
                    h-7
                    w-7
                    rounded-lg
                    bg-[#008dd2]/10
                    flex
                    items-center
                    justify-center
                    text-[#008dd2]
                  "
                >
                  <HiOutlineCube size={15} />
                </div>

                <div>

                  <p className="text-[10px] font-bold text-slate-700">
                    Shipment Operations
                  </p>

                  <p className="text-[9px] text-slate-400">
                    Monitor orders & delivery
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>


        {/* LOGOUT */}

        <div
          className="
            p-3
            border-t
            border-slate-100
          "
        >

          <button
            type="button"
            onClick={handleLogout}
            className="
              w-full
              flex
              items-center
              gap-3
              rounded-xl
              px-3
              py-2.5
              text-[13px]
              font-medium
              text-red-500
              hover:bg-red-50
              transition
            "
          >

            <HiOutlineLogout size={19} />

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>


      {/* =====================================================
          MAIN AREA
      ===================================================== */}

      <div className="lg:pl-[245px] min-h-screen">


        {/* MOBILE HEADER */}

        <div
          className="
            lg:hidden
            h-14
            bg-white
            border-b
            border-slate-200
            flex
            items-center
            px-4
            sticky
            top-0
            z-30
          "
        >

          <button
            type="button"
            onClick={() =>
              setMobileOpen(true)
            }
            className="
              h-9
              w-9
              rounded-lg
              flex
              items-center
              justify-center
              text-slate-600
              hover:bg-slate-100
            "
          >
            <HiOutlineMenu size={21} />
          </button>


          <span
            className="
              ml-3
              text-sm
              font-bold
              text-slate-800
            "
          >
            ParcelDrop Admin
          </span>

        </div>


        {/* PAGE */}

        <main className="min-h-screen">
          {children}
        </main>

      </div>

    </div>
  );
}


export default AdminLayout;