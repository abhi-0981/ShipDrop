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
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    };
  }

  if (
    normalized === "RTO IN TRANSIT" ||
    normalized === "RTO DELIVERED"
  ) {
    return {
      dot: "bg-orange-500",
      text: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-100",
    };
  }

  if (normalized === "CANCELLED") {
    return {
      dot: "bg-rose-500",
      text: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-100",
    };
  }

  if (normalized === "OUT FOR DELIVERY") {
    return {
      dot: "bg-violet-500",
      text: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-100",
    };
  }

  return {
    dot: "bg-[#008dd2]",
    text: "text-[#008dd2]",
    bg: "bg-sky-50",
    border: "border-sky-100",
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

const ClockIcon = ({ size = 18 }) => (
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
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const CloseIcon = ({ size = 20 }) => (
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
    <path d="M6 6l12 12" />
    <path d="M18 6 6 18" />
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

      // Clear AWB automatically after successful search
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

      // Clear pincode automatically after successful check
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
      <section className="bg-gradient-to-b from-white via-slate-50/70 to-[#f6f8fb] px-4 py-12 md:px-6 md:py-10">
        <div className="mx-auto max-w-6xl">

          {/* SECTION INTRO */}

          <div className="mb-6 text-center">
            

            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Shipment Tracking & Serviceability
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Track your shipment in real time or check
              whether ParcelDrop delivery is available at
              your pincode.
            </p>
          </div>

          {/* TWO CARDS */}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* =================================================
                TRACK SHIPMENT
            ================================================= */}

            <div className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.09)]">

              <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-sky-50 blur-2xl" />

              <div className="relative p-6 sm:p-7">

                <div className="mb-7 flex items-start gap-4">

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
                      className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-11 pr-4 text-base font-medium text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-[#008dd2] focus:bg-white focus:ring-4 focus:ring-[#008dd2]/10"
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
                    className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
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

                <div className="mt-5 flex items-center gap-2 text-[10px] font-medium text-slate-400">
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

                <div className="mb-7 flex items-start justify-between gap-4">

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
                      className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-11 pr-4 text-base font-medium text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-[#008dd2] focus:bg-white focus:ring-4 focus:ring-[#008dd2]/10"
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
                    className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#008dd2] text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,141,210,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#007fbd] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
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

                <div className="mt-5">

                  {!serviceability ? (
                    <div className="flex min-h-[108px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 text-center">

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

                      <div className="mt-4 flex items-center justify-between rounded-xl bg-white/70 px-3.5 py-3">
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
          TRACKING DETAILS MODAL
      ==================================================== */}

      {showTrackingDetails &&
        tracking && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 px-3 py-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeTrackingDetails();
              }
            }}
          >

            <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-slate-50 shadow-[0_25px_80px_rgba(15,23,42,0.35)]">

              {/* MODAL HEADER */}

              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">

                <div className="flex min-w-0 items-center gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#008dd2] text-white shadow-sm">
                    <PackageIcon size={19} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#008dd2]">
                      ParcelDrop Tracking
                    </p>

                    <h2 className="truncate text-base font-extrabold text-slate-900 sm:text-lg">
                      Shipment Details
                    </h2>

                    <p className="truncate text-[10px] text-slate-400 sm:text-xs">
                      Live status and Delhivery scan history
                    </p>
                  </div>

                </div>

                <button
                  type="button"
                  onClick={
                    closeTrackingDetails
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <CloseIcon size={17} />
                </button>

              </div>

              {/* MODAL BODY */}

              <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">

                {/* STATUS HERO */}

                <div
                  className={`rounded-2xl border ${statusStyle.border} ${statusStyle.bg} p-4 sm:p-5`}
                >

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex min-w-0 items-center gap-3">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                        <span
                          className={`h-3 w-3 rounded-full ${statusStyle.dot}`}
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
                          Current Status
                        </p>

                        <p
                          className={`mt-0.5 truncate text-lg font-extrabold ${statusStyle.text}`}
                        >
                          {humanizeTrackingStatus(
                            tracking.status
                          )}
                        </p>
                      </div>

                    </div>

                    <div className="rounded-xl bg-white/80 px-3.5 py-2.5 sm:text-right">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        AWB
                      </p>

                      <p className="mt-0.5 text-sm font-extrabold tracking-wide text-slate-800">
                        {tracking.awb ||
                          awb ||
                          "—"}
                      </p>
                    </div>

                  </div>

                </div>

                {/* DETAILS */}

                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">

                    <div className="border-b border-slate-100 px-4 py-4 lg:border-b-0 lg:border-r">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Courier
                      </p>

                      <p className="mt-1.5 text-sm font-extrabold text-slate-800">
                        Delhivery
                      </p>
                    </div>

                    <div className="border-b border-slate-100 px-4 py-4 lg:border-b-0 lg:border-r">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Location
                      </p>

                      <p className="mt-1.5 text-xs font-semibold leading-5 text-slate-700">
                        {tracking.location ||
                          "—"}
                      </p>
                    </div>

                    <div className="border-b border-slate-100 px-4 py-4 lg:border-b-0 lg:border-r">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Last Updated
                      </p>

                      <p className="mt-1.5 text-xs font-semibold leading-5 text-slate-700">
                        {formatTrackingDateTime(
                          tracking.status_datetime
                        )}
                      </p>
                    </div>

                    <div className="px-4 py-4">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Expected Delivery
                      </p>

                      <p className="mt-1.5 text-xs font-extrabold text-slate-800">
                        {formatTrackingDate(
                          tracking.expected_delivery
                        )}
                      </p>
                    </div>

                  </div>

                  {tracking.instructions && (
                    <div className="border-t border-slate-100 px-4 py-3.5">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 text-[#008dd2]">
                          <ClockIcon size={16} />
                        </div>

                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            Latest Update
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-700">
                            {tracking.instructions}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* TIMELINE */}

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-sm sm:px-5">

                  <div className="mb-5 flex items-center justify-between gap-3">

                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 sm:text-base">
                        Shipment Timeline
                      </h3>

                      <p className="mt-0.5 text-[10px] text-slate-400 sm:text-xs">
                        Complete tracking history from
                        Delhivery
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-[9px] font-bold text-slate-500">
                      {trackingScans.length}{" "}
                      {trackingScans.length === 1
                        ? "event"
                        : "events"}
                    </span>

                  </div>

                  {trackingScans.length > 0 ? (
                    <div className="relative">

                      <div className="absolute bottom-5 left-[7px] top-5 w-px bg-slate-200" />

                      <div className="space-y-3">

                        {trackingScans.map(
                          (scan, index) => (
                            <div
                              key={scan.id}
                              className="relative flex gap-3"
                            >

                              <div
                                className={`relative z-10 mt-4 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 ${
                                  index === 0
                                    ? "border-[#008dd2] bg-[#008dd2]"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {index === 0 && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                )}
                              </div>

                              <div
                                className={`min-w-0 flex-1 rounded-xl border px-4 py-3.5 ${
                                  index === 0
                                    ? "border-sky-200 bg-sky-50/50"
                                    : "border-slate-200 bg-white"
                                }`}
                              >

                                <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start">

                                  <p className="text-xs font-extrabold text-slate-800 sm:text-sm">
                                    {scan.status}
                                  </p>

                                  <p className="shrink-0 text-[9px] font-semibold text-slate-400 sm:text-[10px]">
                                    {formatTrackingDateTime(
                                      scan.dateTime
                                    )}
                                  </p>

                                </div>

                                {scan.location && (
                                  <div className="mt-2 flex items-center gap-1.5">
                                    <span className="text-slate-400">
                                      <LocationIcon size={12} />
                                    </span>

                                    <p className="text-[10px] font-medium leading-4 text-slate-500 sm:text-xs">
                                      {scan.location}
                                    </p>
                                  </div>
                                )}

                              </div>

                            </div>
                          )
                        )}

                      </div>

                    </div>
                  ) : (
                    <div className="flex min-h-[150px] items-center justify-center rounded-xl bg-slate-50 text-center">
                      <div>
                        <p className="text-sm font-bold text-slate-600">
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

              <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3.5 sm:px-5">

                <p className="hidden text-[10px] text-slate-400 sm:block">
                  Tracking information is provided by
                  Delhivery.
                </p>

                <button
                  type="button"
                  onClick={
                    closeTrackingDetails
                  }
                  className="ml-auto rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
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