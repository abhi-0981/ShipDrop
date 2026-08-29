import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/users/login", formData);
      localStorage.setItem(
  "user",
  JSON.stringify(response.data.user)
);

      toast.success(response.data.message);

      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome Back
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Login to your ShipDrop account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#008dd2]"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#008dd2]"
          />

          <button
            type="submit"
            className="w-full rounded-xl bg-[#008dd2] py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Login
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Don't have an account?

          <Link
            to="/register"
            className="ml-2 font-semibold text-[#008dd2]"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;