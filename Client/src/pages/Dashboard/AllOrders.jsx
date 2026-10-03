import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../../services/api";

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
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
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

    default:
      return null;
  }
};

// ======================================================
// USER ID
// ======================================================

const getUserId = () => {
  try {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    const user = JSON.parse(storedUser);

    return user?.id || user?.user_id || user?.userId || null;
  } catch (error) {
    return null;
  }
};

// ======================================================
// BASIC HELPERS
// ======================================================

const safeString = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

// ======================================================
// CUSTOMER
// ======================================================

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

// ======================================================
// ORDER / AWB
// ======================================================

const getAWB = (order) => {
  return order?.awb || order?.waybill || order?.awb_number || "—";
};

const getOrderId = (order) => {
  return order?.order_id || order?.id || "—";
};

// ======================================================
// SHIPMENT
// ======================================================

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

  return "";
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

// ======================================================
// ROUTE
// ======================================================

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

// ======================================================
// WEIGHT
// ======================================================

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

// ======================================================
// DATE
// ======================================================

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
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ======================================================
// STATUS
// ======================================================

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
  switch (status) {
    case "PROCESSING":
      return "Processing";

    case "MANIFESTED":
      return "Manifested";

    case "IN TRANSIT":
    case "IN_TRANSIT":
      return "In Transit";

    case "DELIVERED":
      return "Delivered";

    case "CANCELLED":
    case "CANCELED":
      return "Cancelled";

    case "PENDING":
      return "Pending";

    default:
      return (
        status?.toLowerCase()?.replace(/\b\w/g, (char) => char.toUpperCase()) ||
        "Processing"
      );
  }
};

