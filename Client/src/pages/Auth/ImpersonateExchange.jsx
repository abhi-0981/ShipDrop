import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api, { API_BASE_URL } from "../../services/api";

function ImpersonateExchange() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying"); // 'verifying' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState("");
  const [adminReturnUrl, setAdminReturnUrl] = useState("http://localhost:5174/users");

  const hasExchangedRef = useRef(false);

  useEffect(() => {
    const ticket = searchParams.get("ticket");

    // Clean query parameter from browser address bar immediately so ticket is never in history
    if (window.history && window.history.replaceState) {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }

    if (!ticket) {
      setStatus("error");
      setErrorMessage("No impersonation ticket was provided in the request URL.");
      return;
    }

    if (hasExchangedRef.current) return;
    hasExchangedRef.current = true;

    const performExchange = async () => {
      try {
        setStatus("verifying");

        let data = null;

        // 1. Try exchanging via User backend
        try {
          const response = await api.post("/users/impersonate/exchange", { ticket });
          data = response.data;
        } catch (serverErr) {
          // 2. If user backend route fails, try Admin backend directly
          const adminApiBase = API_BASE_URL.replace(/:\d+/, ":5001");
          const fallbackRes = await fetch(`${adminApiBase}/admin/impersonate/exchange`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticket }),
          });
          data = await fallbackRes.json();
          if (!fallbackRes.ok || data.success === false) {
            throw new Error(data.message || serverErr.message || "Exchange failed");
          }
        }

        if (!data || !data.token) {
          throw new Error("Invalid exchange response received from server.");
        }

        // Store active session credentials
        localStorage.setItem("token", data.token);
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        const impersonationPayload = {
          active: true,
          admin_id: data.impersonation?.admin_id,
          admin_username: data.impersonation?.admin_username,
          target_user_id: data.user?.id,
          target_user_name: data.user?.full_name,
          target_user_email: data.user?.email,
          session_id: data.impersonation?.session_id,
          admin_return_url: data.impersonation?.admin_return_url || "http://localhost:5174/users",
          expires_at: data.impersonation?.expires_at,
          started_at: new Date().toISOString(),
        };

        setAdminReturnUrl(impersonationPayload.admin_return_url);
        localStorage.setItem(
          "shipdrop_impersonation",
          JSON.stringify(impersonationPayload)
        );

        // Notify other components if needed
        window.dispatchEvent(new CustomEvent("shipdrop:impersonation-started"));

        setStatus("success");

        // Redirect to dashboard
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 500);
      } catch (err) {
        console.error("Ticket exchange error:", err);
        setStatus("error");
        setErrorMessage(
          err.message ||
            "Unable to validate impersonation ticket. It may have expired or already been used."
        );
      }
    };

    performExchange();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#f6f8fb] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xl text-center space-y-4">
        {status === "verifying" && (
          <div className="space-y-4">
            <div className="h-12 w-12 mx-auto animate-spin rounded-full border-3 border-slate-200 border-t-[#008dd2]" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Establishing Support Session...
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Verifying single-use ticket and establishing secure merchant environment.
              </p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-3">
            <div className="h-12 w-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
              ✓
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Session Established
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Redirecting to merchant dashboard in Support Mode...
              </p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="h-12 w-12 mx-auto rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xl">
              ✕
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Impersonation Failed
              </h2>
              <p className="text-xs text-rose-600 mt-1">{errorMessage}</p>
            </div>

            <div className="pt-2">
              <a
                href={adminReturnUrl}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                Return to AdminPanel
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImpersonateExchange;
