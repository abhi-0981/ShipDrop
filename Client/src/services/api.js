import axios from "axios";
import toast from "react-hot-toast";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://parceldropbackend.vercel.app/api");

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ======================================================
// REQUEST INTERCEPTOR
// Attaches Bearer token from localStorage for seamless cross-device
// and cross-origin compatibility (alongside HttpOnly cookie)
// ======================================================
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token");
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // LocalStorage access failsafe
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ======================================================
// RESPONSE INTERCEPTOR
// Intercepts 401 Unauthorized errors (Global Logout revocation,
// 24-hour server expiry, or missing session)
// ======================================================
let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const data = error.response.data || {};
      const code = data.code;
      const message = data.message;

      // Clear local authentication state
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } catch {
        // LocalStorage access failsafe
      }

      const currentPath = window.location.pathname;
      const isPublicPath =
        currentPath === "/login" ||
        currentPath === "/register" ||
        currentPath === "/";

      if (!isPublicPath && !isRedirecting) {
        isRedirecting = true;

        if (code === "SESSION_REVOKED") {
          toast.error(
            message ||
              "Your session was logged out from another device.",
            { id: "session-revoked-toast" }
          );
        } else if (code === "SESSION_EXPIRED") {
          toast.error(
            message ||
              "Session expired after 24 hours. Please log in again.",
            { id: "session-expired-toast" }
          );
        } else if (code === "AUTH_REQUIRED" || code === "INVALID_TOKEN") {
          toast.error(message || "Please log in to continue.", {
            id: "auth-required-toast",
          });
        }

        setTimeout(() => {
          isRedirecting = false;
          window.location.href = "/login";
        }, 300);
      }
    }

    return Promise.reject(error);
  }
);

export default api;