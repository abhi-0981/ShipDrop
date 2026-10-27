import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  HiOutlineViewGrid,
  HiOutlineCreditCard,
  HiOutlineLogout,
  HiOutlineUsers,
  HiChevronRight,
  HiOutlineTicket,
  HiOutlineClipboardList,
  HiOutlineScale,
  HiOutlineCurrencyRupee,
  HiOutlinePresentationChartLine,
  HiOutlineSpeakerphone,
  HiOutlineLocationMarker,
  HiOutlineIdentification,
  HiOutlineX,
  HiX,
} from "react-icons/hi";
import { FiMenu, FiSearch } from "react-icons/fi";
import shipdropLogo from "../assets/shipdrop-logo.png";
import ParcelDropLogo from "./ParcelDropLogo";

// Public tracking is served by the CLIENT backend, not the AdminPanel backend.
const CLIENT_API_BASE_URL =
  import.meta.env.VITE_CLIENT_API_URL ||
  "https://parceldropbackend.vercel.app/api";

// Admin backend is used only to look up the database Order ID by AWB.
const ADMIN_API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://parceldropadminapi-blond.vercel.app/api";

function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Desktop default open (false), mobile default closed (true)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 1024;
    }
    return false;
  });
  const [usersOpen, setUsersOpen] = useState(() =>
    location.pathname.startsWith("/users")
  );

  // Sidebar search & F4 shortcut
  const sidebarSearchRef = useRef(null);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);

  // Tracking bar + modal
  const [trackingSearch, setTrackingSearch] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [tracking, setTracking] = useState(null);
  const [showTrackingDetails, setShowTrackingDetails] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setCollapsed(true);
    }
    if (location.pathname.startsWith("/users")) {
      setUsersOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!showTrackingDetails) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeTrackingDetails();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showTrackingDetails]);

  // F4 shortcut to focus sidebar search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F4") {
        e.preventDefault();
        if (collapsed) setCollapsed(false);
        setTimeout(() => sidebarSearchRef.current?.focus(), 50);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [collapsed]);

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    navigate("/login");
  };

  const isUsersActive = location.pathname.startsWith("/users");

  const menuItems = useMemo(
    () => [
      { name: "Dashboard", path: "/dashboard", icon: HiOutlineViewGrid },
      {
        name: "Business Analytics",
        path: "/analytics",
        icon: HiOutlinePresentationChartLine,
      },
      { name: "All Orders", path: "/orders", icon: HiOutlineClipboardList },
      {
        name: "COD Remittance",
        path: "/cod-remittance",
        icon: HiOutlineCurrencyRupee,
      },
      {
        name: "Weight Checking",
        path: "/weight-checking",
        icon: HiOutlineScale,
      },
      { name: "Rate Card", path: "/rate-card", icon: HiOutlineCreditCard },
      { name: "Tickets", path: "/tickets", icon: HiOutlineTicket },
      {
        name: "Broadcast Notice",
        path: "/announcements",
        icon: HiOutlineSpeakerphone,
      },
      {
        name: "Pickup Addresses",
        path: "/pickup-addresses",
        icon: HiOutlineLocationMarker,
      },
      {
        name: "Parties Info",
        path: "/parties",
        icon: HiOutlineIdentification,
      },
    ],
    []
  );

  const allSearchableItems = useMemo(
    () => [
      ...menuItems,
      { name: "Users", path: "/users", icon: HiOutlineUsers },
      { name: "All Users", path: "/users", icon: HiOutlineUsers },
      { name: "Pickup Addresses", path: "/pickup-addresses", icon: HiOutlineLocationMarker },
      { name: "Pickup Locations", path: "/pickup-addresses", icon: HiOutlineLocationMarker },
      { name: "Parties Information", path: "/parties", icon: HiOutlineIdentification },
      { name: "Party Identities", path: "/parties", icon: HiOutlineIdentification },
    ],
    [menuItems]
  );

  const filteredSearchItems = useMemo(() => {
    const q = sidebarSearch.trim().toLowerCase();
    if (!q) return [];
    return allSearchableItems.filter((item) =>
      item.name.toLowerCase().includes(q)
    );
  }, [sidebarSearch, allSearchableItems]);

  const activeClass = (path) => {
    let isMatch = location.pathname === path;
    if (path === "/orders") {
      isMatch =
        location.pathname === "/orders" ||
        location.pathname.startsWith("/orders/");
    } else if (path === "/parties") {
      isMatch =
        location.pathname === "/parties" ||
        location.pathname.startsWith("/party-identities");
    } else if (path === "/pickup-addresses") {
      isMatch = location.pathname.startsWith("/pickup-addresses");
    }
    return isMatch
      ? "bg-[#008dd2] text-white shadow-sm font-medium"
      : "text-slate-600 hover:bg-slate-100 active:scale-[0.98]";
  };

  const handleSidebarSearchKeyDown = (event) => {
    if (event.key === "Escape") {
      setSidebarSearch("");
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedSearchIndex((prev) =>
        prev < filteredSearchItems.length - 1 ? prev + 1 : 0
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedSearchIndex((prev) =>
        prev > 0 ? prev - 1 : filteredSearchItems.length - 1
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const selectedItem = filteredSearchItems[selectedSearchIndex];
      if (selectedItem) {
        navigate(selectedItem.path);
        setSidebarSearch("");
        if (window.innerWidth < 1024) setCollapsed(true);
      }
    }
  };

  const adminInfo = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("admin")) || {};
    } catch {
      return {};
    }
  }, []);
  const adminName = adminInfo.username || adminInfo.name || "Admin";

  const closeTrackingDetails = () => {
    setShowTrackingDetails(false);
    setTracking(null);
    setTrackingError("");
  };

  const handleTrackingSearch = async (event, awbOverride = "") => {
    event?.preventDefault();
    const awb = String(awbOverride || trackingSearch || "").trim();
    if (!awb) {
      setTrackingError("Enter Tracking ID or AWB number.");
      return;
    }
    if (!/^\d+$/.test(awb)) {
      setTrackingError("Please enter a valid numeric AWB number.");
      return;
    }

    setTrackingLoading(true);
    setTrackingError("");
    try {
      const response = await fetch(
        `${CLIENT_API_BASE_URL}/public/tracking/${encodeURIComponent(awb)}`,
        { method: "GET", headers: { Accept: "application/json" } }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success || !data?.tracking) {
        throw new Error(data?.message || "Shipment not found");
      }
      // Public tracking provides live Delhivery details. Look up Order ID
      // separately from the shared orders database through the Admin backend.
      const item = data.tracking;
      let orderRecord = null;

      try {
        const adminToken = localStorage.getItem("adminToken");
        const orderResponse = await fetch(
          `${ADMIN_API_BASE_URL}/orders/tracking-lookup/${encodeURIComponent(awb)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
            },
          }
        );

        const orderData = await orderResponse.json().catch(() => ({}));
        if (orderResponse.ok && orderData?.success) {
          orderRecord = orderData.order || orderData.data || orderData;
        }
      } catch (orderLookupError) {
        // Tracking still opens if the separate Order ID lookup fails.
        console.error("Admin Order ID lookup failed:", orderLookupError);
      }

      setTracking({
        order_id:
          item.order_id ??
          item.orderId ??
          orderRecord?.order_id ??
          orderRecord?.orderId ??
          null,
        id: item.id ?? orderRecord?.id ?? null,
        tracking_awb: item.awb || item.tracking_awb || awb,
        courier_name: item.courier_name || item.courier || "Delhivery",
        tracking_status:
          item.status || item.tracking_status || item.raw_status || "Tracking unavailable",
        tracking_location: item.location || item.tracking_location || "—",
        tracking_status_datetime:
          item.status_datetime || item.tracking_status_datetime || null,
        tracking_expected_delivery:
          item.expected_delivery || item.tracking_expected_delivery || null,
        tracking_instructions: item.instructions || item.tracking_instructions || "—",
        tracking_scans: Array.isArray(item.scans)
          ? item.scans
          : Array.isArray(item.tracking_scans)
            ? item.tracking_scans
            : [],
      });
      setTrackingSearch("");
      setShowTrackingDetails(true);
    } catch (error) {
      setTrackingError(error.message || "Unable to search shipment");
    } finally {
      setTrackingLoading(false);
    }
  };

  // Allow an AWB click anywhere inside AdminLayout (including All Orders)
  // to open the same in-app tracking popup used by the top tracking search.
  useEffect(() => {
    const handleTrackAwbEvent = (event) => {
      const awb = String(event?.detail?.awb || "").trim();
      if (awb) handleTrackingSearch(undefined, awb);
    };

    window.addEventListener("parceldrop:track-awb", handleTrackAwbEvent);
    return () => window.removeEventListener("parceldrop:track-awb", handleTrackAwbEvent);
  }, [handleTrackingSearch]);

  useEffect(() => {
    const handleTrackAwbFromOrders = (event) => {
      const awb = String(event?.detail?.awb || "").trim();
      if (!awb || awb === "-") return;

      setTrackingSearch(awb);
      setTrackingError("");
      handleTrackingSearch(null, awb);
    };

    window.addEventListener("parceldrop:track-awb", handleTrackAwbFromOrders);
    return () =>
      window.removeEventListener("parceldrop:track-awb", handleTrackAwbFromOrders);
  }, []);

  const formatTrackingDateTime = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatTrackingDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const humanizeTrackingStatus = (value) => {
    const text = String(value || "").trim();
    if (!text) return "Tracking unavailable";
    return text
      .toLowerCase()
      .split(" ")
      .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
      .join(" ");
  };

  const trackingScans = useMemo(() => {
    const scans = Array.isArray(tracking?.tracking_scans) ? tracking.tracking_scans : [];
    return scans
      .map((scan, index) => {
        const detail =
          scan?.ScanDetail || scan?.scanDetail || scan?.scan_detail || scan || {};
        const status =
          detail?.Instructions ||
          detail?.instructions ||
          detail?.ScanType ||
          detail?.scan_type ||
          detail?.ScanGroup ||
          detail?.Status ||
          detail?.status ||
          "Shipment update";
        const location =
          detail?.ScannedLocation ||
          detail?.scanned_location ||
          detail?.ScanLocation ||
          detail?.scan_location ||
          detail?.StatusLocation ||
          detail?.status_location ||
          detail?.Location ||
          detail?.location ||
          "";
        const dateTime =
          detail?.ScanDateTime ||
          detail?.scan_date_time ||
          detail?.StatusDateTime ||
          detail?.status_date_time ||
          detail?.DateTime ||
          detail?.date_time ||
          null;
        return {
          id: `${index}-${dateTime || status}`,
          status,
          location,
          dateTime,
          instructions: detail?.Instructions || detail?.instructions || "",
        };
      })
      .sort(
        (a, b) =>
          new Date(b.dateTime || 0).getTime() - new Date(a.dateTime || 0).getTime()
      );
  }, [tracking]);

  const expectedDelivery = tracking?.tracking_expected_delivery || null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased">
      {/* MOBILE BACKDROP */}
      <div
        onClick={() => setCollapsed(true)}
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 lg:hidden ${
          !collapsed
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      {/* SIDEBAR ASIDE: Closes completely off-screen on toggle */}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-full w-[250px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out ${
          collapsed
            ? "-translate-x-full"
            : "translate-x-0 shadow-2xl lg:shadow-none"
        }`}
      >
        {/* HEADER: LOGO + TOGGLE / CLOSE BUTTON */}
        <div className="flex h-[64px] shrink-0 items-center justify-between border-b border-slate-100 px-4">
          <Link
            to="/dashboard"
            className="flex items-center transition hover:opacity-90 active:scale-95"
            title="ParcelDrop"
          >
            <ParcelDropLogo className="mt-1 pl-1 translate-y-[3px]" height={44} />
          </Link>

          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 active:scale-95"
            title="Close Sidebar"
            aria-label="Close Sidebar"
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
          {/* SIDEBAR SEARCH */}
          <div className="relative mb-2">
            <input
              ref={sidebarSearchRef}
              type="text"
              value={sidebarSearch}
              onChange={(e) => {
                setSidebarSearch(e.target.value);
                setSelectedSearchIndex(0);
              }}
              onKeyDown={handleSidebarSearchKeyDown}
              placeholder="Press F4 to Search"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-8 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
              aria-label="Search sidebar menu"
            />

            {sidebarSearch.trim() && (
              <div className="absolute left-0 right-0 top-full z-[60] mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                {filteredSearchItems.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto py-1">
                    {filteredSearchItems.map((item, index) => (
                      <Link
                        key={`${item.path}-${index}`}
                        to={item.path}
                        onClick={() => {
                          setSidebarSearch("");
                          if (window.innerWidth < 1024) setCollapsed(true);
                        }}
                        className={`block px-3 py-2.5 text-[13px] transition ${
                          index === selectedSearchIndex
                            ? "bg-sky-50 text-[#008dd2] font-semibold"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-3 text-[12px] text-slate-400">
                    No menu found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MENU ITEMS */}
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) setCollapsed(true);
                }}
                className={`flex items-center rounded-xl px-3 py-2.5 text-[14px] transition duration-150 ${activeClass(
                  item.path
                )}`}
              >
                <Icon size={20} />
                <span className="ml-3 truncate">{item.name}</span>
              </Link>
            );
          })}

          {/* USERS DROPDOWN ACCORDION */}
          <div>
            <button
              type="button"
              onClick={() => setUsersOpen(!usersOpen)}
              className="flex w-full items-center rounded-xl px-3 py-2.5 text-[14px] text-slate-600 transition hover:bg-slate-100 active:scale-[0.98]"
            >
              <HiOutlineUsers size={20} />
              <span className="ml-3 flex-1 text-left truncate font-medium">
                Users
              </span>
              <HiChevronRight
                size={17}
                className={`transition-transform duration-300 ease-in-out ${
                  usersOpen
                    ? "rotate-90 text-slate-800"
                    : "rotate-0 text-slate-400"
                }`}
              />
            </button>

            <div className={`sidebar-accordion ${usersOpen ? "is-open" : ""}`}>
              <div>
                <div className="mt-1 ml-5 space-y-1 border-l-2 border-slate-100 pl-3 py-0.5">
                  <Link
                    to="/users"
                    onClick={() => {
                      if (window.innerWidth < 1024) setCollapsed(true);
                    }}
                    className={`flex items-center rounded-lg px-3 py-2 text-[13px] transition ${
                      location.pathname === "/users"
                        ? "bg-sky-50 text-[#008dd2] font-semibold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-[#008dd2]"
                    }`}
                  >
                    All Users
                  </Link>

                  <Link
                    to="/pickup-addresses"
                    onClick={() => {
                      if (window.innerWidth < 1024) setCollapsed(true);
                    }}
                    className={`flex items-center rounded-lg px-3 py-2 text-[13px] transition ${
                      location.pathname === "/pickup-addresses"
                        ? "bg-sky-50 text-[#008dd2] font-semibold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-[#008dd2]"
                    }`}
                  >
                    Pickup Addresses
                  </Link>

                  <Link
                    to="/parties"
                    onClick={() => {
                      if (window.innerWidth < 1024) setCollapsed(true);
                    }}
                    className={`flex items-center rounded-lg px-3 py-2 text-[13px] transition ${
                      location.pathname === "/parties" || location.pathname === "/party-identities"
                        ? "bg-sky-50 text-[#008dd2] font-semibold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-[#008dd2]"
                    }`}
                  >
                    Parties Info
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* LOGOUT */}
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center rounded-xl px-3 py-2.5 text-[14px] text-red-500 hover:bg-red-50 transition duration-150 active:scale-[0.98]"
          >
            <HiOutlineLogout size={20} />
            <span className="ml-3 truncate font-medium">Log out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT + FIXED TOPBAR */}
      <main
        className={`min-h-screen pt-[64px] transition-all duration-300 ${
          collapsed ? "pl-0" : "pl-0 lg:pl-[250px]"
        }`}
      >
        <header
          className={`fixed top-0 right-0 z-30 flex h-[64px] items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-6 transition-all duration-300 ${
            collapsed ? "left-0" : "left-0 lg:left-[250px]"
          }`}
        >
          {/* LEFT SECTION: HAMBURGER + LOGO (When sidebar is collapsed on desktop, or always on mobile) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {(collapsed ||
              (typeof window !== "undefined" && window.innerWidth < 1024)) && (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200 active:scale-90"
                title="Open Sidebar"
                aria-label="Open Sidebar"
              >
                <FiMenu size={20} />
              </button>
            )}

            {(collapsed ||
              (typeof window !== "undefined" && window.innerWidth < 1024)) && (
              <Link
                to="/dashboard"
                className="flex items-center transition hover:opacity-90 active:scale-95"
                title="ParcelDrop"
              >
                <ParcelDropLogo className="mt-1 translate-y-[2px]" height={38} />
              </Link>
            )}
          </div>

          {/* SEARCH BAR (CENTERED/FLEX-1) */}
          <form
            onSubmit={handleTrackingSearch}
            className="relative flex min-w-0 w-full max-w-xl flex-1 mx-2 sm:mx-4"
          >
            <FiSearch
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={17}
            />
            <input
              type="text"
              value={trackingSearch}
              onChange={(event) => {
                setTrackingSearch(event.target.value);
                setTrackingError("");
              }}
              placeholder="Track any shipment by AWB or Tracking ID..."
              disabled={trackingLoading}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-20 text-xs font-medium text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-[#008dd2] focus:bg-white focus:ring-4 focus:ring-[#008dd2]/10 disabled:cursor-not-allowed disabled:opacity-70"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
              {trackingLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-[#008dd2]" />
              ) : (
                <span className="hidden sm:inline-flex rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400 shadow-2xs">
                  AWB
                </span>
              )}
            </div>
            {trackingError && (
              <span className="absolute left-0 top-11 z-40 rounded-xl border border-rose-100 bg-white px-3.5 py-2 text-xs font-medium text-rose-600 shadow-lg">
                {trackingError}
              </span>
            )}
          </form>

          {/* TOPBAR RIGHT: LIVE STATUS & ADMIN PILL */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* LIVE OPERATIONS STATUS */}
            <div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/60 px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-semibold text-emerald-700">
                Live Operations
              </span>
            </div>

            {/* ADMIN BADGE */}
            <div className="flex items-center gap-2 sm:gap-2.5 rounded-xl border border-slate-200/80 bg-white px-2.5 sm:px-3 py-1.5 shadow-2xs">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#008dd2]/10 text-xs font-bold text-[#008dd2]">
                {adminName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-none">
                  {adminName}
                </p>
                <p className="text-[10px] font-semibold text-[#008dd2] mt-0.5 leading-none">
                  Super Admin
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <div className="w-full max-w-[1600px] mx-auto">{children}</div>
      </main>

      {/* TRACKING DETAILS MODAL */}
      {showTrackingDetails && tracking && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 px-3 py-4 backdrop-blur-xs"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeTrackingDetails();
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#008dd2]/10 text-[#008dd2]">
                  <FiSearch size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                    Shipment Tracking
                  </h2>
                  <p className="text-xs text-slate-400">
                    Real-time Delhivery tracking & scan audit trail
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeTrackingDetails}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close tracking details"
              >
                <HiOutlineX size={18} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="overflow-y-auto bg-slate-50/60 px-4 py-4 sm:px-6 sm:py-5">
              {/* SHIPMENT SUMMARY TILES */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
                  <div className="px-4 py-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Tracking / AWB No
                    </p>
                    <p className="mt-1 font-mono text-sm font-bold text-slate-800 truncate">
                      {tracking.tracking_awb || "—"}
                    </p>
                  </div>
                  <div className="px-4 py-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Courier Partner
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-800 truncate">
                      {tracking.courier_name || "Delhivery"}
                    </p>
                  </div>
                  <div className="px-4 py-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Current Status
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <p className="truncate text-sm font-bold text-emerald-600">
                        {humanizeTrackingStatus(tracking.tracking_status)}
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Expected Delivery
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-800 truncate">
                      {formatTrackingDate(expectedDelivery)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 border-t border-slate-100 md:grid-cols-2 lg:grid-cols-3">
                  <div className="border-b border-slate-100 px-4 py-3 md:border-b-0 md:border-r">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Current Location
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-700">
                      {tracking.tracking_location || "—"}
                    </p>
                  </div>
                  <div className="border-b border-slate-100 px-4 py-3 lg:border-b-0 lg:border-r">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Last Updated
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-700">
                      {formatTrackingDateTime(tracking.tracking_status_datetime)}
                    </p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Status Detail
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-700">
                      {tracking.tracking_instructions || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* TIMELINE */}
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-xs sm:px-5 sm:py-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 sm:text-base">
                      Shipment Scan Timeline
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Complete checkpoint tracking history from Delhivery
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                    {trackingScans.length} {trackingScans.length === 1 ? "scan" : "scans"}
                  </span>
                </div>

                {trackingScans.length > 0 ? (
                  <div className="relative">
                    <div className="absolute bottom-4 left-[7px] top-4 w-px bg-slate-200" />
                    <div className="space-y-3.5">
                      {trackingScans.map((scan, index) => (
                        <div key={scan.id} className="relative flex gap-3">
                          <div className="relative z-10 mt-3.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 border-[#008dd2] bg-white">
                            {index === 0 && (
                              <span className="h-1.5 w-1.5 rounded-full bg-[#008dd2]" />
                            )}
                          </div>
                          <div
                            className={`min-w-0 flex-1 rounded-xl border px-4 py-3 transition ${
                              index === 0
                                ? "border-sky-200 bg-sky-50/50 shadow-2xs"
                                : "border-slate-200/80 bg-white"
                            }`}
                          >
                            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800">
                                  {scan.status || "Shipment update"}
                                </p>
                                {scan.location && (
                                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                                    📍 {scan.location}
                                  </p>
                                )}
                                {scan.instructions && scan.instructions !== scan.status && (
                                  <p className="mt-1 text-xs text-slate-500">
                                    {scan.instructions}
                                  </p>
                                )}
                              </div>
                              <p className="shrink-0 text-[11px] font-semibold text-slate-400 sm:text-right">
                                {formatTrackingDateTime(scan.dateTime)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
                    <p className="text-sm font-semibold text-slate-600">
                      No tracking scan history available yet
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      The current shipment status is shown in the summary above.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-end border-t border-slate-100 bg-white px-5 py-3.5 sm:px-6">
              <button
                type="button"
                onClick={closeTrackingDetails}
                className="h-9 rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLayout;
