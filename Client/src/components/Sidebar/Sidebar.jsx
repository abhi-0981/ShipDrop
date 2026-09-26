import { useEffect, useState } from "react";
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
  HiX,
} from "react-icons/hi";
import { FiMenu } from "react-icons/fi";
import api from "../../services/api";

function Sidebar({ collapsed: propCollapsed, setCollapsed: propSetCollapsed }) {
  const location = useLocation();

  // Desktop default open (false), mobile default closed (true)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (propCollapsed !== undefined) return propCollapsed;
    return window.innerWidth < 1024;
  });

  const collapsed = propCollapsed !== undefined ? propCollapsed : isCollapsed;

  // Toggle Function with Global Event Broadcast
  const handleToggle = (nextVal) => {
    const next = typeof nextVal === "boolean" ? nextVal : !collapsed;
    setIsCollapsed(next);
    if (typeof propSetCollapsed === "function") {
      propSetCollapsed(next);
    }
    window.dispatchEvent(new CustomEvent("shipdrop:sidebarState", { detail: next }));
  };

  // Sync prop changes
  useEffect(() => {
    if (propCollapsed !== undefined) {
      setIsCollapsed(propCollapsed);
    }
  }, [propCollapsed]);

  // Global listener from TopNavbar
  useEffect(() => {
    const handleSync = (e) => {
      setIsCollapsed(e.detail);
      if (typeof propSetCollapsed === "function") {
        propSetCollapsed(e.detail);
      }
    };
    window.addEventListener("shipdrop:sidebarState", handleSync);
    return () => window.removeEventListener("shipdrop:sidebarState", handleSync);
  }, [propSetCollapsed]);

  const isOrderPath = [
    "/processing-orders",
    "/orders/processing",
    "/all-orders",
    "/manifested",
    "/not-picked",
    "/in-transit",
    "/out-for-delivery",
    "/delivered",
    "/rto-in-transit",
    "/rto-delivered",
    "/returned",
    "/cancelled",
    "/pending",
  ].includes(location.pathname);

  const [showOrders, setShowOrders] = useState(isOrderPath);
  const [showFinance, setShowFinance] = useState(
    location.pathname === "/wallet" || location.pathname === "/weight-mismatch"
  );
  const [showSettings, setShowSettings] = useState(
    location.pathname.startsWith("/settings")
  );

  const [statusCounts, setStatusCounts] = useState({});

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      handleToggle(true);
    }
  };

  useEffect(() => {
    const fetchStatusCounts = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return;

        const user = JSON.parse(storedUser);
        const userId = user?.id || user?.user_id || user?.userId;
        if (!userId) return;

        /*
         * /orders/all = order table status.
         * /manifests = actual confirmed manifest list.
         *
         * Manifested count MUST come from /manifests because
         * an order can have status=Manifested while its manifest
         * has already been cancelled/missing.
         */
        const [ordersResponse, manifestsResponse] =
          await Promise.all([
            api.get("/orders/all", {
              params: { user_id: userId },
            }),
            api.get("/manifests", {
              params: { user_id: userId },
            }),
          ]);

        const orders = Array.isArray(ordersResponse?.data?.orders)
          ? ordersResponse.data.orders
          : [];

        const manifests = Array.isArray(
          manifestsResponse?.data?.manifests
        )
          ? manifestsResponse.data.manifests
          : [];

        const counts = {
          ALL: 0,
          PROCESSING: 0,
          MANIFESTED: manifests.length,
          "NOT PICKED": 0,
          "IN TRANSIT": 0,
          "OUT FOR DELIVERY": 0,
          DELIVERED: 0,
          "RTO IN TRANSIT": 0,
          "RTO DELIVERED": 0,
          RETURNED: 0,
          CANCELLED: 0,
          PENDING: 0,
        };

        const seenOrderIds = new Set();

        orders.forEach((order) => {
          const orderId =
            order?.id ??
            order?.order_id ??
            order?.orderId;

          const key =
            orderId !== undefined && orderId !== null
              ? String(orderId)
              : `row-${seenOrderIds.size}`;

          if (seenOrderIds.has(key)) return;
          seenOrderIds.add(key);

          const trackingStatus = String(
            order?.tracking_status || ""
          )
            .trim()
            .toUpperCase()
            .replace(/_/g, " ");

          const orderStatus = String(
            order?.status ||
              order?.order_status ||
              "PROCESSING"
          )
            .trim()
            .toUpperCase()
            .replace(/_/g, " ");

          // Processing orders belong ONLY to Processing Orders.
          // They must NOT be included in the All Orders count.
          if (orderStatus === "PROCESSING") {
            counts.PROCESSING += 1;
            return;
          }

          // All Orders = every non-Processing order.
          counts.ALL += 1;

          // Manifested is already counted from /manifests.
          if (orderStatus === "MANIFESTED") return;

          // NDR is a tracking state and has no separate sidebar bucket.
          if (trackingStatus === "NDR") return;

          if (
            Object.prototype.hasOwnProperty.call(
              counts,
              orderStatus
            )
          ) {
            counts[orderStatus] += 1;
          }
        });

        setStatusCounts(counts);
      } catch (error) {
        console.error("Sidebar status count error:", error);
      }
    };

    fetchStatusCounts();

    const handleUpdate = () => fetchStatusCounts();

    const updateEvents = [
      "shipdrop:orders-updated",
      "processingOrderCreated",
      "processingOrderUpdated",
      "orderStatusUpdated",
      "orderUpdated",
      "orderDeleted",
      "ordersDeleted",
    ];

    updateEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleUpdate);
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchStatusCounts();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      updateEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleUpdate);
      });

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  const activeClass = (path) =>
    location.pathname === path
      ? "bg-[#008dd2] text-white shadow-sm font-medium"
      : "text-slate-600 hover:bg-slate-100 active:scale-[0.98]";

  const subActiveClass = (path) =>
    location.pathname === path
      ? "bg-sky-50 text-[#008dd2] font-semibold"
      : "text-slate-600 hover:bg-slate-100 hover:text-[#008dd2]";

  return (
    <>
      {/* MOBILE BACKDROP */}
      <div
        onClick={() => handleToggle(true)}
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 lg:hidden ${
          !collapsed ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* SIDEBAR ASIDE: Closes completely off-screen on toggle */}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-full w-[250px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out ${
          collapsed ? "-translate-x-full" : "translate-x-0 shadow-2xl lg:shadow-none"
        }`}
      >
        {/* HEADER: LOGO + TOGGLE / CLOSE BUTTON */}
        <div className="flex h-[64px] shrink-0 items-center justify-between border-b border-slate-100 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#008dd2] text-white font-bold text-base shadow-sm">
              S
            </div>
            <h1 className="text-[21px] font-bold tracking-tight text-[#008dd2]">
              ParcelDrop
            </h1>
          </div>

          <button
            onClick={() => handleToggle(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 active:scale-95"
            title="Close Sidebar"
          >
            <span className="hidden lg:inline-block">
              <FiMenu size={20} />
            </span>
            <span className="lg:hidden">
              <HiX size={22} />
            </span>
          </button>
        </div>

        {/* MENU LINKS */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-20 lg:pb-6">
          {/* DASHBOARD */}
          <Link
            to="/dashboard"
            onClick={handleNavClick}
            className={`flex items-center rounded-xl px-3 py-2.5 text-[14px] transition duration-150 ${activeClass(
              "/dashboard"
            )}`}
          >
            <HiOutlineViewGrid size={20} />
            <span className="ml-3 truncate">Dashboard</span>
          </Link>

          {/* CREATE ORDER */}
          <Link
            to="/create-order"
            onClick={handleNavClick}
            className={`flex items-center rounded-xl px-3 py-2.5 text-[14px] transition duration-150 ${activeClass(
              "/create-order"
            )}`}
          >
            <HiOutlinePlusCircle size={20} />
            <span className="ml-3 truncate">Create Order</span>
          </Link>

          {/* PROCESSING ORDERS */}
          <Link
            to="/processing-orders"
            onClick={handleNavClick}
            className={`flex items-center rounded-xl px-3 py-2.5 text-[14px] transition duration-150 ${activeClass(
              "/processing-orders"
            )}`}
          >
            <HiOutlineClock size={20} />
            <span className="ml-3 truncate">Processing Orders</span>
          </Link>

          {/* ORDERS */}
          <div>
            <button
              onClick={() => setShowOrders(!showOrders)}
              className="flex w-full items-center rounded-xl px-3 py-2.5 text-[14px] text-slate-600 transition hover:bg-slate-100"
            >
              <HiOutlineCube size={20} />
              <span className="ml-3 flex-1 text-left truncate">Orders</span>
              {showOrders ? <HiChevronDown size={17} /> : <HiChevronRight size={17} />}
            </button>

            {showOrders && (
              <div className="mt-1 ml-5 space-y-1 border-l-2 border-slate-100 pl-3">
                {[
                  { name: "Processing Orders", path: "/processing-orders", count: statusCounts.PROCESSING },
                  { name: "All Orders", path: "/all-orders", count: statusCounts.ALL },
                  { name: "Manifested", path: "/manifested", count: statusCounts.MANIFESTED },
                  { name: "Not Picked", path: "/not-picked", count: statusCounts["NOT PICKED"] },
                  { name: "In Transit", path: "/in-transit", count: statusCounts["IN TRANSIT"] },
                  { name: "Out For Delivery", path: "/out-for-delivery", count: statusCounts["OUT FOR DELIVERY"] },
                  { name: "Delivered", path: "/delivered", count: statusCounts.DELIVERED },
                  { name: "RTO In Transit", path: "/rto-in-transit", count: statusCounts["RTO IN TRANSIT"] },
                  { name: "RTO Delivered", path: "/rto-delivered", count: statusCounts["RTO DELIVERED"] },
                  { name: "Returned", path: "/returned", count: statusCounts.RETURNED },
                  { name: "Cancelled", path: "/cancelled", count: statusCounts.CANCELLED },
                  { name: "Pending", path: "/pending", count: statusCounts.PENDING },
                ].map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[13px] transition ${subActiveClass(
                      item.path
                    )}`}
                  >
                    <span className="truncate">{item.name}</span>
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      {item.count ?? 0}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* RATE CALCULATOR */}
          <Link
            to="/rate-calculator"
            onClick={handleNavClick}
            className={`flex items-center rounded-xl px-3 py-2.5 text-[14px] transition duration-150 ${activeClass(
              "/rate-calculator"
            )}`}
          >
            <HiOutlineCalculator size={20} />
            <span className="ml-3 truncate">Rate Calculator</span>
          </Link>

          {/* FINANCE */}
          <div>
            <button
              onClick={() => setShowFinance(!showFinance)}
              className="flex w-full items-center rounded-xl px-3 py-2.5 text-[14px] text-slate-600 transition hover:bg-slate-100"
            >
              <HiOutlineCash size={20} />
              <span className="ml-3 flex-1 text-left truncate">Finance</span>
              {showFinance ? <HiChevronDown size={17} /> : <HiChevronRight size={17} />}
            </button>

            {showFinance && (
              <div className="mt-1 ml-5 space-y-1 border-l-2 border-slate-100 pl-3">
                <Link
                  to="/wallet"
                  onClick={handleNavClick}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition ${subActiveClass(
                    "/wallet"
                  )}`}
                >
                  <HiOutlineCreditCard size={15} />
                  <span>Wallet</span>
                </Link>
                <Link
                  to="/weight-mismatch"
                  onClick={handleNavClick}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition ${subActiveClass(
                    "/weight-mismatch"
                  )}`}
                >
                  <HiOutlineScale size={15} />
                  <span>Weight Mismatch</span>
                </Link>
              </div>
            )}
          </div>

          {/* TICKETS */}
          <Link
            to="/tickets"
            onClick={handleNavClick}
            className={`flex items-center rounded-xl px-3 py-2.5 text-[14px] transition duration-150 ${activeClass(
              "/tickets"
            )}`}
          >
            <HiOutlineTicket size={20} />
            <span className="ml-3 truncate">Tickets</span>
          </Link>

          {/* SETTINGS */}
          <div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex w-full items-center rounded-xl px-3 py-2.5 text-[14px] transition ${
                location.pathname.startsWith("/settings")
                  ? "bg-[#008dd2] text-white shadow-sm font-medium"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <HiOutlineCog size={20} />
              <span className="ml-3 flex-1 text-left truncate">Settings</span>
              {showSettings ? <HiChevronDown size={17} /> : <HiChevronRight size={17} />}
            </button>

            {showSettings && (
              <div className="mt-1 ml-5 space-y-1 border-l-2 border-slate-100 pl-3">
                <Link
                  to="/settings/pickup-address"
                  onClick={handleNavClick}
                  className={`block rounded-lg px-2.5 py-1.5 text-[13px] transition ${subActiveClass(
                    "/settings/pickup-address"
                  )}`}
                >
                  Pickup Address
                </Link>
                <Link
  to="/settings/return-addresses"
  className={`block rounded-md px-3 py-1.5 text-[13px] whitespace-nowrap transition ${
    subActiveClass(
      "/settings/return-addresses"
    )
  }`}
>
  Return Addresses
</Link> 
                <Link
                  to="/settings/label-settings"
                  onClick={handleNavClick}
                  className={`block rounded-lg px-2.5 py-1.5 text-[13px] transition ${subActiveClass(
                    "/settings/label-settings"
                  )}`}
                >
                  Label Settings
                </Link>
              </div>
            )}
          </div>

          {/* LOGOUT */}
          <Link
            to="/login"
            onClick={handleNavClick}
            className="flex items-center rounded-xl px-3 py-2.5 text-[14px] text-red-500 hover:bg-red-50 transition duration-150"
          >
            <HiOutlineLogout size={20} />
            <span className="ml-3 truncate font-medium">Logout</span>
          </Link>
        </div>
      </aside>

      {/* MOBILE BOTTOM APP BAR */}
      <nav className="fixed bottom-0 left-0 z-30 flex h-16 w-full items-center justify-around border-t border-slate-200 bg-white/95 px-2 backdrop-blur-md lg:hidden">
        <Link
          to="/dashboard"
          className={`flex flex-col items-center justify-center gap-1 transition active:scale-95 ${
            location.pathname === "/dashboard" ? "text-[#008dd2]" : "text-slate-500"
          }`}
        >
          <HiOutlineViewGrid size={21} />
          <span className="text-[11px] font-medium">Home</span>
        </Link>

        <Link
          to="/all-orders"
          className={`flex flex-col items-center justify-center gap-1 transition active:scale-95 ${
            isOrderPath ? "text-[#008dd2]" : "text-slate-500"
          }`}
        >
          <HiOutlineCube size={21} />
          <span className="text-[11px] font-medium">Orders</span>
        </Link>

        <Link
          to="/create-order"
          className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#008dd2] text-white shadow-lg shadow-[#008dd2]/30 transition active:scale-90"
        >
          <HiOutlinePlusCircle size={26} />
        </Link>

        <Link
          to="/wallet"
          className={`flex flex-col items-center justify-center gap-1 transition active:scale-95 ${
            location.pathname === "/wallet" ? "text-[#008dd2]" : "text-slate-500"
          }`}
        >
          <HiOutlineCreditCard size={21} />
          <span className="text-[11px] font-medium">Wallet</span>
        </Link>

        <Link
          to="/tickets"
          className={`flex flex-col items-center justify-center gap-1 transition active:scale-95 ${
            location.pathname === "/tickets" ? "text-[#008dd2]" : "text-slate-500"
          }`}
        >
          <HiOutlineTicket size={21} />
          <span className="text-[11px] font-medium">Tickets</span>
        </Link>
      </nav>
    </>
  );
}

export default Sidebar;