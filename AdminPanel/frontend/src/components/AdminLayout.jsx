
import { useEffect, useState } from "react";
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
  HiOutlineSearch,
  HiOutlineClock,
  HiOutlineLocationMarker,
} from "react-icons/hi";

// Client backend URL
const CLIENT_API_BASE_URL =
  import.meta.env.VITE_CLIENT_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://parceldropbackend.vercel.app/api");

// Tracking history helpers
function getScanStatus(scan) {
  return (
    scan?.status ||
    scan?.status_type ||
    scan?.scan ||
    scan?.instructions ||
    "Shipment update"
  );
}

function getScanLocation(scan) {
  return (
    scan?.location ||
    scan?.scan_location ||
    scan?.origin ||
    ""
  );
}

function getScanDate(scan) {
  return (
    scan?.status_datetime ||
    scan?.datetime ||
    scan?.date_time ||
    scan?.date ||
    scan?.scan_datetime ||
    ""
  );
}

function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Tracking state
  const [trackingId, setTrackingId] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [trackingData, setTrackingData] = useState(null);

  const [usersOpen, setUsersOpen] = useState(() =>
    location.pathname.startsWith("/users")
  );

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname.startsWith("/users")) {
      setUsersOpen(true);
    }
  }, [location.pathname]);

  // Logout
  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    navigate("/login");
  };

  // Track shipment using client backend
  const trackShipment = async (event) => {
    event?.preventDefault();

    const awb = trackingId.trim();

    if (!awb) {
      setTrackingError("Please enter an AWB / tracking number.");
      setTrackingData(null);
      return;
    }

    // Current public tracking endpoint accepts numeric AWBs only.
    if (!/^\d+$/.test(awb)) {
      setTrackingError(
        "Please enter a numeric AWB. Order ID lookup is not supported yet."
      );
      setTrackingData(null);
      return;
    }

    setTrackingLoading(true);
    setTrackingError("");
    setTrackingData(null);

    try {
      const response = await fetch(
        `${CLIENT_API_BASE_URL}/public/tracking/${encodeURIComponent(awb)}`
      );

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "Tracking service returned an invalid response."
        );
      }

      if (!response.ok || !data?.success || !data?.tracking) {
        throw new Error(
          data?.message || "Shipment tracking details not found."
        );
      }

      setTrackingData(data.tracking);
    } catch (error) {
      console.error("Admin tracking lookup failed:", error);

      setTrackingError(
        error?.message ||
          "Unable to fetch tracking. Please try again."
      );
    } finally {
      setTrackingLoading(false);
    }
  };

  // Clear tracking result
  const clearTracking = () => {
    setTrackingId("");
    setTrackingError("");
    setTrackingData(null);
  };

  const isUsersActive = location.pathname.startsWith("/users");

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: HiOutlineViewGrid,
    },
    {
      name: "All Orders",
      path: "/orders",
      icon: HiOutlineClipboardList,
    },
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
    {
      name: "Rate Card",
      path: "/rate-card",
      icon: HiOutlineCreditCard,
    },
    {
      name: "Tickets",
      path: "/tickets",
      icon: HiOutlineTicket,
    },
  ];

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isDesktopCollapsed = collapsed && !mobileOpen;

    return (
      <NavLink
        key={item.path}
        to={item.path}
        title={isDesktopCollapsed ? item.name : ""}
        className={({ isActive }) =>
          `group relative flex items-center rounded-xl transition-all duration-150 ${
            isDesktopCollapsed
              ? "h-11 justify-center px-0"
              : "h-11 px-3.5 gap-3"
          } ${
            isActive
              ? "bg-[#008dd2]/10 text-[#008dd2] font-semibold"
              : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 font-medium"
          }`
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-[#008dd2]" />
            )}

            <Icon
              size={20}
              className={`shrink-0 transition-colors ${
                isActive
                  ? "text-[#008dd2]"
                  : "text-slate-400 group-hover:text-slate-700"
              }`}
            />

            {!isDesktopCollapsed && (
              <span className="truncate text-[13px] tracking-tight">
                {item.name}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-800">
      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 active:scale-95"
            aria-label="Open sidebar"
          >
            <HiMenuAlt2 size={20} />
          </button>

          <span className="text-lg font-black tracking-tight text-[#008dd2]">
            ShipDrop
          </span>
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#008dd2]/10 text-xs font-bold text-[#008dd2]">
          A
        </div>
      </header>

      {/* MOBILE BACKDROP */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white shadow-xl transition-all duration-300 ease-in-out lg:shadow-[2px_0_12px_rgba(15,23,42,0.03)] ${
          mobileOpen
            ? "translate-x-0 w-[260px]"
            : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "lg:w-[76px]" : "lg:w-[250px]"}`}
      >
        {/* LOGO AREA */}
        <div
          className={`flex h-16 shrink-0 items-center border-b border-slate-100 px-4 ${
            collapsed && !mobileOpen
              ? "justify-center"
              : "justify-between"
          }`}
        >
          {(!collapsed || mobileOpen) && (
            <span className="text-xl font-black tracking-tight text-[#008dd2]">
              ShipDrop
            </span>
          )}

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:flex"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={
              collapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            <HiMenuAlt2 size={20} />
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <HiOutlineX size={20} />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3 [scrollbar-width:thin]">
          {menuItems.map((item) => renderNavItem(item))}

          {/* USERS DROPDOWN */}
          <div>
            <button
              type="button"
              onClick={() => {
                if (collapsed && !mobileOpen) {
                  setCollapsed(false);
                  setUsersOpen(true);
                  return;
                }

                setUsersOpen((previous) => !previous);
              }}
              className={`group relative flex h-11 w-full items-center rounded-xl transition-all duration-150 ${
                collapsed && !mobileOpen
                  ? "justify-center px-0"
                  : "gap-3 px-3.5"
              } ${
                isUsersActive
                  ? "bg-[#008dd2]/10 text-[#008dd2] font-semibold"
                  : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 font-medium"
              }`}
              title={collapsed && !mobileOpen ? "Users" : ""}
              aria-expanded={usersOpen}
            >
              {isUsersActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-[#008dd2]" />
              )}

              <HiOutlineUsers
                size={20}
                className={`shrink-0 transition-colors ${
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

        {/* LOGOUT */}
        <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 p-3">
          <button
            type="button"
            onClick={logout}
            className={`flex h-10 w-full items-center rounded-xl text-rose-600 transition-colors hover:bg-rose-50 ${
              collapsed && !mobileOpen
                ? "justify-center px-0"
                : "gap-2.5 px-3.5 text-xs font-bold"
            }`}
            title="Logout"
          >
            <HiOutlineLogout size={19} className="shrink-0" />

            {(!collapsed || !mobileOpen) && (
              <span>Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT + TRACKING TOPBAR */}
      <main
        className={`min-h-[calc(100vh-56px)] transition-all duration-300 lg:min-h-screen ${
          collapsed ? "lg:ml-[76px]" : "lg:ml-[250px]"
        }`}
      >
        {/* TRACKING BAR - visible on every page */}
        <div className="sticky top-14 z-30 flex min-h-[64px] items-center border-b border-slate-200 bg-white px-4 sm:px-6 lg:top-0">
          <form
            onSubmit={trackShipment}
            className="flex w-full max-w-[520px] items-center gap-2"
          >
            <div className="relative min-w-0 flex-1">
              <HiOutlineSearch
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="Enter AWB / Tracking ID..."
                aria-label="Enter AWB or tracking ID"
                autoComplete="off"
                className="h-[42px] w-full rounded-xl border border-slate-200 bg-[#fbfcfe] pl-10 pr-3 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
              />
            </div>

            <button
              type="submit"
              disabled={trackingLoading}
              className="inline-flex h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[#008dd2] px-4 text-sm font-semibold text-white transition hover:bg-[#007fbd] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {trackingLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <HiOutlineSearch size={17} />
              )}

              <span className="hidden sm:inline">
                {trackingLoading ? "Tracking..." : "Track"}
              </span>
            </button>

            {(trackingData || trackingError) && (
              <button
                type="button"
                onClick={clearTracking}
                className="h-[42px] rounded-xl px-2 text-sm text-slate-500 hover:bg-slate-100"
                aria-label="Clear tracking result"
                title="Clear tracking result"
              >
                <HiOutlineX size={18} />
              </button>
            )}
          </form>
        </div>

        {/* TRACKING RESULT */}
        {(trackingLoading || trackingError || trackingData) && (
          <section className="mx-4 mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:mx-6 sm:p-5">
            {trackingLoading && (
              <div
                className="flex items-center gap-3 text-sm text-slate-600"
                role="status"
              >
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#008dd2]" />
                Fetching live shipment tracking...
              </div>
            )}

            {trackingError && (
              <div
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {trackingError}
              </div>
            )}

            {trackingData && !trackingLoading && (
              <>
                {/* SUMMARY */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      AWB Number
                    </p>

                    <p className="mt-1 text-base font-bold text-slate-900">
                      {trackingData.awb || trackingId.trim()}
                    </p>
                  </div>

                  <div className="min-w-[160px]">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Current Status
                    </p>

                    <span className="mt-1 inline-flex rounded-full bg-[#008dd2]/10 px-3 py-1 text-sm font-semibold text-[#007fbd]">
                      {trackingData.status ||
                        trackingData.raw_status ||
                        "Status unavailable"}
                    </span>
                  </div>
                </div>

                {/* SHIPMENT DETAILS */}
                <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <HiOutlineLocationMarker
                      className="mt-0.5 shrink-0 text-slate-400"
                      size={18}
                    />

                    <div>
                      <p className="text-xs text-slate-500">
                        Current Location
                      </p>

                      <p className="mt-0.5 font-medium text-slate-800">
                        {trackingData.location || "Not available"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <HiOutlineClock
                      className="mt-0.5 shrink-0 text-slate-400"
                      size={18}
                    />

                    <div>
                      <p className="text-xs text-slate-500">
                        Last Update
                      </p>

                      <p className="mt-0.5 font-medium text-slate-800">
                        {trackingData.status_datetime || "Not available"}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm">
                    <p className="text-xs text-slate-500">
                      Expected Delivery
                    </p>

                    <p className="mt-0.5 font-medium text-slate-800">
                      {trackingData.expected_delivery || "Not available"}
                    </p>
                  </div>

                  {trackingData.pickup_date && (
                    <div className="text-sm">
                      <p className="text-xs text-slate-500">
                        Pickup Date
                      </p>

                      <p className="mt-0.5 font-medium text-slate-800">
                        {trackingData.pickup_date}
                      </p>
                    </div>
                  )}

                  {trackingData.delivery_date && (
                    <div className="text-sm">
                      <p className="text-xs text-slate-500">
                        Delivery Date
                      </p>

                      <p className="mt-0.5 font-medium text-slate-800">
                        {trackingData.delivery_date}
                      </p>
                    </div>
                  )}
                </div>

                {/* INSTRUCTIONS */}
                {trackingData.instructions && (
                  <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    {trackingData.instructions}
                  </p>
                )}

                {/* TRACKING HISTORY */}
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      Tracking History
                    </h3>

                    <span className="text-xs text-slate-500">
                      {Array.isArray(trackingData.scans)
                        ? trackingData.scans.length
                        : 0}{" "}
                      updates
                    </span>
                  </div>

                  {Array.isArray(trackingData.scans) &&
                  trackingData.scans.length > 0 ? (
                    <div className="space-y-0">
                      {trackingData.scans.map((scan, index) => {
                        const status = getScanStatus(scan);
                        const scanLocation = getScanLocation(scan);
                        const scanDate = getScanDate(scan);

                        return (
                          <div
                            key={`${trackingData.awb || trackingId}-${index}`}
                            className="relative border-l-2 border-[#008dd2]/25 pb-4 pl-4 last:pb-0"
                          >
                            <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-[#008dd2]" />

                            <p className="text-sm font-semibold text-slate-800">
                              {status}
                            </p>

                            {(scanLocation || scanDate) && (
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {[scanLocation, scanDate]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      No scan history is available for this shipment.
                    </p>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {/* EXISTING PAGE CONTENT */}
        {children}
      </main>
    </div>
  );
}

export default AdminLayout;
