import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

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
  String(order?.status || "")
    .trim()
    .toUpperCase();

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
}) => {
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
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-[11px] sm:text-[12px] font-medium text-slate-400 truncate">
            {title}
          </p>

          <p className="mt-1 text-[19px] sm:text-[22px] font-bold tracking-tight text-slate-800 truncate">
            {value}
          </p>

          {subtitle && (
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400 truncate">
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

  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
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

  useEffect(() => {
    try {
      const savedUser = JSON.parse(
        localStorage.getItem("user") || "null"
      );

      if (savedUser?.id) {
        setUser(savedUser);
      }
    } catch (error) {
      console.error("Dashboard user error:", error);
    }
  }, []);

  const loadDashboard = async (showLoader = true) => {
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
      const [ordersResponse, walletResponse] = await Promise.all([
        api.get("/orders/all", {
          params: { user_id: currentUser.id },
        }),
        api.get(`/payments/wallet?user_id=${currentUser.id}`),
      ]);

      const ordersData = ordersResponse?.data;
      const walletData = walletResponse?.data;

      if (!ordersData?.success) {
        throw new Error(
          ordersData?.message || "Unable to load orders"
        );
      }

      const orderList = Array.isArray(ordersData?.orders)
        ? ordersData.orders
        : [];

      setOrders(orderList);
      setWalletBalance(Number(walletData?.balance || 0));
    } catch (error) {
      console.error("Dashboard loading error:", error);
      setDashboardError(
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
    if (user?.id) {
      loadDashboard(true);
    }
  }, [user]);

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

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard(false);
  };

  const statistics = useMemo(() => {
    const total = orders.length;

    const processing = orders.filter(
      (order) => getStatus(order) === "PROCESSING"
    ).length;

    const manifested = orders.filter((order) => {
      const status = getStatus(order);
      return (
        status === "MANIFESTED" ||
        status === "SHIPPED" ||
        status === "IN_TRANSIT" ||
        status === "DELIVERED"
      );
    }).length;

    const cancelled = orders.filter(
      (order) =>
        getStatus(order) === "CANCELLED" ||
        getStatus(order) === "CANCELED"
    ).length;

    return {
      total,
      processing,
      manifested,
      cancelled,
    };
  }, [orders]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0))
      .slice(0, 6);
  }, [orders]);

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

  const getStatusClass = (status) => {
    switch (String(status).toUpperCase()) {
      case "PROCESSING":
        return "border-amber-100 bg-amber-50 text-amber-600";
      case "MANIFESTED":
      case "SHIPPED":
      case "IN_TRANSIT":
      case "DELIVERED":
        return "border-emerald-100 bg-emerald-50 text-emerald-600";
      case "CANCELLED":
      case "CANCELED":
        return "border-rose-100 bg-rose-50 text-rose-600";
      default:
        return "border-slate-200 bg-slate-50 text-slate-500";
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

  const handleCreateOrder = () => {
    navigate("/create-order");
  };

  if (pageLoading && !orders.length) {
    return (
      <div className="min-h-full bg-[#f6f8fb] p-4 sm:p-6">
        <div className="flex min-h-[65vh] items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-[#008dd2]" />
            <p className="mt-3 text-[13px] font-medium text-slate-500">
              Loading dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full overflow-x-hidden bg-[#f6f8fb] p-3.5 sm:p-5 md:p-6 pb-24 lg:pb-8">
      {/* ==================================================
          HEADER
      ================================================== */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[19px] sm:text-[22px] font-bold tracking-tight text-slate-900 truncate">
            Dashboard
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
          title="Processing"
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
          title="Cancelled"
          value={statistics.cancelled}
          subtitle="Cancelled orders"
          icon="close-circle"
          iconClass="bg-rose-50 text-rose-600"
          onClick={() => navigate("/all-orders")}
        />

        <StatCard
          title="Wallet Balance"
          value={formatAmount(walletBalance)}
          subtitle="Available balance"
          icon="wallet"
          iconClass="bg-violet-50 text-violet-600"
          onClick={() => navigate("/wallet")}
          isWide={true}
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
                <p className="text-[14px] font-bold text-slate-800">
                  Ship something today?
                </p>
                <p className="mt-0.5 text-[12px] text-slate-400">
                  Create a new shipment and get it moving.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCreateOrder}
                className="flex h-10 sm:h-9 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-[13px] sm:text-[12px] font-semibold text-white transition hover:bg-slate-800 active:scale-95"
              >
                <Icon name="plus" size={15} />
                <span>Create Order</span>
              </button>
            </div>
          </div>

          {/* RECENT ORDERS CONTAINER */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
              <div>
                <h2 className="text-[14px] font-bold text-slate-800">
                  Recent Orders
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Your latest shipment activity
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/all-orders")}
                className="flex items-center gap-1 text-[12px] font-bold text-[#008dd2] transition hover:opacity-80"
              >
                View all
                <Icon name="arrow-right" size={13} />
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
                    return (
                      <div
                        key={order?.id ?? order?.order_id}
                        className="p-3.5 space-y-2 hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-bold text-slate-800">
                            #{getOrderId(order)}
                          </span>
                          <span
                            className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${getStatusClass(
                              status
                            )}`}
                          >
                            {getStatusLabel(status)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[12px] text-slate-600">
                          <span className="font-medium truncate max-w-[180px]">
                            {getCustomer(order)}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${
                              getPayment(order) === "COD"
                                ? "border-violet-100 bg-violet-50 text-violet-600"
                                : "border-slate-200 bg-slate-50 text-slate-500"
                            }`}
                          >
                            {getPayment(order)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-50 pt-1.5">
                          <span className="font-mono">
                            AWB: {getAWB(order) || "—"}
                          </span>
                          <span>{formatDate(order?.created_at)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. TABLET & DESKTOP: Traditional Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-slate-100 bg-slate-50/70">
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Order
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Customer
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          AWB
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Payment
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[12px]">
                      {recentOrders.map((order) => {
                        const status = getStatus(order);
                        return (
                          <tr
                            key={order?.id ?? order?.order_id}
                            className="transition-colors hover:bg-slate-50/60"
                          >
                            <td className="px-4 py-3 font-semibold text-slate-800">
                              #{getOrderId(order)}
                            </td>
                            <td className="max-w-[140px] px-4 py-3 truncate font-medium text-slate-700">
                              {getCustomer(order)}
                            </td>
                            <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                              {getAWB(order) || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                                  getPayment(order) === "COD"
                                    ? "border-violet-100 bg-violet-50 text-violet-600"
                                    : "border-slate-200 bg-slate-50 text-slate-500"
                                }`}
                              >
                                {getPayment(order)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${getStatusClass(
                                  status
                                )}`}
                              >
                                {getStatusLabel(status)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[11px] text-slate-400">
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
              <div>
                <h2 className="text-[14px] font-bold text-slate-800">
                  Calculate Shipping Rate
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Get your assigned rate instantly
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleCalculateRate} className="p-4">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                  Pickup Pincode
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
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
                    className="h-9.5 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-2.5 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#008dd2] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                  Delivery Pincode
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
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
                    className="h-9.5 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-2.5 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#008dd2] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-500">
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
                    className="h-9.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 pr-8 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#008dd2] focus:bg-white"
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400">
                    kg
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                  Product Price
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-medium">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="500"
                    className="h-9.5 w-full rounded-xl border border-slate-200 bg-slate-50 pl-6 pr-2.5 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#008dd2] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3">
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                Payment Mode
              </label>
              <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setPaymentType("PREPAID")}
                  className={`h-8 rounded-lg text-[11px] font-bold transition ${
                    paymentType === "PREPAID"
                      ? "bg-white text-slate-800 shadow-xs"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Prepaid
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType("COD")}
                  className={`h-8 rounded-lg text-[11px] font-bold transition ${
                    paymentType === "COD"
                      ? "bg-white text-slate-800 shadow-xs"
                      : "text-slate-400 hover:text-slate-600"
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
                    className={`rounded-xl border p-3 ${
                      roadRate
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
                    className={`rounded-xl border p-3 ${
                      airRate
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

      {/* ==================================================
          BOTTOM SHORTCUT CARDS
      ================================================== */}
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
        <button
          type="button"
          onClick={() => navigate("/create-order")}
          className="group rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 text-left shadow-[0_1px_4px_rgba(15,23,42,0.03)] transition hover:border-sky-200 active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <Icon name="plus" size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-slate-700 truncate">
                Create New Order
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                Start a new shipment
              </p>
            </div>
            <div className="text-slate-300 transition group-hover:text-sky-500">
              <Icon name="arrow-right" size={14} />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate("/wallet")}
          className="group rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 text-left shadow-[0_1px_4px_rgba(15,23,42,0.03)] transition hover:border-violet-200 active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Icon name="wallet" size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-slate-700 truncate">
                Wallet History
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                View wallet balance & credits
              </p>
            </div>
            <div className="text-slate-300 transition group-hover:text-violet-500">
              <Icon name="arrow-right" size={14} />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate("/manifested")}
          className="group rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 text-left shadow-[0_1px_4px_rgba(15,23,42,0.03)] transition hover:border-emerald-200 active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Icon name="truck" size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-slate-700 truncate">
                Manifested Shipments
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                Track active orders
              </p>
            </div>
            <div className="text-slate-300 transition group-hover:text-emerald-500">
              <Icon name="arrow-right" size={14} />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

export default Dashboard;