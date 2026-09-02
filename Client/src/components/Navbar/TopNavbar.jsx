import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

// ========================================
// ICONS
// ========================================

const WalletIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M20 7V6a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v8a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V7" />
    <path d="M16 13h2" />
  </svg>
);

const ChatIcon = () => (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.8 9.8 0 0 1-4-.8L3 21l1.8-4.3A8.2 8.2 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z" />
  </svg>
);

const BellIcon = () => (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
    <path d="M10 21h4" />
  </svg>
);

const MoonIcon = () => (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 8.5 8.5 0 1 0 21 14.5Z" />
  </svg>
);

const FullscreenIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M16 3h3a2 2 0 0 1 2 2v3" />
    <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
  </svg>
);

const UserIcon = () => (
  <svg
    width="21"
    height="21"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c.8-4 3.5-6 8-6s7.2 2 8 6" />
  </svg>
);

const ProfileIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c.8-4 3.5-6 8-6s7.2 2 8 6" />
  </svg>
);

const DashboardIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <rect
      x="4"
      y="4"
      width="16"
      height="16"
      rx="2"
    />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
);

const LockIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <rect
      x="5"
      y="10"
      width="14"
      height="10"
      rx="2"
    />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

const LogoutIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
    <path d="M14 8l4 4-4 4" />
    <path d="M18 12H9" />
  </svg>
);


// ========================================
// TOP NAVBAR
// ========================================

function TopNavbar() {
  const navigate = useNavigate();

  const [balance, setBalance] =
    useState(0);

  const [showRecharge, setShowRecharge] =
    useState(false);

  const [showProfile, setShowProfile] =
    useState(false);

  const [amount, setAmount] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [user, setUser] = useState(() => {
    return JSON.parse(
      localStorage.getItem("user") || "null"
    );
  });


  // ========================================
  // LOAD USER PROFILE
  // ========================================

  const loadUserProfile = async () => {
    const savedUser = JSON.parse(
      localStorage.getItem("user") || "null"
    );

    if (!savedUser?.id) {
      return;
    }

    try {
      const response = await api.get(
        `/users/profile/${savedUser.id}`
      );

      const updatedUser =
        response.data.user;

      setUser(updatedUser);

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );
    } catch (error) {
      console.log(
        "Profile loading error:",
        error
      );
    }
  };


  // ========================================
  // LOAD WALLET
  // ========================================

  const loadWallet = async () => {
    const savedUser = JSON.parse(
      localStorage.getItem("user") || "null"
    );

    if (!savedUser?.id) {
      return;
    }

    try {
      const response = await api.get(
        `/payments/wallet?user_id=${savedUser.id}`
      );

      setBalance(
        Number(response.data.balance)
      );
    } catch (error) {
      console.log(
        "Wallet loading error:",
        error
      );
    }
  };


  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {
    loadUserProfile();
    loadWallet();
  }, []);


  // ========================================
  // USER UPDATE LISTENER
  // ========================================

  useEffect(() => {
    const handleUserUpdated = (
      event
    ) => {

      // General Settings se
      // updated user directly aayega

      if (event.detail) {

        setUser(
          event.detail
        );

        localStorage.setItem(
          "user",
          JSON.stringify(
            event.detail
          )
        );

      } else {

        // Fallback

        loadUserProfile();

      }
    };

    window.addEventListener(
      "userUpdated",
      handleUserUpdated
    );

    return () => {
      window.removeEventListener(
        "userUpdated",
        handleUserUpdated
      );
    };
  }, []);



 // ========================================
// WALLET UPDATE LISTENER
// ========================================

