import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://parceldropbackend.vercel.app/api");

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000, // 20s timeout to prevent infinite spinning loaders
  headers: {
    "Content-Type": "application/json",
  },
});

// ======================================================
// IN-FLIGHT GET REQUEST DEDUPLICATION
// Prevents duplicate identical concurrent GET requests
// (e.g. Navbar and Dashboard both fetching wallet at mount)
// ======================================================
const pendingGetRequests = new Map();

const buildRequestKey = (config) => {
  const method = (config.method || "get").toLowerCase();
  if (method !== "get") return null;

  // Skip deduplication if explicitly bypassed
  if (config.skipDedupe) return null;

  const url = config.url || "";
  let paramsString = "";
  if (config.params) {
    try {
      const sortedKeys = Object.keys(config.params).sort();
      const sortedObj = {};
      sortedKeys.forEach((key) => {
        sortedObj[key] = config.params[key];
      });
      paramsString = JSON.stringify(sortedObj);
    } catch {
      paramsString = String(config.params);
    }
  }

  return `${url}?${paramsString}`;
};

// Wrap axios request method to share in-flight promises
const originalRequest = api.request.bind(api);

api.request = function (config) {
  const key = buildRequestKey(config);

  if (key && pendingGetRequests.has(key)) {
    return pendingGetRequests.get(key);
  }

  const promise = originalRequest(config)
    .then((response) => {
      if (key) pendingGetRequests.delete(key);
      return response;
    })
    .catch((error) => {
      if (key) pendingGetRequests.delete(key);
      return Promise.reject(error);
    });

  if (key) {
    pendingGetRequests.set(key, promise);
  }

  return promise;
};

// Response Interceptor for user-friendly errors and timeout handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      error.userFriendlyMessage = "Request timed out. Please check your connection and try again.";
    } else if (!error.response) {
      error.userFriendlyMessage = "Network error. Please verify the server is running and try again.";
    }
    return Promise.reject(error);
  }
);

export default api;