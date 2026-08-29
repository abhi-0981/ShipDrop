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
  HiChevronRight,
  HiChevronDown,
} from "react-icons/hi";

import { FiMenu } from "react-icons/fi";

function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();

  const [showOrders, setShowOrders] =
    useState(false);

  const [showFinance, setShowFinance] =
    useState(false);


  const activeClass = (path) =>
    location.pathname === path
      ? "bg-[#008dd2] text-white"
      : "text-slate-600 hover:bg-slate-100";


  return (
    <div
      className={`fixed left-0 top-0 z-50 h-screen bg-white shadow-lg transition-all duration-300 ${
        collapsed
          ? "w-24"
          : "w-64"
      }`}
    >

      {/* LOGO */}

      <div className="flex h-20 items-center justify-between px-5">

        {!collapsed && (
          <h1 className="text-3xl font-bold text-[#008dd2]">
            ShipDrop
          </h1>
        )}

        <button
          onClick={() =>
            setCollapsed(!collapsed)
          }
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
        >
          <FiMenu size={24} />
        </button>

      </div>


      {/* MENU */}

      <div className="space-y-2 p-4">


        {/* DASHBOARD */}

        <Link
          to="/dashboard"
          className={`flex items-center rounded-xl px-4 py-3 ${activeClass(
            "/dashboard"
          )}`}
        >

          <HiOutlineViewGrid size={20} />

          {!collapsed && (
            <span className="ml-4">
              Dashboard
            </span>
          )}

        </Link>


        {/* CREATE ORDER */}

        <Link
          to="/create-order"
          className={`flex items-center rounded-xl px-4 py-3 ${activeClass(
            "/create-order"
          )}`}
        >

          <HiOutlinePlusCircle size={20} />

          {!collapsed && (
            <span className="ml-4">
              Create Order
            </span>
          )}

        </Link>


        {/* PROCESSING ORDERS */}

        <Link
          to="/processing-orders"
          className={`flex items-center rounded-xl px-4 py-3 ${activeClass(
            "/processing-orders"
          )}`}
        >

          <HiOutlineClock size={20} />

          {!collapsed && (
            <span className="ml-4 whitespace-nowrap">
              Processing Orders
            </span>
          )}

        </Link>


        {/* ORDERS */}

        <button
          onClick={() =>
            setShowOrders(!showOrders)
          }
          className="flex w-full items-center rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-100"
        >

          <HiOutlineCube size={20} />

          {!collapsed && (
            <>
              <span className="ml-4 flex-1 text-left">
                Orders
              </span>

              {showOrders ? (
                <HiChevronDown size={18} />
              ) : (
                <HiChevronRight size={18} />
              )}
            </>
          )}

        </button>


        {/* ORDER SUB MENU */}

        {showOrders && !collapsed && (
          <div className="ml-10 space-y-2">

            <Link
              to="/processing-orders"
              className="block py-2 text-slate-600 transition hover:text-[#008dd2]"
            >
              Processing Orders
            </Link>

            <Link
              to="/all-orders"
              className="block py-2 text-slate-600 transition hover:text-[#008dd2]"
            >
              All Orders
            </Link>

            <Link
              to="/manifested"
              className="block py-2 text-slate-600 transition hover:text-[#008dd2]"
            >
              Manifested
            </Link>

          </div>
        )}


        {/* RATE CALCULATOR */}

        <Link
          to="/rate-calculator"
          className={`flex items-center rounded-xl px-4 py-3 ${activeClass(
            "/rate-calculator"
          )}`}
        >

          <HiOutlineCalculator size={20} />

          {!collapsed && (
            <span className="ml-4">
              Rate Calculator
            </span>
          )}

        </Link>


        {/* RATE CARD */}

        <Link
          to="/rate-card"
          className={`flex items-center rounded-xl px-4 py-3 ${activeClass(
            "/rate-card"
          )}`}
        >

          <HiOutlineCreditCard size={20} />

          {!collapsed && (
            <span className="ml-4">
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
          className="flex w-full items-center rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-100"
        >

          <HiOutlineCash size={20} />

          {!collapsed && (
            <>
              <span className="ml-4 flex-1 text-left">
                Finance
              </span>

              {showFinance ? (
                <HiChevronDown size={18} />
              ) : (
                <HiChevronRight size={18} />
              )}
            </>
          )}

        </button>


        {/* FINANCE SUB MENU */}

        {showFinance && !collapsed && (
          <div className="ml-10 space-y-2">

            {/* WALLET */}

            <Link
              to="/wallet"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                location.pathname === "/wallet"
                  ? "bg-slate-100 text-[#008dd2]"
                  : "text-slate-600 hover:text-[#008dd2]"
              }`}
            >

              <HiOutlineCreditCard size={17} />

              <span>
                Wallet
              </span>

            </Link>


            {/* WEIGHT MISMATCH */}

            <Link
              to="/weight-mismatch"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                location.pathname === "/weight-mismatch"
                  ? "bg-slate-100 text-[#008dd2]"
                  : "text-slate-600 hover:text-[#008dd2]"
              }`}
            >

              <HiOutlineScale size={17} />

              <span>
                Weight Mismatch
              </span>

            </Link>

          </div>
        )}


        {/* TICKETS */}

        <Link
          to="/tickets"
          className={`flex items-center rounded-xl px-4 py-3 ${activeClass(
            "/tickets"
          )}`}
        >

          <HiOutlineTicket size={20} />

          {!collapsed && (
            <span className="ml-4">
              Tickets
            </span>
          )}

        </Link>


        {/* LOGOUT */}

        <Link
          to="/login"
          className={`flex items-center rounded-xl px-4 py-3 ${activeClass(
            "/login"
          )}`}
        >

          <HiOutlineLogout size={20} />

          {!collapsed && (
            <span className="ml-4">
              Logout
            </span>
          )}

        </Link>

      </div>

    </div>
  );
}

export default Sidebar;