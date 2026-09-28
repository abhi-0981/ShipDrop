import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
} from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/users/login", {
        email,
        password,
      });

      const user = response.data?.user;

      if (!user?.id) {
        toast.error("Login failed. Please try again.");
        return;
      }

      localStorage.setItem("user", JSON.stringify(user));

      toast.success("Login successful");

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-5">
      <div className="w-full max-w-md">
        {/* BACK TO HOME */}

        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#008dd2]"
        >
          <FiArrowLeft size={17} />
          Back to Home
        </Link>

        {/* CARD */}

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
          {/* LOGO */}

          <div className="mb-6 text-center">
            <Link
              to="/"
              className="inline-block text-3xl font-extrabold tracking-tight text-[#008dd2]"
            >
              Ship<span className="text-slate-800">Drop</span>
            </Link>

            <h1 className="mt-4 text-2xl font-bold text-slate-800">
              Welcome Back
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Login to your ShipDrop account
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            noValidate
          >
            {/* EMAIL */}

            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email Address
              </label>

              <div className="relative">
                <FiMail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="login-email"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
                />
              </div>
            </div>

            {/* PASSWORD */}

            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <FiLock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-11 text-sm text-slate-800 outline-none transition focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <FiEyeOff size={18} />
                  ) : (
                    <FiEye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center rounded-xl bg-[#008dd2] py-3 text-sm font-semibold text-white transition hover:bg-[#007fbd] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          {/* SIGN UP */}

          <p className="mt-5 text-center text-sm text-slate-500">
            Don't have an account?

            <Link
              to="/register"
              className="ml-1.5 font-semibold text-[#008dd2] hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;