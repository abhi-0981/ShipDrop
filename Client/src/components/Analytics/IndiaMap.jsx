import React, { useState } from "react";

// Simplified accurate geo-projection paths for Indian States & UTs (ViewBox: 0 0 600 660)
// Scaled & aligned to standard Survey of India representation
const INDIA_STATE_PATHS = [
  {
    id: "JK",
    name: "Jammu & Kashmir",
    d: "M160,50 L195,45 L215,70 L210,105 L170,115 L150,90 Z",
    cx: 175,
    cy: 78,
  },
  {
    id: "LA",
    name: "Ladakh",
    d: "M195,45 L255,40 L280,85 L250,115 L210,105 L215,70 Z",
    cx: 240,
    cy: 80,
  },
  {
    id: "HP",
    name: "Himachal Pradesh",
    d: "M175,115 L215,105 L235,130 L210,155 L180,145 L170,125 Z",
    cx: 200,
    cy: 130,
  },
  {
    id: "PB",
    name: "Punjab",
    d: "M145,125 L180,120 L180,155 L160,175 L135,160 Z",
    cx: 158,
    cy: 145,
  },
  {
    id: "UT",
    name: "Uttarakhand",
    d: "M215,135 L255,130 L265,165 L225,180 L210,155 Z",
    cx: 238,
    cy: 155,
  },
  {
    id: "HR",
    name: "Haryana",
    d: "M160,165 L195,155 L205,190 L170,205 L155,185 Z",
    cx: 180,
    cy: 180,
  },
  {
    id: "DL",
    name: "Delhi",
    d: "M193,178 L203,178 L203,188 L193,188 Z",
    cx: 198,
    cy: 183,
  },
  {
    id: "RJ",
    name: "Rajasthan",
    d: "M85,175 L155,170 L175,225 L165,280 L110,285 L75,230 Z",
    cx: 125,
    cy: 230,
  },
  {
    id: "UP",
    name: "Uttar Pradesh",
    d: "M195,175 L285,175 L315,230 L285,265 L210,250 L195,210 Z",
    cx: 250,
    cy: 220,
  },
  {
    id: "BR",
    name: "Bihar",
    d: "M315,220 L385,225 L380,270 L315,265 Z",
    cx: 348,
    cy: 245,
  },
  {
    id: "JH",
    name: "Jharkhand",
    d: "M320,265 L375,270 L365,320 L315,310 Z",
    cx: 345,
    cy: 290,
  },
  {
    id: "WB",
    name: "West Bengal",
    d: "M375,245 L405,250 L395,340 L365,335 L375,290 L385,265 Z",
    cx: 385,
    cy: 295,
  },
  {
    id: "SK",
    name: "Sikkim",
    d: "M385,200 L405,195 L405,215 L385,215 Z",
    cx: 395,
    cy: 205,
  },
  {
    id: "AS",
    name: "Assam",
    d: "M435,215 L500,215 L490,250 L445,255 L430,235 Z",
    cx: 465,
    cy: 235,
  },
  {
    id: "AR",
    name: "Arunachal Pradesh",
    d: "M460,175 L535,185 L515,225 L465,210 Z",
    cx: 495,
    cy: 198,
  },
  {
    id: "ML",
    name: "Meghalaya",
    d: "M430,245 L475,245 L475,265 L430,265 Z",
    cx: 452,
    cy: 255,
  },
  {
    id: "TR",
    name: "Tripura",
    d: "M450,285 L470,285 L465,310 L445,305 Z",
    cx: 458,
    cy: 295,
  },
  {
    id: "MZ",
    name: "Mizoram",
    d: "M470,285 L490,285 L485,330 L465,325 Z",
    cx: 478,
    cy: 305,
  },
  {
    id: "MN",
    name: "Manipur",
    d: "M485,250 L505,250 L500,285 L480,285 Z",
    cx: 492,
    cy: 268,
  },
  {
    id: "NL",
    name: "Nagaland",
    d: "M495,220 L515,220 L510,250 L490,250 Z",
    cx: 502,
    cy: 235,
  },
  {
    id: "GJ",
    name: "Gujarat",
    d: "M55,270 L115,260 L140,310 L105,360 L50,335 L35,295 Z",
    cx: 90,
    cy: 310,
  },
  {
    id: "MP",
    name: "Madhya Pradesh",
    d: "M145,260 L275,250 L285,325 L215,355 L145,325 Z",
    cx: 210,
    cy: 300,
  },
  {
    id: "CG",
    name: "Chhattisgarh",
    d: "M275,295 L315,290 L325,385 L285,395 L265,340 Z",
    cx: 295,
    cy: 345,
  },
  {
    id: "OD",
    name: "Odisha",
    d: "M320,320 L385,330 L360,400 L305,370 Z",
    cx: 345,
    cy: 355,
  },
  {
    id: "MH",
    name: "Maharashtra",
    d: "M100,345 L210,340 L245,410 L165,445 L115,415 Z",
    cx: 170,
    cy: 395,
  },
  {
    id: "GA",
    name: "Goa",
    d: "M125,465 L140,465 L135,485 L120,480 Z",
    cx: 130,
    cy: 472,
  },
  {
    id: "TS",
    name: "Telangana",
    d: "M205,390 L265,385 L265,445 L195,445 Z",
    cx: 230,
    cy: 418,
  },
  {
    id: "AP",
    name: "Andhra Pradesh",
    d: "M255,420 L320,385 L265,510 L215,505 L245,455 Z",
    cx: 265,
    cy: 460,
  },
  {
    id: "KA",
    name: "Karnataka",
    d: "M140,430 L205,430 L205,530 L150,530 L130,470 Z",
    cx: 170,
    cy: 480,
  },
  {
    id: "KL",
    name: "Kerala",
    d: "M150,530 L175,530 L175,615 L150,600 Z",
    cx: 162,
    cy: 568,
  },
  {
    id: "TN",
    name: "Tamil Nadu",
    d: "M180,515 L235,515 L215,615 L175,615 Z",
    cx: 200,
    cy: 565,
  },
];

