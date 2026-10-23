import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const PRIMARY = "#008dd2";

// Quick Navigation Items
const NAVIGATION_ITEMS = [
  { id: "create-order", title: "Create New Order", category: "Actions", path: "/create-order", icon: "plus", shortcut: "C" },
  { id: "create-offline", title: "Create Offline Order", category: "Actions", path: "/create-offline-order", icon: "document", shortcut: "O" },
  { id: "dashboard", title: "Dashboard Overview", category: "Pages", path: "/dashboard", icon: "home" },
  { id: "all-orders", title: "All Orders", category: "Orders", path: "/all-orders", icon: "box", shortcut: "A" },
  { id: "processing", title: "Ready to Ship (Processing)", category: "Orders", path: "/processing-orders", icon: "clock" },
  { id: "offline-orders", title: "Offline Orders", category: "Orders", path: "/offline-orders", icon: "truck" },
  { id: "manifested", title: "Manifested Shipments", category: "Orders", path: "/manifested", icon: "truck" },
  { id: "not-picked", title: "Not Picked Shipments", category: "Orders", path: "/not-picked", icon: "clock" },
  { id: "in-transit", title: "In Transit Shipments", category: "Orders", path: "/in-transit", icon: "truck" },
  { id: "ofd", title: "Out For Delivery", category: "Orders", path: "/out-for-delivery", icon: "navigation" },
  { id: "delivered", title: "Delivered Orders", category: "Orders", path: "/delivered", icon: "check" },
  { id: "pending", title: "Undelivered Orders (NDR)", category: "Orders", path: "/pending", icon: "alert" },
  { id: "rto-in-transit", title: "RTO In Transit", category: "Orders", path: "/rto-in-transit", icon: "refresh" },
  { id: "rto-delivered", title: "RTO Delivered", category: "Orders", path: "/rto-delivered", icon: "box" },
  { id: "cancelled", title: "Cancelled Orders", category: "Orders", path: "/cancelled", icon: "x" },
  { id: "wallet", title: "Wallet & Transaction History", category: "Finance", path: "/wallet", icon: "wallet", shortcut: "W" },
  { id: "cod", title: "COD Remittance", category: "Finance", path: "/cod-remittance", icon: "currency" },
  { id: "rate-calc", title: "Rate Calculator", category: "Tools", path: "/rate-calculator", icon: "calculator", shortcut: "R" },
  { id: "serviceability", title: "Pincode Serviceability", category: "Tools", path: "/serviceability", icon: "map-pin" },
  { id: "pickup", title: "Pickup Warehouses", category: "Settings", path: "/pickup-address", icon: "building" },
  { id: "returns", title: "Return Addresses", category: "Settings", path: "/return-addresses", icon: "rotate-ccw" },
  { id: "parties", title: "Party Identities", category: "Settings", path: "/party-identities", icon: "users" },
  { id: "tickets", title: "Support Tickets & Helpdesk", category: "Support", path: "/tickets", icon: "help" },
];

const Icon = ({ name, className = "h-4 w-4" }) => {
  switch (name) {
    case "search":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      );
    case "plus":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
      );
    case "box":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 8.5 12 4 3 8.5v7L12 20l9-4.5v-7Z" />
          <path d="M3 8.5 12 13l9-4.5" />
          <path d="M12 13v7" />
        </svg>
      );
    case "truck":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
          <path d="M15 18H9" />
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14v10Z" />
          <circle cx="17" cy="18.5" r="2.5" />
          <circle cx="7" cy="18.5" r="2.5" />
        </svg>
      );
    case "wallet":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </svg>
      );
    case "clock":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "check":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case "calculator":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="16" y1="14" x2="16" y2="18" />
          <path d="M16 10h.01" />
          <path d="M12 10h.01" />
          <path d="M8 10h.01" />
          <path d="M12 14h.01" />
          <path d="M8 14h.01" />
          <path d="M12 18h.01" />
          <path d="M8 18h.01" />
        </svg>
      );
    case "map-pin":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
  }
};

