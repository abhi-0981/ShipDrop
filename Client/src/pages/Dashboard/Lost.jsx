import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import OrderDetailsModal from "../../components/Common/OrderDetailsModal";
import { notifyOrderChange, subscribeToOrderUpdates } from "../../services/orderEvents";
import { printShippingLabels, downloadShippingLabels } from "../../services/shippingLabelService";
import { CardSkeleton } from "../../components/Common/TableSkeleton";
import OrderStatusNavTabs from "../../components/Common/OrderStatusNavTabs";

// ======================================================
// COLORS
// ======================================================

const PRIMARY = "#008dd2";
const ROSE = "#e11d48";

// ======================================================
// ICON
// ======================================================

const Icon = ({
  name,
  size = 17,
  strokeWidth = 1.8,
}) => {
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

    case "download":
      return (
        <svg {...common}>
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
      );

    case "copy":
      return (
        <svg {...common}>
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
        </svg>
      );

    case "pin":
      return (
        <svg {...common}>
          <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );

    case "eye":
      return (
        <svg {...common}>
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "alert-triangle":
      return (
        <svg {...common}>
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );

    default:
      return null;
  }
};

// ======================================================
// STORAGE USER ID
// ======================================================

const getUserId = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user?.id || user?.user_id || user?.userId || null;
  } catch {
    return null;
  }
};

// ======================================================
// STRING HELPER
// ======================================================

const safeString = (value) => {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
};

// ======================================================
// FIELD PARSERS
// ======================================================

const getOrderId = (order) => {
  return (
    order?.order_id ||
    order?.id ||
    "—"
  );
};

const getAWB = (order) => {
  return (
    order?.awb ||
    order?.waybill ||
    "—"
  );
};

const getCustomerName = (order) => {
  return (
    order?.consignee_name ||
    order?.customer_name ||
    order?.name ||
    "—"
  );
};

const getMobile = (order) => {
  return (
    order?.mobile ||
    order?.phone ||
    order?.contact ||
    "—"
  );
};

const getCustomerAddress = (order) => {
  const parts = [
    order?.address_line1,
    order?.address_line2,
    order?.landmark,
    order?.city,
    order?.state,
    order?.pincode,
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(", ");
  }

  return (
    order?.address ||
    order?.customer_address ||
    "—"
  );
};

const getShipmentName = (order) => {
  return (
    order?.product_name ||
    order?.item_name ||
    order?.shipment_name ||
    order?.carrier ||
    "—"
  );
};

const getCarrierName = (order) => {
  return (
    order?.carrier ||
    "Delhivery"
  );
};

const getServiceType = (order) => {
  const value =
    order?.shipping_mode ||
    order?.service_type ||
    order?.service ||
    order?.mode ||
    "Surface";

  const normalized = safeString(value)
    .trim()
    .toUpperCase();

  if (normalized === "AIR") {
    return "AIR";
  }

  return "SURFACE";
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

  return normalized || "PREPAID";
};

const getAmount = (order) => {
  const amount = Number(
    order?.shipping_charge ??
      order?.shipping_charges ??
      order?.charge ??
      order?.shippingCharge ??
      order?.final_rate ??
      order?.manifest_shipping_charge ??
      order?.total_amount ??
      order?.total ??
      order?.amount ??
      order?.price ??
      0
  );
  return Number.isFinite(amount) ? amount : 0;
};

const getDeliveryCity = (order) => {
  return (
    order?.city ||
    order?.delivery_city ||
    order?.destination_city ||
    order?.to_city ||
    "—"
  );
};

const getDeliveryPincode = (order) => {
  return (
    order?.pincode ||
    order?.delivery_pincode ||
    order?.destination_pincode ||
    order?.to_pincode ||
    ""
  );
};

const getWeight = (order) => {
  const weight = Number(
    order?.weight ??
      order?.package_weight ??
      order?.order_weight ??
      0
  );
  return Number.isFinite(weight) ? weight : 0;
};

