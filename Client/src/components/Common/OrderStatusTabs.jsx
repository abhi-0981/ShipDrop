import { useEffect, useState, useRef, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { fetchOrderStatusCounts } from "../../services/orderEvents";

// Dynamic route prefetcher for instant 0ms tab switching
const prefetchRoute = (path) => {
  try {
    switch (path) {
      case "/processing-orders":
        import("../../pages/Dashboard/ProcessingOrders");
        break;
      case "/all-orders":
        import("../../pages/Dashboard/AllOrders");
        break;
      case "/manifested":
        import("../../pages/Dashboard/Manifested");
        break;
      case "/in-transit":
        import("../../pages/Dashboard/InTransit");
        break;
      case "/pending":
        import("../../pages/Dashboard/Pending");
        break;
      case "/out-for-delivery":
        import("../../pages/Dashboard/OutForDelivery");
        break;
      case "/delivered":
        import("../../pages/Dashboard/Delivered");
        break;
      case "/rto-in-transit":
        import("../../pages/Dashboard/RTOInTransit");
        break;
      case "/rto-delivered":
        import("../../pages/Dashboard/RTODelivered");
        break;
      case "/not-picked":
        import("../../pages/Dashboard/NotPicked");
        break;
      case "/offline-orders":
        import("../../pages/Dashboard/OfflineOrders");
        break;
      case "/cancelled":
        import("../../pages/Dashboard/Cancelled");
        break;
      default:
        break;
    }
  } catch (err) {}
};

export const ORDER_TABS = [
  {
    id: "processing",
    name: "Processing",
    path: "/processing-orders",
    countKey: "PROCESSING",
    matches: ["/processing-orders", "/orders/processing"],
  },
  {
    id: "all",
    name: "All Orders",
    path: "/all-orders",
    countKey: "ALL",
    matches: ["/all-orders"],
  },
  {
    id: "manifested",
    name: "Manifested",
    path: "/manifested",
    countKey: "MANIFESTED",
    matches: ["/manifested"],
  },
  {
    id: "in_transit",
    name: "In Transit",
    path: "/in-transit",
    countKey: "IN TRANSIT",
    matches: ["/in-transit"],
  },
  {
    id: "ndr_pending",
    name: "NDR & Pending",
    path: "/pending",
    countKey: "PENDING",
    matches: ["/pending", "/orders/ndr-pending"],
  },
  {
    id: "ofd",
    name: "OFD",
    path: "/out-for-delivery",
    countKey: "OUT FOR DELIVERY",
    matches: ["/out-for-delivery", "/orders/ofd"],
  },
  {
    id: "delivered",
    name: "Delivered",
    path: "/delivered",
    countKey: "DELIVERED",
    matches: ["/delivered", "/orders/delivered"],
  },
  {
    id: "rto_in_transit",
    name: "RTO In Transit",
    path: "/rto-in-transit",
    countKey: "RTO IN TRANSIT",
    matches: ["/rto-in-transit", "/orders/rto-in-transit"],
  },
  {
    id: "rto_delivered",
    name: "RTO Delivered",
    path: "/rto-delivered",
    countKey: "RTO DELIVERED",
    matches: ["/rto-delivered", "/orders/rto-delivered"],
  },
  {
    id: "not_picked",
    name: "Not Picked",
    path: "/not-picked",
    countKey: "NOT PICKED",
    matches: ["/not-picked"],
  },
  {
    id: "offline",
    name: "Offline Orders",
    path: "/offline-orders",
    countKey: "OFFLINE",
    matches: ["/offline-orders"],
  },
  {
    id: "cancelled",
    name: "Cancelled",
    path: "/cancelled",
    countKey: "CANCELLED",
    matches: ["/cancelled"],
  },
];

export const isOrderRoute = (pathname) => {
  return ORDER_TABS.some((tab) => tab.matches.includes(pathname));
};

function OrderStatusTabs() {
  const location = useLocation();
  const scrollContainerRef = useRef(null);
  const activeTabRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Status counts initialized instantly from cache for 0ms flash
  const [statusCounts, setStatusCounts] = useState(() => {
    try {
      const cached = sessionStorage.getItem("shipdrop_dash_counts");
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  // Check scroll position to show/hide gradient scroll arrow buttons
  const checkScrollButtons = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
  };

  useEffect(() => {
    checkScrollButtons();
    window.addEventListener("resize", checkScrollButtons);
    return () => window.removeEventListener("resize", checkScrollButtons);
  }, []);

  const scroll = (direction) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const amount = direction === "left" ? -240 : 240;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  // Auto-scroll active tab into view smoothly
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
    setTimeout(checkScrollButtons, 300);
  }, [location.pathname]);

  // Status counts listener & live background sync
  useEffect(() => {
    let isMounted = true;

    const fetchCounts = async (force = false) => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return;
        const user = JSON.parse(storedUser);
        const userId = user?.id || user?.user_id || user?.userId;
        if (!userId) return;

        const counts = await fetchOrderStatusCounts(userId, force);
        if (isMounted && counts) {
          setStatusCounts(counts);
          try {
            sessionStorage.setItem("shipdrop_dash_counts", JSON.stringify(counts));
          } catch {}
        }
      } catch (error) {
        console.error("OrderStatusTabs status count error:", error);
      }
    };

    fetchCounts(true);

    const handleUpdate = () => {
      fetchCounts(true);
    };

    const updateEvents = [
      "shipdrop:orders-updated",
      "processingOrderCreated",
      "processingOrderUpdated",
      "orderStatusUpdated",
      "orderUpdated",
      "orderDeleted",
      "ordersDeleted",
      "offlineOrdersUpdated",
    ];

    updateEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleUpdate);
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchCounts(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchCounts(false);
      }
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      updateEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleUpdate);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const getTabCount = (tab) => {
    if (tab.countKey === "OFFLINE") {
      return statusCounts.OFFLINE ?? statusCounts.OFFLINE_ORDERS ?? 0;
    }
    return statusCounts[tab.countKey] ?? 0;
  };

  // If currently not on an order status page, do not render
  if (!isOrderRoute(location.pathname)) {
    return null;
  }

  return (
    <div className="sticky top-[64px] z-20 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all">
      <div className="relative mx-auto flex max-w-[1600px] items-center px-3 sm:px-6 py-2.5">
        {/* Left Scroll Arrow */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            className="absolute left-1 sm:left-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md border border-slate-200 text-slate-600 hover:text-slate-900 transition hover:scale-105 active:scale-95"
            aria-label="Scroll left"
          >
            <FiChevronLeft size={16} />
          </button>
        )}

        {/* Horizontal Scrollable Tabs */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollButtons}
          className="flex w-full items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth px-1"
        >
          {ORDER_TABS.map((tab) => {
            const isActive = tab.matches.includes(location.pathname);
            const count = getTabCount(tab);

            return (
              <Link
                key={tab.id}
                ref={isActive ? activeTabRef : null}
                to={tab.path}
                onMouseEnter={() => prefetchRoute(tab.path)}
                className={`inline-flex shrink-0 items-center justify-center rounded-full px-4 py-2 text-xs sm:text-[13px] transition-all duration-150 active:scale-95 ${
                  isActive
                    ? "bg-[#008dd2] text-white font-semibold shadow-xs border border-[#008dd2]"
                    : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/90 font-medium"
                }`}
              >
                <span>
                  {tab.name} ({Number(count).toLocaleString("en-IN")})
                </span>
              </Link>
            );
          })}
        </div>

        {/* Right Scroll Arrow */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            className="absolute right-1 sm:right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md border border-slate-200 text-slate-600 hover:text-slate-900 transition hover:scale-105 active:scale-95"
            aria-label="Scroll right"
          >
            <FiChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export default OrderStatusTabs;
