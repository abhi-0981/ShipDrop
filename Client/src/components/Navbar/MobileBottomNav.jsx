import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HiOutlineViewGrid,
  HiOutlineCube,
  HiOutlinePlus,
  HiOutlineClock,
  HiOutlineMenuAlt3,
} from "react-icons/hi";
import { fetchOrderStatusCounts } from "../../services/orderEvents";

const getUserId = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user?.id || user?.user_id || user?.userId || null;
  } catch {
    return null;
  }
};

export default function MobileBottomNav() {
  const location = useLocation();
  const [processingCount, setProcessingCount] = useState(() => {
    try {
      const cached = sessionStorage.getItem("shipdrop_dash_counts");
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.PROCESSING ?? parsed.processing_count ?? 0;
      }
      return 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    let isMounted = true;
    const loadCounts = async () => {
      const userId = getUserId();
      if (!userId) return;
      try {
        const counts = await fetchOrderStatusCounts(userId);
        if (isMounted && counts) {
          const count = counts.PROCESSING ?? counts.processing_count ?? 0;
          setProcessingCount(count);
        }
      } catch (err) {}
    };

    loadCounts();

    const handleUpdate = () => loadCounts();
    const updateEvents = [
      "shipdrop:orders-updated",
      "processingOrderCreated",
      "processingOrderUpdated",
      "orderStatusUpdated",
      "orderUpdated",
      "orderDeleted",
      "ordersDeleted",
    ];

    updateEvents.forEach((evt) => window.addEventListener(evt, handleUpdate));
    return () => {
      isMounted = false;
      updateEvents.forEach((evt) =>
        window.removeEventListener(evt, handleUpdate)
      );
    };
  }, []);

  const openSidebar = () => {
    window.dispatchEvent(
      new CustomEvent("shipdrop:sidebarState", { detail: false })
    );
  };

  const isHomeActive = location.pathname === "/dashboard";
  const isOrdersActive = [
    "/all-orders",
    "/manifested",
    "/not-picked",
    "/in-transit",
    "/out-for-delivery",
    "/delivered",
    "/rto-in-transit",
    "/rto-delivered",
    "/pending",
    "/cancelled",
    "/offline-orders",
    "/lost",
    "/orders/lost",
  ].includes(location.pathname);
  const isCreateActive =
    location.pathname === "/create-order" ||
    location.pathname === "/create-offline-order";
  const isProcessingActive =
    location.pathname === "/processing-orders" ||
    location.pathname === "/orders/processing";

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#0c0f17]/95 backdrop-blur-md shadow-[0_-4px_25px_rgba(0,0,0,0.06)] px-2 py-1.5 transition-all duration-200"
      style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. HOME */}
        <Link
          to="/dashboard"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 active:scale-90 ${
            isHomeActive
              ? "text-[#008dd2] font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 font-medium"
          }`}
        >
          <div className="relative">
            <HiOutlineViewGrid size={21} />
            {isHomeActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#008dd2]" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
        </Link>

        {/* 2. ORDERS */}
        <Link
          to="/all-orders"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 active:scale-90 ${
            isOrdersActive
              ? "text-[#008dd2] font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 font-medium"
          }`}
        >
          <div className="relative">
            <HiOutlineCube size={21} />
            {isOrdersActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#008dd2]" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Orders</span>
        </Link>

        {/* 3. CENTER ACTION BUTTON: CREATE ORDER */}
        <Link
          to="/create-order"
          className="relative -top-3 flex flex-col items-center group active:scale-95 transition-transform"
          title="Create Order"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#008dd2] to-[#38bdf8] text-white shadow-lg shadow-[#008dd2]/35 border-3 border-white dark:border-[#0c0f17] group-active:scale-90 transition-transform">
            <HiOutlinePlus size={23} strokeWidth={2.5} />
          </div>
          <span className="text-[9.5px] font-bold text-[#008dd2] dark:text-[#38bdf8] -mt-0.5 tracking-tight">
            Create
          </span>
        </Link>

        {/* 4. READY TO SHIP */}
        <Link
          to="/processing-orders"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 active:scale-90 ${
            isProcessingActive
              ? "text-[#008dd2] font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 font-medium"
          }`}
        >
          <div className="relative">
            <HiOutlineClock size={21} />
            {processingCount > 0 && (
              <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white shadow-xs">
                {processingCount > 99 ? "99+" : processingCount}
              </span>
            )}
            {isProcessingActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#008dd2]" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Ready</span>
        </Link>

        {/* 5. MENU / MORE */}
        <button
          type="button"
          onClick={openSidebar}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 font-medium transition-all duration-150 active:scale-90 cursor-pointer"
          title="Open Menu"
        >
          <HiOutlineMenuAlt3 size={21} />
          <span className="text-[10px] mt-0.5 tracking-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
}
