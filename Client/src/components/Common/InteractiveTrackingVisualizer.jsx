import React, { useState, useMemo } from "react";
import toast from "react-hot-toast";
import {
  HiOutlineClipboardCopy,
  HiOutlineShare,
  HiOutlineClock,
  HiOutlineLocationMarker,
  HiOutlineCheckCircle,
  HiOutlineTruck,
  HiCheck,
  HiOutlineExclamationCircle,
} from "react-icons/hi";

// ======================================================
// HELPER FUNCTIONS
// ======================================================

const calculateStageProgress = (status, scans = []) => {
  const norm = String(status || "").trim().toUpperCase();

  if (norm.includes("DELIVERED") && !norm.includes("RTO")) {
    return { percent: 100, stage: 4, label: "Delivered", color: "emerald" };
  }
  if (norm.includes("OUT FOR DELIVERY") || norm.includes("OFD")) {
    return { percent: 80, stage: 3, label: "Out For Delivery", color: "sky" };
  }
  if (norm.includes("RTO")) {
    return { percent: 50, stage: 2, label: "RTO Returning", color: "rose", isRTO: true };
  }
  if (norm.includes("PENDING") || norm.includes("UNDELIVERED") || norm.includes("FAILED")) {
    return { percent: 75, stage: 3, label: "Delivery Delayed / NDR", color: "amber", isDelayed: true };
  }
  if (norm.includes("IN TRANSIT") || norm.includes("TRANSIT") || norm.includes("REACHED") || norm.includes("DISPATCHED")) {
    // If scans show multiple hops, increase progress
    const hopProgress = Math.min(65, 35 + (scans.length * 5));
    return { percent: hopProgress, stage: 2, label: "In Transit", color: "blue" };
  }
  if (norm.includes("PICKED") || norm.includes("MANIFEST") || norm.includes("READY")) {
    return { percent: 20, stage: 1, label: "Picked Up", color: "indigo" };
  }

  return { percent: 25, stage: 1, label: "Processing", color: "slate" };
};

