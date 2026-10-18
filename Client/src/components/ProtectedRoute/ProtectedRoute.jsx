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

  const [isValidating, setIsValidating] = useState(true);
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const validateSession = async () => {
      try {
        const response = await api.get("/users/session");
        if (isMounted) {
          if (response.data?.user) {
            localStorage.setItem("user", JSON.stringify(response.data.user));
            if (response.data.user.theme_preference) {
              localStorage.setItem(
                "parceldrop_theme",
                response.data.user.theme_preference
              );
            }
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
  }, []);

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