import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

function Register() {
  const [formData, setFormData] = useState({
    full_name: "",
    company_name: "",
    gst_no: "",
    email: "",
    phone_no: "",
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
      const response = await api.post("/users/register", formData);

      toast.success(response.data.message);

      setFormData({
        full_name: "",
        company_name: "",
        gst_no: "",
        email: "",
        phone_no: "",
        password: "",
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Something went wrong"
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-800">
            Create Your Account
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Start managing your shipments with ShipDrop
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="grid gap-3 md:grid-cols-2"
        >
          <input
            type="text"
            name="full_name"
            placeholder="Full Name"
            autoComplete="off"
            value={formData.full_name}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#008dd2]"
          />

          <input
            type="text"
            name="company_name"
            placeholder="Company Name"
            autoComplete="off"
            value={formData.company_name}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#008dd2]"
          />

          <input
            type="text"
            name="gst_no"
            placeholder="GST Number"
            autoComplete="off"
            value={formData.gst_no}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#008dd2]"
          />

          <input
            type="text"
            name="phone_no"
            placeholder="Phone Number"
            autoComplete="off"
            value={formData.phone_no}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#008dd2]"
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            autoComplete="off"
            value={formData.email}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#008dd2]"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#008dd2]"
          />

          <button
            type="submit"
            className="col-span-2 mt-2 rounded-xl bg-[#008dd2] py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Create Account
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account?

          <Link
            to="/login"
            className="ml-2 font-semibold text-[#008dd2]"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;