import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const PRIMARY = "#008dd2";

// 10 MOST FREQUENTLY USED QUICK ACTION BOXES
const QUICK_ACTION_CARDS = [
  {
    id: "add-order",
    title: "Add an Order",
    path: "/create-order",
    category: "Shipping",
    circleStyle: "bg-indigo-50/80 text-indigo-600 border border-indigo-100/90",
    renderIcon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8.5 12 4 3 8.5v7L12 20l9-4.5v-7Z" />
        <path d="M3 8.5 12 13l9-4.5" />
        <path d="M12 13v7" />
      </svg>
    ),
  },
  {
    id: "all-orders",
    title: "All Orders",
    path: "/all-orders",
    category: "Orders",
    circleStyle: "bg-blue-50/80 text-blue-600 border border-blue-100/90",
    renderIcon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    id: "rate-calc",
    title: "Rate Calculator",
    path: "/rate-calculator",
    category: "Tools",
    circleStyle: "bg-purple-50/80 text-purple-600 border border-purple-100/90",
    renderIcon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="3" />
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
    ),
  },
  {
    id: "create-invoice",
    title: "Create Invoice",
    path: "/create-offline-order",
    category: "B2B / Offline",
    circleStyle: "bg-sky-50/80 text-[#008dd2] border border-sky-100/90",
    renderIcon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="15" x2="15" y2="15" />
        <line x1="9" y1="11" x2="13" y2="11" />
      </svg>
    ),
  },
  {
    id: "cod-remittance",
    title: "Remittance Transaction Log",
    path: "/cod-remittance",
    category: "Finance",
    circleStyle: "bg-emerald-50/80 text-emerald-600 border border-emerald-100/90",
    renderIcon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <path d="M12 11v6" />
        <path d="M9.5 13.5a2.5 2.5 0 0 1 5 0c0 2-3 2-3 3.5" />
      </svg>
    ),
  },
  {
    id: "processing-orders",
    title: "Ready to Ship",
    path: "/processing-orders",
    category: "Processing",
    circleStyle: "bg-amber-50/80 text-amber-600 border border-amber-100/90",
    renderIcon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: "serviceability",
    title: "Pincode Serviceability",
    path: "/serviceability",
    category: "Tools",
    circleStyle: "bg-teal-50/80 text-teal-600 border border-teal-100/90",
    renderIcon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    id: "manifested",
    title: "Manifested Shipments",
    path: "/manifested",
    category: "Orders",
    circleStyle: "bg-cyan-50/80 text-cyan-600 border border-cyan-100/90",
    renderIcon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
        <path d="M15 18H9" />
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14v10Z" />
        <circle cx="17" cy="18.5" r="2.5" />
        <circle cx="7" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    id: "pending-ndr",
    title: "NDR & Undelivered",
    path: "/pending",
    category: "Action Needed",
    circleStyle: "bg-rose-50/80 text-rose-600 border border-rose-100/90",
    renderIcon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    id: "wallet-passbook",
    title: "Wallet & Passbook",
    path: "/wallet",
    category: "Finance",
    circleStyle: "bg-violet-50/80 text-violet-600 border border-violet-100/90",
    renderIcon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
      </svg>
    ),
  },
];

// Fallback search navigation items (for when typing in search bar)
const ALL_SEARCHABLE_ITEMS = [
  ...QUICK_ACTION_CARDS.map((c) => ({
    id: c.id,
    title: c.title,
    path: c.path,
    category: c.category,
    icon: "box",
  })),
  { id: "dashboard", title: "Dashboard Overview", category: "Pages", path: "/dashboard", icon: "home" },
  { id: "analytics", title: "Business Analytics & Heatmap", category: "Tools", path: "/analytics", icon: "chart" },
  { id: "offline-orders", title: "Offline Orders List", category: "Orders", path: "/offline-orders", icon: "truck" },
  { id: "not-picked", title: "Not Picked Shipments", category: "Orders", path: "/not-picked", icon: "clock" },
  { id: "in-transit", title: "In Transit Shipments", category: "Orders", path: "/in-transit", icon: "truck" },
  { id: "ofd", title: "Out For Delivery", category: "Orders", path: "/out-for-delivery", icon: "navigation" },
  { id: "delivered", title: "Delivered Orders", category: "Orders", path: "/delivered", icon: "check" },
  { id: "rto-in-transit", title: "RTO In Transit", category: "Orders", path: "/rto-in-transit", icon: "refresh" },
  { id: "rto-delivered", title: "RTO Delivered", category: "Orders", path: "/rto-delivered", icon: "box" },
  { id: "cancelled", title: "Cancelled Orders", category: "Orders", path: "/cancelled", icon: "x" },
  { id: "pickup", title: "Pickup Warehouses", category: "Settings", path: "/pickup-address", icon: "building" },
  { id: "returns", title: "Return Addresses", category: "Settings", path: "/return-addresses", icon: "rotate-ccw" },
  { id: "parties", title: "Party Identities", category: "Settings", path: "/party-identities", icon: "users" },
  { id: "tickets", title: "Support Tickets & Helpdesk", category: "Support", path: "/tickets", icon: "help" },
];

