import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { subscribeToOrderUpdates } from "../../services/orderEvents";
import { useNavigate } from "react-router-dom";
import { DashboardSkeleton } from "../../components/Common/TableSkeleton";
import { toast } from "react-hot-toast";

// ======================================================
// ICONS
// ======================================================

const Icon = ({ name, size = 18 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (name === "package") {
    return (
      <svg {...common}>
        <path d="m21 8-9 5-9-5" />
        <path d="M3 8l9-5 9 5v9l-9 5-9-5V8Z" />
        <path d="M12 13v9" />
        <path d="M7.5 5.5 16.5 10.5" />
      </svg>
    );
  }

  if (name === "clock") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  if (name === "truck") {
    return (
      <svg {...common}>
        <path d="M3 6h11v10H3z" />
        <path d="M14 9h4l3 3v4h-7V9Z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    );
  }

  if (name === "wallet") {
    return (
      <svg {...common}>
        <rect x="3" y="6" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
        <path d="M16 15h2" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
    );
  }

  if (name === "refresh") {
    return (
      <svg {...common}>
        <path d="M20 11a8 8 0 0 0-14.8-4L3 9" />
        <path d="M3 4v5h5" />
        <path d="M4 13a8 8 0 0 0 14.8 4L21 15" />
        <path d="M21 20v-5h-5" />
      </svg>
    );
  }

  if (name === "calculator") {
    return (
      <svg {...common}>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 7h8" />
        <path d="M8 11h.01M12 11h.01M16 11h.01" />
        <path d="M8 15h.01M12 15h.01M16 15h.01" />
        <path d="M8 18h.01M12 18h4" />
      </svg>
    );
  }

  if (name === "arrow-right") {
    return (
      <svg {...common}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  if (name === "location") {
    return (
      <svg {...common}>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }

  if (name === "copy") {
    return (
      <svg {...common}>
        <rect x="9" y="9" width="10" height="10" rx="2" />
        <path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      </svg>
    );
  }

  if (name === "close-circle") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="m9 9 6 6M15 9l-6 6" />
      </svg>
    );
  }

  return null;
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
// STAT CARD
// ======================================================

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  iconClass,
  onClick,
  isWide = false,
  valueClassName,
}) => {
  const isCurrency = typeof value === "string" && value.includes("₹");
  const valueLength = String(value || "").length;

  const fontClass = valueClassName || (
    isCurrency
      ? "text-[18px]"
      : valueLength > 6
        ? "text-[18px] sm:text-[20px]"
        : "text-[19px] sm:text-[22px]"
  );

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`w-full text-left rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)] transition-all duration-200 active:scale-[0.98] ${
        isWide ? "col-span-2 sm:col-span-1" : ""
      } ${
        onClick
          ? "cursor-pointer hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]"
          : "cursor-default"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1 pr-1.5 sm:pr-2">
          <p className="text-[12px] sm:text-[13px] font-semibold text-slate-600 truncate">
            {title}
          </p>

          <p
            className={`mt-1 font-bold tracking-tight text-slate-900 truncate ${fontClass}`}
            title={typeof value === "string" ? value : undefined}
          >
            {value}
          </p>

          {subtitle && (
            <p className="mt-0.5 text-[11px] sm:text-[12px] font-medium text-slate-500 truncate">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon name={icon} size={16} />
        </div>
      </div>
    </button>
  );
};

// ======================================================
// DASHBOARD
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

  // If cached data is present, render immediately without full-screen loading spinner
  const [pageLoading, setPageLoading] = useState(() => {
    try {
      return !sessionStorage.getItem("shipdrop_dash_counts");
    } catch {
      return true;
    }
  });

  const [refreshing, setRefreshing] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  // Rate calculator state
  const [pickupPincode, setPickupPincode] = useState("");
  const [deliveryPincode, setDeliveryPincode] = useState("");
  const [weight, setWeight] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [paymentType, setPaymentType] = useState("PREPAID");
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState("");
  const [shippingOptions, setShippingOptions] = useState(null);

  const loadDashboard = async (showLoader = false) => {
    let currentUser = user;

    try {
      currentUser = JSON.parse(
        localStorage.getItem("user") || "null"
      );
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
      // 1. Try unified fast summary endpoint (single HTTP request + single DB query roundtrip)
      let summaryData = null;
      try {
        const summaryResponse = await api.get("/orders/dashboard-summary", {
          params: { user_id: currentUser.id },
        });
        if (summaryResponse?.data?.success) {
          summaryData = summaryResponse.data;
        }
      } catch (e) {
        // Fallback gracefully if summary endpoint is temporarily unavailable
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
        // Fallback: Parallelize fast status counts, recent 6 orders, and wallet balance
        const [ordersResponse, countsResponse, walletResponse] = await Promise.all([
          api.get("/orders/all", {
            params: {
              user_id: currentUser.id,
              limit: 20,
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
          throw new Error(
            ordersData?.message || "Unable to load orders"
          );
        }

        const orderList = Array.isArray(ordersData?.orders)
          ? ordersData.orders
          : [];

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
    // Initial fetch on mount
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

  const statistics = useMemo(() => {
    // Derive exact counts directly from fast indexed DB status-counts query
    const total = statusCounts?.ALL ?? (orders.length > 0 ? orders.length : 0);
    const processing = statusCounts?.PROCESSING ?? 0;
    const manifested = statusCounts?.MANIFESTED ?? 0;
    const pending = statusCounts?.PENDING ?? 0;

    return {
      total,
      processing,
      manifested,
      pending,
    };
  }, [orders, statusCounts]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .filter((order) => {
        const status = getStatus(order);
        const trackingStatus = String(order?.tracking_status || "")
          .trim()
          .toUpperCase()
          .replace(/\s+/g, " ")
          .replace(/_/g, " ");

        return (
          status !== "PROCESSING" &&
          status !== "BOOKED" &&
          trackingStatus !== "PROCESSING" &&
          trackingStatus !== "BOOKED"
        );
      })
      .sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0))
      .slice(0, 6);
  }, [orders]);

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
      setRateError("Enter a valid weight.");
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
        throw new Error(
          data?.message || "Unable to calculate shipping rate"
        );
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

    for (const value of candidates) {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }

    return null;
  };

  const getResultZone = (result) =>
    result?.zone || result?.final_zone || "—";

  const getResultDistance = (result) => {
    const distance = Number(result?.distance_km);
    if (Number.isFinite(distance) && distance > 0) {
      return `${distance.toFixed(1)} km`;
    }
    return "—";
  };

  const triggerTracking = (awb) => {
    if (!awb || awb === "—") return;
    window.dispatchEvent(
      new CustomEvent("shipdrop:openTracking", {
        detail: String(awb).trim(),
      })
    );
  };

  const handleCopyAwb = async (e, awb) => {
    e.stopPropagation();
    if (!awb || awb === "—") return;
    try {
      await navigator.clipboard.writeText(String(awb).trim());
      toast.success("AWB copied to clipboard", { id: "awb-copy", duration: 1500 });
    } catch {
      toast.error("Unable to copy AWB");
    }
  };

  const getStatusClass = (status) => {
    const s = String(status || "").trim().toUpperCase().replace(/[-_]+/g, " ");

    switch (s) {
      case "DELIVERED":
        return "border-emerald-200 bg-emerald-50 text-emerald-700 font-bold";
      case "MANIFESTED":
        return "border-sky-200 bg-sky-50 text-sky-700 font-bold";
      case "NOT PICKED":
        return "border-orange-200 bg-orange-50 text-orange-700 font-bold";
      case "IN TRANSIT":
        return "border-indigo-200 bg-indigo-50 text-indigo-700 font-bold";
      case "OUT FOR DELIVERY":
      case "OFD":
        return "border-cyan-200 bg-cyan-50 text-cyan-700 font-bold";
      case "CANCELLED":
      case "CANCELED":
        return "border-rose-200 bg-rose-50 text-rose-700 font-bold";
      case "RTO IN TRANSIT":
        return "border-amber-200 bg-amber-50 text-amber-700 font-bold";
      case "RTO DELIVERED":
      case "RETURN ACCEPTED":
        return "border-red-200 bg-red-50 text-red-700 font-bold";
      case "PROCESSING":
      case "PENDING":
        return "border-amber-200 bg-amber-50 text-amber-700 font-bold";
      default:
        return "border-slate-200 bg-slate-100 text-slate-700 font-semibold";
    }
  };

  const getStatusLabel = (status) => {
    const value = String(status || "").trim().toUpperCase();
    if (!value) return "Unknown";

    const normalized = value.replace(/[-_]+/g, " ");
    if (normalized === "RTO DELIVERED" || normalized === "RETURN ACCEPTED") {
      return "RTO Delivered";
    }
    if (normalized === "RTO IN TRANSIT") {
      return "RTO In Transit";
    }
    if (normalized === "OUT FOR DELIVERY" || normalized === "OFD") {
      return "Out For Delivery";
    }

    return normalized
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleCreateOrder = () => {
    sessionStorage.removeItem("editingProcessingOrder");
    window.dispatchEvent(new Event("shipdrop:resetCreateOrder"));
    navigate("/create-order");
  };

  if (pageLoading && !orders.length) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-full w-full overflow-x-hidden bg-[#f6f8fb] dark:bg-[#090b10] p-3.5 sm:p-5 md:p-6 pb-24 lg:pb-8">
      {/* ==================================================
          HEADER
      ================================================== */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[19px] sm:text-[22px] font-bold tracking-tight text-slate-900 truncate">
            Dashboardddd
          </h1>
          <p className="mt-0.5 text-[11px] sm:text-[13px] text-slate-500 truncate">
            Overview of shipments and wallet activity.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
        >
          <span className={refreshing ? "animate-spin" : ""}>
            <Icon name="refresh" size={14} />
          </span>
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* ==================================================
          ERROR NOTICE
      ================================================== */}
      {dashboardError && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5">
          <div className="flex items-center gap-2 text-[12px] text-rose-600">
            <Icon name="close-circle" size={15} />
            <span className="truncate">{dashboardError}</span>
          </div>

          <button
            type="button"
            onClick={() => loadDashboard(true)}
            className="ml-2 text-[11px] font-bold text-rose-700 underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ==================================================
          STATS GRID: Mobile 2-cols, Desktop 5-cols
      ================================================== */}
      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 xl:grid-cols-5">
        <StatCard
          title="Total Orders"
          value={statistics.total}
          subtitle="All orders"
          icon="package"
          iconClass="bg-sky-50 text-sky-600"
          onClick={() => navigate("/all-orders")}
        />

        <StatCard
          title="Ready To Ship"
          value={statistics.processing}
          subtitle="Awaiting shipment"
          icon="clock"
          iconClass="bg-amber-50 text-amber-600"
          onClick={() => navigate("/processing-orders")}
        />

        <StatCard
          title="Manifested"
          value={statistics.manifested}
          subtitle="Shipment created"
          icon="truck"
          iconClass="bg-emerald-50 text-emerald-600"
          onClick={() => navigate("/manifested")}
        />

        <StatCard
          title="UnDelivered"
          value={statistics.pending}
          subtitle="UnDelivered orders"
          icon="clock"
          iconClass="bg-amber-50 text-amber-600"
          onClick={() => navigate("/pending")}
        />

        <StatCard
          title="Wallet Balance"
          value={formatAmount(walletBalance)}
          subtitle="Available balance"
          icon="wallet"
          iconClass="bg-violet-50 text-violet-600"
          onClick={() => navigate("/wallet")}
          isWide={true}
          valueClassName="text-[18px]"
        />
      </div>

      {/* ==================================================
          MAIN CONTENT: Split on Desktop, Stack on Mobile
      ================================================== */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* LEFT COLUMN: ACTION BANNER + RECENT ORDERS */}
        <div className="min-w-0 space-y-4">
          {/* ACTION BANNER */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[14px] font-bold text-slate-900">
                  Ship something today?
                </p>
                <p className="mt-0.5 text-[12px] font-medium text-slate-500">
                  Create a new shipment and get it moving.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCreateOrder}
                className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#111827] px-3 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#1f2937] active:scale-95"
              >
                <Icon name="plus" size={14} />
                <span>Create Order</span>
              </button>
            </div>
          </div>

          {/* RECENT ORDERS CONTAINER */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 sm:px-5 py-3.5">
              <div>
                <h2 className="text-[15px] font-bold tracking-tight text-slate-900">
                  Recent Orders
                </h2>
                <p className="mt-0.5 text-[11px] sm:text-[12px] font-medium text-slate-500">
                  Your latest shipment activity
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/all-orders")}
                className="group flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-bold text-[#008dd2] transition hover:bg-sky-50 hover:text-[#0073ab]"
              >
                <span>View all</span>
                <span className="transition-transform group-hover:translate-x-0.5">
                  <Icon name="arrow-right" size={13} />
                </span>
              </button>
            </div>

            {recentOrders.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Icon name="package" size={22} />
                </div>
                <p className="mt-3 text-[14px] font-bold text-slate-700">
                  No orders yet
                </p>
                <p className="mt-1 text-[12px] text-slate-400">
                  Your recent shipments will appear right here.
                </p>
                <button
                  type="button"
                  onClick={handleCreateOrder}
                  className="mt-4 rounded-xl bg-[#008dd2] px-4 py-2 text-[12px] font-semibold text-white shadow-sm"
                >
                  Create your first order
                </button>
              </div>
            ) : (
              <>
                {/* 1. MOBILE ONLY: Native App-Style Card View */}
                <div className="divide-y divide-slate-100 md:hidden">
                  {recentOrders.map((order) => {
                    const status = getStatus(order);
                    const awb = getAWB(order);
                    const payment = getPayment(order);
                    const customer = getCustomer(order);

                    return (
                      <div
                        key={order?.id ?? order?.order_id}
                        className="p-3.5 space-y-2.5 hover:bg-slate-50/60 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-bold text-slate-900 tracking-tight">
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
                          <span
                            className="font-semibold text-slate-800 text-[11.5px] leading-snug break-words max-w-[200px]"
                            title={customer}
                          >
                            {customer}
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                              payment === "COD"
                                ? "border-violet-200 bg-violet-50 text-violet-700"
                                : "border-sky-200 bg-sky-50 text-sky-700"
                            }`}
                          >
                            {payment}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] border-t border-slate-100 pt-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-medium">AWB:</span>
                            {awb && awb !== "—" ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => triggerTracking(awb)}
                                  className="font-mono font-semibold text-slate-800 hover:text-[#008dd2] transition"
                                >
                                  {awb}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyAwb(e, awb)}
                                  title="Copy AWB"
                                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                                >
                                  <Icon name="copy" size={12} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </div>
                          <span className="text-slate-500 font-medium">
                            {formatDate(order?.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. TABLET & DESKTOP: Traditional Table View */}
                <div className="hidden md:block w-full overflow-hidden">
                  <table className="w-full table-fixed border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80">
                        <th className="w-[14%] px-2.5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          Order
                        </th>
                        <th className="w-[24%] px-2.5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          Customer
                        </th>
                        <th className="w-[23%] px-2.5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          AWB
                        </th>
                        <th className="w-[12%] px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          Payment
                        </th>
                        <th className="w-[14%] px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          Status
                        </th>
                        <th className="w-[13%] px-2.5 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[13px]">
                      {recentOrders.map((order) => {
                        const status = getStatus(order);
                        const awb = getAWB(order);
                        const customer = getCustomer(order);
                        const payment = getPayment(order);

                        return (
                          <tr
                            key={order?.id ?? order?.order_id}
                            className="transition-colors hover:bg-slate-50/80 group"
                          >
                            <td className="px-2.5 py-2.5 font-bold text-slate-900 text-[12px] truncate">
                              #{getOrderId(order)}
                            </td>
                            <td className="px-2.5 py-2">
                              <p
                                className="text-[11px] font-semibold text-slate-800 leading-snug break-words line-clamp-2"
                                title={customer}
                              >
                                {customer}
                              </p>
                            </td>
                            <td className="px-2.5 py-2.5">
                              {awb && awb !== "—" ? (
                                <div className="flex items-center gap-1 min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => triggerTracking(awb)}
                                    title="Click to track shipment"
                                    className="truncate font-mono text-[11px] font-semibold text-slate-800 hover:text-[#008dd2] transition cursor-pointer select-none"
                                  >
                                    {awb}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopyAwb(e, awb)}
                                    title="Copy AWB"
                                    className="shrink-0 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded transition"
                                  >
                                    <Icon name="copy" size={12} />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 font-medium text-[11px]">—</span>
                              )}
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              <span
                                className={`inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                                  payment === "COD"
                                    ? "border-violet-200 bg-violet-50 text-violet-700"
                                    : "border-sky-200 bg-sky-50 text-sky-700"
                                }`}
                              >
                                {payment}
                              </span>
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              <span
                                className={`inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-[10px] whitespace-nowrap ${getStatusClass(
                                  status
                                )}`}
                              >
                                {getStatusLabel(status)}
                              </span>
                            </td>
                            <td className="px-2.5 py-2.5 text-right text-[11px] font-medium text-slate-500 whitespace-nowrap">
                              {formatDate(order?.created_at)}
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

        {/* RIGHT COLUMN: RATE CALCULATOR WIDGET */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.03)] h-fit">
          <div className="border-b border-slate-100 px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <Icon name="calculator" size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-[14.5px] font-bold text-slate-900">
                  Calculate Shipping Rate
                </h2>
                <p className="mt-0.5 text-[11.5px] font-medium text-slate-500">
                  Get your rate instantly
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetRateCalculator}
                title="Reset calculator"
                aria-label="Reset calculator"
                className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 active:scale-95"
              >
                <Icon name="refresh" size={15} />
              </button>
            </div>
          </div>

          <form onSubmit={handleCalculateRate} className="p-4">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1.5 block text-[11.5px] font-bold text-slate-700">
                  Pickup Pincode
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <Icon name="location" size={14} />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={pickupPincode}
                    onChange={(e) =>
                      setPickupPincode(
                        e.target.value.replace(/\D/g, "")
                      )
                    }
                    placeholder="302001"
                    className="h-9.5 w-full rounded-xl border border-slate-200/90 bg-white pl-8 pr-2.5 text-[12.5px] font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11.5px] font-bold text-slate-700">
                  Delivery Pincode
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <Icon name="location" size={14} />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={deliveryPincode}
                    onChange={(e) =>
                      setDeliveryPincode(
                        e.target.value.replace(/\D/g, "")
                      )
                    }
                    placeholder="110001"
                    className="h-9.5 w-full rounded-xl border border-slate-200/90 bg-white pl-8 pr-2.5 text-[12.5px] font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1.5 block text-[11.5px] font-bold text-slate-700">
                  Weight
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="1.00"
                    className="h-9.5 w-full rounded-xl border border-slate-200/90 bg-white px-3 pr-8 text-[12.5px] font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10 shadow-2xs"
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-500">
                    kg
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11.5px] font-bold text-slate-700">
                  Product Price
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-600 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="500"
                    className="h-9.5 w-full rounded-xl border border-slate-200/90 bg-white pl-6 pr-2.5 text-[12.5px] font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3">
              <label className="mb-1.5 block text-[11.5px] font-bold text-slate-700">
                Payment Mode
              </label>
              <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setPaymentType("PREPAID")}
                  className={`h-8 rounded-lg text-[11.5px] font-bold transition ${paymentType === "PREPAID"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-800"
                    }`}
                >
                  Prepaid
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType("COD")}
                  className={`h-8 rounded-lg text-[11.5px] font-bold transition ${paymentType === "COD"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-800"
                    }`}
                >
                  COD
                </button>
              </div>
            </div>

            {rateError && (
              <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-600">
                {rateError}
              </div>
            )}

            <button
              type="submit"
              disabled={rateLoading}
              className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-[12px] font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60"
            >
              {rateLoading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Calculating...
                </>
              ) : (
                <>
                  <Icon name="calculator" size={14} />
                  Calculate Rate
                </>
              )}
            </button>

            {shippingOptions && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Available Rates
                  </p>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-500">
                    {paymentType}
                  </span>
                </div>

                <div className="space-y-2">
                  {/* ROAD */}
                  <div
                    className={`rounded-xl border p-3 ${roadRate
                      ? "border-slate-200 bg-white"
                      : "border-slate-100 bg-slate-50"
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <Icon name="truck" size={14} />
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-slate-700">
                            By Road
                          </p>
                          <p className="text-[10px] text-slate-400">Surface</p>
                        </div>
                      </div>

                      {getRateValue(roadRate) !== null ? (
                        <p className="text-[15px] font-bold text-slate-800">
                          {formatAmount(getRateValue(roadRate))}
                        </p>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400">
                          Not available
                        </span>
                      )}
                    </div>

                    {roadRate && (
                      <div className="mt-2.5 flex items-center gap-3 border-t border-slate-100 pt-2 text-[10px] text-slate-400">
                        <span>
                          Zone:{" "}
                          <b className="font-semibold text-slate-700">
                            {getResultZone(roadRate)}
                          </b>
                        </span>
                        <span>
                          Distance:{" "}
                          <b className="font-semibold text-slate-700">
                            {getResultDistance(roadRate)}
                          </b>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* AIR */}
                  <div
                    className={`rounded-xl border p-3 ${airRate
                      ? "border-slate-200 bg-white"
                      : "border-slate-100 bg-slate-50"
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                          <Icon name="truck" size={14} />
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-slate-700">
                            By Air
                          </p>
                          <p className="text-[10px] text-slate-400">Express</p>
                        </div>
                      </div>

                      {getRateValue(airRate) !== null ? (
                        <p className="text-[15px] font-bold text-slate-800">
                          {formatAmount(getRateValue(airRate))}
                        </p>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400">
                          Not available
                        </span>
                      )}
                    </div>

                    {airRate && (
                      <div className="mt-2.5 flex items-center gap-3 border-t border-slate-100 pt-2 text-[10px] text-slate-400">
                        <span>
                          Zone:{" "}
                          <b className="font-semibold text-slate-700">
                            {getResultZone(airRate)}
                          </b>
                        </span>
                        <span>
                          Distance:{" "}
                          <b className="font-semibold text-slate-700">
                            {getResultDistance(airRate)}
                          </b>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

    </div>
  );
}

export default Dashboard;