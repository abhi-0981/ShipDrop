import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
import api from "../../services/api";

const WalletIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 7V6a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v8a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V7" />
    <path d="M16 13h2" />
  </svg>
);

const ChatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.8 9.8 0 0 1-4-.8L3 21l1.8-4.3A8.2 8.2 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z" />
  </svg>
);

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
    <path d="M10 21h4" />
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 8.5 8.5 0 1 0 21 14.5Z" />
  </svg>
);

const FullscreenIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M16 3h3a2 2 0 0 1 2 2v3" />
    <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c.8-4 3.5-6 8-6s7.2 2 8 6" />
  </svg>
);

const ProfileIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c.8-4 3.5-6 8-6s7.2 2 8 6" />
  </svg>
);

const DashboardIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
);

const LockIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="5" y="10" width="14" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
    <path d="M14 8l4 4-4 4" />
    <path d="M18 12H9" />
  </svg>
);

function TopNavbar({ collapsed: propCollapsed, setCollapsed: propSetCollapsed }) {
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (propCollapsed !== undefined) return propCollapsed;
    return typeof window !== "undefined" ? window.innerWidth < 1024 : false;
  });

  const [balance, setBalance] = useState(0);
  const [showRecharge, setShowRecharge] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem("user") || "null");
  });

  useEffect(() => {
    if (propCollapsed !== undefined) {
      setIsCollapsed(propCollapsed);
    }
  }, [propCollapsed]);

  useEffect(() => {
    const handleSync = (e) => {
      setIsCollapsed(e.detail);
    };
    window.addEventListener("shipdrop:sidebarState", handleSync);
    return () => window.removeEventListener("shipdrop:sidebarState", handleSync);
  }, []);

  const handleOpenSidebar = () => {
    const next = false;
    setIsCollapsed(next);
    if (typeof propSetCollapsed === "function") {
      propSetCollapsed(next);
    }
    window.dispatchEvent(new CustomEvent("shipdrop:sidebarState", { detail: next }));
  };

  const loadUserProfile = async () => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    if (!savedUser?.id) return;
    try {
      const response = await api.get(`/users/profile/${savedUser.id}`);
      const updatedUser = response.data.user;
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (error) {
      console.log("Profile loading error:", error);
    }
  };

  const loadWallet = async () => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    if (!savedUser?.id) return;
    try {
      const response = await api.get(`/payments/wallet?user_id=${savedUser.id}`);
      setBalance(Number(response.data.balance));
    } catch (error) {
      console.log("Wallet loading error:", error);
    }
  };

  useEffect(() => {
    loadUserProfile();
    loadWallet();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const handleUserUpdated = (event) => {
      if (event.detail) {
        setUser(event.detail);
        localStorage.setItem("user", JSON.stringify(event.detail));
      } else {
        loadUserProfile();
      }
    };
    window.addEventListener("userUpdated", handleUserUpdated);
    return () => window.removeEventListener("userUpdated", handleUserUpdated);
  }, []);

  useEffect(() => {
    const handleWalletUpdated = (event) => {
      const updatedBalance = Number(event?.detail?.balance);
      if (Number.isFinite(updatedBalance)) {
        setBalance(updatedBalance);
        return;
      }
      loadWallet();
    };
    window.addEventListener("walletUpdated", handleWalletUpdated);
    return () => window.removeEventListener("walletUpdated", handleWalletUpdated);
  }, []);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRecharge = async () => {
    const rechargeAmount = Number(amount);
    if (!rechargeAmount || rechargeAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!user?.id) {
      toast.error("Please login again");
      return;
    }

    setLoading(true);
    try {
      const razorpayLoaded = await loadRazorpay();
      if (!razorpayLoaded) {
        toast.error("Unable to load Razorpay");
        return;
      }

      const response = await api.post("/payments/create-order", {
        user_id: user.id,
        amount: rechargeAmount,
      });

      const { order_id, amount: razorpayAmount, currency, key_id } = response.data;

      const options = {
        key: key_id,
        amount: razorpayAmount,
        currency,
        name: "ShipDrop",
        description: "Wallet Recharge",
        order_id,
        prefill: {
          name: user.full_name || "",
          email: user.email || "",
          contact: user.phone_no || "",
        },
        theme: { color: "#008dd2" },
        handler: async function (paymentResponse) {
          try {
            const verifyResponse = await api.post("/payments/verify", {
              user_id: user.id,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });

            setBalance(Number(verifyResponse.data.balance));
            setAmount("");
            setShowRecharge(false);
            toast.success("Wallet recharged successfully");
          } catch (error) {
            toast.error(error.response?.data?.message || "Payment verification failed");
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.log("Recharge error:", error);
      toast.error(error.response?.data?.message || "Unable to start recharge");
    } finally {
      setLoading(false);
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleTheme = () => {
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const openProfile = () => {
    setShowProfile(false);
    navigate("/general-settings");
  };

  const userName = user?.full_name || "User";
  const userEmail = user?.email || "";

  return (
    <>
      <header
        className={`fixed top-0 right-0 z-30 flex h-[64px] items-center justify-between border-b border-slate-200 bg-white px-2.5 sm:px-6 transition-all duration-300 ${
          isCollapsed ? "left-0" : "left-0 lg:left-[250px]"
        }`}
      >
        {/* ======================================================== */}
        {/* LEFT SECTION: HAMBURGER + SHIPDROP (Auto-hidden on desktop when sidebar open) */}
        {/* ======================================================== */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {(isCollapsed || (typeof window !== "undefined" && window.innerWidth < 1024)) && (
            <button
              type="button"
              onClick={handleOpenSidebar}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200 active:scale-90"
              title="Open Sidebar"
              aria-label="Open Sidebar"
            >
              <FiMenu size={20} />
            </button>
          )}

          {(isCollapsed || (typeof window !== "undefined" && window.innerWidth < 1024)) && (
            <div className="flex items-center gap-1.5">
              <span className="text-[17px] sm:text-[20px] font-black tracking-tight text-[#008dd2]">
                ShipDrop
              </span>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* RIGHT SECTION: WALLET PILL + ACTIONS + PROFILE */}
        {/* ======================================================== */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          {/* COMPACT TOUCH-FRIENDLY WALLET PILL */}
          <div className="flex items-center rounded-full bg-violet-50/90 px-2 sm:px-2.5 py-1 border border-violet-100/90 shrink-0">
            <span className="text-violet-600 shrink-0">
              <WalletIcon />
            </span>
            <span className="ml-1 sm:ml-1.5 text-[11px] sm:text-xs font-bold text-slate-800">
              ₹{balance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
            <button
              type="button"
              onClick={() => setShowRecharge(true)}
              className="ml-1.5 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white transition hover:bg-violet-700 active:scale-90 shrink-0 shadow-xs"
              title="Recharge Wallet"
            >
              +
            </button>
          </div>

          {/* CHAT (Tablet & Desktop) */}
          <button
            type="button"
            title="Chat"
            onClick={() => toast("Chat coming soon")}
            className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 shrink-0"
          >
            <ChatIcon />
          </button>

          {/* NOTIFICATION */}
          <button
            type="button"
            title="Notifications"
            onClick={() => toast("No new notifications")}
            className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 active:scale-90 shrink-0"
          >
            <BellIcon />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>

          {/* THEME (Tablet & Desktop) */}
          <button
            type="button"
            title="Theme"
            onClick={handleTheme}
            className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 shrink-0"
          >
            <MoonIcon />
          </button>

          {/* FULLSCREEN (Desktop) */}
          <button
            type="button"
            title="Fullscreen"
            onClick={handleFullscreen}
            className="hidden md:flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 shrink-0"
          >
            <FullscreenIcon />
          </button>

          {/* PROFILE AVATAR & DROPDOWN */}
          <div ref={profileRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowProfile((prev) => !prev)}
              className="flex items-center gap-2 rounded-full p-0.5 sm:p-1 transition hover:bg-slate-100 active:scale-95"
            >
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-600 ring-2 ring-slate-100 shrink-0">
                {user?.profile_image ? (
                  <img src={user.profile_image} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <UserIcon />
                )}
              </div>
              <span className="hidden max-w-[120px] truncate text-xs font-semibold text-slate-700 lg:block">
                {userName}
              </span>
            </button>

            {showProfile && (
              <div className="absolute right-0 top-11 sm:top-12 w-60 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl z-50 animate-in fade-in duration-100">
                <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 bg-slate-50/70">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-500">
                    {user?.profile_image ? (
                      <img src={user.profile_image} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <UserIcon />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900">{userName}</p>
                    <p className="truncate text-[11px] text-slate-400">{userEmail}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openProfile}
                  className="flex w-full items-center gap-2.5 border-b border-slate-50 px-4 py-2.5 text-left text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  <ProfileIcon />
                  <span>Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowProfile(false);
                    navigate("/dashboard");
                  }}
                  className="flex w-full items-center gap-2.5 border-b border-slate-50 px-4 py-2.5 text-left text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  <DashboardIcon />
                  <span>User Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowProfile(false);
                    toast("Password page coming soon");
                  }}
                  className="flex w-full items-center gap-2.5 border-b border-slate-50 px-4 py-2.5 text-left text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  <LockIcon />
                  <span>Password</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-bold text-rose-500 transition hover:bg-rose-50"
                >
                  <LogoutIcon />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* RECHARGE MODAL */}
      {showRecharge && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-xs px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Recharge Wallet</h2>
                <p className="mt-0.5 text-xs text-slate-400">Add money to your ShipDrop balance</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRecharge(false)}
                className="text-2xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Enter Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="h-11 w-full rounded-xl border border-slate-200 pl-8 pr-4 text-sm font-semibold outline-none focus:border-[#008dd2]"
              />
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {[500, 1000, 2000, 5000].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAmount(String(value))}
                  className="rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-600 transition hover:border-[#008dd2] hover:text-[#008dd2]"
                >
                  ₹{value}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleRecharge}
              disabled={loading}
              className="mt-5 w-full rounded-xl bg-[#008dd2] py-3 text-xs font-bold text-white shadow-xs transition hover:bg-[#007ab6] disabled:opacity-60"
            >
              {loading ? "Please wait..." : "Proceed to Recharge"}
            </button>
            <p className="mt-3 text-center text-[10px] text-slate-400">
              Secure payments powered by Razorpay
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default TopNavbar;