import { useState } from "react";
import axios from "axios";
import api from "../../services/api";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://parceldropbackend.vercel.app/api";

// ======================================================
// DATE HELPERS
// ======================================================

const formatTrackingDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

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

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ======================================================
// STATUS HELPERS
// ======================================================

const humanizeTrackingStatus = (value) => {
  const text = String(value || "").trim();

  if (!text) return "Tracking unavailable";

  return text
    .toLowerCase()
    .split(" ")
    .map((word) =>
      word
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word
    )
    .join(" ");
};

const getStatusStyle = (status) => {
  const normalized = String(status || "")
    .trim()
    .toUpperCase();

  if (normalized === "DELIVERED") {
    return {
      dot: "bg-emerald-500",
      text: "text-emerald-600",
    };
  }

  if (
    normalized === "RTO IN TRANSIT" ||
    normalized === "RTO DELIVERED"
  ) {
    return {
      dot: "bg-orange-500",
      text: "text-orange-600",
    };
  }

  if (normalized === "CANCELLED") {
    return {
      dot: "bg-rose-500",
      text: "text-rose-600",
    };
  }

  if (normalized === "OUT FOR DELIVERY") {
    return {
      dot: "bg-violet-500",
      text: "text-violet-600",
    };
  }

  return {
    dot: "bg-emerald-500",
    text: "text-emerald-600",
  };
};

// ======================================================
// SCANS
// ======================================================

const getTrackingScans = (tracking) => {
  const scans = Array.isArray(tracking?.scans)
    ? tracking.scans
    : [];

  return scans
    .map((scan, index) => {
      const detail =
        scan?.ScanDetail ||
        scan?.scanDetail ||
        scan?.scan_detail ||
        scan ||
        {};

      return {
        id: `${index}-${
          detail?.ScanDateTime ||
          detail?.scan_date_time ||
          detail?.StatusDateTime ||
          detail?.status_date_time ||
          index
        }`,

        status:
          detail?.Instructions ||
          detail?.ScanType ||
          detail?.ScanGroup ||
          detail?.Status ||
          detail?.scan_type ||
          "Shipment update",

        location:
          detail?.ScannedLocation ||
          detail?.scanned_location ||
          detail?.ScanLocation ||
          detail?.scan_location ||
          detail?.StatusLocation ||
          detail?.status_location ||
          detail?.Location ||
          detail?.location ||
          "",

        dateTime:
          detail?.ScanDateTime ||
          detail?.scan_date_time ||
          detail?.StatusDateTime ||
          detail?.status_date_time ||
          detail?.DateTime ||
          detail?.date_time ||
          null,

        instructions:
          detail?.Instructions ||
          detail?.instructions ||
          "",
      };
    })
    .sort((a, b) => {
      const aTime = new Date(
        a.dateTime || 0
      ).getTime();

      const bTime = new Date(
        b.dateTime || 0
      ).getTime();

      return bTime - aTime;
    });
};

// ======================================================
// ICONS
// ======================================================

const SearchIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </svg>
);

const PackageIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m21 8-9-5-9 5 9 5 9-5Z" />
    <path d="M3 8v8l9 5 9-5V8" />
    <path d="M12 13v8" />
  </svg>
);

const LocationIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

const CheckIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m5 12 4 4L19 6" />
  </svg>
);

const TruckIcon = ({ size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 7.5C4 6.67 4.67 6 5.5 6H38C38.83 6 39.5 6.67 39.5 7.5V28H4V7.5Z"
      fill="currentColor"
    />
    <path
      d="M39.5 13H48.2C49.1 13 49.95 13.4 50.55 14.08L58.1 22.55C58.68 23.2 59 24.04 59 24.91V28H39.5V13Z"
      fill="currentColor"
    />
    <path
      d="M43 16.5H48.1C48.48 16.5 48.84 16.67 49.1 16.96L54.45 22.75H43V16.5Z"
      fill="white"
      opacity="0.9"
    />
    <rect x="8" y="10" width="12" height="6" rx="1.5" fill="white" opacity="0.28" />
    <path d="M25 10H35.5V16H25V10Z" fill="white" opacity="0.18" />
    <circle cx="16" cy="31" r="5.5" fill="#0f172a" />
    <circle cx="48" cy="31" r="5.5" fill="#0f172a" />
    <circle cx="16" cy="31" r="2.1" fill="white" />
    <circle cx="48" cy="31" r="2.1" fill="white" />
    <path d="M4 27.5H59" stroke="#0f172a" strokeWidth="1.5" opacity="0.18" />
  </svg>
);

const AlertIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3 2.5 20h19L12 3Z" />
    <path d="M12 9v5" />
    <path d="M12 17h.01" />
  </svg>
);

