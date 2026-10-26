import React from "react";

/**
 * ParcelDrop Animated Brand Logo
 * Features a smooth, elegant floating map-pin "o" in "Drop"
 */
export default function ParcelDropLogo({ className = "", animated = true }) {
  return (
    <div
      className={`group inline-flex items-baseline select-none font-sans ${className}`}
      title="ParcelDrop"
    >
      {/* "Parcel" */}
      <span className="font-extrabold text-[24px] sm:text-[26px] tracking-[-0.04em] text-[#042d64] dark:text-white leading-none transition-colors duration-200">
        Parcel
      </span>

      {/* "Dr" */}
      <span className="font-extrabold text-[24px] sm:text-[26px] tracking-[-0.04em] text-[#008dd2] leading-none ml-[0.5px]">
        Dr
      </span>

      {/* Floating Map Pin "o" */}
      <span className="relative inline-flex flex-col items-center justify-center mx-[1px] translate-y-[1px]">
        <span
          className={`inline-block ${
            animated ? "animate-logo-pin-float" : ""
          } transition-transform duration-200 group-hover:-translate-y-1`}
        >
          <svg
            className="w-[19px] h-[25px] sm:w-[20.5px] sm:h-[27px] text-[#008dd2] fill-current drop-shadow-[0_1px_2px_rgba(0,141,210,0.25)]"
            viewBox="0 0 24 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 0C5.373 0 0 5.373 0 12c0 5.5 4.6 12.3 10.6 18.8.8.8 2 .8 2.8 0C19.4 24.3 24 17.5 24 12 24 5.373 18.627 0 12 0zm0 17.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"
              fill="currentColor"
            />
          </svg>
        </span>

        {/* Subtle Ground Pin Shadow */}
        {animated && (
          <span className="animate-logo-pin-shadow absolute -bottom-[1.5px] h-[2.5px] w-2.5 rounded-full bg-[#008dd2]/30 blur-[0.6px]" />
        )}
      </span>

      {/* "p" */}
      <span className="font-extrabold text-[24px] sm:text-[26px] tracking-[-0.04em] text-[#008dd2] leading-none ml-[0.5px]">
        p
      </span>
    </div>
  );
}
