import axios from "axios";

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
// RESPONSE INTERCEPTOR: CONSISTENT 401 HANDLING
// ======================================================

let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";

    // Ignore 401 errors on login and registration requests (bad credentials / existing account)
    const isAuthRoute =
      requestUrl.includes("/users/login") ||
      requestUrl.includes("/users/register");

    if (status === 401 && !isAuthRoute) {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
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