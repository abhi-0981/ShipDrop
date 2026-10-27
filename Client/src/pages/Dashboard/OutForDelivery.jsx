import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import OrderDetailsModal from "../../components/Common/OrderDetailsModal";
import { notifyOrderChange, subscribeToOrderUpdates } from "../../services/orderEvents";
import { printShippingLabels, downloadShippingLabels } from "../../services/shippingLabelService";
import { TableRowSkeleton } from "../../components/Common/TableSkeleton";
import OrderStatusNavTabs from "../../components/Common/OrderStatusNavTabs";

// ======================================================
// COLORS
// ======================================================

const PRIMARY = "#008dd2";
const PURPLE = "#7052ff";

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

    case "copy":
      return (
        <svg {...common}>
          <rect x="9" y="9" width="10" height="10" rx="2" />
          <path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        </svg>
      );

    case "pin":
      return (
        <svg {...common}>
          <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
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

    return (
      user?.id ||
      user?.user_id ||
      user?.userId ||
      null
    );
  } catch (error) {
    console.error("Unable to read logged-in user:", error);
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
  return (
    order?.awb ||
    order?.waybill ||
    order?.awb_number ||
    "—"
  );
};

const getOrderId = (order) => {
  return (
    order?.order_id ||
    order?.id ||
    "—"
  );
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
  return safeString(
    order?.service_type ||
      order?.service ||
      order?.mode ||
      "ROAD"
  )
    .trim()
    .toUpperCase();
};

// ======================================================
// PAYMENT
// ======================================================

const getPaymentType = (order) => {
  return safeString(
    order?.payment_type ||
      order?.payment ||
      order?.payment_mode ||
      "PREPAID"
  )
    .trim()
    .toUpperCase();
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
  return (
    order?.pincode ||
    order?.delivery_pincode ||
    order?.to_pincode ||
    ""
  );
};

// ======================================================
// WEIGHT
// ======================================================

const getWeight = (order) => {
  const directWeight = Number(
    order?.total_weight ??
      order?.weight ??
      order?.shipment_weight
  );

  if (
    Number.isFinite(directWeight) &&
    directWeight >= 0
  ) {
    return directWeight;
  }

  if (Array.isArray(order?.packages)) {
    return order.packages.reduce(
      (total, pkg) => {
        const weight =
          Number(pkg?.weight) || 0;

        const count =
          Number(
            pkg?.package_count ??
              pkg?.count ??
              1
          ) || 1;

        return total + weight * count;
      },
      0
    );
  }

  return 0;
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
      (total, pkg) => {
        return (
          total +
          (
            Number(
              pkg?.package_count ??
                pkg?.count ??
                1
            ) || 1
          )
        );
      },
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

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const formatTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

// ======================================================
// STATUS
// ======================================================

const getStatus = (order) => {
  return safeString(
    order?.tracking_status ||
      order?.status ||
      order?.order_status ||
      "PROCESSING"
  )
    .trim()
    .toUpperCase();
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
        status
          ?.toLowerCase()
          ?.replace(/\b\w/g, (char) =>
            char.toUpperCase()
          ) || "Processing"
      );
  }
};

// ======================================================
// STATUS BADGE
// ======================================================

const StatusBadge = ({ status }) => {
  let className =
    "bg-[#edf8ff] text-[#008dd2]";

  if (
    status === "CANCELLED" ||
    status === "CANCELED"
  ) {
    className =
      "bg-red-50 text-red-600";
  } else if (
    status === "DELIVERED"
  ) {
    className =
      "bg-emerald-50 text-emerald-600";
  } else if (
    status === "IN TRANSIT" ||
    status === "IN_TRANSIT"
  ) {
    className =
      "bg-violet-50 text-violet-600";
  } else if (
    status === "PENDING"
  ) {
    className =
      "bg-amber-50 text-amber-600";
  }

  return (
    <span
      className={`inline-flex items-center  rounded-full px-2 py-0.5 text-[9px] font-semibold ${className}`}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {getStatusLabel(status).toUpperCase()}
    </span>
  );
};

// ======================================================
// MAIN COMPONENT
// ======================================================

