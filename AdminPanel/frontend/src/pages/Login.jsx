import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5001/api/admin/login", {
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
        setError(data.message || "Login failed");
        return;
      }

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("admin", JSON.stringify(data.admin));

      navigate("/dashboard");
    } catch (error) {
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7fbfe] flex items-center justify-center px-4">
      <div className="w-full max-w-[430px] bg-white border border-slate-200 rounded-2xl px-8 py-9 shadow-[0_20px_60px_rgba(0,141,210,0.08)]">

        {/* Logo */}
        <div className="flex justify-center mb-9">
          <img
            src="/logo.png"
            alt="ShipDrop"
            className="h-14 w-auto"
          />
        </div>

        {/* Heading */}
        <div className="mb-7">
          <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">
            Admin Panel
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            Sign in to manage your platform.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Username */}
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-2">
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
              required
              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#008dd2] focus:ring-4 focus:ring-[#008dd2]/10"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              required
              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#008dd2] focus:ring-4 focus:ring-[#008dd2]/10"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Sign In */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-[#008dd2] text-white text-sm font-semibold hover:bg-[#007fbd] active:bg-[#0075b0] transition shadow-sm shadow-[#008dd2]/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

        </form>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-400 mt-7">
          Secure administration access
        </p>

      </div>
    </div>
  );
}

export default Login;