import { useEffect, useRef } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";

function ProtectedRoute() {
  const location = useLocation();
  const navigate = useNavigate();

  const user = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  const lastVerifiedRef = useRef(0);

  useEffect(() => {
    if (!user && !token) return;

    let isMounted = true;

    // Verify session validity with backend
    const checkSession = async (force = false) => {
      const now = Date.now();
      // Throttle automatic checks to at most once per 10 seconds unless forced
      if (!force && now - lastVerifiedRef.current < 10000) return;
      lastVerifiedRef.current = now;

      try {
        await api.get("/users/verify-session");
      } catch (err) {
        if (!isMounted) return;
        // 401 triggers axios response interceptor, which cleans up and redirects
        if (err.response?.status === 401) {
          try {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
          } catch {
            // ignore
          }
          navigate("/login", { replace: true, state: { from: location.pathname } });
        }
      }
    };

    // 1. Initial verification upon entering protected routes
    checkSession(true);

    // 2. Periodic background verification (every 45 seconds) to catch Global Logout on other devices
    const interval = setInterval(() => {
      checkSession();
    }, 45000);

    // 3. Proactive verification on tab switch or wake up
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSession(true);
      }
    };

    // 4. Cross-tab logout synchronization via StorageEvent
    const handleStorageChange = (e) => {
      if ((e.key === "user" || e.key === "token") && !e.newValue) {
        navigate("/login", { replace: true });
      }
    };

    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [user, token, navigate, location.pathname]);

  if (!user && !token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;