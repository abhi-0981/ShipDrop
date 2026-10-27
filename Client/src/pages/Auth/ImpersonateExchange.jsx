import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";

const getAdminApiBase = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5001/api";
    }
  }
  return (
    import.meta.env.VITE_ADMIN_API_URL ||
    "https://parceldropadminapi-blond.vercel.app/api"
  );
};

function ImpersonateExchange() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying"); // 'verifying' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState("");
  const [adminReturnUrl, setAdminReturnUrl] = useState("http://localhost:5174/users");

  const ticketRef = useRef(null);
  const hasExchangedRef = useRef(false);

  useEffect(() => {
    // Cache ticket on first mount before any URL replaceState
    if (!ticketRef.current) {
      ticketRef.current =
        searchParams.get("ticket") ||
        new URLSearchParams(window.location.search).get("ticket");
    }

    const ticket = ticketRef.current;

    if (!ticket) {
      if (hasExchangedRef.current) return;
      setStatus("error");
      setErrorMessage("No impersonation ticket was provided in the request URL.");
      return;
    }

    if (hasExchangedRef.current) return;
    hasExchangedRef.current = true;

    // Clean query parameter from browser address bar so ticket is never in history
    if (window.history && window.history.replaceState) {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }

    const performExchange = async () => {
      try {
        setStatus("verifying");

        let data = null;

        // 1. Try Admin backend first (where the ticket was directly generated)
        try {
          const adminBase = getAdminApiBase();
          const adminRes = await fetch(`${adminBase}/admin/impersonate/exchange`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticket }),
          });
          const adminJson = await adminRes.json().catch(() => ({}));
          if (adminRes.ok && adminJson.token) {
            data = adminJson;
          }
        } catch (adminErr) {
          console.warn("Admin backend exchange attempt error:", adminErr.message);
        }

        // 2. Fallback: try User backend (/api/users/impersonate/exchange) if not yet resolved
        if (!data || !data.token) {
          try {
            const userRes = await api.post("/users/impersonate/exchange", { ticket });
            data = userRes.data;
          } catch (serverErr) {
            throw new Error(
              serverErr.response?.data?.message ||
              serverErr.message ||
              "Failed to validate impersonation ticket. The link may have expired or already been used."
            );
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

        // Navigate cleanly to merchant dashboard with full refresh
        setTimeout(() => {
          window.location.replace("/dashboard");
        }, 400);
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
    <div className="min-h-screen bg-[#f6f8fb] dark:bg-[#090b10] flex items-center justify-center p-4">
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
