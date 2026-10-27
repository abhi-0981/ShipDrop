import React, { useEffect, useState, useRef } from "react";
import shipdropLogo from "../assets/shipdrop-logo.png";

// Module-level cache so slices are calculated only once across the entire app
let cachedSlices = null;

/**
 * ParcelDropLogo with Smooth Floating 'o' Pin
 * Slices the authentic shipdrop-logo.png directly in memory so:
 * 1. Font weight is 100% identical to the original image
 * 2. 'o' size is 100% identical to the original image
 * 3. Color combination is 100% identical to the original image
 * 4. Only the 'o' letter smoothly hovers up and down
 */
export default function ParcelDropLogo({ className = "", style = {}, height }) {
  const [slices, setSlices] = useState(() => cachedSlices);
  const containerRef = useRef(null);

  useEffect(() => {
    if (cachedSlices) {
      setSlices(cachedSlices);
      return;
    }

    const img = new Image();
    img.src = shipdropLogo;
    img.onload = () => {
      try {
        const width = img.naturalWidth;
        const height = img.naturalHeight;

        if (!width || !height) return;

        // Offscreen canvas to scan columns
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, width, height);
        const pixels = imgData.data;

        // Detect non-empty columns (non-white, non-transparent)
        const colHasContent = new Array(width).fill(false);
        for (let x = 0; x < width; x++) {
          for (let y = 0; y < height; y++) {
            const idx = (y * width + x) * 4;
            const a = pixels[idx + 3];
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];
            if (a > 30 && !(r > 242 && g > 242 && b > 242)) {
              colHasContent[x] = true;
              break;
            }
          }
        }

        // Scan from right to find:
        // 1. 'p' (last letter)
        // 2. 'o' (second-to-last letter, the pin)
        let p_end = width - 1;
        while (p_end >= 0 && !colHasContent[p_end]) p_end--;

        let p_start = p_end;
        while (p_start >= 0 && colHasContent[p_start]) p_start--;
        p_start++;

        let o_end = p_start - 1;
        while (o_end >= 0 && !colHasContent[o_end]) o_end--;

        let o_start = o_end;
        while (o_start >= 0 && colHasContent[o_start]) o_start--;
        o_start++;

        // Safety fallback if detection fails
        if (o_start <= 0 || o_end <= o_start || p_start <= o_end) {
          return;
        }

        // Slicing boundaries with breathing margin
        const leftCut = Math.max(0, o_start);
        const rightCut = Math.min(width, o_end + 1);

        // Helper to crop a slice and make white background transparent
        const createSlice = (startX, sliceWidth) => {
          const c = document.createElement("canvas");
          c.width = sliceWidth;
          c.height = height;
          const cCtx = c.getContext("2d");
          cCtx.drawImage(img, startX, 0, sliceWidth, height, 0, 0, sliceWidth, height);

          // Make white background transparent so it floats cleanly in light & dark mode
          const sliceData = cCtx.getImageData(0, 0, sliceWidth, height);
          const sPix = sliceData.data;
          for (let i = 0; i < sPix.length; i += 4) {
            const r = sPix[i];
            const g = sPix[i + 1];
            const b = sPix[i + 2];
            if (r > 242 && g > 242 && b > 242) {
              sPix[i + 3] = 0; // transparent
            }
          }
          cCtx.putImageData(sliceData, 0, 0);
          return c.toDataURL("image/png");
        };

        const leftUrl = createSlice(0, leftCut);
        const oUrl = createSlice(leftCut, rightCut - leftCut);
        const rightUrl = createSlice(rightCut, width - rightCut);

        const result = {
          left: leftUrl,
          pin: oUrl,
          right: rightUrl,
          leftWidthRatio: leftCut / height,
          pinWidthRatio: (rightCut - leftCut) / height,
          rightWidthRatio: (width - rightCut) / height,
        };

        cachedSlices = result;
        setSlices(result);
      } catch (err) {
        console.warn("Logo slice fallback notice:", err.message);
      }
    };
  }, []);

  const hasCustomHeight = className.includes("h-") || height !== undefined;
  const defaultHeightClass = hasCustomHeight ? "" : "h-[42px] sm:h-[44px]";
  const resolvedStyle =
    height !== undefined
      ? { height: typeof height === "number" ? `${height}px` : height, ...style }
      : style;

  // While calculating or if fallback needed, render original image directly
  if (!slices) {
    return (
      <img
        src={shipdropLogo}
        alt="ParcelDrop"
        className={`w-auto object-contain object-left ${defaultHeightClass} ${className}`}
        style={resolvedStyle}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`inline-flex items-center select-none leading-none ${defaultHeightClass} ${className}`}
      title="ParcelDrop"
      style={resolvedStyle}
    >
      {/* 1. "ParcelDr" - Exact original font, weight, color & resolution */}
      <img
        src={slices.left}
        alt="ParcelDr"
        className="h-full w-auto object-contain object-left block pointer-events-none"
      />

      {/* 2. "o" (Location Pin) - Exact original size & color with smooth float */}
      <span className="inline-block h-full animate-logo-pin-float pointer-events-none">
        <img
          src={slices.pin}
          alt="o"
          className="h-full w-auto object-contain block"
        />
      </span>

      {/* 3. "p" - Exact original font, weight & color */}
      <img
        src={slices.right}
        alt="p"
        className="h-full w-auto object-contain object-left block pointer-events-none"
      />
    </div>
  );
}
