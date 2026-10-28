import React from "react";
import parceldropIcon from "../../assets/images/parceldrop-icon-clean.png";
import parceldropText from "../../assets/images/parceldrop-text-clean.png";

/**
 * ParcelDropLogo
 * - Clean transparent brand icon (outer white background completely removed)
 * - Icon size and baseline aligned with the capital letters ('P' and 'D')
 * - Complete, crisp "ParcelDrop" text with signature blue location pin 'o' (no gaps, no missing letters)
 * - Sleeker, refined visual weight
 */
export default function ParcelDropLogo({
  className = "",
  style = {},
  height,
  showIcon = true,
}) {
  const hasCustomHeight = className.includes("h-") || height !== undefined;
  // Sleek, compact default height (22px) so it fits elegantly in the 250px sidebar without colliding with toggle button
  const defaultHeightClass = hasCustomHeight ? "" : "h-[22px] sm:h-[23px]";
  const resolvedStyle =
    height !== undefined
      ? {
          height:
            typeof height === "number"
              ? `${Math.round(height * 0.65)}px`
              : height,
          ...style,
        }
      : style;

  return (
    <div
      className={`inline-flex items-start gap-1.5 select-none leading-none ${defaultHeightClass} ${className}`}
      title="ParcelDrop"
      style={resolvedStyle}
    >
      {/* 1. BRAND ICON - 100% transparent squircle, precisely sized and aligned with capital letters */}
      {showIcon && (
        <img
          src={parceldropIcon}
          alt="ParcelDrop Icon"
          className="h-[79%] w-auto aspect-[152/132] object-contain shrink-0 pointer-events-none select-none mt-[0.5px]"
        />
      )}

      {/* 2. COMPLETE BRAND LOGO TEXT - Full "ParcelDrop" with authentic location pin 'o' */}
      <img
        src={parceldropText}
        alt="ParcelDrop"
        className="h-full w-auto object-contain object-left block pointer-events-none select-none"
      />
    </div>
  );
}
