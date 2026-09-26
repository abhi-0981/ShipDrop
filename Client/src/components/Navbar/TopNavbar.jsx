import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { FiMenu, FiSearch } from "react-icons/fi";
import api from "../../services/api";

const ImportIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
);

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

  // ======================================================
  // IMPORT ORDER STATE
  // ======================================================

  const [showImportOrder, setShowImportOrder] = useState(false);
  const [importWarehouses, setImportWarehouses] = useState([]);
  const [importReturnAddresses, setImportReturnAddresses] = useState([]);
  const [selectedImportWarehouseId, setSelectedImportWarehouseId] = useState("");
  const [selectedImportReturnAddressId, setSelectedImportReturnAddressId] = useState("");
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importLoadingAddresses, setImportLoadingAddresses] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [importMessage, setImportMessage] = useState("");
  const [importImportedCount, setImportImportedCount] = useState(0);
  const importFileRef = useRef(null);

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

  // ======================================================
  // IMPORT ORDER HELPERS
  // ======================================================

  const getImportUserId = () => {
    try {
      const savedUser = JSON.parse(localStorage.getItem("user") || "null");
      return savedUser?.id || user?.id || null;
    } catch {
      return user?.id || null;
    }
  };

  const getStoredDefaultImportWarehouse = (userId, list) => {
    if (!userId || !Array.isArray(list) || list.length === 0) {
      return null;
    }

    const explicitDefault = list.find((warehouse) => {
      const values = [
        warehouse.is_default,
        warehouse.isDefault,
        warehouse.default,
        warehouse.is_default_pickup,
        warehouse.isDefaultPickup,
        warehouse.default_pickup,
        warehouse.defaultPickup,
        warehouse.is_primary,
        warehouse.isPrimary,
      ];

      return values.some(
        (value) =>
          value === true ||
          value === 1 ||
          String(value).trim().toLowerCase() === "true" ||
          String(value).trim().toLowerCase() === "default"
      );
    });

    if (explicitDefault) return explicitDefault;

    const possibleKeys = [
      `shipdrop_default_warehouse_${userId}`,
      "shipdrop_default_warehouse",
      `default_warehouse_${userId}`,
      "default_warehouse",
      `defaultWarehouseId_${userId}`,
      "defaultWarehouseId",
    ];

    for (const key of possibleKeys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;

        let stored = raw;
        try {
          stored = JSON.parse(raw);
        } catch {
          // Keep raw value.
        }

        const storedId =
          typeof stored === "object" && stored !== null
            ? stored.id ?? stored.warehouse_id ?? stored.warehouseId
            : stored;

        const match = list.find(
          (warehouse) => String(warehouse.id) === String(storedId)
        );

        if (match) return match;
      } catch {
        // Ignore invalid localStorage values.
      }
    }

    return null;
  };

  const loadImportAddresses = async () => {
    const userId = getImportUserId();

    if (!userId) {
      toast.error("Please login again");
      return;
    }

    setImportLoadingAddresses(true);
    setImportErrors([]);
    setImportMessage("");

    try {
      // Load each source independently. A problem with one endpoint should
      // not prevent the other dropdown from loading.
      const [warehouseResult, returnResult, defaultReturnResult] =
        await Promise.allSettled([
          api.get("/warehouses", {
            params: { user_id: userId },
          }),
          api.get("/return-addresses", {
            params: { user_id: userId },
          }),
          api.get("/return-addresses/default", {
            params: { user_id: userId },
          }),
        ]);

      // ----------------------------------------------
      // PICKUP / WAREHOUSE
      // ----------------------------------------------
      if (warehouseResult.status === "fulfilled") {
        const warehouseResponse = warehouseResult.value;
        const warehouseList = Array.isArray(
          warehouseResponse.data?.warehouses
        )
          ? warehouseResponse.data.warehouses.filter(
              (item) =>
                String(item.status || "ACTIVE").toUpperCase() === "ACTIVE"
            )
          : [];

        setImportWarehouses(warehouseList);

        // The warehouse API currently returns the warehouse list only.
        // Therefore use the same default-warehouse storage logic already
        // used by Create Order.
        const defaultWarehouse =
          getStoredDefaultImportWarehouse(userId, warehouseList);

        if (defaultWarehouse?.id) {
          setSelectedImportWarehouseId(String(defaultWarehouse.id));
        } else if (warehouseList.length === 1) {
          setSelectedImportWarehouseId(String(warehouseList[0].id));
        } else {
          setSelectedImportWarehouseId("");
        }
      } else {
        console.error(
          "Import pickup address loading error:",
          warehouseResult.reason
        );
        setImportWarehouses([]);
        setSelectedImportWarehouseId("");
        toast.error(
          warehouseResult.reason?.response?.data?.message ||
            "Unable to load pickup addresses"
        );
      }

      // ----------------------------------------------
      // RETURN ADDRESSES
      // ----------------------------------------------
      let returnList = [];

      if (returnResult.status === "fulfilled") {
        const response = returnResult.value;
        returnList = Array.isArray(response.data?.addresses)
          ? response.data.addresses
          : [];
      } else {
        console.error(
          "Import return address loading error:",
          returnResult.reason
        );
        toast.error(
          returnResult.reason?.response?.data?.message ||
            "Unable to load return addresses"
        );
      }

      let defaultReturn = null;

      if (defaultReturnResult.status === "fulfilled") {
        const response = defaultReturnResult.value;
        defaultReturn =
          response.data?.return_address ||
          response.data?.address ||
          null;
      } else if (defaultReturnResult.reason?.response?.status !== 404) {
        console.error(
          "Default return address loading error:",
          defaultReturnResult.reason
        );
      }

      if (
        defaultReturn?.id &&
        !returnList.some(
          (item) => String(item.id) === String(defaultReturn.id)
        )
      ) {
        returnList = [defaultReturn, ...returnList];
      }

      setImportReturnAddresses(returnList);

      if (defaultReturn?.id) {
        setSelectedImportReturnAddressId(String(defaultReturn.id));
      } else if (returnList.length === 1) {
        setSelectedImportReturnAddressId(String(returnList[0].id));
      } else {
        setSelectedImportReturnAddressId("");
      }
    } catch (error) {
      console.error("Import address loading error:", error);
      toast.error(
        error.response?.data?.message ||
          "Unable to load import addresses"
      );
    } finally {
      setImportLoadingAddresses(false);
    }
  };

  const openImportOrder = () => {
    setShowProfile(false);
    setImportFile(null);
    setImportErrors([]);
    setImportMessage("");
    setImportImportedCount(0);
    setSelectedImportWarehouseId("");
    setSelectedImportReturnAddressId("");
    setShowImportOrder(true);
    loadImportAddresses();
  };

  const closeImportOrder = () => {
    if (importLoading) return;

    setShowImportOrder(false);
    setImportFile(null);
    setImportErrors([]);
    setImportMessage("");
    setImportImportedCount(0);
    setSelectedImportWarehouseId("");
    setSelectedImportReturnAddressId("");

    if (importFileRef.current) {
      importFileRef.current.value = "";
    }
  };

  const handleImportFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    setImportErrors([]);
    setImportMessage("");

    if (!file) {
      setImportFile(null);
      return;
    }

    const name = String(file.name || "").toLowerCase();

    if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      toast.error("Please select an Excel file (.xlsx or .xls)");
      event.target.value = "";
      setImportFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Excel file must be smaller than 10 MB");
      event.target.value = "";
      setImportFile(null);
      return;
    }

    setImportFile(file);
  };

  const handleImportOrders = async () => {
    const userId = getImportUserId();

    if (!userId) {
      toast.error("Please login again");
      return;
    }

    if (!selectedImportWarehouseId) {
      toast.error("Please select a pickup address");
      return;
    }

    if (!selectedImportReturnAddressId) {
      toast.error("Please select a return address");
      return;
    }

    if (!importFile) {
      toast.error("Please select an Excel file");
      return;
    }

    setImportLoading(true);
    setImportErrors([]);
    setImportMessage("");
    setImportImportedCount(0);

    try {
      const formData = new FormData();

      formData.append("user_id", String(userId));
      formData.append(
        "warehouse_id",
        String(selectedImportWarehouseId)
      );
      formData.append(
        "return_address_id",
        String(selectedImportReturnAddressId)
      );
      formData.append("file", importFile);

      const response = await api.post(
        "/orders/import",
        formData
      );

      const importedCount = Number(
        response.data?.total_imported || 0
      );

      setImportImportedCount(importedCount);
      setImportMessage(
        response.data?.message ||
          `${importedCount} orders imported successfully.`
      );

      setImportFile(null);

      if (importFileRef.current) {
        importFileRef.current.value = "";
      }

      // Notify every order screen immediately after import.
      // Keep both event names for backward compatibility with
      // older ProcessingOrders.jsx versions.
      window.dispatchEvent(
        new CustomEvent("shipdrop:orders-updated")
      );

      window.dispatchEvent(
        new CustomEvent("processingOrderCreated")
      );

      toast.success(
        `${importedCount} orders moved to Processing`
      );
    } catch (error) {
      const responseData = error.response?.data;

     const rawErrors = responseData?.errors;

let normalizedErrors = [];

if (Array.isArray(rawErrors)) {
  normalizedErrors = rawErrors.map((item) => {
    // Row-wise validation error
    if (
      item &&
      typeof item === "object" &&
      item.row !== undefined
    ) {
      return {
        row: item.row,
        errors: Array.isArray(item.errors)
          ? item.errors
          : [String(item.errors || "Invalid row")],
      };
    }

    // Header / column-level validation error
    return {
      row: "Excel Header",
      errors: [String(item)],
    };
  });
}

setImportErrors(normalizedErrors);

setImportMessage(
  responseData?.message ||
    "Excel import failed. Please fix the errors and try again."
);

if (!normalizedErrors.length) {
  toast.error(
    responseData?.message ||
      "Excel import failed"
  );
}

      setImportMessage(
        responseData?.message ||
          "Excel import failed. Please fix the errors and try again."
      );

      if (!backendErrors.length) {
        toast.error(
          responseData?.message ||
            "Excel import failed"
        );
      }
    } finally {
      setImportLoading(false);
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
                ParcelDrop
              </span>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* RIGHT SECTION: WALLET PILL + ACTIONS + PROFILE */}
        {/* ======================================================== */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          {/* TRACKING SEARCH */}
          <form
            onSubmit={handleTrackingSearch}
            className="hidden md:flex relative w-[250px] lg:w-[310px] xl:w-[370px]"
          >
            <FiSearch
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={17}
            />

            <input
              type="text"
              value={trackingSearch}
              onChange={(event) => setTrackingSearch(event.target.value)}
              placeholder="Enter Tracking ID or Order ID..."
              disabled={trackingSearchLoading}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-xs font-medium text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-[#008dd2] focus:bg-white focus:ring-4 focus:ring-[#008dd2]/10 disabled:cursor-not-allowed disabled:opacity-70"
            />

          
          </form>

          {/* IMPORT ORDER */}
          <button
            type="button"
            onClick={openImportOrder}
            className="hidden sm:flex h-9 items-center gap-1.5 rounded-full bg-[#008dd2] px-3 text-[11px] font-bold text-white shadow-sm transition hover:bg-[#007ab6] active:scale-95 shrink-0"
            title="Import Order"
          >
            <ImportIcon />
            <span>Import Order</span>
          </button>

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
                      {formatTrackingDate(trackingOrder.tracking_expected_delivery)}
                    </p>
                  </div>

                  <div className="px-4 py-3.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Instructions
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

      {/* IMPORT ORDER MODAL */}
      {showImportOrder && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 px-3 py-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeImportOrder();
            }
          }}
        >
          <div className="flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-base font-bold text-slate-800 sm:text-lg">
                  Import Orders
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">
                  Upload your Excel file to create multiple orders in Processing
                </p>
              </div>

              <button
                type="button"
                onClick={closeImportOrder}
                disabled={importLoading}
                className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* BODY */}
            <div className="overflow-y-auto px-5 py-4 sm:px-6">
              {/* ADDRESS SELECTION */}
              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Pickup Address <span className="text-red-500">*</span>
                  </label>

                  <select
                    value={selectedImportWarehouseId}
                    onChange={(event) =>
                      setSelectedImportWarehouseId(event.target.value)
                    }
                    disabled={importLoadingAddresses || importLoading}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-[#008dd2] disabled:bg-slate-50"
                  >
                    <option value="">
                      {importLoadingAddresses
                        ? "Loading pickup addresses..."
                        : "Select pickup address"}
                    </option>

                    {importWarehouses.map((warehouse) => (
                      <option
                        key={warehouse.id}
                        value={warehouse.id}
                      >
                        {warehouse.warehouse_name || "Warehouse"} —{" "}
                        {warehouse.address_line1 || ""}{" "}
                        {warehouse.city || ""}{" "}
                        {warehouse.pincode || ""}
                      </option>
                    ))}
                  </select>

                  {selectedImportWarehouseId && (
                    <p className="mt-1.5 text-[10px] text-slate-400">
                      Default pickup address is selected automatically.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Return Address <span className="text-red-500">*</span>
                  </label>

                  <select
                    value={selectedImportReturnAddressId}
                    onChange={(event) =>
                      setSelectedImportReturnAddressId(event.target.value)
                    }
                    disabled={importLoadingAddresses || importLoading}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-[#008dd2] disabled:bg-slate-50"
                  >
                    <option value="">
                      {importLoadingAddresses
                        ? "Loading return addresses..."
                        : "Select return address"}
                    </option>

                    {importReturnAddresses.map((address) => (
                      <option
                        key={address.id}
                        value={address.id}
                      >
                        {address.name || "Return Address"} —{" "}
                        {address.address_line1 || ""}{" "}
                        {address.city || ""}{" "}
                        {address.pincode || ""}
                      </option>
                    ))}
                  </select>

                  {selectedImportReturnAddressId && (
                    <p className="mt-1.5 text-[10px] text-slate-400">
                      Default return address is selected automatically.
                    </p>
                  )}
                </div>
              </div>

              {/* EXCEL UPLOAD */}
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Excel File <span className="text-red-500">*</span>
                </label>

                <input
                  ref={importFileRef}
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={handleImportFileChange}
                  disabled={importLoading}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => importFileRef.current?.click()}
                  disabled={importLoading}
                  className="flex min-h-[86px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 text-center transition hover:border-[#008dd2] hover:bg-sky-50/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-[#008dd2]">
                    <ImportIcon />
                  </div>

                  {importFile ? (
                    <>
                      <p className="max-w-full truncate text-xs font-bold text-slate-700">
                        {importFile.name}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {(importFile.size / 1024).toFixed(1)} KB
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-bold text-slate-700">
                        Click to select Excel file
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        .xlsx / .xls — maximum 10 MB
                      </p>
                    </>
                  )}
                </button>
              </div>

              {/* ERROR BOX */}
              {importMessage && (
                <div
                  className={`mt-5 rounded-xl border p-4 ${
                    importErrors.length
                      ? "border-rose-200 bg-rose-50"
                      : "border-emerald-200 bg-emerald-50"
                  }`}
                >
                  <p
                    className={`text-xs font-bold ${
                      importErrors.length
                        ? "text-rose-700"
                        : "text-emerald-700"
                    }`}
                  >
                    {importMessage}
                  </p>
                </div>
              )}

              {importErrors.length > 0 && (
                <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-rose-200 bg-white">
                  <div className="sticky top-0 border-b border-rose-100 bg-rose-50 px-4 py-2.5">
                    <p className="text-xs font-bold text-rose-700">
                      Excel Errors — fix all rows before importing
                    </p>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {importErrors.map((item, index) => (
                      <div
                        key={`${item.row}-${index}`}
                        className="px-4 py-3"
                      >
                        <p className="text-[11px] font-bold text-slate-800">
                          Row {item.row}
                        </p>

                        <ul className="mt-1 space-y-1">
                          {(Array.isArray(item.errors)
                            ? item.errors
                            : [String(item.errors || "Invalid row")]
                          ).map((errorText, errorIndex) => (
                            <li
                              key={`${item.row}-${errorIndex}`}
                              className="text-[10px] leading-4 text-rose-600"
                            >
                              • {errorText}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUCCESS */}
              {importImportedCount > 0 && !importErrors.length && (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-bold text-emerald-700">
                    {importImportedCount} orders are now in Processing.
                  </p>
                  <p className="mt-1 text-[10px] text-emerald-600">
                    No Delhivery manifest or wallet deduction is performed by
                    this import.
                  </p>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
              {importImportedCount > 0 && !importErrors.length ? (
                <>
                  <button
                    type="button"
                    onClick={closeImportOrder}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      closeImportOrder();
                      navigate("/orders/processing");
                    }}
                    className="h-10 rounded-xl bg-[#008dd2] px-5 text-xs font-bold text-white transition hover:bg-[#007ab6]"
                  >
                    View Processing Orders
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={closeImportOrder}
                    disabled={importLoading}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleImportOrders}
                    disabled={
                      importLoading ||
                      importLoadingAddresses ||
                      !selectedImportWarehouseId ||
                      !selectedImportReturnAddressId ||
                      !importFile
                    }
                    className="h-10 rounded-xl bg-[#008dd2] px-6 text-xs font-bold text-white shadow-sm transition hover:bg-[#007ab6] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {importLoading
                      ? "Importing Orders..."
                      : "Import Orders"}
                  </button>
                </>
              )}
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