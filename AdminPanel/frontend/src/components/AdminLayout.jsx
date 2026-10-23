import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  HiOutlineViewGrid,
  HiOutlineCreditCard,
  HiOutlineLogout,
  HiOutlineUsers,
  HiOutlineChevronDown,
  HiOutlineTicket,
  HiOutlineClipboardList,
  HiOutlineScale,
  HiOutlineX,
  HiMenuAlt2,
  HiOutlineCurrencyRupee,
  HiOutlinePresentationChartLine,
} from "react-icons/hi";
import { FiSearch } from "react-icons/fi";

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

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(() => location.pathname.startsWith("/users"));

  // Tracking bar + modal
  const [trackingSearch, setTrackingSearch] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [tracking, setTracking] = useState(null);
  const [showTrackingDetails, setShowTrackingDetails] = useState(false);

  useEffect(() => setMobileOpen(false), [location.pathname]);
  useEffect(() => {
    if (location.pathname.startsWith("/users")) setUsersOpen(true);
  }, [location.pathname]);

  useEffect(() => {
    if (!showTrackingDetails) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeTrackingDetails();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showTrackingDetails]);

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    navigate("/login");
  };

  const isUsersActive = location.pathname.startsWith("/users");

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: HiOutlineViewGrid },
    { name: "Business Analytics", path: "/analytics", icon: HiOutlinePresentationChartLine },
    { name: "All Orders", path: "/orders", icon: HiOutlineClipboardList },
    { name: "COD Remittance", path: "/cod-remittance", icon: HiOutlineCurrencyRupee },
    { name: "Weight Checking", path: "/weight-checking", icon: HiOutlineScale },
    { name: "Rate Card", path: "/rate-card", icon: HiOutlineCreditCard },
    { name: "Tickets", path: "/tickets", icon: HiOutlineTicket },
  ];

  const adminInfo = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("admin")) || {};
    } catch {
      return {};
    }
  }, []);
  const adminName = adminInfo.username || adminInfo.name || "Admin";

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isDesktopCollapsed = collapsed && !mobileOpen;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        title={isDesktopCollapsed ? item.name : ""}
        className={({ isActive }) =>
          `group relative flex items-center rounded-xl transition-all duration-200 ${
            isDesktopCollapsed ? "h-11 justify-center px-0" : "h-11 px-3.5 gap-3"
          } ${
            isActive
              ? "bg-[#008dd2]/10 text-[#008dd2] font-semibold shadow-[inset_0_1px_1px_rgba(0,141,210,0.08)]"
              : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium"
          }`
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span className="absolute left-1 top-2.5 bottom-2.5 w-1 rounded-full bg-[#008dd2]" />
            )}
            <Icon
              size={20}
              className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                isActive ? "text-[#008dd2]" : "text-slate-400 group-hover:text-slate-700"
              }`}
            />
            {!isDesktopCollapsed && (
              <span className="text-[13px] tracking-tight truncate">{item.name}</span>
            )}
          </>
        )}
      </NavLink>
    );
  };

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
      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 active:scale-95 transition"
            aria-label="Open sidebar"
          >
            <HiMenuAlt2 size={20} />
          </button>
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="ParcelDrop"
              className="h-7 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="text-base font-black tracking-tight text-[#008dd2]">
              ParcelDrop
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#008dd2] to-sky-400 text-xs font-bold text-white shadow-xs">
            {adminName.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* MOBILE BACKDROP */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-slate-200/80 bg-white shadow-xl transition-all duration-300 ease-in-out lg:shadow-[2px_0_12px_rgba(15,23,42,0.03)] ${
          mobileOpen ? "translate-x-0 w-[260px]" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "lg:w-[76px]" : "lg:w-[250px]"}`}
      >
        {/* SIDEBAR BRAND HEADER */}
        <div
          className={`flex h-16 shrink-0 items-center border-b border-slate-100 px-4 ${
            collapsed && !mobileOpen ? "justify-center" : "justify-between"
          }`}
        >
          {(!collapsed || mobileOpen) ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/logo.png"
                alt="ParcelDrop"
                className="h-8 w-auto object-contain shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-lg font-black tracking-tight text-[#008dd2] leading-none">
                  ParcelDrop
                </span>
                <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-1">
                  Admin Console
                </span>
              </div>
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#008dd2] to-sky-400 text-white font-black text-sm shadow-sm">
              P
            </div>
          )}

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:flex"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <HiMenuAlt2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <HiOutlineX size={18} />
          </button>
        </div>

        {/* SIDEBAR NAVIGATION */}
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3.5 [scrollbar-width:thin]">
          {(!collapsed || mobileOpen) && (
            <p className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Navigation
            </p>
          )}

          {menuItems.map(renderNavItem)}

          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                if (collapsed && !mobileOpen) {
                  setCollapsed(false);
                  setUsersOpen(true);
                  return;
                }
                setUsersOpen((prev) => !prev);
              }}
              className={`group relative flex h-11 w-full items-center rounded-xl transition-all duration-200 ${
                collapsed && !mobileOpen ? "justify-center px-0" : "gap-3 px-3.5"
              } ${
                isUsersActive
                  ? "bg-[#008dd2]/10 text-[#008dd2] font-semibold"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium"
              }`}
              title={collapsed && !mobileOpen ? "Users" : ""}
              aria-expanded={usersOpen}
            >
              {isUsersActive && (
                <span className="absolute left-1 top-2.5 bottom-2.5 w-1 rounded-full bg-[#008dd2]" />
              )}
              <HiOutlineUsers
                size={20}
                className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                  isUsersActive
                    ? "text-[#008dd2]"
                    : "text-slate-400 group-hover:text-slate-700"
                }`}
              />
              {(!collapsed || mobileOpen) && (
                <>
                  <span className="flex-1 text-left text-[13px] tracking-tight">
                    Users
                  </span>
                  <HiOutlineChevronDown
                    size={15}
                    className={`text-slate-400 transition-transform duration-200 ${
                      usersOpen ? "rotate-180" : ""
                    }`}
                  />
                </>
              )}
            </button>
            {(!collapsed || mobileOpen) && usersOpen && (
              <div className="ml-5 mt-1 space-y-1 border-l-2 border-slate-100 pl-3">
                <NavLink
                  to="/users"
                  className={({ isActive }) =>
                    `flex h-9 items-center rounded-lg px-3 text-xs font-semibold transition ${
                      isActive
                        ? "bg-[#008dd2]/10 text-[#008dd2]"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`
                  }
                >
                  All Users
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        {/* SIDEBAR FOOTER: ADMIN PROFILE & LOGOUT */}
        <div className="shrink-0 border-t border-slate-100 bg-slate-50/60 p-3">
          {(!collapsed || mobileOpen) ? (
            <div className="flex items-center justify-between gap-2.5 rounded-xl border border-slate-200/60 bg-white p-2.5 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#008dd2] to-sky-400 text-xs font-bold text-white shadow-2xs">
                  {adminName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-800 leading-tight">
                    {adminName}
                  </p>
                  <p className="truncate text-[10px] font-medium text-slate-400">
                    Super Admin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50 hover:text-rose-600"
                title="Logout"
                aria-label="Logout"
              >
                <HiOutlineLogout size={17} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={logout}
              className="flex h-10 w-full items-center justify-center rounded-xl text-rose-600 transition hover:bg-rose-50"
              title="Logout"
              aria-label="Logout"
            >
              <HiOutlineLogout size={19} />
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT + FIXED TOPBAR */}
      <main
        className={`min-h-screen transition-all duration-300 ${
          collapsed ? "lg:ml-[76px]" : "lg:ml-[250px]"
        }`}
      >
        <header
          className={`fixed top-0 right-0 z-30 flex h-[64px] items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 backdrop-blur-md transition-all duration-300 left-0 ${
            collapsed ? "lg:left-[76px]" : "lg:left-[250px]"
          }`}
        >
          {/* SEARCH BAR (CENTERED/FLEX-1) */}
          <form
            onSubmit={handleTrackingSearch}
            className="relative flex min-w-0 w-full max-w-xl flex-1"
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
          <div className="flex items-center gap-3 shrink-0">
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
            <div className="hidden sm:flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 shadow-2xs">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#008dd2]/10 text-xs font-bold text-[#008dd2]">
                {adminName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
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
        <div className="pt-[64px] w-full max-w-[1600px] mx-auto">{children}</div>
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
