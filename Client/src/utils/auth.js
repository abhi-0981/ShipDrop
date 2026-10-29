/**
 * Checks whether the user has an active, unexpired session in localStorage (< 24 hours).
 * Validates existence of token & user, and inspects JWT exp claim without blocking network latency.
 */
export function hasActiveSession() {
  if (typeof window === "undefined") return false;

  try {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      return false;
    }

    // Parse user object safely
    try {
      const parsedUser = JSON.parse(user);
      if (!parsedUser?.id && !parsedUser?.user_id) {
        return false;
      }
    } catch {
      return false;
    }

    // Inspect JWT payload expiration
    const parts = token.split(".");
    if (parts.length !== 3) {
      return false;
    }

    // atob decode base64url payload
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const payload = JSON.parse(jsonPayload);

    // If token has expired (> 24 hours), clean up and treat as not logged in
    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
