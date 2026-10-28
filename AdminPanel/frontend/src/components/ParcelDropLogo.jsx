import React from "react";
import shipdropLogo from "../assets/shipdrop-logo.png";

/**
 * ParcelDropLogo
 * Original authentic brand logo (shipdrop-logo.png)
 */
export default function ParcelDropLogo({
  className = "",
  style = {},
  height,
}) {
  const hasCustomHeight = className.includes("h-") || height !== undefined;
  const defaultHeightClass = hasCustomHeight ? "" : "h-9 sm:h-10";
  const resolvedStyle =
    height !== undefined
      ? { height: typeof height === "number" ? `${height}px` : height, ...style }
      : style;

  return (
    <img
      src={shipdropLogo}
      alt="ParcelDrop"
      className={`w-auto object-contain object-left select-none ${defaultHeightClass} ${className}`}
      style={resolvedStyle}
    />
  );
}
