import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiPhone,
  FiUser,
} from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    company_name: "",
    gst_no: "",
    email: "",
    phone_no: "",
    password: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone_no") {
      const numbersOnly = value
        .replace(/\D/g, "")
        .slice(0, 10);

      setFormData((prev) => ({
        ...prev,
        phone_no: numbersOnly,
      }));

      return;
    }

    if (name === "email") {
      setFormData((prev) => ({
        ...prev,
        email: value,
      }));

      return;
    }

    if (name === "gst_no") {
      setFormData((prev) => ({
        ...prev,
        gst_no: value
          .replace(/\s/g, "")
          .toUpperCase(),
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const passwordRules = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(
      formData.password,
    ),
    lowercase: /[a-z]/.test(
      formData.password,
    ),
    number: /[0-9]/.test(
      formData.password,
    ),
    special: /[^A-Za-z0-9]/.test(
      formData.password,
    ),
  };

  const passwordStrong =
    passwordRules.length &&
    passwordRules.uppercase &&
    passwordRules.lowercase &&
    passwordRules.number &&
    passwordRules.special;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    const fullName =
      formData.full_name.trim();

    const companyName =
      formData.company_name.trim();

    const email =
      formData.email.trim().toLowerCase();

    const phone =
      formData.phone_no;

    const password =
      formData.password;

    const confirmPassword =
      formData.confirm_password;

    // ------------------------------------
    // VALIDATION
    // ------------------------------------

    if (!fullName) {
      toast.error("Please enter your full name");
      return;
    }

    if (!companyName) {
      toast.error("Please enter your company name");
      return;
    }

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email,
      )
    ) {
      toast.error(
        "Please enter a valid email address",
      );
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error(
        "Please enter a valid 10-digit mobile number",
      );
      return;
    }

    if (!passwordStrong) {
      toast.error(
        "Please create a stronger password",
      );
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        "/users/register",
        {
          full_name: fullName,
          company_name: companyName,
          gst_no:
            formData.gst_no.trim().toUpperCase(),
          email,
          phone_no: phone,
          password,
          confirm_password:
            confirmPassword,
        },
      );

      toast.success(
        response.data?.message ||
          "Account created successfully",
      );

      setFormData({
        full_name: "",
        company_name: "",
        gst_no: "",
        email: "",
        phone_no: "",
        password: "",
        confirm_password: "",
      });

      // ----------------------------------
      // GO TO LOGIN
      // ----------------------------------

      setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 700);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Unable to create account. Please try again.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto w-full max-w-3xl">
        {/* BACK TO HOME */}

        <Link
          to="/"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#008dd2]"
        >
          <FiArrowLeft size={17} />
          Back to Home
        </Link>

        {/* CARD */}

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
          {/* HEADER */}

          <div className="mb-7 text-center">
            <Link
              to="/"
              className="inline-block text-3xl font-extrabold tracking-tight text-[#008dd2]"
            >
              Ship<span className="text-slate-800">
                Drop
              </span>
            </Link>

            <h1 className="mt-5 text-2xl font-bold text-slate-800">
              Create Your Account
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Start managing your shipments with
              ShipDrop
            </p>
          </div>

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="grid gap-4 md:grid-cols-2"
            noValidate
          >
            {/* FULL NAME */}

            <div>
              <label
                htmlFor="full_name"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Full Name
              </label>

              <div className="relative">
                <FiUser
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="full_name"
                  type="text"
                  name="full_name"
                  placeholder="Enter your full name"
                  value={formData.full_name}
                  onChange={handleChange}
                  autoComplete="name"
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
                />
              </div>
            </div>

            {/* COMPANY */}

            <div>
              <label
                htmlFor="company_name"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Company Name
              </label>

              <input
                id="company_name"
                type="text"
                name="company_name"
                placeholder="Enter company name"
                value={formData.company_name}
                onChange={handleChange}
                autoComplete="organization"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
              />
            </div>

            {/* PHONE */}

            <div>
              <label
                htmlFor="phone_no"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Mobile Number
              </label>

              <div className="relative">
                <FiPhone
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="phone_no"
                  type="tel"
                  name="phone_no"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={formData.phone_no}
                  onChange={handleChange}
                  autoComplete="tel"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
                />
              </div>
            </div>

            {/* EMAIL */}

            <div>
              <label
                htmlFor="email"
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
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
                />
              </div>
            </div>

            {/* GST */}

            <div className="md:col-span-2">
              <label
                htmlFor="gst_no"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                GST Number
                <span className="ml-1 text-xs font-normal text-slate-400">
                  (Optional)
                </span>
              </label>

              <input
                id="gst_no"
                type="text"
                name="gst_no"
                placeholder="Enter GST number"
                value={formData.gst_no}
                onChange={handleChange}
                autoComplete="off"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm uppercase outline-none transition focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
              />
            </div>

            {/* PASSWORD */}

            <div>
              <label
                htmlFor="password"
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
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-11 text-sm outline-none transition focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (prev) => !prev,
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
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

            {/* CONFIRM PASSWORD */}

            <div>
              <label
                htmlFor="confirm_password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Confirm Password
              </label>

              <div className="relative">
                <FiLock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="confirm_password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirm_password"
                  placeholder="Confirm password"
                  value={
                    formData.confirm_password
                  }
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-11 text-sm outline-none transition focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (prev) => !prev,
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <FiEyeOff size={18} />
                  ) : (
                    <FiEye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* PASSWORD RULES */}

            <div className="rounded-xl bg-slate-50 p-4 md:col-span-2">
              <p className="mb-2 text-xs font-semibold text-slate-600">
                Password must contain:
              </p>

              <div className="grid gap-2 text-xs sm:grid-cols-2">
                <PasswordRule
                  valid={passwordRules.length}
                  text="At least 8 characters"
                />

                <PasswordRule
                  valid={passwordRules.uppercase}
                  text="One uppercase letter"
                />

                <PasswordRule
                  valid={passwordRules.lowercase}
                  text="One lowercase letter"
                />

                <PasswordRule
                  valid={passwordRules.number}
                  text="One number"
                />

                <PasswordRule
                  valid={passwordRules.special}
                  text="One special character"
                />
              </div>
            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={loading}
              className="md:col-span-2 flex w-full items-center justify-center rounded-xl bg-[#008dd2] py-3 text-sm font-semibold text-white transition hover:bg-[#007fbd] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Creating account..."
                : "Create Account"}
            </button>
          </form>

          {/* LOGIN */}

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?

            <Link
              to="/login"
              className="ml-1.5 font-semibold text-[#008dd2] hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ========================================
// PASSWORD RULE
// ========================================

function PasswordRule({ valid, text }) {
  return (
    <div
      className={`flex items-center gap-2 ${
        valid
          ? "text-emerald-600"
          : "text-slate-400"
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full ${
          valid
            ? "bg-emerald-100"
            : "bg-slate-200"
        }`}
      >
        {valid && <FiCheck size={10} />}
      </span>

      <span>{text}</span>
    </div>
  );
}

export default Register;