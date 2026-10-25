import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

// 36 Official Indian States & Union Territories with GPS Centroids
const INDIAN_STATES = [
  { name: "Andhra Pradesh", code: "AP", lat: 15.9129, lng: 79.74, zone: "South" },
  { name: "Arunachal Pradesh", code: "AR", lat: 28.218, lng: 94.7278, zone: "North East" },
  { name: "Assam", code: "AS", lat: 26.2006, lng: 92.9376, zone: "North East" },
  { name: "Bihar", code: "BR", lat: 25.0961, lng: 85.3131, zone: "East" },
  { name: "Chandigarh", code: "CH", lat: 30.7333, lng: 76.7794, zone: "North" },
  { name: "Chhattisgarh", code: "CG", lat: 21.2787, lng: 81.8661, zone: "Central" },
  { name: "Dadra and Nagar Haveli and Daman and Diu", code: "DN", lat: 20.4283, lng: 72.8397, zone: "West" },
  { name: "Delhi", code: "DL", lat: 28.6139, lng: 77.209, zone: "North" },
  { name: "Goa", code: "GA", lat: 15.2993, lng: 74.124, zone: "West" },
  { name: "Gujarat", code: "GJ", lat: 22.2587, lng: 71.1924, zone: "West" },
  { name: "Haryana", code: "HR", lat: 29.0588, lng: 76.0856, zone: "North" },
  { name: "Himachal Pradesh", code: "HP", lat: 31.1048, lng: 77.1734, zone: "North" },
  { name: "Jammu and Kashmir", code: "JK", lat: 33.7782, lng: 76.5762, zone: "North" },
  { name: "Jharkhand", code: "JH", lat: 23.6102, lng: 85.2799, zone: "East" },
  { name: "Karnataka", code: "KA", lat: 15.3173, lng: 75.7139, zone: "South" },
  { name: "Kerala", code: "KL", lat: 10.8505, lng: 76.2711, zone: "South" },
  { name: "Ladakh", code: "LA", lat: 34.1526, lng: 77.5771, zone: "North" },
  { name: "Madhya Pradesh", code: "MP", lat: 22.9734, lng: 78.6569, zone: "Central" },
  { name: "Maharashtra", code: "MH", lat: 19.7515, lng: 75.7139, zone: "West" },
  { name: "Manipur", code: "MN", lat: 24.6637, lng: 93.9063, zone: "North East" },
  { name: "Meghalaya", code: "ML", lat: 25.467, lng: 91.3662, zone: "North East" },
  { name: "Mizoram", code: "MZ", lat: 23.1645, lng: 92.9376, zone: "North East" },
  { name: "Nagaland", code: "NL", lat: 26.1584, lng: 94.5624, zone: "North East" },
  { name: "Odisha", code: "OD", lat: 20.9517, lng: 85.0985, zone: "East" },
  { name: "Puducherry", code: "PY", lat: 11.9416, lng: 79.8083, zone: "South" },
  { name: "Punjab", code: "PB", lat: 31.1471, lng: 75.3412, zone: "North" },
  { name: "Rajasthan", code: "RJ", lat: 27.0238, lng: 74.2179, zone: "North" },
  { name: "Sikkim", code: "SK", lat: 27.533, lng: 88.5122, zone: "East" },
  { name: "Tamil Nadu", code: "TN", lat: 11.1271, lng: 78.6569, zone: "South" },
  { name: "Telangana", code: "TS", lat: 18.1124, lng: 79.0193, zone: "South" },
  { name: "Tripura", code: "TR", lat: 23.9408, lng: 91.9882, zone: "North East" },
  { name: "Uttar Pradesh", code: "UP", lat: 26.8467, lng: 80.9462, zone: "North" },
  { name: "Uttarakhand", code: "UK", lat: 30.0668, lng: 79.0193, zone: "North" },
  { name: "West Bengal", code: "WB", lat: 22.9868, lng: 87.855, zone: "East" },
  { name: "Andaman and Nicobar", code: "AN", lat: 11.7401, lng: 92.6586, zone: "South" },
  { name: "Lakshadweep", code: "LD", lat: 10.5667, lng: 72.6417, zone: "South" },
];

