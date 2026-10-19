import api from "./api";

// In-flight deduplication & small cache
let inFlightRequest = null;
let lastFetchTime = 0;
let cachedCounts = null;

/**
 * Fetch authoritative order status counts directly from the backend database.
 * Deduplicates in-flight requests and avoids spamming the API.
 */
export const fetchOrderStatusCounts = async (userId, force = false) => {
  if (!userId) return null;

  const now = Date.now();

  // If a request is already running, reuse it
  if (inFlightRequest) {
    return inFlightRequest;
  }

  // If called within 1500ms without force, return the cached result instantly
  if (!force && cachedCounts && now - lastFetchTime < 1500) {
    return cachedCounts;
  }

  inFlightRequest = api
    .get("/orders/status-counts", {
      params: { user_id: userId },
    })
    .then((res) => {
      inFlightRequest = null;
      lastFetchTime = Date.now();
      if (res?.data?.success && res?.data?.counts) {
        cachedCounts = res.data.counts;
        return res.data.counts;
      }
      return null;
    })
    .catch((err) => {
      inFlightRequest = null;
      console.error("fetchOrderStatusCounts error:", err);
      return null;
    });

  return inFlightRequest;
};

/**
 * Centrally notify all components, sidebar, and open browser tabs
 * whenever an order is created, deleted, updated, or moved to another status.
 */
export const notifyOrderChange = (detail = {}) => {
  if (typeof window === "undefined") return;

  // Invalidate cached counts on any mutation
  cachedCounts = null;
  lastFetchTime = 0;

  // 1. Dispatch standard unified events on the current window
  window.dispatchEvent(
    new CustomEvent("shipdrop:orders-updated", { detail })
  );
  window.dispatchEvent(
    new CustomEvent("orderStatusUpdated", { detail })
  );

  // 2. Dispatch legacy/specific events for granular listeners
  if (detail.type === "created" || detail.action === "created") {
    window.dispatchEvent(
      new CustomEvent("processingOrderCreated", { detail })
    );
  }
  if (detail.type === "updated" || detail.action === "updated") {
    window.dispatchEvent(
      new CustomEvent("processingOrderUpdated", { detail })
    );
    window.dispatchEvent(
      new CustomEvent("orderUpdated", { detail })
    );
  }
  if (detail.type === "deleted" || detail.action === "deleted") {
    window.dispatchEvent(
      new CustomEvent("orderDeleted", { detail })
    );
    window.dispatchEvent(
      new CustomEvent("ordersDeleted", { detail })
    );
  }

  // 3. Broadcast across other tabs/windows in real time
  try {
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel("shipdrop_orders_channel");
      channel.postMessage({ timestamp: Date.now(), ...detail });
      channel.close();
    }
  } catch (e) {
    // ignore broadcast channel errors
  }

  // 4. LocalStorage fallback for older browsers or cross-tab sync
  try {
    localStorage.setItem(
      "shipdrop:last_order_update",
      String(Date.now())
    );
  } catch (e) {
    // ignore storage quota errors
  }
};

/**
 * Setup global cross-tab synchronization listener.
 * Listens for updates in other tabs and dispatches local events.
 */
export const setupOrderCrossTabSync = () => {
  if (typeof window === "undefined") return () => {};

  let channel = null;
  try {
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel("shipdrop_orders_channel");
      channel.onmessage = (event) => {
        const detail = event?.data || {};
        window.dispatchEvent(
          new CustomEvent("shipdrop:orders-updated", { detail })
        );
        window.dispatchEvent(
          new CustomEvent("orderStatusUpdated", { detail })
        );
      };
    }
  } catch (e) {
    // BroadcastChannel unsupported
  }

  const handleStorage = (e) => {
    if (e.key === "shipdrop:last_order_update") {
      window.dispatchEvent(
        new CustomEvent("shipdrop:orders-updated", {
          detail: { type: "remote" },
        })
      );
      window.dispatchEvent(
        new CustomEvent("orderStatusUpdated", {
          detail: { type: "remote" },
        })
      );
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    if (channel) {
      channel.close();
    }
    window.removeEventListener("storage", handleStorage);
  };
};

/**
 * Helper hook / listener to attach order update subscriptions
 */
export const subscribeToOrderUpdates = (callback) => {
  if (typeof window === "undefined" || typeof callback !== "function") {
    return () => {};
  }

  const handler = (e) => callback(e?.detail || {});

  const events = [
    "shipdrop:orders-updated",
    "orderStatusUpdated",
    "processingOrderCreated",
    "processingOrderUpdated",
    "orderDeleted",
    "ordersDeleted",
  ];

  events.forEach((evt) => window.addEventListener(evt, handler));

  return () => {
    events.forEach((evt) => window.removeEventListener(evt, handler));
  };
};