export default function InteractiveTrackingVisualizer({
  order,
  scans = [],
  onClose,
}) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("milestones"); // "milestones" | "raw_scans"

  const awb = order?.tracking_awb || order?.awb || order?.waybill || "—";
  const orderId = order?.order_id ?? order?.id ?? "—";
  const customerName = order?.consignee_name || order?.customer_name || "Customer";
  const courierName = order?.carrier || order?.courier || "Delhivery Express";
  const isAir = String(order?.service_type || order?.manifest_service_type || "").toUpperCase().includes("AIR");

  const originCity = useMemo(() => {
    // Try to get from first scan or fallback
    if (scans && scans.length > 0) {
      const earliest = scans[scans.length - 1];
      if (earliest?.location) return earliest.location.split(",")[0].trim();
    }
    return order?.pickup_city || order?.sender_city || "Origin Hub";
  }, [scans, order]);

  const destinationCity = useMemo(() => {
    return order?.consignee_city || order?.city || order?.destination_city || "Destination";
  }, [order]);

  const currentHub = useMemo(() => {
    return order?.tracking_location || (scans.length > 0 ? scans[0]?.location : null) || "In Transit Hub";
  }, [order, scans]);

  const statusInfo = useMemo(() => {
    return calculateStageProgress(order?.tracking_status || order?.status, scans);
  }, [order, scans]);

  const expectedDate = useMemo(() => {
    if (order?.tracking_expected_delivery) return order.tracking_expected_delivery;
    if (order?.expected_delivery) return order.expected_delivery;
    return null;
  }, [order]);

  const handleCopyAWB = () => {
    if (!awb || awb === "—") return;
    navigator.clipboard.writeText(awb);
    setCopied(true);
    toast.success("AWB copied to clipboard", { id: "awb-copy", duration: 1500 });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const statusText = order?.tracking_status || "In Transit";
    const trackingLink = `${window.location.origin}/?awb=${awb}`;
    const message = `Hello ${customerName}, your shipment with AWB *${awb}* is currently *${statusText}* via ${courierName}. You can track the live delivery route here: ${trackingLink}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // Milestone Definitions
  const milestones = [
    {
      id: 1,
      name: "Order Picked Up",
      hub: originCity,
      subtitle: "Package dispatched from merchant warehouse",
      isDone: statusInfo.stage >= 1,
      isCurrent: statusInfo.stage === 1,
      icon: "box",
    },
    {
      id: 2,
      name: "In Transit / Hub Transfer",
      hub: currentHub,
      subtitle: isAir ? "Air cargo transit between sorting centers" : "Surface line-haul transit through transit hubs",
      isDone: statusInfo.stage >= 2,
      isCurrent: statusInfo.stage === 2,
      icon: isAir ? "plane" : "truck",
    },
    {
      id: 3,
      name: "Out For Delivery",
      hub: `${destinationCity} Local Hub`,
      subtitle: "Courier delivery associate out for doorstep delivery",
      isDone: statusInfo.stage >= 3,
      isCurrent: statusInfo.stage === 3,
      icon: "van",
    },
    {
      id: 4,
      name: "Delivered",
      hub: `${destinationCity} Doorstep`,
      subtitle: "Successfully received by customer",
      isDone: statusInfo.stage >= 4,
      isCurrent: statusInfo.stage === 4,
      icon: "home",
    },
  ];

  return (
    <div className="w-full space-y-4">
      {/* =========================================================
          HERO STATUS CARD WITH 3D GLASS STYLING
      ========================================================= */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-sky-950 p-5 text-white shadow-xl border border-slate-700/60">
        {/* BACKGROUND GLOW DECORATIONS */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

        {/* TOP ROW: AWB, COURIER & QUICK ACTIONS */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 items-center gap-1.5 rounded-lg bg-sky-500/15 border border-sky-400/30 px-2.5 text-xs font-bold text-sky-300">
              {isAir ? "✈️ AIR EXPRESS" : "🚚 SURFACE EXPRESS"}
            </span>

            <span className="text-xs font-semibold text-slate-400">
              Courier: <strong className="text-white">{courierName}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* COPY AWB */}
            <button
              type="button"
              onClick={handleCopyAWB}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800/90 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white active:scale-95 cursor-pointer"
              title="Copy AWB Number"
            >
              {copied ? <HiCheck className="text-emerald-400" size={15} /> : <HiOutlineClipboardCopy size={15} />}
              <span>{awb}</span>
            </button>

            {/* SHARE WHATSAPP */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition active:scale-95 shadow-sm shadow-emerald-900/40 cursor-pointer"
              title="Share live tracking with customer on WhatsApp"
            >
              <HiOutlineShare size={15} />
              <span className="hidden sm:inline">Share on WhatsApp</span>
            </button>
          </div>
        </div>

        {/* MIDDLE ROW: ROUTE ORIGIN -> DESTINATION & STATUS */}
        <div className="relative z-10 mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          {/* ORIGIN */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Shipped From
            </p>
            <p className="mt-0.5 text-base sm:text-lg font-black text-white truncate">
              {originCity}
            </p>
            <p className="text-[11px] text-slate-400">Pickup Facility</p>
          </div>

          {/* STATUS CENTER BADGE */}
          <div className="text-center sm:border-x sm:border-slate-800/80 px-2 py-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/90 border border-slate-700/80 px-3.5 py-1 shadow-inner">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs sm:text-[13px] font-black uppercase tracking-wide text-white">
                {statusInfo.label}
              </span>
            </div>

            {expectedDate && (
              <p className="mt-2 text-[11px] text-sky-300 font-medium flex items-center justify-center gap-1">
                <HiOutlineClock size={13} />
                <span>Est. Delivery: {new Date(expectedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
              </p>
            )}
          </div>

          {/* DESTINATION */}
          <div className="sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Delivery Destination
            </p>
            <p className="mt-0.5 text-base sm:text-lg font-black text-white truncate">
              {destinationCity}
            </p>
            <p className="text-[11px] text-slate-400">Consignee: {customerName}</p>
          </div>
        </div>

        {/* =========================================================
            3D ANIMATED HIGHWAY & MOVING VEHICLE TRACK
        ========================================================= */}
        <div className="relative z-10 mt-6 pt-2 pb-4">
          {/* THE ROAD / ROUTE TRACK */}
          <div className="relative mx-3 sm:mx-6 h-4 rounded-full bg-slate-950/80 border border-slate-700/70 shadow-inner overflow-visible">
            {/* FILLED ROUTE GRADIENT */}
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-sky-500 via-[#008dd2] to-emerald-400 transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(56,189,248,0.5)]"
              style={{ width: `${Math.max(8, statusInfo.percent)}%` }}
            />

            {/* ANIMATED DASHED CENTERLINE (Simulating Highway Movement) */}
            <div className="absolute inset-0 flex items-center justify-between px-2 overflow-hidden pointer-events-none">
              <div className="w-full border-t border-dashed border-white/30 animate-[moveRoad_1.2s_linear_infinite]" />
            </div>

            {/* MILESTONE NODES ALONG THE ROAD */}
            <div className="absolute inset-0 flex items-center justify-between px-0 -top-[5px]">
              {[0, 33, 66, 100].map((nodePos, idx) => {
                const nodeDone = statusInfo.percent >= nodePos;
                const nodeCurrent = Math.abs(statusInfo.percent - nodePos) < 18;
                return (
                  <div
                    key={idx}
                    className="relative flex flex-col items-center"
                    style={{ left: idx === 0 ? "0%" : idx === 3 ? "100%" : `${nodePos}%`, transform: "translateX(-50%)" }}
                  >
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-300 shadow-md ${
                        nodeDone
                          ? "bg-emerald-500 border-white text-white scale-105"
                          : "bg-slate-800 border-slate-600 text-slate-400"
                      }`}
                    >
                      {nodeDone ? (
                        <HiCheck size={13} className="stroke-[2.5]" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-slate-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* THE 3D MOVING VEHICLE / PLANE (Pinned to status percent) */}
            <div
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-out z-20"
              style={{
                left: `${Math.min(96, Math.max(4, statusInfo.percent))}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {/* RADAR PULSE AROUND VEHICLE */}
              <div className="absolute -inset-3 rounded-full bg-sky-400/30 animate-ping pointer-events-none" />

              {/* VEHICLE AVATAR BADGE */}
              <div className="relative flex items-center justify-center h-11 w-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-400 border-2 border-white shadow-2xl shadow-sky-500/80 animate-[floatVehicle_2.5s_ease-in-out_infinite] cursor-pointer group">
                {isAir ? (
                  <span className="text-xl transform -rotate-12 group-hover:scale-125 transition-transform">
                    ✈️
                  </span>
                ) : (
                  <span className="text-xl transform group-hover:scale-125 transition-transform">
                    🚚
                  </span>
                )}

                {/* LIVE SPEED TRAIL / EXHAUST SMOKE */}
                <span className="absolute -left-2 top-1/2 -translate-y-1/2 flex gap-0.5 pointer-events-none">
                  <span className="h-1 w-1 rounded-full bg-sky-300/60 animate-ping" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-ping" />
                </span>

                {/* FLOATING HOVER TOOLTIP */}
                <div className="pointer-events-none absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30">
                  <div className="whitespace-nowrap rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1 text-[11px] font-bold text-sky-300 shadow-xl">
                    {order?.tracking_location ? `At ${order.tracking_location}` : "In Motion"}
                  </div>
                  <div className="h-1.5 w-1.5 rotate-45 bg-slate-950 border-r border-b border-slate-700 -mt-1" />
                </div>
              </div>
            </div>
          </div>

          {/* ROAD LABELS BELOW MILESTONES */}
          <div className="mt-5 grid grid-cols-4 gap-1 text-center">
            {milestones.map((m) => (
              <div key={m.id} className="min-w-0">
                <p className={`text-[11px] sm:text-xs font-bold truncate ${m.isDone ? "text-white" : "text-slate-500"}`}>
                  {m.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {m.hub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================
          INTERACTIVE TABS: MILESTONES vs GRANULAR SCANS
      ========================================================= */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("milestones")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeTab === "milestones"
                ? "bg-[#008dd2] text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
            }`}
          >
            Milestone Route Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("raw_scans")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeTab === "raw_scans"
                ? "bg-[#008dd2] text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
            }`}
          >
            Courier Scan Logs ({scans.length})
          </button>
        </div>

        <span className="text-[11px] font-medium text-slate-400">
          Order ID: <strong className="text-slate-700 dark:text-slate-200">{orderId}</strong>
        </span>
      </div>

      {/* TAB 1: MILESTONES CARDS VIEW */}
      {activeTab === "milestones" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {milestones.map((step) => (
            <div
              key={step.id}
              className={`rounded-2xl border p-3.5 transition-all duration-200 ${
                step.isCurrent
                  ? "border-sky-400 dark:border-sky-500 bg-sky-50/70 dark:bg-sky-950/30 shadow-md shadow-sky-500/10 ring-1 ring-sky-400/40"
                  : step.isDone
                  ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-60"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                    step.isDone
                      ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  }`}
                >
                  {step.isDone ? <HiCheck size={18} /> : step.id}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {step.name}
                    </h4>
                    {step.isCurrent && (
                      <span className="rounded-full bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 text-[9px] font-black uppercase text-[#008dd2] dark:text-[#38bdf8] shrink-0 animate-pulse">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                    📍 {step.hub}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    {step.subtitle}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: DETAILED SCANS CHRONOLOGICAL LIST */}
      {activeTab === "raw_scans" && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          {scans.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No scans recorded yet from carrier.
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-4 py-1">
              {scans.map((scan, idx) => (
                <div key={idx} className="relative pl-6">
                  {/* BULLET */}
                  <div
                    className={`absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 ${
                      idx === 0
                        ? "bg-[#008dd2] border-white shadow-xs"
                        : "bg-slate-300 dark:bg-slate-700 border-white dark:border-slate-900"
                    }`}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {scan.status || "Status scan update"}
                      </p>
                      {scan.location && (
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          📍 {scan.location}
                        </p>
                      )}
                      {scan.instructions && scan.instructions !== scan.status && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {scan.instructions}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 shrink-0">
                      {scan.dateTime ? new Date(scan.dateTime).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