const DEFAULT_CENTER = [22.8, 79.5];
const DEFAULT_ZOOM = 4.4;

// Normalizer for state names to match backend data with GPS coords
const normalizeKey = (str) =>
  String(str || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");

// Sub-component to fly to state when clicked or reset view
function MapViewController({ selectedState, stateLookup, triggerReset }) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (triggerReset) {
      map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 0.8 });
    }
  }, [triggerReset, map]);

  useEffect(() => {
    if (selectedState) {
      const match = stateLookup[normalizeKey(selectedState)];
      if (match && match.lat && match.lng) {
        map.flyTo([match.lat, match.lng], 6.2, { duration: 0.9 });
      }
    }
  }, [selectedState, stateLookup, map]);

  return null;
}

export default function IndiaMap({ stateData = [], selectedState = null, onSelectState }) {
  const [viewMode, setViewMode] = useState("map"); // "map" | "grid"
  const [resetTrigger, setResetTrigger] = useState(0);

  // Map stateData by normalized name for O(1) lookup
  const stateDataMap = useMemo(() => {
    const map = new Map();
    (stateData || []).forEach((item) => {
      if (item && item.state) {
        map.set(normalizeKey(item.state), item);
      }
    });
    return map;
  }, [stateData]);

  // Lookup for GPS metadata
  const stateLookup = useMemo(() => {
    const lookup = {};
    INDIAN_STATES.forEach((s) => {
      lookup[normalizeKey(s.name)] = s;
      lookup[normalizeKey(s.code)] = s;
    });
    return lookup;
  }, []);

  // Compute maximum orders for color & radius scaling
  const maxOrders = useMemo(() => {
    let max = 0;
    (stateData || []).forEach((s) => {
      if (Number(s.orders) > max) max = Number(s.orders);
    });
    return max > 0 ? max : 1;
  }, [stateData]);

  // Merge GPS data with order stats
  const enrichedStates = useMemo(() => {
    return INDIAN_STATES.map((geo) => {
      const stat = stateDataMap.get(normalizeKey(geo.name)) || {
        state: geo.name,
        orders: 0,
        delivered: 0,
        rto: 0,
        cod: 0,
        freight: 0,
        share: 0,
        successRate: 0,
      };

      const orders = Number(stat.orders || 0);
      const ratio = orders > 0 ? orders / maxOrders : 0;

      // Color tier
      let fillColor = "#cbd5e1"; // 0 orders: clean slate gray
      let strokeColor = "#94a3b8";
      let radius = 6;
      let fillOpacity = 0.45;

      if (orders > 0) {
        if (ratio >= 0.6) {
          fillColor = "#0284c7"; // Top tier: deep rich brand sky
          strokeColor = "#0369a1";
          radius = Math.min(26, 14 + Math.round(ratio * 12));
          fillOpacity = 0.88;
        } else if (ratio >= 0.25) {
          fillColor = "#0ea5e9"; // Mid tier: bright sky blue
          strokeColor = "#0284c7";
          radius = Math.min(20, 11 + Math.round(ratio * 10));
          fillOpacity = 0.82;
        } else {
          fillColor = "#38bdf8"; // Low tier: soft cyan
          strokeColor = "#0284c7";
          radius = Math.min(15, 8 + Math.round(ratio * 8));
          fillOpacity = 0.78;
        }
      }

      const isSelected =
        selectedState &&
        (normalizeKey(selectedState) === normalizeKey(geo.name) ||
          normalizeKey(selectedState) === normalizeKey(geo.code));

      return {
        ...geo,
        stat,
        orders,
        ratio,
        fillColor: isSelected ? "#f59e0b" : fillColor,
        strokeColor: isSelected ? "#b45309" : strokeColor,
        radius: isSelected ? radius + 4 : radius,
        fillOpacity: isSelected ? 0.95 : fillOpacity,
        weight: isSelected ? 3 : orders > 0 ? 2 : 1,
        isSelected,
      };
    });
  }, [stateDataMap, maxOrders, selectedState]);

  // Top states for quick filter pills
  const topActiveStates = useMemo(() => {
    return (stateData || [])
      .filter((s) => Number(s.orders) > 0)
      .slice(0, 6);
  }, [stateData]);

  const handleCircleClick = (stateName) => {
    if (onSelectState) {
      if (selectedState && normalizeKey(selectedState) === normalizeKey(stateName)) {
        onSelectState(null); // Toggle off if already selected
      } else {
        onSelectState(stateName);
      }
    }
  };

  const handleResetMap = () => {
    setResetTrigger((prev) => prev + 1);
    if (onSelectState) onSelectState(null);
  };

  return (
    <div className="relative flex flex-col w-full">
      {/* TOP BAR: QUICK FILTER PILLS & VIEW TOGGLE */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {/* State Quick Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={handleResetMap}
            className={`rounded-lg px-2.5 py-1 font-semibold transition-all shadow-2xs ${
              !selectedState
                ? "bg-[#008dd2] text-white shadow-sky-200"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All India ({stateData.reduce((acc, s) => acc + Number(s.orders || 0), 0)})
          </button>

          {topActiveStates.map((st) => {
            const isPillActive =
              selectedState &&
              normalizeKey(selectedState) === normalizeKey(st.state);
            return (
              <button
                key={st.state}
                type="button"
                onClick={() => handleCircleClick(st.state)}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 font-medium transition-all ${
                  isPillActive
                    ? "bg-amber-500 text-white font-bold shadow-xs"
                    : "bg-sky-50 text-[#008dd2] border border-sky-200/70 hover:bg-sky-100"
                }`}
              >
                <span>{st.state}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                    isPillActive ? "bg-amber-600 text-white" : "bg-white text-[#008dd2]"
                  }`}
                >
                  {st.orders}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setViewMode("map")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition-all ${
              viewMode === "map"
                ? "bg-white text-[#008dd2] shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>🗺️</span>
            <span>Real Geo Map</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition-all ${
              viewMode === "grid"
                ? "bg-white text-[#008dd2] shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>📊</span>
            <span>State Cards</span>
          </button>
        </div>
      </div>

      {/* ACTIVE FILTER BANNER */}
      {selectedState && (
        <div className="mb-2.5 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-1.5 text-[11px] text-amber-900">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span>
              Filtered to: <strong className="font-bold">{selectedState}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetMap}
            className="text-[10px] font-bold text-amber-700 hover:text-amber-900 underline"
          >
            Reset Filter
          </button>
        </div>
      )}

      {/* VIEW 1: AUTHENTIC CARTO LEAFLET MAP */}
      {viewMode === "map" ? (
        <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 shadow-inner bg-[#f8fafc]">
          {/* Map Container */}
          <div className="h-[430px] sm:h-[480px] w-full">
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={DEFAULT_ZOOM}
              minZoom={3.8}
              maxZoom={8}
              scrollWheelZoom={false}
              zoomControl={true}
              attributionControl={false}
              className="h-full w-full z-0"
              style={{ background: "#edf2f7" }}
            >
              {/* Clean, authentic SaaS CartoDB Positron Basemap */}
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
                maxZoom={19}
              />

              <MapViewController
                selectedState={selectedState}
                stateLookup={stateLookup}
                triggerReset={resetTrigger}
              />

              {/* State Density Bubbles with Hover Tooltips */}
              {enrichedStates.map((st) => (
                <CircleMarker
                  key={st.name}
                  center={[st.lat, st.lng]}
                  radius={st.radius}
                  pathOptions={{
                    fillColor: st.fillColor,
                    fillOpacity: st.fillOpacity,
                    color: st.strokeColor,
                    weight: st.weight,
                  }}
                  eventHandlers={{
                    click: () => handleCircleClick(st.name),
                  }}
                >
                  <Tooltip
                    direction="top"
                    offset={[0, -st.radius]}
                    opacity={0.98}
                    sticky
                    className="leaflet-modern-tooltip"
                  >
                    <div className="min-w-[170px] p-1 font-sans text-slate-800">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#008dd2]" />
                          <span className="font-bold text-[12px] text-slate-900">
                            {st.name}
                          </span>
                        </div>
                        <span className="rounded bg-sky-100 text-[#008dd2] px-1.5 py-0.5 text-[9px] font-bold">
                          {st.code}
                        </span>
                      </div>

                      {st.orders > 0 ? (
                        <div className="space-y-1 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Orders:</span>
                            <span className="font-extrabold text-slate-900">
                              {st.orders} ({st.stat.share || 0}%)
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Delivered:</span>
                            <span className="font-bold text-emerald-600">
                              {st.stat.delivered || 0} ({st.stat.successRate || 0}%)
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">RTO:</span>
                            <span className="font-bold text-rose-500">
                              {st.stat.rto || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                            <span className="text-slate-500">Freight:</span>
                            <span className="font-bold text-slate-900">
                              ₹{Number(st.stat.freight || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="mt-1 pt-1 text-center text-[9px] font-semibold text-[#008dd2]">
                            👆 Click bubble to filter
                          </div>
                        </div>
                      ) : (
                        <div className="py-0.5 text-center text-[10px] text-slate-400">
                          0 orders in this date range
                        </div>
                      )}
                    </div>
                  </Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>

          {/* FLOATING MAP CONTROLS */}
          <div className="absolute bottom-3 right-3 z-[400] flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetMap}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/95 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 shadow-md backdrop-blur-xs transition hover:bg-slate-50 active:scale-95"
              title="Reset India Center View"
            >
              <span>🇮🇳</span>
              <span>Reset Map</span>
            </button>
          </div>
        </div>
      ) : (
        /* VIEW 2: DENSE STATE LEADERBOARD CARDS */
        <div className="grid max-h-[440px] grid-cols-1 gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-2.5 sm:grid-cols-2 md:grid-cols-3">
          {enrichedStates
            .filter((s) => s.orders > 0)
            .sort((a, b) => b.orders - a.orders)
            .map((st) => (
              <div
                key={st.name}
                onClick={() => handleCircleClick(st.name)}
                className={`cursor-pointer rounded-xl border bg-white p-3 shadow-2xs transition-all hover:border-[#008dd2] hover:shadow-sm ${
                  st.isSelected
                    ? "border-amber-400 bg-amber-50/40 ring-2 ring-amber-300"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                      {st.code}
                    </span>
                    <span className="font-bold text-[12px] text-slate-900 truncate">
                      {st.name}
                    </span>
                  </div>
                  <span className="font-extrabold text-[13px] text-[#008dd2]">
                    {st.orders}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-[#008dd2]"
                    style={{ width: `${Math.min(100, (st.orders / maxOrders) * 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="text-emerald-600 font-semibold">
                    ✓ {st.stat.delivered || 0} ({st.stat.successRate || 0}%)
                  </span>
                  <span className="text-rose-500 font-semibold">
                    ✕ {st.stat.rto || 0} RTO
                  </span>
                  <span className="font-bold text-slate-800">
                    ₹{Number(st.stat.freight || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* HEATMAP COLOR SCALE LEGEND */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[11px] font-medium text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400">
            Bubble Density:
          </span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-[#cbd5e1]" />
              <span className="text-[10px]">0</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-[#38bdf8]" />
              <span className="text-[10px]">Low</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3.5 w-3.5 rounded-full bg-[#0ea5e9]" />
              <span className="text-[10px]">Mid</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-4 w-4 rounded-full bg-[#0284c7]" />
              <span className="text-[10px]">Top Hub</span>
            </span>
          </div>
        </div>

        <div className="text-[10px] text-slate-400">
          Click any bubble or pill to filter orders
        </div>
      </div>
    </div>
  );
}
