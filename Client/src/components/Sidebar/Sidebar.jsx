import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import {
  HiOutlineViewGrid,
  HiOutlinePlusCircle,
  HiOutlineClock,
  HiOutlineCube,
  HiOutlineCalculator,
  HiOutlineTicket,
  HiOutlineLogout,
  HiOutlineCreditCard,
  HiOutlineCash,
  HiOutlineScale,
  HiOutlineCog,
  HiChevronRight,
  HiChevronDown,
} from "react-icons/hi";

import { FiMenu } from "react-icons/fi";

function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();

  const [showOrders, setShowOrders] = useState(
    location.pathname === "/processing-orders" ||
      location.pathname === "/all-orders" ||
      location.pathname === "/manifested"
  );

  const [showFinance, setShowFinance] = useState(
    location.pathname === "/wallet" ||
      location.pathname === "/weight-mismatch"
  );

  const [showSettings, setShowSettings] = useState(
    location.pathname.startsWith("/settings")
  );


  // ======================================================
  // ACTIVE MAIN MENU
  // ======================================================

  const activeClass = (path) =>
    location.pathname === path
      ? "bg-[#008dd2] text-white shadow-sm"
      : "text-slate-600 hover:bg-slate-100";


  // ======================================================
  // ACTIVE SUB MENU
  // ======================================================

  const subActiveClass = (path) =>
    location.pathname === path
      ? "bg-slate-100 text-[#008dd2] font-medium"
      : "text-slate-600 hover:bg-slate-100 hover:text-[#008dd2]";


  return (
    <div
      className={`fixed left-0 top-0 z-50 h-screen bg-white shadow-md transition-all duration-300 ${
        collapsed
          ? "w-[76px]"
          : "w-[250px]"
      }`}
    >

      {/* ================================================= */}
      {/* HEADER - FIXED / NEVER SCROLLS */}
      {/* ================================================= */}

      <div
        className={`flex h-[68px] shrink-0 items-center border-b border-slate-100 ${
          collapsed
            ? "justify-center px-3"
            : "justify-between px-4"
        }`}
      >

        {!collapsed && (
          <h1 className="text-[25px] font-bold tracking-tight text-[#008dd2]">
            ShipDrop
          </h1>
        )}

        <button
          onClick={() =>
            setCollapsed(!collapsed)
          }
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <FiMenu size={20} />
        </button>

      </div>


      {/* ================================================= */}
      {/* SCROLLABLE MENU ONLY */}
      {/* ================================================= */}

      <div
        className="
          h-[calc(100vh-68px)]
          overflow-y-auto
          overflow-x-hidden
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
      >

        <div className="space-y-1 px-3 py-3 pb-6">


          {/* ================================================= */}
          {/* DASHBOARD */}
          {/* ================================================= */}

          <Link
            to="/dashboard"
            title={collapsed ? "Dashboard" : ""}
            className={`flex items-center rounded-lg px-3 py-2 text-[14px] transition ${
              activeClass("/dashboard")
            } ${
              collapsed
                ? "justify-center"
                : ""
            }`}
          >

            <HiOutlineViewGrid size={18} />

            {!collapsed && (
              <span className="ml-3 whitespace-nowrap">
                Dashboard
              </span>
            )}

          </Link>


          {/* ================================================= */}
          {/* CREATE ORDER */}
          {/* ================================================= */}

          <Link
            to="/create-order"
            title={collapsed ? "Create Order" : ""}
            className={`flex items-center rounded-lg px-3 py-2 text-[14px] transition ${
              activeClass("/create-order")
            } ${
              collapsed
                ? "justify-center"
                : ""
            }`}
          >

            <HiOutlinePlusCircle size={18} />

            {!collapsed && (
              <span className="ml-3 whitespace-nowrap">
                Create Order
              </span>
            )}

          </Link>


          {/* ================================================= */}
          {/* PROCESSING ORDERS */}
          {/* ================================================= */}

          <Link
            to="/processing-orders"
            title={collapsed ? "Processing Orders" : ""}
            className={`flex items-center rounded-lg px-3 py-2 text-[14px] transition ${
              activeClass("/processing-orders")
            } ${
              collapsed
                ? "justify-center"
                : ""
            }`}
          >

            <HiOutlineClock size={18} />

            {!collapsed && (
              <span className="ml-3 whitespace-nowrap">
                Processing Orders
              </span>
            )}

          </Link>


          {/* ================================================= */}
          {/* ORDERS */}
          {/* ================================================= */}

          <button
            onClick={() =>
              setShowOrders(!showOrders)
            }
            title={collapsed ? "Orders" : ""}
            className={`flex w-full items-center rounded-lg px-3 py-2 text-[14px] text-slate-600 transition hover:bg-slate-100 ${
              collapsed
                ? "justify-center"
                : ""
            }`}
          >

            <HiOutlineCube size={18} />

            {!collapsed && (
              <>
                <span className="ml-3 flex-1 text-left whitespace-nowrap">
                  Orders
                </span>

                {showOrders ? (
                  <HiChevronDown size={16} />
                ) : (
                  <HiChevronRight size={16} />
                )}
              </>
            )}

          </button>


          {/* ================================================= */}
          {/* ORDER SUB MENU */}
          {/* ================================================= */}

          {showOrders && !collapsed && (
            <div className="ml-9 space-y-0.5">

              <Link
                to="/processing-orders"
                className={`block rounded-md px-3 py-1.5 text-[13px] whitespace-nowrap transition ${
                  subActiveClass(
                    "/processing-orders"
                  )
                }`}
              >
                Processing Orders
              </Link>

              <Link
                to="/all-orders"
                className={`block rounded-md px-3 py-1.5 text-[13px] whitespace-nowrap transition ${
                  subActiveClass(
                    "/all-orders"
                  )
                }`}
              >
                All Orders
              </Link>

              <Link
                to="/manifested"
                className={`block rounded-md px-3 py-1.5 text-[13px] whitespace-nowrap transition ${
                  subActiveClass(
                    "/manifested"
                  )
                }`}
              >
                Manifested
              </Link>

            </div>
          )}


          {/* ================================================= */}
          {/* RATE CALCULATOR */}
          {/* ================================================= */}

          <Link
            to="/rate-calculator"
            title={collapsed ? "Rate Calculator" : ""}
            className={`flex items-center rounded-lg px-3 py-2 text-[14px] transition ${
              activeClass("/rate-calculator")
            } ${
              collapsed
                ? "justify-center"
                : ""
            }`}
          >

            <HiOutlineCalculator size={18} />

            {!collapsed && (
              <span className="ml-3 whitespace-nowrap">
                Rate Calculator
              </span>
            )}

          </Link>


          {/* ================================================= */}
          {/* RATE CARD */}
          {/* ================================================= */}

          <Link
            to="/rate-card"
            title={collapsed ? "Rate Card" : ""}
            className={`flex items-center rounded-lg px-3 py-2 text-[14px] transition ${
              activeClass("/rate-card")
            } ${
              collapsed
                ? "justify-center"
                : ""
            }`}
          >

            <HiOutlineCreditCard size={18} />

            {!collapsed && (
              <span className="ml-3 whitespace-nowrap">
                Rate Card
              </span>
            )}

          </Link>


          {/* ================================================= */}
          {/* FINANCE */}
          {/* ================================================= */}

          <button
            onClick={() =>
              setShowFinance(!showFinance)
            }
            title={collapsed ? "Finance" : ""}
            className={`flex w-full items-center rounded-lg px-3 py-2 text-[14px] text-slate-600 transition hover:bg-slate-100 ${
              collapsed
                ? "justify-center"
                : ""
            }`}
          >

            <HiOutlineCash size={18} />

            {!collapsed && (
              <>
                <span className="ml-3 flex-1 text-left whitespace-nowrap">
                  Finance
                </span>

                {showFinance ? (
                  <HiChevronDown size={16} />
                ) : (
                  <HiChevronRight size={16} />
                )}
              </>
            )}

          </button>


          {/* ================================================= */}
          {/* FINANCE SUB MENU */}
          {/* ================================================= */}

          {showFinance && !collapsed && (
            <div className="ml-9 space-y-0.5">

              {/* WALLET */}

              <Link
                to="/wallet"
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] whitespace-nowrap transition ${
                  subActiveClass(
                    "/wallet"
                  )
                }`}
              >

                <HiOutlineCreditCard size={16} />

                <span>
                  Wallet
                </span>

              </Link>


              {/* WEIGHT MISMATCH */}

              <Link
                to="/weight-mismatch"
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] whitespace-nowrap transition ${
                  subActiveClass(
                    "/weight-mismatch"
                  )
                }`}
              >

                <HiOutlineScale size={16} />

                <span>
                  Weight Mismatch
                </span>

              </Link>

            </div>
          )}


          {/* ================================================= */}
          {/* TICKETS */}
          {/* ================================================= */}

          <Link
            to="/tickets"
            title={collapsed ? "Tickets" : ""}
            className={`flex items-center rounded-lg px-3 py-2 text-[14px] transition ${
              activeClass("/tickets")
            } ${
              collapsed
                ? "justify-center"
                : ""
            }`}
          >

            <HiOutlineTicket size={18} />

            {!collapsed && (
              <span className="ml-3 whitespace-nowrap">
                Tickets
              </span>
            )}

          </Link>


          {/* ================================================= */}
          {/* SETTINGS */}
          {/* ================================================= */}

          <button
            onClick={() =>
              setShowSettings(!showSettings)
            }
            title={collapsed ? "Settings" : ""}
            className={`flex w-full items-center rounded-lg px-3 py-2 text-[14px] transition ${
              location.pathname.startsWith("/settings")
                ? "bg-[#008dd2] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            } ${
              collapsed
                ? "justify-center"
                : ""
            }`}
          >

            <HiOutlineCog size={18} />

            {!collapsed && (
              <>
                <span className="ml-3 flex-1 text-left whitespace-nowrap">
                  Settings
                </span>

                {showSettings ? (
                  <HiChevronDown size={16} />
                ) : (
                  <HiChevronRight size={16} />
                )}
              </>
            )}

          </button>


          {/* ================================================= */}
          {/* SETTINGS SUB MENU */}
          {/* ================================================= */}

          {showSettings && !collapsed && (
            <div className="ml-9 space-y-0.5">

              <Link
                to="/settings/pickup-address"
                className={`block rounded-md px-3 py-1.5 text-[13px] whitespace-nowrap transition ${
                  subActiveClass(
                    "/settings/pickup-address"
                  )
                }`}
              >
                Pickup Address
              </Link>

            </div>
          )}


          {/* ================================================= */}
          {/* LOGOUT */}
          {/* ================================================= */}

          <Link
            to="/login"
            title={collapsed ? "Logout" : ""}
            className={`flex items-center rounded-lg px-3 py-2 text-[14px] transition ${
              activeClass("/login")
            } ${
              collapsed
                ? "justify-center"
                : ""
            }`}
          >

            <HiOutlineLogout size={18} />

            {!collapsed && (
              <span className="ml-3 whitespace-nowrap">
                Logout
              </span>
            )}

          </Link>

        </div>

      </div>

    </div>
  );
}

export default Sidebar;