import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import api from "../services/api";

export const THEMES = [
  {
    id: "forest-mint",
    name: "Forest Code + Mint Fog",
    subtitle: "Emerald & Crisp Mint",
    primary: "#075E46",
    primaryHover: "#054936",
    primaryRgb: "7, 94, 70",
    bg: "#E8FFF2",
    bgRgb: "232, 255, 242",
    surface: "#ffffff",
    surfaceSubtle: "#f0fdf5",
    border: "#c8edd8",
    textPrimary: "#075E46",
    textBody: "#1e293b",
    textMuted: "#4f6e5e",
    cardBg: "#ffffff",
    badgeBg: "#dcfce7",
    badgeText: "#075E46",
  },
  {
    id: "mahogany-taupe",
    name: "Deep Mahogany + Warm Taupe",
    subtitle: "Espresso & Warm Taupe",
    primary: "#1E1211",
    primaryHover: "#331f1d",
    primaryRgb: "30, 18, 17",
    bg: "#B2A39D",
    bgRgb: "178, 163, 157",
    surface: "#ffffff",
    surfaceSubtle: "#ede7e4",
    border: "#9c8c85",
    textPrimary: "#1E1211",
    textBody: "#1E1211",
    textMuted: "#4e3d37",
    cardBg: "#ffffff",
    badgeBg: "#e5deda",
    badgeText: "#1E1211",
  },
  {
    id: "purple-gray",
    name: "Midnight Purple + Neutral Gray",
    subtitle: "Midnight Violet & Neutral Gray",
    primary: "#291A40",
    primaryHover: "#3d275e",
    primaryRgb: "41, 26, 64",
    bg: "#B6B6B6",
    bgRgb: "182, 182, 182",
    surface: "#ffffff",
    surfaceSubtle: "#ededef",
    border: "#9f9ea3",
    textPrimary: "#291A40",
    textBody: "#1c1524",
    textMuted: "#534c5f",
    cardBg: "#ffffff",
    badgeBg: "#e7e4eb",
    badgeText: "#291A40",
  },
  {
    id: "forest-olive",
    name: "Forest Green + Olive Green",
    subtitle: "Dark Pine & Earthy Olive",
    primary: "#173B16",
    primaryHover: "#235722",
    primaryRgb: "23, 59, 22",
    bg: "#767D66",
    bgRgb: "118, 125, 102",
    surface: "#ffffff",
    surfaceSubtle: "#e3e7dc",
    border: "#646b55",
    textPrimary: "#173B16",
    textBody: "#112010",
    textMuted: "#3f4735",
    cardBg: "#ffffff",
    badgeBg: "#dee2d5",
    badgeText: "#173B16",
  },
  {
    id: "teal-sage",
    name: "Midnight Teal + Sage Green",
    subtitle: "Oceanic Teal & Soft Sage",
    primary: "#0B2C3D",
    primaryHover: "#13425c",
    primaryRgb: "11, 44, 61",
    bg: "#858D71",
    bgRgb: "133, 141, 113",
    surface: "#ffffff",
    surfaceSubtle: "#e3e7dc",
    border: "#727a5f",
    textPrimary: "#0B2C3D",
    textBody: "#071922",
    textMuted: "#3d4734",
    cardBg: "#ffffff",
    badgeBg: "#e0e4d7",
    badgeText: "#0B2C3D",
  },
];

export const DEFAULT_THEME_ID = "forest-mint";

const THEME_ALIASES = {
  "ocean-blue": "forest-mint",
  "forest-code-mint-fog": "forest-mint",
  "deep-mahogany-warm-taupe": "mahogany-taupe",
  "midnight-purple-neutral-gray": "purple-gray",
  "forest-green-olive-green": "forest-olive",
  "midnight-teal-sage-green": "teal-sage",
};

export const normalizeThemeId = (id) => {
  if (!id || typeof id !== "string") return DEFAULT_THEME_ID;
  const trimmed = id.trim().toLowerCase();
  if (THEME_ALIASES[trimmed]) return THEME_ALIASES[trimmed];
  const found = THEMES.find((t) => t.id === trimmed);
  return found ? found.id : DEFAULT_THEME_ID;
};

export const applyThemeToDom = (themeId) => {
  if (typeof document === "undefined") return null;
  const normalized = normalizeThemeId(themeId);
  const theme = THEMES.find((t) => t.id === normalized) || THEMES[0];
  const root = document.documentElement;

  root.setAttribute("data-theme", theme.id);
  root.style.setProperty("--theme-primary", theme.primary);
  root.style.setProperty("--theme-primary-hover", theme.primaryHover);
  root.style.setProperty("--theme-primary-rgb", theme.primaryRgb);
  root.style.setProperty("--theme-bg", theme.bg);
  root.style.setProperty("--theme-bg-rgb", theme.bgRgb);
  root.style.setProperty("--theme-surface", theme.surface);
  root.style.setProperty("--theme-surface-subtle", theme.surfaceSubtle);
  root.style.setProperty("--theme-border", theme.border);
  root.style.setProperty("--theme-text-primary", theme.textPrimary);
  root.style.setProperty("--theme-text-body", theme.textBody);
  root.style.setProperty("--theme-text-muted", theme.textMuted);
  root.style.setProperty("--theme-card-bg", theme.cardBg);

  return theme;
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [themeId, setThemeIdState] = useState(() => {
    try {
      const cached = localStorage.getItem("parceldrop_theme");
      if (cached) return normalizeThemeId(cached);

      const userRaw = localStorage.getItem("user");
      if (userRaw) {
        const user = JSON.parse(userRaw);
        if (user?.theme_preference) {
          return normalizeThemeId(user.theme_preference);
        }
      }
    } catch {
      // LocalStorage error resilience
    }
    return DEFAULT_THEME_ID;
  });

  const [saving, setSaving] = useState(false);

  // Apply to DOM immediately
  useEffect(() => {
    applyThemeToDom(themeId);
  }, [themeId]);

  // Sync theme with authenticated user's DB preference on initial mount
  useEffect(() => {
    let isMounted = true;

    const syncThemeWithServer = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await api.get("/users/theme");
        if (response.data?.success && response.data?.theme) {
          const serverTheme = normalizeThemeId(response.data.theme);
          if (isMounted) {
            setThemeIdState((prev) => {
              if (prev !== serverTheme) {
                try {
                  localStorage.setItem("parceldrop_theme", serverTheme);
                } catch {
                  // Ignore localStorage error
                }
                applyThemeToDom(serverTheme);
                return serverTheme;
              }
              return prev;
            });
          }
        }
      } catch {
        // Silently preserve local cache if server is unreachable
      }
    };

    syncThemeWithServer();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handler to switch theme with optimistic UI + async persistence
  const changeTheme = useCallback(async (newId) => {
    const normalized = normalizeThemeId(newId);

    // 1. Instant optimistic update
    setThemeIdState(normalized);
    applyThemeToDom(normalized);

    try {
      localStorage.setItem("parceldrop_theme", normalized);
      const userRaw = localStorage.getItem("user");
      if (userRaw) {
        const user = JSON.parse(userRaw);
        user.theme_preference = normalized;
        localStorage.setItem("user", JSON.stringify(user));
      }
    } catch {
      // Storage safety
    }

    // 2. Persist to DB if logged in
    const token = localStorage.getItem("token");
    if (token) {
      try {
        setSaving(true);
        await api.put("/users/theme", { theme: normalized });
      } catch (err) {
        console.error("Failed to persist theme preference to server:", err);
      } finally {
        setSaving(false);
      }
    }
  }, []);

  const currentTheme = useMemo(() => {
    return THEMES.find((t) => t.id === themeId) || THEMES[0];
  }, [themeId]);

  const value = useMemo(
    () => ({
      theme: currentTheme,
      themeId,
      themes: THEMES,
      setTheme: changeTheme,
      saving,
    }),
    [currentTheme, themeId, changeTheme, saving]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
