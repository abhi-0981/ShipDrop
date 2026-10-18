import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import api from "../../services/api";

function ProtectedRoute() {
  const location = useLocation();

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

  // Check if current session is an active admin support (impersonation) session
  let isImpersonated = false;
  try {
    const rawImp = localStorage.getItem("shipdrop_impersonation");
    if (rawImp) {
      const parsed = JSON.parse(rawImp);
      if (parsed.active && parsed.target_user_id) {
        isImpersonated = true;
      }
    }
  } catch (e) {
    // Storage access safety
  }

  // Support mode sessions are verified by the single-use ticket exchange, so bypass blocking loader
  const [isValidating, setIsValidating] = useState(!isImpersonated);
  const [isValidSession, setIsValidSession] = useState(isImpersonated);

  useEffect(() => {
    let isMounted = true;

    // If support mode is active, do not block the UI or wipe credentials on background check
    if (isImpersonated) {
      setIsValidSession(true);
      setIsValidating(false);

      // Opportunistically fetch session updates in background without blocking
      api
        .get("/users/session")
        .then((response) => {
          if (isMounted && response.data?.user) {
            localStorage.setItem("user", JSON.stringify(response.data.user));
          }
        })
        .catch((err) => {
          console.warn("Background session check in support mode:", err.message);
        });

      return () => {
        isMounted = false;
      };
    }

    const validateSession = async () => {
      try {
        const response = await api.get("/users/session");
        if (isMounted) {
          if (response.data?.user) {
            localStorage.setItem("user", JSON.stringify(response.data.user));
          }
          setIsValidSession(true);
          setIsValidating(false);
        }
      } catch (error) {
        if (isMounted) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setIsValidSession(false);
          setIsValidating(false);
        }
      }
    };

    validateSession();

    return () => {
      isMounted = false;
    };
  }, [isImpersonated]);

  // Do not expose protected pages before server-side validation completes
  if (isValidating) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-[2.5px] border-slate-200 border-t-[#008dd2]" />
        <span className="mt-3 text-[12px] font-medium text-slate-400">
          Verifying session...
        </span>
      </div>
    );
  }

  if (!isValidSession) {
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