import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
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
    "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#008dd2]";

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-sm text-slate-500">
          Loading profile...
        </div>
      </div>
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <div className="min-h-screen bg-slate-100">

      {/* PAGE HEADER */}

      <div className="mb-5">
        <h1 className="text-xl font-medium text-slate-800">
          General Details
        </h1>

        <div className="mt-2 flex items-center gap-3 text-sm">
          <span className="text-violet-500">
            Dashboard
          </span>

          <span className="text-slate-400">
            »
          </span>

          <span className="text-slate-700">
            General Details
          </span>
        </div>
      </div>


      {/* MAIN CARD */}

      <div className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">

        {/* CARD HEADER */}

        <div className="border-b border-slate-200 px-5 py-5">
          <h2 className="text-lg font-medium text-slate-800">
            General Details
          </h2>
        </div>


        {/* FORM */}

        <form
          onSubmit={handleSave}
          className="p-5"
        >
          <div className="rounded-md border border-slate-200 p-4">

            <div className="space-y-6">

              {/* PROFILE PHOTO */}

              <div>
                <div className="flex flex-wrap items-center gap-4">

                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-md bg-violet-100">

                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-3xl text-slate-400">
                        👤
                      </div>
                    )}

                  </div>


                  {/* UPLOAD / RESET */}

                  <div className="flex items-center gap-3">

                    <label className="cursor-pointer rounded-md bg-violet-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-violet-600">

                      Upload

                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.gif"
                        onChange={
                          handleImageChange
                        }
                        className="hidden"
                      />

                    </label>


                    <button
                      type="button"
                      onClick={
                        handleResetImage
                      }
                      className="rounded-md border border-red-500 px-5 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50"
                    >
                      Reset
                    </button>

                  </div>
                </div>

                <p className="mt-2 text-xs text-slate-600">
                  Allowed JPG, GIF or PNG.
                  Max size of 800KB
                </p>
              </div>


              {/* USER DETAILS */}

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

                {/* NAME */}

                <div>
                  <label className="mb-1.5 block text-sm text-slate-700">
                    Name
                  </label>

                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className={inputClass}
                  />
                </div>


                {/* EMAIL */}

                <div>
                  <label className="mb-1.5 block text-sm text-slate-700">
                    E-mail
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className={inputClass}
                  />
                </div>


                {/* MOBILE */}

                <div>
                  <label className="mb-1.5 block text-sm text-slate-700">
                    Mobile
                  </label>

                  <input
                    type="text"
                    name="phone_no"
                    value={formData.phone_no}
                    onChange={handleChange}
                    placeholder="Enter mobile number"
                    className={inputClass}
                  />
                </div>

              </div>


              {/* BUTTONS */}

              <div className="flex flex-wrap gap-3">

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-violet-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : "Save changes"}
                </button>


                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="rounded-md border border-red-500 px-5 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50"
                >
                  Cancel
                </button>

              </div>

            </div>
          </div>
        </form>

      </div>
    </div>
  );
}

export default GeneralSettings;