useEffect(() => {
  const handleWalletUpdated = (event) => {

    const updatedBalance = Number(
      event?.detail?.balance
    );

    if (Number.isFinite(updatedBalance)) {
      setBalance(updatedBalance);
      return;
    }

    // Fallback
    loadWallet();
  };

  window.addEventListener(
    "walletUpdated",
    handleWalletUpdated
  );

  return () => {
    window.removeEventListener(
      "walletUpdated",
      handleWalletUpdated
    );
  };
}, []);


  // ========================================
  // LOAD RAZORPAY
  // ========================================

  const loadRazorpay = () => {
    return new Promise(
      (resolve) => {

        if (window.Razorpay) {
          resolve(true);
          return;
        }

        const script =
          document.createElement(
            "script"
          );

        script.src =
          "https://checkout.razorpay.com/v1/checkout.js";

        script.onload = () => {
          resolve(true);
        };

        script.onerror = () => {
          resolve(false);
        };

        document.body.appendChild(
          script
        );
      }
    );
  };


  // ========================================
  // RECHARGE
  // ========================================

  const handleRecharge = async () => {
    const rechargeAmount =
      Number(amount);

    if (
      !rechargeAmount ||
      rechargeAmount <= 0
    ) {
      toast.error(
        "Please enter a valid amount"
      );

      return;
    }

    if (!user?.id) {
      toast.error(
        "Please login again"
      );

      return;
    }

    setLoading(true);

    try {
      const razorpayLoaded =
        await loadRazorpay();

      if (!razorpayLoaded) {
        toast.error(
          "Unable to load Razorpay"
        );

        return;
      }

      const response =
        await api.post(
          "/payments/create-order",
          {
            user_id: user.id,
            amount: rechargeAmount,
          }
        );

      const {
        order_id,
        amount: razorpayAmount,
        currency,
        key_id,
      } = response.data;

      const options = {
        key: key_id,

        amount: razorpayAmount,

        currency,

        name: "ShipDrop",

        description:
          "Wallet Recharge",

        order_id,

        prefill: {
          name:
            user.full_name || "",

          email:
            user.email || "",

          contact:
            user.phone_no || "",
        },

        theme: {
          color: "#008dd2",
        },

        handler:
          async function (
            paymentResponse
          ) {
            try {
              const verifyResponse =
                await api.post(
                  "/payments/verify",
                  {
                    user_id:
                      user.id,

                    razorpay_order_id:
                      paymentResponse.razorpay_order_id,

                    razorpay_payment_id:
                      paymentResponse.razorpay_payment_id,

                    razorpay_signature:
                      paymentResponse.razorpay_signature,
                  }
                );

              setBalance(
                Number(
                  verifyResponse
                    .data.balance
                )
              );

              setAmount("");

              setShowRecharge(
                false
              );

              toast.success(
                "Wallet recharged successfully"
              );
            } catch (error) {
              toast.error(
                error.response?.data
                  ?.message ||
                  "Payment verification failed"
              );
            }
          },

        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const razorpay =
        new window.Razorpay(
          options
        );

      razorpay.open();

    } catch (error) {

      console.log(
        "Recharge error:",
        error
      );

      toast.error(
        error.response?.data
          ?.message ||
          "Unable to start recharge"
      );

    } finally {
      setLoading(false);
    }
  };


  // ========================================
  // FULLSCREEN
  // ========================================

  const handleFullscreen = () => {

    if (
      !document.fullscreenElement
    ) {

      document.documentElement.requestFullscreen();

    } else {

      document.exitFullscreen();

    }
  };


  // ========================================
  // THEME
  // ========================================

  const handleTheme = () => {

    document.documentElement.classList.toggle(
      "dark"
    );

  };


  // ========================================
  // LOGOUT
  // ========================================

  const handleLogout = () => {

    localStorage.removeItem(
      "user"
    );

    toast.success(
      "Logged out successfully"
    );

    navigate("/login");
  };


  // ========================================
  // OPEN PROFILE
  // ========================================

  const openProfile = () => {

    setShowProfile(false);

    navigate(
      "/general-settings"
    );
  };


  const userName =
    user?.full_name ||
    "User";

  const userEmail =
    user?.email ||
    "";


  // ========================================
  // UI
  // ========================================

  return (
    <>
      {/* ====================================
          FIXED TOP NAVBAR
      ==================================== */}

      <div className="fixed left-0 right-0 top-0 z-50 h-[66px] border-b border-slate-200 bg-white shadow-sm">

        <div className="flex h-full items-center justify-end gap-3 px-4 md:px-6">

          {/* WALLET */}

          <div className="flex items-center rounded-full bg-violet-50 px-2 py-1.5">

            <WalletIcon />

            <span className="ml-1.5 text-sm font-semibold text-slate-700">
              ₹
              {balance.toLocaleString(
                "en-IN",
                {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                }
              )}
            </span>

            <button
              type="button"
              onClick={() =>
                setShowRecharge(
                  true
                )
              }
              className="ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-violet-500 text-lg font-medium text-white transition hover:bg-violet-600"
            >
              +
            </button>

          </div>


          {/* CHAT */}

          <button
            type="button"
            title="Chat"
            onClick={() =>
              toast(
                "Chat coming soon"
              )
            }
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
          >
            <ChatIcon />
          </button>


          {/* NOTIFICATION */}

          <button
            type="button"
            title="Notifications"
            onClick={() =>
              toast(
                "No new notifications"
              )
            }
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
          >
            <BellIcon />

            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500"></span>
          </button>


          {/* THEME */}

          <button
            type="button"
            title="Theme"
            onClick={
              handleTheme
            }
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
          >
            <MoonIcon />
          </button>


          {/* FULLSCREEN */}

          <button
            type="button"
            title="Fullscreen"
            onClick={
              handleFullscreen
            }
            className="hidden h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 sm:flex"
          >
            <FullscreenIcon />
          </button>


          {/* =================================
              USER PROFILE
          ================================= */}

          <div className="relative">

            <button
              type="button"
              onClick={() =>
                setShowProfile(
                  (prev) => !prev
                )
              }
              className="flex items-center gap-2 rounded-full px-2 py-1 transition hover:bg-slate-50"
            >

              {/* PROFILE PHOTO */}

              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-600">

                {user?.profile_image ? (

                  <img
                    src={
                      user.profile_image
                    }
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />

                ) : (

                  <UserIcon />

                )}

              </div>


              {/* USER NAME */}

              <span className="hidden max-w-[180px] truncate text-sm font-medium text-slate-500 lg:block">
                {userName}
              </span>

            </button>


            {/* =================================
                DROPDOWN
            ================================= */}

            {showProfile && (

              <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">

                {/* USER INFO */}

                <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-500">

                    {user?.profile_image ? (

                      <img
                        src={
                          user.profile_image
                        }
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />

                    ) : (

                      <UserIcon />

                    )}

                  </div>

                  <div className="min-w-0">

                    <p className="truncate text-sm font-semibold text-slate-700">
                      {userName}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-400">
                      {userEmail}
                    </p>

                  </div>

                </div>


                {/* PROFILE */}

                <button
                  type="button"
                  onClick={
                    openProfile
                  }
                  className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50"
                >
                  <ProfileIcon />

                  <span>
                    Profile
                  </span>
                </button>


                {/* DASHBOARD */}

                <button
                  type="button"
                  onClick={() => {

                    setShowProfile(
                      false
                    );

                    navigate(
                      "/dashboard"
                    );

                  }}
                  className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50"
                >
                  <DashboardIcon />

                  <span>
                    User Dashboard
                  </span>
                </button>


                {/* PASSWORD */}

                <button
                  type="button"
                  onClick={() => {

                    setShowProfile(
                      false
                    );

                    toast(
                      "Password page coming soon"
                    );

                  }}
                  className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50"
                >
                  <LockIcon />

                  <span>
                    Password
                  </span>
                </button>


                {/* LOGOUT */}

                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-red-50 hover:text-red-600"
                >
                  <LogoutIcon />

                  <span>
                    Logout
                  </span>
                </button>

              </div>

            )}

          </div>

        </div>

      </div>


      {/* ====================================
          RECHARGE MODAL
      ==================================== */}

      {showRecharge && (

        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

            <div className="mb-5 flex items-center justify-between">

              <div>

                <h2 className="text-xl font-bold text-slate-800">
                  Recharge Wallet
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add money to your ShipDrop wallet
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowRecharge(
                    false
                  )
                }
                className="text-2xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>

            </div>


            {/* AMOUNT */}

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Enter Amount
            </label>

            <div className="relative">

              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                ₹
              </span>

              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value
                  )
                }
                placeholder="Enter amount"
                className="h-12 w-full rounded-xl border border-slate-300 pl-8 pr-4 outline-none focus:border-[#008dd2]"
              />

            </div>


            {/* QUICK AMOUNTS */}

            <div className="mt-4 grid grid-cols-4 gap-2">

              {[500, 1000, 2000, 5000].map(
                (value) => (

                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setAmount(
                        String(value)
                      )
                    }
                    className="rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition hover:border-[#008dd2] hover:text-[#008dd2]"
                  >
                    ₹{value}
                  </button>

                )
              )}

            </div>


            {/* RECHARGE BUTTON */}

            <button
              type="button"
              onClick={
                handleRecharge
              }
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-[#008dd2] py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : "Proceed to Recharge"}
            </button>


            <p className="mt-3 text-center text-xs text-slate-400">
              Secure payment powered by Razorpay
            </p>

          </div>

        </div>

      )}
    </>
  );
}

export default TopNavbar;