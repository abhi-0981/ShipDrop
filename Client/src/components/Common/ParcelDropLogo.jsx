import React, { useEffect, useState, useRef } from "react";
import shipdropLogo from "../../assets/images/shipdrop-logo.png";
import parceldropIcon from "../../assets/images/parceldrop-icon.png";

// Module-level caches so processing is done only once across the entire application lifecycle
let cachedSlices = null;
let cachedCleanIcon = null;

// Helper to remove outer white background and crop tightly to the squircle
const processTransparentIcon = (img) => {
  try {
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    if (!width || !height) return img.src;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // BFS Flood Fill from all outer edges to remove outer white rectangular canvas
    const visited = new Uint8Array(width * height);
    const queue = [];

    // Seed from all 4 borders (top, bottom, left, right)
    for (let x = 0; x < width; x++) {
      queue.push(x);
      queue.push((height - 1) * width + x);
      visited[x] = 1;
      visited[(height - 1) * width + x] = 1;
    }
    for (let y = 0; y < height; y++) {
      queue.push(y * width);
      queue.push(y * width + (width - 1));
      visited[y * width] = 1;
      visited[y * width + (width - 1)] = 1;
    }

    const isWhite = (idx) => {
      const p = idx * 4;
      return data[p] > 230 && data[p + 1] > 230 && data[p + 2] > 230;
    };

    let head = 0;
    while (head < queue.length) {
      const curr = queue[head++];
      if (isWhite(curr)) {
        data[curr * 4 + 3] = 0; // Make transparent!

        const cx = curr % width;
        const cy = Math.floor(curr / width);

        if (cx > 0) {
          const n = curr - 1;
          if (!visited[n]) {
            visited[n] = 1;
            if (isWhite(n)) queue.push(n);
          }
        }
        if (cx < width - 1) {
          const n = curr + 1;
          if (!visited[n]) {
            visited[n] = 1;
            if (isWhite(n)) queue.push(n);
          }
        }
        if (cy > 0) {
          const n = curr - width;
          if (!visited[n]) {
            visited[n] = 1;
            if (isWhite(n)) queue.push(n);
          }
        }
        if (cy < height - 1) {
          const n = curr + width;
          if (!visited[n]) {
            visited[n] = 1;
            if (isWhite(n)) queue.push(n);
          }
        }
      }
    }

    // Find bounding box of visible icon pixels
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const a = data[(y * width + x) * 4 + 3];
        if (a > 30) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX <= minX || maxY <= minY) {
      ctx.putImageData(imgData, 0, 0);
      return canvas.toDataURL("image/png");
    }

    ctx.putImageData(imgData, 0, 0);

    // Crop tightly to squircle bounds
    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = cropW;
    cropCanvas.height = cropH;
    const cropCtx = cropCanvas.getContext("2d");
    cropCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

    return cropCanvas.toDataURL("image/png");
  } catch (e) {
    console.warn("Icon transparency error:", e);
    return img.src;
  }
};

/**
 * ParcelDropLogo with Clean Transparent Brand Icon & Smooth Floating 'o' Pin
 */
export default function ParcelDropLogo({
  className = "",
  style = {},
  height,
  showIcon = true,
}) {
  const [slices, setSlices] = useState(() => cachedSlices);
  const [cleanIcon, setCleanIcon] = useState(() => cachedCleanIcon);
  const containerRef = useRef(null);

  // Process Icon to remove white background
  useEffect(() => {
    if (cachedCleanIcon) {
      setCleanIcon(cachedCleanIcon);
      return;
    }

    const iconImg = new Image();
    iconImg.src = parceldropIcon;
    iconImg.onload = () => {
      const transparentUrl = processTransparentIcon(iconImg);
      cachedCleanIcon = transparentUrl;
      setCleanIcon(transparentUrl);
    };
  }, []);

  // Process Logo Image into Slices ("ParcelDr" + floating "o" + "p")
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

  const iconSrc = cleanIcon || parceldropIcon;

  if (!slices) {
    return (
      <div
        className={`inline-flex items-center gap-2 select-none leading-none ${defaultHeightClass} ${className}`}
        style={resolvedStyle}
      >
        {showIcon && (
          <img
            src={iconSrc}
            alt="ParcelDrop Icon"
            className="h-[64%] w-auto aspect-square object-contain shrink-0 pointer-events-none select-none"
          />
        )}
        <img
          src={shipdropLogo}
          alt="ParcelDrop"
          className="h-full w-auto object-contain object-left"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`inline-flex items-center gap-2 select-none leading-none ${defaultHeightClass} ${className}`}
      title="ParcelDrop"
      style={resolvedStyle}
    >
      {/* 0. BRAND ICON - 100% Transparent background (no white box) & matched to capital letter height */}
      {showIcon && (
        <img
          src={iconSrc}
          alt="ParcelDrop Icon"
          className="h-[64%] w-auto aspect-square object-contain shrink-0 pointer-events-none select-none"
        />
      )}

      {/* 1. "ParcelDr" - Crisp authentic colors */}
      <img
        src={slices.left}
        alt="ParcelDr"
        className="h-full w-auto object-contain object-left block pointer-events-none"
      />

      {/* 2. "o" (Location Pin) - Authentic size & vibrant color with smooth floating animation */}
      <span className="inline-block h-full animate-logo-pin-float pointer-events-none">
        <img
          src={slices.pin}
          alt="o"
          className="h-full w-auto object-contain block"
        />
      </span>

      {/* 3. "p" */}
      <img
        src={slices.right}
        alt="p"
        className="h-full w-auto object-contain object-left block pointer-events-none"
      />
    </div>
  );
}
