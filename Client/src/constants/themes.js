// ============================================================================
// PARCELDROP THEME CONFIGURATION
// ============================================================================

export const DEFAULT_THEME_ID = "ocean-blue";

export const THEMES = [
  {
    id: "ocean-blue",
    name: "ParcelDrop Classic",
    isDefault: true,
    tagline: "Signature Default",
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
      { label: "Background", hex: "#FFFFFF" },
      { label: "Text", hex: "#172033" },
      { label: "Surface", hex: "#FFFFFF" },
    ],
  },
  {
    id: "forest-mint",
    name: "Forest Mint",
    isDefault: false,
    tagline: "Botanical & Fresh",
    description:
      "Invigorating botanical emerald primary set against a clean, refreshing mint canvas.",
    colors: {
      primary: "#075E46",
      background: "#E8FFF2",
      text: "#064E3B",
      surface: "#FFFFFF",
      canvas: "#E8FFF2",
      muted: "#1e6b56",
      border: "#BCEBD2",
      accent: "#054835",
      light: "#D8F5E5",
    },
    swatches: [
      { label: "Primary", hex: "#075E46" },
      { label: "Background", hex: "#E8FFF2" },
      { label: "Text", hex: "#064E3B" },
      { label: "Surface", hex: "#FFFFFF" },
    ],
  },
  {
    id: "mahogany-taupe",
    name: "Mahogany Taupe",
    isDefault: false,
    tagline: "Warm & Earthy",
    description:
      "Warm artisanal espresso mahogany paired with refined taupe and porcelain card surfaces.",
    colors: {
      primary: "#1E1211",
      background: "#B2A39D",
      text: "#2A1D1A",
      surface: "#F2EAE6",
      canvas: "#B2A39D",
      muted: "#574642",
      border: "#9F8F88",
      accent: "#382523",
      light: "#E5DEDA",
    },
    swatches: [
      { label: "Primary", hex: "#1E1211" },
      { label: "Background", hex: "#B2A39D" },
      { label: "Text", hex: "#2A1D1A" },
      { label: "Surface", hex: "#F2EAE6" },
    ],
  },
  {
    id: "midnight-purple",
    name: "Midnight Purple",
    isDefault: false,
    tagline: "Twilight & Sleek",
    description:
      "Rich cosmic nightshade purple layered over subtle silver-mist and soft lavender cards.",
    colors: {
      primary: "#291A40",
      background: "#B6B6B6",
      text: "#241832",
      surface: "#F1F0F3",
      canvas: "#B6B6B6",
      muted: "#554A65",
      border: "#A4A2A8",
      accent: "#402C60",
      light: "#E4E0EC",
    },
    swatches: [
      { label: "Primary", hex: "#291A40" },
      { label: "Background", hex: "#B6B6B6" },
      { label: "Text", hex: "#241832" },
      { label: "Surface", hex: "#F1F0F3" },
    ],
  },
  {
    id: "forest-olive",
    name: "Forest Olive",
    isDefault: false,
    tagline: "Tactical & Grounded",
    description:
      "Deep evergreen forest shadow combined with rugged sage olive canvas and parchment surfaces.",
    colors: {
      primary: "#173B16",
      background: "#767D66",
      text: "#182817",
      surface: "#E8EBDD",
      canvas: "#767D66",
      muted: "#495443",
      border: "#5F6851",
      accent: "#2A5A29",
      light: "#DBE4CB",
    },
    swatches: [
      { label: "Primary", hex: "#173B16" },
      { label: "Background", hex: "#767D66" },
      { label: "Text", hex: "#182817" },
      { label: "Surface", hex: "#E8EBDD" },
    ],
  },
  {
    id: "midnight-teal",
    name: "Midnight Teal",
    isDefault: false,
    tagline: "Ocean Abyss & Moss",
    description:
      "Abyssal deep teal paired with natural moss-sage backdrops and clean stone-white components.",
    colors: {
      primary: "#0B2C3D",
      background: "#858D71",
      text: "#142D32",
      surface: "#E8EBDD",
      canvas: "#858D71",
      muted: "#485C5B",
      border: "#6D765B",
      accent: "#164861",
      light: "#D8E2CF",
    },
    swatches: [
      { label: "Primary", hex: "#0B2C3D" },
      { label: "Background", hex: "#858D71" },
      { label: "Text", hex: "#142D32" },
      { label: "Surface", hex: "#E8EBDD" },
    ],
  },
];

export const VALID_THEME_IDS = THEMES.map((t) => t.id);

export const getThemeById = (id) => {
  if (!id) return THEMES[0];
  const found = THEMES.find((t) => t.id === id);
  return found || THEMES[0];
};
