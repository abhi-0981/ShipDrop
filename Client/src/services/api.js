import axios from "axios";
import { parseApiError } from "../utils/errorParser";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://parceldropbackend.vercel.app/api");

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ======================================================
// REQUEST INTERCEPTOR: ATTACH BEARER TOKEN
// ======================================================

api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // Storage access safety
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ======================================================
// RESPONSE INTERCEPTOR: CONSISTENT 401 & ERROR NORMALIZATION
// ======================================================

let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";

    // Automatically parse and normalize user-friendly message
    const friendlyMessage = parseApiError(error);

    // Normalize error properties so all components across the app
    // receive the sanitized, user-friendly message automatically!
    if (error.response) {
      if (!error.response.data || typeof error.response.data !== "object") {
        error.response.data = { success: false };
      }
      error.response.data.rawMessage = error.response.data.message;
      error.response.data.message = friendlyMessage;
    }
    error.message = friendlyMessage;
    error.friendlyMessage = friendlyMessage;
    error.userMessage = friendlyMessage;

    // Ignore 401 errors on login and registration requests (bad credentials / existing account)
    const isAuthRoute =
      requestUrl.includes("/users/login") ||
      requestUrl.includes("/users/register");

    if (status === 401 && !isAuthRoute) {
      let isImpersonated = false;
      let adminReturnUrl = null;

      try {
        const rawImp = localStorage.getItem("shipdrop_impersonation");
        if (rawImp) {
          const parsed = JSON.parse(rawImp);
          if (parsed.active) {
            isImpersonated = true;
          }
          adminReturnUrl = parsed.admin_return_url;
        }
      } catch (e) {
        // Storage access safety
      }

      // If active in support mode, do not abruptly destroy session and bounce back to admin panel
      if (isImpersonated) {
        console.warn("API 401 caught while in support mode for:", requestUrl);
        return Promise.reject(error);
      }

      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("shipdrop_impersonation");
      } catch (e) {
        // Storage access safety
      }

      const publicPaths = ["/login", "/register", "/"];
      const currentPath =
        typeof window !== "undefined" ? window.location.pathname : "";

      // Guard against redirect loops and duplicate triggers from concurrent requests
      if (!isRedirecting && !publicPaths.includes(currentPath)) {
        isRedirecting = true;
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("shipdrop:session-expired"));
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;