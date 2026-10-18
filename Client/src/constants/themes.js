// ============================================================================
// PARCELDROP THEME CONFIGURATION — BOLD MODERN SAAS PALETTES
// ============================================================================

export const DEFAULT_THEME_ID = "ocean-blue";

export const THEMES = [
  {
    id: "ocean-blue",
    name: "ParcelDrop Classic",
    isDefault: true,
    tagline: "Signature Sky Blue",
    description:
      "Crisp, vibrant sky-blue palette designed for everyday parcel operations and maximum speed.",
    colors: {
      primary: "#008DD2",
      gradient: "linear-gradient(135deg, #008DD2 0%, #0070A6 100%)",
      glow: "rgba(0, 141, 210, 0.3)",
      background: "#FFFFFF",
      text: "#172033",
      surface: "#FFFFFF",
      canvas: "#F6F8FB",
      muted: "#64748B",
      border: "#E2E8F0",
      accent: "#007bb8",
      light: "#EDF8FF",
    },
    swatches: [
      { label: "Primary", hex: "#008DD2" },
      { label: "Canvas", hex: "#F6F8FB" },
      { label: "Text", hex: "#172033" },
      { label: "Surface", hex: "#FFFFFF" },
    ],
  },
  {
    id: "forest-mint",
    name: "Cyber Emerald",
    isDefault: false,
    tagline: "Electric Mint & Deep Forest",
    description:
      "Vibrant high-contrast fintech aesthetic with glowing emerald gradients, mint-tinted air canvas, and razor-sharp white cards.",
    colors: {
      primary: "#059669",
      gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      glow: "rgba(16, 185, 129, 0.35)",
      background: "#F0FDF4",
      text: "#064E3B",
      surface: "#FFFFFF",
      canvas: "#F0FDF4",
      muted: "#047857",
      border: "#A7F3D0",
      accent: "#047857",
      light: "#ECFDF5",
    },
    swatches: [
      { label: "Primary", hex: "#10B981" },
      { label: "Accent", hex: "#059669" },
      { label: "Canvas", hex: "#F0FDF4" },
      { label: "Text", hex: "#064E3B" },
    ],
  },
  {
    id: "mahogany-taupe",
    name: "Sunset Blaze",
    isDefault: false,
    tagline: "Hyper-Growth Amber & Solar",
    description:
      "Bold, energetic sunset gradient with warm luminous champagne canvas. Designed to feel fast, dynamic, and inspiring.",
    colors: {
      primary: "#EA580C",
      gradient: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
      glow: "rgba(249, 115, 22, 0.35)",
      background: "#FFFBEB",
      text: "#1C1917",
      surface: "#FFFFFF",
      canvas: "#FFFBEB",
      muted: "#78716C",
      border: "#FDE68A",
      accent: "#C2410C",
      light: "#FEF3C7",
    },
    swatches: [
      { label: "Primary", hex: "#F97316" },
      { label: "Accent", hex: "#EA580C" },
      { label: "Canvas", hex: "#FFFBEB" },
      { label: "Text", hex: "#1C1917" },
    ],
  },
  {
    id: "midnight-purple",
    name: "Electric Violet",
    isDefault: false,
    tagline: "Cosmic Iris & Royal Neon",
    description:
      "Modern high-tech AI aesthetic with electric violet-to-indigo gradients, soft lavender air canvas, and high-impact contrast.",
    colors: {
      primary: "#7C3AED",
      gradient: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",
      glow: "rgba(139, 92, 246, 0.35)",
      background: "#F5F3FF",
      text: "#1E1B4B",
      surface: "#FFFFFF",
      canvas: "#F5F3FF",
      muted: "#5B21B6",
      border: "#DDD6FE",
      accent: "#6D28D9",
      light: "#EDE9FE",
    },
    swatches: [
      { label: "Primary", hex: "#8B5CF6" },
      { label: "Accent", hex: "#6366F1" },
      { label: "Canvas", hex: "#F5F3FF" },
      { label: "Text", hex: "#1E1B4B" },
    ],
  },
  {
    id: "forest-olive",
    name: "Crimson Velocity",
    isDefault: false,
    tagline: "Vibrant Racing Ruby & Coral",
    description:
      "Bold, high-octane crimson rose gradient with bright energetic accents. Unmistakable presence and razor-sharp clarity.",
    colors: {
      primary: "#E11D48",
      gradient: "linear-gradient(135deg, #FB7185 0%, #E11D48 100%)",
      glow: "rgba(225, 29, 72, 0.35)",
      background: "#FFF1F2",
      text: "#0F172A",
      surface: "#FFFFFF",
      canvas: "#FFF1F2",
      muted: "#9F1239",
      border: "#FECDD3",
      accent: "#BE123C",
      light: "#FFE4E6",
    },
    swatches: [
      { label: "Primary", hex: "#FB7185" },
      { label: "Accent", hex: "#E11D48" },
      { label: "Canvas", hex: "#FFF1F2" },
      { label: "Text", hex: "#0F172A" },
    ],
  },
  {
    id: "midnight-teal",
    name: "Oceanic Aqua",
    isDefault: false,
    tagline: "Electric Cyan & Glacier Blue",
    description:
      "Striking maritime tech gradient transitioning from electric aqua into deep arctic cobalt. Modern, crystal-clear, and bold.",
    colors: {
      primary: "#0284C7",
      gradient: "linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)",
      glow: "rgba(6, 182, 212, 0.35)",
      background: "#ECFEFF",
      text: "#082F49",
      surface: "#FFFFFF",
      canvas: "#ECFEFF",
      muted: "#0369A1",
      border: "#BAE6FD",
      accent: "#0369A1",
      light: "#E0F2FE",
    },
    swatches: [
      { label: "Primary", hex: "#06B6D4" },
      { label: "Accent", hex: "#0284C7" },
      { label: "Canvas", hex: "#ECFEFF" },
      { label: "Text", hex: "#082F49" },
    ],
  },
];

export const VALID_THEME_IDS = THEMES.map((t) => t.id);

export const getThemeById = (id) => {
  if (!id) return THEMES[0];
  const found = THEMES.find((t) => t.id === id);
  return found || THEMES[0];
};
