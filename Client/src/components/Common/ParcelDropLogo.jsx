import React, { useEffect, useState, useRef } from "react";
import shipdropLogo from "../../assets/images/shipdrop-logo.png";

// Module-level cache so slices are calculated only once across the entire app
let cachedLightSlices = null;
let cachedDarkSlices = null;

/**
 * ParcelDropLogo
 * Dual-Mode Adaptive Brand Logo:
 * - Light Mode: Authentic original navy "Parcel" + azure blue "Drop"
 * - Dark Mode: Crisp luminous white "Parcel" + electric vibrant blue "Drop" with ambient cyber glow
 * - Both modes feature the smooth 60fps floating 'o' (location pin) animation
 */
export default function ParcelDropLogo({
  className = "",
  style = {},
  height,
}) {
  const [slices, setSlices] = useState(() => {
    if (cachedLightSlices && cachedDarkSlices) {
      return { light: cachedLightSlices, dark: cachedDarkSlices };
    }
    return null;
  });
  const containerRef = useRef(null);

  useEffect(() => {
    if (cachedLightSlices && cachedDarkSlices) {
      setSlices({ light: cachedLightSlices, dark: cachedDarkSlices });
      return;
    }

    const processImage = (img) => {
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
            if (a > 30 && !(r > 240 && g > 240 && b > 240)) {
              colHasContent[x] = true;
              break;
            }
          }
        }

        // 1. Scan from right to find:
        // 'p' (last letter)
        let p_end = width - 1;
        while (p_end >= 0 && !colHasContent[p_end]) p_end--;

        let p_start = p_end;
        while (p_start >= 0 && colHasContent[p_start]) p_start--;
        p_start++;

        // 'o' (second-to-last letter, the location pin)
        let o_end = p_start - 1;
        while (o_end >= 0 && !colHasContent[o_end]) o_end--;

        let o_start = o_end;
        while (o_start >= 0 && colHasContent[o_start]) o_start--;
        o_start++;

        // Safety fallback if detection fails
        if (o_start <= 0 || o_end <= o_start || p_start <= o_end) {
          return;
        }

        // Slicing boundaries for the floating 'o' pin
        const leftCut = Math.max(0, o_start);
        const rightCut = Math.min(width, o_end + 1);

        // 2. Detect column where "Parcel" (navy) transitions to "Drop" (bright blue)
        // In "Drop", the 'D' and following letters have bright azure blue (high green & high blue):
        let text_start = 0;
        while (text_start < width && !colHasContent[text_start]) text_start++;

        let drop_start_x = Math.round(leftCut * 0.72); // mathematical fallback for 6-letter "Parcel" vs 2-letter "Dr"
        for (let x = text_start; x < o_start; x++) {
          let hasBrightBlue = false;
          for (let y = 0; y < height; y++) {
            const idx = (y * width + x) * 4;
            const a = pixels[idx + 3];
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];
            if (a > 50 && !(r > 240 && g > 240 && b > 240)) {
              // Bright blue has strong green (>100) and dominant blue (>160)
              if (b > 160 && g > 100 && r < 140) {
                hasBrightBlue = true;
                break;
              }
            }
          }
          if (hasBrightBlue) {
            drop_start_x = x;
            break;
          }
        }

        // 3. Helper to crop slice and apply adaptive Light/Dark styling
        const createSlice = (startX, sliceWidth, isDark = false) => {
          const c = document.createElement("canvas");
          c.width = sliceWidth;
          c.height = height;
          const cCtx = c.getContext("2d");
          cCtx.drawImage(img, startX, 0, sliceWidth, height, 0, 0, sliceWidth, height);

          const sliceData = cCtx.getImageData(0, 0, sliceWidth, height);
          const sPix = sliceData.data;

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < sliceWidth; x++) {
              const i = (y * sliceWidth + x) * 4;
              const globalX = startX + x;
              const r = sPix[i];
              const g = sPix[i + 1];
              const b = sPix[i + 2];
              const a = sPix[i + 3];

              // Pure or near-white background -> make transparent
              if (r > 240 && g > 240 && b > 240) {
                sPix[i + 3] = 0;
                continue;
              }

              if (a < 20) continue;

              if (!isDark) {
                // LIGHT MODE:
                // Keep authentic original navy & azure colors completely intact.
                // Feather edge pixels that blend with pure white:
                if (r > 230 && g > 230 && b > 230) {
                  sPix[i + 3] = Math.max(0, 255 - Math.round(((r + g + b) / 3 - 230) * 10));
                }
              } else {
                // DARK MODE:
                if (globalX < drop_start_x) {
                  // "Parcel" section -> Transform dark navy into crisp, ultra-legible pure white / platinum
                  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                  // Darkness factor: how solid the original navy letter was vs white background
                  const darkness = Math.max(0, Math.min(1, (242 - lum) / 190));

                  if (darkness <= 0.06) {
                    sPix[i + 3] = 0;
                  } else {
                    // Soft, elegant light-blue shade (halka blue tint: rgb(178, 208, 244))
                    sPix[i] = 178;     // Soft blue (r)
                    sPix[i + 1] = 208; // Soft blue (g)
                    sPix[i + 2] = 244; // Soft blue (b)
                    sPix[i + 3] = Math.round(Math.min(255, (darkness > 0.4 ? 1 : darkness * 1.5) * 255));
                  }
                } else {
                  // "Drop" section ('D', 'r', 'o', 'p') -> Luminous electric brand blue
                  if (r > 215 && g > 215 && b > 215) {
                    sPix[i + 3] = 0; // eliminate white halos on dark backgrounds
                  } else {
                    // Unpremultiply white and enhance saturation for rich dark mode radiance
                    const isBlue = b > 140 && g > 80;
                    if (isBlue) {
                      sPix[i] = Math.min(45, r);
                      sPix[i + 1] = Math.max(150, Math.min(210, Math.round(g * 1.15)));
                      sPix[i + 2] = Math.max(235, Math.min(255, Math.round(b * 1.12)));
                    }
                  }
                }
              }
            }
          }

          cCtx.putImageData(sliceData, 0, 0);
          return c.toDataURL("image/png");
        };

        const lightResult = {
          left: createSlice(0, leftCut, false),
          pin: createSlice(leftCut, rightCut - leftCut, false),
          right: createSlice(rightCut, width - rightCut, false),
        };

        const darkResult = {
          left: createSlice(0, leftCut, true),
          pin: createSlice(leftCut, rightCut - leftCut, true),
          right: createSlice(rightCut, width - rightCut, true),
        };

        cachedLightSlices = lightResult;
        cachedDarkSlices = darkResult;
        setSlices({ light: lightResult, dark: darkResult });
      } catch (err) {
        console.warn("Logo slice notice:", err.message);
      }
    };

    const img = new Image();
    img.src = shipdropLogo;
    if (img.complete && img.naturalWidth) {
      processImage(img);
    } else {
      img.onload = () => processImage(img);
    }
  }, []);

  const hasCustomHeight = className.includes("h-") || height !== undefined;
  const defaultHeightClass = hasCustomHeight ? "" : "h-9 sm:h-10";
  const resolvedStyle =
    height !== undefined
      ? { height: typeof height === "number" ? `${height}px` : height, ...style }
      : style;

  // While calculating or if fallback needed, render original image directly
  if (!slices) {
    return (
      <div
        className={`inline-flex items-center select-none leading-none ${defaultHeightClass} ${className}`}
        style={resolvedStyle}
      >
        <img
          src={shipdropLogo}
          alt="ParcelDrop"
          className="parcel-drop-logo-light h-full w-auto object-contain object-left block select-none dark:hidden"
        />
        <img
          src={shipdropLogo}
          alt="ParcelDrop"
          className="parcel-drop-logo-dark h-full w-auto object-contain object-left select-none hidden dark:block filter brightness-150 contrast-125"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`inline-flex items-center select-none leading-none ${defaultHeightClass} ${className}`}
      title="ParcelDrop"
      style={resolvedStyle}
    >
      {/* ========================================================
          1. LIGHT MODE LOGO - Authentic Original Colors
          "Parcel" (Navy) + "Drop" (Azure Blue) with Floating Pin
          ======================================================== */}
      <div className="parcel-drop-logo-light flex items-center h-full dark:hidden">
        <img
          src={slices.light.left}
          alt="ParcelDr"
          className="h-full w-auto object-contain object-left block pointer-events-none"
        />
        <span className="inline-block h-full animate-logo-pin-float pointer-events-none">
          <img
            src={slices.light.pin}
            alt="o"
            className="h-full w-auto object-contain block"
          />
        </span>
        <img
          src={slices.light.right}
          alt="p"
          className="h-full w-auto object-contain object-left block pointer-events-none"
        />
      </div>

      {/* ========================================================
          2. DARK MODE LOGO - Crisp White + Luminous Electric Blue
          "Parcel" (Crisp White) + "Drop" (Electric Blue) with Subtle Cyber Glow
          ======================================================== */}
      <div className="parcel-drop-logo-dark hidden items-center h-full dark:flex filter drop-shadow-[0_0_12px_rgba(0,141,210,0.22)]">
        <img
          src={slices.dark.left}
          alt="ParcelDr"
          className="h-full w-auto object-contain object-left block pointer-events-none"
        />
        <span className="inline-block h-full animate-logo-pin-float pointer-events-none drop-shadow-[0_0_8px_rgba(56,189,248,0.45)]">
          <img
            src={slices.dark.pin}
            alt="o"
            className="h-full w-auto object-contain block"
          />
        </span>
        <img
          src={slices.dark.right}
          alt="p"
          className="h-full w-auto object-contain object-left block pointer-events-none"
        />
      </div>
    </div>
  );
}
