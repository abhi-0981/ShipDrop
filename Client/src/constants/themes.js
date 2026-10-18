// ============================================================================
// PARCELDROP THEME CONFIGURATION — EXECUTIVE ENTERPRISE PALETTES
// ============================================================================

export const DEFAULT_THEME_ID = "ocean-blue";

export const THEMES = [
  {
    id: "ocean-blue",
    name: "ParcelDrop Classic",
    isDefault: true,
    tagline: "Signature Logistics Blue",
    description:
      "Crisp, vibrant sky-blue palette designed for everyday parcel operations and maximum speed.",
    colors: {
      primary: "#008DD2",
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
    name: "Pine Executive",
    isDefault: false,
    tagline: "Prestigious Mercury Emerald",
    description:
      "Deep sovereign pine emerald accent set against a pristine titanium-slate canvas for an authoritative, high-wealth fintech feel.",
    colors: {
      primary: "#064E3B",
      background: "#F8FAFC",
      text: "#0F172A",
      surface: "#FFFFFF",
      canvas: "#F8FAFC",
      muted: "#64748B",
      border: "#E2E8F0",
      accent: "#043D2E",
      light: "#F0FDF4",
    },
    swatches: [
      { label: "Primary", hex: "#064E3B" },
      { label: "Canvas", hex: "#F8FAFC" },
      { label: "Text", hex: "#0F172A" },
      { label: "Surface", hex: "#FFFFFF" },
    ],
  },
  {
    id: "mahogany-taupe",
    name: "Obsidian Noir",
    isDefault: false,
    tagline: "Linear & Apple Pro Minimalist",
    description:
      "Deep architectural slate obsidian primary with pure monochromatic precision. Clean, focused, and distraction-free.",
    colors: {
      primary: "#0F172A",
      background: "#F8FAFC",
      text: "#0F172A",
      surface: "#FFFFFF",
      canvas: "#F8FAFC",
      muted: "#64748B",
      border: "#E2E8F0",
      accent: "#1E293B",
      light: "#F1F5F9",
    },
    swatches: [
      { label: "Primary", hex: "#0F172A" },
      { label: "Canvas", hex: "#F8FAFC" },
      { label: "Text", hex: "#0F172A" },
      { label: "Surface", hex: "#FFFFFF" },
    ],
  },
  {
    id: "midnight-purple",
    name: "Sapphire Indigo",
    isDefault: false,
    tagline: "Stripe & Ramp Enterprise",
    description:
      "The global benchmark for modern enterprise software. Deep royal sapphire indigo paired with crisp white cards.",
    colors: {
      primary: "#4338CA",
      background: "#F8FAFC",
      text: "#0F172A",
      surface: "#FFFFFF",
      canvas: "#F8FAFC",
      muted: "#64748B",
      border: "#E2E8F0",
      accent: "#3730A3",
      light: "#EEF2FF",
    },
    swatches: [
      { label: "Primary", hex: "#4338CA" },
      { label: "Canvas", hex: "#F8FAFC" },
      { label: "Text", hex: "#0F172A" },
      { label: "Surface", hex: "#FFFFFF" },
    ],
  },
  {
    id: "forest-olive",
    name: "Cognac Heritage",
    isDefault: false,
    tagline: "Warm Luxury & Artisanal Bronze",
    description:
      "Deep burnt cognac terracotta on warm alabaster. Brings timeless horology and luxury artisanal character to your dashboard.",
    colors: {
      primary: "#9A3412",
      background: "#FBFBFA",
      text: "#1C1917",
      surface: "#FFFFFF",
      canvas: "#FBFBFA",
      muted: "#78716C",
      border: "#E7E5E4",
      accent: "#7C2D12",
      light: "#FFF7ED",
    },
    swatches: [
      { label: "Primary", hex: "#9A3412" },
      { label: "Canvas", hex: "#FBFBFA" },
      { label: "Text", hex: "#1C1917" },
      { label: "Surface", hex: "#FFFFFF" },
    ],
  },
  {
    id: "midnight-teal",
    name: "Oceanic Cobalt",
    isDefault: false,
    tagline: "Global Maritime Executive",
    description:
      "Deep maritime oceanic cobalt blue engineered for high-volume shipping leaders, logistics intelligence, and global trade.",
    colors: {
      primary: "#0369A1",
      background: "#F8FAFC",
      text: "#0F172A",
      surface: "#FFFFFF",
      canvas: "#F8FAFC",
      muted: "#64748B",
      border: "#E2E8F0",
      accent: "#075985",
      light: "#F0F9FF",
    },
    swatches: [
      { label: "Primary", hex: "#0369A1" },
      { label: "Canvas", hex: "#F8FAFC" },
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
