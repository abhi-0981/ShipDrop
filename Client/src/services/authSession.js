import api from "./api";

// 24 Hours in milliseconds
export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const TAB_SESSION_KEY = "shipdrop_tab_session_active";

/**
 * Get current stored user safely from localStorage
 */
export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (err) {
    return null;
  }
};

/**
 * Save user to localStorage with login timestamp and session version,
 * and mark the current browser tab as active.
 */
export const saveUserSession = (user, explicitLoginTime = null, explicitVersion = null) => {
  if (!user || typeof user !== "object") return;
  const loginTime = explicitLoginTime || user.login_time || Date.now();
  const sessionVersion =
    explicitVersion !== null && explicitVersion !== undefined
      ? explicitVersion
      : (user.session_version || 1);

  const userWithTimestamp = {
    ...user,
    login_time: loginTime,
    session_version: sessionVersion,
  };

  localStorage.setItem("user", JSON.stringify(userWithTimestamp));
  markTabActive();
};

/**
 * Mark the current browser tab as actively engaged in the session
 * (sessionStorage is automatically destroyed when the tab is closed)
 */
export const markTabActive = () => {
  try {
    sessionStorage.setItem(TAB_SESSION_KEY, "1");
  } catch (err) {
    // Ignore storage quota / privacy mode errors
  }
};

/**
 * Check if this specific tab has an active in-memory session
 */
export const isTabActive = () => {
  try {
    return sessionStorage.getItem(TAB_SESSION_KEY) === "1";
  } catch (err) {
    return false;
  }
};

/**
 * Check if the 24-hour absolute session duration has elapsed
 */
export const isSessionExpired = (user) => {
  if (!user) return true;
  if (!user.login_time) {
    // If login_time is missing (e.g. legacy session), set it now so they don't get kicked out
    user.login_time = Date.now();
    try {
      localStorage.setItem("user", JSON.stringify(user));
    } catch (e) {}
    return false;
  }
  const age = Date.now() - Number(user.login_time);
  return age >= SESSION_MAX_AGE_MS;
};

/**
 * Clear local authentication state across localStorage and sessionStorage
 */
export const clearAuthSession = () => {
  try {
    localStorage.removeItem("user");
    sessionStorage.removeItem(TAB_SESSION_KEY);
  } catch (err) {
    // Ignore
  }

  // Notify any listeners across the app
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("authSessionCleared"));
  }
};

/**
 * Perform server logout to invalidate all sessions across other devices
 */
export const logoutFromServer = async (userId) => {
  try {
    if (userId) {
      await api.post("/users/logout", { user_id: userId }).catch(() => {});
    }
  } catch (err) {
    console.error("Server logout error:", err);
  } finally {
    clearAuthSession();
  }
};

/**
 * Query backend to check if an explicit logout occurred on another device
 * (which increments session_version in the database)
 */
export const verifyRemoteSession = async (userId, sessionVersion) => {
  try {
    if (!userId) return { valid: true };

    const response = await api.post("/users/verify-session", {
      user_id: userId,
      session_version: sessionVersion !== undefined && sessionVersion !== null ? sessionVersion : 1,
    });

    return response.data || { valid: true };
  } catch (err) {
    // If backend is momentarily unreachable or returned an error,
    // do NOT kick the user out of their own laptop. Fail-open safely.
    return { valid: true };
  }
};
