import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchOrderStatusCounts } from "../../services/orderEvents";

// Dynamic route prefetcher for 0ms instant tab switching
const prefetchRoute = (path) => {
  try {
    switch (path) {
      case "/all-orders":
        import("../../pages/Dashboard/AllOrders");
        break;
      case "/processing-orders":
        import("../../pages/Dashboard/ProcessingOrders");
        break;
      case "/manifested":
        import("../../pages/Dashboard/Manifested");
        break;
      case "/in-transit":
        import("../../pages/Dashboard/InTransit");
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
      case "/pending":
        import("../../pages/Dashboard/Pending");
        break;
      case "/cancelled":
        import("../../pages/Dashboard/Cancelled");
        break;
      case "/not-picked":
        import("../../pages/Dashboard/NotPicked");
        break;
      case "/offline-orders":
        import("../../pages/Dashboard/OfflineOrders");
        break;
      default:
        break;
    }
  } catch (err) {}
};

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

function OrderStatusNavTabs({ className = "" }) {
  const location = useLocation();
  const activeTabRef = useRef(null);

  // Initialize immediately from cached sessionStorage for 0ms delay
  const [counts, setCounts] = useState(() => {
    try {
      const cached = sessionStorage.getItem("shipdrop_dash_counts");
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  // Load authoritative counts from backend
  useEffect(() => {
    let isMounted = true;

    const loadCounts = async (force = false) => {
      const userId = getUserId();
      if (!userId) return;

      try {
        const fresh = await fetchOrderStatusCounts(userId, force);
        if (isMounted && fresh && typeof fresh === "object") {
          setCounts(fresh);
          try {
            sessionStorage.setItem("shipdrop_dash_counts", JSON.stringify(fresh));
          } catch {}
        }
      } catch (err) {
        console.error("OrderStatusNavTabs loadCounts error:", err);
      }
    };

    loadCounts(false);

    const handleUpdate = () => {
      loadCounts(true);
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

    updateEvents.forEach((evt) => window.addEventListener(evt, handleUpdate));

    return () => {
      isMounted = false;
      updateEvents.forEach((evt) => window.removeEventListener(evt, handleUpdate));
    };
  }, []);

  // Auto-scroll active tab into view horizontally
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [location.pathname]);

  // Tab definitions matching the exact screenshot sequence
  const tabs = useMemo(
    () => [
      {
        name: "Processing",
        path: "/processing-orders",
        aliases: ["/processing-orders", "/orders/processing"],
        getCount: (c) =>
          c.PROCESSING ?? c.processing_count ?? c.READY_TO_SHIP ?? 0,
      },
      {
        name: "All Orders",
        path: "/all-orders",
        aliases: ["/all-orders"],
        getCount: (c) => c.ALL ?? c.all_count ?? 0,
      },
      {
        name: "Manifested",
        path: "/manifested",
        aliases: ["/manifested"],
        getCount: (c) => c.MANIFESTED ?? c.manifested_count ?? 0,
      },
      {
        name: "In Transit",
        path: "/in-transit",
        aliases: ["/in-transit"],
        getCount: (c) => c["IN TRANSIT"] ?? c.in_transit_count ?? 0,
      },
      {
        name: "NDR & Pending",
        path: "/pending",
        aliases: ["/pending", "/orders/ndr-pending"],
        getCount: (c) => c.PENDING ?? c.pending_count ?? 0,
      },
      {
        name: "OFD",
        path: "/out-for-delivery",
        aliases: ["/out-for-delivery", "/orders/ofd"],
        getCount: (c) =>
          c["OUT FOR DELIVERY"] ?? c.out_for_delivery_count ?? c.OFD ?? 0,
      },
      {
        name: "Delivered",
        path: "/delivered",
        aliases: ["/delivered"],
        getCount: (c) => c.DELIVERED ?? c.delivered_count ?? 0,
      },
      {
        name: "RTO In Transit",
        path: "/rto-in-transit",
        aliases: ["/rto-in-transit"],
        getCount: (c) => c["RTO IN TRANSIT"] ?? c.rto_in_transit_count ?? 0,
      },
      {
        name: "RTO Delivered",
        path: "/rto-delivered",
        aliases: ["/rto-delivered"],
        getCount: (c) => c["RTO DELIVERED"] ?? c.rto_delivered_count ?? 0,
      },
      {
        name: "Not Picked",
        path: "/not-picked",
        aliases: ["/not-picked"],
        getCount: (c) => c["NOT PICKED"] ?? c.not_picked_count ?? 0,
      },
      {
        name: "Offline Orders",
        path: "/offline-orders",
        aliases: ["/offline-orders"],
        getCount: (c) =>
          c.OFFLINE ?? c.OFFLINE_ORDERS ?? c.offline_count ?? 0,
      },
      {
        name: "Cancelled",
        path: "/cancelled",
        aliases: ["/cancelled"],
        getCount: (c) => c.CANCELLED ?? c.cancelled_count ?? 0,
      },
    ],
    []
  );

  return (
    <div className={`mb-3 w-full overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const isActive = tab.aliases.some(
            (alias) =>
              location.pathname === alias ||
              (alias !== "/" && location.pathname.startsWith(alias + "/"))
          );
          const count = tab.getCount(counts);

          return (
            <Link
              key={tab.path}
              ref={isActive ? activeTabRef : null}
              to={tab.path}
              onMouseEnter={() => prefetchRoute(tab.path)}
              className={`inline-flex shrink-0 items-center justify-center rounded-full px-3 py-1.5 sm:px-3.5 sm:py-1.5 text-[12px] sm:text-[12.5px] transition-all duration-150 active:scale-95 ${
                isActive
                  ? "bg-[#008dd2] text-white shadow-sm font-semibold border border-[#008dd2]"
                  : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/90 font-medium shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
              }`}
            >
              <span>{tab.name}</span>
              <span
                className={`ml-1.5 font-semibold ${
                  isActive ? "text-white/95" : "text-slate-500"
                }`}
              >
                ({count})
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default OrderStatusNavTabs;
