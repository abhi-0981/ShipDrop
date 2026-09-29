import { useState } from "react";
import axios from "axios";
import api from "../../services/api";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://parceldropbackend.vercel.app/api";

function PublicTracking() {
  // ======================================================
  // TRACKING STATE
  // ======================================================

  const [awb, setAwb] = useState("");
  const [tracking, setTracking] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  // ======================================================
  // SERVICEABILITY STATE
  // ======================================================

  const [pincode, setPincode] = useState("");
  const [serviceability, setServiceability] = useState(null);
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
      setTrackingError("Please enter your AWB number.");
      return;
    }

    if (!/^\d+$/.test(normalizedAwb)) {
      setTrackingError("Please enter a valid AWB number.");
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

      setTracking(response.data.tracking);
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
  // CHECK SERVICEABILITY
  // ======================================================

  const handleServiceability = async (event) => {
    event.preventDefault();

    const normalizedPincode = pincode.trim();

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
  // SERVICEABILITY RESULT
  // ======================================================

  const getServiceabilityConfig = () => {
    if (!serviceability) return null;

    if (serviceability.status === "SERVICEABLE") {
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

    if (serviceability.status === "EMBARGO") {
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

  // ======================================================
  // MAIN
  // ======================================================

  return (
    <section className="bg-[#f6f8fb] px-4 py-10 md:px-6 md:py-12">
      <div className="mx-auto max-w-7xl">

        {/* ==================================================
            TWO MAIN CARDS
        ================================================== */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* =================================================
              LEFT - TRACK SHIPMENT
          ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">

            {/* HEADER */}

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
                  <path d="M3 6h18" />
                  <path d="M3 12h18" />
                  <path d="M3 18h18" />
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

            {/* TRACKING FORM */}

            <form onSubmit={handleTrack}>

              <label className="mb-2 block text-xs font-semibold text-slate-600">
                AWB Number
              </label>

              <input
                type="text"
                inputMode="numeric"
                value={awb}
                onChange={(e) => {
                  setAwb(
                    e.target.value.replace(/\D/g, "")
                  );
                  setTracking(null);
                  setTrackingError("");
                }}
                placeholder="Enter AWB number"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
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

            {/* TRACKING RESULT */}

            {tracking && (
              <div className="mt-6 border-t border-slate-100 pt-6">

                <div className="flex items-center justify-between gap-3">

                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                      AWB Number
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {tracking.awb || awb}
                    </p>
                  </div>

                  <span className="rounded-full bg-sky-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#008dd2]">
                    {tracking.status ||
                      "Status unavailable"}
                  </span>

                </div>

                {/* LOCATION */}

                {tracking.location && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <p className="text-[10px] text-slate-400">
                      Current Location
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-700">
                      {tracking.location}
                    </p>
                  </div>
                )}

                {/* DATES */}

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] text-slate-400">
                      Pickup
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-700">
                      {tracking.pickup_date || "—"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] text-slate-400">
                      Expected
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-700">
                      {tracking.expected_delivery ||
                        "—"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] text-slate-400">
                      Delivered
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-700">
                      {tracking.delivery_date ||
                        "—"}
                    </p>
                  </div>

                </div>

                {/* HISTORY */}

                {Array.isArray(tracking.scans) &&
                  tracking.scans.length > 0 && (
                    <div className="mt-5">

                      <p className="mb-3 text-xs font-bold text-slate-800">
                        Tracking History
                      </p>

                      <div className="max-h-56 space-y-3 overflow-y-auto pr-1">

                        {tracking.scans.map(
                          (scan, index) => (
                            <div
                              key={index}
                              className="flex gap-3"
                            >
                              <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#008dd2]" />

                              <div>
                                <p className="text-xs font-semibold text-slate-700">
                                  {scan.status ||
                                    scan.Status ||
                                    "Shipment Update"}
                                </p>

                                {(scan.location ||
                                  scan.ScannedLocation) && (
                                  <p className="mt-0.5 text-[10px] text-slate-400">
                                    {scan.location ||
                                      scan.ScannedLocation}
                                  </p>
                                )}

                                {(scan.date ||
                                  scan.ScanDateTime ||
                                  scan.StatusDateTime) && (
                                  <p className="mt-0.5 text-[9px] text-slate-400">
                                    {scan.date ||
                                      scan.ScanDateTime ||
                                      scan.StatusDateTime}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        )}

                      </div>

                    </div>
                  )}

              </div>
            )}

          </div>

          {/* =================================================
              RIGHT - SERVICEABILITY
          ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">

            {/* HEADER */}

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

            {/* SERVICEABILITY FORM */}

            <form onSubmit={handleServiceability}>

              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Pincode
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={pincode}
                onChange={(e) => {
                  setPincode(
                    e.target.value.replace(/\D/g, "")
                  );
                  setServiceability(null);
                  setServiceabilityError("");
                }}
                placeholder="302012"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
              />

              {serviceabilityError && (
                <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-600">
                  {serviceabilityError}
                </div>
              )}

              <button
                type="submit"
                disabled={serviceabilityLoading}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {serviceabilityLoading
                  ? "Checking..."
                  : "Check Serviceability"}
              </button>

            </form>

            {/* SERVICEABILITY RESULT */}

            <div className="mt-6 border-t border-slate-100 pt-6">

              {!serviceability ? (
                <div className="flex min-h-[210px] flex-col items-center justify-center rounded-xl bg-slate-50 px-5 text-center">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-300 shadow-sm">
                    <svg
                      width="22"
                      height="22"
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

                  <p className="mt-4 text-sm font-semibold text-slate-600">
                    No pincode checked yet
                  </p>

                  <p className="mt-1 max-w-xs text-[11px] leading-5 text-slate-400">
                    Enter a 6-digit pincode and check its delivery availability.
                  </p>

                </div>
              ) : (
                <div
                  className={`rounded-xl border p-5 ${serviceabilityConfig.bg} ${serviceabilityConfig.border}`}
                >

                  <div className="flex items-start gap-3">

                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${serviceabilityConfig.iconBg} ${serviceabilityConfig.iconColor}`}
                    >
                      {serviceability.status ===
                      "SERVICEABLE" ? (
                        <svg
                          width="20"
                          height="20"
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
                          width="20"
                          height="20"
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
  );
}

export default PublicTracking;