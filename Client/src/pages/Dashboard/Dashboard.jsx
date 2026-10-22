import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import { subscribeToOrderUpdates } from "../../services/orderEvents";
import OrderDetailsModal from "../../components/Common/OrderDetailsModal";
import { printShippingLabels, downloadShippingLabels } from "../../services/shippingLabelService";

// ======================================================
// ICONS
// ======================================================

const Icon = ({ name, size = 18, className = "" }) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
  };

  switch (name) {
    case "package":
      return (
        <svg {...common}>
          <path d="m21 8-9 5-9-5" />
          <path d="M3 8l9-5 9 5v9l-9 5-9-5V8Z" />
          <path d="M12 13v9" />
          <path d="M7.5 5.5 16.5 10.5" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "truck":
      return (
        <svg {...common}>
          <path d="M3 6h11v10H3z" />
          <path d="M14 9h4l3 3v4h-7V9Z" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
        </svg>
      );
    case "truck-fast":
      return (
        <svg {...common}>
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
          <path d="M15 18H9" />
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
          <circle cx="17" cy="18" r="2" />
          <circle cx="7" cy="18" r="2" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="14" rx="2" />
          <path d="M3 10h18" />
          <path d="M16 15h2" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
      );
    case "refresh":
      return (
        <svg {...common}>
          <path d="M20 11a8 8 0 0 0-14.8-4L3 9" />
          <path d="M3 4v5h5" />
          <path d="M4 13a8 8 0 0 0 14.8 4L21 15" />
          <path d="M21 20v-5h-5" />
        </svg>
      );
    case "calculator":
      return (
        <svg {...common}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M8 7h8" />
          <path d="M8 11h.01M12 11h.01M16 11h.01" />
          <path d="M8 15h.01M12 15h.01M16 15h.01" />
          <path d="M8 18h.01M12 18h4" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg {...common}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "location":
      return (
        <svg {...common}>
          <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case "close-circle":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m9 9 6 6M15 9l-6 6" />
        </svg>
      );
    case "copy":
      return (
        <svg {...common}>
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
      );
    case "eye":
      return (
        <svg {...common}>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "check-circle":
      return (
        <svg {...common}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="m9 11 3 3L22 4" />
        </svg>
      );
    case "trending-up":
      return (
        <svg {...common}>
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      );
    case "zap":
      return (
        <svg {...common}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case "chevron-right":
      return (
        <svg {...common}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );
    default:
      return null;
  }
};

// ======================================================
// HELPERS
// ======================================================

const getStatus = (order) =>
  String(order?.status || order?.order_status || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/_/g, " ");

const getOrderId = (order) =>
  String(
    order?.order_id ??
    order?.display_order_id ??
    order?.id ??
    "—"
  );

const getAWB = (order) => String(order?.awb || "").trim();

const getCustomer = (order) =>
  String(
    order?.consignee_name ||
    order?.customer_name ||
    "—"
  );

const getCustomerCity = (order) =>
  String(order?.city || order?.destination_city || "").trim();

const getPayment = (order) => {
  const value = String(order?.payment_type || "")
    .trim()
    .toUpperCase();

  if (value === "COD" || value === "CASH ON DELIVERY") {
    return "COD";
  }

  return "PREPAID";
};

const formatAmount = (amount) => {
  const value = Number(amount || 0);

  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (date) => {
  if (!date) return "—";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "—";
  }

  return value.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ======================================================
// STAT CARD COMPONENT
// ======================================================

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  iconClass,
  onClick,
  badge,
  badgeClass = "bg-slate-100 text-slate-600",
}) => {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => onClick && e.key === "Enter" && onClick()}
      className={`group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] transition-all duration-200 ${
        onClick
          ? "cursor-pointer hover:border-slate-300 hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] active:scale-[0.99]"
          : "cursor-default"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-[12px] font-semibold text-slate-500 truncate">
            {title}
          </p>
          <p className="mt-1 text-[20px] sm:text-[24px] font-extrabold tracking-tight text-slate-800 truncate">
            {value}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${iconClass}`}
        >
          <Icon name={icon} size={18} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100/80 pt-2 text-[10px] sm:text-[11px]">
        <span className="text-slate-400 truncate">{subtitle}</span>
        {badge ? (
          <span className={`shrink-0 rounded-md px-1.5 py-0.5 font-bold uppercase text-[9px] ${badgeClass}`}>
            {badge}
          </span>
        ) : onClick ? (
          <span className="shrink-0 text-[#008dd2] font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            View <Icon name="chevron-right" size={10} />
          </span>
        ) : null}
      </div>
    </div>
  );
};

