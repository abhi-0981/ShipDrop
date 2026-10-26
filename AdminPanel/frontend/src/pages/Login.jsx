import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineUser,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineShieldCheck,
  HiOutlineArrowRight,
} from "react-icons/hi";
import { API_BASE_URL } from "../config/api";
import ParcelDropLogo from "../components/ParcelDropLogo";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid credentials. Please try again.");
        return;
      }

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("admin", JSON.stringify(data.admin));

      navigate("/dashboard");
    } catch {
      setError("Unable to connect to server. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center px-4 py-12 antialiased selection:bg-[#008dd2]/20 selection:text-[#008dd2]">
      {/* BACKGROUND AMBIENT GLOW */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[600px] rounded-full bg-gradient-to-b from-[#008dd2]/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-40 right-10 h-[400px] w-[400px] rounded-full bg-sky-200/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px]">
        {/* CARD */}
        <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-8 sm:p-9 shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur-md">
          {/* LOGO */}
          <div className="flex flex-col items-center mb-7">
            <div className="flex items-center gap-2.5">
              <ParcelDropLogo className="h-[50px] sm:h-[56px]" />
              <span className="rounded-full bg-[#008dd2]/10 border border-[#008dd2]/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#008dd2]">
                Admin
              </span>
            </div>
            <p className="mt-2.5 text-xs text-slate-400 text-center">
              Sign in to manage logistics, merchants & operations
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* USERNAME */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Admin Username
              </label>
              <div className="relative">
                <HiOutlineUser
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                  required
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/60 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#008dd2] focus:bg-white focus:ring-4 focus:ring-[#008dd2]/10"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <HiOutlineLockClosed
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-slate-50/60 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#008dd2] focus:bg-white focus:ring-4 focus:ring-[#008dd2]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <HiOutlineEyeOff size={18} />
                  ) : (
                    <HiOutlineEye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* ERROR NOTICE */}
            {error && (
              <div className="rounded-xl border border-rose-100 bg-rose-50/80 px-3.5 py-2.5 text-xs font-medium text-rose-600 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-[#008dd2] text-xs font-bold text-white shadow-sm shadow-[#008dd2]/25 transition hover:bg-[#007fbd] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 mt-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin Panel</span>
                  <HiOutlineArrowRight
                    size={15}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </form>

          {/* FOOTER BADGE */}
          <div className="mt-7 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-5 text-[11px] font-medium text-slate-400">
            <HiOutlineShieldCheck size={16} className="text-emerald-500" />
            <span>Secure Enterprise Admin Access</span>
          </div>
        </div>

        {/* COPYRIGHT */}
        <p className="mt-6 text-center text-xs text-slate-400">
          ParcelDrop Logistics & Fulfillment Technologies &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

export default Login;