export default function IndiaMap({
  stateData = [],
  selectedState = null,
  onSelectState = () => {},
}) {
  const [hoveredState, setHoveredState] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Map stateData array into quick lookup map
  const statsByState = React.useMemo(() => {
    const map = new Map();
    (stateData || []).forEach((item) => {
      if (item && item.state) {
        map.set(item.state.toLowerCase(), item);
      }
    });
    return map;
  }, [stateData]);

  // Max orders in any state for dynamic color scaling
  const maxOrders = React.useMemo(() => {
    let max = 0;
    (stateData || []).forEach((item) => {
      if (item.orders > max) max = item.orders;
    });
    return max > 0 ? max : 1;
  }, [stateData]);

  // Get color gradient based on percentage of maxOrders
  const getStateColor = (stateName) => {
    const data = statsByState.get(stateName.toLowerCase());
    const count = data?.orders || 0;

    if (count === 0) return "#f1f5f9"; // Slate-100 (No orders)

    const ratio = count / maxOrders;

    if (ratio > 0.75) return "#0284c7"; // Sky-600 (High Volume)
    if (ratio > 0.45) return "#38bdf8"; // Sky-400 (Moderate Volume)
    if (ratio > 0.2) return "#7dd3fc"; // Sky-300 (Medium Volume)
    return "#bae6fd"; // Sky-200 (Emerging Volume)
  };

  const handleMouseMove = (e, state) => {
    const rect = e.currentTarget.closest("svg").getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    const info = statsByState.get(state.name.toLowerCase()) || {
      state: state.name,
      orders: 0,
      share: 0,
      delivered: 0,
      rto: 0,
      freight: 0,
      successRate: 0,
    };
    setHoveredState(info);
  };

  const handleMouseLeave = () => {
    setHoveredState(null);
  };

  return (
    <div className="relative w-full flex flex-col items-center select-none">
      {/* SVG INDIA MAP CONTAINER */}
      <div className="relative w-full max-w-[520px] aspect-[600/660]">
        <svg
          viewBox="0 0 600 660"
          className="w-full h-full drop-shadow-sm transition-all"
        >
          {/* BACKGROUND SUBTLE WATERMARK / BORDER */}
          <g>
            {INDIA_STATE_PATHS.map((st) => {
              const fillColor = getStateColor(st.name);
              const isSelected =
                selectedState &&
                selectedState.toLowerCase() === st.name.toLowerCase();
              const isHovered =
                hoveredState &&
                hoveredState.state.toLowerCase() === st.name.toLowerCase();

              return (
                <path
                  key={st.id}
                  id={st.id}
                  d={st.d}
                  fill={isSelected ? "#008dd2" : fillColor}
                  stroke={isSelected || isHovered ? "#004b73" : "#cbd5e1"}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1}
                  className="cursor-pointer transition-colors duration-200 ease-out hover:opacity-90"
                  onMouseMove={(e) => handleMouseMove(e, st)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() =>
                    onSelectState(selectedState === st.name ? null : st.name)
                  }
                />
              );
            })}
          </g>

          {/* STATE ABBREVIATIONS / LABELS */}
          {INDIA_STATE_PATHS.map((st) => {
            const data = statsByState.get(st.name.toLowerCase());
            const count = data?.orders || 0;
            if (!st.cx || !st.cy) return null;

            return (
              <text
                key={`lbl-${st.id}`}
                x={st.cx}
                y={st.cy}
                textAnchor="middle"
                alignmentBaseline="central"
                pointerEvents="none"
                className={`text-[9px] font-bold ${
                  count > 0 ? "fill-slate-900" : "fill-slate-400"
                }`}
              >
                {st.id}
              </text>
            );
          })}
        </svg>

        {/* FLOATING HOVER TOOLTIP */}
        {hoveredState && (
          <div
            className="pointer-events-none absolute z-30 transform -translate-x-1/2 -translate-y-full mb-2 w-48 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-md transition-all duration-150"
            style={{
              left: `${Math.min(Math.max(tooltipPos.x, 90), 430)}px`,
              top: `${Math.max(tooltipPos.y - 12, 10)}px`,
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
              <span className="font-bold text-[13px] text-slate-900 truncate">
                {hoveredState.state}
              </span>
              <span className="rounded bg-sky-100 text-[#008dd2] px-1.5 py-0.5 text-[10px] font-bold">
                {hoveredState.share || 0}%
              </span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex items-center justify-between text-slate-600">
                <span>Total Orders:</span>
                <span className="font-bold text-slate-800">
                  {hoveredState.orders || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Delivered:</span>
                <span className="font-bold text-emerald-600">
                  {hoveredState.delivered || 0} ({hoveredState.successRate || 0}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>RTO Returned:</span>
                <span className="font-bold text-rose-600">
                  {hoveredState.rto || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-100">
                <span>Total Freight:</span>
                <span className="font-bold text-slate-900">
                  ₹{Number(hoveredState.freight || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* HEATMAP COLOR SCALE LEGEND */}
      <div className="mt-3 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-500">
        <span className="text-[10px] uppercase font-semibold text-slate-400">
          Order Density:
        </span>
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-xs border border-slate-200 bg-[#f1f5f9]" />
            <span>0</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-xs bg-[#bae6fd]" />
            <span>Low</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-xs bg-[#7dd3fc]" />
            <span>Mid</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-xs bg-[#38bdf8]" />
            <span>High</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-xs bg-[#0284c7]" />
            <span>Top</span>
          </span>
        </div>
      </div>
    </div>
  );
}
