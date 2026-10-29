import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineCamera,
  HiOutlineTrash,
  HiOutlineCheck,
} from "react-icons/hi";
import api from "../../services/api";

function GeneralSettings() {
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_no: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ========================================
  // LOAD USER PROFILE
  // ========================================

  useEffect(() => {
    const loadUserProfile = async () => {
      const savedUser = JSON.parse(
        localStorage.getItem("user") || "null"
      );

      if (!savedUser?.id) {
        toast.error("Please login again");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(
          `/users/profile/${savedUser.id}`
        );

        const userData = response.data.user;

        setUser(userData);

        setFormData({
          full_name: userData.full_name || "",
          email: userData.email || "",
          phone_no: userData.phone_no || "",
        });

        setProfileImage(
          userData.profile_image || null
        );

        localStorage.setItem(
          "user",
          JSON.stringify(userData)
        );
      } catch (error) {
        console.log("Profile loading error:", error);

        toast.error(
          error.response?.data?.message ||
            "Unable to load profile"
        );
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  // ========================================
  // INPUT CHANGE
  // ========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ========================================
  // IMAGE CHANGE
  // ========================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Only JPG, PNG or GIF images are allowed"
      );

      return;
    }

    if (file.size > 800 * 1024) {
      toast.error(
        "Image size must be less than 800KB"
      );

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setProfileImage(reader.result);
    };

    reader.readAsDataURL(file);
  };

  // ========================================
  // RESET IMAGE
  // ========================================

  const handleResetImage = () => {
    setProfileImage(null);
  };

  // ========================================
  // SAVE PROFILE
  // ========================================

  const handleSave = async (e) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error("User not found");
      return;
    }

    if (!formData.full_name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    if (!formData.phone_no.trim()) {
      toast.error(
        "Please enter your mobile number"
      );

      return;
    }

    setSaving(true);

    try {
      const response = await api.put(
        "/users/profile/update",
        {
          user_id: user.id,
          full_name: formData.full_name,
          email: formData.email,
          phone_no: formData.phone_no,
          profile_image: profileImage,
        }
      );

      const updatedUser = response.data.user;

      setUser(updatedUser);

      setFormData({
        full_name: updatedUser.full_name || "",
        email: updatedUser.email || "",
        phone_no: updatedUser.phone_no || "",
      });

      setProfileImage(
        updatedUser.profile_image || null
      );

      // Save latest user
      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      // ======================================
      // UPDATE TOP NAVBAR IMMEDIATELY
      // ======================================

      window.dispatchEvent(
        new CustomEvent("userUpdated", {
          detail: updatedUser,
        })
      );

      toast.success(
        "Profile updated successfully"
      );
    } catch (error) {
      console.log(
        "Profile update error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // CANCEL
  // ========================================

  const handleCancel = () => {
    if (!user) {
      return;
    }

    setFormData({
      full_name: user.full_name || "",
      email: user.email || "",
      phone_no: user.phone_no || "",
    });

    setProfileImage(
      user.profile_image || null
    );

    toast("Changes cancelled");
  };

  const inputClass =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/20 dark:border-white/10 dark:bg-[#161a22] dark:text-white dark:placeholder-slate-500";

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#008dd2] border-t-transparent" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <div className="min-h-full w-full bg-[#f6f8fb] dark:bg-[#090b10] px-3.5 py-4 sm:px-6 sm:py-6 pb-24 sm:pb-8">
      <div className="mx-auto max-w-3xl">
        {/* PAGE HEADER */}
        <div className="mb-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-[#008dd2] font-semibold">Settings</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            General Details
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your personal profile and contact information
          </p>
        </div>

        {/* MAIN CARD */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-white/10 dark:bg-[#111318]">
          {/* CARD HEADER */}
          <div className="border-b border-slate-100 dark:border-white/10 px-4 py-4 sm:px-6">
            <h2 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white">
              Profile Information
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Update your photo and personal details
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-6">
            {/* PROFILE PHOTO */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-white/5 dark:bg-white/[0.02]">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Profile Photo
              </label>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* AVATAR */}
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white shadow-md bg-sky-100 dark:border-white/10 dark:bg-sky-950/40">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <HiOutlineUser size={36} className="text-[#008dd2]" />
                  )}
                </div>

                {/* UPLOAD / RESET */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#008dd2] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-[#007ab6] active:scale-95">
                      <HiOutlineCamera size={16} />
                      <span>Upload New</span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.gif"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>

                    {profileImage && (
                      <button
                        type="button"
                        onClick={handleResetImage}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-red-600 transition hover:bg-red-50 hover:border-red-300 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400 active:scale-95"
                      >
                        <HiOutlineTrash size={15} />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Supports JPG, PNG or GIF. Max size 800 KB.
                  </p>
                </div>
              </div>
            </div>

            {/* FORM INPUTS */}
            <div className="space-y-4">
              {/* NAME */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <HiOutlineUser size={15} className="text-slate-400" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={inputClass}
                />
              </div>

              {/* GRID FOR EMAIL & MOBILE */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* EMAIL */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <HiOutlineMail size={15} className="text-slate-400" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className={inputClass}
                  />
                </div>

                {/* MOBILE */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <HiOutlinePhone size={15} className="text-slate-400" />
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="phone_no"
                    value={formData.phone_no}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    maxLength={15}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-2.5 text-xs sm:text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#008dd2] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-[#008dd2]/30 transition hover:bg-[#007ab6] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <HiOutlineCheck size={16} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default GeneralSettings;