// ======================================================
// STATUS BADGE
// ======================================================

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
      <span className="h-1 w-1 rounded-full bg-current" />
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
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");

  const [selectedIds, setSelectedIds] = useState([]);
  const [viewingOrder, setViewingOrder] = useState(null);

  // ====================================================
  // FETCH ALL ORDERS
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
          page: currentPage,
          limit: 50,
          search: search.trim(),
        },
      });

      const data = response?.data;

      setTotalPages(Number(data?.pagination?.totalPages) || 1);
      setTotalOrderCount(Number(data?.pagination?.totalOrders) || 0);

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

      setOrders(uniqueOrders);
      setSelectedIds([]);
    } catch (error) {
      setOrders([]);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load all orders",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, [currentPage, search]);

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
    const query = search.trim().toLowerCase();

    const status = getStatus(order);
    const service = getServiceType(order);
    const payment = getPaymentType(order);

    const searchable = [
      getCustomerName(order),
      getMobile(order),
      getAWB(order),
      getOrderId(order),
      getShipmentName(order),
      getPickupCity(order),
      getDeliveryCity(order),
      status,
      service,
      payment,
    ]
      .join(" ")
      .toLowerCase();

    const searchMatch = !query || searchable.includes(query);
    const statusMatch = statusFilter === "ALL" || status === statusFilter;
    const serviceMatch = serviceFilter === "ALL" || service === serviceFilter;
    const paymentMatch = paymentFilter === "ALL" || payment === paymentFilter;

    return searchMatch && statusMatch && serviceMatch && paymentMatch;
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

  const handleView = (order) => {
    setViewingOrder(order);
  };

  const buildLabel = (order) => {
    const service = getServiceType(order);

    const address = [
      order?.address_line1,
      order?.address_line2,
      order?.city,
      order?.state,
    ]
      .filter(Boolean)
      .join(", ");

    return `
      <div
        style="
          width:420px;
          margin:0 auto 24px;
          padding:24px;
          border:1px solid #dbe3ef;
          border-radius:12px;
          font-family:Arial,sans-serif;
          color:#172033;
          page-break-after:always;
        "
      >
        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            border-bottom:1px solid #e8edf4;
            padding-bottom:14px;
            margin-bottom:18px;
          "
        >
          <div>
            <div
              style="
                font-size:20px;
                font-weight:700;
                color:${PRIMARY};
              "
            >
              ShipDrop
            </div>

            <div
              style="
                font-size:11px;
                color:#718096;
                margin-top:4px;
              "
            >
              Shipping Label
            </div>
          </div>

          <div
            style="
              font-size:12px;
              font-weight:700;
            "
          >
            AWB ${getAWB(order)}
          </div>
        </div>

        <div
          style="
            font-size:10px;
            color:#718096;
            margin-bottom:5px;
          "
        >
          CONSIGNEE
        </div>

        <div
          style="
            font-size:16px;
            font-weight:700;
          "
        >
          ${getCustomerName(order)}
        </div>

        <div
          style="
            font-size:12px;
            margin-top:5px;
            margin-bottom:16px;
          "
        >
          ${getMobile(order)}
        </div>

        <div
          style="
            background:#f7f9fc;
            border-radius:8px;
            padding:12px;
            margin-bottom:16px;
          "
        >
          <div
            style="
              font-size:10px;
              color:#718096;
              margin-bottom:5px;
            "
          >
            DELIVERY ADDRESS
          </div>

          <div
            style="
              font-size:12px;
              line-height:1.5;
            "
          >
            ${address || "—"}
            <br />
            ${getDeliveryPincode(order)}
          </div>
        </div>

        <div
          style="
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:10px;
          "
        >
          <div
            style="
              border:1px solid #e4eaf2;
              border-radius:8px;
              padding:10px;
            "
          >
            <div
              style="
                font-size:10px;
                color:#718096;
              "
            >
              SERVICE
            </div>

            <div
              style="
                font-size:12px;
                font-weight:700;
                margin-top:4px;
              "
            >
              ${service === "AIR" ? "By Air" : "By Road"}
            </div>
          </div>

          <div
            style="
              border:1px solid #e4eaf2;
              border-radius:8px;
              padding:10px;
            "
          >
            <div
              style="
                font-size:10px;
                color:#718096;
              "
            >
              WEIGHT
            </div>

            <div
              style="
                font-size:12px;
                font-weight:700;
                margin-top:4px;
              "
            >
              ${getWeight(order).toFixed(2)} Kg
            </div>
          </div>
        </div>

        <div
          style="
            margin-top:18px;
            padding-top:12px;
            border-top:1px dashed #cbd5e1;
            font-size:10px;
            color:#718096;
            text-align:center;
          "
        >
          ShipDrop • Handle with care
        </div>
      </div>
    `;
  };

  const handlePrintLabels = () => {
    if (selectedOrders.length === 0) {
      toast.error("Please select at least one order");
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      toast.error("Please allow pop-ups to print labels");
      return;
    }

    const html = selectedOrders.map(buildLabel).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ShipDrop Shipping Labels</title>
        </head>
        <body style="margin:30px; background:#fff;">
          ${html}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 300);
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

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `shipdrop-all-orders-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintLabels}
                disabled={selectedOrders.length === 0}
                className="inline-flex h-9 flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl bg-[#8fcce8] px-3.5 text-xs font-semibold text-white transition hover:bg-[#7fc2e1] active:scale-95 disabled:cursor-not-allowed disabled:opacity-55"
              >
                <Icon name="printer" size={15} />
                <span>Print Labels ({selectedOrders.length})</span>
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
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
              />
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
                <option value="ROAD">Road</option>
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
            1. MOBILE VIEW: APP-STYLE CARD TILES
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

                    <div className="flex items-center gap-1.5">
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

                    <div className="flex items-center justify-between font-mono text-[11px] text-slate-600 bg-slate-50/70 px-2 py-1 rounded-lg">
                      <span className="truncate">AWB: {awb}</span>
                      {awb && awb !== "—" && (
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
                          className="text-[#008dd2] font-semibold flex items-center gap-1"
                        >
                          <Icon name="copy" size={12} />
                          Copy
                        </button>
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
                      onClick={() => {
                        const printWindow = window.open(
                          "",
                          "_blank",
                          "width=900,height=700",
                        );
                        if (!printWindow) {
                          toast.error("Please allow pop-ups to print labels");
                          return;
                        }
                        printWindow.document.write(`
                          <!DOCTYPE html>
                          <html>
                            <head><title>Shipping Label</title></head>
                            <body style="margin:30px; background:#fff;">${buildLabel(
                              order,
                            )}</body>
                          </html>
                        `);
                        printWindow.document.close();
                        printWindow.focus();
                        setTimeout(() => printWindow.print(), 300);
                      }}
                      className="flex h-8 items-center gap-1 rounded-lg bg-[#008dd2] px-3 text-xs font-bold text-white shadow-xs active:scale-95"
                    >
                      <Icon name="printer" size={13} />
                      Label
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
          <div className="max-h-[calc(100vh-180px)] overflow-auto">
            <table className="w-full min-w-[1120px] border-collapse">
              <thead className="sticky top-0 z-20 bg-white">
                <tr className="border-b border-slate-200 bg-white">
                  <th className="sticky top-0 z-20 w-[52px] bg-white px-4 py-3.5 text-left">
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

                  <th className="sticky top-0 z-20 w-[190px] bg-white px-3 py-3.5 text-left text-[12px] font-medium text-slate-700">
                    Customer
                  </th>

                  <th className="sticky top-0 z-20 w-[175px] bg-white px-3 py-3.5 text-left text-[12px] font-medium text-slate-700">
                    Shipment
                  </th>

                  <th className="sticky top-0 z-20 w-[165px] bg-white px-3 py-3.5 text-left text-[12px] font-medium text-slate-700">
                    Route
                  </th>

                  <th className="sticky top-0 z-20 w-[145px] bg-white px-3 py-3.5 text-left text-[12px] font-medium text-slate-700">
                    Payment
                  </th>

                  <th className="sticky top-0 z-20 w-[125px] bg-white px-3 py-3.5 text-left text-[12px] font-medium text-slate-700">
                    Weight
                  </th>

                  <th className="sticky top-0 z-20 w-[155px] bg-white px-3 py-3.5 text-left text-[12px] font-medium text-slate-700">
                    Created
                  </th>

                  <th className="sticky top-0 z-20 w-[105px] bg-white px-3 py-3.5 text-left text-[12px] font-medium text-slate-700">
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
                        <td className="px-4 py-3">
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

                        <td className="px-3 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-slate-800">
                              {getCustomerName(order)}
                            </p>

                            {getMobile(order) && (
                              <p className="mt-0.5 text-[11px] text-slate-400">
                                {getMobile(order)}
                              </p>
                            )}

                            <div className="mt-1.5">
                              <StatusBadge status={status} />
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <div className="min-w-0">
                            {status !== "PROCESSING" && (
                              <>
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <p
                                    onDoubleClick={() => {
                                      if (!awb || awb === "—") return;
                                      window.dispatchEvent(
                                        new CustomEvent("shipdrop:openTracking", {
                                          detail: String(awb),
                                        }),
                                      );
                                    }}
                                    title="Double click to track"
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

                                <p className="mt-0.5 text-[10px] text-slate-400">
                                  Pickup ID:{" "}
                                  {order?.pickup_id || order?.pickupId || ""}
                                </p>
                              </>
                            )}

                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {getShipmentName(order)} -{" "}
                              {service === "AIR" ? "Air" : "Road"}
                            </p>
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <div>
                            <p className="text-[12px] font-medium text-slate-700">
                              {getPickupCity(order)}
                              {getPickupPincode(order) && (
                                <span className="text-[10px] text-slate-400">
                                  {" "}
                                  ({getPickupPincode(order)})
                                </span>
                              )}
                            </p>

                            <p className="my-0.5 text-[10px] text-slate-300">
                              ↓
                            </p>

                            <p className="text-[12px] font-medium text-slate-700">
                              {getDeliveryCity(order)}
                              {getDeliveryPincode(order) && (
                                <span className="text-[10px] text-slate-400">
                                  {" "}
                                  ({getDeliveryPincode(order)})
                                </span>
                              )}
                            </p>

                            <p className="mt-1 text-[9px] text-slate-400">
                              {getPickupPincode(order) || "—"} →{" "}
                              {getDeliveryPincode(order) || "—"}
                            </p>
                          </div>
                        </td>

                        <td className="px-3 py-3">
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

                        <td className="px-3 py-3">
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

                        <td className="px-3 py-3">
                          <p className="text-[12px] font-medium text-slate-700">
                            #{getOrderId(order)}
                          </p>

                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {status === "MANIFESTED"
                              ? "Manifested: "
                              : "Created: "}
                            {formatDate(getCreatedAt(order))}
                          </p>

                          <p className="text-[10px] text-slate-400">
                            {formatTime(getCreatedAt(order))}
                          </p>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const printWindow = window.open(
                                  "",
                                  "_blank",
                                  "width=900,height=700",
                                );

                                if (!printWindow) {
                                  toast.error(
                                    "Please allow pop-ups to print labels",
                                  );
                                  return;
                                }

                                printWindow.document.write(`
                                  <!DOCTYPE html>
                                  <html>
                                    <head><title>ShipDrop Shipping Label</title></head>
                                    <body style="margin:30px; background:#fff;">
                                      ${buildLabel(order)}
                                    </body>
                                  </html>
                                `);

                                printWindow.document.close();
                                printWindow.focus();
                                setTimeout(() => printWindow.print(), 300);
                              }}
                              title="Print Shipping Label"
                              className="flex h-8 w-8 items-center justify-center rounded-md border border-[#b9dff0] bg-white text-[#008dd2] transition hover:bg-[#edf8ff]"
                            >
                              <Icon name="printer" size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDuplicate(order)}
                              title="Duplicate Order"
                              className="flex h-8 w-8 items-center justify-center rounded-md border border-violet-200 bg-white text-violet-500 transition hover:border-violet-300 hover:bg-violet-50"
                            >
                              <Icon name="copy" size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleView(order)}
                              title="View Order"
                              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-[#008dd2] hover:bg-[#edf8ff] hover:text-[#008dd2]"
                            >
                              <Icon name="eye" size={15} />
                            </button>
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
          VIEW ORDER MODAL (RESPONSIVE)
      ==================================================== */}
      {viewingOrder && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4 backdrop-blur-[2px]"
          onClick={() => setViewingOrder(null)}
        >
          <div
            className="w-full max-w-[620px] max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Order Details
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Order #{getOrderId(viewingOrder)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewingOrder(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <Icon name="x" size={17} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Customer
                  </p>
                  <p className="mt-1 text-[13px] font-semibold text-slate-800">
                    {getCustomerName(viewingOrder)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {getMobile(viewingOrder)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    AWB
                  </p>
                  <p className="mt-1 text-[13px] font-semibold text-slate-800 font-mono">
                    {getAWB(viewingOrder)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Shipment
                  </p>
                  <p className="mt-1 text-[13px] font-semibold text-slate-800">
                    {getShipmentName(viewingOrder)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {getServiceType(viewingOrder) === "AIR"
                      ? "By Air"
                      : "By Road"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Payment
                  </p>
                  <p className="mt-1 text-[13px] font-semibold text-slate-800">
                    {getPaymentType(viewingOrder)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    ₹{getAmount(viewingOrder).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* ADDRESS */}
              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Delivery Address
                </p>
                <p className="mt-1 text-[13px] font-medium leading-6 text-slate-700">
                  {[
                    viewingOrder?.address_line1,
                    viewingOrder?.address_line2,
                    viewingOrder?.city,
                    viewingOrder?.state,
                  ]
                    .filter(Boolean)
                    .join(", ") || "—"}
                  {viewingOrder?.pincode ? ` - ${viewingOrder.pincode}` : ""}
                </p>
              </div>

              {/* ROUTE */}
              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Route
                </p>
                <div className="mt-2 flex items-center gap-2.5">
                  <div className="rounded-lg bg-[#edf8ff] px-2.5 py-1.5 text-xs font-semibold text-[#008dd2]">
                    {getPickupCity(viewingOrder)}
                  </div>
                  <span className="text-slate-300 font-bold">→</span>
                  <div className="rounded-lg bg-[#f0ecff] px-2.5 py-1.5 text-xs font-semibold text-[#7052ff]">
                    {getDeliveryCity(viewingOrder)}
                  </div>
                </div>
              </div>

              {/* WEIGHT & STATUS */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Weight
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {getWeight(viewingOrder).toFixed(2)} Kg
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Status
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={getStatus(viewingOrder)} />
                  </div>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-[#fafbfc] px-4 sm:px-5 py-3">
              <button
                type="button"
                onClick={() => setViewingOrder(null)}
                className="h-9.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  const order = viewingOrder;
                  setViewingOrder(null);

                  const printWindow = window.open(
                    "",
                    "_blank",
                    "width=900,height=700",
                  );
                  if (!printWindow) {
                    toast.error("Please allow pop-ups to print labels");
                    return;
                  }
                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                      <head><title>ShipDrop Shipping Label</title></head>
                      <body style="margin:30px; background:#fff;">
                        ${buildLabel(order)}
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  printWindow.focus();
                  setTimeout(() => printWindow.print(), 300);
                }}
                className="inline-flex h-9.5 items-center gap-1.5 rounded-xl bg-[#008dd2] px-4 text-xs font-bold text-white shadow-xs hover:bg-[#007dbb] active:scale-95"
              >
                <Icon name="printer" size={14} />
                Print Label
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllOrders;