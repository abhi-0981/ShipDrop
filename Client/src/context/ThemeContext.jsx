import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../services/api";
import {
  DEFAULT_THEME_ID,
  THEMES,
  VALID_THEME_IDS,
  getThemeById,
} from "../constants/themes";

const ThemeContext = createContext(null);

const getInitialTheme = () => {
  try {
    const local = localStorage.getItem("parceldrop_theme");
    if (local && VALID_THEME_IDS.includes(local)) {
      return local;
    }

    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (user?.theme_preference && VALID_THEME_IDS.includes(user.theme_preference)) {
        return user.theme_preference;
      }
    }
  } catch (e) {
    // Fallback on error
  }
  return DEFAULT_THEME_ID;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(getInitialTheme);
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync DOM attribute whenever currentTheme changes
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", currentTheme);
    }
  }, [currentTheme]);

  // Sync with user profile on mount or session refresh
  useEffect(() => {
    const syncThemeFromUser = () => {
      try {
        const rawUser = localStorage.getItem("user");
        if (rawUser) {
          const user = JSON.parse(rawUser);
          if (
            user?.theme_preference &&
            VALID_THEME_IDS.includes(user.theme_preference) &&
            user.theme_preference !== currentTheme
          ) {
            setCurrentTheme(user.theme_preference);
            localStorage.setItem("parceldrop_theme", user.theme_preference);
          }
        }
      } catch (e) {
        // Safe fail
      }
    };

    syncThemeFromUser();

    // Listen to storage events from other tabs
    const handleStorage = (e) => {
      if (e.key === "parceldrop_theme" && e.newValue && VALID_THEME_IDS.includes(e.newValue)) {
        setCurrentTheme(e.newValue);
      } else if (e.key === "user" && e.newValue) {
        syncThemeFromUser();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [currentTheme]);

  // Apply theme with instant feedback and persistent backend storage
  const setTheme = async (themeId, options = { saveToBackend: true }) => {
    if (!VALID_THEME_IDS.includes(themeId)) {
      console.warn(`[Theme] Invalid theme ID: ${themeId}`);
      return;
    }

    if (themeId === currentTheme) {
      return;
    }

    // 1. Instant optimistic UI update
    setCurrentTheme(themeId);
    try {
      localStorage.setItem("parceldrop_theme", themeId);

      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const user = JSON.parse(rawUser);
        user.theme_preference = themeId;
        localStorage.setItem("user", JSON.stringify(user));
      }
    } catch (e) {
      // Storage safety
    }

    // 2. Persist to backend if authenticated
    if (options.saveToBackend) {
      const token = localStorage.getItem("token");
      if (!token) {
        // User not logged in, local persistence only
        return;
      }

      try {
        setIsUpdating(true);
        const response = await api.put("/users/theme", { theme: themeId });
        if (response.data?.success) {
          toast.success(`Theme updated to ${getThemeById(themeId).name}`);
        }
      } catch (error) {
        console.error("Theme persistence error:", error);
        toast.error(
          error.response?.data?.message ||
            "Theme applied locally, but failed to save to account."
        );
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const themeConfig = useMemo(() => getThemeById(currentTheme), [currentTheme]);

  const value = useMemo(
    () => ({
      currentTheme,
      themeConfig,
      setTheme,
      isUpdating,
      availableThemes: THEMES,
    }),
    [currentTheme, themeConfig, isUpdating]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeContext;