export default function CommandPalette() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, ORDERS, PAGES
  const [orderResults, setOrderResults] = useState([]);
  const [isSearchingOrders, setIsSearchingOrders] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Global Keyboard Shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
        return;
      }

      // Open on pressing '/' when not typing in an input
      if (
        e.key === "/" &&
        !isOpen &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName) &&
        !document.activeElement?.isContentEditable
      ) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("shipdrop:openCommandPalette", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("shipdrop:openCommandPalette", handleCustomOpen);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filter local navigation items based on query
  const filteredNavItems = useMemo(() => {
    if (!query.trim()) {
      return NAVIGATION_ITEMS;
    }
    const q = query.toLowerCase().trim();
    return NAVIGATION_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q)
    );
  }, [query]);

  // Debounced live API order search
  useEffect(() => {
    const q = query.trim();
    if (!q || q.length < 2) {
      setOrderResults([]);
      setIsSearchingOrders(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!user?.id) return;

        setIsSearchingOrders(true);
        const response = await api.get("/orders/all", {
          params: {
            user_id: user.id,
            search: q,
            limit: 8,
          },
        });

        if (response.data?.success && Array.isArray(response.data.orders)) {
          setOrderResults(response.data.orders);
        } else {
          setOrderResults([]);
        }
      } catch (err) {
        console.error("Command palette search error:", err);
        setOrderResults([]);
      } finally {
        setIsSearchingOrders(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Combined list for keyboard navigation
  const allSelectableItems = useMemo(() => {
    const list = [];
    const cleanQ = query.trim();

    // If query has at least 3 characters, offer live tracking directly at top
    if (cleanQ.length >= 3 && (activeTab === "ALL" || activeTab === "ORDERS")) {
      list.push({ type: "TRACK", data: { search: cleanQ } });
    }

    // If on ALL or ORDERS tab and we have orders
    if (activeTab === "ALL" || activeTab === "ORDERS") {
      orderResults.forEach((order) => {
        list.push({ type: "ORDER", data: order });
      });
    }

    // If on ALL or PAGES tab
    if (activeTab === "ALL" || activeTab === "PAGES") {
      filteredNavItems.forEach((item) => {
        list.push({ type: "NAV", data: item });
      });
    }

    return list;
  }, [query, activeTab, orderResults, filteredNavItems]);

  // Reset selected index when selectable items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [allSelectableItems.length]);

  // Ensure active keyboard-selected item scrolls into view smoothly
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-command-index="${selectedIndex}"]`);
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  // Keyboard navigation inside list
  const handleInputKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, allSelectableItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allSelectableItems.length) % Math.max(1, allSelectableItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = allSelectableItems[selectedIndex];
      if (current) {
        handleSelectItem(current);
      }
    }
  };

  const handleSelectItem = (item) => {
    setIsOpen(false);

    if (item.type === "TRACK") {
      window.dispatchEvent(
        new CustomEvent("shipdrop:openTracking", { detail: String(item.data.search).trim() })
      );
    } else if (item.type === "NAV") {
      navigate(item.data.path);
    } else if (item.type === "ORDER") {
      const order = item.data;
      const awb = order.awb_number || order.awb || order.tracking_number;

      if (awb && awb !== "—" && awb !== "AWB unavailable") {
        window.dispatchEvent(
          new CustomEvent("shipdrop:openTracking", { detail: String(awb).trim() })
        );
      } else {
        const orderId = order.order_id || order.id;
        navigate(`/all-orders?search=${encodeURIComponent(orderId)}`);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center p-3 sm:p-6 sm:pt-20 bg-slate-950/45 backdrop-blur-[4px] animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl transition-all"
        style={{ maxHeight: "calc(100vh - 80px)" }}
      >
        {/* TOP SEARCH HEADER */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 bg-white">
          <span className="text-[#008dd2] shrink-0">
            <Icon name="search" className="h-5 w-5" />
          </span>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search orders, AWBs, customers, or jump to any page..."
            className="w-full text-[13px] sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded cursor-pointer"
            >
              Clear
            </button>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <kbd className="hidden sm:inline-block rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 shadow-2xs">
              ESC
            </kbd>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition active:scale-95 cursor-pointer"
              title="Close (ESC)"
              aria-label="Close Command Palette"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* CATEGORY FILTER TABS */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/70 px-4 py-2 text-xs">
          {[
            { id: "ALL", label: "All" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                activeTab === tab.id
                  ? "bg-white text-[#008dd2] shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* RESULTS SCROLL VIEW */}
        <div
          ref={listRef}
          className="overflow-y-auto p-2 space-y-3 max-h-[60vh] [scrollbar-width:thin]"
        >
          {/* DIRECT TRACK ACTION (If user typed >= 3 characters) */}
          {query.trim().length >= 3 && (activeTab === "ALL" || activeTab === "ORDERS") && (
            <div
              data-command-index={0}
              onClick={() => handleSelectItem({ type: "TRACK", data: { search: query.trim() } })}
              className={`group flex items-center justify-between rounded-xl p-2.5 transition cursor-pointer text-xs ${
                selectedIndex === 0
                  ? "bg-[#008dd2]/10 text-slate-900 ring-1 ring-[#008dd2]/30"
                  : "bg-sky-50/40 hover:bg-sky-50 text-slate-700 border border-sky-100/60"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#008dd2] text-white shadow-xs">
                  <Icon name="truck" className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-slate-900">
                    <span className="font-semibold text-slate-600">Track Shipment:</span>
                    <span className="font-mono font-bold text-[#008dd2] truncate">"{query.trim()}"</span>
                  </div>
                  <div className="text-[10.5px] text-slate-400 truncate">
                    Press Enter to open live tracking drawer for this AWB or Order ID
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-full bg-[#008dd2]/10 px-2 py-0.5 text-[9.5px] font-bold text-[#008dd2] uppercase">
                  Track Live
                </span>
                <span className="text-slate-300 group-hover:text-slate-600 transition">↵</span>
              </div>
            </div>
          )}

          {/* 1. ORDERS SECTION (IF ANY) */}
          {(activeTab === "ALL" || activeTab === "ORDERS") && (
            <div>
              {isSearchingOrders && (
                <div className="space-y-2 p-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
                    Searching Orders...
                  </div>
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="h-3.5 w-32 rounded bg-slate-200 skeleton-shimmer" />
                        <div className="h-4 w-16 rounded bg-slate-200 skeleton-shimmer" />
                      </div>
                      <div className="h-2.5 w-48 rounded bg-slate-100 skeleton-shimmer" />
                    </div>
                  ))}
                </div>
              )}

              {!isSearchingOrders && orderResults.length > 0 && (
                <div className="space-y-1">
                  <div className="px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Orders & Shipments ({orderResults.length})
                  </div>
                  {orderResults.map((order, idx) => {
                    const hasDirectTrack = query.trim().length >= 3 && (activeTab === "ALL" || activeTab === "ORDERS");
                    const orderGlobalIndex = (hasDirectTrack ? 1 : 0) + idx;
                    const isSelected = selectedIndex === orderGlobalIndex;
                    const id = order.order_id || order.id;
                    const awb = order.awb_number || order.awb || order.tracking_number;
                    const customer = order.consignee_name || order.customer_name || "Customer";
                    const phone = order.consignee_phone || order.buyer_mobile || "";
                    const status = order.status || order.manifest_status || "PROCESSING";
                    const route = `${order.pickup_city || "Origin"} → ${order.delivery_city || order.city || "Dest"}`;

                    return (
                      <div
                        key={id}
                        data-command-index={orderGlobalIndex}
                        onClick={() => handleSelectItem({ type: "ORDER", data: order })}
                        className={`group flex items-center justify-between rounded-xl p-2.5 transition cursor-pointer text-xs ${
                          isSelected
                            ? "bg-[#008dd2]/10 text-slate-900 ring-1 ring-[#008dd2]/30"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-[#008dd2]">
                            <Icon name="box" className="h-4 w-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold font-mono text-slate-900">#{id}</span>
                              <span className="font-semibold text-slate-800 truncate">{customer}</span>
                              {phone && <span className="text-[10px] text-slate-400">({phone})</span>}
                            </div>
                            <div className="text-[10.5px] text-slate-400 truncate mt-0.5">
                              {awb && awb !== "—" ? <span className="font-mono font-medium text-[#008dd2]">AWB: {awb} • </span> : null}
                              <span>{route}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9.5px] font-bold text-slate-600 uppercase">
                            {status}
                          </span>
                          <span className="text-slate-300 group-hover:text-slate-600 transition">↵</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. PAGES & ACTIONS SECTION */}
          {(activeTab === "ALL" || activeTab === "PAGES") && (
            <div className="space-y-1">
              <div className="px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Quick Navigation & Actions
              </div>

              {filteredNavItems.length === 0 && orderResults.length === 0 && !isSearchingOrders && (
                <div className="py-12 text-center text-xs text-slate-400">
                  <p className="font-semibold text-slate-600">No matching results found</p>
                  <p className="text-[11px] mt-1">Try searching for an Order ID, AWB, customer name, or page title.</p>
                </div>
              )}

              {filteredNavItems.map((item, idx) => {
                const hasDirectTrack = query.trim().length >= 3 && (activeTab === "ALL" || activeTab === "ORDERS");
                const itemGlobalIndex =
                  (hasDirectTrack ? 1 : 0) + (activeTab === "ALL" ? orderResults.length : 0) + idx;
                const isSelected = selectedIndex === itemGlobalIndex;

                return (
                  <div
                    key={item.id}
                    data-command-index={itemGlobalIndex}
                    onClick={() => handleSelectItem({ type: "NAV", data: item })}
                    className={`group flex items-center justify-between rounded-xl px-3 py-2.5 transition cursor-pointer text-xs ${
                      isSelected
                        ? "bg-[#008dd2]/10 text-slate-900 ring-1 ring-[#008dd2]/30"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-[#008dd2] group-hover:text-white transition">
                        <Icon name={item.icon} className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-semibold text-slate-800">{item.title}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.category}
                      </span>
                      {item.shortcut && (
                        <kbd className="hidden sm:inline-block rounded border border-slate-200 bg-white px-1.5 py-0.2 font-mono text-[9px] text-slate-400 shadow-2xs">
                          {item.shortcut}
                        </kbd>
                      )}
                      <span className="text-slate-300 group-hover:text-slate-600 transition">↵</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER HINTS */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-[#fafbfc] px-4 py-2.5 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 font-mono text-[9px] text-slate-500 shadow-2xs">↑</kbd>
              {" "}
              <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 font-mono text-[9px] text-slate-500 shadow-2xs">↓</kbd>
              {" "}to navigate
            </span>
            <span>
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[9px] text-slate-500 shadow-2xs">↵</kbd>
              {" "}to select
            </span>
            <span>
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[9px] text-slate-500 shadow-2xs">ESC</kbd>
              {" "}to close
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 font-mono text-[10px] text-slate-400">
            <span>ParcelDrop Command</span>
          </div>
        </div>
      </div>
    </div>
  );
}