function OutForDelivery() {
  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [serviceFilter, setServiceFilter] =
    useState("ALL");

  const [paymentFilter, setPaymentFilter] =
    useState("ALL");

  const [selectedIds, setSelectedIds] =
    useState([]);

  const [viewingOrder, setViewingOrder] =
    useState(null);

  // ====================================================
  // FETCH ALL ORDERS
  // ====================================================

  const fetchAllOrders = async () => {
    const userId = getUserId();

    if (!userId) {
      setLoading(false);

      toast.error(
        "User ID is required"
      );

      return;
    }

    try {
      setLoading(true);

      const response = await api.get(
        "/orders/all",
        {
          params: {
            user_id: userId,
            status: "OUT_FOR_DELIVERY",
            include_tracking: false,
          },
        }
      );

      const data = response?.data;

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Unable to fetch all orders"
        );
      }

      const list = Array.isArray(
        data?.orders
      )
        ? data.orders
        : [];

      setOrders(list);
      setSelectedIds([]);
    } catch (error) {
      console.error(
        "Get out for delivery orders error:",
        error
      );

      setOrders([]);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load out for delivery orders"
      );
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    fetchAllOrders();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToOrderUpdates(() => {
      fetchAllOrders();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // ====================================================
  // FILTERED ORDERS
  // ====================================================

  const filteredOrders = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return orders.filter((order) => {
      const status =
        getStatus(order);

      const service =
        getServiceType(order);

      const payment =
        getPaymentType(order);

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

      const searchMatch =
        !query ||
        searchable.includes(query);

      const statusMatch =
        status === "OUT FOR DELIVERY";

      const serviceMatch =
        serviceFilter === "ALL" ||
        service === serviceFilter;

      const paymentMatch =
        paymentFilter === "ALL" ||
        payment === paymentFilter;

      return (
        searchMatch &&
        statusMatch &&
        serviceMatch &&
        paymentMatch
      );
    });
  }, [
    orders,
    search,
    statusFilter,
    serviceFilter,
    paymentFilter,
  ]);

  // ====================================================
  // ORDER KEY
  // ====================================================

  const getOrderKey = (order) =>
    String(
      order?.id ??
        order?.order_id
    );

  // ====================================================
  // SELECTED ORDERS
  // ====================================================

  const selectedOrders = useMemo(
    () =>
      orders.filter((order) =>
        selectedIds.includes(
          getOrderKey(order)
        )
      ),
    [
      orders,
      selectedIds,
    ]
  );

  const allVisibleSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((order) =>
      selectedIds.includes(
        getOrderKey(order)
      )
    );

  // ====================================================
  // SELECT ALL
  // ====================================================

  const handleSelectAll = () => {
    if (allVisibleSelected) {
      const visibleIds =
        filteredOrders.map(
          getOrderKey
        );

      setSelectedIds((previous) =>
        previous.filter(
          (id) =>
            !visibleIds.includes(id)
        )
      );

      return;
    }

    setSelectedIds((previous) => [
      ...new Set([
        ...previous,
        ...filteredOrders.map(
          getOrderKey
        ),
      ]),
    ]);
  };

  // ====================================================
  // SELECT SINGLE
  // ====================================================

  const handleSelect = (order) => {
    const id = getOrderKey(order);

    setSelectedIds((previous) => {
      if (previous.includes(id)) {
        return previous.filter(
          (item) => item !== id
        );
      }

      return [
        ...previous,
        id,
      ];
    });
  };

  // ====================================================
  // VIEW
  // ====================================================

  const handleView = async (order) => {
    setViewingOrder(order);
    const orderId = order?.id ?? order?.order_id;
    const userId = getUserId();
    if (!orderId || !userId) return;
    try {
      const response = await api.get(`/orders/${orderId}`, {
        params: { user_id: userId },
      });
      if (response?.data?.success && response?.data?.order) {
        setViewingOrder((current) =>
          current && String(current?.id ?? current?.order_id) === String(orderId)
            ? { ...current, ...response.data.order }
            : current,
        );
      }
    } catch (error) {
      console.error("Unable to load full order details:", error);
    }
  };

  const handlePrintSingleLabel = async (order) => {
    if (!order) return toast.error("Unable to print this label");
    await printShippingLabels([order], "ParcelDrop Shipping Label");
  };

  const handleDownloadSingleLabel = async (order) => {
    if (!order) return toast.error("Unable to download this label");
    await downloadShippingLabels([order]);
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
        source?.warehouse_id || source?.warehouse?.id || order?.warehouse_id || 0,
      );
      if (!warehouseId) throw new Error("Pickup warehouse is missing");
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
          fragile_shipment: Number(source?.fragile_shipment) === 1 ? 1 : 0,
          dangerous_good: Number(source?.dangerous_good) === 1 ? 1 : 0,
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
      toast.success(`Order duplicated successfully. New order #${createResult.order_id} is in Processing.`);
      await fetchAllOrders();
      notifyOrderChange({ type: "created", orderId: createResult.order_id });
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Unable to duplicate order");
    }
  };

  // ====================================================
  // LABEL HTML
  // ====================================================

  const buildLabel = (order) => {
    const service =
      getServiceType(order);

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
              ${service === "AIR"
                ? "By Air"
                : "By Road"}
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

  // ====================================================
  // PRINT LABELS
  // ====================================================

  const handlePrintLabels = async () => {
    if (selectedOrders.length === 0) {
      toast.error("Please select at least one order");
      return;
    }
    await printShippingLabels(selectedOrders, "ParcelDrop Shipping Label");
  };

  // ====================================================
  // EXPORT CSV
  // ====================================================

  const handleExport = () => {
    if (orders.length === 0) {
      toast.error(
        "No orders to export"
      );
      return;
    }

    const exportOrders =
      selectedOrders.length > 0
        ? selectedOrders
        : orders;

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

    const rows = exportOrders.map(
      (order) => [
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
      ]
    );

    const escapeCsv = (value) => {
      const text = String(
        value ?? ""
      );

      if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
      ) {
        return `"${text.replace(
          /"/g,
          '""'
        )}"`;
      }

      return text;
    };

    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) =>
        row.map(escapeCsv).join(",")
      ),
    ].join("\n");

    const blob = new Blob(
      [csv],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `shipdrop-all-orders-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    toast.success(
      `${exportOrders.length} ${
        exportOrders.length === 1
          ? "order"
          : "orders"
      } exported`
    );
  };

  // ====================================================
  // COUNTS
  // ====================================================

  const totalOrders =
  orders.filter(
    (order) =>
      getStatus(order) === "OUT FOR DELIVERY"
  ).length;

    
  const processingCount =
    orders.filter(
      (order) =>
        getStatus(order) ===
        "PROCESSING"
    ).length;

  const manifestedCount =
    orders.filter(
      (order) =>
        getStatus(order) ===
        "MANIFESTED"
    ).length;

  const pendingCount =
    orders.filter(
      (order) =>
        getStatus(order) ===
        "PENDING"
    ).length;

  const deliveredCount =
    orders.filter(
      (order) =>
        getStatus(order) ===
        "DELIVERED"
    ).length;

  const cancelledCount =
    orders.filter((order) => {
      const status =
        getStatus(order);

      return (
        status === "CANCELLED" ||
        status === "CANCELED"
      );
    }).length;

  // ====================================================
  // LOADING
  // ====================================================



  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="min-h-screen bg-[#f6f8fb] dark:bg-[#090b10] px-4 py-5">

      <div className="mx-auto max-w-[1450px]">

        {/* ==================================================
            TOP HEADER
        ================================================== */}

        <div className="mb-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{
                  background:
                    "#edf8ff",
                  color:
                    PRIMARY,
                }}
              >
                <Icon
                  name="box"
                  size={20}
                />
              </div>

              <div>

                <h1 className="text-[17px] font-semibold tracking-[-0.2px] text-slate-900">
                  Out For Delivery
                </h1>

                <p className="mt-0.5 text-[12px] text-slate-400">
                  {`${filteredOrders.length} ${filteredOrders.length === 1 ? "shipment" : "shipments"}`}
                </p>

              </div>

            </div>

            {/* TOP BUTTONS */}

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={
                  handlePrintLabels
                }
                disabled={
                  selectedOrders.length ===
                  0
                }
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#8fcce8] px-3.5 text-[12px] font-medium text-white transition hover:bg-[#7fc2e1] disabled:cursor-not-allowed disabled:opacity-55"
              >
                <Icon
                  name="printer"
                  size={15}
                />

                Print Shipping Label
              </button>

              <button
                type="button"
                onClick={
                  handleExport
                }
                disabled={
                  orders.length === 0
                }
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#10b981] px-3.5 text-[12px] font-medium text-white transition hover:bg-[#059669] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon
                  name="download"
                  size={15}
                />

                Export
              </button>

            </div>

          </div>

        </div>

        {/* ==================================================
            FILTER BAR
        ================================================== */}

        <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">

          <div className="flex flex-wrap items-center gap-2">

            {/* SEARCH */}

            <div className="relative min-w-[280px] flex-1">

              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon
                  name="search"
                  size={15}
                />
              </span>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search customer, AWB, Order ID or mobile..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/5"
              />

            </div>

            {/* STATUS */}

            {false && (
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="h-10 min-w-[135px] rounded-lg border border-slate-200 bg-white px-3 text-[12px] text-slate-600 outline-none focus:border-[#008dd2]"
              >
              <option value="ALL">
                All Status
              </option>

            

              <option value="MANIFESTED">
                Manifested
              </option>

              <option value="PENDING">
                Pending
              </option>

              <option value="IN TRANSIT">
                In Transit
              </option>

              <option value="DELIVERED">
                Delivered
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>
              </select>
            )}

            {/* SERVICE */}

            <select
              value={serviceFilter}
              onChange={(e) =>
                setServiceFilter(
                  e.target.value
                )
              }
              className="h-10 min-w-[135px] rounded-lg border border-slate-200 bg-white px-3 text-[12px] text-slate-600 outline-none focus:border-[#008dd2]"
            >
              <option value="ALL">
                All Services
              </option>

              <option value="ROAD">
                Surface
              </option>

              <option value="AIR">
                Air
              </option>
            </select>

            {/* PAYMENT */}

            <select
              value={paymentFilter}
              onChange={(e) =>
                setPaymentFilter(
                  e.target.value
                )
              }
              className="h-10 min-w-[135px] rounded-lg border border-slate-200 bg-white px-3 text-[12px] text-slate-600 outline-none focus:border-[#008dd2]"
            >
              <option value="ALL">
                All Payment
              </option>

              <option value="PREPAID">
                Prepaid
              </option>

              <option value="COD">
                COD
              </option>
            </select>

            {/* REFRESH */}

            <button
              type="button"
              onClick={
                fetchAllOrders
              }
              title="Refresh"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            >
              <Icon
                name="refresh"
                size={15}
              />
            </button>

          </div>

        </div>

        {/* ORDER STATUS TABS */}
        <OrderStatusNavTabs />

        {/* ==================================================
            TABLE
        ================================================== */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">

          <div className="max-h-[calc(100vh-180px)] overflow-x-auto overflow-y-auto">

            <table className="w-full table-fixed min-w-[950px] border-collapse">

              {/* TABLE HEADER */}

              <thead className="sticky top-0 z-20 bg-white">

                <tr className="border-b border-slate-200 bg-white">

                  <th className="sticky top-0 z-20 w-[5%] bg-white px-2 py-3 text-left">

                    <button
                      type="button"
                      onClick={
                        handleSelectAll
                      }
                      className={`flex h-[17px] w-[17px] items-center justify-center rounded-[4px] border transition ${
                        allVisibleSelected
                          ? "border-[#008dd2] bg-[#008dd2] text-white"
                          : "border-slate-300 bg-white text-transparent"
                      }`}
                    >
                      <Icon
                        name="check"
                        size={11}
                      />
                    </button>

                  </th>

                  <th className="sticky top-0 z-20 w-[17%] bg-white px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                    Customer
                  </th>

                  <th className="sticky top-0 z-20 w-[16%] bg-white px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                    Shipment
                  </th>

                  <th className="sticky top-0 z-20 w-[16%] bg-white px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                    Route
                  </th>

                  <th className="sticky top-0 z-20 w-[13%] bg-white px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                    Payment
                  </th>

                  <th className="sticky top-0 z-20 w-[10%] bg-white px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                    Weight
                  </th>

                  <th className="sticky top-0 z-20 w-[11%] bg-white px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                    Created
                  </th>

                  <th className="sticky top-0 z-20 w-[12%] bg-white px-2 py-3 text-center text-[12px] font-medium text-slate-700">
                    Actions
                  </th>

                </tr>

              </thead>

              {/* TABLE BODY */}

              <tbody>
                {loading ? (
                  <TableRowSkeleton rows={6} cols={8} />
                ) : filteredOrders.length === 0 ? (

                  <tr>

                    <td
                      colSpan="8"
                      className="h-[300px] px-6 text-center"
                    >

                      <div className="flex flex-col items-center justify-center">

                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                          <Icon
                            name="box"
                            size={21}
                          />
                        </div>

                        <div className="text-sm font-medium text-slate-700">
                          {orders.length > 0
                            ? "No matching orders"
                            : "No orders found"}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          {orders.length > 0
                            ? "Try changing your search or filters."
                            : "Orders will appear here after they are created."}
                        </div>

                      </div>

                    </td>

                  </tr>

                ) : (

                  filteredOrders.map(
                    (order) => {

                      const id =
                        getOrderKey(order);

                      const selected =
                        selectedIds.includes(
                          id
                        );

                      const service =
                        getServiceType(order);

                      const payment =
                        getPaymentType(order);

                      const weight =
                        getWeight(order);

                      const status =
                        getStatus(order);

                      const awb =
                        getAWB(order);

                      return (

                        <tr
                          key={id}
                          className={`border-b border-slate-100 transition last:border-b-0 ${
                            selected
                              ? "bg-[#f8fcff]"
                              : "bg-white"
                          } hover:bg-slate-50`}
                        >

                          {/* CHECKBOX */}

                          <td className="px-4 py-3">

                            <button
                              type="button"
                              onClick={() =>
                                handleSelect(
                                  order
                                )
                              }
                              className={`flex h-[17px] w-[17px] items-center justify-center rounded-[4px] border transition ${
                                selected
                                  ? "border-[#008dd2] bg-[#008dd2] text-white"
                                  : "border-slate-300 bg-white text-transparent"
                              }`}
                            >
                              <Icon
                                name="check"
                                size={11}
                              />
                            </button>

                          </td>

                          {/* ==================================
                              CUSTOMER
                          ================================== */}

                          <td className="px-2 py-3">

                            <div className="min-w-0">

                              <p className="truncate text-[13px] font-semibold text-slate-800">
                                {getCustomerName(
                                  order
                                )}
                              </p>

                              {getMobile(
                                order
                              ) && (
                                <p className="mt-0.5 text-[11px] text-slate-400">
                                  {getMobile(
                                    order
                                  )}
                                </p>
                              )}

                              <div className="mt-1.5">

                                <StatusBadge
                                  status={status}
                                />

                              </div>

                            </div>

                          </td>

                          {/* ==================================
                              SHIPMENT
                          ================================== */}

                          <td className="px-2 py-3">

                            <div className="min-w-0">

                             {status !== "PROCESSING" && (
  <>
    <p className="truncate text-[13px] font-semibold text-slate-800">
      {awb}
    </p>

    <p className="mt-0.5 text-[10px] text-slate-400">
      Pickup ID:{" "}
      {order?.pickup_id ||
        order?.pickupId ||
        ""}
    </p>
  </>
)}

                              <p className="mt-0.5 text-[10px] text-slate-400">
                                {getShipmentName(
                                  order
                                )}{" "}
                                -{" "}
                                {service ===
                                "AIR"
                                  ? "Air"
                                  : "Surface"}
                              </p>

                            </div>

                          </td>

                          {/* ==================================
                              ROUTE
                          ================================== */}

                          <td className="px-2 py-3">
                            <div className="flex min-w-0 items-stretch gap-2">
                              <div className="flex w-4 shrink-0 flex-col items-center pt-[2px]">
                                <span className="flex h-[15px] w-4 items-center justify-center text-[#008dd2]">
                                  <Icon name="pin" size={15} strokeWidth={2} />
                                </span>
                                <span className="my-[2px] h-[12px] border-l border-dashed border-slate-300" />
                                <span className="flex h-[15px] w-4 items-center justify-center text-slate-400">
                                  <Icon name="pin" size={15} strokeWidth={2} />
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 space-y-[5px]">
                                <p className="truncate text-[12px] font-medium leading-[17px] text-slate-800" title={`${getPickupCity(order)} (${getPickupPincode(order)})`}>
                                  {getPickupCity(order)} <span className="text-[11px] font-normal text-slate-400">{getPickupPincode(order) ? `(${getPickupPincode(order)})` : ""}</span>
                                </p>
                                <p className="truncate text-[12px] font-medium leading-[17px] text-slate-800" title={`${getDeliveryCity(order)} (${getDeliveryPincode(order)})`}>
                                  {getDeliveryCity(order)} <span className="text-[11px] font-normal text-slate-400">{getDeliveryPincode(order) ? `(${getDeliveryPincode(order)})` : ""}</span>
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* ==================================
                              PAYMENT
                          ================================== */}

                          <td className="px-2 py-3">

                            <div>

                              <p
                                className={`text-[12px] font-semibold ${
                                  payment ===
                                  "COD"
                                    ? "text-amber-600"
                                    : "text-[#008dd2]"
                                }`}
                              >
                                {payment}
                              </p>

                              <p className="mt-0.5 text-[10px] text-slate-400">
                                {payment ===
                                "COD"
                                  ? "Cash on Delivery"
                                  : "Prepaid"}
                              </p>

                              <p className="text-[10px] text-slate-400">
                                Charge: ₹
                                {getAmount(
                                  order
                                ).toFixed(2)}
                              </p>

                            </div>

                          </td>

                          {/* ==================================
                              WEIGHT
                          ================================== */}

                          <td className="px-2 py-3">

                            <div>

                              <p className="text-[12px] font-semibold text-slate-700">
                                Box:{" "}
                                {getPackageCount(
                                  order
                                )}
                              </p>

                              <p className="mt-0.5 text-[10px] text-slate-400">
                                Wt:{" "}
                                {weight.toFixed(
                                  2
                                )}{" "}
                                kg
                              </p>

                              <p className="text-[10px] text-slate-400">
                                Vol:{" "}
                                {getVolumetricWeight(
                                  order
                                ).toFixed(
                                  2
                                )}{" "}
                                kg
                              </p>

                            </div>

                          </td>

                          {/* ==================================
                              CREATED
                          ================================== */}

                          <td className="px-2 py-3">

                            <p className="text-[12px] font-medium text-slate-700">
                              #
                              {getOrderId(
                                order
                              )}
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-400">

                              {status ===
                              "MANIFESTED"
                                ? "Manifested: "
                                : "Created: "}

                              {formatDate(
                                getCreatedAt(
                                  order
                                )
                              )}{" "} {formatTime(
                                getCreatedAt(
                                  order
                                )
                              )}

                            </p>

                           

                          </td>

                          {/* ==================================
                              ACTIONS
                          ================================== */}

                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                              <button type="button" onClick={() => handlePrintSingleLabel(order)} title="Print Shipping Label" aria-label="Print Shipping Label" className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[7px] border border-[#008dd2] bg-[#008dd2] text-white transition hover:bg-[#007dbb] hover:border-[#007dbb] focus:outline-none focus:ring-2 focus:ring-sky-100">
                                <Icon name="printer" size={15} strokeWidth={1.9} />
                              </button>
                              <button type="button" onClick={() => handleDuplicate(order)} title="Duplicate Order" aria-label="Duplicate Order" className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[7px] border border-[#008dd2] bg-[#008dd2] text-white transition hover:bg-[#007dbb] hover:border-[#007dbb] focus:outline-none focus:ring-2 focus:ring-blue-100">
                                <Icon name="copy" size={15} strokeWidth={1.9} />
                              </button>
                              <button type="button" onClick={() => handleView(order)} title="Order Details" aria-label="Order Details" className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[7px] border border-slate-200 bg-white text-slate-600 transition hover:border-[#008dd2] hover:bg-[#edf8ff] hover:text-[#008dd2] focus:outline-none focus:ring-2 focus:ring-sky-100">
                                <Icon name="eye" size={15} strokeWidth={1.9} />
                              </button>
                            </div>
                          </td>

                        </tr>

                      );
                    }
                  )

                )}

              </tbody>

            </table>

          </div>

          {/* ==================================================
              FOOTER
          ================================================== */}

          {orders.length > 0 && (

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-[#fafbfc] px-5 py-3">

              <p className="text-[11px] text-slate-400">

                Showing{" "}

                <span className="font-semibold text-slate-600">
                  {filteredOrders.length}
                </span>{" "}

                of{" "}

                <span className="font-semibold text-slate-600">
                  {totalOrders}
                </span>{" "}

                orders

              </p>

              <p className="text-[11px] text-slate-400">

                {selectedIds.length > 0
                  ? `${selectedIds.length} selected`
                  : "Select orders to perform actions"}

              </p>

            </div>

          )}

        </div>

      </div>

      <OrderDetailsModal
        order={viewingOrder}
        loading={false}
        onClose={() => setViewingOrder(null)}
        onTrack={(orderOrAwb) => {
          const awb = typeof orderOrAwb === "string"
            ? orderOrAwb
            : getAWB(orderOrAwb || viewingOrder);
          if (awb && awb !== "—") {
            window.dispatchEvent(new CustomEvent("shipdrop:openTracking", { detail: String(awb) }));
          }
        }}
        onDownload={handleDownloadSingleLabel}
        onPrint={handlePrintSingleLabel}
      />

    </div>
  );
}

export default OutForDelivery;