export default function CommandPalette() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
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

  // Filter items when query is present
  const filteredNavItems = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return ALL_SEARCHABLE_ITEMS.filter(
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
        const res = await api.get(`/orders/all?search=${encodeURIComponent(q)}&limit=5`);
        if (res.data?.success && Array.isArray(res.data.orders)) {
          setOrderResults(res.data.orders);
        } else {
          setOrderResults([]);
        }
      } catch (err) {
        setOrderResults([]);
      } finally {
        setIsSearchingOrders(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Selectable items list for keyboard navigation
  const allSelectableItems = useMemo(() => {
    if (!query.trim()) {
      return QUICK_ACTION_CARDS.map((card) => ({ type: "NAV", data: card }));
    }

    const list = [];
    const cleanQ = query.trim();

    if (cleanQ.length >= 3) {
      list.push({ type: "TRACK", data: { search: cleanQ } });
    }

    orderResults.forEach((order) => {
      list.push({ type: "ORDER", data: order });
    });

    filteredNavItems.forEach((item) => {
      list.push({ type: "NAV", data: item });
    });

    return list;
  }, [query, orderResults, filteredNavItems]);

  // Reset selected index when selectable items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [allSelectableItems.length]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-command-index="${selectedIndex}"]`);
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  // Keyboard navigation
  const handleInputKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, allSelectableItems.length));
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
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
      className="fixed inset-0 z-[9999] flex items-start justify-center p-3 sm:p-6 sm:pt-16 bg-slate-950/50 backdrop-blur-[5px] animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl transition-all flex flex-col"
        style={{ maxHeight: "calc(100vh - 70px)" }}
      >
        {/* ======================================================== */}
        {/* 1. TOP HEADER WITH TITLE & CLOSE */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-[#fafbfc] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#008dd2] to-[#0072aa] text-white shadow-xs">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 leading-none">
                Quick Actions
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-none">
                Frequently used shortcuts & navigation tools
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-block rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-400 shadow-2xs">
              ESC
            </kbd>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition active:scale-95 cursor-pointer"
              title="Close (ESC)"
              aria-label="Close Quick Actions"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. SEARCH BAR */}
        {/* ======================================================== */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3 bg-white">
          <span className="text-[#008dd2] shrink-0">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search orders, AWBs, customers, or jump to any page..."
            className="w-full text-[13px] font-medium text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 px-1.5 py-0.5 rounded cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* ======================================================== */}
        {/* 3. CONTENT AREA */}
        {/* ======================================================== */}
        <div
          ref={listRef}
          className="overflow-y-auto flex-1 p-4 sm:p-5 [scrollbar-width:thin]"
        >
          {/* A. DEFAULT VIEW: 10 QUICK ACTION BOXES (When search is empty) */}
          {!query.trim() && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-3.5">
                {QUICK_ACTION_CARDS.map((card, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      data-command-index={idx}
                      onClick={() => {
                        setIsOpen(false);
                        navigate(card.path);
                      }}
                      className={`group relative flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all duration-200 cursor-pointer min-h-[136px] ${
                        isSelected
                          ? "border-[#008dd2] bg-sky-50/50 shadow-md ring-2 ring-[#008dd2]/20 -translate-y-1"
                          : "border-slate-200/80 bg-white hover:border-[#008dd2]/70 hover:shadow-lg hover:shadow-[#008dd2]/10 hover:-translate-y-1 active:scale-95"
                      }`}
                    >
                      {/* Soft Circular Icon Badge */}
                      <div
                        className={`mb-3 flex h-13 w-13 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110 shadow-2xs ${card.circleStyle}`}
                      >
                        {card.renderIcon()}
                      </div>

                      {/* Title */}
                      <span className="text-[12.5px] sm:text-[13px] font-semibold text-slate-800 leading-snug group-hover:text-[#008dd2] transition-colors line-clamp-2">
                        {card.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* B. SEARCH RESULTS (When user types) */}
          {query.trim() && (
            <div className="space-y-3">
              {/* Direct AWB Tracking */}
              {query.trim().length >= 3 && (
                <div
                  data-command-index={0}
                  onClick={() => handleSelectItem({ type: "TRACK", data: { search: query.trim() } })}
                  className={`group flex items-center justify-between rounded-xl p-3 transition cursor-pointer text-xs ${
                    selectedIndex === 0
                      ? "bg-[#008dd2]/10 text-slate-900 ring-1 ring-[#008dd2]/30"
                      : "bg-sky-50/50 hover:bg-sky-50 text-slate-700 border border-sky-100"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#008dd2] text-white shadow-xs">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                        <path d="M15 18H9" />
                        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14v10Z" />
                        <circle cx="17" cy="18.5" r="2.5" />
                        <circle cx="7" cy="18.5" r="2.5" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-slate-900">
                        <span className="font-semibold text-slate-600">Track Shipment:</span>
                        <span className="font-mono font-bold text-[#008dd2] truncate">"{query.trim()}"</span>
                      </div>
                      <div className="text-[10.5px] text-slate-400 truncate">
                        Press Enter to open live tracking drawer for this AWB
                      </div>
                    </div>
                  </div>

                  <span className="rounded-full bg-[#008dd2]/10 px-2 py-0.5 text-[9.5px] font-bold text-[#008dd2] uppercase">
                    Track Live ↵
                  </span>
                </div>
              )}

              {/* Order Results */}
              {isSearchingOrders && (
                <div className="py-4 text-center text-xs text-slate-400">
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#008dd2] border-t-transparent mr-2" />
                  Searching orders...
                </div>
              )}

              {!isSearchingOrders && orderResults.length > 0 && (
                <div className="space-y-1">
                  <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Orders ({orderResults.length})
                  </div>
                  {orderResults.map((order, idx) => {
                    const itemGlobalIndex = (query.trim().length >= 3 ? 1 : 0) + idx;
                    const isSelected = selectedIndex === itemGlobalIndex;
                    const id = order.order_id || order.id;
                    const awb = order.awb_number || order.awb || order.tracking_number;
                    const customer = order.consignee_name || order.customer_name || "Customer";
                    const status = order.status || order.manifest_status || "PROCESSING";

                    return (
                      <div
                        key={id}
                        data-command-index={itemGlobalIndex}
                        onClick={() => handleSelectItem({ type: "ORDER", data: order })}
                        className={`group flex items-center justify-between rounded-xl p-2.5 transition cursor-pointer text-xs ${
                          isSelected
                            ? "bg-[#008dd2]/10 text-slate-900 ring-1 ring-[#008dd2]/30"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-bold font-mono text-slate-900">#{id}</span>
                          <span className="font-medium text-slate-700 truncate">{customer}</span>
                          {awb && awb !== "—" && (
                            <span className="font-mono text-[11px] text-[#008dd2]">({awb})</span>
                          )}
                        </div>

                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9.5px] font-bold text-slate-600 uppercase">
                          {status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Matching Navigation Pages */}
              {filteredNavItems.length > 0 && (
                <div className="space-y-1">
                  <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Pages & Tools ({filteredNavItems.length})
                  </div>
                  {filteredNavItems.map((item, idx) => {
                    const baseIdx =
                      (query.trim().length >= 3 ? 1 : 0) + orderResults.length;
                    const itemGlobalIndex = baseIdx + idx;
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
                        <span className="font-semibold text-slate-800">{item.title}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.category}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredNavItems.length === 0 && orderResults.length === 0 && !isSearchingOrders && (
                <div className="py-8 text-center text-xs text-slate-400">
                  <p className="font-semibold text-slate-600">No matching results</p>
                  <p className="text-[11px] mt-1">Try another search keyword or clear to view Quick Actions.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 4. FOOTER HINTS */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-[#fafbfc] px-5 py-2.5 text-[11px] text-slate-400">
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
            <span>ParcelDrop Quick Actions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