const getVolumetricWeight = (order) => {
  const value = Number(
    order?.volumetric_weight ??
      order?.vol_weight ??
      order?.volumetricWeight ??
      0
  );
  return Number.isFinite(value) ? value : 0;
};

const getPackageCount = (order) => {
  if (Array.isArray(order?.packages)) {
    return order.packages.reduce(
      (total, pkg) => total + (Number(pkg?.package_count ?? pkg?.count ?? 1) || 1),
      0
    );
  }

  return (
    Number(
      order?.package_count ??
        order?.packages_count ??
        order?.boxes ??
        1
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

// ======================================================
// STATUS BADGE
// ======================================================

const StatusBadge = ({ status }) => {
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-rose-50 text-rose-700 border border-rose-200/80">
      LOST
    </span>
  );
};

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function Lost() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrderCount, setTotalOrderCount] = useState(0);
  const [limit, setLimit] = useState(50);
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [partyFilter, setPartyFilter] = useState("ALL");
  const [partyIdentities, setPartyIdentities] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  // Load party identities
  useEffect(() => {
    let isMounted = true;
    const loadPartyIdentities = async () => {
      try {
        const response = await api.get("/party-identities");
        if (isMounted && response?.data?.success) {
          setPartyIdentities(response.data.partyIdentities || []);
        }
      } catch (error) {
        console.warn("Unable to load party identities in Lost:", error);
      }
    };
    loadPartyIdentities();
    return () => {
      isMounted = false;
    };
  }, []);

  // ====================================================
  // FETCH LOST ORDERS
  // ====================================================

  const fetchAllOrders = async () => {
    const userId = getUserId();

    if (!userId) {
      setLoading(false);
      toast.error("User ID is required");
      return;
    }

    try {
      setLoading(true);

      const response = await api.get("/orders/all", {
        params: {
          user_id: userId,
          status: "LOST",
          page: currentPage,
          limit,
          search: debouncedSearch.trim(),
          include_tracking: false,
        },
      });

      const data = response?.data;

      if (!data?.success) {
        throw new Error(data?.message || "Unable to fetch lost orders");
      }

      const list = Array.isArray(data?.orders) ? data.orders : [];

      setTotalPages(Number(data?.pagination?.totalPages) || 1);
      setTotalOrderCount(Number(data?.pagination?.totalOrders) || list.length);
      setOrders(list);
      setSelectedIds([]);
    } catch (error) {
      console.error("Get lost orders error:", error);
      setOrders([]);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load lost orders"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, [currentPage, debouncedSearch, limit]);

  useEffect(() => {
    const unsubscribe = subscribeToOrderUpdates(() => {
      fetchAllOrders();
    });

    return () => {
      unsubscribe();
    };
  }, [currentPage, debouncedSearch, limit]);

  // ====================================================
  // FILTERED ORDERS
  // ====================================================

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const service = getServiceType(order);
      const payment = getPaymentType(order);
      const partyId = String(order?.party_identity_id || "");

      const searchable = [
        getCustomerName(order),
        getMobile(order),
        getAWB(order),
        getOrderId(order),
        getShipmentName(order),
        getDeliveryCity(order),
        order?.party_name,
        order?.party_reference_name,
        service,
        payment,
      ]
        .join(" ")
        .toLowerCase();

      const searchMatch = !query || searchable.includes(query);

      const serviceMatch =
        serviceFilter === "ALL" || service === serviceFilter;

      const paymentMatch =
        paymentFilter === "ALL" || payment === paymentFilter;

      const partyMatch =
        partyFilter === "ALL" || partyId === partyFilter;

      return searchMatch && serviceMatch && paymentMatch && partyMatch;
    });
  }, [orders, search, serviceFilter, paymentFilter, partyFilter]);

  // ====================================================
  // SELECTION HELPERS
  // ====================================================

  const getOrderKey = (order) => String(order?.id ?? order?.order_id);

  const selectedOrders = useMemo(
    () => orders.filter((order) => selectedIds.includes(getOrderKey(order))),
    [orders, selectedIds]
  );

  const allVisibleSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((order) => selectedIds.includes(getOrderKey(order)));

  const handleSelectAll = () => {
    if (allVisibleSelected) {
      const visibleIds = filteredOrders.map(getOrderKey);
      setSelectedIds((previous) =>
        previous.filter((id) => !visibleIds.includes(id))
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

  // ====================================================
  // ACTION HANDLERS
  // ====================================================

  const handlePrintSingleLabel = async (order) => {
    if (!order) {
      toast.error("Unable to print this label");
      return;
    }
    await printShippingLabels([order], "ParcelDrop Shipping Label");
  };

  const handleDownloadSingleLabel = async (order) => {
    if (!order) {
      toast.error("Unable to download this label");
      return;
    }
    await downloadShippingLabels([order]);
  };

  const handlePrintSelected = async () => {
    if (selectedOrders.length === 0) {
      toast.error("Select at least one order to print");
      return;
    }
    await printShippingLabels(selectedOrders, "ParcelDrop Shipping Labels");
  };

  const handleDownloadSelected = async () => {
    if (selectedOrders.length === 0) {
      toast.error("Select at least one order to download");
      return;
    }
    await downloadShippingLabels(selectedOrders);
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
      console.error("Unable to load full order details:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCopyAWB = async (awb) => {
    if (!awb || awb === "—") return;
    try {
      await navigator.clipboard.writeText(String(awb));
      toast.success("AWB copied");
    } catch {
      toast.error("Unable to copy AWB");
    }
  };

  // Export to CSV
  const handleExport = () => {
    const list = selectedOrders.length > 0 ? selectedOrders : filteredOrders;
    if (list.length === 0) {
      toast.error("No orders to export");
      return;
    }

    const headers = [
      "Order ID",
      "AWB",
      "Customer Name",
      "Mobile",
      "Address",
      "City",
      "Pincode",
      "Carrier",
      "Shipping Mode",
      "Payment Type",
      "Amount",
      "Weight (kg)",
      "Status",
      "Created At",
    ];

    const rows = list.map((o) => [
      `"${getOrderId(o)}"`,
      `"${getAWB(o)}"`,
      `"${getCustomerName(o).replace(/"/g, '""')}"`,
      `"${getMobile(o)}"`,
      `"${getCustomerAddress(o).replace(/"/g, '""')}"`,
      `"${getDeliveryCity(o)}"`,
      `"${getDeliveryPincode(o)}"`,
      `"${getCarrierName(o)}"`,
      `"${getServiceType(o)}"`,
      `"${getPaymentType(o)}"`,
      getAmount(o).toFixed(2),
      getWeight(o).toFixed(2),
      `"LOST"`,
      `"${formatDate(getCreatedAt(o))} ${formatTime(getCreatedAt(o))}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lost-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="min-h-screen bg-[#f6f8fb] dark:bg-[#090b10] p-3 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
      {/* ==================================================
          PAGE HEADER
      ================================================== */}
      <div className="rounded-2xl border border-slate-200 bg-white px-4 sm:px-5 py-3.5 sm:py-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Icon name="alert-triangle" size={20} />
            </div>

            <div>
              <h1 className="text-base sm:text-[17px] font-semibold tracking-[-0.2px] text-slate-900">
                Lost Orders
              </h1>
              <p className="mt-0.5 text-xs text-slate-400">
                {totalOrderCount} {totalOrderCount === 1 ? "shipment" : "shipments"}{" "}
                marked as lost in transit
              </p>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrintSelected}
              disabled={selectedOrders.length === 0}
              className="inline-flex h-9 flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 shadow-xs"
            >
              <Icon name="printer" size={14} />
              <span>Print Label {selectedOrders.length > 0 ? `(${selectedOrders.length})` : ""}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSelected}
              disabled={selectedOrders.length === 0}
              className="inline-flex h-9 flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 shadow-xs"
            >
              <Icon name="download" size={14} />
              <span>Download {selectedOrders.length > 0 ? `(${selectedOrders.length})` : ""}</span>
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={orders.length === 0}
              className="inline-flex h-9 flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl bg-[#10b981] px-3.5 text-xs font-semibold text-white transition hover:bg-[#059669] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 shadow-xs"
            >
              <Icon name="download" size={14} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================
          FILTER BAR
      ================================================== */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)] space-y-2.5">
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
              placeholder="Search by AWB, Order ID, Customer, Mobile..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
            />
          </div>

          {/* FILTER DROPDOWNS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 sm:flex sm:items-center gap-1.5 sm:gap-2">
            <select
              value={partyFilter}
              onChange={(e) => setPartyFilter(e.target.value)}
              className="h-10 w-full sm:min-w-[130px] max-w-[180px] rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-600 outline-none focus:border-[#008dd2] truncate"
              title="Filter by Party Reference Name"
            >
              <option value="ALL">All Party</option>
              {partyIdentities.map((party) => (
                <option key={party.id} value={party.id}>
                  {party.reference_name || party.name}
                </option>
              ))}
            </select>

            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="h-10 w-full sm:min-w-[110px] rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-600 outline-none focus:border-[#008dd2]"
            >
              <option value="ALL">All Service</option>
              <option value="SURFACE">Surface</option>
              <option value="AIR">Air</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="h-10 w-full sm:min-w-[105px] rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-600 outline-none focus:border-[#008dd2]"
            >
              <option value="ALL">All Pay</option>
              <option value="PREPAID">Prepaid</option>
              <option value="COD">COD</option>
            </select>

            <button
              type="button"
              onClick={fetchAllOrders}
              title="Refresh"
              className="flex h-10 w-full sm:w-10 items-center justify-center gap-1 sm:gap-0 rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 active:scale-95"
            >
              <Icon name="refresh" size={15} />
              <span className="sm:hidden text-xs font-semibold">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* ORDER STATUS TABS */}
      <OrderStatusNavTabs />

      {/* ==================================================
          TABLE / LIST VIEW
      ================================================== */}
      {loading ? (
        <CardSkeleton count={4} />
      ) : orders.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 mb-3">
            <Icon name="alert-triangle" size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-700">
            No lost orders found
          </h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm">
            {debouncedSearch || serviceFilter !== "ALL" || paymentFilter !== "ALL" || partyFilter !== "ALL"
              ? "Try adjusting your search or filters."
              : "Great news! There are currently no shipments recorded as lost in transit."}
          </p>
        </div>
      ) : (
        <>
          {/* ==================================================
              1. DESKTOP / TABLET STRUCTURED TABLE
          ================================================== */}
          <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div
              className="orders-scrollbar max-h-[calc(100vh-180px)] overflow-y-auto overflow-x-auto"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#cbd5e1 transparent",
              }}
            >
              <table className="w-full table-fixed min-w-[980px] border-collapse">
                <thead className="sticky top-0 z-20 bg-white">
                  <tr className="border-b border-slate-200 bg-white">
                    <th className="sticky top-0 z-20 w-[3%] bg-white px-2 py-3 text-left">
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className={`flex h-[17px] w-[17px] items-center justify-center rounded-[4px] border transition ${
                          allVisibleSelected
                            ? "border-[#008dd2] bg-[#008dd2] text-white"
                            : "border-slate-300 bg-white text-transparent"
                        }`}
                      >
                        <Icon name="check" size={11} strokeWidth={2.5} />
                      </button>
                    </th>

                    <th className="sticky top-0 z-20 w-[7%] bg-white px-1.5 py-3 text-left text-[12px] font-bold text-slate-800">
                      Party
                    </th>

                    <th className="sticky top-0 z-20 w-[16%] bg-white px-2 py-3 text-left text-[12px] font-bold text-slate-800">
                      Customer
                    </th>

                    <th className="sticky top-0 z-20 w-[16%] bg-white px-2 py-3 text-left text-[12px] font-bold text-slate-800">
                      Shipment
                    </th>

                    <th className="sticky top-0 z-20 w-[14%] bg-white px-2 py-3 text-left text-[12px] font-bold text-slate-800">
                      Destination
                    </th>

                    <th className="sticky top-0 z-20 w-[9%] bg-white px-2 py-3 text-left text-[12px] font-bold text-slate-800">
                      Payment
                    </th>

                    <th className="sticky top-0 z-20 w-[8%] bg-white px-2 py-3 text-left text-[12px] font-bold text-slate-800">
                      Weight
                    </th>

                    <th className="sticky top-0 z-20 w-[9%] bg-white px-2 py-3 text-left text-[12px] font-bold text-slate-800">
                      Status
                    </th>

                    <th className="sticky top-0 z-20 w-[9%] bg-white px-2 py-3 text-left text-[12px] font-bold text-slate-800">
                      Created
                    </th>

                    <th className="sticky top-0 z-20 w-[9%] bg-white px-2 py-3 text-left text-[12px] font-bold text-slate-800">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => {
                    const key = getOrderKey(order);
                    const isSelected = selectedIds.includes(key);
                    const awb = getAWB(order);
                    const payment = getPaymentType(order);
                    const amount = getAmount(order);
                    const weight = getWeight(order);
                    const volWeight = getVolumetricWeight(order);
                    const packages = getPackageCount(order);
                    const createdAt = getCreatedAt(order);

                    return (
                      <tr
                        key={key}
                        className={`border-b border-slate-100 transition last:border-b-0 ${
                          isSelected ? "bg-[#f8fcff]" : "bg-white"
                        } hover:bg-slate-50`}
                      >
                        {/* CHECKBOX */}
                        <td className="px-2 py-2.5">
                          <button
                            type="button"
                            onClick={() => handleSelect(order)}
                            className={`flex h-[17px] w-[17px] items-center justify-center rounded-[4px] border transition ${
                              isSelected
                                ? "border-[#008dd2] bg-[#008dd2] text-white"
                                : "border-slate-300 bg-white text-transparent"
                            }`}
                          >
                            <Icon name="check" size={11} strokeWidth={2.5} />
                          </button>
                        </td>

                        {/* PARTY */}
                        <td className="px-1.5 py-2.5 break-words">
                          <div className="min-w-0">
                            {order.party_reference_name || order.party_name ? (
                              <span
                                className="inline-block max-w-full truncate rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700"
                                title={
                                  order.party_reference_name && order.party_name
                                    ? `${order.party_reference_name} — ${order.party_name}`
                                    : order.party_reference_name || order.party_name
                                }
                              >
                                {order.party_reference_name || order.party_name}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </div>
                        </td>

                        {/* CUSTOMER */}
                        <td className="px-2 py-2.5">
                          <div className="min-w-0">
                            <p
                              className="truncate text-[12px] font-semibold text-slate-800 cursor-pointer hover:text-[#008dd2]"
                              title={getCustomerName(order)}
                              onClick={() => handleView(order)}
                            >
                              {getCustomerName(order)}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-600 font-medium truncate">
                              {getMobile(order)}
                            </p>
                            <p
                              className="mt-0.5 text-[10.5px] text-slate-400 truncate"
                              title={getCustomerAddress(order)}
                            >
                              {getCustomerAddress(order)}
                            </p>
                          </div>
                        </td>

                        {/* SHIPMENT */}
                        <td className="px-2 py-2.5">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p
                                className="font-mono text-[12px] font-bold text-slate-800 truncate"
                                title={awb}
                              >
                                {awb}
                              </p>

                              {awb && awb !== "—" && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyAWB(awb);
                                  }}
                                  title="Copy AWB"
                                  className="shrink-0 p-0.5 text-slate-500 hover:text-slate-800 transition"
                                >
                                  <Icon name="copy" size={13} />
                                </button>
                              )}
                            </div>

                            <p className="mt-0.5 text-[10.5px] text-slate-600 font-medium truncate">
                              {getCarrierName(order)}
                            </p>

                            <p className="mt-0.5 text-[10.5px] text-slate-600 font-medium truncate">
                              {order?.product_name ? `${order.product_name} - ` : ""}
                              {getServiceType(order)}
                            </p>
                          </div>
                        </td>

                        {/* DESTINATION */}
                        <td className="px-2 py-2.5">
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
                              className="shrink-0 text-[#008dd2]"
                            >
                              <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                              <circle cx="12" cy="10" r="2.5" />
                            </svg>

                            <p
                              className="truncate text-[11px] font-semibold text-slate-800"
                              title={`${getDeliveryCity(order)}${order?.state ? `, ${order.state}` : ""}${getDeliveryPincode(order) ? ` (${getDeliveryPincode(order)})` : ""}`}
                            >
                              {getDeliveryCity(order)}
                              {getDeliveryPincode(order) && (
                                <span className="ml-1 text-[10.5px] font-medium text-slate-500">
                                  ({getDeliveryPincode(order)})
                                </span>
                              )}
                            </p>
                          </div>
                        </td>

                        {/* PAYMENT */}
                        <td className="px-2 py-2.5 break-words">
                          <div>
                            <p
                              className={`text-[12px] font-bold ${
                                payment === "COD"
                                  ? "text-amber-600"
                                  : "text-[#008dd2]"
                              }`}
                            >
                              {payment}
                            </p>

                            <p className="mt-0.5 text-[11px] text-slate-500">
                              ₹{amount.toFixed(2)}
                            </p>
                          </div>
                        </td>

                        {/* WEIGHT */}
                        <td className="px-2 py-2.5">
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-slate-700">
                              Pkg: {packages}
                            </p>
                            <p className="mt-0.5 text-[10.5px] text-slate-500">
                              Wt: {weight.toFixed(2)} kg
                            </p>
                            {volWeight > 0 && (
                              <p className="mt-0.5 text-[10px] text-slate-400">
                                Vol: {volWeight.toFixed(2)} kg
                              </p>
                            )}
                          </div>
                        </td>

                        {/* STATUS */}
                        <td className="px-2 py-2.5">
                          <StatusBadge status="LOST" />
                        </td>

                        {/* CREATED */}
                        <td className="px-2 py-2.5">
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-slate-700">
                              #{getOrderId(order)}
                            </p>
                            <p className="mt-0.5 text-[10.5px] text-slate-500">
                              {formatDate(createdAt)}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {formatTime(createdAt)}
                            </p>
                          </div>
                        </td>

                        {/* ACTIONS */}
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleView(order)}
                              title="View Order Details"
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-[#008dd2] hover:bg-sky-50 hover:text-[#008dd2] active:scale-95 cursor-pointer shadow-2xs"
                            >
                              <Icon name="eye" size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handlePrintSingleLabel(order)}
                              title="Print Shipping Label"
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-[#008dd2] hover:bg-sky-50 hover:text-[#008dd2] active:scale-95 cursor-pointer shadow-2xs"
                            >
                              <Icon name="printer" size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownloadSingleLabel(order)}
                              title="Download Label"
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-[#008dd2] hover:bg-sky-50 hover:text-[#008dd2] active:scale-95 cursor-pointer shadow-2xs"
                            >
                              <Icon name="download" size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ==================================================
              2. MOBILE CARD TILES
          ================================================== */}
          <div className="space-y-3 sm:hidden">
            {filteredOrders.map((order) => {
              const key = getOrderKey(order);
              const isSelected = selectedIds.includes(key);
              const awb = getAWB(order);
              const payment = getPaymentType(order);
              const amount = getAmount(order);
              const weight = getWeight(order);
              const createdAt = getCreatedAt(order);

              return (
                <div
                  key={key}
                  className={`rounded-2xl border bg-white p-3.5 shadow-xs space-y-2.5 transition ${
                    isSelected
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
                          isSelected
                            ? "border-[#008dd2] bg-[#008dd2] text-white"
                            : "border-slate-300 bg-white text-transparent"
                        }`}
                      >
                        <Icon name="check" size={11} strokeWidth={2.5} />
                      </button>

                      <span className="font-mono text-xs font-bold text-slate-800">
                        #{getOrderId(order)}
                      </span>

                      <span className="rounded bg-sky-50 border border-sky-200 px-2 py-0.5 text-[11px] font-bold text-[#008dd2]">
                        {getCarrierName(order)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                          payment === "COD"
                            ? "border-amber-100 bg-amber-50 text-amber-600"
                            : "border-sky-100 bg-sky-50 text-[#008dd2]"
                        }`}
                      >
                        {payment}
                      </span>

                      <StatusBadge status="LOST" />
                    </div>
                  </div>

                  {/* CUSTOMER & DETAILS */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 truncate">
                        {getCustomerName(order)}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {getMobile(order)}
                      </span>
                    </div>

                    {(order.party_reference_name || order.party_name) && (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">Party:</span>
                        <span className="rounded bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700 border border-sky-100">
                          {order.party_reference_name || order.party_name}
                        </span>
                      </div>
                    )}

                    {/* AWB BAR */}
                    <div className="flex items-center justify-between font-mono text-[11px] text-slate-600 bg-slate-50/70 px-2 py-1.5 rounded-lg border border-slate-100">
                      <span className="truncate font-semibold select-none">
                        AWB: {awb}
                      </span>

                      {awb && awb !== "—" && (
                        <button
                          type="button"
                          onClick={() => handleCopyAWB(awb)}
                          className="text-slate-400 hover:text-slate-700 flex items-center p-0.5"
                          title="Copy AWB"
                        >
                          <Icon name="copy" size={12} />
                        </button>
                      )}
                    </div>

                    {/* DESTINATION */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-700 pt-0.5">
                      <Icon name="pin" size={13} />
                      <span className="text-slate-400 font-medium">Destination:</span>
                      <span className="font-semibold text-slate-800 truncate">
                        {getDeliveryCity(order)} ({getDeliveryPincode(order) || "—"})
                      </span>
                    </div>

                    {/* SPECS & CHARGE */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-50 pt-1.5">
                      <span>
                        {getServiceType(order)} • {weight.toFixed(2)} Kg
                      </span>
                      <span className="font-semibold text-slate-600">
                        Charge: ₹{amount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* CARD ACTIONS */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                    <span className="text-[10px] text-slate-400">
                      {formatDate(createdAt)} {formatTime(createdAt)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleView(order)}
                        className="flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Icon name="eye" size={12} />
                        <span>View</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePrintSingleLabel(order)}
                        className="flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Icon name="printer" size={12} />
                        <span>Print</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ==================================================
              PAGINATION
          ================================================== */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Showing {filteredOrders.length} of {totalOrderCount} orders</span>
              <span className="text-slate-300">•</span>
              <span>Page {currentPage} of {totalPages}</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600 outline-none focus:border-[#008dd2]"
              >
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="flex h-8 px-2.5 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="flex h-8 px-2.5 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* ==================================================
          ORDER DETAILS MODAL
      ================================================== */}
      {viewingOrder && (
        <OrderDetailsModal
          order={viewingOrder}
          onClose={() => setViewingOrder(null)}
          loading={detailLoading}
        />
      )}
    </div>
  );
}
