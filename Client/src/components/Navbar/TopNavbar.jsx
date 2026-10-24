  import { useEffect, useRef, useState } from "react";
  import { toast } from "react-hot-toast";
  import { Link, useNavigate } from "react-router-dom";
  import { FiMenu, FiSearch, FiCommand } from "react-icons/fi";
  import api from "../../services/api";
  import { notifyOrderChange } from "../../services/orderEvents";
  import shipdropLogo from "../../assets/images/shipdrop-logo.png";



  const WalletIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 7V6a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v8a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V7" />
      <path d="M16 13h2" />
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

  const SunIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
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

    const [balance, setBalance] = useState(() => {
      try {
        const cached = sessionStorage.getItem("shipdrop_dash_wallet");
        return cached ? Number(cached) || 0 : 0;
      } catch {
        return 0;
      }
    });
    const [showRecharge, setShowRecharge] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const profileRef = useRef(null);

    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const notifRef = useRef(null);
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);

    const [isDark, setIsDark] = useState(() => {
      if (typeof window !== "undefined") {
        return (
          document.documentElement.classList.contains("dark") ||
          localStorage.getItem("shipdrop_theme") === "dark"
        );
      }
      return false;
    });

    useEffect(() => {
      const syncTheme = () => {
        setIsDark(document.documentElement.classList.contains("dark"));
      };
      syncTheme();
      window.addEventListener("shipdrop:themeChange", syncTheme);
      return () => window.removeEventListener("shipdrop:themeChange", syncTheme);
    }, []);

    // ======================================================
    // TRACKING SEARCH STATE
    // ======================================================

    const [trackingSearch, setTrackingSearch] = useState("");
    const [trackingSearchLoading, setTrackingSearchLoading] = useState(false);
    const [trackingOrder, setTrackingOrder] = useState(null);
    const [showTrackingDetails, setShowTrackingDetails] = useState(false);


  useEffect(() => {
    const search = String(trackingSearch || "").trim();

    if (!search || trackingSearchLoading) {
      return;
    }

    // ============================================
    // 14 DIGITS = AWB
    // IMMEDIATELY SEARCH
    // ============================================
    if (/^\d{14}$/.test(search)) {
      handleTrackingSearch();
      return;
    }

    // ============================================
    // 6 DIGITS = ORDER ID
    // WAIT 700ms AFTER TYPING STOPS
    // ============================================
    if (/^\d{6}$/.test(search)) {
      const timer = setTimeout(() => {
        handleTrackingSearch();
      }, 700);

      return () => clearTimeout(timer);
    }

    // ============================================
    // ANY OTHER LENGTH
    // DO NOTHING
    // ============================================
  }, [trackingSearch]);



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

    const loadNotifications = async (silent = false) => {
      const savedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (!savedUser?.id) return;
      try {
        const response = await api.get(`/notifications?user_id=${savedUser.id}`);
        if (response.data?.success) {
          setUnreadNotifCount(Number(response.data.unread_count || 0));
          setNotifications(Array.isArray(response.data.notifications) ? response.data.notifications : []);
        }
      } catch (error) {
        // silent fail
      }
    };

    const handleNotificationClick = async (notif) => {
      if (!notif) return;
      try {
        if (!notif.is_read) {
          // Immediately remove from notification box so it becomes empty once read
          setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
          setUnreadNotifCount((prev) => Math.max(0, prev - 1));
          const savedUser = JSON.parse(localStorage.getItem("user") || "null");
          await api.post("/notifications/mark-read", {
            user_id: savedUser?.id,
            notification_id: notif.id,
          });
        }
      } catch (err) {
        // silent
      }
      setShowNotifications(false);
      if (notif.reference_id) {
        navigate(`/tickets?ticket_id=${notif.reference_id}`, {
          state: { ticketId: Number(notif.reference_id) },
        });
      } else if (notif.reference_url) {
        navigate(notif.reference_url);
      }
    };

    const handleDismissNotification = async (e, notif) => {
      e?.stopPropagation?.();
      if (!notif) return;
      setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
      setUnreadNotifCount((prev) => Math.max(0, prev - 1));
      try {
        const savedUser = JSON.parse(localStorage.getItem("user") || "null");
        await api.post("/notifications/mark-read", {
          user_id: savedUser?.id,
          notification_id: notif.id,
        });
      } catch (err) {
        // silent
      }
    };

    const handleMarkAllNotificationsRead = async () => {
      const savedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (!savedUser?.id) return;
      // Immediately clear notification box so it's empty
      setNotifications([]);
      setUnreadNotifCount(0);
      try {
        await api.post("/notifications/mark-read", {
          user_id: savedUser.id,
          mark_all: true,
        });
        toast.success("All notifications marked as read", { id: "notif-read", duration: 1500 });
      } catch (err) {
        loadNotifications(true);
      }
    };

    const formatTimeAgo = (dateStr) => {
      if (!dateStr) return "";
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return "Just now";
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour}h ago`;
      const diffDays = Math.floor(diffHour / 24);
      return `${diffDays}d ago`;
    };

    useEffect(() => {
      loadUserProfile();
      loadWallet();
      loadNotifications();

      // Background auto-sync notifications every 20 seconds when tab is active
      const notifInterval = setInterval(() => {
        if (typeof document !== "undefined" && document.visibilityState === "visible") {
          loadNotifications(true);
        }
      }, 20000);

      const handleNotifUpdate = () => loadNotifications(true);
      window.addEventListener("shipdrop:notificationsUpdated", handleNotifUpdate);

      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          loadNotifications(true);
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        clearInterval(notifInterval);
        window.removeEventListener("shipdrop:notificationsUpdated", handleNotifUpdate);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }, []);

    useEffect(() => {
      const handleOutsideClick = (event) => {
        if (profileRef.current && !profileRef.current.contains(event.target)) {
          setShowProfile(false);
        }
        if (notifRef.current && !notifRef.current.contains(event.target)) {
          setShowNotifications(false);
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
          name: "ParcelDrop",
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

    // ======================================================
    // TRACKING HELPERS
    // ======================================================

    const handleTrackingSearch = async (event) => {
      event?.preventDefault();

      const search = String(trackingSearch || "").trim();

      if (!search) {
        toast.error("Enter Tracking ID or Order ID");
        return;
      }

      const userId = user?.id;

      if (!userId) {
        toast.error("Please login again");
        return;
      }

      setTrackingSearchLoading(true);

      try {
        const response = await api.get("/orders/tracking-search", {
          params: {
            user_id: userId,
            search,
          },
        });

        const order = response.data?.order;

        if (!order) {
          toast.error("Shipment not found");
          return;
        }

        setTrackingOrder(order);
  setTrackingSearch("");
  setShowTrackingDetails(true);
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Unable to search shipment"
        );
      } finally {
        setTrackingSearchLoading(false);
      }
    };


    useEffect(() => {
  const handleOpenTracking = async (event) => {
    const awb = String(event.detail || "").trim();

    if (!awb) return;

    const userId = user?.id;

    if (!userId) {
      toast.error("Please login again");
      return;
    }

    setTrackingSearch(awb);
    setTrackingSearchLoading(true);

    try {
      const response = await api.get("/orders/tracking-search", {
        params: {
          user_id: userId,
          search: awb,
        },
      });

      const order = response.data?.order;

      if (!order) {
        toast.error("Shipment not found");
        return;
      }

      setTrackingOrder(order);
      setShowTrackingDetails(true);
      setTrackingSearch("");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to search shipment"
      );
    } finally {
      setTrackingSearchLoading(false);
    }
  };

  window.addEventListener(
    "shipdrop:openTracking",
    handleOpenTracking
  );

  return () => {
    window.removeEventListener(
      "shipdrop:openTracking",
      handleOpenTracking
    );
  };
}, [user?.id]);

    const closeTrackingDetails = () => {
      setShowTrackingDetails(false);
      setTrackingOrder(null);
    };

    const formatTrackingDateTime = (value) => {
      if (!value) return "—";

      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return String(value);
      }

      return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    };

    const formatTrackingDate = (value) => {
      if (!value) return "—";

      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return String(value);
      }

      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    const humanizeTrackingStatus = (value) => {
      const text = String(value || "").trim();

      if (!text) return "Tracking unavailable";

      return text
        .toLowerCase()
        .split(" ")
        .map((word) =>
          word ? word.charAt(0).toUpperCase() + word.slice(1) : word
        )
        .join(" ");
    };








    const getExpectedDelivery = (order) => {
    if (!order) return null;

    if (order.tracking_expected_delivery) {
      return order.tracking_expected_delivery;
    }

    if (order.expected_delivery) {
      return order.expected_delivery;
    }

    let trackingData = order.tracking_data;

    if (typeof trackingData === "string") {
      try {
        trackingData = JSON.parse(trackingData);
      } catch {
        trackingData = null;
      }
    }

    return (
      trackingData?.ExpectedDeliveryDate ||
      trackingData?.ExpectedDeliveryDateTime ||
      trackingData?.expected_delivery ||
      trackingData?.expectedDelivery ||
      null
    );
  };







    const getTrackingScans = (order) => {
      const scans = Array.isArray(order?.tracking_scans)
        ? order.tracking_scans
        : [];

      return scans
        .map((scan, index) => {
          const detail =
            scan?.ScanDetail ||
            scan?.scanDetail ||
            scan?.scan_detail ||
            scan ||
            {};

          return {
            id: `${index}-${
              detail?.ScanDateTime ||
              detail?.scan_date_time ||
              detail?.Scan ||
              index
            }`,
            status:
              detail?.Instructions ||
              detail?.ScanType ||
              detail?.ScanGroup ||
              detail?.Status ||
              detail?.scan_type ||
              "Shipment update",
  location:
    detail?.ScannedLocation ||
    detail?.scanned_location ||
    detail?.ScanLocation ||
    detail?.scan_location ||
    detail?.StatusLocation ||
    detail?.status_location ||
    detail?.Location ||
    detail?.location ||
    "",
            dateTime:
              detail?.ScanDateTime ||
              detail?.scan_date_time ||
              detail?.StatusDateTime ||
              detail?.status_date_time ||
              detail?.DateTime ||
              detail?.date_time ||
              null,
            instructions:
              detail?.Instructions ||
              detail?.instructions ||
              "",
          };
        })
        .sort((a, b) => {
          const aTime = new Date(a.dateTime || 0).getTime();
          const bTime = new Date(b.dateTime || 0).getTime();
          return bTime - aTime;
        });
    };

    const getTrackingCourier = (order) =>
      order?.courier_name ||
      order?.courier ||
      order?.partner_name ||
      order?.partner ||
      "Delhivery";

    const trackingScans = getTrackingScans(trackingOrder);




    const handleTheme = () => {
      const nextDark = !document.documentElement.classList.contains("dark");
      if (nextDark) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("shipdrop_theme", "dark");
        toast.success("Dark mode enabled", { id: "theme-toast", duration: 1500 });
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("shipdrop_theme", "light");
        toast.success("Light mode enabled", { id: "theme-toast", duration: 1500 });
      }
      setIsDark(nextDark);
      window.dispatchEvent(new CustomEvent("shipdrop:themeChange", { detail: nextDark }));
    };

    const handleLogout = async () => {
      const rawImp = localStorage.getItem("shipdrop_impersonation");
      let impersonation = null;
      try {
        impersonation = rawImp ? JSON.parse(rawImp) : null;
      } catch {
        // parsing error
      }

      if (impersonation?.active) {
        try {
          await api.post("/users/impersonate/end", {
            session_id: impersonation.session_id,
          });
        } catch {
          // continue
        }
        const returnUrl =
          impersonation.admin_return_url || "http://localhost:5174/users";
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("shipdrop_impersonation");
        toast.success("Returned from Admin Support mode");
        window.location.href = returnUrl;
        return;
      }

      try {
        await api.post("/users/logout");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        toast.success("Logged out successfully");
        navigate("/login");
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          toast.success("Logged out successfully");
          navigate("/login");
          return;
        }
        console.error("Logout error:", err);
        toast.error(
          err.response?.data?.message ||
            "Unable to complete logout on server. Please try again."
        );
      }
    };

    const openProfile = () => {
      setShowProfile(false);
      navigate("/general-settings");
    };

    const userName = user?.full_name || "User";
    const userEmail = user?.email || "";
    const rawCompanyName = user?.company_name || user?.company;
    const companyName = rawCompanyName ? String(rawCompanyName).trim() : "";
    const displayCompanyName = companyName || "ShipDrop Services";

    const getCompanyInitials = (name) => {
      if (!name) return "SS";
      const words = String(name).trim().split(/\s+/).filter(Boolean);
      if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
      }
      return String(name).slice(0, 2).toUpperCase();
    };

    const companyInitials = getCompanyInitials(displayCompanyName);

    return (
      <>
        <header
          className={`fixed top-0 right-0 z-30 flex h-[64px] items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-2.5 sm:px-6 transition-all duration-300 ${
            isCollapsed ? "left-0" : "left-0 lg:left-[250px]"
          }`}
        >
          {/* ======================================================== */}
          {/* ======================================================== */}
          {/* LEFT SECTION: HAMBURGER + LOGO (When collapsed) + TRACKING SEARCH */}
          {/* ======================================================== */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
              <Link
                to="/dashboard"
                className="flex items-center transition hover:opacity-90 active:scale-95"
                title="ParcelDrop"
              >
                <img
                  src={shipdropLogo}
                  alt="ParcelDrop"
                  className="h-9 sm:h-[42px] mt-1.5 w-auto max-w-[150px] sm:max-w-[170px] object-contain translate-y-[2.5px]"
                />
              </Link>
            )}

            {/* TRACKING SEARCH (Cleanly Left-Aligned) */}
            <form
              onSubmit={handleTrackingSearch}
              className="hidden md:flex relative items-center w-[230px] lg:w-[270px] xl:w-[310px]"
            >
              <FiSearch
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />

              <input
                type="text"
                value={trackingSearch}
                onChange={(event) => setTrackingSearch(event.target.value)}
                placeholder="Enter Tracking ID or Order ID..."
                disabled={trackingSearchLoading}
                className="h-10 w-full rounded-[14px] border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 pl-10 pr-10 text-xs font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-[#008dd2] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-[#008dd2]/10 disabled:cursor-not-allowed disabled:opacity-70"
              />

              {trackingSearchLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                  <div className="h-4 w-4 rounded-full border-2 border-[#008dd2] border-t-transparent animate-spin" />
                </div>
              )}
            </form>

            {/* DEDICATED QUICK ACTIONS (CTRL + K) BUTTON */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("shipdrop:openCommandPalette"))}
              title="Quick Actions & Navigation (Ctrl + K)"
              className="hidden lg:flex items-center gap-2 h-10 px-3 rounded-[14px] border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:text-[#008dd2] dark:hover:text-[#38bdf8] hover:border-[#008dd2]/40 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-all duration-150 cursor-pointer shadow-2xs group"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#008dd2]/10 text-[#008dd2] dark:text-[#38bdf8] group-hover:scale-110 transition-transform">
                <FiCommand size={12} />
              </span>
              <span className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-200">
                Quick Actions
              </span>
              <kbd className="flex items-center rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-slate-400 dark:text-slate-400 group-hover:text-[#008dd2] group-hover:border-[#008dd2]/40 transition shadow-2xs">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* ======================================================== */}
          {/* RIGHT SECTION: 1. WALLET -> 2. BELL -> 3. COMPANY NAME -> 4. PROFILE */}
          {/* ======================================================== */}
          <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 shrink-0">
            {/* 1. WALLET PILL (40px Height Grid) */}
            <div className="flex h-10 items-center rounded-[14px] bg-violet-50/90 dark:bg-violet-950/40 px-3 border border-violet-100 dark:border-violet-900/50 shrink-0 gap-1.5 shadow-2xs">
              <span className="text-violet-600 dark:text-violet-400 shrink-0">
                <WalletIcon />
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                ₹{balance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </span>
              <button
                type="button"
                onClick={() => setShowRecharge(true)}
                className="ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#008dd2] text-xs font-bold text-white transition hover:bg-[#007ab6] active:scale-90 shrink-0 shadow-2xs"
                title="Recharge Wallet"
              >
                +
              </button>
            </div>

            {/* 2. NOTIFICATION BELL (40px Height Grid with Popover) */}
            <div ref={notifRef} className="relative shrink-0">
              <button
                type="button"
                title={unreadNotifCount > 0 ? `${unreadNotifCount} unread notifications` : "Notifications"}
                onClick={() => setShowNotifications((prev) => !prev)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 shrink-0 cursor-pointer"
              >
                <BellIcon />
                {unreadNotifCount > 0 && (
                  <span className="absolute right-2.5 top-2.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 ring-2 ring-white dark:ring-[#111827]"></span>
                  </span>
                )}
              </button>

              {/* NOTIFICATIONS DROPDOWN */}
              {showNotifications && (
                <div className="absolute right-[-70px] sm:right-[-20px] md:right-0 top-12 w-[310px] sm:w-[330px] overflow-hidden rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl dark:shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-100 origin-top-right">
                  {/* HEADER */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-3.5 py-2.5 bg-slate-50/70 dark:bg-slate-850/60">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Notifications
                      </span>
                      {unreadNotifCount > 0 && (
                        <span className="rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-900/60 px-1.5 py-0.2 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                          {unreadNotifCount}
                        </span>
                      )}
                    </div>
                    {unreadNotifCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllNotificationsRead}
                        className="text-[11px] font-medium text-slate-500 hover:text-[#008dd2] dark:text-slate-400 dark:hover:text-[#38bdf8] transition-colors cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* NOTIFICATION LIST */}
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 [scrollbar-width:thin]">
                    {notifications.length === 0 ? (
                      <div className="py-7 px-4 text-center select-none">
                        <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                          </svg>
                        </div>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          No notifications
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          You're all caught up
                        </p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className="flex items-start gap-2.5 px-3.5 py-2.5 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 bg-sky-50/20 dark:bg-sky-950/10"
                        >
                          {/* ICON */}
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/60 text-[#008dd2] dark:text-[#38bdf8] mt-0.5 border border-sky-100 dark:border-sky-900/50">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1.5">
                              <p className="text-xs truncate font-semibold text-slate-800 dark:text-slate-200">
                                {notif.title}
                              </p>
                              <div className="flex items-center gap-1 shrink-0">
                                {Number(notif.message_count) > 1 && (
                                  <span className="rounded bg-[#008dd2]/10 text-[#008dd2] dark:text-[#38bdf8] font-bold text-[10px] px-1.5 py-0.2 border border-[#008dd2]/20">
                                    {notif.message_count}
                                  </span>
                                )}
                                <span className="h-1.5 w-1.5 rounded-full bg-[#008dd2]"></span>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 leading-normal">
                              {notif.message}
                            </p>

                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                {formatTimeAgo(notif.created_at)}
                              </span>
                              <button
                                type="button"
                                title="Dismiss notification"
                                onClick={(e) => handleDismissNotification(e, notif)}
                                className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium transition-colors cursor-pointer"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* FOOTER */}
                  <div className="border-t border-slate-100 dark:border-slate-800 p-2 bg-slate-50/50 dark:bg-slate-850/40 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotifications(false);
                        navigate("/tickets");
                      }}
                      className="text-[11px] font-medium text-[#008dd2] dark:text-[#38bdf8] hover:underline cursor-pointer"
                    >
                      View all tickets →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. COMPANY NAME & 4. PROFILE (Grouped together with Dropdown) */}
            <div ref={profileRef} className="relative flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* 3. COMPANY NAME BADGE */}
              <button
                type="button"
                onClick={() => setShowProfile((prev) => !prev)}
                className="flex h-10 items-center gap-2.5 rounded-[14px] border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 pl-1.5 pr-3.5 shadow-2xs transition-all duration-150 hover:bg-slate-100/70 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shrink-0 cursor-pointer text-left"
                title={`Company: ${displayCompanyName} (Click to open menu)`}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#008dd2] text-[11px] font-black text-white uppercase tracking-wider shadow-xs shadow-[#008dd2]/20">
                  {companyInitials}
                </div>
                <span className="hidden sm:inline-block text-[12px] font-bold uppercase tracking-wide text-slate-800 dark:text-slate-100 truncate max-w-[130px] md:max-w-[190px] lg:max-w-[240px]">
                  {displayCompanyName}
                </span>
              </button>

              {/* 4. PROFILE AVATAR */}
              <button
                type="button"
                onClick={() => setShowProfile((prev) => !prev)}
                title={userName}
                aria-label="User Profile Menu"
                className="flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-90"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 transition-all duration-200 ${
                    showProfile
                      ? "ring-2 ring-[#008dd2] ring-offset-2 ring-offset-white dark:ring-offset-[#111827] shadow-sm shadow-[#008dd2]/30 scale-105"
                      : "ring-1.5 ring-slate-200/90 dark:ring-slate-700/80 hover:ring-2 hover:ring-[#008dd2]/70 hover:scale-105 hover:shadow-sm"
                  }`}
                >
                  {user?.profile_image ? (
                    <img
                      src={user.profile_image}
                      alt={userName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#008dd2] to-sky-600 text-[13px] font-bold text-white uppercase tracking-wider">
                      {userName?.charAt(0) || <UserIcon />}
                    </div>
                  )}
                </div>
              </button>

              {/* PROFILE DROPDOWN MENU */}
              {showProfile && (
                <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xl z-50 animate-in fade-in duration-100">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 px-4 py-3 bg-slate-50/70 dark:bg-slate-800/60">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                      {user?.profile_image ? (
                        <img src={user.profile_image} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <UserIcon />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">{userName}</p>
                      {companyName && (
                        <p className="truncate text-[10.5px] font-bold uppercase tracking-wider text-[#008dd2] dark:text-[#38bdf8]">
                          {companyName}
                        </p>
                      )}
                      <p className="truncate text-[11px] text-slate-400 dark:text-slate-400">{userEmail}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={openProfile}
                    className="flex w-full items-center gap-2.5 border-b border-slate-50 dark:border-slate-800/60 px-4 py-2.5 text-left text-xs font-medium text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800/80"
                  >
                    <ProfileIcon />
                    <span>Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTheme}
                    className="flex w-full items-center justify-between border-b border-slate-50 dark:border-slate-800/60 px-4 py-2.5 text-left text-xs font-medium text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800/80"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isDark ? "text-amber-400" : "text-slate-600 dark:text-slate-300"}>
                        {isDark ? <SunIcon /> : <MoonIcon />}
                      </span>
                      <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition ${
                        isDark
                          ? "bg-amber-400/15 text-amber-400 border border-amber-400/30"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {isDark ? "Dark" : "Light"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProfile(false);
                      navigate("/dashboard");
                    }}
                    className="flex w-full items-center gap-2.5 border-b border-slate-50 dark:border-slate-800/60 px-4 py-2.5 text-left text-xs font-medium text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800/80"
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
                    className="flex w-full items-center gap-2.5 border-b border-slate-50 dark:border-slate-800/60 px-4 py-2.5 text-left text-xs font-medium text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800/80"
                  >
                    <LockIcon />
                    <span>Password</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-bold text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <LogoutIcon />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* TRACKING DETAILS MODAL */}
        {showTrackingDetails && trackingOrder && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-3 py-4 backdrop-blur-[2px]"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeTrackingDetails();
              }
            }}
          >
            <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              {/* HEADER */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#008dd2]">
                      <FiSearch size={17} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold text-slate-800 sm:text-lg">
                        Tracking Details
                      </h2>
                      <p className="mt-0.5 truncate text-[10px] text-slate-400 sm:text-xs">
                        Live shipment status and Delhivery scan history
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeTrackingDetails}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close tracking details"
                >
                  ×
                </button>
              </div>

              {/* BODY */}
              <div className="overflow-y-auto bg-slate-50/60 px-4 py-4 sm:px-6 sm:py-5">
                {/* SUMMARY */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
                    <div className="px-4 py-3.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Order ID
                      </p>
                      <p className="mt-1 truncate text-sm font-bold text-slate-800">
                        {trackingOrder.order_id ?? trackingOrder.id ?? "—"}
                      </p>
                    </div>

                    <div className="px-4 py-3.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Tracking No
                      </p>
                      <p className="mt-1 truncate text-sm font-bold text-slate-800">
                        {trackingOrder.tracking_awb || trackingOrder.awb || "—"}
                      </p>
                    </div>

                    <div className="px-4 py-3.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Courier
                      </p>
                      <p className="mt-1 truncate text-sm font-bold text-slate-800">
                        {getTrackingCourier(trackingOrder)}
                      </p>
                    </div>

                    <div className="px-4 py-3.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Current Status
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <p className="truncate text-sm font-bold text-emerald-600">
                          {humanizeTrackingStatus(trackingOrder.tracking_status)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 border-t border-slate-100 md:grid-cols-2 lg:grid-cols-4">
                    <div className="border-b border-slate-100 px-4 py-3.5 md:border-b-0 md:border-r lg:border-r">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Status Location
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-700">
                        {trackingOrder.tracking_location || "—"}
                      </p>
                    </div>

                    <div className="border-b border-slate-100 px-4 py-3.5 lg:border-b-0 lg:border-r">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Status Date & Time
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-700">
                        {formatTrackingDateTime(trackingOrder.tracking_status_datetime)}
                      </p>
                    </div>

                  <div className="border-b border-slate-100 px-4 py-3.5 md:border-r lg:border-b-0">
    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
      Expected Delivery
    </p>

    <p className="mt-1 text-xs font-semibold text-slate-700">
      {formatTrackingDate(
    getExpectedDelivery(trackingOrder)
  )}
    </p>
  </div>

                    <div className="px-4 py-3.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Update
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-700">
                        {trackingOrder.tracking_instructions || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* TRACKING TIMELINE */}
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 sm:text-base">
                        Shipment Timeline
                      </h3>
                      <p className="mt-0.5 text-[10px] text-slate-400 sm:text-xs">
                        Complete tracking history from Delhivery
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                      {trackingScans.length} {trackingScans.length === 1 ? "event" : "events"}
                    </span>
                  </div>

                  {trackingScans.length > 0 ? (
                    <div className="relative">
                      <div className="absolute bottom-4 left-[7px] top-4 w-px bg-slate-200" />

                      <div className="space-y-3.5">
                        {trackingScans.map((scan, index) => (
                          <div key={scan.id} className="relative flex gap-3">
                            <div className="relative z-10 mt-4 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 border-[#008dd2] bg-white">
                              {index === 0 && (
                                <span className="h-1.5 w-1.5 rounded-full bg-[#008dd2]" />
                              )}
                            </div>

                            <div className={`min-w-0 flex-1 rounded-xl border px-4 py-3 transition ${
                              index === 0
                                ? "border-sky-200 bg-sky-50/50 shadow-sm"
                                : "border-slate-200 bg-white"
                            }`}>
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-slate-800">
                                    {scan.status || "Shipment update"}
                                  </p>
                                  {scan.location && (
                                    <p className="mt-1 text-[11px] font-medium text-slate-500">
                                      {scan.location}
                                    </p>
                                  )}
                                  {scan.instructions &&
                                    scan.instructions !== scan.status && (
                                      <p className="mt-1 text-[11px] leading-5 text-slate-500">
                                        {scan.instructions}
                                      </p>
                                    )}
                                </div>

                                <p className="shrink-0 text-[10px] font-semibold text-slate-400 sm:text-right">
                                  {formatTrackingDateTime(scan.dateTime)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
                      <p className="text-sm font-semibold text-slate-600">
                        No tracking scan history available
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        The latest shipment status is shown above.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex items-center justify-end border-t border-slate-100 bg-white px-5 py-3.5 sm:px-6">
                <button
                  type="button"
                  onClick={closeTrackingDetails}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}



        {/* RECHARGE MODAL */}
        {showRecharge && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-xs px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Recharge Wallet</h2>
                  <p className="mt-0.5 text-xs text-slate-400">Add money to your ParcelDrop balance</p>
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