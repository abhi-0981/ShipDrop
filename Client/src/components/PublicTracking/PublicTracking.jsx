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
// STATUS
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
// COMPONENT
// ======================================================

function PublicTracking() {
  // ======================================================
  // TRACKING STATE
  // ======================================================

  const [awb, setAwb] = useState("");
  const [tracking, setTracking] = useState(null);
  const [trackingLoading, setTrackingLoading] =
    useState(false);
  const [trackingError, setTrackingError] =
    useState("");
  const [showTrackingDetails, setShowTrackingDetails] =
    useState(false);

  // ======================================================
  // SERVICEABILITY STATE
  // ======================================================

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
        response.data.tracking;

      setTracking(trackingData);

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

  // ======================================================
  // MAIN UI
  // ======================================================

  return (
    <>
      <section className="bg-[#f6f8fb] px-4 py-10 md:px-6 md:py-12">
        <div className="mx-auto max-w-7xl">

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* =================================================
                LEFT - TRACK SHIPMENT
            ================================================= */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">

              <div className="mb-7 flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#008dd2]">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                    />
                    <path d="m20 20-4-4" />
                  </svg>
                </div>

                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    Track Shipment
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Track your shipment using the AWB number
                  </p>
                </div>

              </div>

              <form onSubmit={handleTrack}>

                <label className="mb-2 block text-xs font-semibold text-slate-600">
                  AWB Number
                </label>

                {/* 16px FONT = iPhone Safari zoom fix */}
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
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
                />

                {trackingError && (
                  <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-600">
                    {trackingError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={trackingLoading}
                  className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {trackingLoading
                    ? "Tracking..."
                    : "Track Shipment"}
                </button>

              </form>

            </div>

            {/* =================================================
                RIGHT - SERVICEABILITY
            ================================================= */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">

              <div className="mb-7 flex items-start justify-between gap-3">

                <div className="flex items-start gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#008dd2]">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                      <circle
                        cx="12"
                        cy="10"
                        r="2.5"
                      />
                    </svg>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">
                      Pincode Serviceability
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      Check delivery availability for any pincode
                    </p>
                  </div>

                </div>

                <button
                  type="button"
                  onClick={resetServiceability}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-50"
                >
                  Reset
                </button>

              </div>

              <form
                onSubmit={
                  handleServiceability
                }
              >

                <label className="mb-2 block text-xs font-semibold text-slate-600">
                  Pincode
                </label>

                {/* 16px FONT = iPhone Safari zoom fix */}
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
                  placeholder="302012"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
                />

                {serviceabilityError && (
                  <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-600">
                    {serviceabilityError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    serviceabilityLoading
                  }
                  className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {serviceabilityLoading
                    ? "Checking..."
                    : "Check Serviceability"}
                </button>

              </form>

              <div className="mt-6 border-t border-slate-100 pt-6">

                {!serviceability ? (
                  <div className="flex min-h-[150px] flex-col items-center justify-center rounded-xl bg-slate-50 px-5 text-center">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-300 shadow-sm">
                      <svg
                        width="21"
                        height="21"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                        <circle
                          cx="12"
                          cy="10"
                          r="2.5"
                        />
                      </svg>
                    </div>

                    <p className="mt-3 text-xs font-semibold text-slate-600">
                      No pincode checked yet
                    </p>

                    <p className="mt-1 max-w-xs text-[10px] leading-5 text-slate-400">
                      Enter a 6-digit pincode and check its delivery availability.
                    </p>

                  </div>
                ) : (
                  <div
                    className={`rounded-xl border p-5 ${serviceabilityConfig.bg} ${serviceabilityConfig.border}`}
                  >

                    <div className="flex items-start gap-3">

                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${serviceabilityConfig.iconBg} ${serviceabilityConfig.iconColor}`}
                      >
                        {serviceability.status ===
                        "SERVICEABLE" ? (
                          <svg
                            width="19"
                            height="19"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m5 12 4 4L19 6" />
                          </svg>
                        ) : (
                          <svg
                            width="19"
                            height="19"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 3 2.5 20h19L12 3Z" />
                            <path d="M12 9v5" />
                            <path d="M12 17h.01" />
                          </svg>
                        )}
                      </div>

                      <div>
                        <p
                          className={`text-sm font-bold ${serviceabilityConfig.titleColor}`}
                        >
                          {serviceabilityConfig.title}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {serviceabilityConfig.description}
                        </p>
                      </div>

                    </div>

                    <div className="mt-5 rounded-xl bg-white/70 p-4">

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          Pincode
                        </span>

                        <span className="text-sm font-bold text-slate-700">
                          {serviceability.pincode}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-xs text-slate-400">
                          Status
                        </span>

                        <span className="text-xs font-bold uppercase tracking-wide text-slate-700">
                          {serviceability.status?.replace(
                            /_/g,
                            " "
                          )}
                        </span>
                      </div>

                    </div>

                  </div>
                )}

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

              {/* MODAL HEADER */}

              <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-6">

                <div className="flex min-w-0 items-center gap-2">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#008dd2]">

                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle
                        cx="11"
                        cy="11"
                        r="7"
                      />
                      <path d="m20 20-4-4" />
                    </svg>

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

              {/* MODAL BODY */}

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

                        <span className="h-2 w-2 rounded-full bg-emerald-500" />

                        <p className="truncate text-sm font-bold text-emerald-600">
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

                      <div className="absolute bottom-4 left-[7px] top-4 w-px bg-slate-200" />

                      <div className="space-y-3.5">

                        {trackingScans.map(
                          (scan, index) => (
                            <div
                              key={scan.id}
                              className="relative flex gap-3"
                            >

                              <div className="relative z-10 mt-4 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 border-[#008dd2] bg-white">

                                {index === 0 && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#008dd2]" />
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
                          Delhivery has not provided scan history for this shipment.
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