// ======================================================
// COMPONENT
// ======================================================

function PublicTracking() {
  const [awb, setAwb] = useState("");
  const [tracking, setTracking] = useState(null);
  const [trackingLoading, setTrackingLoading] =
    useState(false);
  const [trackingError, setTrackingError] =
    useState("");
  const [showTrackingDetails, setShowTrackingDetails] =
    useState(false);

  const [pincode, setPincode] = useState("");
  const [serviceability, setServiceability] =
    useState(null);
  const [serviceabilityLoading, setServiceabilityLoading] =
    useState(false);
  const [serviceabilityError, setServiceabilityError] =
    useState("");

  // ======================================================
  // TRACK SHIPMENT
  // ======================================================

  const handleTrack = async (event) => {
    event.preventDefault();

    const normalizedAwb = awb.trim();

    setTracking(null);
    setTrackingError("");

    if (!normalizedAwb) {
      setTrackingError(
        "Please enter your AWB number."
      );
      return;
    }

    if (!/^\d+$/.test(normalizedAwb)) {
      setTrackingError(
        "Please enter a valid AWB number."
      );
      return;
    }

    try {
      setTrackingLoading(true);

      const response = await axios.get(
        `${API_BASE_URL}/public/tracking/${normalizedAwb}`
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to fetch shipment tracking."
        );
      }

      const trackingData =
        response.data?.tracking;

      setTracking(trackingData);

      // Automatically clear input
      setAwb("");

      setShowTrackingDetails(true);
    } catch (error) {
      setTrackingError(
        error?.response?.data?.message ||
          error?.message ||
          "Shipment not found."
      );
    } finally {
      setTrackingLoading(false);
    }
  };

  // ======================================================
  // CLOSE TRACKING MODAL
  // ======================================================

  const closeTrackingDetails = () => {
    setShowTrackingDetails(false);
  };

  // ======================================================
  // SERVICEABILITY
  // ======================================================

  const handleServiceability = async (event) => {
    event.preventDefault();

    const normalizedPincode =
      pincode.trim();

    setServiceability(null);
    setServiceabilityError("");

    if (!/^\d{6}$/.test(normalizedPincode)) {
      setServiceabilityError(
        "Enter a valid 6-digit pincode."
      );
      return;
    }

    try {
      setServiceabilityLoading(true);

      const response = await api.get(
        `/serviceability/pincode/${normalizedPincode}`
      );

      const data = response?.data;

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Unable to check pincode serviceability."
        );
      }

      setServiceability(data);

      // Automatically clear input
      setPincode("");
    } catch (error) {
      setServiceabilityError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to check pincode serviceability."
      );
    } finally {
      setServiceabilityLoading(false);
    }
  };

  // ======================================================
  // RESET SERVICEABILITY
  // ======================================================

  const resetServiceability = () => {
    setPincode("");
    setServiceability(null);
    setServiceabilityError("");
  };

  // ======================================================
  // SERVICEABILITY CONFIG
  // ======================================================

  const getServiceabilityConfig = () => {
    if (!serviceability) return null;

    if (
      serviceability.status ===
      "SERVICEABLE"
    ) {
      return {
        title: "Serviceable",
        description:
          "Delivery is available at this pincode.",
        bg: "bg-emerald-50",
        border: "border-emerald-100",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
        titleColor: "text-emerald-700",
      };
    }

    if (
      serviceability.status ===
      "EMBARGO"
    ) {
      return {
        title: "Temporarily Unavailable",
        description:
          "This pincode is currently under embargo.",
        bg: "bg-amber-50",
        border: "border-amber-100",
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
        titleColor: "text-amber-700",
      };
    }

    return {
      title: "Not Serviceable",
      description:
        "Delivery is not available at this pincode.",
      bg: "bg-rose-50",
      border: "border-rose-100",
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
      titleColor: "text-rose-700",
    };
  };

  const serviceabilityConfig =
    getServiceabilityConfig();

  const trackingScans =
    getTrackingScans(tracking);

  const statusStyle =
    getStatusStyle(tracking?.status);

  // ======================================================
  // MAIN UI
  // ======================================================

  return (
    <>
      <style>
        {`
          @keyframes parcelDropTruckMove {
            0%, 100% {
              transform: translateX(0);
            }
            50% {
              transform: translateX(5px);
            }
          }

          @keyframes parcelDropTruckGlow {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(0, 141, 210, 0);
            }
            50% {
              box-shadow: 0 0 0 6px rgba(0, 141, 210, 0.08);
            }
          }

          .parcel-drop-truck {
            animation: parcelDropTruckMove 1.4s ease-in-out infinite;
          }

          .parcel-drop-truck-marker {
            animation: parcelDropTruckGlow 1.8s ease-in-out infinite;
          }

          @media (prefers-reduced-motion: reduce) {
            .parcel-drop-truck,
            .parcel-drop-truck-marker {
              animation: none;
            }
          }
        `}
      </style>

     <section className="min-h-[calc(100vh-78px)] bg-gradient-to-b from-white via-slate-50/70 to-[#f6f8fb] px-4 py-6 md:px-6 md:py-7 lg:h-[calc(100vh-78px)] lg:overflow-hidden">
        <div className="mx-auto flex h-full max-w-6xl flex-col justify-center">

          {/* SECTION INTRO */}

          <div className="mb-5 shrink-0 text-center">

            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Shipment Tracking & Serviceability
            </h2>

            <p className="mx-auto mt-1.5 max-w-xl text-sm leading-5 text-slate-500">
              Track your shipment in real time or check
              whether ParcelDrop delivery is available at
              your pincode.
            </p>

          </div>

          {/* TWO CARDS */}

          <div className="grid shrink-0 grid-cols-1 gap-5 lg:grid-cols-2">

            {/* =================================================
                TRACK SHIPMENT
            ================================================= */}

            <div className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.09)]">

              <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-sky-50 blur-2xl" />

              <div className="relative p-6 sm:p-7">

                <div className="mb-6 flex items-start gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#008dd2] text-white shadow-[0_8px_20px_rgba(0,141,210,0.22)]">
                    <SearchIcon size={21} />
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#008dd2]">
                      Shipment
                    </p>

                    <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                      Track Shipment
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Enter your AWB number to view the
                      latest shipment status.
                    </p>
                  </div>

                </div>

                <form onSubmit={handleTrack}>

                  <label className="mb-2 block text-xs font-bold text-slate-700">
                    AWB Number
                  </label>

                  <div className="relative">

                    <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <PackageIcon size={18} />
                    </div>

                    <input
                      type="text"
                      inputMode="numeric"
                      value={awb}
                      onChange={(e) => {
                        setAwb(
                          e.target.value.replace(
                            /\D/g,
                            ""
                          )
                        );

                        setTracking(null);
                        setTrackingError("");
                      }}
                      placeholder="Enter AWB number"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-11 pr-4 text-base font-medium text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-[#008dd2] focus:bg-white focus:ring-4 focus:ring-[#008dd2]/10"
                    />

                  </div>

                  {trackingError && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-3 text-xs font-medium text-rose-600">
                      <AlertIcon size={15} />
                      <span>{trackingError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={trackingLoading}
                    className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {trackingLoading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Tracking shipment...
                      </>
                    ) : (
                      <>
                        <SearchIcon size={17} />
                        Track Shipment
                      </>
                    )}
                  </button>

                </form>

                <div className="mt-4 flex items-center gap-2 text-[10px] font-medium text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Live tracking powered by Delhivery
                </div>

              </div>
            </div>

            {/* =================================================
                SERVICEABILITY
            ================================================= */}

            <div className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.09)]">

              <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-sky-50 blur-2xl" />

              <div className="relative p-6 sm:p-7">

                <div className="mb-6 flex items-start justify-between gap-4">

                  <div className="flex items-start gap-4">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-[0_8px_20px_rgba(15,23,42,0.15)]">
                      <LocationIcon size={21} />
                    </div>

                    <div>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                        Coverage
                      </p>

                      <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                        Pincode Serviceability
                      </h2>

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        Check whether delivery is available
                        at your location.
                      </p>
                    </div>

                  </div>

                  {serviceability && (
                    <button
                      type="button"
                      onClick={resetServiceability}
                      className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                    >
                      Reset
                    </button>
                  )}

                </div>

                <form
                  onSubmit={
                    handleServiceability
                  }
                >

                  <label className="mb-2 block text-xs font-bold text-slate-700">
                    Pincode
                  </label>

                  <div className="relative">

                    <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <LocationIcon size={18} />
                    </div>

                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => {
                        setPincode(
                          e.target.value.replace(
                            /\D/g,
                            ""
                          )
                        );

                        setServiceability(null);
                        setServiceabilityError("");
                      }}
                      placeholder="Enter 6-digit pincode"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-11 pr-4 text-base font-medium text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-[#008dd2] focus:bg-white focus:ring-4 focus:ring-[#008dd2]/10"
                    />

                  </div>

                  {serviceabilityError && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-3 text-xs font-medium text-rose-600">
                      <AlertIcon size={15} />
                      <span>
                        {serviceabilityError}
                      </span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      serviceabilityLoading
                    }
                    className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#008dd2] text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,141,210,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#007fbd] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {serviceabilityLoading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Checking pincode...
                      </>
                    ) : (
                      <>
                        <LocationIcon size={17} />
                        Check Serviceability
                      </>
                    )}
                  </button>

                </form>

                {/* SERVICEABILITY RESULT */}

                <div className="mt-4">

                  {!serviceability ? (
                    <div className="flex min-h-[92px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 text-center">

                      <div>
                        <p className="text-xs font-bold text-slate-600">
                          Check delivery availability
                        </p>

                        <p className="mt-1 text-[10px] leading-5 text-slate-400">
                          Enter your pincode above to see
                          the current serviceability status.
                        </p>
                      </div>

                    </div>
                  ) : (
                    <div
                      className={`rounded-2xl border p-4 ${serviceabilityConfig.bg} ${serviceabilityConfig.border}`}
                    >

                      <div className="flex items-center gap-3">

                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${serviceabilityConfig.iconBg} ${serviceabilityConfig.iconColor}`}
                        >
                          {serviceability.status ===
                          "SERVICEABLE" ? (
                            <CheckIcon size={19} />
                          ) : (
                            <AlertIcon size={19} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p
                            className={`text-sm font-extrabold ${serviceabilityConfig.titleColor}`}
                          >
                            {serviceabilityConfig.title}
                          </p>

                          <p className="mt-0.5 text-[10px] leading-5 text-slate-500">
                            {
                              serviceabilityConfig.description
                            }
                          </p>
                        </div>

                      </div>

                      <div className="mt-3 flex items-center justify-between rounded-xl bg-white/70 px-3.5 py-2.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Pincode
                        </span>

                        <span className="text-sm font-extrabold text-slate-700">
                          {serviceability.pincode}
                        </span>
                      </div>

                    </div>
                  )}

                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ====================================================
          OLD STYLE TRACKING DETAILS MODAL
      ==================================================== */}

      {showTrackingDetails &&
        tracking && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-3 py-4 backdrop-blur-[2px]"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeTrackingDetails();
              }
            }}
          >

            <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

              {/* HEADER */}

              <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-6">

                <div className="flex min-w-0 items-center gap-2.5">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#008dd2]">
                    <SearchIcon size={20} />
                  </div>

                  <div className="min-w-0">

                    <h2 className="truncate text-base font-bold text-slate-800 sm:text-lg">
                      Tracking Details
                    </h2>

                    <p className="mt-0.5 truncate text-[10px] text-slate-400 sm:text-xs">
                      Live shipment status and Delhivery scan history
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={
                    closeTrackingDetails
                  }
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  ×
                </button>

              </div>

              {/* BODY */}

              <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">

                {/* TOP DETAILS */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

                    <div className="border-b border-slate-100 px-4 py-3.5 lg:border-r">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Tracking No
                      </p>

                      <p className="mt-1 truncate text-sm font-bold text-slate-800">
                        {tracking.awb ||
                          awb ||
                          "—"}
                      </p>
                    </div>

                    <div className="border-b border-slate-100 px-4 py-3.5 lg:border-r">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Courier
                      </p>

                      <p className="mt-1 truncate text-sm font-bold text-slate-800">
                        Delhivery
                      </p>
                    </div>

                    <div className="border-b border-slate-100 px-4 py-3.5">

                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Current Status
                      </p>

                      <div className="mt-1 flex items-center gap-2">

                        <span
                          className={`h-2 w-2 rounded-full ${
                            statusStyle.dot
                          }`}
                        />

                        <p
                          className={`truncate text-sm font-bold ${statusStyle.text}`}
                        >
                          {humanizeTrackingStatus(
                            tracking.status
                          )}
                        </p>

                      </div>

                    </div>

                  </div>

                  <div className="grid grid-cols-1 border-t border-slate-100 md:grid-cols-2 lg:grid-cols-4">

                    <div className="border-b border-slate-100 px-4 py-3.5 md:border-r lg:border-b-0">

                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Status Location
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-700">
                        {tracking.location ||
                          "—"}
                      </p>

                    </div>

                    <div className="border-b border-slate-100 px-4 py-3.5 lg:border-r lg:border-b-0">

                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Status Date & Time
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-700">
                        {formatTrackingDateTime(
                          tracking.status_datetime
                        )}
                      </p>

                    </div>

                    <div className="border-b border-slate-100 px-4 py-3.5 md:border-r lg:border-b-0">

                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Expected Delivery
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-700">
                        {formatTrackingDate(
                          tracking.expected_delivery
                        )}
                      </p>

                    </div>

                    <div className="px-4 py-3.5">

                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Instructions
                      </p>

                      <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-700">
                        {tracking.instructions ||
                          "—"}
                      </p>

                    </div>

                  </div>

                </div>

                {/* TIMELINE */}

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5">

                  <div className="mb-5 flex items-center justify-between gap-3">

                    <div>

                      <h3 className="text-sm font-bold text-slate-800 sm:text-base">
                        Shipment Timeline
                      </h3>

                      <p className="mt-0.5 text-[10px] text-slate-400 sm:text-xs">
                        Complete tracking history from Delhivery
                      </p>

                    </div>

                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                      {trackingScans.length}{" "}
                      {trackingScans.length === 1
                        ? "event"
                        : "events"}
                    </span>

                  </div>

                  {trackingScans.length > 0 ? (
                    <div className="relative">

                      <div className="absolute bottom-4 left-[15px] top-4 w-px bg-slate-200" />

                      <div className="space-y-3.5">

                        {trackingScans.map(
                          (scan, index) => (
                            <div
                              key={scan.id}
                              className="relative flex gap-3"
                            >

                              <div className="relative z-10 mt-2 flex h-8 w-8 shrink-0 items-center justify-center">
                                {index === 0 ? (
                                  <div
                                    className="parcel-drop-truck-marker flex h-8 w-8 items-center justify-center rounded-full border border-sky-200 bg-white text-[#008dd2] shadow-sm"
                                    title="Latest shipment update"
                                  >
                                    <span className="parcel-drop-truck block">
                                      <TruckIcon size={27} />
                                    </span>
                                  </div>
                                ) : (
                                  <span className="h-3.5 w-3.5 rounded-full border-2 border-[#008dd2] bg-white" />
                                )}
                              </div>

                              <div
                                className={`min-w-0 flex-1 rounded-xl border px-4 py-3 ${
                                  index === 0
                                    ? "border-sky-200 bg-sky-50/40 shadow-sm"
                                    : "border-slate-200 bg-white"
                                }`}
                              >

                                <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start">

                                  <p className="text-sm font-bold text-slate-800">
                                    {scan.status}
                                  </p>

                                  <p className="shrink-0 text-[9px] font-semibold text-slate-400 sm:text-[10px]">
                                    {formatTrackingDateTime(
                                      scan.dateTime
                                    )}
                                  </p>

                                </div>

                                {scan.location && (
                                  <p className="mt-1 text-[10px] font-medium text-slate-500 sm:text-xs">
                                    {scan.location}
                                  </p>
                                )}

                              </div>

                            </div>
                          )
                        )}

                      </div>

                    </div>
                  ) : (
                    <div className="flex min-h-[160px] items-center justify-center rounded-xl bg-slate-50 text-center">

                      <div>

                        <p className="text-sm font-semibold text-slate-600">
                          No tracking events available
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                          Delhivery has not provided scan
                          history for this shipment.
                        </p>

                      </div>

                    </div>
                  )}

                </div>

              </div>

              {/* FOOTER */}

              <div className="flex justify-end border-t border-slate-100 bg-white px-4 py-3.5 sm:px-5">

                <button
                  type="button"
                  onClick={
                    closeTrackingDetails
                  }
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
                >
                  Close
                </button>

              </div>

            </div>

          </div>
        )}
    </>
  );
}

export default PublicTracking;