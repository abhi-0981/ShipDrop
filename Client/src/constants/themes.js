// ============================================================================
// PARCELDROP THEME CONFIGURATION — MODERN HIGH-CONTRAST PALETTES
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
      background: "#FFFFFF",
      text: "#172033",
      surface: "#FFFFFF",
      canvas: "#f6f8fb",
      muted: "#64748B",
      border: "#E2E8F0",
      accent: "#007bb8",
      light: "#EDF8FF",
    },
    swatches: [
      { label: "Primary", hex: "#008DD2" },
      { label: "Background", hex: "#F6F8FB" },
      { label: "Text", hex: "#172033" },
      { label: "Surface", hex: "#FFFFFF" },
    ],
  },
  {
    id: "forest-mint",
    name: "Emerald Mint",
    isDefault: false,
    tagline: "Fresh Botanical Green",
    description:
      "Invigorating fintech emerald primary paired with crisp mint canvas and clean white surfaces.",
    colors: {
      primary: "#059669",
      background: "#F0FDF4",
      text: "#0F172A",
      surface: "#FFFFFF",
      canvas: "#F0FDF4",
      muted: "#64748B",
      border: "#D1FAE5",
      accent: "#047857",
      light: "#ECFDF5",
    },
    swatches: [
      { label: "Primary", hex: "#059669" },
      { label: "Background", hex: "#F0FDF4" },
      { label: "Text", hex: "#0F172A" },
      { label: "Surface", hex: "#FFFFFF" },
    ],
  },
  {
    id: "mahogany-taupe",
    name: "Sunset Amber",
    isDefault: false,
    tagline: "Warm Luxury Copper",
    description:
      "Warm artisanal sunset amber paired with luminous champagne ivory canvas and crisp cards.",
    colors: {
      primary: "#EA580C",
      background: "#FFF7ED",
      text: "#1C1917",
      surface: "#FFFFFF",
      canvas: "#FFF7ED",
      muted: "#78716C",
      border: "#FED7AA",
      accent: "#C2410C",
      light: "#FFEDD5",
    },
    swatches: [
      { label: "Primary", hex: "#EA580C" },
      { label: "Background", hex: "#FFF7ED" },
      { label: "Text", hex: "#1C1917" },
      { label: "Surface", hex: "#FFFFFF" },
    ],
  },
  {
    id: "midnight-purple",
    name: "Royal Violet",
    isDefault: false,
    tagline: "Modern High-Tech Iris",
    description:
      "Electric royal violet primary layered over clean lavender-tinted canvas with deep contrast text.",
    colors: {
      primary: "#7C3AED",
      background: "#F5F3FF",
      text: "#1E1B4B",
      surface: "#FFFFFF",
      canvas: "#F5F3FF",
      muted: "#6B7280",
      border: "#DDD6FE",
      accent: "#6D28D9",
      light: "#EDE9FE",
    },
    swatches: [
      { label: "Primary", hex: "#7C3AED" },
      { label: "Background", hex: "#F5F3FF" },
      { label: "Text", hex: "#1E1B4B" },
      { label: "Surface", hex: "#FFFFFF" },
    ],
  },
  {
    id: "forest-olive",
    name: "Rose Ruby",
    isDefault: false,
    tagline: "Bold Crimson Velvet",
    description:
      "Vibrant modern rose-ruby accent on a soft porcelain canvas with high-contrast typography.",
    colors: {
      primary: "#E11D48",
      background: "#FFF1F2",
      text: "#0F172A",
      surface: "#FFFFFF",
      canvas: "#FFF1F2",
      muted: "#64748B",
      border: "#FECDD3",
      accent: "#BE123C",
      light: "#FFE4E6",
    },
    swatches: [
      { label: "Primary", hex: "#E11D48" },
      { label: "Background", hex: "#FFF1F2" },
      { label: "Text", hex: "#0F172A" },
      { label: "Surface", hex: "#FFFFFF" },
    ],
  },
  {
    id: "midnight-teal",
    name: "Arctic Cyan",
    isDefault: false,
    tagline: "Glacier Deep Ocean",
    description:
      "Striking arctic teal primary paired with pure glacier-fresh canvas and crisp clean cards.",
    colors: {
      primary: "#0D9488",
      background: "#F0FDFA",
      text: "#0F172A",
      surface: "#FFFFFF",
      canvas: "#F0FDFA",
      muted: "#64748B",
      border: "#CCFBF1",
      accent: "#0F766E",
      light: "#E6FFFA",
    },
    swatches: [
      { label: "Primary", hex: "#0D9488" },
      { label: "Background", hex: "#F0FDFA" },
      { label: "Text", hex: "#0F172A" },
      { label: "Surface", hex: "#FFFFFF" },
    ],
  },
];

export const VALID_THEME_IDS = THEMES.map((t) => t.id);

export const getThemeById = (id) => {
  if (!id) return THEMES[0];
  const found = THEMES.find((t) => t.id === id);
  return found || THEMES[0];
};