// ======================================================
// MAIN DASHBOARD COMPONENT
// ======================================================

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const [orders, setOrders] = useState(() => {
    try {
      const cached = sessionStorage.getItem("shipdrop_dash_orders");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [statusCounts, setStatusCounts] = useState(() => {
    try {
      const cached = sessionStorage.getItem("shipdrop_dash_counts");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [walletBalance, setWalletBalance] = useState(() => {
    try {
      const cached = sessionStorage.getItem("shipdrop_dash_wallet");
      return cached ? Number(cached) : 0;
    } catch {
      return 0;
    }
  });

  const [pageLoading, setPageLoading] = useState(() => {
    try {
      return !sessionStorage.getItem("shipdrop_dash_counts");
    } catch {
      return true;
    }
  });

  const [refreshing, setRefreshing] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  // Quick Tracker state
  const [quickTrackInput, setQuickTrackInput] = useState("");

  // Recent Orders Filter tab state
  const [recentFilter, setRecentFilter] = useState("ALL");

  // Order Details Modal state
  const [viewingOrder, setViewingOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Rate calculator state
  const [pickupPincode, setPickupPincode] = useState("");
  const [deliveryPincode, setDeliveryPincode] = useState("");
  const [weight, setWeight] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [paymentType, setPaymentType] = useState("PREPAID");
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState("");
  const [shippingOptions, setShippingOptions] = useState(null);

  // ======================================================
  // DATA LOADER
  // ======================================================

  const loadDashboard = async (showLoader = false) => {
    let currentUser = user;

    try {
      currentUser = JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      currentUser = null;
    }

    if (!currentUser?.id) {
      setDashboardError("User session not found. Please login again.");
      setPageLoading(false);
      return;
    }

    if (showLoader) {
      setPageLoading(true);
    }

    setDashboardError("");

    try {
      let summaryData = null;
      try {
        const summaryResponse = await api.get("/orders/dashboard-summary", {
          params: { user_id: currentUser.id },
        });
        if (summaryResponse?.data?.success) {
          summaryData = summaryResponse.data;
        }
      } catch (e) {
        // Fallback gracefully
      }

      if (summaryData) {
        const orderList = Array.isArray(summaryData.orders) ? summaryData.orders : [];
        const counts = summaryData.statusCounts || null;
        const balance = Number(summaryData.walletBalance || 0);

        setOrders(orderList);
        setStatusCounts(counts);
        setWalletBalance(balance);

        try {
          sessionStorage.setItem("shipdrop_dash_orders", JSON.stringify(orderList));
          sessionStorage.setItem("shipdrop_dash_counts", JSON.stringify(counts));
          sessionStorage.setItem("shipdrop_dash_wallet", String(balance));
        } catch {}
      } else {
        const [ordersResponse, countsResponse, walletResponse] = await Promise.all([
          api.get("/orders/all", {
            params: {
              user_id: currentUser.id,
              limit: 10,
              include_tracking: false,
            },
          }),
          api.get(`/orders/status-counts?user_id=${currentUser.id}`),
          api.get(`/payments/wallet?user_id=${currentUser.id}`),
        ]);

        const ordersData = ordersResponse?.data;
        const countsData = countsResponse?.data?.counts || null;
        const walletData = walletResponse?.data;

        if (!ordersData?.success) {
          throw new Error(ordersData?.message || "Unable to load orders");
        }

        const orderList = Array.isArray(ordersData?.orders) ? ordersData.orders : [];
        const balance = Number(walletData?.balance || 0);

        setOrders(orderList);
        setStatusCounts(countsData);
        setWalletBalance(balance);

        try {
          sessionStorage.setItem("shipdrop_dash_orders", JSON.stringify(orderList));
          sessionStorage.setItem("shipdrop_dash_counts", JSON.stringify(countsData));
          sessionStorage.setItem("shipdrop_dash_wallet", String(balance));
        } catch {}
      }
    } catch (error) {
      console.error("Dashboard loading error:", error);
      setDashboardError(
        error?.userFriendlyMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Unable to load dashboard"
      );
    } finally {
      setPageLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard(pageLoading);
  }, []);

  useEffect(() => {
    const handleWalletUpdated = (event) => {
      const updatedBalance = Number(event?.detail?.balance);
      if (Number.isFinite(updatedBalance)) {
        setWalletBalance(updatedBalance);
      } else {
        loadDashboard(false);
      }
    };

    window.addEventListener("walletUpdated", handleWalletUpdated);
    return () => {
      window.removeEventListener("walletUpdated", handleWalletUpdated);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToOrderUpdates(() => {
      loadDashboard(false);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard(false);
  };

  // ======================================================
  // DERIVED STATISTICS & FUNNEL
  // ======================================================

  const statistics = useMemo(() => {
    const total = statusCounts?.ALL ?? (orders.length > 0 ? orders.length : 0);
    const processing = statusCounts?.PROCESSING ?? 0;
    const manifested = statusCounts?.MANIFESTED ?? 0;
    const notPicked = statusCounts?.["NOT PICKED"] ?? 0;
    const inTransit = statusCounts?.["IN TRANSIT"] ?? 0;
    const outForDelivery = statusCounts?.["OUT FOR DELIVERY"] ?? 0;
    const delivered = statusCounts?.DELIVERED ?? 0;
    const pending = statusCounts?.PENDING ?? 0;
    const rtoInTransit = statusCounts?.["RTO IN TRANSIT"] ?? 0;
    const rtoDelivered = statusCounts?.["RTO DELIVERED"] ?? 0;
    const rtoTotal = rtoInTransit + rtoDelivered + (statusCounts?.RETURNED ?? 0);
    const offline = statusCounts?.OFFLINE ?? statusCounts?.OFFLINE_ORDERS ?? 0;

    const shippedTotal = delivered + rtoTotal + pending;
    const deliveryRate = shippedTotal > 0 ? Math.round((delivered / shippedTotal) * 100) : 100;

    return {
      total,
      processing,
      manifested,
      notPicked,
      inTransit,
      outForDelivery,
      delivered,
      pending,
      rtoTotal,
      offline,
      deliveryRate,
    };
  }, [orders, statusCounts]);

  // ======================================================
  // FILTERED RECENT ORDERS
  // ======================================================

  const filteredRecentOrders = useMemo(() => {
    let list = [...orders].sort(
      (a, b) => Number(b?.id || 0) - Number(a?.id || 0)
    );

    if (recentFilter === "PROCESSING") {
      list = list.filter((o) => getStatus(o) === "PROCESSING");
    } else if (recentFilter === "IN_TRANSIT") {
      list = list.filter((o) =>
        ["IN TRANSIT", "IN_TRANSIT", "OUT FOR DELIVERY", "OUT_FOR_DELIVERY"].includes(
          getStatus(o)
        )
      );
    } else if (recentFilter === "DELIVERED") {
      list = list.filter((o) => getStatus(o) === "DELIVERED");
    }

    return list.slice(0, 6);
  }, [orders, recentFilter]);

  // ======================================================
  // ACTION HANDLERS
  // ======================================================

  const handleCreateOrder = () => {
    sessionStorage.removeItem("editingProcessingOrder");
    window.dispatchEvent(new Event("shipdrop:resetCreateOrder"));
    navigate("/create-order");
  };

  const handleCreateOfflineOrder = () => {
    navigate("/create-offline-order");
  };

  const handleQuickTrack = (e) => {
    e?.preventDefault();
    const clean = String(quickTrackInput || "").trim();
    if (!clean) {
      toast.error("Please enter AWB or Order ID");
      return;
    }
    window.dispatchEvent(
      new CustomEvent("shipdrop:openTracking", { detail: clean })
    );
    setQuickTrackInput("");
  };

  const handleCopyAWB = (e, awb) => {
    e?.stopPropagation();
    if (!awb || awb === "—") return;
    navigator.clipboard?.writeText(awb);
    toast.success(`AWB ${awb} copied!`, { id: "dash-copy-awb", duration: 2000 });
  };

  const handleViewOrder = async (order) => {
    setViewingOrder(order);
    const orderId = order?.id || order?.order_id;
    if (!orderId) return;

    try {
      setDetailLoading(true);
      const res = await api.get(`/orders/${orderId}`);
      if (res?.data?.success && res.data.order) {
        setViewingOrder(res.data.order);
      }
    } catch {
      // Fallback
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePrintSingleLabel = async (orderToPrint) => {
    const o = orderToPrint || viewingOrder;
    if (!o?.id && !o?.order_id) return;
    try {
      await printShippingLabels([o.id || o.order_id]);
    } catch {
      toast.error("Failed to print label");
    }
  };

  const handleDownloadSingleLabel = async (orderToDownload) => {
    const o = orderToDownload || viewingOrder;
    if (!o?.id && !o?.order_id) return;
    try {
      await downloadShippingLabels([o.id || o.order_id]);
    } catch {
      toast.error("Failed to download label");
    }
  };

  // Rate calculator handlers
  const handleResetRateCalculator = () => {
    setPickupPincode("");
    setDeliveryPincode("");
    setWeight("");
    setProductPrice("");
    setPaymentType("PREPAID");
    setRateError("");
    setShippingOptions(null);
  };

  const handleCalculateRate = async (event) => {
    event.preventDefault();

    setRateError("");
    setShippingOptions(null);

    if (!user?.id) {
      setRateError("User session not found. Please login again.");
      return;
    }

    const pickup = String(pickupPincode).trim();
    const delivery = String(deliveryPincode).trim();
    const numericWeight = Number(weight);
    const numericProductPrice = Number(productPrice || 0);

    if (!/^\d{6}$/.test(pickup)) {
      setRateError("Enter a valid 6-digit pickup pincode.");
      return;
    }

    if (!/^\d{6}$/.test(delivery)) {
      setRateError("Enter a valid 6-digit delivery pincode.");
      return;
    }

    if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
      setRateError("Enter a valid weight in kg.");
      return;
    }

    if (!Number.isFinite(numericProductPrice) || numericProductPrice < 0) {
      setRateError("Enter a valid product price.");
      return;
    }

    setRateLoading(true);

    try {
      const response = await api.post("/rate/calculate-options", {
        user_id: user.id,
        pickup_pincode: pickup,
        delivery_pincode: delivery,
        weight: numericWeight,
        payment_type: paymentType === "COD" ? "COD" : "Pre-paid",
        product_value: numericProductPrice,
      });

      const data = response?.data;

      if (!data?.success) {
        throw new Error(data?.message || "Unable to calculate shipping rate");
      }

      setShippingOptions(data);
    } catch (error) {
      console.error("Rate calculation error:", error);
      setRateError(
        error?.response?.data?.message ||
        error?.message ||
        "Unable to calculate shipping rate"
      );
    } finally {
      setRateLoading(false);
    }
  };

  const roadRate = shippingOptions?.road || null;
  const airRate = shippingOptions?.air || null;

  const getRateValue = (result) => {
    if (!result) return null;
    const candidates = [
      result.shipping_charge,
      result.total_charge,
      result.total,
      result.final_charge,
      result.amount,
      result.price,
    ];
    for (const val of candidates) {
      const numeric = Number(val);
      if (Number.isFinite(numeric)) return numeric;
    }
    return null;
  };

  const getResultZone = (result) => result?.zone || result?.final_zone || "—";
  const getResultDistance = (result) => {
    const dist = Number(result?.distance_km);
    if (Number.isFinite(dist) && dist > 0) return `${dist.toFixed(1)} km`;
    return "—";
  };

  const getStatusClass = (status) => {
    switch (String(status).toUpperCase()) {
      case "PROCESSING":
        return "border-amber-200 bg-amber-50 text-amber-700 font-bold";
      case "MANIFESTED":
      case "SHIPPED":
        return "border-sky-200 bg-sky-50 text-sky-700 font-bold";
      case "IN_TRANSIT":
      case "IN TRANSIT":
      case "OUT_FOR_DELIVERY":
      case "OUT FOR DELIVERY":
        return "border-indigo-200 bg-indigo-50 text-indigo-700 font-bold";
      case "DELIVERED":
        return "border-emerald-200 bg-emerald-50 text-emerald-700 font-bold";
      case "CANCELLED":
      case "CANCELED":
        return "border-rose-200 bg-rose-50 text-rose-700 font-bold";
      case "PENDING":
        return "border-orange-200 bg-orange-50 text-orange-700 font-bold";
      default:
        return "border-slate-200 bg-slate-50 text-slate-600 font-medium";
    }
  };

  const getStatusLabel = (status) => {
    const value = String(status || "").trim().toUpperCase();
    if (!value) return "Unknown";
    return value
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // ======================================================
  // FULL PAGE SKELETON / LOADER
  // ======================================================

  if (pageLoading && !orders.length) {
    return (
      <div className="min-h-full bg-[#f6f8fb] p-4 sm:p-6">
        <div className="flex min-h-[65vh] items-center justify-center">
          <div className="flex w-full max-w-[360px] flex-col items-center">
            {/* TRUCK LOADER ANIMATION */}
            <div className="relative h-[100px] w-full overflow-hidden">
              <div className="absolute bottom-4 left-0 right-0 h-[2px] bg-slate-200" />
              <div className="absolute bottom-[11px] left-0 flex w-[200%] animate-[roadMove_1s_linear_infinite] gap-7">
                {Array.from({ length: 14 }).map((_, idx) => (
                  <span key={idx} className="h-[3px] w-8 rounded-full bg-slate-300" />
                ))}
              </div>
              <div className="absolute inset-x-4 bottom-4 h-[58px]">
                <div className="absolute bottom-0 left-0 animate-[truckDrive_2.2s_ease-in-out_infinite]">
                  <div className="relative h-[42px] w-[82px]">
                    <div className="absolute left-0 top-0 h-[34px] w-[55px] rounded-[4px] border border-sky-600 bg-[#008dd2] shadow-sm">
                      <div className="absolute left-2 top-2 h-[2px] w-9 rounded bg-white/40" />
                      <div className="absolute left-2 top-5 h-[2px] w-11 rounded bg-white/25" />
                      <div className="absolute right-2 top-0 h-full w-[1px] bg-sky-700/30" />
                    </div>
                    <div className="absolute bottom-[8px] right-0 h-[27px] w-[30px] rounded-r-[5px] rounded-t-[6px] border border-sky-600 bg-[#008dd2]">
                      <div className="absolute left-[5px] top-[5px] h-[10px] w-[18px] rounded-[2px] bg-sky-100/90" />
                      <div className="absolute left-[13px] top-[5px] h-[10px] w-[1px] bg-sky-300" />
                      <div className="absolute -right-[2px] bottom-[5px] h-[4px] w-[3px] rounded-full bg-white" />
                    </div>
                    <div className="absolute -right-[3px] bottom-[8px] h-[5px] w-[4px] rounded-r bg-slate-500" />
                    <div className="absolute bottom-0 left-[9px] h-[14px] w-[14px] rounded-full border-[2px] border-slate-700 bg-white">
                      <div className="absolute left-1/2 top-1/2 h-[4px] w-[4px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-600" />
                    </div>
                    <div className="absolute bottom-0 right-[5px] h-[14px] w-[14px] rounded-full border-[2px] border-slate-700 bg-white">
                      <div className="absolute left-1/2 top-1/2 h-[4px] w-[4px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-1 text-center">
              <p className="text-[14px] font-bold text-slate-700">Loading dashboard...</p>
              <p className="mt-1 text-[11px] text-slate-400">Getting your shipments ready</p>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes truckDrive {
            0% { transform: translateX(0); }
            50% { transform: translateX(calc(100% - 82px)); }
            100% { transform: translateX(0); }
          }
          @keyframes roadMove {
            from { transform: translateX(0); }
            to { transform: translateX(-72px); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full overflow-x-hidden bg-[#f6f8fb] p-3.5 sm:p-5 md:p-6 pb-24 lg:pb-8 space-y-4">
      {/* ==================================================
          1. HEADER WITH ACTIONS
      ================================================== */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] sm:text-[24px] font-extrabold tracking-tight text-slate-900">
            Welcome back, {user?.name || user?.full_name || "Shipper"} 👋
          </h1>
          <p className="mt-0.5 text-xs sm:text-[13px] text-slate-500">
            Overview of your active shipments, fulfillment pipeline, and wallet balance.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* OFFLINE ORDER BUTTON */}
          <button
            type="button"
            onClick={handleCreateOfflineOrder}
            className="flex h-9.5 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95 cursor-pointer"
          >
            <Icon name="truck-fast" size={15} />
            <span>+ Offline Order</span>
          </button>

          {/* CREATE B2C ORDER BUTTON */}
          <button
            type="button"
            onClick={handleCreateOrder}
            className="flex h-9.5 items-center gap-1.5 rounded-xl bg-[#008dd2] px-4 text-xs font-bold text-white shadow-xs transition hover:bg-[#007ab6] active:scale-95 cursor-pointer"
          >
            <Icon name="plus" size={15} />
            <span>Create Order</span>
          </button>

          {/* REFRESH BUTTON */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh Dashboard"
            className="flex h-9.5 w-9.5 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <span className={refreshing ? "animate-spin" : ""}>
              <Icon name="refresh" size={15} />
            </span>
          </button>
        </div>
      </div>

      {/* ==================================================
          2. ERROR NOTICE
      ================================================== */}
      {dashboardError && (
        <div className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-600">
          <div className="flex items-center gap-2">
            <Icon name="close-circle" size={15} />
            <span className="truncate">{dashboardError}</span>
          </div>
          <button
            type="button"
            onClick={() => loadDashboard(true)}
            className="ml-2 font-bold text-rose-700 underline shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ==================================================
          3. QUICK AWB TRACKER & SHORTCUT STRIP
      ================================================== */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
        <form
          onSubmit={handleQuickTrack}
          className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
        >
          {/* SEARCH INPUT */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon name="search" size={16} />
            </div>
            <input
              type="text"
              value={quickTrackInput}
              onChange={(e) => setQuickTrackInput(e.target.value)}
              placeholder="Quick Track Shipment — Enter AWB No or Order ID..."
              className="h-10.5 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-24 text-xs sm:text-[13px] text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-[#008dd2] px-3 py-1.5 text-[11px] font-bold text-white shadow-xs transition hover:bg-[#007ab6] active:scale-95 cursor-pointer"
            >
              Track
            </button>
          </div>

          {/* QUICK SHORTCUT PILLS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <Link
              to="/wallet"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#008dd2] hover:text-[#008dd2] shrink-0"
            >
              <Icon name="wallet" size={14} />
              <span>+ Add Balance</span>
            </Link>

            <Link
              to="/rate-calculator"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#008dd2] hover:text-[#008dd2] shrink-0"
            >
              <Icon name="calculator" size={14} />
              <span>Rate Calculator</span>
            </Link>

            <Link
              to="/offline-orders"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#008dd2] hover:text-[#008dd2] shrink-0"
            >
              <Icon name="truck" size={14} />
              <span>Offline Shipments</span>
            </Link>
          </div>
        </form>
      </div>

      {/* ==================================================
          4. STATS GRID (6 TILES)
      ================================================== */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6 sm:gap-3">
        {/* TOTAL ORDERS */}
        <StatCard
          title="Total Orders"
          value={statistics.total}
          subtitle="All-time shipments"
          icon="package"
          iconClass="bg-sky-50 text-[#008dd2]"
          onClick={() => navigate("/all-orders")}
        />

        {/* READY TO SHIP */}
        <StatCard
          title="Ready To Ship"
          value={statistics.processing}
          subtitle="Processing parcels"
          icon="clock"
          iconClass="bg-amber-50 text-amber-600"
          onClick={() => navigate("/processing-orders")}
          badge={statistics.processing > 0 ? "Action Req" : undefined}
          badgeClass="bg-amber-100 text-amber-700"
        />

        {/* IN TRANSIT */}
        <StatCard
          title="In Transit"
          value={statistics.inTransit}
          subtitle="On-road parcels"
          icon="truck-fast"
          iconClass="bg-indigo-50 text-indigo-600"
          onClick={() => navigate("/in-transit")}
        />

        {/* OUT FOR DELIVERY */}
        <StatCard
          title="Out For Delivery"
          value={statistics.outForDelivery}
          subtitle="Final-mile today"
          icon="location"
          iconClass="bg-purple-50 text-purple-600"
          onClick={() => navigate("/out-for-delivery")}
        />

        {/* DELIVERED */}
        <StatCard
          title="Delivered"
          value={statistics.delivered}
          subtitle="Successful drops"
          icon="check-circle"
          iconClass="bg-emerald-50 text-emerald-600"
          onClick={() => navigate("/delivered")}
          badge={`${statistics.deliveryRate}% rate`}
          badgeClass="bg-emerald-100 text-emerald-700"
        />

        {/* WALLET BALANCE */}
        <StatCard
          title="Wallet Balance"
          value={formatAmount(walletBalance)}
          subtitle="Available funds"
          icon="wallet"
          iconClass="bg-violet-50 text-violet-600"
          onClick={() => navigate("/wallet")}
          badge="+ Recharge"
          badgeClass="bg-violet-100 text-violet-700 hover:bg-violet-200 cursor-pointer"
        />
      </div>

      {/* ==================================================
          5. VISUAL LOGISTICS PIPELINE (FULFILLMENT FUNNEL)
      ================================================== */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#008dd2]/10 text-[#008dd2]">
              <Icon name="trending-up" size={14} />
            </span>
            <div>
              <h2 className="text-xs sm:text-[13px] font-bold text-slate-800 tracking-tight">
                Fulfillment Pipeline
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400">
                Track how orders progress from pickup to delivery
              </p>
            </div>
          </div>

          {/* PIPELINE CHIPS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            {/* 1. Ready */}
            <button
              type="button"
              onClick={() => navigate("/processing-orders")}
              className="flex items-center justify-between lg:justify-start gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-left transition hover:border-amber-300 hover:bg-amber-50/50 cursor-pointer shrink-0"
            >
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-[11px] font-semibold text-slate-600">Ready</span>
              </div>
              <span className="font-mono text-xs font-bold text-slate-800">
                {statistics.processing}
              </span>
            </button>

            {/* 2. Manifested */}
            <button
              type="button"
              onClick={() => navigate("/manifested")}
              className="flex items-center justify-between lg:justify-start gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-left transition hover:border-sky-300 hover:bg-sky-50/50 cursor-pointer shrink-0"
            >
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                <span className="text-[11px] font-semibold text-slate-600">Manifested</span>
              </div>
              <span className="font-mono text-xs font-bold text-slate-800">
                {statistics.manifested}
              </span>
            </button>

            {/* 3. In Transit */}
            <button
              type="button"
              onClick={() => navigate("/in-transit")}
              className="flex items-center justify-between lg:justify-start gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-left transition hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer shrink-0"
            >
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                <span className="text-[11px] font-semibold text-slate-600">In Transit</span>
              </div>
              <span className="font-mono text-xs font-bold text-slate-800">
                {statistics.inTransit}
              </span>
            </button>

            {/* 4. Out For Delivery */}
            <button
              type="button"
              onClick={() => navigate("/out-for-delivery")}
              className="flex items-center justify-between lg:justify-start gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-left transition hover:border-purple-300 hover:bg-purple-50/50 cursor-pointer shrink-0"
            >
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-purple-500" />
                <span className="text-[11px] font-semibold text-slate-600">OFD</span>
              </div>
              <span className="font-mono text-xs font-bold text-slate-800">
                {statistics.outForDelivery}
              </span>
            </button>

            {/* 5. Delivered */}
            <button
              type="button"
              onClick={() => navigate("/delivered")}
              className="flex items-center justify-between lg:justify-start gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-left transition hover:border-emerald-300 hover:bg-emerald-50/50 cursor-pointer shrink-0"
            >
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-semibold text-slate-600">Delivered</span>
              </div>
              <span className="font-mono text-xs font-bold text-slate-800">
                {statistics.delivered}
              </span>
            </button>

            {/* 6. Pending / NDR */}
            <button
              type="button"
              onClick={() => navigate("/pending")}
              className="flex items-center justify-between lg:justify-start gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-left transition hover:border-orange-300 hover:bg-orange-50/50 cursor-pointer shrink-0"
            >
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                <span className="text-[11px] font-semibold text-slate-600">NDR / Pending</span>
              </div>
              <span className="font-mono text-xs font-bold text-slate-800">
                {statistics.pending}
              </span>
            </button>

            {/* 7. RTO */}
            <button
              type="button"
              onClick={() => navigate("/rto-delivered")}
              className="flex items-center justify-between lg:justify-start gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-left transition hover:border-rose-300 hover:bg-rose-50/50 cursor-pointer shrink-0"
            >
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="text-[11px] font-semibold text-slate-600">RTO</span>
              </div>
              <span className="font-mono text-xs font-bold text-slate-800">
                {statistics.rtoTotal}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================
          6. MAIN CONTENT SPLIT: RECENT ORDERS + WIDGETS
      ================================================== */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        {/* LEFT COLUMN: RECENT ORDERS TABLE */}
        <div className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
            {/* TABLE HEADER WITH FILTER TABS */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 px-4 py-3.5">
              <div>
                <h2 className="text-[14px] font-bold text-slate-800">Recent Shipments</h2>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Live snapshot of your newest shipments
                </p>
              </div>

              {/* FILTER TABS */}
              <div className="flex items-center gap-1.5">
                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50/80 p-0.5">
                  <button
                    type="button"
                    onClick={() => setRecentFilter("ALL")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      recentFilter === "ALL"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecentFilter("PROCESSING")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      recentFilter === "PROCESSING"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Ready
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecentFilter("IN_TRANSIT")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      recentFilter === "IN_TRANSIT"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    In Transit
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecentFilter("DELIVERED")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      recentFilter === "DELIVERED"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Delivered
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/all-orders")}
                  className="flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold text-[#008dd2] transition hover:bg-sky-50"
                >
                  <span>All</span>
                  <Icon name="arrow-right" size={12} />
                </button>
              </div>
            </div>

            {/* EMPTY STATE */}
            {filteredRecentOrders.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Icon name="package" size={22} />
                </div>
                <p className="mt-3 text-[14px] font-bold text-slate-700">No shipments found</p>
                <p className="mt-1 text-[12px] text-slate-400">
                  No orders match this filter. Create your first shipment!
                </p>
                <button
                  type="button"
                  onClick={handleCreateOrder}
                  className="mt-4 rounded-xl bg-[#008dd2] px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#007ab6] cursor-pointer"
                >
                  + Create Order Now
                </button>
              </div>
            ) : (
              <>
                {/* 1. MOBILE LIST VIEW */}
                <div className="divide-y divide-slate-100 md:hidden">
                  {filteredRecentOrders.map((order) => {
                    const status = getStatus(order);
                    const awb = getAWB(order);
                    return (
                      <div
                        key={order?.id ?? order?.order_id}
                        onClick={() => handleViewOrder(order)}
                        className="p-3.5 space-y-2 hover:bg-slate-50/70 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-extrabold text-slate-800">
                            #{getOrderId(order)}
                          </span>
                          <span
                            className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] ${getStatusClass(
                              status
                            )}`}
                          >
                            {getStatusLabel(status)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[12px]">
                          <span className="font-semibold text-slate-700 truncate max-w-[190px]">
                            {getCustomer(order)}
                            {getCustomerCity(order) ? ` • ${getCustomerCity(order)}` : ""}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${
                              getPayment(order) === "COD"
                                ? "border-violet-100 bg-violet-50 text-violet-700"
                                : "border-slate-200 bg-slate-50 text-slate-600"
                            }`}
                          >
                            {getPayment(order)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-50 pt-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-slate-600 font-medium">
                              AWB: {awb || "—"}
                            </span>
                            {awb && (
                              <button
                                type="button"
                                onClick={(e) => handleCopyAWB(e, awb)}
                                title="Copy AWB"
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <Icon name="copy" size={11} />
                              </button>
                            )}
                          </div>
                          <span>{formatDate(order?.created_at)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. TABLET & DESKTOP TABLE */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-slate-100 bg-slate-50/80">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Order / Date
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Customer / City
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          AWB / Courier
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Payment
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[12px]">
                      {filteredRecentOrders.map((order) => {
                        const status = getStatus(order);
                        const awb = getAWB(order);
                        return (
                          <tr
                            key={order?.id ?? order?.order_id}
                            className="transition-colors hover:bg-slate-50/70"
                          >
                            <td className="px-4 py-3">
                              <p className="font-extrabold text-slate-900">
                                #{getOrderId(order)}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {formatDate(order?.created_at)}
                              </p>
                            </td>

                            <td className="max-w-[170px] px-4 py-3">
                              <p className="font-semibold text-slate-800 truncate">
                                {getCustomer(order)}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {getCustomerCity(order) || "India"}
                              </p>
                            </td>

                            <td className="px-4 py-3 font-mono text-[11px]">
                              {awb ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-slate-700">{awb}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopyAWB(e, awb)}
                                    title="Copy AWB"
                                    className="text-slate-400 hover:text-[#008dd2] transition"
                                  >
                                    <Icon name="copy" size={13} />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Not generated</span>
                              )}
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                                  getPayment(order) === "COD"
                                    ? "border-violet-100 bg-violet-50 text-violet-700"
                                    : "border-slate-200 bg-slate-50 text-slate-600"
                                }`}
                              >
                                {getPayment(order)}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] ${getStatusClass(
                                  status
                                )}`}
                              >
                                {getStatusLabel(status)}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleViewOrder(order)}
                                title="View Order Details"
                                className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-[#008dd2] hover:bg-[#edf8ff] hover:text-[#008dd2] active:scale-95 cursor-pointer"
                              >
                                <Icon name="eye" size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: RATE CALCULATOR & PERFORMANCE WIDGETS */}
        <div className="space-y-4">
          {/* RATE CALCULATOR WIDGET */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-[#008dd2]">
                  <Icon name="calculator" size={16} />
                </div>
                <div>
                  <h2 className="text-[13px] sm:text-[14px] font-bold text-slate-800">
                    Calculate Shipping Rate
                  </h2>
                  <p className="text-[10px] sm:text-[11px] text-slate-400">
                    Instant Delhivery Surface & Air estimate
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetRateCalculator}
                title="Reset calculator"
                className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:text-slate-700 active:scale-95 cursor-pointer"
              >
                <Icon name="refresh" size={13} />
              </button>
            </div>

            <form onSubmit={handleCalculateRate} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                    Pickup PIN
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Icon name="location" size={13} />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={pickupPincode}
                      onChange={(e) => setPickupPincode(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 302001"
                      className="h-9.5 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-2.5 text-xs text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#008dd2] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                    Delivery PIN
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Icon name="location" size={13} />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={deliveryPincode}
                      onChange={(e) => setDeliveryPincode(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 110001"
                      className="h-9.5 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-2.5 text-xs text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#008dd2] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                    Weight (kg)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="0.5"
                      className="h-9.5 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 pr-8 text-xs text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#008dd2] focus:bg-white"
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">
                      kg
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                    Invoice Value
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      placeholder="500"
                      className="h-9.5 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-6 pr-2.5 text-xs text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#008dd2] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  Payment Mode
                </label>
                <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setPaymentType("PREPAID")}
                    className={`h-7.5 rounded-lg text-[11px] font-bold transition ${
                      paymentType === "PREPAID"
                        ? "bg-white text-slate-800 shadow-2xs"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Prepaid
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType("COD")}
                    className={`h-7.5 rounded-lg text-[11px] font-bold transition ${
                      paymentType === "COD"
                        ? "bg-white text-slate-800 shadow-2xs"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    COD
                  </button>
                </div>
              </div>

              {rateError && (
                <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-600">
                  {rateError}
                </div>
              )}

              <button
                type="submit"
                disabled={rateLoading}
                className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {rateLoading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>Calculating Rate...</span>
                  </>
                ) : (
                  <>
                    <Icon name="zap" size={14} />
                    <span>Calculate Rate</span>
                  </>
                )}
              </button>

              {/* ESTIMATE RESULTS */}
              {shippingOptions && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 uppercase tracking-wide text-[10px]">
                      Estimate Results
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-500">
                      {paymentType}
                    </span>
                  </div>

                  {/* ROAD */}
                  <div
                    className={`rounded-xl border p-2.5 ${
                      roadRate ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <Icon name="truck" size={13} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">By Road</p>
                          <p className="text-[10px] text-slate-400">Surface</p>
                        </div>
                      </div>

                      {getRateValue(roadRate) !== null ? (
                        <p className="text-[15px] font-extrabold text-slate-900">
                          {formatAmount(getRateValue(roadRate))}
                        </p>
                      ) : (
                        <span className="text-[10px] text-slate-400">Not available</span>
                      )}
                    </div>

                    {roadRate && (
                      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[10px] text-slate-500">
                        <span>Zone: <b className="text-slate-700">{getResultZone(roadRate)}</b></span>
                        <span>Dist: <b className="text-slate-700">{getResultDistance(roadRate)}</b></span>
                      </div>
                    )}
                  </div>

                  {/* AIR */}
                  <div
                    className={`rounded-xl border p-2.5 ${
                      airRate ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-50 text-[#008dd2]">
                          <Icon name="truck-fast" size={13} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">By Air</p>
                          <p className="text-[10px] text-slate-400">Express</p>
                        </div>
                      </div>

                      {getRateValue(airRate) !== null ? (
                        <p className="text-[15px] font-extrabold text-slate-900">
                          {formatAmount(getRateValue(airRate))}
                        </p>
                      ) : (
                        <span className="text-[10px] text-slate-400">Not available</span>
                      )}
                    </div>

                    {airRate && (
                      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[10px] text-slate-500">
                        <span>Zone: <b className="text-slate-700">{getResultZone(airRate)}</b></span>
                        <span>Dist: <b className="text-slate-700">{getResultDistance(airRate)}</b></span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* PERFORMANCE RATIO SUMMARY */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Delivery Ratio
              </h3>
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                {statistics.deliveryRate}% Success
              </span>
            </div>

            {/* PROGRESS BAR */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, statistics.deliveryRate))}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-center pt-1 text-[11px]">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2">
                <span className="block text-[10px] text-slate-400">Delivered</span>
                <span className="font-bold text-emerald-600 text-sm">
                  {statistics.delivered}
                </span>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2">
                <span className="block text-[10px] text-slate-400">RTO / Returned</span>
                <span className="font-bold text-rose-500 text-sm">
                  {statistics.rtoTotal}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          7. ORDER DETAILS MODAL
      ================================================== */}
      <OrderDetailsModal
        order={viewingOrder}
        loading={detailLoading}
        onClose={() => setViewingOrder(null)}
        onTrack={(orderOrAwb) => {
          const awb =
            typeof orderOrAwb === "string"
              ? orderOrAwb
              : getAWB(orderOrAwb || viewingOrder);
          if (awb && awb !== "—") {
            window.dispatchEvent(
              new CustomEvent("shipdrop:openTracking", { detail: String(awb) })
            );
          }
        }}
        onDownload={handleDownloadSingleLabel}
        onPrint={handlePrintSingleLabel}
      />
    </div>
  );
}

export default Dashboard;