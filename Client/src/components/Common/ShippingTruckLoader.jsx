import React from "react";

export default function ShippingTruckLoader({ text = "Shipping Order..." }) {
  return (
    <span className="inline-flex items-center justify-center gap-2 font-bold text-white select-none">
      {/* Driving Truck with Wind & Road Animation */}
      <span className="relative flex flex-col items-center justify-center">
        <span className="relative flex items-center">
          {/* Speed / motion lines streaming behind truck */}
          <span className="flex flex-col gap-[2px] items-end mr-1 opacity-80">
            <span className="h-[2px] w-2 rounded-full bg-white animate-truck-dash" />
            <span className="h-[2px] w-3.5 rounded-full bg-white animate-truck-dash [animation-delay:150ms]" />
            <span className="h-[2px] w-1.5 rounded-full bg-white animate-truck-dash [animation-delay:300ms]" />
          </span>

          {/* Bobbing truck */}
          <span className="inline-block animate-truck-bob">
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-2 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
            </svg>
          </span>
        </span>

        {/* Road strip under wheels */}
        <span className="h-[2px] w-7 overflow-hidden relative -mt-0.5 rounded-full">
          <span className="absolute inset-0 border-b-2 border-dotted border-white/70 animate-truck-road-dash" />
        </span>
      </span>

      <span>{text}</span>
    </span>
  );
}
