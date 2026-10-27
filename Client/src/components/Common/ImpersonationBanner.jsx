import { useState, useEffect } from "react";
import { HiOutlineArrowLeft, HiOutlineShieldCheck } from "react-icons/hi";
import api, { API_BASE_URL } from "../../services/api";

function ImpersonationBanner() {
  const [impersonation, setImpersonation] = useState(() => {
    try {
      const raw = localStorage.getItem("shipdrop_impersonation");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [ending, setEnding] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const raw = localStorage.getItem("shipdrop_impersonation");
        setImpersonation(raw ? JSON.parse(raw) : null);
      } catch {
        setImpersonation(null);
      }
    };

    window.addEventListener("shipdrop:impersonation-started", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("shipdrop:impersonation-started", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  if (!impersonation || !impersonation.active) {
    return null;
  }

  const handleReturnToAdmin = async () => {
    if (ending) return;

    try {
      setEnding(true);

      // Call end impersonation endpoint on backend
      try {
        await api.post("/users/impersonate/end", {
          session_id: impersonation.session_id,
        });
      } catch (err) {
        // Fallback to admin backend if user backend fails
        try {
          const adminApiBase = API_BASE_URL.replace(/:\d+/, ":5001");
          await fetch(`${adminApiBase}/admin/impersonate/end`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ session_id: impersonation.session_id }),
          });
        } catch {
          // Continue cleanup
        }
      }
    } catch (e) {
      console.warn("Notice during ending impersonation:", e);
    } finally {
      const returnUrl =
        impersonation.admin_return_url || "http://localhost:5174/users";

      // Securely clear client-side impersonation tokens
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("shipdrop_impersonation");

      // Redirect back to AdminPanel
      window.location.href = returnUrl;
    }
  };

  return (
    <div
      id="impersonation-support-banner"
      className="sticky top-[64px] z-20 w-full bg-gradient-to-r from-[#008dd2] via-[#007cb8] to-[#006ea3] text-white shadow-sm border-b border-[#006ea3]/40"
    >
      <div className="max-w-[1600px] mx-auto px-4 py-2 sm:py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        {/* LEFT: BADGE + INFO */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-xs px-2.5 py-0.5 font-bold uppercase tracking-wider text-[10px] text-white shrink-0 border border-white/25 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
            <HiOutlineShieldCheck size={14} className="text-white" />
            <span>Admin Support Mode</span>
          </div>

          <div className="truncate text-white font-medium">
            Viewing as{" "}
            <span className="font-bold underline decoration-white/40">
              {impersonation.target_user_name || "Merchant"}
            </span>{" "}
            {impersonation.target_user_id && (
              <span className="font-mono text-[11px] bg-black/15 px-1.5 py-0.5 rounded font-semibold text-white/95">
                UID #{impersonation.target_user_id}
              </span>
            )}
            <span className="hidden md:inline text-white/80 text-[11px] ml-2 font-normal">
              • Initiated by Admin "{impersonation.admin_username || "Admin"}"
            </span>
          </div>
        </div>

        {/* RIGHT: RETURN ACTION BUTTON */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={ending}
            onClick={handleReturnToAdmin}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-white px-3.5 text-xs font-bold text-[#008dd2] shadow-xs transition hover:bg-slate-50 hover:shadow-sm active:scale-95 disabled:opacity-60"
          >
            {ending ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#008dd2]/30 border-t-[#008dd2]" />
                <span>Returning...</span>
              </>
            ) : (
              <>
                <HiOutlineArrowLeft size={14} className="stroke-[2.5]" />
                <span>Return to AdminPanel</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImpersonationBanner;
