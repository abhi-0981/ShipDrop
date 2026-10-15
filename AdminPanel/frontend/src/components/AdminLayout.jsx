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
} from "react-icons/hi";

const CLIENT_API_BASE_URL =
  import.meta.env.VITE_CLIENT_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://parceldropbackend.vercel.app/api");

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
  const [trackingId, setTrackingId] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);

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

  // Close tracking popup with Escape and prevent background scrolling.
  useEffect(() => {
    if (!trackingModalOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setTrackingModalOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [trackingModalOpen]);

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    navigate("/login");
  };

  const trackShipment = async (event) => {
    event?.preventDefault();

    const awb = trackingId.trim();

    setTrackingModalOpen(true);

    if (!awb) {
      setTrackingError("Please enter an AWB / tracking number.");
      setTrackingData(null);
      return;
    }

    // The existing public tracking endpoint currently accepts numeric AWBs only.
    if (!/^\d+$/.test(awb)) {
      setTrackingError(
        "Please enter a numeric AWB. Order ID lookup is not supported by this tracking endpoint yet."
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
        throw new Error("Tracking service returned an invalid response.");
      }

      if (!response.ok || !data?.success || !data?.tracking) {
        throw new Error(data?.message || "Shipment tracking details not found.");
      }

      setTrackingData(data.tracking);
    } catch (error) {
      console.error("Admin tracking lookup failed:", error);
      setTrackingError(
        error?.message || "Unable to fetch tracking. Please try again."
      );
    } finally {
      setTrackingLoading(false);
    }
  };

  const clearTracking = () => {
    setTrackingId("");
    setTrackingError("");
    setTrackingData(null);
  };

  const isUsersActive = location.pathname.startsWith("/users");

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: HiOutlineViewGrid },
    { name: "All Orders", path: "/orders", icon: HiOutlineClipboardList },
    { name: "COD Remittance", path: "/cod-remittance", icon: HiOutlineCurrencyRupee },
    { name: "Weight Checking", path: "/weight-checking", icon: HiOutlineScale },
    { name: "Rate Card", path: "/rate-card", icon: HiOutlineCreditCard },
    { name: "Tickets", path: "/tickets", icon: HiOutlineTicket },
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
            isDesktopCollapsed ? "h-11 justify-center px-0" : "h-11 px-3.5 gap-3"
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
              <span className="truncate text-[13px] tracking-tight">{item.name}</span>
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
          <span className="text-lg font-black tracking-tight text-[#008dd2]">ShipDrop</span>
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
            collapsed && !mobileOpen ? "justify-center" : "justify-between"
          }`}
        >
          {(!collapsed || mobileOpen) && (
            <span className="text-xl font-black tracking-tight text-[#008dd2]">ShipDrop</span>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:flex"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
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

        {/* NAVIGATION LIST */}
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
                collapsed && !mobileOpen ? "justify-center px-0" : "gap-3 px-3.5"
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
                  <span className="flex-1 text-left text-[13px] tracking-tight">Users</span>
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

        {/* LOGOUT BUTTON */}
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
            {(!collapsed || mobileOpen) && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER + TRACKING BAR ON EVERY ADMIN PAGE */}
      <main
        className={`min-h-[calc(100vh-56px)] transition-all duration-300 lg:min-h-screen ${
          collapsed ? "lg:ml-[76px]" : "lg:ml-[250px]"
        }`}
      >
        <div className="sticky top-14 z-30 flex min-h-[64px] items-center border-b border-slate-200 bg-white px-4 sm:px-6 lg:top-0">
          <form onSubmit={trackShipment} className="flex w-full max-w-[520px] items-center gap-2">
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
              <HiOutlineSearch size={17} />
              <span className="hidden sm:inline">{trackingLoading ? "Tracking..." : "Track"}</span>
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

        {children}
      </main>

      {/* TRACKING DETAILS MODAL */}
      {trackingModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/55 p-3 backdrop-blur-[3px] sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setTrackingModalOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="tracking-modal-title"
            className="flex max-h-[90vh] w-full max-w-[1024px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            {/* MODAL HEADER */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <HiOutlineSearch size={20} />
                </div>
                <div className="min-w-0">
                  <h2 id="tracking-modal-title" className="text-lg font-bold tracking-tight text-slate-800">
                    Tracking Details
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400 sm:text-[13px]">
                    Live shipment status and Delhivery scan history
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTrackingModalOpen(false)}
                className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close tracking details"
              >
                <HiOutlineX size={20} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-6">
              {trackingLoading && (
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
                  <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#008dd2]" />
                  <p className="text-sm font-semibold text-slate-700">Fetching tracking details...</p>
                  <p className="text-xs text-slate-400">Please wait while we contact the tracking service.</p>
                </div>
              )}

              {!trackingLoading && trackingError && (
                <div className="flex min-h-[180px] items-center justify-center">
                  <div className="w-full max-w-lg rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-center">
                    <p className="text-sm font-semibold text-red-700">Unable to load tracking</p>
                    <p className="mt-1 text-sm text-red-600">{trackingError}</p>
                    <button
                      type="button"
                      onClick={trackShipment}
                      className="mt-4 rounded-lg bg-[#008dd2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007fbd]"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {!trackingLoading && trackingData && (
                <>
                  {/* SUMMARY GRID - similar to user-side tracking popup */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="min-h-[68px] border-b border-slate-100 px-4 py-3 lg:border-r">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order ID</p>
                        <p className="mt-1 break-words text-sm font-bold text-slate-800">—</p>
                      </div>
                      <div className="min-h-[68px] border-b border-slate-100 px-4 py-3 lg:border-r">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tracking No</p>
                        <p className="mt-1 break-all text-sm font-bold text-slate-800">{trackingData.awb || trackingId.trim()}</p>
                      </div>
                      <div className="min-h-[68px] border-b border-slate-100 px-4 py-3 lg:border-r">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Courier</p>
                        <p className="mt-1 text-sm font-bold text-slate-800">Delhivery</p>
                      </div>
                      <div className="min-h-[68px] border-b border-slate-100 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Status</p>
                        <p className="mt-1 flex items-center gap-2 text-sm font-bold text-emerald-600">
                          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                          {trackingData.status || trackingData.raw_status || "Status unavailable"}
                        </p>
                      </div>

                      <div className="min-h-[68px] border-b border-slate-100 px-4 py-3 lg:border-r lg:border-b-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status Location</p>
                        <p className="mt-1 break-words text-xs font-medium leading-5 text-slate-600">{trackingData.location || "—"}</p>
                      </div>
                      <div className="min-h-[68px] border-b border-slate-100 px-4 py-3 lg:border-r lg:border-b-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status Date &amp; Time</p>
                        <p className="mt-1 break-words text-xs font-medium leading-5 text-slate-600">{trackingData.status_datetime || "—"}</p>
                      </div>
                      <div className="min-h-[68px] border-b border-slate-100 px-4 py-3 lg:border-r lg:border-b-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expected Delivery</p>
                        <p className="mt-1 text-xs font-medium leading-5 text-slate-600">{trackingData.expected_delivery || "—"}</p>
                      </div>
                      <div className="min-h-[68px] px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Update</p>
                        <p className="mt-1 break-words text-xs font-medium leading-5 text-slate-600">{trackingData.instructions || trackingData.status || "—"}</p>
                      </div>
                    </div>
                  </div>

                  {/* SHIPMENT TIMELINE */}
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-slate-800">Shipment Timeline</h3>
                        <p className="mt-0.5 text-xs text-slate-400 sm:text-[13px]">Complete tracking history from Delhivery</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
                        {Array.isArray(trackingData.scans) ? trackingData.scans.length : 0} events
                      </span>
                    </div>

                    {Array.isArray(trackingData.scans) && trackingData.scans.length > 0 ? (
                      <div className="ml-2">
                        {trackingData.scans.map((scan, index) => {
                          const status = getScanStatus(scan);
                          const scanLocation = getScanLocation(scan);
                          const scanDate = getScanDate(scan);
                          const isLatest = index === 0;

                          return (
                            <div
                              key={`${trackingData.awb || trackingId}-${index}`}
                              className={`relative ml-0 border-l-2 pb-4 pl-5 last:border-l-transparent last:pb-0 sm:pl-7 ${isLatest ? "border-sky-200" : "border-slate-200"}`}
                            >
                              <span className={`absolute -left-[7px] top-4 h-3 w-3 rounded-full border-2 border-white ring-1 ${isLatest ? "bg-[#008dd2] ring-[#008dd2]" : "bg-white ring-sky-500"}`} />
                              <div className={`rounded-xl border px-4 py-3 ${isLatest ? "border-sky-200 bg-sky-50/60 shadow-sm" : "border-slate-200 bg-white"}`}>
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <p className="text-sm font-bold text-slate-800">{status}</p>
                                  {scanDate && <p className="text-[10px] font-semibold text-slate-400 sm:text-[11px]">{scanDate}</p>}
                                </div>
                                {scanLocation && <p className="mt-1.5 text-xs text-slate-500">{scanLocation}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500">No scan history is available for this shipment.</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="flex shrink-0 justify-end border-t border-slate-100 bg-white px-5 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => setTrackingModalOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminLayout;
