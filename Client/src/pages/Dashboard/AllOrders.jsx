import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import { notifyOrderChange, subscribeToOrderUpdates } from "../../services/orderEvents";
import {
  printShippingLabels,
  downloadShippingLabels,
} from "../../services/shippingLabelService";

// ======================================================
// COLORS
// ======================================================

const PRIMARY = "#008dd2";
const PURPLE = "#7052ff";

// ======================================================
// ICON
// ======================================================

const Icon = ({ name, size = 17, strokeWidth = 1.8 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  switch (name) {
    case "box":
      return (
        <svg {...common}>
          <path d="M21 8.5 12 4 3 8.5v7L12 20l9-4.5v-7Z" />
          <path d="M3 8.5 12 13l9-4.5" />
          <path d="M12 13v7" />
        </svg>
      );

    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
      );

    case "refresh":
      return (
        <svg {...common}>
          <path d="M20 11a8 8 0 0 0-14.9-4" />
          <path d="M4 4v4h4" />
          <path d="M4 13a8 8 0 0 0 14.9 4" />
          <path d="M20 20v-4h-4" />
        </svg>
      );

    case "printer":
      return (
        <svg {...common}>
          <path d="M6 9V3h12v6" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <path d="M6 14h12v7H6z" />
          <path d="M17 12h1" />
        </svg>
      );

    case "copy":
      return (
        <svg {...common}>
          <rect x="9" y="9" width="10" height="10" rx="2" />
          <path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        </svg>
      );

    case "download":
      return (
        <svg {...common}>
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
      );

    case "eye":
      return (
        <svg {...common}>
         <path d="M2.5 12 C4.5 8 8 6 12 6 C16 6 19.5 8 21.5 12 C19.5 16 16 18 12 18 C8 18 4.5 16 2.5 12 Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "x":
      return (
        <svg {...common}>
          <path d="M6 6l12 12" />
          <path d="M18 6 6 18" />
        </svg>
      );

    case "truck":
      return (
        <svg {...common}>
          <path d="M3 6h11v10H3z" />
          <path d="M14 10h4l3 3v3h-7z" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
        </svg>
      );

      
    case "more":
      return (
        <svg {...common}>
          <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
        </svg>
      );


    default:
      return null;
  }
};

// ======================================================
// USER ID & HELPERS
// ======================================================

const getUserId = () => {
  try {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;
    const user = JSON.parse(storedUser);
    return user?.id || user?.user_id || user?.userId || null;
  } catch (error) {
    return null;
  }
};

const safeString = (value) => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const getCustomerName = (order) => {
  return (
    order?.consignee_name ||
    order?.customer_name ||
    order?.customer ||
    order?.name ||
    "—"
  );
};

const getMobile = (order) => {
  return (
    order?.mobile ||
    order?.phone ||
    order?.phone_no ||
    order?.consignee_phone ||
    ""
  );
};

const getAWB = (order) => {
  return order?.awb || order?.waybill || order?.awb_number || "—";
};

const getOrderId = (order) => {
  return order?.order_id || order?.id || "—";
};

const getShipmentName = (order) => {
  return (
    order?.shipment ||
    order?.product_name ||
    order?.service_name ||
    order?.product ||
    "Shipment"
  );
};

const getServiceType = (order) => {
  const value =
    order?.manifest_service_type ||
    order?.service_type ||
    order?.service ||
    order?.mode ||
    order?.shipping_mode ||
    "";

  const normalized = safeString(value)
    .trim()
    .toUpperCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ");

  if (
    normalized === "AIR" ||
    normalized === "EXPRESS" ||
    normalized.includes("AIR")
  ) {
    return "AIR";
  }

  if (
    normalized === "ROAD" ||
    normalized === "SURFACE" ||
    normalized.includes("ROAD") ||
    normalized.includes("SURFACE")
  ) {
    return "ROAD";
  }

  return "ROAD";
};

const getPaymentType = (order) => {
  const value =
    order?.payment_type ||
    order?.payment_method ||
    order?.payment ||
    order?.payment_mode ||
    "";

  const normalized = safeString(value)
    .trim()
    .toUpperCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ");

  if (normalized === "COD" || normalized === "CASH ON DELIVERY") {
    return "COD";
  }

  if (normalized === "PREPAID" || normalized === "PRE PAID") {
    return "PREPAID";
  }

  return normalized;
};

const getAmount = (order) => {
  const amount = Number(
    order?.total_amount ??
      order?.total ??
      order?.amount ??
      order?.shipping_charges ??
      0,
  );
  return Number.isFinite(amount) ? amount : 0;
};

const getPickupCity = (order) => {
  return (
    order?.pickup_city ||
    order?.warehouse_city ||
    order?.from_city ||
    order?.pickup_location ||
    "—"
  );
};

const getPickupPincode = (order) => {
  return (
    order?.pickup_pincode ||
    order?.warehouse_pincode ||
    order?.from_pincode ||
    ""
  );
};

const getDeliveryCity = (order) => {
  return (
    order?.city ||
    order?.delivery_city ||
    order?.to_city ||
    order?.destination_city ||
    "—"
  );
};

const getDeliveryPincode = (order) => {
  return order?.pincode || order?.delivery_pincode || order?.to_pincode || "";
};

const getWeight = (order) => {
  const directWeight = Number(
    order?.total_weight ?? order?.weight ?? order?.shipment_weight,
  );

  if (Number.isFinite(directWeight) && directWeight >= 0) {
    return directWeight;
  }

  if (Array.isArray(order?.packages)) {
    return order.packages.reduce((total, pkg) => {
      const weight = Number(pkg?.weight) || 0;
      const count = Number(pkg?.package_count ?? pkg?.count ?? 1) || 1;
      return total + weight * count;
    }, 0);
  }

  return 0;
};

const getVolumetricWeight = (order) => {
  const value = Number(
    order?.volumetric_weight ??
      order?.vol_weight ??
      order?.volumetricWeight ??
      0,
  );
  return Number.isFinite(value) ? value : 0;
};

const getPackageCount = (order) => {
  if (Array.isArray(order?.packages)) {
    return order.packages.reduce((total, pkg) => {
      return total + (Number(pkg?.package_count ?? pkg?.count ?? 1) || 1);
    }, 0);
  }

  return (
    Number(
      order?.package_count ?? order?.packages_count ?? order?.boxes ?? 1,
    ) || 1
  );
};

const getCreatedAt = (order) => {
  return (
    order?.created_at ||
    order?.order_created_at ||
    order?.createdAt ||
    order?.manifested_at ||
    null
  );
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatus = (order) => {
  return safeString(
    order?.tracking_status ||
      order?.status ||
      order?.order_status ||
      "PROCESSING",
  )
    .trim()
    .toUpperCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
};

const getStatusLabel = (status) => {
  return String(status || "PROCESSING")
    .trim()
    .toUpperCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
};

const StatusBadge = ({ status }) => {
  let className = "bg-slate-50 text-slate-600";

  switch (status) {
    case "MANIFESTED":
      className = "bg-sky-50 text-sky-600";
      break;
    case "NOT PICKED":
      className = "bg-orange-50 text-orange-600";
      break;
    case "IN TRANSIT":
    case "IN_TRANSIT":
      className = "bg-violet-50 text-violet-600";
      break;
    case "OUT FOR DELIVERY":
    case "OFD":
      className = "bg-cyan-50 text-cyan-600";
      break;
    case "DELIVERED":
      className = "bg-emerald-50 text-emerald-600";
      break;
    case "RTO IN TRANSIT":
    case "RTO_IN_TRANSIT":
      className = "bg-amber-50 text-amber-600";
      break;
    case "RTO DELIVERED":
    case "RTO_DELIVERED":
      className = "bg-rose-50 text-rose-600";
      break;
    case "RETURNED":
      className = "bg-slate-100 text-slate-600";
      break;
    case "CANCELLED":
    case "CANCELED":
      className = "bg-red-50 text-red-600";
      break;
    case "PENDING":
      className = "bg-yellow-50 text-yellow-600";
      break;
    case "PROCESSING":
      className = "bg-indigo-50 text-indigo-600";
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${className}`}
    >
      {/* <span className="h-1 w-1 rounded-full bg-current" /> */}
      {getStatusLabel(status)}
    </span>
  );
};

// ======================================================
// MAIN COMPONENT
// ======================================================

function AllOrders() {
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrderCount, setTotalOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");

  const [selectedIds, setSelectedIds] = useState([]);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const actionMenuRef = useRef(null);

  // Mobile Touch tracking reference
  const lastTapRef = useRef({});
  const hasLoadedRef = useRef(false);
  const requestIdRef = useRef(0);

  // Trigger global tracking event
  const triggerTracking = (awb) => {
    if (!awb || awb === "—") return;
    window.dispatchEvent(
      new CustomEvent("shipdrop:openTracking", {
        detail: String(awb),
      }),
    );
  };

  const handleTouchTracking = (awb) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[awb] || 0;
    if (now - lastTap < 350) {
      triggerTracking(awb);
      lastTapRef.current[awb] = 0;
    } else {
      lastTapRef.current[awb] = now;
    }
  };

  const fetchAllOrders = async () => {
    const userId = getUserId();

    if (!userId) {
      setLoading(false);
      setIsFetching(false);
      toast.error("User ID is required");
      return;
    }

    // Ignore older responses if a newer search/page request has started.
    const requestId = ++requestIdRef.current;

    try {
      setIsFetching(true);

      // Only show the full-page skeleton on the very first load.
      if (!hasLoadedRef.current) {
        setLoading(true);
      }

      const response = await api.get("/orders/all", {
        params: {
          user_id: userId,
          page: currentPage,
          limit: 50,
          search: debouncedSearch.trim(),
        },
      });

      if (requestId !== requestIdRef.current) return;

      const data = response?.data;

      if (!data?.success) {
        throw new Error(data?.message || "Unable to fetch all orders");
      }

      const list = Array.isArray(data?.orders) ? data.orders : [];
      const uniqueOrders = Array.from(
        new Map(
          list.map((order) => {
            const key = order?.id ?? order?.order_id;
            return [String(key), order];
          }),
        ).values(),
      );

      setTotalPages(Number(data?.pagination?.totalPages) || 1);
      setTotalOrderCount(Number(data?.pagination?.totalOrders) || 0);
      setOrders(uniqueOrders);
      setSelectedIds([]);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;

      // Keep the previous list visible if a refresh/search request fails.
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load all orders",
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setIsFetching(false);
        hasLoadedRef.current = true;
      }
    }
  };

  // Debounce typing so the API is called only after the user pauses.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    fetchAllOrders();
    // fetchAllOrders intentionally reads the current page and debounced search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    const unsubscribe = subscribeToOrderUpdates(() => {
      fetchAllOrders();
    });

    return () => {
      unsubscribe();
    };
  }, [currentPage, debouncedSearch]);

  
useEffect(() => {
  const handleOutsideClick = (event) => {
    if (
      actionMenuRef.current &&
      !actionMenuRef.current.contains(event.target)
    ) {
      setOpenActionMenuId(null);
    }
  };

  document.addEventListener("mousedown", handleOutsideClick);

  return () => {
    document.removeEventListener("mousedown", handleOutsideClick);
  };
}, []);


  const isProcessingOrder = (order) => {
    const normalizeStatus = (value) =>
      safeString(value)
        .trim()
        .toUpperCase()
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ");

    const orderStatus = normalizeStatus(order?.status);
    const trackingStatus = normalizeStatus(order?.tracking_status);

    return orderStatus === "PROCESSING" || trackingStatus === "PROCESSING";
  };

  const nonProcessingOrders = orders.filter(
    (order) => !isProcessingOrder(order),
  );

  const filteredOrders = nonProcessingOrders.filter((order) => {
    const status = getStatus(order);
    const service = getServiceType(order);
    const payment = getPaymentType(order);

    // Text search is handled by the API so results can match across all pages.
    // These dropdown filters remain local to the currently loaded result page.
    const statusMatch = statusFilter === "ALL" || status === statusFilter;
    const serviceMatch = serviceFilter === "ALL" || service === serviceFilter;
    const paymentMatch = paymentFilter === "ALL" || payment === paymentFilter;

    return statusMatch && serviceMatch && paymentMatch;
  });

  const getOrderKey = (order) => String(order?.id ?? order?.order_id);

  const selectedOrders = nonProcessingOrders.filter((order) =>
    selectedIds.includes(getOrderKey(order)),
  );

  const allVisibleSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((order) => selectedIds.includes(getOrderKey(order)));

  const handleSelectAll = () => {
    if (allVisibleSelected) {
      const visibleIds = filteredOrders.map(getOrderKey);
      setSelectedIds((previous) =>
        previous.filter((id) => !visibleIds.includes(id)),
      );
      return;
    }

    setSelectedIds((previous) => [
      ...new Set([...previous, ...filteredOrders.map(getOrderKey)]),
    ]);
  };

  const handleSelect = (order) => {
    const id = getOrderKey(order);
    setSelectedIds((previous) => {
      if (previous.includes(id)) {
        return previous.filter((item) => item !== id);
      }
      return [...previous, id];
    });
  };

  const handleView = async (order) => {
    setViewingOrder(order);
    const orderId = order?.id ?? order?.order_id;
    const userId = getUserId();

    if (!orderId || !userId) return;

    setDetailLoading(true);
    try {
      const response = await api.get(`/orders/${orderId}`, {
        params: { user_id: userId },
      });
      if (response?.data?.success && response?.data?.order) {
        setViewingOrder((current) =>
          current && String(current?.id ?? current?.order_id) === String(orderId)
            ? { ...current, ...response.data.order }
            : current
        );
      }
    } catch (error) {
      // Keep the list data visible if detailed data cannot be loaded.
      console.error("Unable to load full order details:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePrintSingleLabel = async (order) => {
    if (!order) {
      toast.error("Unable to print this label");
      return;
    }

    await printShippingLabels([order], "ParcelDrop Shipping Label");
  };

  const handlePrintLabels = async () => {
    if (selectedOrders.length === 0) {
      toast.error("Please select at least one order");
      return;
    }

    await printShippingLabels(
      selectedOrders,
      "ParcelDrop Shipping Labels",
    );
  };

  const handleDownloadSingleLabel = async (order) => {
    if (!order) {
      toast.error("Unable to download this label");
      return;
    }

    await downloadShippingLabels([order]);
  };

  const handleDownloadLabels = async () => {
    if (selectedOrders.length === 0) {
      toast.error("Please select at least one order");
      return;
    }

    await downloadShippingLabels(selectedOrders);
  };

  const handleExport = () => {
    if (orders.length === 0) {
      toast.error("No orders to export");
      return;
    }

    const exportOrders =
      selectedOrders.length > 0 ? selectedOrders : nonProcessingOrders;

    const headers = [
      "AWB",
      "Order ID",
      "Customer",
      "Mobile",
      "Shipment",
      "Service Type",
      "From",
      "To",
      "Payment",
      "Weight (Kg)",
      "Status",
      "Created",
    ];

    const rows = exportOrders.map((order) => [
      getAWB(order),
      getOrderId(order),
      getCustomerName(order),
      getMobile(order),
      getShipmentName(order),
      getServiceType(order),
      getPickupCity(order),
      getDeliveryCity(order),
      getPaymentType(order),
      getWeight(order).toFixed(2),
      getStatus(order),
      getCreatedAt(order) || "",
    ]);

    const escapeCsv = (value) => {
      const text = String(value ?? "");
      if (text.includes(",") || text.includes('"') || text.includes("\n")) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `shipdrop-all-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(
      `${exportOrders.length} ${
        exportOrders.length === 1 ? "order" : "orders"
      } exported`,
    );
  };

  const handleDuplicate = async (order) => {
    const orderId = order?.id;
    const userId = getUserId();

    if (!orderId || !userId) {
      toast.error("Unable to duplicate this order");
      return;
    }

    try {
      const response = await api.get(`/orders/${orderId}`, {
        params: { user_id: userId },
      });

      const result = response?.data;
      if (!result?.success || !result?.order) {
        throw new Error(result?.message || "Unable to load order details");
      }

      const source = result.order;
      const warehouseId = Number(
        source?.warehouse_id ||
          source?.warehouse?.id ||
          order?.warehouse_id ||
          0,
      );

      if (!warehouseId) {
        throw new Error("Pickup warehouse is missing");
      }

      const payload = {
        user_id: Number(userId),
        pickup_address: source?.pickup_address || null,
        pickup_pincode: source?.pickup_pincode || null,
        pickup_city: source?.pickup_city || null,
        warehouse_id: warehouseId,
        pickup_address_id: source?.pickup_address_id || null,
        orderData: {
          consignee_name: source?.consignee_name || "",
          mobile: source?.mobile || "",
          alternate_mobile: source?.alternate_mobile || null,
          email: source?.email || null,
          gstin: source?.gstin || null,
          company_name: source?.company_name || null,
          floor_no: source?.floor_no || null,
          landmark: source?.landmark || null,
          address_line1: source?.address_line1 || "",
          address_line2: source?.address_line2 || null,
          pincode: source?.pincode || "",
          city: source?.city || "",
          state: source?.state || "",
          country: source?.country || "India",
          payment_type: source?.payment_type || "Prepaid",
          risk_type: source?.risk_type || "Owner Risk",
          warehouse_id: warehouseId,
        },
        products: Array.isArray(source?.products)
          ? source.products.map((product) => ({
              product_name: product?.product_name || "",
              sku: product?.sku || null,
              price: Number(product?.price) || 0,
              qty: Number(product?.qty) || 1,
              tax: Number(product?.tax) || 0,
            }))
          : [],
        packages: Array.isArray(source?.packages)
          ? source.packages.map((pkg) => ({
              length: Number(pkg?.length) || 0,
              width: Number(pkg?.width) || 0,
              height: Number(pkg?.height) || 0,
              weight: Number(pkg?.weight) || 0,
              package_count: Number(pkg?.package_count) || 1,
            }))
          : [],
      };

      const createResponse = await api.post("/orders/create", payload);
      const createResult = createResponse?.data;

      if (!createResult?.success || !createResult?.order_id) {
        throw new Error(createResult?.message || "Unable to duplicate order");
      }

      toast.success(
        `Order duplicated successfully. New order #${createResult.order_id} is in Processing.`,
      );
      await fetchAllOrders();
      notifyOrderChange({ type: "created", orderId: createResult.order_id });
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to duplicate order",
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] px-3.5 sm:px-4 py-4 sm:py-5">
        <div className="mx-auto max-w-[1450px]">
          <div className="mb-3 h-[92px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
          <div className="mb-3 h-[62px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="h-12 animate-pulse bg-slate-50" />
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-[86px] animate-pulse border-t border-slate-100"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f8fc] px-3 sm:px-4 py-4 sm:py-5 pb-24 lg:pb-8">
      <div className="mx-auto max-w-[1450px]">
        {/* ==================================================
            TOP HEADER
        ================================================== */}
        <div className="mb-3 rounded-2xl border border-slate-200 bg-white px-4 sm:px-5 py-3.5 sm:py-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: "#edf8ff",
                  color: PRIMARY,
                }}
              >
                <Icon name="box" size={20} />
              </div>

              <div>
                <h1 className="text-base sm:text-[17px] font-semibold tracking-[-0.2px] text-slate-900">
                  All Orders
                </h1>
                <p className="mt-0.5 text-xs text-slate-400">
                  {totalOrderCount}{" "}
                  {totalOrderCount === 1 ? "shipment" : "shipments"} across all
                  statuses
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePrintLabels}
                disabled={selectedOrders.length === 0}
                className="inline-flex h-9 flex-1 sm:flex-initial items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#008dd2] px-3.5 text-xs font-semibold text-white transition hover:bg-[#007dbb] active:scale-95 disabled:cursor-not-allowed disabled:opacity-55"
              >
                <Icon name="printer" size={15} />
                <span>Print Labels ({selectedOrders.length})</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadLabels}
                disabled={selectedOrders.length === 0}
                className="inline-flex h-9 flex-1 sm:flex-initial items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#008dd2] px-3.5 text-xs font-semibold text-white transition hover:bg-[#007dbb] active:scale-95 disabled:cursor-not-allowed disabled:opacity-55"
              >
                <Icon name="download" size={15} />
                <span>Download Labels ({selectedOrders.length})</span>
              </button>

              <button
                type="button"
                onClick={handleExport}
                disabled={nonProcessingOrders.length === 0}
                className="inline-flex h-9 flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl bg-[#10b981] px-3.5 text-xs font-semibold text-white transition hover:bg-[#059669] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon name="download" size={15} />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* ==================================================
            FILTER BAR (RESPONSIVE DOCK)
        ================================================== */}
        <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)] space-y-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* SEARCH */}
            <div className="relative min-w-0 flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon name="search" size={15} />
              </span>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer, AWB, Order ID or mobile..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-24 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
              />
              {isFetching && hasLoadedRef.current && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400">
                  Updating…
                </span>
              )}
            </div>

            {/* FILTER DROPDOWNS */}
            <div className="grid grid-cols-3 sm:flex sm:items-center gap-1.5 sm:gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full sm:min-w-[130px] rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-600 outline-none focus:border-[#008dd2]"
              >
                <option value="ALL">All Status</option>
                <option value="MANIFESTED">Manifested</option>
                <option value="NOT PICKED">Not Picked</option>
                <option value="PENDING">Pending</option>
                <option value="IN TRANSIT">In Transit</option>
                <option value="OUT FOR DELIVERY">Out For Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="RTO IN TRANSIT">RTO In Transit</option>
                <option value="RTO DELIVERED">RTO Delivered</option>
                <option value="RETURNED">Returned</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="h-10 w-full sm:min-w-[110px] rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-600 outline-none focus:border-[#008dd2]"
              >
                <option value="ALL">All Mode</option>
                <option value="ROAD">Surface</option>
                <option value="AIR">Air</option>
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="h-10 w-full sm:min-w-[110px] rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-600 outline-none focus:border-[#008dd2]"
              >
                <option value="ALL">All Pay</option>
                <option value="PREPAID">Prepaid</option>
                <option value="COD">COD</option>
              </select>

              <button
                type="button"
                onClick={fetchAllOrders}
                title="Refresh"
                className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 active:scale-95"
              >
                <Icon name="refresh" size={15} />
              </button>
            </div>
          </div>

          {/* MOBILE SELECT ALL BAR */}
          {filteredOrders.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 sm:hidden">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                    allVisibleSelected
                      ? "border-[#008dd2] bg-[#008dd2] text-white"
                      : "border-slate-300 bg-white text-transparent"
                  }`}
                >
                  <Icon name="check" size={11} />
                </button>
                <span>Select All ({filteredOrders.length})</span>
              </label>

              <button
                type="button"
                onClick={fetchAllOrders}
                className="flex items-center gap-1 text-xs font-bold text-[#008dd2]"
              >
                <Icon name="refresh" size={12} />
                Refresh
              </button>
            </div>
          )}
        </div>

        {/* ==================================================
            1. MOBILE VIEW: APP-STYLE CARD TILES (FIXED TRACKING)
        ================================================== */}
        <div className="space-y-3 sm:hidden">
          {filteredOrders.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-400">
              <Icon name="box" size={24} />
              <p className="mt-2 text-xs font-bold text-slate-700">
                {nonProcessingOrders.length > 0
                  ? "No matching orders"
                  : "No orders found"}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const id = getOrderKey(order);
              const selected = selectedIds.includes(id);
              const service = getServiceType(order);
              const payment = getPaymentType(order);
              const weight = getWeight(order);
              const status = getStatus(order);
              const awb = getAWB(order);

              return (
                <div
                  key={id}
                  className={`rounded-2xl border bg-white p-3.5 shadow-xs space-y-2.5 transition ${
                    selected
                      ? "border-[#008dd2] ring-2 ring-[#008dd2]/10"
                      : "border-slate-200/80"
                  }`}
                >
                  {/* CARD HEADER */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelect(order)}
                        className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                          selected
                            ? "border-[#008dd2] bg-[#008dd2] text-white"
                            : "border-slate-300 bg-white text-transparent"
                        }`}
                      >
                        <Icon name="check" size={11} />
                      </button>

                      <span className="font-mono text-xs font-bold text-slate-800">
                        #{getOrderId(order)}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-1">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                          payment === "COD"
                            ? "border-amber-100 bg-amber-50 text-amber-600"
                            : "border-sky-100 bg-sky-50 text-[#008dd2]"
                        }`}
                      >
                        {payment}
                      </span>
                      <StatusBadge status={status} />
                    </div>
                  </div>

                  {/* AWB & CUSTOMER */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 truncate">
                        {getCustomerName(order)}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {getMobile(order)}
                      </span>
                    </div>

                    {/* AWB TOUCH/CLICK ACTION BAR */}
                    <div className="flex items-center justify-between font-mono text-[11px] text-slate-600 bg-slate-50/70 px-2 py-1.5 rounded-lg border border-slate-100">
                      <span
                        onTouchEnd={() => handleTouchTracking(awb)}
                        onClick={() => triggerTracking(awb)}
                        className="truncate font-semibold select-none cursor-pointer"
                        title="Double-tap or click Track to track order"
                      >
                        AWB: {awb}
                      </span>

                      {awb && awb !== "—" && (
                        <div className="flex items-center gap-2 shrink-0">
                          {/* 1-TAP TRACK BUTTON FOR MOBILE TOUCH */}
                          <button
                            type="button"
                            onClick={() => triggerTracking(awb)}
                            className="flex items-center gap-1 rounded-md bg-[#008dd2]/10 px-2 py-0.5 text-[10px] font-bold text-[#008dd2] active:scale-95 transition"
                          >
                            <Icon name="truck" size={11} />
                            Track
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(String(awb));
                                toast.success("AWB copied");
                              } catch {
                                toast.error("Unable to copy AWB");
                              }
                            }}
                            className="text-slate-400 hover:text-slate-700 flex items-center p-0.5"
                            title="Copy AWB"
                          >
                            <Icon name="copy" size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ROUTE */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span className="truncate max-w-[120px]">
                        {getPickupCity(order)} ({getPickupPincode(order)})
                      </span>
                      <span className="text-slate-400 font-bold px-1">→</span>
                      <span className="truncate max-w-[120px] text-right">
                        {getDeliveryCity(order)} ({getDeliveryPincode(order)})
                      </span>
                    </div>

                    {/* SPECS */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-50 pt-1.5">
                      <span>
                        {service === "AIR" ? "By Air" : "By Road"} •{" "}
                        {weight.toFixed(2)} Kg
                      </span>
                      <span className="font-semibold text-slate-600">
                        {formatDate(getCreatedAt(order))}
                      </span>
                    </div>
                  </div>

                  {/* CARD ACTIONS */}
                  <div className="flex items-center justify-end gap-1.5 border-t border-slate-100 pt-2">
                    <button
                      type="button"
                      onClick={() => handleView(order)}
                      className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 active:scale-95"
                    >
                      <Icon name="eye" size={13} />
                      View
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicate(order)}
                      className="flex h-8 items-center gap-1 rounded-lg border border-violet-200 bg-violet-50/50 px-3 text-xs font-semibold text-violet-600 hover:bg-violet-100 active:scale-95"
                    >
                      <Icon name="copy" size={13} />
                      Duplicate
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePrintSingleLabel(order)}
                      title="Print Shipping Label"
                      className="flex h-8 items-center gap-1 rounded-lg bg-[#008dd2] px-3 text-xs font-bold text-white shadow-xs active:scale-95"
                    >
                      <Icon name="printer" size={13} />
                      Print
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadSingleLabel(order)}
                      title="Download Shipping Label"
                      className="flex h-8 items-center gap-1 rounded-lg border border-[#b9dff0] bg-white px-3 text-xs font-bold text-[#008dd2] active:scale-95"
                    >
                      <Icon name="download" size={13} />
                      Download
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ==================================================
            2. TABLET & DESKTOP: STRUCTURED TABLE
        ================================================== */}
        <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="max-h-[calc(100vh-180px)] overflow-y-auto overflow-x-hidden">
            <table className="w-full table-fixed border-collapse">
              <thead className="sticky top-0 z-20 bg-white">
                <tr className="border-b border-slate-200 bg-white">
                  <th className="sticky top-0 z-20 w-[4%] bg-white px-2 py-3 text-left">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className={`flex h-[17px] w-[17px] items-center justify-center rounded-[4px] border transition ${
                        allVisibleSelected
                          ? "border-[#008dd2] bg-[#008dd2] text-white"
                          : "border-slate-300 bg-white text-transparent"
                      }`}
                    >
                      <Icon name="check" size={11} />
                    </button>
                  </th>

                  <th className="sticky top-0 z-20 w-[17%] bg-white px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                    Customer
                  </th>

                  <th className="sticky top-0 z-20 w-[17%] bg-white px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                    Shipment
                  </th>

                  <th className="sticky top-0 z-20 w-[17%] bg-white px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                    Route
                  </th>

                  <th className="sticky top-0 z-20 w-[11%] bg-white px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                    Payment
                  </th>

                  <th className="sticky top-0 z-20 w-[9%] bg-white px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                    Weight
                  </th>

                  <th className="sticky top-0 z-20 w-[12%] bg-white px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                    Created
                  </th>

                  <th className="sticky top-0 z-20 w-[13%] bg-white px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="h-[300px] px-6 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                          <Icon name="box" size={21} />
                        </div>

                        <div className="text-sm font-medium text-slate-700">
                          {nonProcessingOrders.length > 0
                            ? "No matching orders"
                            : "No orders found"}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          {nonProcessingOrders.length > 0
                            ? "Try changing your search or filters."
                            : "Orders will appear here after they are manifested."}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const id = getOrderKey(order);
                    const selected = selectedIds.includes(id);
                    const service = getServiceType(order);
                    const payment = getPaymentType(order);
                    const weight = getWeight(order);
                    const status = getStatus(order);
                    const awb = getAWB(order);

                    return (
                      <tr
                        key={id}
                        className={`border-b border-slate-100 transition last:border-b-0 ${
                          selected ? "bg-[#f8fcff]" : "bg-white"
                        } hover:bg-slate-50`}
                      >
                        <td className="px-2 py-2.5">
                          <button
                            type="button"
                            onClick={() => handleSelect(order)}
                            className={`flex h-[17px] w-[17px] items-center justify-center rounded-[4px] border transition ${
                              selected
                                ? "border-[#008dd2] bg-[#008dd2] text-white"
                                : "border-slate-300 bg-white text-transparent"
                            }`}
                          >
                            <Icon name="check" size={11} />
                          </button>
                        </td>

                        <td className="px-2 py-2.5 break-words">
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-slate-800">
                              {getCustomerName(order)}
                            </p>

                            {getMobile(order) && (
                              <p className="mt-0.5 text-[11px] text-slate-400">
                                {getMobile(order)}
                              </p>
                            )}

                            <div className="mt-0.5 -ml-0.5">
  <StatusBadge status={status} />
</div>
                          </div>
                        </td>

                        <td className="px-2 py-2.5 break-words">
                          <div className="min-w-0">
                            {status !== "PROCESSING" && (
                              <>
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <p
                                    onClick={() => triggerTracking(awb)}
                                    title="click to track"
                                    className="truncate text-[13px] font-semibold text-slate-800 cursor-pointer select-none"
                                  >
                                    {awb}
                                  </p>

                                  {awb && awb !== "—" && (
                                    <button
                                      type="button"
                                      onClick={async (event) => {
                                        event.stopPropagation();
                                        try {
                                          await navigator.clipboard.writeText(
                                            String(awb),
                                          );
                                          toast.success("AWB copied");
                                        } catch {
                                          toast.error("Unable to copy AWB");
                                        }
                                      }}
                                      title="Copy AWB"
                                      className="shrink-0 p-0.5 text-slate-400 hover:text-slate-700 transition"
                                    >
                                      <Icon name="copy" size={14} />
                                    </button>
                                  )}
                                </div>

                                <p className="mt-0.5 text-[11px] text-slate-500">
                                  Pickup ID:{" "}
                                  {order?.pickup_id || order?.pickupId || order?.pickup_request_id || "—"}
                                </p>
                              </>
                            )}

                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {getShipmentName(order)} -{" "}
                              {service === "AIR" ? "By Air" : "By Surface"}
                            </p>
                          </div>
                        </td>

                        
<td className="px-2 py-2.5">
  <div className="flex flex-col gap-0">
    {/* Pickup */}
    <div className="flex min-w-0 items-center gap-1.5">
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#008dd2"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>

      <p className="truncate text-[12px] font-medium text-slate-700">
        {getPickupCity(order)}
        {getPickupPincode(order) && (
          <span className="ml-1 text-[10px] text-slate-400">
            ({getPickupPincode(order)})
          </span>
        )}
      </p>
    </div>

    {/* Route connector */}
<div className="ml-[5px] flex h-2.5 flex-col justify-between">
  <span className="h-1 border-l border-dashed border-slate-300" />
  <span className="h-1 border-l border-dashed border-slate-300" />
</div>    {/* Delivery */}
    <div className="flex min-w-0 items-center gap-1.5">
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>

      <p className="truncate text-[12px] font-medium text-slate-700">
        {getDeliveryCity(order)}
        {getDeliveryPincode(order) && (
          <span className="ml-1 text-[10px] text-slate-400">
            ({getDeliveryPincode(order)})
          </span>
        )}
      </p>
    </div>
  </div>
</td>


                        <td className="px-2 py-2.5 break-words">
                          <div>
                            <p
                              className={`text-[12px] font-semibold ${
                                payment === "COD"
                                  ? "text-amber-600"
                                  : "text-[#008dd2]"
                              }`}
                            >
                              {payment}
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {payment === "COD"
                                ? "Cash on Delivery"
                                : "Prepaid"}
                            </p>

                            <p className="text-[10px] text-slate-400">
                              Charge: ₹
                              {Number(order?.shipping_charge || 0).toFixed(2)}
                            </p>
                          </div>
                        </td>

                        <td className="px-2 py-2.5 break-words">
                          <div>
                            <p className="text-[12px] font-semibold text-slate-700">
                              Box: {getPackageCount(order)}
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-400">
                              Wt: {weight.toFixed(2)} kg
                            </p>

                            <p className="text-[10px] text-slate-400">
                              Vol: {getVolumetricWeight(order).toFixed(2)} kg
                            </p>
                          </div>
                        </td>

                        <td className="px-2 py-2.5 break-words">
                          <p className="text-[12px] font-medium text-slate-700">
                            #{getOrderId(order)}
                          </p>

                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {status === "MANIFESTED"
                              ? "Manifested: "
                              : "Created: "}
                            {formatDate(getCreatedAt(order))}{" "}{formatTime(getCreatedAt(order))}
                          </p>

                          
                        </td>

                      
<td className="px-1 py-2.5">
  <div className="flex items-center justify-start gap-1">
    {/* Print */}
    <button
      type="button"
      onClick={() => handlePrintSingleLabel(order)}
      title="Print Shipping Label"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#008dd2] bg-[#008dd2] text-white transition hover:bg-[#007dbb]"
    >
      <Icon name="printer" size={15} />
    </button>

    {/* Download */}
    <button
      type="button"
      onClick={() => handleDownloadSingleLabel(order)}
      title="Download Shipping Label"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#008dd2] bg-[#008dd2] text-white transition hover:bg-[#007dbb]"
    >
      <Icon name="download" size={13} />
    </button>

    {/* More Actions */}
<div
      ref={actionMenuRef}
      className="relative"
      onMouseDown={(event) => event.stopPropagation()}
    >      <button
        type="button"
        onClick={() =>
          setOpenActionMenuId((prev) => (prev === id ? null : id))
        }
        title="More Actions"
        aria-label="More Actions"
        aria-expanded={openActionMenuId === id}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition ${
          openActionMenuId === id
            ? "border-[#008dd2] bg-[#edf8ff] text-[#008dd2]"
            : "border-slate-200 bg-white text-slate-500 hover:border-[#008dd2] hover:bg-[#edf8ff] hover:text-[#008dd2]"
        }`}
      >
        <Icon name="more" size={16} />
      </button>

      {openActionMenuId === id && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              setOpenActionMenuId(null);
              handleView(order);
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Icon name="eye" size={15} />
            Details
          </button>

          <button
            type="button"
            onClick={() => {
              setOpenActionMenuId(null);
              handleDuplicate(order);
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Icon name="copy" size={15} />
            Duplicate Order
          </button>
        </div>
      )}
    </div>
  </div>
</td>


                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE FOOTER */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3">
            <p className="text-[12px] text-slate-500">
              Page {currentPage} of {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE PAGINATION DOCK */}
        <div className="flex sm:hidden items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 mt-3 shadow-xs">
          <span className="text-xs font-semibold text-slate-600">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================
          VIEW ORDER MODAL — COMPACT FULL DETAILS
      ==================================================== */}
      {viewingOrder && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-2 sm:p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setViewingOrder(null);
          }}
        >
          <div className="flex max-h-[94vh] w-full max-w-[980px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-slate-900 sm:text-base">
                  Order Details <span className="text-slate-400">— #{getOrderId(viewingOrder)}</span>
                </h2>
                {getAWB(viewingOrder) && getAWB(viewingOrder) !== "—" && (
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">
                    AWB: <button type="button" onClick={() => triggerTracking(getAWB(viewingOrder))} className="font-mono font-semibold text-[#008dd2] hover:underline">{getAWB(viewingOrder)}</button>
                  </p>
                )}
              </div>
              <button type="button" onClick={() => setViewingOrder(null)} aria-label="Close details" className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <Icon name="x" size={17} />
              </button>
            </div>

            {/* Compact body: no forced horizontal scroll; absent values are omitted */}
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4">
              {detailLoading && (
                <div className="mb-3 flex items-center gap-2 rounded-lg bg-sky-50 px-3 py-2 text-[11px] font-medium text-sky-700">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
                  Loading complete order details…
                </div>
              )}

              {(() => {
                const o = viewingOrder;
                const present = (value) =>
                  value !== null && value !== undefined && String(value).trim() !== "";
                const address = [
                  o.address_line1, o.address_line2, o.floor_no, o.landmark,
                  o.city, o.state, o.pincode, o.country
                ].filter(present).join(", ");
                const pickupAddress = [
                  o.pickup_address,
                  o.warehouse?.address,
                  o.warehouse?.address_line1,
                  o.warehouse?.address_line2,
                  o.pickup_city,
                  o.pickup_state,
                  o.pickup_pincode
                ].filter(present).join(", ");
                const pickupName = o.pickup_name || o.warehouse_name || o.warehouse?.name || o.pickup_contact_name;
                const pickupPhone = o.pickup_phone || o.pickup_mobile || o.warehouse?.phone || o.pickup_contact;
                const buyerFields = [
                  ["Name", o.consignee_name || o.customer_name || o.name],
                  ["Mobile", o.mobile || o.phone || o.consignee_phone],
                  ["Alternate Mobile", o.alternate_mobile],
                  ["Email", o.email],
                  ["Company", o.company_name],
                  ["GSTIN", o.gstin],
                ].filter(([, value]) => present(value));
                const pickupFields = [
                  ["Pickup Name", pickupName],
                  ["Contact", pickupPhone],
                  ["Pickup Address", pickupAddress],
                ].filter(([, value]) => present(value));
                const shipmentFields = [
                  ["Order ID", `#${getOrderId(o)}`],
                  ["AWB", getAWB(o)],
                  ["Pickup ID", o.pickup_id || o.pickupId || o.pickup_request_id],
                  ["Status", getStatusLabel(getStatus(o))],
                  ["Payment", getPaymentType(o)],
                  ["Service", getServiceType(o) === "AIR" ? "By Air" : "By Surface"],
                  ["Shipping Charge", present(o.shipping_charge) ? `₹${Number(o.shipping_charge).toFixed(2)}` : ""],
                  ["Order Value", present(o.total_amount ?? o.total ?? o.amount) ? `₹${Number(o.total_amount ?? o.total ?? o.amount).toFixed(2)}` : ""],
                  ["COD Amount", present(o.cod_amount) ? `₹${Number(o.cod_amount).toFixed(2)}` : ""],
                  ["Distance", present(o.distance) ? `${o.distance} Km` : ""],
                  ["Risk Type", o.risk_type],
                  ["Created", present(getCreatedAt(o)) ? `${formatDate(getCreatedAt(o))} ${formatTime(getCreatedAt(o))}`.trim() : ""],
                ].filter(([, value]) => present(value) && value !== "—");

                const products = Array.isArray(o.products) ? o.products : [];
                const packages = Array.isArray(o.packages) ? o.packages : [];
                const hasWeight = present(o.total_weight ?? o.weight ?? o.shipment_weight) ||
                  present(o.volumetric_weight ?? o.vol_weight ?? o.volumetricWeight) ||
                  present(o.billing_weight);
                const hasAddress = present(address);

                const Section = ({ title, children, className = "" }) => (
                  <section className={`min-w-0 rounded-xl border border-slate-200 bg-white p-3 ${className}`}>
                    <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">{title}</h3>
                    {children}
                  </section>
                );
                const FieldGrid = ({ fields }) => (
                  <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                    {fields.map(([label, value]) => (
                      <div key={label} className="min-w-0">
                        <p className="text-[10px] text-slate-400">{label}</p>
                        <p className="mt-0.5 break-words text-[12px] font-medium leading-4 text-slate-700">{value}</p>
                      </div>
                    ))}
                  </div>
                );

                return (
                  <div className="space-y-2.5">
                    {(buyerFields.length > 0 || hasAddress) && (
                      <Section title="Buyer / Delivery Details">
                        {buyerFields.length > 0 && <FieldGrid fields={buyerFields} />}
                        {hasAddress && (
                          <div className={buyerFields.length > 0 ? "mt-2 border-t border-slate-100 pt-2" : ""}>
                            <p className="text-[10px] text-slate-400">Delivery Address</p>
                            <p className="mt-0.5 break-words text-[12px] leading-5 text-slate-700">{address}</p>
                          </div>
                        )}
                      </Section>
                    )}

                    {pickupFields.length > 0 && (
                      <Section title="Pickup Details">
                        <FieldGrid fields={pickupFields} />
                      </Section>
                    )}

                    {shipmentFields.length > 0 && (
                      <Section title="Shipment & Payment">
                        <FieldGrid fields={shipmentFields} />
                      </Section>
                    )}

                    {products.length > 0 && (
                      <Section title="Products">
                        <div className="space-y-1.5">
                          {products.map((product, index) => {
                            const details = [
                              product?.sku ? `SKU: ${product.sku}` : "",
                              present(product?.qty) ? `Qty: ${product.qty}` : "",
                              present(product?.price) ? `Price: ₹${Number(product.price).toFixed(2)}` : "",
                              present(product?.tax) ? `Tax: ₹${Number(product.tax).toFixed(2)}` : "",
                            ].filter(Boolean);
                            const name = product?.product_name || product?.name;
                            if (!present(name) && details.length === 0) return null;
                            return (
                              <div key={product?.id || index} className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                                {present(name) && <p className="min-w-0 break-words text-[12px] font-medium text-slate-700">{name}</p>}
                                {details.length > 0 && <p className="text-[11px] text-slate-500">{details.join(" · ")}</p>}
                              </div>
                            );
                          })}
                        </div>
                      </Section>
                    )}

                    {(packages.length > 0 || hasWeight) && (
                      <Section title="Dimensions & Weight">
                        {hasWeight && (
                          <div className="mb-2 flex flex-wrap gap-x-5 gap-y-1">
                            {present(o.total_weight ?? o.weight ?? o.shipment_weight) && (
                              <p className="text-[11px] text-slate-600">Actual Weight: <span className="font-semibold text-slate-800">{Number(o.total_weight ?? o.weight ?? o.shipment_weight).toFixed(2)} kg</span></p>
                            )}
                            {present(o.volumetric_weight ?? o.vol_weight ?? o.volumetricWeight) && (
                              <p className="text-[11px] text-slate-600">Volumetric Weight: <span className="font-semibold text-slate-800">{Number(o.volumetric_weight ?? o.vol_weight ?? o.volumetricWeight).toFixed(2)} kg</span></p>
                            )}
                            {present(o.billing_weight) && (
                              <p className="text-[11px] text-slate-600">Billing Weight: <span className="font-semibold text-slate-800">{Number(o.billing_weight).toFixed(2)} kg</span></p>
                            )}
                          </div>
                        )}
                        {packages.length > 0 && (
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {packages.map((pkg, index) => {
                              const dims = [pkg?.length, pkg?.width, pkg?.height].every(present)
                                ? `${pkg.length} × ${pkg.width} × ${pkg.height} cm`
                                : "";
                              const fields = [
                                present(pkg?.package_count ?? pkg?.count) ? `${pkg.package_count ?? pkg.count} box(es)` : "",
                                dims,
                                present(pkg?.weight) ? `${pkg.weight} kg` : "",
                              ].filter(Boolean);
                              if (!fields.length) return null;
                              return <div key={pkg?.id || index} className="rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] text-slate-600">{fields.join(" · ")}</div>;
                            })}
                          </div>
                        )}
                      </Section>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-3 py-2.5 sm:px-4">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => handleDownloadSingleLabel(viewingOrder)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#b9dff0] bg-white px-3 text-[11px] font-semibold text-[#008dd2] hover:bg-[#edf8ff]">
                  <Icon name="download" size={13} /> Download Label
                </button>
                <button type="button" onClick={() => handlePrintSingleLabel(viewingOrder)} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#008dd2] px-3 text-[11px] font-semibold text-white hover:bg-[#007dbb]">
                  <Icon name="printer" size={13} /> Print Label
                </button>
              </div>
              <button type="button" onClick={() => setViewingOrder(null)} className="h-8 rounded-lg border border-slate-200 bg-white px-4 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllOrders;