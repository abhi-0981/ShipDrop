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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // PHONE - ONLY NUMBERS
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

    // GST
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

  // ========================================
  // PASSWORD RULES
  // ========================================

  const passwordRules = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password),
  };

  const passwordStrong =
    passwordRules.length &&
    passwordRules.uppercase &&
    passwordRules.lowercase &&
    passwordRules.number &&
    passwordRules.special;

  // ========================================
  // SUBMIT
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    const fullName = formData.full_name.trim();
    const companyName = formData.company_name.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone_no;
    const password = formData.password;
    const confirmPassword = formData.confirm_password;

    // FULL NAME
    if (!fullName) {
      toast.error("Please enter your full name");
      return;
    }

    // COMPANY
    if (!companyName) {
      toast.error("Please enter your company name");
      return;
    }

    // EMAIL
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // PHONE
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error(
        "Please enter a valid 10-digit mobile number"
      );
      return;
    }

    // PASSWORD
    if (!passwordStrong) {
      toast.error(
        "Password does not meet the security rules"
      );
      return;
    }

    // CONFIRM PASSWORD
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/users/register", {
        full_name: fullName,
        company_name: companyName,
        gst_no: formData.gst_no.trim().toUpperCase(),
        email,
        phone_no: phone,
        password,
        confirm_password: confirmPassword,
      });

      toast.success(
        response.data?.message ||
          "Account created successfully"
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

      setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 700);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-dvh overflow-hidden bg-slate-100 px-3 py-2 sm:px-4">
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col justify-center">
        {/* BACK TO HOME */}

        <Link
          to="/"
          className="mb-2 inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-600 transition hover:text-[#008dd2]"
        >
          <FiArrowLeft size={15} />
          Back to Home
        </Link>

        {/* CARD */}

        <div className="shrink-0 rounded-3xl border border-slate-100 bg-white px-4 py-3 shadow-xl shadow-slate-200/60 sm:px-6 sm:py-4">
          {/* HEADER */}

          <div className="mb-3 text-center">
            <Link
              to="/"
              className="inline-block text-2xl font-extrabold tracking-tight text-[#008dd2] sm:text-3xl"
            >
              Parcel<span className="text-slate-800">Drop</span>
            </Link>

            <h1 className="mt-1 text-xl font-bold text-slate-800 sm:text-2xl">
              Create Your Account
            </h1>

            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              Start managing your shipments with ParcelDrop
            </p>
          </div>

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            noValidate
            className="grid grid-cols-2 gap-x-3 gap-y-2"
          >
            {/* ROW 1 - NAME */}

            <FormField
              label="Full Name"
              htmlFor="full_name"
            >
              <div className="relative">
                <FiUser
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="full_name"
                  type="text"
                  name="full_name"
                  placeholder="Full name"
                  value={formData.full_name}
                  onChange={handleChange}
                  autoComplete="name"
                  autoFocus
                  className={inputClass("pl-9")}
                />
              </div>
            </FormField>

            {/* ROW 1 - PHONE */}

            <FormField
              label="Mobile Number"
              htmlFor="phone_no"
            >
              <div className="relative">
                <FiPhone
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="phone_no"
                  type="tel"
                  name="phone_no"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  value={formData.phone_no}
                  onChange={handleChange}
                  autoComplete="tel"
                  className={inputClass("pl-9")}
                />
              </div>
            </FormField>

            {/* ROW 2 - EMAIL */}

            <FormField
              label="Email Address"
              htmlFor="email"
            >
              <div className="relative">
                <FiMail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  className={inputClass("pl-9")}
                />
              </div>
            </FormField>

            {/* ROW 2 - COMPANY */}

            <FormField
              label="Company Name"
              htmlFor="company_name"
            >
              <input
                id="company_name"
                type="text"
                name="company_name"
                placeholder="Company name"
                value={formData.company_name}
                onChange={handleChange}
                autoComplete="organization"
                className={inputClass()}
              />
            </FormField>

            {/* ROW 3 - GST */}

            <FormField
              label="GST Number"
              htmlFor="gst_no"
              optional
            >
              <input
                id="gst_no"
                type="text"
                name="gst_no"
                placeholder="GST number"
                value={formData.gst_no}
                onChange={handleChange}
                autoComplete="off"
                className={inputClass("uppercase")}
              />
            </FormField>

            {/* ROW 3 - PASSWORD */}

            <FormField
              label="Password"
              htmlFor="password"
            >
              <div className="relative">
                <FiLock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
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
                  className={inputClass("pl-9 pr-9")}
                />

                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() =>
                    setShowPassword(
                      (prev) => !prev
                    )
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? (
                    <FiEyeOff size={15} />
                  ) : (
                    <FiEye size={15} />
                  )}
                </button>
              </div>
            </FormField>

            {/* ROW 4 - CONFIRM PASSWORD */}

            <FormField
              label="Confirm Password"
              htmlFor="confirm_password"
            >
              <div className="relative">
                <FiLock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
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
                  value={formData.confirm_password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className={inputClass("pl-9 pr-9")}
                />

                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() =>
                    setShowConfirmPassword(
                      (prev) => !prev
                    )
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showConfirmPassword ? (
                    <FiEyeOff size={15} />
                  ) : (
                    <FiEye size={15} />
                  )}
                </button>
              </div>
            </FormField>

            {/* ROW 4 - PASSWORD RULES */}

            <div className="self-end rounded-xl bg-slate-50 px-3 py-2">
              <p className="mb-1 text-[10px] font-semibold text-slate-600 sm:text-[11px]">
                Password must contain
              </p>

              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                <PasswordRule
                  valid={passwordRules.length}
                  text="8+ chars"
                />

                <PasswordRule
                  valid={passwordRules.uppercase}
                  text="Uppercase"
                />

                <PasswordRule
                  valid={passwordRules.lowercase}
                  text="Lowercase"
                />

                <PasswordRule
                  valid={passwordRules.number}
                  text="Number"
                />

                <PasswordRule
                  valid={passwordRules.special}
                  text="Special"
                />
              </div>
            </div>

            {/* SIGNUP BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="col-span-2 mt-1 flex h-10 items-center justify-center rounded-xl bg-[#008dd2] text-sm font-semibold text-white transition hover:bg-[#007fbd] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Creating account..."
                : "Create Account"}
            </button>
          </form>

          {/* LOGIN */}

          <p className="mt-2 text-center text-xs text-slate-500 sm:text-sm">
            Already have an account?

            <Link
              to="/login"
              className="ml-1 font-semibold text-[#008dd2] hover:underline"
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
// FORM FIELD
// ========================================

function FormField({
  label,
  htmlFor,
  children,
  optional = false,
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={htmlFor}
        className="mb-0.5 block truncate text-[11px] font-medium text-slate-700 sm:text-xs"
      >
        {label}

        {optional && (
          <span className="ml-1 text-[9px] font-normal text-slate-400">
            (Optional)
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

// ========================================
// INPUT CLASS
// ========================================

function inputClass(extra = "") {
  return `h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10 ${extra}`;
}

// ========================================
// PASSWORD RULE
// ========================================

function PasswordRule({ valid, text }) {
  return (
    <div
      className={`flex min-w-0 items-center gap-1 text-[9px] ${
        valid
          ? "text-emerald-600"
          : "text-slate-400"
      }`}
    >
      <span
        className={`flex h-3 w-3 shrink-0 items-center justify-center rounded-full ${
          valid
            ? "bg-emerald-100"
            : "bg-slate-200"
        }`}
      >
        {valid && <FiCheck size={8} />}
      </span>

      <span className="truncate">{text}</span>
    </div>
  );
}

export default Register;