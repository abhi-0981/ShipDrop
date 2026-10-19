import { useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";

let lastSessionCheckTime = 0;
const SESSION_CHECK_INTERVAL = 60 * 1000; // Check at most once every 60s in background

function ProtectedRoute() {
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  // Immediate redirect if no session credentials exist in storage
  if (!token || !storedUser) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // Non-blocking background session validation
  useEffect(() => {
    let isMounted = true;

    // Check if active support impersonation session
    let isImpersonated = false;
    try {
      const rawImp = localStorage.getItem("shipdrop_impersonation");
      if (rawImp) {
        const parsed = JSON.parse(rawImp);
        if (parsed.active && parsed.target_user_id) {
          isImpersonated = true;
        }
      }
    } catch {}

    const now = Date.now();
    if (!isImpersonated && now - lastSessionCheckTime < SESSION_CHECK_INTERVAL) {
      return;
    }
    lastSessionCheckTime = now;

    api
      .get("/users/session")
      .then((response) => {
        if (isMounted && response.data?.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }
      })
      .catch((error) => {
        // Only redirect on genuine 401 Unauthorized, not on network hiccups
        if (error.response?.status === 401 && !isImpersonated) {
          try {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("shipdrop_impersonation");
          } catch {}
          if (isMounted) {
            navigate("/login", { replace: true, state: { from: location.pathname } });
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [location.pathname, navigate]);

  // Instant render - eliminates the blocking "Verifying session..." screen!
  return <Outlet />;
}

export default ProtectedRoute;