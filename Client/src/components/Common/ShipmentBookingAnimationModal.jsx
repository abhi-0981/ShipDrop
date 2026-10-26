import React, { useEffect, useState } from "react";
import { HiOutlineCheck, HiOutlineExclamation, HiOutlineTruck } from "react-icons/hi";

export default function ShipmentBookingAnimationModal({
  isOpen,
  stage = "booking", // "booking" | "success" | "error"
  orderCount = 1,
  serviceType = "ROAD",
  amount = null,
  errorMessage = "",
  onComplete,
  onClose,
}) {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    "Verifying courier serviceability...",
    "Allocating Delhivery tracking AWB...",
    "Generating shipping manifest & label...",
    "Securing package & wallet settlement...",
  ];

  // Cycle through step messages every 1.1s during booking
  useEffect(() => {
    if (!isOpen || stage !== "booking") return;

    setActiveStep(0);
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 1100);

    return () => clearInterval(interval);
  }, [isOpen, stage]);

  // When stage becomes 'success', wait 950ms then trigger onComplete
  useEffect(() => {
    if (!isOpen || stage !== "success") return;

    const timer = setTimeout(() => {
      if (typeof onComplete === "function") {
        onComplete();
      }
    }, 950);

    return () => clearTimeout(timer);
  }, [isOpen, stage, onComplete]);

  if (!isOpen) return null;

  const isAir = String(serviceType).toUpperCase() === "AIR";

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md animate-in fade-in duration-200">
      {/* Inline styles for custom 60fps animations */}
      <style>{`
        @keyframes sdWheelRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes sdTruckBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3.5px); }
        }
        @keyframes sdRoadDashes {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -56; }
        }
        @keyframes sdSpeedLine {
          0% { transform: translateX(35px); opacity: 0; }
          40% { opacity: 0.85; }
          100% { transform: translateX(-45px); opacity: 0; }
        }
        @keyframes sdSmokePuff {
          0% { transform: translate(0, 0) scale(0.6); opacity: 0.8; }
          100% { transform: translate(-22px, -12px) scale(1.6); opacity: 0; }
        }
        @keyframes sdRadarPulse {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes sdSuccessPop {
          0% { transform: scale(0.7); opacity: 0; }
          65% { transform: scale(1.12); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes sdTruckDriveOff {
          0% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(260px); opacity: 0; }
        }
      `}</style>

      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 flex flex-col items-center text-center overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Soft top gradient accent */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            stage === "success"
              ? "bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500"
              : stage === "error"
              ? "bg-gradient-to-r from-rose-500 via-red-500 to-rose-600"
              : isAir
              ? "bg-gradient-to-r from-purple-500 via-[#7451ff] to-sky-400"
              : "bg-gradient-to-r from-[#008dd2] via-sky-400 to-blue-500"
          }`}
        />

        {/* Small Mode Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200 text-[11px] font-bold text-slate-700 mb-3 shadow-2xs">
          <span
            className={`h-2 w-2 rounded-full ${
              stage === "success"
                ? "bg-emerald-500"
                : stage === "error"
                ? "bg-rose-500"
                : "bg-[#008dd2] animate-pulse"
            }`}
          />
          <span>
            {stage === "success"
              ? "Booking Complete"
              : stage === "error"
              ? "Booking Failed"
              : isAir
              ? "ShipDrop Air Express Booking"
              : "ShipDrop Surface Booking"}
          </span>
        </div>

        {/* ANIMATED SCENE CONTAINER */}
        <div className="relative w-full h-36 flex items-center justify-center my-1 select-none overflow-hidden rounded-2xl bg-gradient-to-b from-sky-50/60 via-slate-50 to-slate-100/80 border border-slate-200/60 shadow-inner">
          {stage === "success" ? (
            /* SUCCESS POPPING CHECKMARK */
            <div
              className="flex flex-col items-center justify-center"
              style={{ animation: "sdSuccessPop 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
            >
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <HiOutlineCheck size={36} strokeWidth={2.6} />
              </div>
              <div className="flex items-center gap-1.5 mt-2.5">
                <HiOutlineTruck size={15} className="text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700">Ready For Pickup</span>
              </div>
            </div>
          ) : stage === "error" ? (
            /* ERROR ICON */
            <div className="flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-rose-50 border-2 border-rose-200 text-rose-500 flex items-center justify-center shadow-xs">
                <HiOutlineExclamation size={36} />
              </div>
              <span className="text-xs font-bold text-rose-600 mt-2">Could Not Confirm</span>
            </div>
          ) : (
            /* ACTIVE TRUCK ANIMATION */
            <div className="relative w-full h-full flex items-center justify-center">
              {/* SPEED WIND LINES */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 340 144"
                fill="none"
              >
                <line
                  x1="220"
                  y1="34"
                  x2="280"
                  y2="34"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{ animation: "sdSpeedLine 0.75s ease-out infinite" }}
                />
                <line
                  x1="240"
                  y1="56"
                  x2="310"
                  y2="56"
                  stroke="#0284c7"
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{ animation: "sdSpeedLine 0.65s ease-out infinite 0.15s" }}
                />
                <line
                  x1="210"
                  y1="76"
                  x2="270"
                  y2="76"
                  stroke="#7dd3fc"
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{ animation: "sdSpeedLine 0.85s ease-out infinite 0.3s" }}
                />
              </svg>

              {/* TRUCK SVG + ROAD */}
              <svg
                viewBox="0 0 340 144"
                className="w-full h-full max-w-[320px]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* HEADLIGHT BEAM GLOW */}
                <polygon
                  points="218,84 330,68 330,108 218,92"
                  fill="url(#headlightGlow)"
                  opacity="0.75"
                />

                {/* ROAD BASE */}
                <rect x="10" y="104" width="320" height="18" rx="9" fill="#1e293b" />
                <rect x="10" y="104" width="320" height="3" fill="#334155" />

                {/* MOVING DASHED ROAD STRIPES */}
                <line
                  x1="18"
                  y1="113"
                  x2="322"
                  y2="113"
                  stroke="#ffffff"
                  strokeWidth="2.8"
                  strokeDasharray="16 12"
                  strokeLinecap="round"
                  style={{ animation: "sdRoadDashes 0.55s linear infinite" }}
                />

                {/* EXHAUST SMOKE PUFFS */}
                <circle
                  cx="90"
                  cy="98"
                  r="4"
                  fill="#94a3b8"
                  style={{ animation: "sdSmokePuff 0.75s ease-out infinite" }}
                />
                <circle
                  cx="86"
                  cy="99"
                  r="3.5"
                  fill="#cbd5e1"
                  style={{ animation: "sdSmokePuff 0.75s ease-out infinite 0.35s" }}
                />

                {/* BOUNCING TRUCK CHASSIS */}
                <g style={{ animation: "sdTruckBounce 0.42s ease-in-out infinite alternate" }}>
                  {/* RADAR PULSE ON ROOF */}
                  <circle
                    cx="195"
                    cy="40"
                    r="8"
                    stroke="#008dd2"
                    strokeWidth="1.5"
                    fill="none"
                    style={{
                      transformOrigin: "195px 40px",
                      animation: "sdRadarPulse 1.2s ease-out infinite",
                    }}
                  />
                  <line x1="195" y1="48" x2="195" y2="42" stroke="#008dd2" strokeWidth="2" strokeLinecap="round" />

                  {/* TRUCK CONTAINER (WHITE / ACCENT) */}
                  <rect
                    x="94"
                    y="46"
                    width="88"
                    height="46"
                    rx="6"
                    fill="#ffffff"
                    stroke="#cbd5e1"
                    strokeWidth="2"
                  />
                  {/* Container Brand Stripes */}
                  <rect x="95" y="47" width="86" height="7" rx="3" fill="#008dd2" />
                  <rect x="95" y="60" width="86" height="3" fill="#e2e8f0" />

                  {/* Brand Tag on Container */}
                  <rect x="106" y="68" width="58" height="15" rx="3" fill="#e0f2fe" />
                  <text
                    x="135"
                    y="79"
                    textAnchor="middle"
                    fill="#0284c7"
                    fontSize="9.5"
                    fontWeight="800"
                    fontFamily="system-ui, sans-serif"
                    letterSpacing="0.4"
                  >
                    ShipDrop
                  </text>

                  {/* Parcel Icon inside container */}
                  <rect x="168" y="70" width="9" height="9" rx="1.5" fill="#f59e0b" />
                  <line x1="168" y1="74.5" x2="177" y2="74.5" stroke="#ffffff" strokeWidth="0.8" />
                  <line x1="172.5" y1="70" x2="172.5" y2="79" stroke="#ffffff" strokeWidth="0.8" />

                  {/* CABIN (BLUE) */}
                  <path
                    d="M 182 54 L 202 54 C 206 54, 215 62, 218 69 L 221 82 C 221 87, 218 92, 212 92 L 182 92 Z"
                    fill="#008dd2"
                  />
                  {/* Cabin Windshield Glass */}
                  <path
                    d="M 188 58 L 200 58 C 203 58, 209 64, 212 70 L 194 70 C 190 70, 188 68, 188 64 Z"
                    fill="#bae6fd"
                  />

                  {/* Front Bumper & Headlight */}
                  <rect x="217" y="84" width="5" height="7" rx="1.5" fill="#facc15" />
                  <rect x="216" y="89" width="6" height="4" rx="1" fill="#475569" />

                  {/* Side Door Line & Handle */}
                  <line x1="192" y1="73" x2="192" y2="90" stroke="#026aa0" strokeWidth="1.2" />
                  <rect x="189" y="77" width="2.5" height="1.5" rx="0.5" fill="#ffffff" />
                </g>

                {/* REAR WHEEL */}
                <g transform="translate(120, 102)">
                  <circle cx="0" cy="0" r="12" fill="#0f172a" />
                  <circle cx="0" cy="0" r="7" fill="#64748b" />
                  <circle cx="0" cy="0" r="3" fill="#ffffff" />
                  {/* Wheel Spokes that rotate */}
                  <g style={{ transformOrigin: "0px 0px", animation: "sdWheelRotate 0.5s linear infinite" }}>
                    <line x1="-6" y1="0" x2="6" y2="0" stroke="#cbd5e1" strokeWidth="1.6" />
                    <line x1="0" y1="-6" x2="0" y2="6" stroke="#cbd5e1" strokeWidth="1.6" />
                  </g>
                </g>

                {/* FRONT WHEEL */}
                <g transform="translate(202, 102)">
                  <circle cx="0" cy="0" r="12" fill="#0f172a" />
                  <circle cx="0" cy="0" r="7" fill="#64748b" />
                  <circle cx="0" cy="0" r="3" fill="#ffffff" />
                  {/* Wheel Spokes that rotate */}
                  <g style={{ transformOrigin: "0px 0px", animation: "sdWheelRotate 0.5s linear infinite" }}>
                    <line x1="-6" y1="0" x2="6" y2="0" stroke="#cbd5e1" strokeWidth="1.6" />
                    <line x1="0" y1="-6" x2="0" y2="6" stroke="#cbd5e1" strokeWidth="1.6" />
                  </g>
                </g>

                {/* GRADIENTS DEF */}
                <defs>
                  <linearGradient id="headlightGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fef08a" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}
        </div>

        {/* STATUS TITLE & SUBTITLE */}
        <div className="mt-3.5 space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {stage === "success"
              ? "Shipment Confirmed & Booked!"
              : stage === "error"
              ? "Unable to Book Shipment"
              : orderCount > 1
              ? `Booking ${orderCount} Bulk Shipments...`
              : "Booking Your Shipment..."}
          </h3>

          <p className="text-xs text-slate-500 font-medium min-h-[20px] transition-all">
            {stage === "success"
              ? `AWB generated successfully for ${orderCount} order${
                  orderCount > 1 ? "s" : ""
                }. Label ready for printing.`
              : stage === "error"
              ? errorMessage || "Something went wrong while confirming with carrier."
              : steps[activeStep]}
          </p>

          {amount && stage !== "error" && (
            <p className="text-[11px] font-semibold text-slate-400">
              Total Charge: <strong className="text-[#008dd2]">₹{Number(amount).toFixed(2)}</strong>
            </p>
          )}
        </div>

        {/* PROGRESS BAR OR ERROR BUTTON */}
        <div className="w-full mt-4">
          {stage === "error" ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition shadow-xs active:scale-95"
            >
              Close & Try Again
            </button>
          ) : (
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  stage === "success"
                    ? "w-full bg-gradient-to-r from-teal-400 to-emerald-500"
                    : "w-4/5 bg-gradient-to-r from-[#008dd2] via-sky-400 to-[#7451ff] animate-pulse"
                }`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
