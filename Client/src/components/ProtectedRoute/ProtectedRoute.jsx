import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getStoredUser,
  isSessionExpired,
  isTabActive,
  markTabActive,
  clearAuthSession,
  verifyRemoteSession,
} from "../../services/authSession";

function ProtectedRoute() {
  const location = useLocation();
  const navigate = useNavigate();

  const [checking, setChecking] = useState(() => {
    const user = getStoredUser();
    if (!user) return false;
    if (isSessionExpired(user)) return false;
    // If tab is already active, no async remote check needed on initial render
    if (isTabActive()) return false;
    // New tab / reopened tab: needs async verification
    return true;
  });

  const [authorized, setAuthorized] = useState(() => {
    const user = getStoredUser();
    if (!user) return false;
    if (isSessionExpired(user)) return false;
    if (isTabActive()) return true;
    return false; // will be resolved in useEffect
  });

  useEffect(() => {
    let isMounted = true;

    const checkAuthStatus = async () => {
      const user = getStoredUser();

      if (!user) {
        if (isMounted) {
          setAuthorized(false);
          setChecking(false);
        }
        return;
      }

      // Check 1: 24-Hour Expiration Check
      if (isSessionExpired(user)) {
        clearAuthSession();
        toast.error("Session expired after 24 hours. Please log in again.");
        if (isMounted) {
          setAuthorized(false);
          setChecking(false);
        }
        return;
      }

      // Check 2: If tab is already active from current open session
      if (isTabActive()) {
        if (isMounted) {
          setAuthorized(true);
          setChecking(false);
        }
        return;
      }

      // Check 3: Tab was newly opened or reopened after being closed.
      // Verify with backend if another device explicitly logged out!
      try {
        const verifyResult = await verifyRemoteSession(user.id, user.login_time);

        if (!isMounted) return;

        if (verifyResult && verifyResult.valid === false) {
          clearAuthSession();
          toast.error(
            verifyResult.message ||
              "Your account was logged out from another device. Please log in again."
          );
          setAuthorized(false);
          setChecking(false);
          return;
        }

        // Session is valid, mark tab as active
        markTabActive();
        setAuthorized(true);
        setChecking(false);
      } catch (err) {
        // Fail-safe: allow access if network flickered
        if (isMounted) {
          markTabActive();
          setAuthorized(true);
          setChecking(false);
        }
      }
    };

    checkAuthStatus();

    // Check 24-hour expiration periodically (every 30 seconds)
    const intervalId = setInterval(() => {
      const currentUser = getStoredUser();
      if (currentUser && isSessionExpired(currentUser)) {
        clearAuthSession();
        toast.error("Session expired after 24 hours. Please log in again.");
        setAuthorized(false);
        navigate("/login", { replace: true });
      }
    }, 30000);

    const handleSessionCleared = () => {
      setAuthorized(false);
      setChecking(false);
    };

    window.addEventListener("authSessionCleared", handleSessionCleared);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener("authSessionCleared", handleSessionCleared);
    };
  }, [location.pathname, navigate]);

  if (checking) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-[2.5px] border-slate-200 border-t-[#008dd2]" />
        <span className="mt-3 text-[12px] font-medium text-slate-400">
          Checking session...
        </span>
      </div>
    );
  }

  if (!authorized) {
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